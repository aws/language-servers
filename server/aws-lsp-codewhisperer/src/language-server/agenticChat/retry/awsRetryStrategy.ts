import { Logging } from '@aws/language-server-runtimes/server-interface'
import { isUsageLimitError, isAwsThrottlingError, getRequestID } from '../../../shared/utils'
import { AgenticChatError, isThrottlingRelated } from '../errors'

const MONTHLY_LIMIT_ERROR_MARKER = 'MONTHLY_REQUEST_COUNT'
const HIGH_LOAD_ERROR_MESSAGE = 'Encountered unexpectedly high load when processing the request, please try again.'
const SERVICE_UNAVAILABLE_EXCEPTION = 'ServiceUnavailableException'

export interface DelayNotification {
    type: 'initial_delay' | 'retry_delay' | 'summary'
    delayMs: number
    attemptNumber: number
    message: string
    thresholdExceeded: boolean
}

/**
 * Simplified retry strategy that matches CLI behavior exactly.
 * Uses AWS SDK's adaptive retry pattern: 3 attempts, exponential backoff, 10s max delay.
 */
export class AwsRetryStrategy {
    private logging?: Logging
    private onDelayNotification?: (notification: DelayNotification) => void
    private isModelSelectionEnabled: boolean

    constructor(
        maxAttempts: number = 3,
        logging?: Logging,
        onDelayNotification?: (notification: DelayNotification) => void,
        isModelSelectionEnabled: boolean = false
    ) {
        this.logging = logging
        this.onDelayNotification = onDelayNotification
        this.isModelSelectionEnabled = isModelSelectionEnabled
    }

    async executeWithRetry<T>(
        operation: () => Promise<T>,
        operationName: string,
        abortSignal?: AbortSignal
    ): Promise<T> {
        let lastError: any

        for (let attempt = 1; attempt <= 3; attempt++) {
            // Check abort signal
            if (abortSignal?.aborted) {
                const abortError = new Error('Request aborted')
                abortError.name = 'AbortError'
                throw abortError
            }

            try {
                return await operation()
            } catch (error) {
                lastError = error
                this.logging?.debug(
                    `${operationName} attempt ${attempt} failed: ${error instanceof Error ? error.message : String(error)}`
                )

                // Check if error should not be retried
                if (this.shouldNotRetry(error) || attempt >= 3) {
                    throw this.transformFinalError(error, attempt)
                }

                // Calculate exponential backoff with jitter (matches AWS SDK adaptive strategy)
                const baseDelayMs = 1000 * Math.pow(2, attempt - 1) // 1s, 2s, 4s
                const jitter = 0.5 + Math.random() * 0.5 // 50-100% jitter
                const delayMs = Math.min(baseDelayMs * jitter, 10000) // 10s max

                // Notify about retry delays
                if (delayMs > 2000) {
                    this.notifyDelay({
                        type: 'retry_delay',
                        delayMs,
                        attemptNumber: attempt + 1,
                        message: `Retry #${attempt + 1} delayed by ${(delayMs / 1000).toFixed(1)}s`,
                        thresholdExceeded: true,
                    })
                }

                // Apply backoff delay
                await new Promise(resolve => setTimeout(resolve, delayMs))
            }
        }

        throw this.transformFinalError(lastError, 3)
    }

    private shouldNotRetry(error: any): boolean {
        // Monthly limits - never retry
        if (isUsageLimitError(error)) return true

        // User aborted - never retry
        if (error?.name === 'AbortError' || error?.code === 'RequestAborted') return true

        // Input too long - never retry
        if (error?.code === 'InputTooLong' || error?.message?.includes('input too long')) return true

        // Check response body for monthly limits - never retry
        const bodyStr = this.extractResponseBody(error)
        if (bodyStr) {
            if (bodyStr.includes(MONTHLY_LIMIT_ERROR_MARKER)) {
                this.logging?.debug(`AwsRetryStrategy: Monthly limit error detected: true`)
                return true
            }
        }

        return false
    }

    private extractResponseBody(error: any): string | null {
        try {
            if (error.cause?.$response?.body) return error.cause.$response.body
            if (error.$response?.body) return error.$response.body
            if (error.message) return error.message
            return null
        } catch {
            return null
        }
    }

    private transformFinalError(error: any, attemptCount: number): Error {
        const requestId = getRequestID(error)

        // Handle specific error types with retry context
        if (isUsageLimitError(error)) {
            return new AgenticChatError(
                `Request failed after ${attemptCount} attempts`,
                'AmazonQUsageLimitError',
                error instanceof Error ? error : undefined,
                requestId
            )
        }

        // Check response body for monthly limits
        const bodyStr = this.extractResponseBody(error)
        if (bodyStr && bodyStr.includes(MONTHLY_LIMIT_ERROR_MARKER)) {
            return new AgenticChatError(
                `Request failed after ${attemptCount} attempts`,
                'AmazonQUsageLimitError',
                error instanceof Error ? error : undefined,
                requestId
            )
        }

        if (error?.name === 'AbortError' || error?.code === 'RequestAborted') {
            return new AgenticChatError(
                'Request aborted',
                'RequestAborted',
                error instanceof Error ? error : undefined,
                requestId
            )
        }

        if (error?.code === 'InputTooLong' || error?.message?.includes('input too long')) {
            return new AgenticChatError(
                'Too much context loaded. I have cleared the conversation history. Please retry your request with smaller input.',
                'InputTooLong',
                error instanceof Error ? error : undefined,
                requestId
            )
        }

        // Check for model unavailability first (before general throttling)
        const statusCode = this.getStatusCode(error)
        const isModelUnavailable =
            (statusCode === 429 && error.cause?.reason === 'INSUFFICIENT_MODEL_CAPACITY') ||
            (statusCode === 500 &&
                error.message === 'Encountered unexpectedly high load when processing the request, please try again.')

        if (isModelUnavailable) {
            const message = this.isModelSelectionEnabled
                ? `The model you selected is temporarily unavailable after ${attemptCount} attempts. Please switch to a different model and try again.`
                : `I am experiencing high traffic after ${attemptCount} attempts, please try again shortly.`

            return new AgenticChatError(
                message,
                'QModelResponse',
                error instanceof Error ? error : undefined,
                requestId
            )
        }

        if (isAwsThrottlingError(error) || isThrottlingRelated(error) || this.isThrottlingError(error)) {
            return new AgenticChatError(
                `Service is currently experiencing high traffic. Request failed after ${attemptCount} attempts. Please try again later.`,
                'RequestThrottled',
                error instanceof Error ? error : undefined,
                requestId
            )
        }

        // Handle other errors - fallback to QModelResponse with request ID
        return new AgenticChatError(
            error instanceof Error ? error.message : String(error),
            'QModelResponse',
            error instanceof Error ? error : undefined,
            requestId
        )
    }

    private isThrottlingError(error: any): boolean {
        const statusCode = this.getStatusCode(error)

        // Check for AWS throttling patterns
        if (statusCode === 429 || error?.code === 'ThrottlingException') return true

        // Check for service overloaded errors (status 500 with specific messages)
        if (statusCode === 500) {
            const bodyStr = this.extractResponseBody(error)
            if (bodyStr) {
                const isOverloaded =
                    bodyStr.includes(HIGH_LOAD_ERROR_MESSAGE) || bodyStr.includes(SERVICE_UNAVAILABLE_EXCEPTION)
                this.logging?.debug(`AwsRetryStrategy: Service overloaded error detected (status 500): ${isOverloaded}`)
                return isOverloaded
            }

            // Direct message check for high load
            if (error.message?.includes('Encountered unexpectedly high load')) return true
        }

        // Model capacity issues
        if (statusCode === 429 && error.cause?.reason === 'INSUFFICIENT_MODEL_CAPACITY') return true

        return false
    }

    private getStatusCode(error: any): number | null {
        try {
            if (error.cause?.$metadata?.httpStatusCode) return error.cause.$metadata.httpStatusCode
            if (error.$metadata?.httpStatusCode) return error.$metadata.httpStatusCode
            if (error.statusCode) return error.statusCode
            return null
        } catch {
            return null
        }
    }

    private notifyDelay(notification: DelayNotification): void {
        this.logging?.info(`Delay notification: ${notification.message}`)
        this.onDelayNotification?.(notification)
    }
}
