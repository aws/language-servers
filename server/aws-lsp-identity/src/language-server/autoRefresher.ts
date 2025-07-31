import { Observability } from '@aws/lsp-core'

export const invalidDelay: number = -1
export const refreshWindowMillis: number = 5 * 60 * 1000
export const retryCooldownWindowMillis: number = 30000
const bufferedRefreshWindowMillis = refreshWindowMillis * 0.95
const bufferedRetryCooldownWindowMillis = retryCooldownWindowMillis * 1.05
const maxRefreshJitterMillis = 10000
const maxRetryCooldownJitterMillis = 3000

export abstract class AutoRefresher implements Disposable {
    protected readonly timeouts: Record<string, NodeJS.Timeout> = {}

    constructor(protected readonly observability: Observability) {}

    [Symbol.dispose](): void {
        for (const key of Object.keys(this.timeouts)) {
            this.unwatch(key)
        }
    }

    protected abstract unwatch(key: string): void

    getDelay(expiration: string): number {
        const nowMillis = Date.now()
        const expiresAtMillis = Date.parse(expiration)
        let delayMillis: number

        if (nowMillis < expiresAtMillis - refreshWindowMillis) {
            // Before refresh window, schedule to run in refresh window with jitter
            delayMillis = expiresAtMillis - bufferedRefreshWindowMillis - nowMillis
            delayMillis += Math.random() * maxRefreshJitterMillis // Jitter to mitigate race conditions
        } else if (expiresAtMillis - refreshWindowMillis < nowMillis && nowMillis < expiresAtMillis) {
            // In refresh window with time for a retry
            delayMillis = bufferedRetryCooldownWindowMillis
            delayMillis += Math.random() * maxRetryCooldownJitterMillis // Jitter to mitigate race conditions
        } else {
            // Otherwise, expired
            this.observability.logging.log('SSO token has expired and will not be auto-refreshed.')
            return invalidDelay
        }

        this.observability.logging.log(`Auto-refreshing SSO token in ${delayMillis} milliseconds.`)
        return delayMillis
    }
}
