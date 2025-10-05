/**
 * Type extensions for chat functionality
 */

declare module '@aws/language-server-runtimes-types/out/chat' {
    interface TabData {
        /**
         * Modified files tracker data for the tab
         */
        modifiedFilesTracker?: {
            visible: boolean
            files: Array<{
                toolUseId: string
                filePath: string
                fileName: string
                changes: {
                    added: number
                    deleted: number
                }
                status: 'modified' | 'undone' | 'error'
                timestamp: number
                undoAvailable: boolean
            }>
            title?: string
            showUndoAll?: boolean
        }
    }
}

export {}
