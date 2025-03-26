export class AsyncTimeoutError extends Error {}

/**
 * Call an async function and waits for either the result or timeout.
 * Throws AsyncTimeoutError with provided message if the call times out.
 */
export function asyncCallWithTimeout<T>(asyncPromise: Promise<T>, timeLimit: number, message: string): Promise<T> {
    let timeoutHandle: NodeJS.Timeout
    const timeoutPromise = new Promise((_resolve, reject) => {
        timeoutHandle = setTimeout(() => reject(new AsyncTimeoutError(message)), timeLimit)
    })
    return Promise.race([asyncPromise, timeoutPromise])
        .then(result => result as T)
        .finally(() => {
            clearTimeout(timeoutHandle)
        })
}
