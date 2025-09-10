import { Logging } from '@aws/language-server-runtimes/server-interface'
import { isUsageLimitError, isAwsThrottlingError, getRequestID } from '../../../shared/utils'
import { AgenticChatError, isThrottlingRelated, isRequestAbortedError, isInputTooLongError } from '../errors'

import {
    HTTP_STATUS_TOO_MANY_REQUESTS,
    HTTP_STATUS_INTERNAL_SERVER_ERROR,
    MONTHLY_LIMIT_ERROR_MARKER,
    HIGH_LOAD_ERROR_MESSAGE,
    SERVICE_UNAVAILABLE_EXCEPTION,
    INSUFFICIENT_MODEL_CAPACITY,
    MAX_REQUEST_ATTEMPTS,
} from '../constants/constants'

/**
 * Q-specific error transformation for AWS SDK native retry.
 * AWS SDK handles retries, this transforms final errors into user-friendly Q messages.
 */
export class QErrorTransformer {
    private logging?: Logging
    private isModelSelectionEnabled: boolean

    constructor(logging?: Logging, isModelSelectionEnabled: boolean = false) {
        this.logging = logging
        this.isModelSelectionEnabled = isModelSelectionEnabled
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

    public transformFinalError(error: any, attemptCount?: number): Error {
        // Use default attempt count if not provided
        const attempts = attemptCount ?? MAX_REQUEST_ATTEMPTS
        const requestId = getRequestID(error)

        // Handle specific error types with retry context
        if (isUsageLimitError(error)) {
            return new AgenticChatError(
                `Request failed after ${attempts} attempts`,
                'AmazonQUsageLimitError',
                error instanceof Error ? error : undefined,
                requestId
            )
        }

        // Check response body for monthly limits
        const bodyStr = this.extractResponseBody(error)
        if (bodyStr && bodyStr.includes(MONTHLY_LIMIT_ERROR_MARKER)) {
            return new AgenticChatError(
                `Request failed after ${attempts} attempts`,
                'AmazonQUsageLimitError',
                error instanceof Error ? error : undefined,
                requestId
            )
        }

        if (error?.name === 'AbortError' || error?.code === 'RequestAborted' || isRequestAbortedError(error)) {
            return new AgenticChatError(
                'Request aborted',
                'RequestAborted',
                error instanceof Error ? error : undefined,
                requestId
            )
        }

        if (
            error?.code === 'InputTooLong' ||
            error?.message?.includes('input too long') ||
            isInputTooLongError(error)
        ) {
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
            (statusCode === HTTP_STATUS_TOO_MANY_REQUESTS && error.cause?.reason === INSUFFICIENT_MODEL_CAPACITY) ||
            (statusCode === HTTP_STATUS_INTERNAL_SERVER_ERROR && error.message === HIGH_LOAD_ERROR_MESSAGE)

        if (isModelUnavailable) {
            const message = this.isModelSelectionEnabled
                ? `The model you selected is temporarily unavailable after ${attempts} attempts. Please switch to a different model and try again.`
                : `I am experiencing high traffic after ${attempts} attempts, please try again shortly.`

            return new AgenticChatError(
                message,
                'QModelResponse',
                error instanceof Error ? error : undefined,
                requestId
            )
        }

        if (isAwsThrottlingError(error) || isThrottlingRelated(error) || this.isThrottlingError(error)) {
            return new AgenticChatError(
                `Service is currently experiencing high traffic. Request failed after ${attempts} attempts. Please try again later.`,
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
        if (statusCode === HTTP_STATUS_TOO_MANY_REQUESTS || error?.code === 'ThrottlingException') return true

        // Check for service overloaded errors (status 500 with specific messages)
        if (statusCode === HTTP_STATUS_INTERNAL_SERVER_ERROR) {
            const bodyStr = this.extractResponseBody(error)
            if (bodyStr) {
                const isOverloaded =
                    bodyStr.includes(HIGH_LOAD_ERROR_MESSAGE) || bodyStr.includes(SERVICE_UNAVAILABLE_EXCEPTION)
                this.logging?.debug(
                    `QErrorTransformer: Service overloaded error detected (status 500): ${isOverloaded}`
                )
                return isOverloaded
            }

            // Direct message check for high load
            if (
                error.message === HIGH_LOAD_ERROR_MESSAGE ||
                error.message?.includes('Encountered unexpectedly high load')
            ) {
                return true
            }
        }

        // Model capacity issues
        if (statusCode === HTTP_STATUS_TOO_MANY_REQUESTS && error.cause?.reason === INSUFFICIENT_MODEL_CAPACITY) {
            return true
        }

        return false
    }

    private getStatusCode(error: any): number | undefined {
        try {
            // Enhanced extraction
            if (error.cause?.$metadata?.httpStatusCode) return error.cause.$metadata.httpStatusCode
            if (error.$metadata?.httpStatusCode) return error.$metadata.httpStatusCode
            if (error.statusCode) return error.statusCode
            if (error?.status) return error.status
            if (error?.$response?.statusCode) return error.$response.statusCode
            if (error?.cause?.$response?.statusCode) return error.cause.$response.statusCode
            if (error?.response?.status) return error.response.status
            return undefined
        } catch {
            return undefined
        }
    }
}
