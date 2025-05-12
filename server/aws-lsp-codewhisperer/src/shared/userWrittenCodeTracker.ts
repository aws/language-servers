import { CodewhispererLanguage } from './languageDetection'
import { TelemetryService } from './telemetry/telemetryService'
import { UserWrittenPercentageEvent } from './telemetry/types'

/**
 * This is mostly ported over from VS Code: https://github.com/aws/aws-toolkit-vscode/blob/master/packages/core/src/codewhisperer/tracker/userWrittenCodeTracker.ts
 * This class is mainly used for calculating the user written code
 * for active Amazon Q users.
 * It reports the user written code per 5 minutes when the user is coding and using Amazon Q features
 */
const USER_CODE_WRITTEN_INTERVAL = 5 * 60 * 1000
const RESET_Q_EDITING_THRESHOLD = 2 * 60 * 1000
const INSERT_CUTOFF_THRESHOLD = 50

type TelemetryBuckets = {
    [languageId: string]: {
        userWrittenCodeCharacterCount: number
        userWrittenCodeLineCount: number
        invocationCount: number
    }
}

export class UserWrittenCodeTracker {
    public customizationArn?: string
    private _qIsMakingEdits: boolean
    private _lastQInvocationTime: number
    private telemetryService: TelemetryService
    private buckets: TelemetryBuckets
    private intervalId?: NodeJS.Timeout
    private static instance?: UserWrittenCodeTracker

    private constructor(telemetryService: TelemetryService) {
        this._qIsMakingEdits = false
        this._lastQInvocationTime = 0
        this.telemetryService = telemetryService
        this.buckets = {}
        this.intervalId = this.startListening()
    }

    public static getInstance(telemetryService: TelemetryService) {
        if (!this.instance) {
            this.instance = new this(telemetryService)
        }
        return this.instance
    }

    private startListening() {
        return setInterval(async () => {
            const events = this.getEventDataAndRotate()
            await Promise.all(
                events.map(
                    async event =>
                        await this.telemetryService.emitCodeCoverageEvent(
                            {
                                customizationArn: this.customizationArn,
                                languageId: event.codewhispererLanguage as CodewhispererLanguage,
                                acceptedCharacterCount: 0,
                                totalCharacterCount: 0,
                                userWrittenCodeCharacterCount: event.userWrittenCodeCharacterCount,
                                userWrittenCodeLineCount: event.userWrittenCodeLineCount,
                            },
                            {}
                        )
                )
            )
        }, USER_CODE_WRITTEN_INTERVAL)
    }

    private getEventDataAndRotate(): UserWrittenPercentageEvent[] {
        const previousBuckets = this.rotate()
        return Object.keys(previousBuckets)
            .filter(languageId => previousBuckets[languageId]?.invocationCount > 0)
            .map(languageId => {
                const bucket = previousBuckets[languageId]
                return {
                    codewhispererLanguage: languageId,
                    userWrittenCodeCharacterCount: bucket.userWrittenCodeCharacterCount,
                    userWrittenCodeLineCount: bucket.userWrittenCodeLineCount,
                }
            })
    }

    private rotate() {
        const previous = this.buckets
        this.buckets = {}
        return previous
    }

    public recordUsageCount(languageId: string) {
        const languageBucket = this.getLanguageBucket(languageId)
        languageBucket.invocationCount++
        this._lastQInvocationTime = performance.now()
    }

    public onQStartsMakingEdits() {
        this._qIsMakingEdits = true
    }

    public onQFinishesEdits() {
        this._qIsMakingEdits = false
    }

    public reset() {
        this._qIsMakingEdits = false
        this._lastQInvocationTime = 0
    }

    private countNewLines(str: string) {
        return str.split('\n').length - 1
    }

    public countUserWrittenTokens(languageId: string, tokens: string) {
        if (this._qIsMakingEdits) {
            // if the boolean of qIsMakingEdits was incorrectly set to true
            // due to unhandled edge cases or early terminated code paths
            // reset it back to false after a reasonable period of time
            if (performance.now() - this._lastQInvocationTime > RESET_Q_EDITING_THRESHOLD) {
                this._qIsMakingEdits = false
            }
            return
        }
        const languageBucket = this.getLanguageBucket(languageId)
        // if user copies code into the editor for more than 50 characters
        // do not count this as total new code, this will skew the data,
        // reporting highly inflated user written code
        if (tokens.length > INSERT_CUTOFF_THRESHOLD) {
            return
        }

        languageBucket.userWrittenCodeCharacterCount += tokens.length
        languageBucket.userWrittenCodeLineCount += this.countNewLines(tokens)
    }

    private getLanguageBucket(languageId: string): TelemetryBuckets[string] {
        if (!this.buckets[languageId]) {
            this.buckets[languageId] = {
                userWrittenCodeCharacterCount: 0,
                userWrittenCodeLineCount: 0,
                invocationCount: 0,
            }
        }

        return this.buckets[languageId]
    }

    dispose(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId)
            this.intervalId = undefined
        }
        this.reset()
        UserWrittenCodeTracker.instance = undefined
    }
}
