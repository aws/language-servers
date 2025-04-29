/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { TextDocumentItem, InitializeParams, Logging, Disposable } from '@aws/language-server-runtimes/server-interface'
import { CodeWhispererSupplementalContext, CodeWhispererSupplementalContextItem } from '../../shared/models/model'
import * as diff from 'diff'

// Constants for supplemental context limits
const supplementalContextMaxTotalLength: number = 8192
const charactersLimit: number = 10000

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
 * Generates a unified diff format between old and new file contents
 *
 * @param oldFilePath - Path to the old version of the file
 * @param newFilePath - Path to the new version of the file
 * @param oldContent - Content of the old version
 * @param newContent - Content of the new version
 * @param oldTimestamp - Timestamp of the old version
 * @param newTimestamp - Timestamp of the new version
 * @param contextSize - Number of context lines to include in the diff
 * @returns Unified diff string
 */
function generateUnifiedDiffWithTimestamps(
    oldFilePath: string,
    newFilePath: string,
    oldContent: string,
    newContent: string,
    oldTimestamp: number,
    newTimestamp: number,
    contextSize: number = 3
): string {
    const patchResult = diff.createTwoFilesPatch(
        oldFilePath,
        newFilePath,
        oldContent,
        newContent,
        String(oldTimestamp),
        String(newTimestamp),
        { context: contextSize }
    )

    // Remove unused headers
    const lines = patchResult.split('\n')
    if (lines.length >= 2 && lines[0].startsWith('Index:')) {
        lines.splice(0, 2)
        return lines.join('\n')
    }

    return patchResult
}

/**
 * Generates supplemental contexts from snapshot contents and current content
 *
 * @param filePath - Path to the file
 * @param currentContent - Current content of the file
 * @param snapshotContents - List of snapshot contents sorted by timestamp (oldest first)
 * @param maxContexts - Maximum number of supplemental contexts to return
 * @returns CodeWhispererSupplementalContext object containing diffs between snapshots and current content
 */
export function generateDiffContexts(
    filePath: string,
    currentContent: string,
    snapshotContents: FileSnapshotContent[],
    maxContexts: number
): CodeWhispererSupplementalContext {
    if (snapshotContents.length === 0) {
        return {
            isUtg: false,
            isProcessTimeout: false,
            supplementalContextItems: [],
            contentsLength: 0,
            latency: 0,
            strategy: 'recentEdits',
        }
    }

    const startTime = Date.now()
    const supplementalContextItems: CodeWhispererSupplementalContextItem[] = []
    const currentTimestamp = Date.now()

    // Process snapshots from newest to oldest
    for (let i = snapshotContents.length - 1; i >= 0; i--) {
        const snapshot = snapshotContents[i]
        try {
            const unifiedDiff = generateUnifiedDiffWithTimestamps(
                snapshot.filePath,
                filePath,
                snapshot.content,
                currentContent,
                snapshot.timestamp,
                currentTimestamp
            )

            // Only add non-empty diffs
            if (unifiedDiff.trim().length > 0) {
                supplementalContextItems.push({
                    filePath: snapshot.filePath,
                    content: unifiedDiff,
                    score: 1.0, // Default score for recent edits
                })
            }
        } catch (err) {
            console.error(`Failed to generate diff: ${err}`)
        }
    }

    const trimmedContextItems = trimSupplementalContexts(supplementalContextItems, maxContexts)
    const contentsLength = trimmedContextItems.reduce((sum, ctx) => sum + ctx.content.length, 0)
    const latency = Date.now() - startTime

    return {
        isUtg: false,
        isProcessTimeout: false,
        supplementalContextItems: trimmedContextItems,
        contentsLength,
        latency,
        strategy: 'recentEdits',
    }
}

/**
 * Trims the supplementalContexts array to ensure it doesn't exceed the max number
 * of contexts or total character length limit
 *
 * @param supplementalContextItems - Array of CodeWhispererSupplementalContextItem objects (already sorted with newest first)
 * @param maxContexts - Maximum number of supplemental contexts allowed
 * @returns Trimmed array of CodeWhispererSupplementalContextItem objects
 */
function trimSupplementalContexts(
    supplementalContextItems: CodeWhispererSupplementalContextItem[],
    maxContexts: number
): CodeWhispererSupplementalContextItem[] {
    if (supplementalContextItems.length === 0) {
        return supplementalContextItems
    }

    // First filter out any individual context that exceeds the character limit
    let result = supplementalContextItems.filter(context => {
        return context.content.length <= charactersLimit
    })

    // Then limit by max number of contexts
    if (result.length > maxContexts) {
        result = result.slice(0, maxContexts)
    }

    // Lastly enforce total character limit
    let totalLength = 0
    let i = 0

    while (i < result.length) {
        totalLength += result[i].content.length
        if (totalLength > supplementalContextMaxTotalLength) {
            break
        }
        i++
    }

    if (i === result.length) {
        return result
    }

    const trimmedContexts = result.slice(0, i)
    return trimmedContexts
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

    /**
     * Creates a new instance of RecentEditTracker
     *
     * @param extensionContext - The initialization parameters
     * @param log - Logging interface
     * @param config - Optional configuration overrides
     */
    constructor(
        private readonly extensionContext: InitializeParams,
        private readonly log: Logging,
        readonly config: Readonly<RecentEditTrackerConfig> = RecentEditTrackerDefaultConfig
    ) {}

    /**
     * Processes an edit to a document and takes a snapshot if needed
     *
     * @param document - The document being edited
     * @param previousContent - The content of the document before the edit
     */
    public async processEdit(document: TextDocumentItem, previousContent: string): Promise<void> {
        const filePath = document.uri

        if (!document.uri.startsWith('file')) {
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
                `Snapshot taken for file: ${filePath}, total snapshots: ${this.getTotalSnapshotCount()},
                total size: ${Math.round(this.storageSize / 1024)} KB`
            )

            await this.enforceMemoryLimits()
            this.enforceTimeLimits(snapshot)
        } catch (err) {
            this.log.error(`Failed to save snapshot: ${err}`)
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
     * @returns Promise resolving to supplemental context for code predictions
     */
    public async generateEditBasedContext(): Promise<CodeWhispererSupplementalContext> {
        return this.generatePredictionSupplementalContext()
    }

    /**
     * Generates unified diffs between adjacent snapshots of a file
     * and between the newest snapshot and the current file content
     *
     * @returns CodeWhispererSupplementalContext containing diffs between snapshots and current content
     */
    private async generatePredictionSupplementalContext(): Promise<CodeWhispererSupplementalContext> {
        const activeDocument = await this.getActiveDocument()
        if (!activeDocument) {
            return {
                isUtg: false,
                isProcessTimeout: false,
                supplementalContextItems: [],
                contentsLength: 0,
                latency: 0,
                strategy: 'recentEdits',
            }
        }

        const filePath = activeDocument.uri
        const currentContent = activeDocument.text
        const snapshots = this.getFileSnapshots(filePath)

        if (snapshots.length === 0) {
            return {
                isUtg: false,
                isProcessTimeout: false,
                supplementalContextItems: [],
                contentsLength: 0,
                latency: 0,
                strategy: 'recentEdits',
            }
        }

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
            `Generated ${contextItems.supplementalContextItems.length} supplemental contexts
            from recent edits with total size ${contentsLength} bytes in ${latency}ms`
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
            this.trackActiveDocument(document)
            this.log.debug(`Document opened: ${document.uri}`)
        }
    }

    /**
     * Handles a document being closed
     *
     * @param uri - The URI of the document that was closed
     */
    public handleDocumentClose(uri: string): void {
        this.untrackDocument(uri)
        this.log.debug(`Document closed: ${uri}`)
    }

    /**
     * Handles changes to a document
     *
     * @param updatedDocument - The document that was changed
     */
    public async handleDocumentChange(updatedDocument: TextDocumentItem): Promise<void> {
        const previousContent = this.getShadowCopy(updatedDocument.uri)

        if (previousContent) {
            await this.processEdit(updatedDocument, previousContent)
        }

        this.updateShadowCopy(updatedDocument)
        this.log.debug(`Document changed: ${updatedDocument.uri}`)
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

    /**
     * Disposes of resources
     */
    public dispose(): void {
        // Clear all collections
        this.snapshots.clear()
        this.shadowCopies.clear()
        this.activeDocuments.clear()
        this.storageSize = 0

        // Dispose of any disposables
        for (const disposable of this.disposables) {
            disposable.dispose()
        }

        this.log.debug('RecentEditTracker disposed')
    }
}
