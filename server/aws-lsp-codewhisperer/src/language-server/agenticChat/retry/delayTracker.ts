import { Logging } from '@aws/language-server-runtimes/server-interface'

export interface DelayNotification {
    type: 'initial_delay' | 'retry_delay' | 'summary'
    delayMs: number
    attemptNumber: number
    message: string
    thresholdExceeded: boolean
}

export class DelayTracker {
    private minorDelayThreshold: number = 2000 // 2 seconds
    private majorDelayThreshold: number = 5000 // 5 seconds
    private logging?: Logging
    private onNotification?: (notification: DelayNotification) => void

    constructor(logging?: Logging, onNotification?: (notification: DelayNotification) => void) {
        this.logging = logging
        this.onNotification = onNotification
    }

    private generateContextMessage(delayMs: number, isRetry: boolean): string {
        const delaySeconds = delayMs / 1000

        if (delaySeconds <= 2) {
            return 'Service is responding normally.'
        } else if (delaySeconds <= 5) {
            return 'Service may be experiencing light load.'
        } else if (delaySeconds <= 10) {
            return isRetry
                ? 'Service is throttling requests. Consider switching models.'
                : 'Service is applying rate limiting.'
        } else if (delaySeconds <= 20) {
            return 'Service is under heavy load. Delays may continue. Consider switching models.'
        } else {
            return 'Service is experiencing significant load. Consider trying again later.'
        }
    }

    trackInitialDelay(delayMs: number): void {
        if (delayMs >= this.minorDelayThreshold) {
            const message = `⏳ Request delayed by ${(delayMs / 1000).toFixed(1)}s due to rate limiting. ${this.generateContextMessage(delayMs, false)}`

            const notification: DelayNotification = {
                type: 'initial_delay',
                delayMs,
                attemptNumber: 1,
                message,
                thresholdExceeded: delayMs >= this.minorDelayThreshold,
            }

            this.logging?.info(`Initial request delayed: ${message}`)
            this.onNotification?.(notification)
        }
    }

    trackRetryDelay(delayMs: number, attemptNumber: number, previousDelayMs?: number): void {
        const shouldNotify = delayMs >= this.majorDelayThreshold || (previousDelayMs && delayMs >= previousDelayMs * 2)

        if (shouldNotify) {
            let message = `⚠️ Retry #${attemptNumber} delayed by ${(delayMs / 1000).toFixed(1)}s`

            if (previousDelayMs) {
                const change = delayMs > previousDelayMs ? 'increased' : 'decreased'
                message += ` (${change} from ${(previousDelayMs / 1000).toFixed(1)}s)`
            }

            message += `. ${this.generateContextMessage(delayMs, true)}`

            const notification: DelayNotification = {
                type: 'retry_delay',
                delayMs,
                attemptNumber,
                message,
                thresholdExceeded: true,
            }

            this.logging?.info(`Retry attempt delayed: ${message}`)
            this.onNotification?.(notification)
        }
    }

    summarizeDelayImpact(totalDelayMs: number, attemptCount: number, finalRetryDelayMs?: number): void {
        if (totalDelayMs >= this.majorDelayThreshold) {
            let message = `📊 Request completed with delays: total delay: ${(totalDelayMs / 1000).toFixed(1)}s, ${attemptCount} attempts`

            if (finalRetryDelayMs) {
                message += `, final retry delay: ${(finalRetryDelayMs / 1000).toFixed(1)}s`
            }

            const notification: DelayNotification = {
                type: 'summary',
                delayMs: totalDelayMs,
                attemptNumber: attemptCount,
                message,
                thresholdExceeded: true,
            }

            this.logging?.info(`Delay summary: ${message}`)
            this.onNotification?.(notification)
        }
    }
}
