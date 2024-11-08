import { CodeWhispererCodePercentageEvent } from './types'
import { TelemetryService } from '../telemetryService'
import { CodewhispererLanguage } from '../languageDetection'

const CODE_PERCENTAGE_INTERVAL = 5 * 60 * 1000
const CODE_PERCENTAGE_EVENT_NAME = 'codewhisperer_codePercentage'

type TelemetryBuckets = {
    [languageId: string]: {
        totalTokens: number
        // The accepted characters without counting user modification
        acceptedTokens: number
        invocationCount: number
        successCount: number
    }
}

const autoClosingKeystrokeInputs = ['[]', '{}', '()', '""', "''"]

export class CodePercentageTracker {
    private buckets: TelemetryBuckets
    private intervalId: NodeJS.Timeout
    private telemetryService: TelemetryService
    public customizationArn?: string

    constructor(telemetryService: TelemetryService) {
        this.buckets = {}
        this.telemetryService = telemetryService

        this.intervalId = this.startListening()
    }

    private startListening() {
        return setInterval(() => {
            this.getEventDataAndRotate().forEach(event => {
                this.telemetryService.emitCodeCoverageEvent(
                    {
                        languageId: event.codewhispererLanguage as CodewhispererLanguage,
                        customizationArn: this.customizationArn,
                        totalCharacterCount: event.codewhispererTotalTokens,
                        acceptedCharacterCount: event.codewhispererSuggestedTokens,
                    },
                    {
                        percentage: event.codewhispererPercentage,
                        successCount: event.successCount,
                    }
                )
            })
        }, CODE_PERCENTAGE_INTERVAL)
    }

    private getEventDataAndRotate(): CodeWhispererCodePercentageEvent[] {
        const previousBuckets = this.rotate()
        return Object.keys(previousBuckets)
            .filter(languageId => previousBuckets[languageId]?.invocationCount > 0)
            .map(languageId => {
                const bucket = previousBuckets[languageId]
                const percentage = this.roundTwoDecimals((bucket.acceptedTokens / bucket.totalTokens) * 100)
                return {
                    codewhispererTotalTokens: bucket.totalTokens,
                    codewhispererLanguage: languageId,
                    codewhispererSuggestedTokens: bucket.acceptedTokens,
                    codewhispererPercentage: percentage,
                    successCount: bucket.successCount,
                }
            })
    }

    private roundTwoDecimals(n: number) {
        // Number.EPSILON isn't perfect, but good enough for our purposes.
        // Only works correctly for positive numbers in the 0-100 order of magnitude
        return Math.round((n + Number.EPSILON) * 100) / 100
    }

    private rotate() {
        const previous = this.buckets
        this.buckets = {}
        return previous
    }

    private getLanguageBucket(languageId: string): TelemetryBuckets[string] {
        if (!this.buckets[languageId]) {
            this.buckets[languageId] = {
                totalTokens: 0,
                acceptedTokens: 0,
                invocationCount: 0,
                successCount: 0,
            }
        }

        return this.buckets[languageId]
    }

    // Partial port of implementation in AWS Toolkit for VSCode
    // https://github.com/aws/aws-toolkit-vscode/blob/81132884f4fb3319bda4be7d3d873265191f43ce/packages/core/src/codewhisperer/tracker/codewhispererCodeCoverageTracker.ts#L238
    getCharacterCountFromComplexEvent(tokens: string) {
        if ((tokens.startsWith('\n') || tokens.startsWith('\r\n')) && tokens.trim().length === 0) {
            return 1
        }
        if (autoClosingKeystrokeInputs.includes(tokens)) {
            return 2
        }

        return 0
    }

    countTotalTokens(languageId: string, tokens: string): void {
        const languageBucket = this.getLanguageBucket(languageId)
        let tokenCount = 0

        // Partial port of implementation in AWS Toolkit for VSCode
        // https://github.com/aws/aws-toolkit-vscode/blob/81132884f4fb3319bda4be7d3d873265191f43ce/packages/core/src/codewhisperer/tracker/codewhispererCodeCoverageTracker.ts#L267-L300
        // ignore no contentChanges. ignore contentChanges from other plugins (formatters)
        // only include contentChanges from user keystroke input (one character input).
        // Also ignore deletion events due to a known issue of tracking deleted CodeWhiperer tokens.

        // A user keystroke input can be:
        // 1. content change with 1 character insertion
        if (tokens.length === 1) {
            tokenCount = 1
        } else if (this.getCharacterCountFromComplexEvent(tokens) !== 0) {
            // 2. newline character with indentation
            // 3. 2 character insertion of closing brackets
            tokenCount = this.getCharacterCountFromComplexEvent(tokens)
            // also include multi character input within 50 characters (not from CWSPR)
        } else if (tokens.length > 1) {
            // select 50 as the cut-off threshold for counting user input.
            // ignore all white space multi char input, this usually comes from reformat.
            if (tokens.length < 50 && tokens.trim().length > 0) {
                tokenCount = tokens.length
            }
        }

        languageBucket.totalTokens += tokenCount
    }

    countAcceptedTokens(languageId: string, tokens: string): void {
        const languageBucket = this.getLanguageBucket(languageId)
        const tokenCount = tokens.length
        languageBucket.acceptedTokens += tokenCount
        languageBucket.totalTokens += tokenCount
    }

    countInvocation(languageId: string): void {
        const languageBucket = this.getLanguageBucket(languageId)
        languageBucket.invocationCount++
    }

    countSuccess(languageId: string): void {
        const languageBucket = this.getLanguageBucket(languageId)
        languageBucket.successCount++
    }

    dispose(): void {
        clearInterval(this.intervalId)
    }
}
