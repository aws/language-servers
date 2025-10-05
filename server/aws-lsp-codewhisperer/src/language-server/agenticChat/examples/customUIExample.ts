/**
 * Example implementation of CustomFileModificationUI
 * This shows how to integrate your own UI component with the AgenticChatController
 */

import { CustomFileModificationUI, FileModificationData } from '../customFileModificationUI'

// Example: Custom UI that sends data to an external service or UI component
export class ExampleCustomFileModificationUI implements CustomFileModificationUI {
    private fileModifications = new Map<string, FileModificationData>()
    private undoHistory = new Map<string, string[]>()

    async onFileModified(tabId: string, data: FileModificationData): Promise<void> {
        // Store the modification data
        this.fileModifications.set(data.toolUseId, data)

        // Example: Send to your custom UI component
        await this.sendToCustomUI('file-modified', {
            tabId,
            toolUseId: data.toolUseId,
            fileName: data.fileName,
            filePath: data.filePath,
            changes: data.changes,
            status: data.status,
            undoAvailable: data.undoAvailable,
            timestamp: data.timestamp,
            // Include diff information if needed
            hasChanges: data.changes.added > 0 || data.changes.deleted > 0,
            changesSummary: `+${data.changes.added} -${data.changes.deleted}`,
        })

        // Example: Update your UI state
        console.log(
            `[CustomUI] File ${data.fileName} modified with ${data.changes.added} additions and ${data.changes.deleted} deletions`
        )
    }

    async onFileUndone(tabId: string, toolUseId: string): Promise<void> {
        // Get the original modification data
        const originalData = this.fileModifications.get(toolUseId)

        if (originalData) {
            // Update the status
            originalData.status = 'undone'
            originalData.undoAvailable = false

            // Track undo history
            const tabUndos = this.undoHistory.get(tabId) || []
            tabUndos.push(toolUseId)
            this.undoHistory.set(tabId, tabUndos)
        }

        // Example: Send to your custom UI component
        await this.sendToCustomUI('file-undone', {
            tabId,
            toolUseId,
            fileName: originalData?.fileName,
            filePath: originalData?.filePath,
            timestamp: Date.now(),
        })

        console.log(`[CustomUI] File modification ${toolUseId} undone`)
    }

    async onAllFilesUndone(tabId: string, relatedToolUses: Set<string>): Promise<void> {
        const undoneFiles: string[] = []

        // Update status for all related tool uses
        for (const toolUseId of relatedToolUses) {
            const data = this.fileModifications.get(toolUseId)
            if (data) {
                data.status = 'undone'
                data.undoAvailable = false
                undoneFiles.push(data.fileName)
            }
        }

        // Example: Send to your custom UI component
        await this.sendToCustomUI('all-files-undone', {
            tabId,
            relatedToolUses: Array.from(relatedToolUses),
            undoneFiles,
            count: relatedToolUses.size,
            timestamp: Date.now(),
        })

        console.log(`[CustomUI] All ${relatedToolUses.size} file modifications undone in tab ${tabId}`)
    }

    async onFileError(tabId: string, toolUseId: string, error: string): Promise<void> {
        // Get the original modification data
        const originalData = this.fileModifications.get(toolUseId)

        if (originalData) {
            originalData.status = 'error'
            originalData.undoAvailable = false
        }

        // Example: Send to your custom UI component
        await this.sendToCustomUI('file-error', {
            tabId,
            toolUseId,
            fileName: originalData?.fileName,
            filePath: originalData?.filePath,
            error,
            timestamp: Date.now(),
        })

        console.error(`[CustomUI] File modification error for ${toolUseId}: ${error}`)
    }

    // Example method to send data to your custom UI component
    private async sendToCustomUI(eventType: string, data: any): Promise<void> {
        // Replace this with your actual UI integration
        // Examples:
        // - Send to a WebSocket connection
        // - Update a React/Vue/Angular component state
        // - Send to an IPC channel
        // - Update a database
        // - Send to an external API

        try {
            // Example: WebSocket
            // this.websocket?.send(JSON.stringify({ type: eventType, data }))

            // Example: IPC (if in Electron)
            // ipcRenderer.send('file-modification-event', { type: eventType, data })

            // Example: Custom event system
            // this.eventEmitter.emit(eventType, data)

            // Example: HTTP API
            // await fetch('/api/file-modifications', {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify({ type: eventType, data })
            // })

            // For now, just log to console
            console.log(`[CustomUI Event] ${eventType}:`, data)
        } catch (error) {
            console.error(`[CustomUI] Failed to send ${eventType} event:`, error)
        }
    }

    // Additional utility methods you might want to implement

    getFileModification(toolUseId: string): FileModificationData | undefined {
        return this.fileModifications.get(toolUseId)
    }

    getTabModifications(tabId: string): FileModificationData[] {
        return Array.from(this.fileModifications.values()).filter(data => data.status === 'modified') // Only active modifications
    }

    getUndoHistory(tabId: string): string[] {
        return this.undoHistory.get(tabId) || []
    }

    clearTabData(tabId: string): void {
        // Clean up data when tab is closed
        this.undoHistory.delete(tabId)
        // Note: fileModifications are kept by toolUseId, not tabId
        // You might want to track tabId -> toolUseId mapping if needed
    }
}

// Factory function for your custom implementation
export function createExampleCustomFileModificationUI(): CustomFileModificationUI {
    return new ExampleCustomFileModificationUI()
}

// Example: Integration with a hypothetical React component
export class ReactIntegratedFileModificationUI implements CustomFileModificationUI {
    constructor(private updateReactState: (state: any) => void) {}

    async onFileModified(tabId: string, data: FileModificationData): Promise<void> {
        this.updateReactState({
            type: 'FILE_MODIFIED',
            payload: {
                tabId,
                modification: {
                    id: data.toolUseId,
                    fileName: data.fileName,
                    filePath: data.filePath,
                    changes: data.changes,
                    status: data.status,
                    canUndo: data.undoAvailable,
                    timestamp: data.timestamp,
                },
            },
        })
    }

    async onFileUndone(tabId: string, toolUseId: string): Promise<void> {
        this.updateReactState({
            type: 'FILE_UNDONE',
            payload: { tabId, toolUseId },
        })
    }

    async onAllFilesUndone(tabId: string, relatedToolUses: Set<string>): Promise<void> {
        this.updateReactState({
            type: 'ALL_FILES_UNDONE',
            payload: { tabId, toolUseIds: Array.from(relatedToolUses) },
        })
    }

    async onFileError(tabId: string, toolUseId: string, error: string): Promise<void> {
        this.updateReactState({
            type: 'FILE_ERROR',
            payload: { tabId, toolUseId, error },
        })
    }
}
