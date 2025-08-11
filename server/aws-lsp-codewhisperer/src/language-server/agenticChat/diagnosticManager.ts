import { v4 as uuid } from 'uuid'
import { ChatResult, Button } from '@aws/language-server-runtimes/server-interface'
import { CheckDiagnosticsParams, CheckDiagnosticsResult } from '@aws/language-server-runtimes/protocol'
import { Features } from '../types'
import { AgenticChatResultStream } from './agenticChatResultStream'
import { ChatSessionManagementService } from '../chat/chatSessionManagementService'
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

        return `Please fix all the following errors that were detected in the selected files:\n\n${errorDescriptions}\n\n`
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
