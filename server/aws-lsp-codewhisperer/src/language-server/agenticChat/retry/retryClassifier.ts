import { loggingUtils } from '@aws/lsp-core'
import { Logging } from '@aws/language-server-runtimes/server-interface'
import { isUsageLimitError, isAwsThrottlingError } from '../../../shared/utils'

const MONTHLY_LIMIT_ERROR_MARKER = 'MONTHLY_REQUEST_COUNT'
const HIGH_LOAD_ERROR_MESSAGE = 'Encountered unexpectedly high load when processing the request, please try again.'
const SERVICE_UNAVAILABLE_EXCEPTION = 'ServiceUnavailableException'

export enum RetryAction {
    RetryForbidden = 'RetryForbidden',
    ThrottlingError = 'ThrottlingError',
    TransientError = 'TransientError',
    NoActionIndicated = 'NoActionIndicated',
}

export class QRetryClassifier {
    private logging?: Logging

    constructor(logging?: Logging) {
        this.logging = logging
    }

    private isRequestAbortedError(error: any): boolean {
        return error?.name === 'AbortError' || error?.code === 'RequestAborted'
    }

    private isInputTooLongError(error: any): boolean {
        return error?.code === 'InputTooLong' || error?.message?.includes('input too long')
    }

    private extractResponseBody(error: any): string | null {
        try {
            // Try to get response body from various error formats
            if (error.cause?.$response?.body) {
                return error.cause.$response.body
            }
            if (error.$response?.body) {
                return error.$response.body
            }
            if (error.message) {
                return error.message
            }
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

    private isServiceOverloadedError(error: any, bodyStr: string): boolean {
        const statusCode = this.getStatusCode(error)

        if (statusCode !== 500) {
            return false
        }

        const isOverloaded =
            bodyStr.includes(HIGH_LOAD_ERROR_MESSAGE) || bodyStr.includes(SERVICE_UNAVAILABLE_EXCEPTION)

        this.logging?.debug(`QRetryClassifier: Service overloaded error detected (status 500): ${isOverloaded}`)
        return isOverloaded
    }

    private getStatusCode(error: any): number | null {
        try {
            if (error.cause?.$metadata?.httpStatusCode) {
                return error.cause.$metadata.httpStatusCode
            }
            if (error.$metadata?.httpStatusCode) {
                return error.$metadata.httpStatusCode
            }
            if (error.statusCode) {
                return error.statusCode
            }
            return null
        } catch {
            return null
        }
    }

    classifyRetry(error: any): RetryAction {
        // Handle existing error types from the language server
        if (isUsageLimitError(error)) {
            return RetryAction.RetryForbidden
        }

        if (this.isRequestAbortedError(error)) {
            return RetryAction.RetryForbidden
        }

        if (this.isInputTooLongError(error)) {
            return RetryAction.RetryForbidden
        }

        if (isAwsThrottlingError(error)) {
            return RetryAction.ThrottlingError
        }

        const bodyStr = this.extractResponseBody(error)

        if (bodyStr) {
            if (this.isMonthlyLimitError(bodyStr)) {
                return RetryAction.RetryForbidden
            }

            if (this.isServiceOverloadedError(error, bodyStr)) {
                return RetryAction.ThrottlingError
            }
        }

        // Check for model unavailability patterns (from existing code)
        const statusCode = this.getStatusCode(error)
        if (statusCode === 500 && error.message?.includes('Encountered unexpectedly high load')) {
            return RetryAction.ThrottlingError
        }

        if (statusCode === 429 && error.cause?.reason === 'INSUFFICIENT_MODEL_CAPACITY') {
            return RetryAction.ThrottlingError
        }

        // Network timeouts and transient errors
        if (statusCode && statusCode >= 500 && statusCode <= 504) {
            return RetryAction.TransientError
        }

        return RetryAction.NoActionIndicated
    }

    name(): string {
        return 'Q Language Server Custom Retry Classifier'
    }
}
