import { v4 as uuid } from 'uuid'
import { ChatResult, Button } from '@aws/language-server-runtimes/server-interface'
import { CheckDiagnosticsParams, CheckDiagnosticsResult } from '@aws/language-server-runtimes/protocol'
import { Features } from '../types'
import { AgenticChatResultStream } from './agenticChatResultStream'
import { ChatSessionManagementService } from '../chat/chatSessionManagementService'
import {
    BUTTON_FIX_ALL_DIAGNOSTIC_ERRORS,
    BUTTON_FIX_SELECTED_DIAGNOSTIC_ERRORS,
    BUTTON_CONTINUE_WITH_ERRORS,
} from './constants/toolConstants'
import { URI } from 'vscode-uri'

export interface DiagnosticError {
    filePath: string
    diagnostics: Array<{
        range: {
            start: { line: number; character: number }
            end: { line: number; character: number }
        }
        severity?: number
        message: string
        source?: string
        code?: string | number
    }>
    errorCount: number
}
const MAX_ERROR_NUMBER = 10
const SEVERITY_LEVEL_THRESHOLD = 2

interface DiagnosticDeferred {
    resolve: (value: DiagnosticError[]) => void
    reject: (error: Error) => void
    promise: Promise<DiagnosticError[]>
}

export class DiagnosticManager {
    #features: Features
    #chatSessionManagementService: ChatSessionManagementService
    #diagnosticErrorsDeferred: DiagnosticDeferred | undefined
    #currentDiagnosticErrors: DiagnosticError[] = []
    #selectedDiagnosticFiles = new Set<string>()

    constructor(features: Features, chatSessionManagementService: ChatSessionManagementService) {
        this.#features = features
        this.#chatSessionManagementService = chatSessionManagementService
    }

    /**
     * Get diagnostics from the language server
     */
    async getDiagnostics(params: CheckDiagnosticsParams): Promise<CheckDiagnosticsResult> {
        return await this.#features.lsp.window.checkDiagnostics(params)
    }

    /**
     * Check for diagnostic errors in the specified files
     */
    async checkDiagnosticErrors(filePaths: string[]): Promise<DiagnosticError[]> {
        // First, open files to ensure diagnostics are available
        await this.#ensureFilesAreAnalyzed(filePaths)

        const diagnosticParams: CheckDiagnosticsParams = { filePaths: {} }
        for (const file of filePaths) {
            diagnosticParams.filePaths[file] = {}
        }

        try {
            const diagnosticResult = await this.getDiagnostics(diagnosticParams)
            const errors: DiagnosticError[] = []

            for (const [filePath, diagnostics] of Object.entries(diagnosticResult.filePaths)) {
                if (Array.isArray(diagnostics) && diagnostics.length > 0) {
                    // Filter for errors and warnings only (severity 1 and 2)
                    const errorDiagnostics = diagnostics.filter(
                        diag => diag.severity === undefined || diag.severity <= SEVERITY_LEVEL_THRESHOLD
                    )

                    if (errorDiagnostics.length > 0) {
                        // Limit to 10 errors per file
                        const limitedDiagnostics = errorDiagnostics.slice(0, MAX_ERROR_NUMBER)
                        errors.push({
                            filePath,
                            diagnostics: limitedDiagnostics,
                            errorCount: errorDiagnostics.length,
                        })
                    }
                }
            }

            return errors
        } catch (error) {
            this.#log(`Failed to get diagnostic information: ${error}`)
            return []
        }
    }

    /**
     * Ensure files are opened/analyzed so diagnostics are available
     */
    async #ensureFilesAreAnalyzed(filePaths: string[]): Promise<void> {
        const openPromises = filePaths.map(async filePath => {
            try {
                // Open the file without taking focus to trigger diagnostic analysis
                await this.#features.lsp.workspace.openWorkspaceFile({
                    filePath: filePath,
                    makeActive: false,
                })
            } catch (error) {
                this.#log(`Failed to open file for diagnostic analysis: ${filePath} - ${error}`)
            }
        })

        // Wait for all files to be opened
        await Promise.all(openPromises)

        // Give language servers a moment to analyze the files
        await new Promise(resolve => setTimeout(resolve, 2000))
    }

    /**
     * Show diagnostic errors UI and wait for user decision
     */
    async showDiagnosticErrorsUI(
        chatResultStream: AgenticChatResultStream,
        diagnosticErrors: DiagnosticError[],
        tabId: string
    ): Promise<DiagnosticError[]> {
        const messageId = `diagnostic-errors-${uuid()}`

        // Store current diagnostic errors for button handler
        this.#currentDiagnosticErrors = diagnosticErrors

        // Create the diagnostic errors table UI
        const diagnosticErrorsCard = this.#createDiagnosticErrorsCard(messageId, diagnosticErrors)

        // Write the card to the stream
        const blockId = await chatResultStream.writeResultBlock(diagnosticErrorsCard)

        // Create a deferred promise to wait for user decision
        const deferred = this.#createDeferred()
        this.#diagnosticErrorsDeferred = deferred

        // Set up button handlers for fix/continue
        const session = this.#chatSessionManagementService.getSession(tabId)
        if (session.data) {
            session.data.setDeferredToolExecution(messageId, deferred.resolve, deferred.reject)
        }

        try {
            const selectedErrors = await deferred.promise

            // Update the card to show the user's decision
            const updatedCard = this.#createDiagnosticErrorsResultCard(messageId, selectedErrors.length > 0)
            await chatResultStream.overwriteResultBlock(updatedCard, blockId)

            return selectedErrors
        } catch (error) {
            this.#log(`Error waiting for diagnostic errors decision: ${error}`)
            // Default to continue without fixing on error
            const updatedCard = this.#createDiagnosticErrorsResultCard(messageId, false)
            await chatResultStream.overwriteResultBlock(updatedCard, blockId)
            return []
        } finally {
            this.#diagnosticErrorsDeferred = undefined
            this.#currentDiagnosticErrors = []
            this.#selectedDiagnosticFiles.clear()
        }
    }

    /**
     * Handle button clicks for diagnostic errors
     */
    async handleDiagnosticButtonClick(buttonId: string): Promise<DiagnosticError[]> {
        if (!this.#diagnosticErrorsDeferred) {
            return []
        }

        switch (buttonId) {
            case BUTTON_FIX_ALL_DIAGNOSTIC_ERRORS:
                // Fix all errors - resolve with all current diagnostic errors
                const allErrors = this.#currentDiagnosticErrors || []
                this.#diagnosticErrorsDeferred.resolve(allErrors)
                return allErrors

            case BUTTON_FIX_SELECTED_DIAGNOSTIC_ERRORS:
                // Fix only selected errors
                const selectedErrors = this.#currentDiagnosticErrors.filter(error =>
                    this.#selectedDiagnosticFiles.has(error.filePath)
                )
                this.#diagnosticErrorsDeferred.resolve(selectedErrors)
                return selectedErrors

            case BUTTON_CONTINUE_WITH_ERRORS:
                this.#diagnosticErrorsDeferred.resolve([])
                return []

            default:
                return []
        }
    }

    /**
     * Handle diagnostic checkbox clicks
     */
    async handleDiagnosticCheckboxClick(params: {
        tabId: string
        messageId: string
        filePath: string
        index: number
    }): Promise<void> {
        this.#log(
            `Handling diagnostic checkbox click for file: ${params.filePath}, current selection: ${this.#selectedDiagnosticFiles.has(params.filePath)}`
        )

        // Toggle selection
        if (this.#selectedDiagnosticFiles.has(params.filePath)) {
            this.#selectedDiagnosticFiles.delete(params.filePath)
            this.#log(`Removed ${params.filePath} from selection`)
        } else {
            this.#selectedDiagnosticFiles.add(params.filePath)
            this.#log(`Added ${params.filePath} to selection`)
        }

        this.#log(`Selected files: ${Array.from(this.#selectedDiagnosticFiles).join(', ')}`)

        // Recreate the updated diagnostic errors card with new selection state
        const updatedCard = this.#createDiagnosticErrorsCard(params.messageId, this.#currentDiagnosticErrors)

        // Send update with new selection states
        this.#features.chat.sendChatUpdate({
            tabId: params.tabId,
            data: {
                messages: [updatedCard],
            },
        })
    }

    /**
     * Generate a prompt to fix diagnostic errors
     */
    generateFixPrompt(diagnosticErrors: DiagnosticError[]): string {
        const errorDescriptions = diagnosticErrors
            .map(error => {
                const fileName = error.filePath.split('/').pop() || error.filePath
                const errorList = error.diagnostics
                    .map(diag => `Line ${diag.range.start.line + 1}: ${diag.message}`)
                    .join('\n')

                return `File: ${fileName} (${error.filePath})\n${errorList}`
            })
            .join('\n\n')

        return `Please fix the following errors that were detected in the selected files:\n\n${errorDescriptions}\n\n`
    }

    /**
     * Handle file link clicks for diagnostic errors
     */
    async handleDiagnosticFileLink(link: string, messageId: string, tabId: string): Promise<void> {
        this.#log(`Handling diagnostic file link: ${link}, messageId: ${messageId}`)

        if (!link.startsWith('file://')) {
            this.#log(`Link does not start with file://, ignoring: ${link}`)
            return
        }

        try {
            const url = new URL(link)
            const filePath = decodeURIComponent(url.pathname)
            const index = url.searchParams.get('index')

            this.#log(
                `Parsed link - filePath: ${filePath}, index: ${index}, messageId starts with diagnostic-errors: ${messageId.startsWith('diagnostic-errors-')}`
            )

            // If this is a diagnostic checkbox link, handle the toggle
            if (index !== null && messageId.startsWith('diagnostic-errors-')) {
                const indexNum = parseInt(index)
                this.#log(
                    `Processing checkbox click for index: ${indexNum}, current errors count: ${this.#currentDiagnosticErrors.length}`
                )

                if (indexNum >= 0 && indexNum < this.#currentDiagnosticErrors.length) {
                    const actualFilePath = this.#currentDiagnosticErrors[indexNum].filePath
                    this.#log(`Calling handleDiagnosticCheckboxClick for file: ${actualFilePath}`)

                    await this.handleDiagnosticCheckboxClick({
                        tabId,
                        messageId,
                        filePath: actualFilePath,
                        index: indexNum,
                    })
                } else {
                    this.#log(`Index ${indexNum} is out of bounds for current diagnostic errors`)
                }
                return
            }

            this.#log(`Opening workspace file: ${filePath}`)
            // Regular file link - open the workspace file and make it active
            await this.#features.lsp.workspace.openWorkspaceFile({
                filePath: filePath,
                makeActive: true,
            })
        } catch (error) {
            this.#log(`Error handling diagnostic file link: ${error}`)
        }
    }

    /**
     * Create the diagnostic errors card UI with clickable file links
     */
    #createDiagnosticErrorsCard(messageId: string, diagnosticErrors: DiagnosticError[]): ChatResult {
        let bodyContent = 'New errors were detected in the modified files:\n\n'

        // Create file links instead of buttons for checkboxes
        for (let i = 0; i < diagnosticErrors.length; i++) {
            const error = diagnosticErrors[i]
            const isSelected = this.#selectedDiagnosticFiles.has(error.filePath)
            const checkboxIcon = isSelected ? '☑' : '☐'

            // Create proper file:// URI for the link
            const fileUri = `file://${error.filePath}?index=${i}`
            bodyContent += `[${checkboxIcon} ${error.filePath}](${fileUri}) (${error.errorCount} error${error.errorCount > 1 ? 's' : ''})\n`
        }

        bodyContent += '\nClick on files above to select/deselect them for fixing.\n'

        return {
            type: 'answer',
            messageId,
            body: bodyContent,
            buttons: [
                {
                    id: BUTTON_FIX_ALL_DIAGNOSTIC_ERRORS,
                    text: 'Fix all',
                    icon: 'tools',
                    status: 'primary',
                },
                {
                    id: BUTTON_FIX_SELECTED_DIAGNOSTIC_ERRORS,
                    text: 'Fix selected',
                    icon: 'tools',
                    status: 'clear',
                },
                {
                    id: BUTTON_CONTINUE_WITH_ERRORS,
                    text: 'Continue',
                    icon: 'arrow-right',
                    status: 'clear',
                },
            ],
        }
    }

    /**
     * Create the result card after user decision
     */
    #createDiagnosticErrorsResultCard(messageId: string, shouldFix: boolean): ChatResult {
        return {
            type: 'tool',
            messageId,
            header: {
                icon: shouldFix ? 'tools' : 'arrow-right',
                body: shouldFix ? 'Fixing errors...' : 'Continuing with errors',
                status: {
                    status: 'info',
                    icon: shouldFix ? 'tools' : 'arrow-right',
                    text: shouldFix ? 'Fixing' : 'Continued',
                },
            },
            body: shouldFix ? 'Starting to fix the detected errors...' : 'Continuing without fixing the errors.',
        }
    }

    /**
     * Create a deferred promise
     */
    #createDeferred(): DiagnosticDeferred {
        let resolve: (value: DiagnosticError[]) => void
        let reject: (error: Error) => void

        const promise = new Promise<DiagnosticError[]>((res, rej) => {
            resolve = res
            reject = rej
        })

        return { resolve: resolve!, reject: reject!, promise }
    }

    /**
     * Log helper
     */
    #log(message: string): void {
        this.#features.logging.info(`DiagnosticManager: ${message}`)
    }

    /**
     * Get current diagnostic errors (for external access)
     */
    getCurrentDiagnosticErrors(): DiagnosticError[] {
        return this.#currentDiagnosticErrors
    }

    /**
     * Get selected diagnostic files (for external access)
     */
    getSelectedDiagnosticFiles(): Set<string> {
        return this.#selectedDiagnosticFiles
    }

    /**
     * Check if there's a pending diagnostic decision
     */
    hasPendingDiagnosticDecision(): boolean {
        return this.#diagnosticErrorsDeferred !== undefined
    }

    /**
     * Clear diagnostic state
     */
    clearDiagnosticState(): void {
        this.#diagnosticErrorsDeferred = undefined
        this.#currentDiagnosticErrors = []
        this.#selectedDiagnosticFiles.clear()
    }
}
