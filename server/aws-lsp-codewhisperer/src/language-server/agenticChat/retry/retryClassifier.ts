import { Logging } from '@aws/language-server-runtimes/server-interface'
import { isRequestAbortedError, isInputTooLongError, isThrottlingRelated } from '../errors'
import {
    MONTHLY_LIMIT_ERROR_MARKER,
    HIGH_LOAD_ERROR_MESSAGE,
    SERVICE_UNAVAILABLE_EXCEPTION,
    HTTP_STATUS_INTERNAL_SERVER_ERROR,
    INSUFFICIENT_MODEL_CAPACITY,
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
        if (error?.name === 'AbortError' || error?.code === 'RequestAborted' || isRequestAbortedError(error)) {
            return RetryAction.RetryForbidden
        }

        if (
            error?.code === 'InputTooLong' ||
            error?.message?.includes('input too long') ||
            isInputTooLongError(error)
        ) {
            return RetryAction.RetryForbidden
        }

        const bodyStr = this.extractResponseBody(context)
        if (bodyStr) {
            if (this.isMonthlyLimitError(bodyStr)) {
                return RetryAction.RetryForbidden
            }

            if (this.isServiceOverloadedError(context, bodyStr)) {
                return RetryAction.ThrottlingError
            }
        }

        // Check for model capacity issues (from original)
        const status = context.response?.status || context.error?.statusCode
        if (status === 429 && error?.cause?.reason === INSUFFICIENT_MODEL_CAPACITY) {
            return RetryAction.ThrottlingError
        }

        // Check for throttling related errors (from errors.ts)
        if (isThrottlingRelated(error)) {
            return RetryAction.ThrottlingError
        }

        return RetryAction.NoActionIndicated
    }

    private extractResponseBody(context: InterceptorContext): string | null {
        try {
            // Try multiple extraction strategies
            if (context.response?.body) {
                if (typeof context.response.body === 'string') {
                    return context.response.body
                }
                if (context.response.body instanceof Uint8Array) {
                    return new TextDecoder().decode(context.response.body)
                }
            }

            // Fallback to error-based extraction
            const error = context.error
            if (error?.cause?.$response?.body) return error.cause.$response.body
            if (error?.$response?.body) return error.$response.body
            if (error?.message) return error.message

            return null
        } catch {
            return null
        }
    }

    private isMonthlyLimitError(bodyStr: string): boolean {
        const isMonthlyLimit = bodyStr.includes(MONTHLY_LIMIT_ERROR_MARKER)
        this.logging?.debug(`QRetryClassifier: Monthly limit error detected: ${isMonthlyLimit}`)
        return isMonthlyLimit
    }

    private isServiceOverloadedError(context: InterceptorContext, bodyStr: string): boolean {
        const status = context.response?.status || context.error?.status || context.error?.$response?.statusCode

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
