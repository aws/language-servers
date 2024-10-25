import { SsoTokenChangedParams } from '@aws/language-server-runtimes/protocol'
import { RefreshingSsoCache } from '../sso/cache/refreshingSsoCache'

export type RaiseSsoTokenChanged = (params: SsoTokenChangedParams) => void

export class SsoTokenAutoRefresher {
    constructor(
        private readonly cache: RefreshingSsoCache,
        private readonly raiseSsoTokenChanged: RaiseSsoTokenChanged
    ) {}

    watch(ssoSessionName: string): void {
        // https://nodejs.org/api/timers.html#scheduling-timers
        // Try to load token from cache
        // If couldn't load token throw E_INVALID_TOKEN
        // If token is expired throw E_TOKEN_EXPIRED
        // setTimeout for 1 hour - (4 - 5 minutes jittered) to attempt refresh via RefreshingSsoCache
        // Store token and Timeout
    }

    unwatch(ssoSessionName: string): void {
        // Try to find by ssoSessionName in store
        // If found, clearTimeout
        // Remove from store
    }
}
