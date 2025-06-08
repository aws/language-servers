import { CodeWhispererStreamingServiceException } from '@aws/codewhisperer-streaming-client'

type AgenticChatErrorCode =
    | 'QModelResponse' // generic backend error.
    | 'AmazonQServiceManager' // AmazonQServiceManager failed to initialize.
    | 'FailedResult' // general error when processing tool results
    | 'InputTooLong' // too much context given to backend service.
    | 'PromptCharacterLimit' // customer prompt exceeds
    | 'ResponseProcessingTimeout' // response didn't finish streaming in the allowed time
    | 'RequestAborted' // request was aborted by the user

export const customerFacingErrorCodes: AgenticChatErrorCode[] = [
    'QModelResponse',
    'InputTooLong',
    'PromptCharacterLimit',
]

export const unactionableErrorCodes: Partial<Record<AgenticChatErrorCode, string>> = {
    PromptCharacterLimit: 'User prompt contains too many characters',
}

export class AgenticChatError extends Error {
    constructor(
        message: string,
        public readonly code: AgenticChatErrorCode,
        cause?: Error,
        public readonly requestId?: string
    ) {
        super(message, { cause: cause })
    }
}

export function wrapErrorWithCode(error: unknown, code: AgenticChatErrorCode) {
    if (error instanceof CodeWhispererStreamingServiceException) {
        return new AgenticChatError(error.message, code, error, error.$metadata?.requestId)
    }

    if (error instanceof Error) {
        return new AgenticChatError(error.message, code, error)
    }
    return new AgenticChatError(String(error), code)
}

export function isInputTooLongError(error: unknown): boolean {
    if (error instanceof AgenticChatError && error.code === 'InputTooLong') {
        return true
    }

    if (error instanceof Error) {
        //  This is fragile (breaks if the backend changes their error message wording)
        return error.message.includes('Input is too long')
    }

    return false
}

export function isRequestAbortedError(error: unknown): boolean {
    if (error instanceof AgenticChatError && error.code === 'RequestAborted') {
        return true
    }

    if (error instanceof Error) {
        //  This is fragile (breaks if the backend changes their error message wording)
        return error.message.includes('Request aborted')
    }

    return false
}
