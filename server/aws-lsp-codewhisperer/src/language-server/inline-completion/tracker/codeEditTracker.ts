/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import {
    TextDocumentItem,
    InitializeParams,
    Logging,
    Disposable,
    TextDocument,
} from '@aws/language-server-runtimes/server-interface'
import { CodeWhispererSupplementalContext } from '../../../shared/models/model'
import { generateDiffContexts } from '../diffUtils'

/**
 * Configuration for the RecentEditTracker
 */
export interface RecentEditTrackerConfig {
    /** Maximum number of files to track */
    readonly maxFiles: number
    /** Maximum storage size in KB */
    readonly maxStorageSizeKb: number
    /** Debounce interval in milliseconds */
    readonly debounceIntervalMs: number
    /** Maximum age of snapshots in milliseconds */
    readonly maxAgeMs: number
    /** Maximum number of supplemental contexts */
    readonly maxSupplementalContext: number
}

/**
 * Default configuration values for RecentEditTracker
 */
export const RecentEditTrackerDefaultConfig: Readonly<RecentEditTrackerConfig> = {
    maxFiles: 25,
    maxStorageSizeKb: 10000,
    debounceIntervalMs: 2000,
    maxAgeMs: 30000,
    maxSupplementalContext: 15,
}

/**
 * Represents a snapshot of a document at a specific point in time
 */
export interface DocumentSnapshot {
    /** URI of the document */
    readonly filePath: string
    /** Size of the snapshot content in bytes */
    readonly size: number
    /** Timestamp when the snapshot was taken */
    readonly timestamp: number
    /** Content of the document at the time of snapshot */
    readonly content: string
}

/**
 * Represents a snapshot content of a file at a specific point in time
 */
export interface FileSnapshotContent {
    /** URI of the file */
    readonly filePath: string
    /** Content of the file */
    readonly content: string
    /** Timestamp when the snapshot was taken */
    readonly timestamp: number
}

/**
 * RecentEditTracker captures and manages snapshots of document edits to provide
 * context for code suggestions. It tracks active documents, maintains shadow copies,
 * and generates supplemental context based on recent edits.
 */
export class RecentEditTracker implements Disposable {
    private readonly snapshots: Map<string, DocumentSnapshot[]> = new Map()
    private readonly shadowCopies: Map<string, string> = new Map()
    private readonly disposables: Disposable[] = []
    private readonly activeDocuments: Set<string> = new Set()
    private storageSize: number = 0
    private stateLogIntervalId?: NodeJS.Timeout
    private static _instance?: RecentEditTracker

    /**
     * Creates a new instance of RecentEditTracker
     *
     * @param log - Logging interface
     * @param config - Optional configuration overrides
     */
    constructor(
        private readonly log: Logging,
        readonly config: Readonly<RecentEditTrackerConfig> = RecentEditTrackerDefaultConfig
    ) {
        this.log.debug(
            `[EDIT_TRACKER] Initializing RecentEditTracker with config: maxFiles=${config.maxFiles}, maxStorageSizeKb=${config.maxStorageSizeKb}KB, debounceIntervalMs=${config.debounceIntervalMs}ms`
        )

        // Start periodic state logging if environment variable is set
        this.startPeriodicStateLogging()
    }

    /**
     * Gets the singleton instance of RecentEditTracker
     *
     * @param log - Logging interface
     * @param config - Optional configuration overrides
     * @returns The singleton instance of RecentEditTracker
     */
    public static getInstance(log: Logging, config?: Readonly<RecentEditTrackerConfig>): RecentEditTracker {
        if (!RecentEditTracker._instance) {
            RecentEditTracker._instance = new RecentEditTracker(log, config)
        }
        return RecentEditTracker._instance
    }

    /**
     * Starts periodic logging of the tracker state
     * This is controlled by the LOG_EDIT_TRACKING environment variable
     */
    private startPeriodicStateLogging(): void {
        // Clear any existing interval
        if (this.stateLogIntervalId) {
            clearInterval(this.stateLogIntervalId)
        }

        // Only start if LOG_EDIT_TRACKING environment variable is set to 'true'
        if (process.env.LOG_EDIT_TRACKING === 'true') {
            this.log.debug(`[EDIT_TRACKER] Starting periodic state logging (every 10s)`)

            this.stateLogIntervalId = setInterval(() => {
                const trackedFiles = this.getTrackedFiles()
                const snapshotCount = this.getTotalSnapshotCount()
                const storageSizeKB = Math.round(this.storageSize / 1024)
                const activeDocCount = this.activeDocuments.size
                const shadowCopyCount = this.shadowCopies.size

                this.log.debug(
                    `[EDIT_TRACKER] PERIODIC STATE: ${trackedFiles.length} files tracked, ${snapshotCount} snapshots, ${storageSizeKB}KB used`
                )
                this.log.debug(
                    `[EDIT_TRACKER] PERIODIC STATE: ${activeDocCount} active documents, ${shadowCopyCount} shadow copies`
                )

                // Log details of each tracked file if there aren't too many
                if (trackedFiles.length <= 5) {
                    trackedFiles.forEach(file => {
                        const fileSnapshots = this.snapshots.get(file)?.length || 0
                        this.log.debug(`[EDIT_TRACKER] PERIODIC STATE: File ${file} has ${fileSnapshots} snapshots`)
                    })
                }
            }, 10000) // Log every 10 seconds
        }
    }

    /**
     * Processes an edit to a document and takes a snapshot if needed
     *
     * @param document - The document being edited
     * @param previousContent - The content of the document before the edit
     */
    public async processEdit(document: TextDocumentItem, previousContent: string): Promise<void> {
        const filePath = document.uri

        if (!document.uri.startsWith('file')) {
            this.log.debug(`[EDIT_TRACKER] Skipping non-file URI: ${document.uri}`)
            return
        }

        // Get existing snapshots for this file
        const fileSnapshots = this.snapshots.get(filePath) || []
        const timestamp = Date.now()

        // Anti-throttling, only add snapshot after the debounce is cleared
        const shouldAddSnapshot =
            fileSnapshots.length === 0 ||
            timestamp - fileSnapshots[fileSnapshots.length - 1].timestamp > this.config.debounceIntervalMs

        if (!shouldAddSnapshot) {
            this.log.debug(
                `[EDIT_TRACKER] Skipping snapshot for ${filePath} due to debounce (last snapshot was ${timestamp - fileSnapshots[fileSnapshots.length - 1].timestamp}ms ago)`
            )
            return
        }

        try {
            const content = previousContent
            const size = Buffer.byteLength(content, 'utf8')
            const snapshot: DocumentSnapshot = {
                filePath,
                size,
                timestamp,
                content,
            }

            fileSnapshots.push(snapshot)
            this.snapshots.set(filePath, fileSnapshots)
            this.storageSize += size
            this.log.debug(
                `[EDIT_TRACKER] Snapshot taken for file: ${filePath}, total snapshots: ${this.getTotalSnapshotCount()}, total size: ${Math.round(this.storageSize / 1024)} KB`
            )

            await this.enforceMemoryLimits()
            this.enforceTimeLimits(snapshot)
        } catch (err) {
            this.log.error(`[EDIT_TRACKER] Failed to save snapshot: ${err}`)
        }
    }

    /**
     * Sets up a timeout to delete the given snapshot after it exceeds the max age
     *
     * @param snapshot - The snapshot to monitor for age limits
     */
    private enforceTimeLimits(snapshot: DocumentSnapshot): void {
        const fileSnapshots = this.snapshots.get(snapshot.filePath)
        if (fileSnapshots === undefined) {
            return
        }

        setTimeout(() => {
            // find the snapshot and remove it
            const index = fileSnapshots.indexOf(snapshot)
            if (index !== -1) {
                fileSnapshots.splice(index, 1)
                this.storageSize -= snapshot.size
                if (fileSnapshots.length === 0) {
                    this.snapshots.delete(snapshot.filePath)
                }
                this.log.debug(
                    `Snapshot deleted (aged out) for file: ${snapshot.filePath},
                    remaining snapshots: ${this.getTotalSnapshotCount()},
                    new size: ${Math.round(this.storageSize / 1024)} KB`
                )
            }
        }, this.config.maxAgeMs)
    }

    /**
     * Enforces memory limits by removing old snapshots if necessary
     */
    private async enforceMemoryLimits(): Promise<void> {
        while (this.storageSize > this.config.maxStorageSizeKb * 1024) {
            const oldestFile = this.findOldestFile()
            if (!oldestFile) {
                break
            }

            const fileSnapshots = this.snapshots.get(oldestFile)
            if (!fileSnapshots || fileSnapshots.length === 0) {
                this.snapshots.delete(oldestFile)
                continue
            }

            const removedSnapshot = fileSnapshots.shift()
            if (removedSnapshot) {
                this.storageSize -= removedSnapshot.size
                this.log.debug(
                    `Snapshot deleted (memory limit) for file: ${removedSnapshot.filePath},
                    remaining snapshots: ${this.getTotalSnapshotCount()},
                    new size: ${Math.round(this.storageSize / 1024)} KB`
                )
            }

            if (fileSnapshots.length === 0) {
                this.snapshots.delete(oldestFile)
            }
        }
    }

    /**
     * Finds the file with the oldest snapshot
     *
     * @returns The file path of the oldest snapshot or undefined if no snapshots exist
     */
    private findOldestFile(): string | undefined {
        let oldestTime = Number.MAX_SAFE_INTEGER
        let oldestFile: string | undefined

        for (const [filePath, snapshots] of this.snapshots.entries()) {
            if (snapshots.length === 0) {
                continue
            }

            const oldestSnapshot = snapshots[0]
            if (oldestSnapshot.timestamp < oldestTime) {
                oldestTime = oldestSnapshot.timestamp
                oldestFile = filePath
            }
        }

        return oldestFile
    }

    /**
     * Gets all snapshots for a specific file
     *
     * @param filePath - The path to the file
     * @returns Array of snapshots for the file
     */
    public getFileSnapshots(filePath: string): DocumentSnapshot[] {
        return this.snapshots.get(filePath) || []
    }

    /**
     * Gets all tracked files
     *
     * @returns Array of file paths
     */
    public getTrackedFiles(): string[] {
        return Array.from(this.snapshots.keys())
    }

    /**
     * Gets the total number of snapshots across all files
     *
     * @returns Total number of snapshots
     */
    public getTotalSnapshotCount(): number {
        return Array.from(this.snapshots.values()).reduce((count, snapshots) => count + snapshots.length, 0)
    }

    /**
     * Gets the content of a snapshot
     *
     * @param snapshot - The snapshot to get content for
     * @returns The content of the snapshot
     */
    public async getSnapshotContent(snapshot: DocumentSnapshot): Promise<string> {
        return snapshot.content
    }

    /**
     * Generates supplemental context based on recent edits
     *
     * @param activeDocument Optional active document to generate context for
     * @returns Promise resolving to supplemental context for code predictions
     */
    public async generateEditBasedContext(activeDocument?: TextDocument): Promise<CodeWhispererSupplementalContext> {
        if (!activeDocument) {
            const doc = await this.getActiveDocument()
            if (!doc) {
                this.log.debug(`[EDIT_TRACKER] No active document found for generating context`)
                return {
                    isUtg: false,
                    isProcessTimeout: false,
                    supplementalContextItems: [],
                    contentsLength: 0,
                    latency: 0,
                    strategy: 'recentEdits',
                }
            }
            return this.generatePredictionSupplementalContext(doc)
        }
        return this.generatePredictionSupplementalContext(activeDocument)
    }

    /**
     * Generates unified diffs between adjacent snapshots of a file
     * and between the newest snapshot and the current file content
     *
     * @returns CodeWhispererSupplementalContext containing diffs between snapshots and current content
     */
    private async generatePredictionSupplementalContext(
        activeDocument: TextDocument | TextDocumentItem
    ): Promise<CodeWhispererSupplementalContext> {
        this.log.debug(`[EDIT_TRACKER] Generating prediction supplemental context for ${activeDocument.uri}`)

        const filePath = activeDocument.uri
        // Handle both TextDocument and TextDocumentItem
        const currentContent = 'getText' in activeDocument ? activeDocument.getText() : activeDocument.text
        const snapshots = this.getFileSnapshots(filePath)

        if (snapshots.length === 0) {
            this.log.debug(`[EDIT_TRACKER] No snapshots found for ${filePath}`)
            return {
                isUtg: false,
                isProcessTimeout: false,
                supplementalContextItems: [],
                contentsLength: 0,
                latency: 0,
                strategy: 'recentEdits',
            }
        }

        this.log.debug(`[EDIT_TRACKER] Found ${snapshots.length} snapshots for ${filePath}`)

        // Create array from snapshots with the format expected by CodeWhisperer
        const snapshotContents: FileSnapshotContent[] = snapshots.map(snapshot => ({
            filePath: snapshot.filePath,
            content: snapshot.content,
            timestamp: snapshot.timestamp,
        }))

        const startTime = Date.now()

        // Use the diffGenerator module to generate supplemental contexts
        const contextItems = generateDiffContexts(
            filePath,
            currentContent,
            snapshotContents,
            this.config.maxSupplementalContext
        )

        const latency = Date.now() - startTime
        const contentsLength = contextItems.supplementalContextItems.reduce((sum, item) => sum + item.content.length, 0)

        this.log.debug(
            `[EDIT_TRACKER] Generated ${contextItems.supplementalContextItems.length} supplemental contexts ` +
                `from recent edits with total size ${contentsLength} bytes in ${latency}ms`
        )

        return {
            isUtg: false,
            isProcessTimeout: false,
            supplementalContextItems: contextItems.supplementalContextItems,
            contentsLength,
            latency,
            strategy: 'recentEdits',
        }
    }

    /**
     * Gets the currently active document
     *
     * @returns The active document or undefined if none is active
     */
    private async getActiveDocument(): Promise<TextDocumentItem | undefined> {
        // This is a placeholder implementation that will be replaced when integrated with the server
        // The actual implementation will get the active document from the workspace
        return undefined
    }

    /**
     * Handles a document being opened
     *
     * @param document - The document that was opened
     */
    public handleDocumentOpen(document: TextDocumentItem): void {
        if (document.uri.startsWith('file')) {
            this.log.debug(
                `[EDIT_TRACKER] Document opened: ${document.uri}, language: ${document.languageId}, version: ${document.version}`
            )
            this.log.debug(`[EDIT_TRACKER] Content size: ${document.text.length} chars`)

            this.trackActiveDocument(document)

            // Log state after tracking
            const trackedFiles = this.getTrackedFiles()
            const activeDocCount = this.activeDocuments.size
            this.log.debug(
                `[EDIT_TRACKER] State after open: ${trackedFiles.length} files tracked, ${activeDocCount} active documents`
            )
        }
    }

    /**
     * Handles a document being closed
     *
     * @param uri - The URI of the document that was closed
     */
    public handleDocumentClose(uri: string): void {
        this.log.debug(`[EDIT_TRACKER] Document closing: ${uri}`)

        // Log state before untracking
        const wasActive = this.activeDocuments.has(uri)
        const hadShadowCopy = this.shadowCopies.has(uri)
        const snapshots = this.snapshots.get(uri)?.length || 0

        this.log.debug(
            `[EDIT_TRACKER] Document state before close: active=${wasActive}, hasShadowCopy=${hadShadowCopy}, snapshots=${snapshots}`
        )

        this.untrackDocument(uri)

        // Log state after untracking
        const activeDocCount = this.activeDocuments.size
        this.log.debug(`[EDIT_TRACKER] State after close: ${activeDocCount} active documents remaining`)
    }

    /**
     * Handles changes to a document
     *
     * @param updatedDocument - The document that was changed
     */
    public async handleDocumentChange(updatedDocument: TextDocumentItem): Promise<void> {
        this.log.debug(
            `[EDIT_TRACKER] Document change detected: ${updatedDocument.uri}, version: ${updatedDocument.version}`
        )

        const previousContent = this.getShadowCopy(updatedDocument.uri)

        if (previousContent) {
            this.log.debug(`[EDIT_TRACKER] Previous content found, length: ${previousContent.length} chars`)
            this.log.debug(`[EDIT_TRACKER] Current content length: ${updatedDocument.text.length} chars`)

            // Calculate diff size
            const diffSize = Math.abs(updatedDocument.text.length - previousContent.length)
            this.log.debug(`[EDIT_TRACKER] Change size: ${diffSize} chars`)

            await this.processEdit(updatedDocument, previousContent)
        } else {
            this.log.debug(`[EDIT_TRACKER] No previous content found for ${updatedDocument.uri}`)
        }

        this.updateShadowCopy(updatedDocument)

        // Log tracker state after update
        const trackedFiles = this.getTrackedFiles()
        const snapshotCount = this.getTotalSnapshotCount()
        const storageSizeKB = Math.round(this.storageSize / 1024)

        this.log.debug(
            `[EDIT_TRACKER] State after change: ${trackedFiles.length} files tracked, ${snapshotCount} snapshots, ${storageSizeKB}KB used`
        )
        this.log.debug(`[EDIT_TRACKER] Active documents: ${Array.from(this.activeDocuments).length}`)
    }

    /**
     * Updates the shadow copy of a document
     *
     * @param document - The document to update the shadow copy for
     */
    private updateShadowCopy(document: TextDocumentItem): void {
        if (document.uri.startsWith('file')) {
            this.shadowCopies.set(document.uri, document.text)
            this.log.debug(`Shadow copy updated for file: ${document.uri}`)
        }
    }

    /**
     * Gets the shadow copy of a document
     *
     * @param uri - The URI of the document
     * @returns The shadow copy content or undefined if not found
     */
    private getShadowCopy(uri: string): string | undefined {
        return this.shadowCopies.get(uri)
    }

    /**
     * Tracks a document as active/visible
     *
     * @param document - The document to track
     */
    private trackActiveDocument(document: TextDocumentItem): void {
        if (document.uri.startsWith('file')) {
            this.activeDocuments.add(document.uri)
            this.updateShadowCopy(document)
            this.log.debug(`Document tracked as active: ${document.uri}`)
        }
    }

    /**
     * Untracks a document (no longer active/visible)
     *
     * @param uri - The URI of the document to untrack
     */
    private untrackDocument(uri: string): void {
        if (this.activeDocuments.has(uri)) {
            this.activeDocuments.delete(uri)
            this.log.debug(`Document untracked: ${uri}`)
        }
    }

    public hasRecentEditInLine(
        documentUri: string,
        lineNum: number,
        timeThresholdMs: number = 20000,
        lineRange: number = 5
    ): boolean {
        // Check if we have snapshots for this document
        const snapshots = this.snapshots.get(documentUri)
        if (!snapshots || snapshots.length === 0) {
            return false
        }

        // Get recent snapshots within time threshold
        const now = Date.now()
        const cutoffTime = now - timeThresholdMs
        const recentSnapshots = snapshots.filter(snapshot => snapshot.timestamp >= cutoffTime)
        if (recentSnapshots.length === 0) {
            return false
        }

        // Get oldest recent snapshot and current content
        const oldestRecentSnapshot = recentSnapshots.sort((a, b) => a.timestamp - b.timestamp)[0]
        const currentContent = this.getShadowCopy(documentUri)
        if (!currentContent) {
            return false
        }

        // Split content into lines
        const currentLines = currentContent.split(/\r?\n/)
        const snapshotLines = oldestRecentSnapshot.content.split(/\r?\n/)

        const startLine = Math.max(0, lineNum - lineRange)
        const endLine = Math.min(Math.max(currentLines.length, snapshotLines.length), lineNum + lineRange + 1)

        // Checks each line in the range around the target line (startLine to endLine)
        // Returns true if any line in the range has changed between snapshot and current content
        return Array.from({ length: endLine - startLine }, (_, i) => i + startLine).some(i => {
            const inSnapshot = i < snapshotLines.length
            const inCurrent = i < currentLines.length
            const hasChange =
                (inSnapshot && inCurrent && currentLines[i] !== snapshotLines[i]) || inSnapshot !== inCurrent
            return hasChange
        })
    }

    /**
     * Disposes of resources
     */
    public dispose(): void {
        this.log.debug(`[EDIT_TRACKER] Disposing RecentEditTracker...`)
        this.log.debug(
            `[EDIT_TRACKER] Final state: ${this.getTrackedFiles().length} files, ${this.getTotalSnapshotCount()} snapshots, ${Math.round(this.storageSize / 1024)}KB used`
        )

        // Stop the periodic logging
        if (this.stateLogIntervalId) {
            this.log.debug(`[EDIT_TRACKER] Stopping periodic state logging`)
            clearInterval(this.stateLogIntervalId)
            this.stateLogIntervalId = undefined
        }

        // Clear all collections
        this.snapshots.clear()
        this.shadowCopies.clear()
        this.activeDocuments.clear()
        this.storageSize = 0

        // Dispose of any disposables
        for (const disposable of this.disposables) {
            disposable.dispose()
        }

        this.log.debug('[EDIT_TRACKER] RecentEditTracker disposed')
    }
}
