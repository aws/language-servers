import { SsoSession, SsoTokenChangedParams } from '@aws/language-server-runtimes/protocol'
import { RefreshingSsoCache, refreshWindowMillis, retryCooldownWindowMillis } from '../sso/cache/refreshingSsoCache'
import { throwOnInvalidClientName, throwOnInvalidSsoSession, throwOnInvalidSsoSessionName } from '../sso/utils'
import { Observability } from './utils'

const bufferedRefreshWindowMillis = refreshWindowMillis * 0.95
const bufferedRetryCooldownWindowMillis = retryCooldownWindowMillis * 1.05
const maxRefreshJitterMillis = 10000
const maxRetryCooldownJitterMillis = 3000

export type RaiseSsoTokenChanged = (params: SsoTokenChangedParams) => void

export class SsoTokenAutoRefresher implements Disposable {
    private readonly timeouts: Record<string, NodeJS.Timeout> = {}

    constructor(
        private readonly ssoCache: RefreshingSsoCache,
        private readonly observability: Observability
    ) {}

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
            this.observability.logging.log(
                'SSO token does not exist, was invalidated, or session has expired and will not be auto-refreshed.'
            )
            return
        }

        const nowMillis = Date.now()
        const accessTokenExpiresAtMillis = Date.parse(ssoToken.expiresAt)
        let delayMillis: number

        if (nowMillis < accessTokenExpiresAtMillis - refreshWindowMillis) {
            // Before refresh window, schedule to run in refresh window with jitter
            delayMillis = accessTokenExpiresAtMillis - bufferedRefreshWindowMillis - nowMillis
            delayMillis += Math.random() * maxRefreshJitterMillis // Jitter to mitigate race conditions
        } else if (
            accessTokenExpiresAtMillis - refreshWindowMillis < nowMillis &&
            nowMillis < accessTokenExpiresAtMillis
        ) {
            // In refresh window with time for a retry
            delayMillis = bufferedRetryCooldownWindowMillis
            delayMillis += Math.random() * maxRetryCooldownJitterMillis // Jitter to mitigate race conditions
        } else {
            // Otherwise, expired
            this.observability.logging.log('SSO token has expired and will not be auto-refreshed.')
            return
        }

        this.observability.logging.log(`Auto-refreshing SSO token in ${delayMillis} milliseconds.`)
        this.timeouts[ssoSession.name] = setTimeout(this.watch.bind(this, clientName, ssoSession), delayMillis)
    }

    unwatch(ssoSessionName: string): void {
        throwOnInvalidSsoSessionName(ssoSessionName)

        const timeout = this.timeouts[ssoSessionName]
        if (timeout) {
            clearTimeout(timeout)
            delete this.timeouts[ssoSessionName]
            this.observability.logging.log('SSO token unwatched and will not be auto-refreshed.')
        }
    }
}
