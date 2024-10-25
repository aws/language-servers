import { SsoSession, SsoTokenChangedParams } from '@aws/language-server-runtimes/protocol'
import { RefreshingSsoCache, refreshWindowMillis, retryWindowMillis } from '../sso/cache/refreshingSsoCache'
import { throwOnInvalidClientName, throwOnInvalidSsoSession, throwOnInvalidSsoSessionName } from '../sso/utils'

const bufferedRefreshWindowMillis = refreshWindowMillis * 0.95
const bufferedRetryWindowMillis = retryWindowMillis * 1.05
const maxRefreshJitterMillis = 10000
const maxRetryJitterMillis = 3000

export type RaiseSsoTokenChanged = (params: SsoTokenChangedParams) => void

export class SsoTokenAutoRefresher implements Disposable {
    private readonly timeouts: Record<string, NodeJS.Timeout> = {}

    constructor(private readonly ssoCache: RefreshingSsoCache) {}

    [Symbol.dispose](): void {
        for (const ssoSessionName of Object.keys(this.timeouts)) {
            this.unwatch(ssoSessionName)
        }
    }

    async watch(clientName: string, ssoSession: SsoSession): Promise<void> {
        throwOnInvalidClientName(clientName)
        throwOnInvalidSsoSession(ssoSession)

        this.unwatch(ssoSession.name)

        const ssoToken = await this.ssoCache.getSsoToken(clientName, ssoSession).catch(_ => undefined)

        // Token doesn't exist, was invalidated by another process, or has expired
        if (!ssoToken) {
            return
        }

        const nowMillis = Date.now()
        const expiresAtMillis = Date.parse(ssoToken.expiresAt)
        let delayMillis: number

        if (nowMillis < expiresAtMillis - refreshWindowMillis) {
            // Before refresh window, schedule to run in refresh window with jitter
            delayMillis = expiresAtMillis - bufferedRefreshWindowMillis - nowMillis
            delayMillis += Math.random() * maxRefreshJitterMillis // Jitter to mitigate race conditions
        } else if (expiresAtMillis - refreshWindowMillis < nowMillis && nowMillis < expiresAtMillis) {
            // In refresh window with time for a retry
            delayMillis = bufferedRetryWindowMillis
            delayMillis += Math.random() * maxRetryJitterMillis // Jitter to mitigate race conditions
        } else {
            // Otherwise, expired
            return
        }

        this.timeouts[ssoSession.name] = setTimeout(this.watch.bind(this, clientName, ssoSession), delayMillis)
    }

    unwatch(ssoSessionName: string): void {
        throwOnInvalidSsoSessionName(ssoSessionName)

        const timeout = this.timeouts[ssoSessionName]
        if (timeout) {
            clearTimeout(timeout)
            delete this.timeouts[ssoSessionName]
        }
    }
}
