import { CodeWhispererCodePercentageEvent } from '../../shared/telemetry/types'
import { TelemetryService } from '../../shared/telemetry/telemetryService'
import { CodewhispererLanguage } from '../../shared/languageDetection'

const CODE_PERCENTAGE_INTERVAL = 5 * 60 * 1000
const INSERT_CUTOFF_THRESHOLD = 50

type TelemetryBuckets = {
    [languageId: string]: {
        totalTokens: number
        // The accepted characters without counting user modification
        acceptedTokens: number
        invocationCount: number
        successCount: number
    }
}

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
        return setInterval(async () => {
            const events = this.getEventDataAndRotate()
            await Promise.all(
                events.map(
                    async event =>
                        await this.telemetryService.emitCodeCoverageEvent(
                            {
                                languageId: event.codewhispererLanguage as CodewhispererLanguage,
                                customizationArn: this.customizationArn,
                                totalCharacterCount: event.codewhispererTotalTokens,
                                acceptedCharacterCount: event.codewhispererSuggestedTokens,
                            },
                            {
                                percentage: event.codewhispererPercentage,
                                successCount: event.successCount,
                                credentialStartUrl: event.credentialStartUrl,
                            }
                        )
                )
            )
        }, CODE_PERCENTAGE_INTERVAL)
    }

    private getEventDataAndRotate(): CodeWhispererCodePercentageEvent[] {
        const previousBuckets = this.rotate()
        return Object.keys(previousBuckets)
            .filter(languageId => previousBuckets[languageId]?.invocationCount > 0)
            .map(languageId => {
                const bucket = previousBuckets[languageId]
                const percentage = this.roundTwoDecimals((bucket.acceptedTokens / bucket.totalTokens) * 100) || 0
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

        return 0
    }

    // Port of implementation in AWS Toolkit for VSCode
    // https://github.com/aws/aws-toolkit-vscode/blob/43f5b85f93f5017145ba5e6b140cce0b6ef906f8/packages/core/src/codewhisperer/tracker/codewhispererCodeCoverageTracker.ts#L267
    // Note: due to distributed communication between IDE and language server,
    // UI flag `isCodeWhispererEditing` is replaced with language server controlled `fromCodeWhisperer` flag
    countTotalTokens(languageId: string, tokens: string, fromCodeWhisperer = false): void {
        const languageBucket = this.getLanguageBucket(languageId)

        // Handle CodeWhisperer recommendations
        if (fromCodeWhisperer && tokens.length >= INSERT_CUTOFF_THRESHOLD) {
            languageBucket.totalTokens += tokens.length
            return
        }

        // Handle single character input
        if (tokens.length === 1) {
            languageBucket.totalTokens += 1
            return
        }

        // Handle newline with indentation
        const complexEventCount = this.getCharacterCountFromComplexEvent(tokens)
        if (complexEventCount !== 0) {
            languageBucket.totalTokens += complexEventCount
            return
        }

        // Handle multi-character input within threshold
        if (!fromCodeWhisperer && tokens.length < INSERT_CUTOFF_THRESHOLD && tokens.trim().length > 0) {
            languageBucket.totalTokens += tokens.length
            return
        }
    }

    countAcceptedTokens(languageId: string, tokens: string): void {
        const languageBucket = this.getLanguageBucket(languageId)
        const tokenCount = tokens.length
        languageBucket.acceptedTokens += tokenCount
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
