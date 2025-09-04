import { AgenticChatError, wrapErrorWithCode } from '../../agenticChat/errors'
import { getRequestID, isUsageLimitError, isAwsThrottlingError } from '../../../shared/utils'
import { RetryAction } from './retryClassifier'

export class RetryErrorHandler {
    private isModelSelectionEnabled: boolean

    constructor(isModelSelectionEnabled: boolean = false) {
        this.isModelSelectionEnabled = isModelSelectionEnabled
    }

    private isRequestAbortedError(error: any): boolean {
        return error?.name === 'AbortError' || error?.code === 'RequestAborted'
    }

    private isInputTooLongError(error: any): boolean {
        return error?.code === 'InputTooLong' || error?.message?.includes('input too long')
    }

    /**
     * Transform errors after retry attempts are exhausted
     * Preserves existing error handling while adding retry context
     */
    transformFinalError(error: any, attemptCount: number, retryAction: RetryAction): Error {
        const requestId = getRequestID(error)

        // Handle existing error types with retry context
        if (isUsageLimitError(error)) {
            return new AgenticChatError(
                `Request failed after ${attemptCount} attempts`,
                'AmazonQUsageLimitError',
                error instanceof Error ? error : undefined,
                requestId
            )
        }

        if (this.isRequestAbortedError(error)) {
            return new AgenticChatError(
                'Request aborted',
                'RequestAborted',
                error instanceof Error ? error : undefined,
                requestId
            )
        }

        if (this.isInputTooLongError(error)) {
            return new AgenticChatError(
                'Too much context loaded. I have cleared the conversation history. Please retry your request with smaller input.',
                'InputTooLong',
                error instanceof Error ? error : undefined,
                requestId
            )
        }

        if (isAwsThrottlingError(error) || retryAction === RetryAction.ThrottlingError) {
            return new AgenticChatError(
                `Service is currently experiencing high traffic. Request failed after ${attemptCount} attempts. Please try again later.`,
                'RequestThrottled',
                error instanceof Error ? error : undefined,
                requestId
            )
        }

        // Handle model unavailability with retry context
        let wrappedError = wrapErrorWithCode(error, 'QModelResponse')

        const statusCode = this.getStatusCode(error)
        const isModelUnavailable = this.isModelUnavailableError(error, statusCode)

        if (isModelUnavailable) {
            wrappedError.message = this.isModelSelectionEnabled
                ? `The model you selected is temporarily unavailable after ${attemptCount} attempts. Please switch to a different model and try again.`
                : `I am experiencing high traffic after ${attemptCount} attempts, please try again shortly.`
        }

        return wrappedError
    }

    private getStatusCode(error: any): number | null {
        try {
            if (error.cause?.$metadata?.httpStatusCode) {
                return error.cause.$metadata.httpStatusCode
            }
            if (error.$metadata?.httpStatusCode) {
                return error.$metadata.httpStatusCode
            }
            return null
        } catch {
            return null
        }
    }

    private isModelUnavailableError(error: any, statusCode: number | null): boolean {
        // Check for model unavailability patterns
        const hasInsufficientCapacity =
            error.cause &&
            typeof error.cause === 'object' &&
            '$metadata' in error.cause &&
            statusCode === 429 &&
            'reason' in error.cause &&
            error.cause.reason === 'INSUFFICIENT_MODEL_CAPACITY'

        const hasHighLoadMessage =
            statusCode === 500 &&
            error.message === 'Encountered unexpectedly high load when processing the request, please try again.'

        return hasInsufficientCapacity || hasHighLoadMessage
    }
}
