import { RetryToken, RetryErrorInfo, RetryErrorType } from '@aws-sdk/types'
import { AdaptiveRetryStrategy } from '@smithy/util-retry'
import { StandardRetryToken } from '@smithy/types'
import { QRetryClassifier, RetryAction } from './retryClassifier'
import { QDelayTrackingInterceptor } from './delayInterceptor'
import { Logging } from '@aws/language-server-runtimes/server-interface'
import { sanitizeLogInput } from '../../../shared/utils'

/**
 * Custom retry strategy that extends AWS SDK v3's AdaptiveRetryStrategy with Q-specific logic
 */
export class QRetryStrategy extends AdaptiveRetryStrategy {
    private retryClassifier: QRetryClassifier
    private delayInterceptor: QDelayTrackingInterceptor
    private maxAttempts: number
    private logging?: Logging
    private attemptCount: number = 0

    constructor(
        retryClassifier: QRetryClassifier,
        delayInterceptor: QDelayTrackingInterceptor,
        maxAttempts: number = 3,
        logging?: Logging
    ) {
        super(() => Promise.resolve(maxAttempts))
        this.retryClassifier = retryClassifier
        this.delayInterceptor = delayInterceptor
        this.maxAttempts = maxAttempts
        this.logging = logging
    }

    override async acquireInitialRetryToken(retryTokenScope: string): Promise<RetryToken> {
        this.attemptCount = 0
        this.logging?.log(
            `QRetryStrategy: Initial retry token acquired for scope: ${retryTokenScope}, attempt count reset to 0`
        )
        // AdaptiveRetryStrategy returns StandardRetryToken, but interface expects RetryToken
        return super.acquireInitialRetryToken(retryTokenScope)
    }

    override async refreshRetryTokenForRetry(token: RetryToken, errorInfo: RetryErrorInfo): Promise<RetryToken> {
        const currentAttempt = token.getRetryCount() + 1
        this.attemptCount = currentAttempt

        const errorCode = sanitizeLogInput(
            (errorInfo.error as any)?.name || (errorInfo.error as any)?.code || 'Unknown'
        )
        this.logging?.log(`QRetryStrategy: Retry attempt ${currentAttempt} for error: ${errorCode}`)

        // Apply Q-specific retry classification
        const context = { error: errorInfo.error, response: (errorInfo.error as any)?.$response }
        const action = this.retryClassifier.classifyRetry(context)
        this.logging?.log(`QRetryStrategy: Retry classification result: ${action}`)

        // Check if we should retry based on Q classification
        if (action === RetryAction.RetryForbidden) {
            this.logging?.log(`QRetryStrategy: Retry forbidden, stopping retries after ${currentAttempt} attempts`)
            throw errorInfo.error
        }

        // Track delay for UI notifications - CALL BEFORE ATTEMPT
        this.delayInterceptor.beforeAttempt(currentAttempt + 1)

        // Delegate to adaptive strategy for delay calculation and max attempts check
        // AdaptiveRetryStrategy expects StandardRetryToken but we receive RetryToken
        // The token from acquireInitialRetryToken is actually StandardRetryToken, so this cast is safe
        return super.refreshRetryTokenForRetry(token as StandardRetryToken, errorInfo)
    }

    override recordSuccess(token: RetryToken): void {
        try {
            this.logging?.log(`QRetryStrategy: Request succeeded after ${this.attemptCount + 1} total attempts`)
            // Reset delay tracking on success
            this.delayInterceptor.reset()
            this.attemptCount = 0
            // Call parent to maintain adaptive strategy state
            // Token is actually StandardRetryToken from AdaptiveRetryStrategy
            super.recordSuccess(token as StandardRetryToken)
        } catch (error) {
            // Log but don't throw - success recording should not fail
            this.logging?.log(`QRetryStrategy: Warning - failed to reset state after success: ${error}`)
        }
    }

    // Test helper method to get current attempt count
    public getAttemptCount(): number {
        return this.attemptCount
    }
}
