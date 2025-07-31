/* eslint-disable import/no-nodejs-modules */

import { Features } from '@aws/language-server-runtimes/server-interface/server'
import { DISPLAY_FINDINGS_TOOL_NAME, DISPLAY_FINDINGS_TOOL_DESCRIPTION } from './displayFindingsConstants'
import { CodeReviewUtils } from './codeReviewUtils'
import { DISPLAY_FINDINGS_INPUT_SCHEMA, Z_DISPLAY_FINDINGS_INPUT_SCHEMA } from './displayFindingsSchemas'
import { CancellationToken } from '@aws/language-server-runtimes/server-interface'
import { InvokeOutput } from '../toolShared'
import { CancellationError } from '@aws/lsp-core'
import { DisplayFinding } from './displayFindingsTypes'
import { CodeReviewFinding } from './codeReviewTypes'
import path = require('path')

export class DisplayFindings {
    private readonly logging: Features['logging']
    private readonly telemetry: Features['telemetry']
    private readonly workspace: Features['workspace']
    private cancellationToken?: CancellationToken
    private writableStream?: WritableStream

    constructor(features: Pick<Features, 'logging' | 'telemetry' | 'workspace'> & Partial<Features>) {
        this.logging = features.logging
        this.telemetry = features.telemetry
        this.workspace = features.workspace
    }

    static readonly toolName = DISPLAY_FINDINGS_TOOL_NAME

    static readonly toolDescription = DISPLAY_FINDINGS_TOOL_DESCRIPTION

    static readonly inputSchema = DISPLAY_FINDINGS_INPUT_SCHEMA

    /**
     * Main execution method for the displayFindings tool
     * @param input User input parameters for display findings
     * @param context Execution context containing clients and tokens
     * @returns Output containing code review results or error message
     */
    public async execute(input: any, context: any): Promise<InvokeOutput> {
        let chatStreamWriter: WritableStreamDefaultWriter<any> | undefined

        try {
            this.logging.info(`Executing ${DISPLAY_FINDINGS_TOOL_NAME}: ${JSON.stringify(input)}`)

            // 1. Validate input
            const setup = await this.validateInputAndSetup(input, context)
            this.checkCancellation()

            // 2. group the findings into AggregatedCodeScanIssue
            const mappedFindings = setup.map(finding => this.mapToCodeReviewFinding(finding))
            const aggregatedFindings = this.aggregateFindingsByFile(mappedFindings)

            return {
                output: {
                    kind: 'json',
                    success: true,
                    content: aggregatedFindings,
                },
            }
        } catch (error: any) {
            if (error instanceof CancellationError) {
                throw error
            }
            return {
                output: {
                    kind: 'json',
                    success: false,
                    content: {
                        errorMessage: error.message,
                    },
                },
            }
        } finally {
            await chatStreamWriter?.close()
            chatStreamWriter?.releaseLock()
        }
    }

    /**
     * Validates user input and sets up the execution environment
     * @param input User input parameters for code review
     * @param context Execution context containing clients and tokens
     * @returns Setup object with validated parameters or error message
     */
    private async validateInputAndSetup(input: any, context: any): Promise<DisplayFinding[]> {
        this.cancellationToken = context.cancellationToken as CancellationToken

        this.writableStream = context.writableStream as WritableStream

        // parse input
        const validatedInput = Z_DISPLAY_FINDINGS_INPUT_SCHEMA.parse(input)

        return validatedInput.findings as DisplayFinding[]
    }

    private mapToCodeReviewFinding(finding: DisplayFinding): CodeReviewFinding {
        return {
            filePath: finding.filePath,
            startLine: parseInt(finding.startLine),
            endLine: parseInt(finding.endLine),
            comment: finding.description,
            title: finding.title,
            description: { markdown: finding.description, text: finding.description },
            detectorId: '',
            detectorName: 'DisplayFindings',
            findingId: '',
            relatedVulnerabilities: [],
            severity: finding.severity,
            recommendation: { text: '' },
            suggestedFixes: finding.suggestedFixes ?? [],
            scanJobId: '',
            language: finding.language,
            autoDetected: false,
            findingContext: undefined,
        }
    }

    private aggregateFindingsByFile(
        findings: CodeReviewFinding[]
    ): { filePath: string; issues: CodeReviewFinding[] }[] {
        const aggregatedCodeScanIssueMap = new Map<string, CodeReviewFinding[]>()

        for (const finding of findings) {
            const resolvedPath = path.normalize(finding.filePath)
            if (resolvedPath) {
                if (aggregatedCodeScanIssueMap.has(resolvedPath)) {
                    aggregatedCodeScanIssueMap.get(resolvedPath)?.push(finding)
                } else {
                    aggregatedCodeScanIssueMap.set(resolvedPath, [finding])
                }
            } else {
                this.logging.warn(`Could not resolve finding file path: ${finding.filePath}`)
            }
        }

        return Array.from(aggregatedCodeScanIssueMap.entries()).map(([filePath, issues]) => ({
            filePath,
            issues,
        }))
    }

    /**
     * Checks if the operation has been cancelled by the user
     * @param message Optional message to include in the cancellation error
     * @throws Error if the operation has been cancelled
     */
    private checkCancellation(message: string = 'Command execution cancelled'): void {
        CodeReviewUtils.checkCancellation(this.cancellationToken, this.logging, message)
    }
}
