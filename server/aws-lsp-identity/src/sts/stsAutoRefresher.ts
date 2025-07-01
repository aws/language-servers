import { IamCredentials } from '@aws/language-server-runtimes-types'
import { StsCache, StsSession } from './cache/stsCache'
import { Observability } from '@aws/lsp-core'

const refreshWindowMillis = 5 * 60 * 1000 // 5 minutes
const bufferedRefreshWindowMillis = refreshWindowMillis * 0.95
const maxRefreshJitterMillis = 10000

export class StsAutoRefresher implements Disposable {
    private readonly timeouts: Record<string, NodeJS.Timeout> = {}

    constructor(
        private readonly stsCache: StsCache,
        private readonly observability: Observability
    ) {}

    [Symbol.dispose](): void {
        for (const stsSessionName of Object.keys(this.timeouts)) {
            this.unwatch(stsSessionName)
        }
    }

    async watch(
        clientName: string,
        stsSession: StsSession,
        refreshCallback: () => Promise<IamCredentials>
    ): Promise<void> {
        try {
            this.unwatch(stsSession.profileName)

            const stsCredentials = await this.stsCache.getStsCredentials(clientName, stsSession).catch(_ => undefined)

            if (!stsCredentials || !stsCredentials.expiration) {
                this.observability.logging.log(
                    'STS credentials do not exist or have no expiration, will not be auto-refreshed.'
                )
                return
            }

            const nowMillis = Date.now()
            const expirationMillis = stsCredentials.expiration.getTime()
            let delayMs: number

            if (nowMillis < expirationMillis - refreshWindowMillis) {
                // Before refresh window, schedule to run in refresh window with jitter
                delayMs = expirationMillis - bufferedRefreshWindowMillis - nowMillis
                delayMs += Math.random() * maxRefreshJitterMillis
            } else if (expirationMillis - refreshWindowMillis < nowMillis && nowMillis < expirationMillis) {
                // In refresh window, refresh immediately
                delayMs = 0
            } else {
                // Expired
                this.observability.logging.log('STS credentials have expired and will not be auto-refreshed.')
                return
            }

            this.observability.logging.log(`Auto-refreshing STS credentials in ${delayMs} milliseconds.`)
            this.timeouts[stsSession.profileName] = setTimeout(async () => {
                try {
                    const newCredentials = await refreshCallback()
                    await this.stsCache.setStsCredentials(clientName, stsSession, newCredentials)
                    this.watch(clientName, stsSession, refreshCallback)
                } catch (error) {
                    this.observability.logging.log(`Failed to refresh STS credentials: ${error}`)
                }
            }, delayMs)
        } catch (e) {
            this.observability.logging.log(`Error setting up STS auto-refresh: ${e}`)
            throw e
        }
    }

    unwatch(stsSessionName: string): void {
        const timeout = this.timeouts[stsSessionName]
        if (timeout) {
            clearTimeout(timeout)
            delete this.timeouts[stsSessionName]
            this.observability.logging.log('STS credentials unwatched and will not be auto-refreshed.')
        }
    }
}
