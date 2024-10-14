// NOTE: This and other code in the aws-lsp-identity may make sense to move to a more common location
// in language-servers in the future.  They are retained here for expediency in the project for which
// they are being added and to incubate if needed.

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

// A convenience function to reduce the amount of code need for one-liner try/catch blocks as well
// as make declarations of consts for results of a call that must occur inside a try block.
export async function tryAsync<R, E extends Error>(tryIt: () => Promise<R>, catchIt: (error: Error) => E): Promise<R> {
    try {
        return await tryIt()
    } catch (error) {
        throw catchIt(error instanceof Error ? error : new Error(error?.toString() ?? 'Unknown error'))
    }
}
