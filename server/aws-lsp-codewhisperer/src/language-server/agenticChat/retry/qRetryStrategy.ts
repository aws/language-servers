import { RetryStrategyV2, RetryToken } from '@aws-sdk/types'
import { QRetryClassifier, RetryAction } from './retryClassifier'
import { QDelayTrackingInterceptor } from './delayInterceptor'
import { Logging } from '@aws/language-server-runtimes/server-interface'
import { sanitizeLogInput } from '../../../shared/utils'

/**
 * Custom retry strategy that integrates Q-specific retry classification and delay tracking
 */
export class QRetryStrategy implements RetryStrategyV2 {
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
        this.retryClassifier = retryClassifier
        this.delayInterceptor = delayInterceptor
        this.maxAttempts = maxAttempts
        this.logging = logging
    }

    async acquireInitialRetryToken(retryTokenScope: string): Promise<RetryToken> {
        this.attemptCount = 0
        const sanitizedScope = sanitizeLogInput(retryTokenScope)
        this.logging?.log(
            `QRetryStrategy: Initial retry token acquired for scope: ${sanitizedScope}, attempt count reset to 0`
        )
        return {
            getRetryCount: () => 0,
            getRetryDelay: () => 0,
        }
    }

    async refreshRetryTokenForRetry(
        token: RetryToken,
        errorInfo: { error?: any; errorType?: string }
    ): Promise<RetryToken> {
        const currentAttempt = token.getRetryCount() + 1
        this.attemptCount = currentAttempt

        const errorCode = sanitizeLogInput(errorInfo.error?.code || errorInfo.error?.name || 'Unknown')
        this.logging?.log(`QRetryStrategy: Retry attempt ${currentAttempt} for error: ${errorCode}`)

        // Apply Q-specific retry classification
        const context = { error: errorInfo.error, response: errorInfo.error?.response }
        const action = this.retryClassifier.classifyRetry(context)
        this.logging?.log(`QRetryStrategy: Retry classification result: ${action}`)

        // Check if we should retry based on Q classification
        if (action === RetryAction.RetryForbidden) {
            this.logging?.log(`QRetryStrategy: Retry forbidden, stopping retries after ${currentAttempt} attempts`)
            throw errorInfo.error
        }

        // Check max attempts
        if (currentAttempt >= this.maxAttempts) {
            this.logging?.log(`QRetryStrategy: Max attempts (${this.maxAttempts}) reached, stopping retries`)
            throw errorInfo.error
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(300 * Math.pow(2, currentAttempt), 10000)
        this.logging?.log(`QRetryStrategy: Calculated delay: ${delay}ms for next attempt ${currentAttempt + 1}`)

        // Track delay for UI notifications - CALL BEFORE ATTEMPT
        this.delayInterceptor.beforeAttempt(currentAttempt + 1)

        return {
            getRetryCount: () => currentAttempt,
            getRetryDelay: () => delay,
        }
    }

    async recordSuccess(token: RetryToken): Promise<void> {
        try {
            this.logging?.log(`QRetryStrategy: Request succeeded after ${this.attemptCount + 1} total attempts`)
            // Reset delay tracking on success
            this.delayInterceptor.reset()
            this.attemptCount = 0
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
