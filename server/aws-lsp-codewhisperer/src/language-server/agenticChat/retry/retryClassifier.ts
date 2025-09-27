import { Logging } from '@aws/language-server-runtimes/server-interface'
import { isRequestAbortedError, isInputTooLongError, isThrottlingRelated } from '../errors'
import {
    MONTHLY_LIMIT_ERROR_MARKER,
    HIGH_LOAD_ERROR_MESSAGE,
    SERVICE_UNAVAILABLE_EXCEPTION,
    HTTP_STATUS_INTERNAL_SERVER_ERROR,
    INSUFFICIENT_MODEL_CAPACITY,
    CONTENT_LENGTH_EXCEEDS_THRESHOLD,
} from '../constants/constants'

export enum RetryAction {
    NoActionIndicated = 'no_action',
    RetryForbidden = 'retry_forbidden',
    ThrottlingError = 'throttling_error',
}

export interface RetryClassifierPriority {
    value: number
}

export interface InterceptorContext {
    error: any
    response?: {
        status?: number
        body?: string | Uint8Array
    }
}

/**
 * Retry classifier that matches CLI's QCliRetryClassifier behavior.
 * Runs after AWS SDK's transient error classifier with higher priority.
 */
export class QRetryClassifier {
    private logging?: Logging

    constructor(logging?: Logging) {
        this.logging = logging
    }

    static priority(): RetryClassifierPriority {
        // Run after transient error classifier (higher priority number)
        return { value: 100 }
    }

    classifyRetry(context: InterceptorContext): RetryAction {
        const error = context.error

        // Handle non-retryable errors first (matching original + enhanced detection)
        if (
            error?.name === 'AbortError' ||
            error?.code === 'RequestAborted' ||
            error?.name === 'RequestAborted' ||
            isRequestAbortedError(error)
        ) {
            return RetryAction.RetryForbidden
        }

        if (error?.reason === CONTENT_LENGTH_EXCEEDS_THRESHOLD || isInputTooLongError(error)) {
            return RetryAction.RetryForbidden
        }

        // Check for monthly limit error in error object
        if (this.isMonthlyLimitError(error)) {
            return RetryAction.RetryForbidden
        }

        const bodyStr = this.extractResponseBody(context)
        if (bodyStr && this.isServiceOverloadedError(context, bodyStr)) {
            return RetryAction.ThrottlingError
        }

        // Check for model capacity issues
        const status = context.response?.status || context.error?.$metadata?.httpStatusCode
        if (status === 429 && error?.reason === INSUFFICIENT_MODEL_CAPACITY) {
            return RetryAction.ThrottlingError
        }

        // Check for throttling related errors (from errors.ts)
        if (isThrottlingRelated(error)) {
            return RetryAction.ThrottlingError
        }

        return RetryAction.NoActionIndicated
    }

    private extractResponseBody(context: InterceptorContext): string | null {
        // Try context response first
        const contextBody = this.extractTextFromBody(context.response?.body)
        if (contextBody) return contextBody

        // Fallback to error-based extraction
        const error = context.error
        return (
            error?.message ||
            this.extractTextFromBody(error?.cause?.$metadata?.body) ||
            this.extractTextFromBody(error?.$metadata?.body) ||
            this.extractTextFromBody(error?.cause?.body) ||
            this.extractTextFromBody(error?.body) ||
            this.extractTextFromBody(error?.response?.data) ||
            this.extractTextFromBody(error?.response?.body) ||
            null
        )
    }

    private extractTextFromBody(body: any): string | null {
        try {
            if (typeof body === 'string') {
                return body
            }
            if (body instanceof Uint8Array) {
                const decoded = new TextDecoder('utf-8', { fatal: false }).decode(body)
                return decoded || null
            }
            if (body instanceof ArrayBuffer) {
                return new TextDecoder('utf-8', { fatal: false }).decode(body)
            }
            if (typeof body === 'object' && body !== null) {
                return JSON.stringify(body)
            }
            return null
        } catch {
            return null
        }
    }

    private isMonthlyLimitError(error: any): boolean {
        const isMonthlyLimit = error?.reason === MONTHLY_LIMIT_ERROR_MARKER
        this.logging?.debug(`QRetryClassifier: Monthly limit error detected: ${isMonthlyLimit}`)
        return isMonthlyLimit
    }

    private isServiceOverloadedError(context: InterceptorContext, bodyStr: string): boolean {
        const status = context.response?.status || context.error?.status || context.error?.$metadata?.httpStatusCode

        if (status !== HTTP_STATUS_INTERNAL_SERVER_ERROR) {
            return false
        }

        const isOverloaded =
            bodyStr.includes(HIGH_LOAD_ERROR_MESSAGE) || bodyStr.includes(SERVICE_UNAVAILABLE_EXCEPTION)

        this.logging?.debug(`QRetryClassifier: Service overloaded error detected (status 500): ${isOverloaded}`)
        return isOverloaded
    }

    name(): string {
        return 'Q Language Server Retry Classifier'
    }

    priority(): RetryClassifierPriority {
        return QRetryClassifier.priority()
    }
}
