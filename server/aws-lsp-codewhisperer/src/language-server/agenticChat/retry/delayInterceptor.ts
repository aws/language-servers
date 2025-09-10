import { Logging } from '@aws/language-server-runtimes/server-interface'

export interface DelayNotification {
    message: string
    attemptNumber: number
    delay: number
    thresholdExceeded: boolean
}

/**
 * Delay tracking interceptor that matches CLI's DelayTrackingInterceptor behavior.
 * Tracks retry delays and provides user notifications.
 */
export class QDelayTrackingInterceptor {
    private logging?: Logging
    private minorDelayThreshold: number = 2000 // 2 seconds
    private majorDelayThreshold: number = 5000 // 5 seconds
    private maxRetryDelay: number = 10000 // 10 seconds
    private lastAttemptTime?: number
    private onDelayNotification?: (notification: DelayNotification) => void

    constructor(logging?: Logging) {
        this.logging = logging
    }

    /**
     * Sets the delay notification callback for UI integration
     */
    public setDelayNotificationCallback(callback: (notification: DelayNotification) => void): void {
        this.logging?.debug(`QDelayTrackingInterceptor: setDelayNotificationCallback called`)
        this.onDelayNotification = callback
    }

    /**
     * Called before each request attempt to track delays and notify users
     */
    public beforeAttempt(attemptNumber: number): void {
        this.logging?.debug(`QDelayTrackingInterceptor: Attempt ${attemptNumber}`)
        const now = Date.now()

        if (this.lastAttemptTime && attemptNumber > 1) {
            const delay = Math.min(now - this.lastAttemptTime, this.maxRetryDelay)
            this.logging?.debug(
                `QDelayTrackingInterceptor: Delay ${delay}ms, thresholds: minor=${this.minorDelayThreshold}ms, major=${this.majorDelayThreshold}ms`
            )

            let message: string
            if (delay >= this.majorDelayThreshold) {
                message = `Retry #${attemptNumber}, retrying within ${Math.ceil(this.maxRetryDelay / 1000)}s..`
            } else if (delay >= this.minorDelayThreshold) {
                message = `Retry #${attemptNumber}, retrying within 5s..`
            } else {
                // No notification for short delays
                this.logging?.debug(`QDelayTrackingInterceptor: Delay ${delay}ms below threshold, no notification`)
                this.lastAttemptTime = now
                return
            }

            this.logging?.debug(`QDelayTrackingInterceptor: Delay message: ${message}`)

            // Notify UI about the delay
            if (this.onDelayNotification) {
                this.logging?.debug(`QDelayTrackingInterceptor: Sending delay notification`)
                this.onDelayNotification({
                    message,
                    attemptNumber,
                    delay: Math.ceil(delay / 1000),
                    thresholdExceeded: delay >= this.minorDelayThreshold,
                })
            } else {
                this.logging?.debug(`QDelayTrackingInterceptor: No delay notification callback set`)
            }
        } else {
            this.logging?.debug(
                `QDelayTrackingInterceptor: First attempt or no lastAttemptTime, skipping delay calculation`
            )
        }

        this.lastAttemptTime = now
    }

    /**
     * Reset tracking state
     */
    public reset(): void {
        this.lastAttemptTime = undefined
    }

    public name(): string {
        return 'Q Language Server Delay Tracking Interceptor'
    }
}
