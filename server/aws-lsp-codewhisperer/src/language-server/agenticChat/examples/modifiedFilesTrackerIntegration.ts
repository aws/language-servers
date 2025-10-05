/**
 * Example showing how to integrate the modified-files-tracker component
 * with the custom file modification UI system
 */

import { CustomFileModificationUI, FileModificationData } from '../customFileModificationUI'
// Note: Adjust this import path based on your project structure
// import { ModifiedFilesTracker, ModifiedFilesTrackerData } from 'mynah-ui/src/components/modified-files-tracker'

// For this example, we'll define the interfaces locally
interface ModifiedFilesTrackerData {
    title?: string
    visible?: boolean
    showUndoAll?: boolean
    showFileCount?: boolean
    initialCollapsed?: boolean
    fileList?: {
        filePaths?: string[]
        deletedFiles?: string[]
        details?: Record<
            string,
            {
                visibleName?: string
                description?: string
                status?: 'success' | 'warning' | 'error'
                changes?: { added: number; deleted: number }
                icon?: string
            }
        >
        collapsed?: boolean
        hideFileCount?: boolean
    }
}

interface ModifiedFilesTrackerProps {
    tabId: string
    modifiedFilesData: ModifiedFilesTrackerData
    onFileUndo?: (filePath: string) => void
    onUndoAll?: () => void
    onButtonClick?: (buttonId: string, messageId: string) => void
}

// Mock ModifiedFilesTracker class for this example
class ModifiedFilesTracker {
    render: HTMLElement

    constructor(props: ModifiedFilesTrackerProps) {
        this.render = document.createElement('div')
        this.render.className = 'modified-files-tracker'
        // In a real implementation, this would create the actual UI
    }

    updateModifiedFilesData(data: ModifiedFilesTrackerData): void {
        // Update the tracker with new data
    }
}

/**
 * Example implementation that bridges the AgenticChatController file modification events
 * with the mynah-ui ModifiedFilesTracker component
 */
export class ModifiedFilesTrackerUI implements CustomFileModificationUI {
    private trackers = new Map<string, ModifiedFilesTracker>()
    private fileData = new Map<string, Map<string, FileModificationData>>()

    async onFileModified(tabId: string, data: FileModificationData): Promise<void> {
        // Store the file data
        if (!this.fileData.has(tabId)) {
            this.fileData.set(tabId, new Map())
        }
        this.fileData.get(tabId)!.set(data.toolUseId, data)

        // Update or create the tracker for this tab
        await this.updateTracker(tabId)
    }

    async onFileUndone(tabId: string, toolUseId: string): Promise<void> {
        // Remove the file data
        const tabData = this.fileData.get(tabId)
        if (tabData) {
            tabData.delete(toolUseId)
            await this.updateTracker(tabId)
        }
    }

    async onAllFilesUndone(tabId: string, relatedToolUses: Set<string>): Promise<void> {
        // Remove all related file data
        const tabData = this.fileData.get(tabId)
        if (tabData) {
            for (const toolUseId of relatedToolUses) {
                tabData.delete(toolUseId)
            }
            await this.updateTracker(tabId)
        }
    }

    async onFileError(tabId: string, toolUseId: string, error: string): Promise<void> {
        // Update the file data to show error status
        const tabData = this.fileData.get(tabId)
        const fileData = tabData?.get(toolUseId)
        if (fileData) {
            fileData.status = 'error'
            await this.updateTracker(tabId)
        }
    }

    private async updateTracker(tabId: string): Promise<void> {
        const tabData = this.fileData.get(tabId)
        if (!tabData) return

        const files = Array.from(tabData.values())

        // Convert our file modification data to the format expected by ModifiedFilesTracker
        const trackerData: ModifiedFilesTrackerData = {
            title: `Modified Files (${files.length})`,
            visible: files.length > 0,
            showUndoAll: files.length > 1,
            showFileCount: true,
            initialCollapsed: false,
            fileList: {
                filePaths: files.map(f => f.fileName),
                details: Object.fromEntries(
                    files.map(f => [
                        f.fileName,
                        {
                            visibleName: f.fileName,
                            description: f.filePath,
                            status: this.getStatusForTracker(f.status),
                            changes: f.changes,
                            icon: this.getIconForFile(f.fileName),
                        },
                    ])
                ),
                collapsed: false,
                hideFileCount: false,
            },
        }

        // Update existing tracker or create new one
        let tracker = this.trackers.get(tabId)
        if (tracker) {
            tracker.updateModifiedFilesData(trackerData)
        } else {
            tracker = new ModifiedFilesTracker({
                tabId,
                modifiedFilesData: trackerData,
                onFileUndo: (filePath: string) => this.handleFileUndo(tabId, filePath),
                onUndoAll: () => this.handleUndoAll(tabId),
                onButtonClick: (buttonId: string, messageId: string) => {
                    // Forward button clicks to the AgenticChatController
                    this.handleButtonClick(tabId, buttonId, messageId)
                },
            })
            this.trackers.set(tabId, tracker)
        }
    }

    private getStatusForTracker(status: 'modified' | 'undone' | 'error'): 'success' | 'warning' | 'error' {
        switch (status) {
            case 'modified':
                return 'warning'
            case 'undone':
                return 'success'
            case 'error':
                return 'error'
            default:
                return 'warning'
        }
    }

    private getIconForFile(fileName: string): string {
        const extension = fileName.split('.').pop()?.toLowerCase()
        switch (extension) {
            case 'ts':
            case 'tsx':
                return 'typescript'
            case 'js':
            case 'jsx':
                return 'javascript'
            case 'py':
                return 'python'
            case 'java':
                return 'java'
            case 'json':
                return 'json'
            case 'md':
                return 'markdown'
            default:
                return 'file'
        }
    }

    private handleFileUndo(tabId: string, filePath: string): void {
        // Find the toolUseId for this file path
        const tabData = this.fileData.get(tabId)
        if (tabData) {
            for (const [toolUseId, data] of tabData.entries()) {
                if (data.fileName === filePath || data.filePath === filePath) {
                    // This would trigger the undo in the AgenticChatController
                    console.log(`Undo file: ${filePath} (toolUseId: ${toolUseId})`)
                    break
                }
            }
        }
    }

    private handleUndoAll(tabId: string): void {
        const tabData = this.fileData.get(tabId)
        if (tabData) {
            const toolUseIds = Array.from(tabData.keys())
            console.log(`Undo all files in tab ${tabId}:`, toolUseIds)
        }
    }

    private handleButtonClick(tabId: string, buttonId: string, messageId: string): void {
        // Forward button clicks to the AgenticChatController
        // This would be connected to the actual button click handler
        console.log(`Button clicked: ${buttonId}, messageId: ${messageId}, tabId: ${tabId}`)
    }

    /**
     * Get the tracker component for a specific tab
     */
    public getTracker(tabId: string): ModifiedFilesTracker | undefined {
        return this.trackers.get(tabId)
    }

    /**
     * Remove tracker for a tab (e.g., when tab is closed)
     */
    public removeTracker(tabId: string): void {
        this.trackers.delete(tabId)
        this.fileData.delete(tabId)
    }

    /**
     * Get all active trackers
     */
    public getAllTrackers(): Map<string, ModifiedFilesTracker> {
        return new Map(this.trackers)
    }
}

/**
 * Example usage in a server or application context
 */
export function createModifiedFilesTrackerIntegration(): ModifiedFilesTrackerUI {
    const trackerUI = new ModifiedFilesTrackerUI()

    // Example: Listen for tab close events to clean up trackers
    // tabManager.onTabClosed((tabId: string) => {
    //     trackerUI.removeTracker(tabId)
    // })

    return trackerUI
}
