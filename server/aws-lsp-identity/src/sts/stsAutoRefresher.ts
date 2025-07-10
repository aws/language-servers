import { StsCache, StsCredential } from './cache/stsCache'
import { Observability } from '@aws/lsp-core'
import { StsCredentialChangedKind, StsCredentialChangedParams } from '@aws/language-server-runtimes/protocol'

// Modified to match SSO token refresh behavior
const refreshWindowMillis = 5 * 60 * 1000 // 5 minutes (matching SSO)
const retryCooldownWindowMillis = 30000 // 30 seconds (matching SSO)
const bufferedRefreshWindowMillis = refreshWindowMillis * 0.95 // 4.75 minutes
const bufferedRetryCooldownWindowMillis = retryCooldownWindowMillis * 1.05 // 31.5 seconds
const maxRefreshJitterMillis = 10000 // 10 seconds (matching SSO)
const maxRetryCooldownJitterMillis = 3000 // 3 seconds (matching SSO)

export type RaiseStsChanged = (params: StsCredentialChangedParams) => void

interface StsCredentialDetail {
    lastRefreshMillis: number
}

export class StsAutoRefresher implements Disposable {
    private readonly timeouts: Record<string, NodeJS.Timeout> = {}
    private readonly stsCredentialDetails: Record<string, StsCredentialDetail> = {}

    constructor(
        private readonly stsCache: StsCache,
        private readonly raiseStsCredentialChanged: RaiseStsChanged,
        private readonly observability: Observability
    ) {}

    [Symbol.dispose](): void {
        for (const stsSessionName of Object.keys(this.timeouts)) {
            this.unwatch(stsSessionName)
        }
    }

    async watch(name: string, refreshCallback: () => Promise<StsCredential>): Promise<void> {
        try {
            this.unwatch(name)

            const stsCredentials = await this.stsCache.getStsCredential(name).catch(_ => undefined)

            if (!stsCredentials || !stsCredentials.Credentials?.Expiration) {
                this.observability.logging.log(
                    'STS credentials do not exist or have no expiration, will not be auto-refreshed.'
                )
                return
            }

            const nowMillis = Date.now()
            const expirationMillis = new Date(stsCredentials.Credentials?.Expiration).getTime()

            // Get or create StsCredentialDetail (matching SSO pattern)
            const stsCredentialDetail =
                this.stsCredentialDetails[name] ?? (this.stsCredentialDetails[name] = { lastRefreshMillis: 0 })

            let delayMs: number

            if (nowMillis < expirationMillis - refreshWindowMillis) {
                // Before refresh window, schedule to run in refresh window with jitter
                delayMs = expirationMillis - bufferedRefreshWindowMillis - nowMillis
                delayMs += Math.random() * maxRefreshJitterMillis
            } else if (expirationMillis - refreshWindowMillis < nowMillis && nowMillis < expirationMillis) {
                // In refresh window - check if we're still in retry cooldown
                const retryAfterMillis = stsCredentialDetail.lastRefreshMillis + retryCooldownWindowMillis
                if (nowMillis < retryAfterMillis) {
                    this.observability.logging.log('STS credentials in retry cooldown window. Scheduling next retry.')
                    delayMs = retryAfterMillis - nowMillis
                } else {
                    // Ready to refresh - use buffered retry cooldown with jitter
                    delayMs = bufferedRetryCooldownWindowMillis
                    delayMs += Math.random() * maxRetryCooldownJitterMillis
                }
            } else {
                // Expired
                this.observability.logging.log('STS credentials have expired and will not be auto-refreshed.')
                return
            }

            this.observability.logging.info(`Auto-refreshing STS credentials in ${delayMs} milliseconds.`)
            this.timeouts[name] = setTimeout(async () => {
                try {
                    // Update last refresh attempt time (matching SSO pattern)
                    stsCredentialDetail.lastRefreshMillis = Date.now()

                    const newCredentials = await refreshCallback()
                    this.observability.logging.log(`Generated new STS credentials`)
                    await this.stsCache.setStsCredential(name, newCredentials)

                    // Continue watching with the new credentials (allows multiple refreshes)
                    this.watch(name, refreshCallback)

                    this.raiseStsCredentialChanged({ kind: StsCredentialChangedKind.Refreshed, stsCredentialId: name })
                } catch (error) {
                    this.observability.logging.log(`Failed to refresh STS credentials: ${error}`)

                    // On error, continue watching to retry later (matching SSO pattern)
                    this.watch(name, refreshCallback)
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
            // Also clean up the credential detail
            delete this.stsCredentialDetails[stsSessionName]
            this.observability.logging.log('STS credentials unwatched and will not be auto-refreshed.')
        }
    }
}
