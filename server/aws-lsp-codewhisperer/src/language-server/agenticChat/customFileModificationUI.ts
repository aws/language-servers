/**
 * Interface and utilities for custom file modification UI integration
 */

// Interface for file modification data
export interface FileModificationData {
    toolUseId: string
    filePath: string
    fileName: string
    changes: {
        added: number
        deleted: number
    }
    beforeContent: string
    afterContent: string
    undoAvailable: boolean
    relatedToolUses?: Set<string>
    status: 'modified' | 'undone' | 'error'
    timestamp: number
}

// Interface for custom UI component
export interface CustomFileModificationUI {
    onFileModified(tabId: string, data: FileModificationData): Promise<void>
    onFileUndone(tabId: string, toolUseId: string): Promise<void>
    onAllFilesUndone(tabId: string, relatedToolUses: Set<string>): Promise<void>
    onFileError(tabId: string, toolUseId: string, error: string): Promise<void>
}

// Sample implementation that logs to console (for testing/development)
export class ConsoleFileModificationUI implements CustomFileModificationUI {
    async onFileModified(tabId: string, data: FileModificationData): Promise<void> {
        console.log(`[CustomUI] File modified in tab ${tabId}:`, {
            toolUseId: data.toolUseId,
            fileName: data.fileName,
            filePath: data.filePath,
            changes: data.changes,
            status: data.status,
            undoAvailable: data.undoAvailable,
            relatedToolUses: data.relatedToolUses ? Array.from(data.relatedToolUses) : undefined,
            timestamp: new Date(data.timestamp).toISOString(),
        })
    }

    async onFileUndone(tabId: string, toolUseId: string): Promise<void> {
        console.log(`[CustomUI] File undone in tab ${tabId}:`, {
            toolUseId,
            timestamp: new Date().toISOString(),
        })
    }

    async onAllFilesUndone(tabId: string, relatedToolUses: Set<string>): Promise<void> {
        console.log(`[CustomUI] All files undone in tab ${tabId}:`, {
            relatedToolUses: Array.from(relatedToolUses),
            timestamp: new Date().toISOString(),
        })
    }

    async onFileError(tabId: string, toolUseId: string, error: string): Promise<void> {
        console.log(`[CustomUI] File error in tab ${tabId}:`, {
            toolUseId,
            error,
            timestamp: new Date().toISOString(),
        })
    }
}

// Factory function to create your custom UI implementation
export function createCustomFileModificationUI(): CustomFileModificationUI {
    // Replace this with your actual implementation
    return new ConsoleFileModificationUI()
}
