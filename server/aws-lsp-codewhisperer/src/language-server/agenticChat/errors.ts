type AgenticChatErrorCode = 'QModelResponse' | 'AmazonQServiceManager' | 'FailedResult' | 'MaxAgentLoopIterations'

export class AgenticChatError extends Error {
    constructor(
        message: string,
        public readonly code: AgenticChatErrorCode,
        cause?: Error
    ) {
        super(message, { cause: cause })
    }
}

export function wrapErrorWithCode(error: unknown, code: AgenticChatErrorCode) {
    if (error instanceof Error) {
        return new AgenticChatError(error.message, code, error)
    }
    return new AgenticChatError(String(error), code)
}
