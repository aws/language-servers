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
// Ported from VSC https://github.com/aws/aws-toolkit-vscode/blob/91859e29b26ef1c58cbd957d81e1a0deb01a7880/packages/core/src/shared/utilities/timeoutUtils.ts#L246
interface WaitUntilOptions {
    /** Timeout in ms (default: 5000) */
    readonly timeout?: number
    /** Interval in ms between fn() checks (default: 500) */
    readonly interval?: number
    /** Wait for "truthy" result, else wait for any defined result including `false` (default: true) */
    readonly truthy?: boolean
    /** A backoff multiplier for how long the next interval will be (default: None, i.e 1) */
    readonly backoff?: number
    /**
     * Only retries when an error is thrown, otherwise returning the immediate result.
     * Can also be a callback for conditional retry based on errors
     * - 'truthy' arg is ignored
     * - If the timeout is reached it throws the last error
     * - default: false
     */
    readonly retryOnFail?: boolean | ((error: Error) => boolean)
}

export const waitUntilDefaultTimeout = 2000
export const waitUntilDefaultInterval = 500

/**
 * Invokes `fn()` on an interval based on the given arguments. This can be used for retries, or until
 * an expected result is given. Read {@link WaitUntilOptions} carefully.
 *
 * @param fn  Function whose result is checked
 * @param options  See {@link WaitUntilOptions}
 *
 * @returns Result of `fn()`, or possibly `undefined` depending on the arguments.
 */
export async function waitUntil<T>(fn: () => Promise<T>, options: WaitUntilOptions & { retryOnFail: true }): Promise<T>
export async function waitUntil<T>(
    fn: () => Promise<T>,
    options: WaitUntilOptions & { retryOnFail: false }
): Promise<T | undefined>
export async function waitUntil<T>(
    fn: () => Promise<T>,
    options: WaitUntilOptions & { retryOnFail: (error: Error) => boolean }
): Promise<T>

export async function waitUntil<T>(
    fn: () => Promise<T>,
    options: Omit<WaitUntilOptions, 'retryOnFail'>
): Promise<T | undefined>
export async function waitUntil<T>(fn: () => Promise<T>, options: WaitUntilOptions): Promise<T | undefined> {
    // set default opts
    const opt = {
        timeout: waitUntilDefaultTimeout,
        interval: waitUntilDefaultInterval,
        truthy: true,
        backoff: 1,
        retryOnFail: false,
        ...options,
    }

    let interval = opt.interval
    let lastError: Error | undefined
    let elapsed: number = 0
    let remaining = opt.timeout

    // Internal helper to determine if we should retry
    function shouldRetry(error: Error | undefined): boolean {
        if (error === undefined) {
            return typeof opt.retryOnFail === 'boolean' ? opt.retryOnFail : true
        }
        if (typeof opt.retryOnFail === 'function') {
            return opt.retryOnFail(error)
        }
        return opt.retryOnFail
    }

    for (let i = 0; true; i++) {
        const start: number = Date.now()
        let result: T

        try {
            // Needed in case a caller uses a 0 timeout (function is only called once)
            if (remaining > 0) {
                result = await Promise.race([fn(), new Promise<T>(r => setTimeout(r, remaining))])
            } else {
                result = await fn()
            }

            if (shouldRetry(lastError) || (opt.truthy && result) || (!opt.truthy && result !== undefined)) {
                return result
            }
        } catch (e) {
            // Unlikely to hit this, but exists for typing
            if (!(e instanceof Error)) {
                throw e
            }

            if (!shouldRetry(e)) {
                throw e
            }

            lastError = e
        }

        // Ensures that we never overrun the timeout
        remaining -= Date.now() - start

        // If the sleep will exceed the timeout, abort early
        if (elapsed + interval >= remaining) {
            if (!shouldRetry(lastError)) {
                return undefined
            }
            throw lastError
        }

        // when testing, this avoids the need to progress the stubbed clock
        if (interval > 0) {
            await sleep(interval)
        }

        elapsed += interval
        interval = interval * opt.backoff
    }
}
/**
 * Sleeps for the specified duration in milliseconds. Note that a duration of 0 will always wait 1 event loop.
 */
export function sleep(duration: number = 0): Promise<void> {
    return new Promise(r => setTimeout(r, Math.max(duration, 0)))
}
