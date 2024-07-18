import { Telemetry } from '@aws/language-server-runtimes/server-interface'
import { CodeWhispererCodePercentageEvent } from './types'

const CODE_PERCENTAGE_INTERVAL = 5 * 60 * 1000
const CODE_PERCENTAGE_EVENT_NAME = 'codewhisperer_codePercentage'

type TelemetryBuckets = {
    [languageId: string]: {
        totalTokens: number
        acceptedTokens: number
        invocationCount: number
        successCount: number
    }
}

export class CodePercentageTracker {
    private buckets: TelemetryBuckets
    private intervalId: NodeJS.Timeout
    private telemetry: Telemetry

    constructor(telemetry: Telemetry) {
        this.buckets = {}
        this.telemetry = telemetry

        this.intervalId = this.startListening()
    }

    private startListening() {
        return setInterval(() => {
            this.getEventDataAndRotate().forEach(event => {
                this.telemetry.emitMetric({
                    name: CODE_PERCENTAGE_EVENT_NAME,
                    data: event,
                })
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
                    codewhispererAcceptedTokens: bucket.acceptedTokens,
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

    countTokens(languageId: string, tokens: string): void {
        const languageBucket = this.getLanguageBucket(languageId)
        const tokenCount = tokens.length
        languageBucket.totalTokens += tokenCount
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
