export function asyncCallWithTimeout<T>(asyncPromise: Promise<T>, message: string, timeLimit: number): Promise<T> {
    let timeoutHandle: NodeJS.Timeout
    const timeoutPromise = new Promise((_resolve, reject) => {
        timeoutHandle = setTimeout(() => reject(new Error(message)), timeLimit)
    })
    return Promise.race([asyncPromise, timeoutPromise]).then(result => {
        clearTimeout(timeoutHandle)
        return result as T
    })
}

/**
 * Sleeps for the specified duration in milliseconds. Note that a duration of 0 will always wait 1 event loop.
 *
 * Attempts to use the extension-scoped `setTimeout` if it exists, otherwise will fallback to the global scheduler.
 */
// Todo: duplicate function. remove it when other PRs are merged
export function sleep(duration = 0): Promise<void> {
    return new Promise(r => setTimeout(r, Math.max(duration, 0)))
}
