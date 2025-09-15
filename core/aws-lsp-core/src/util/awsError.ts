// This class should be used when throwing errors in most of the codebase.  Only the server class should
// work directly with the LSP-specific AwsResponseError class.  This allows passing an awsErrorCode along
// with the error to be reported back to the client via AwsResponseError.
export class AwsError extends Error {
    readonly awsErrorCode: string

    constructor(message: string, awsErrorCode: string, options?: ErrorOptions) {
        super(message, options)
        Object.setPrototypeOf(this, new.target.prototype)
        this.awsErrorCode = awsErrorCode
    }

    // Either wraps the received error in an AwsError or passes it along as-is if it is an AwsError.
    // This helps write clean code where the dependency call stack can be deeply nested and may throw
    // AwsErrors at any level of it.  The innermost AwsError (i.e. focused on the failure site) is
    // preserved.  If a non-AwsError is passed, it is wrapped and the provided awsErrorCode is set.
    // This is useful where library calls are made that may throw errors.  It is also reasonable to
    // directly instantiate and throw this class at times (e.g. validation errors).
    static wrap(error: Error, awsErrorCode: string): AwsError {
        return error instanceof AwsError
            ? error
            : new AwsError(error?.message ?? 'Unknown error', awsErrorCode, { cause: error })
    }
}

const expiredMessage = 'token expired'
const cancelledMessage = 'token cancelled'
type CancellationAgent = 'user' | 'timeout'
export class CancellationError extends Error {
    public constructor(public readonly agent: CancellationAgent) {
        super(agent === 'user' ? cancelledMessage : expiredMessage)
    }

    public static isUserCancelled(err: any): err is CancellationError & { agent: 'user' } {
        return err instanceof CancellationError && err.agent === 'user'
    }

    public static isExpired(err: any): err is CancellationError & { agent: 'timeout' } {
        return err instanceof CancellationError && err.agent === 'timeout'
    }
}
