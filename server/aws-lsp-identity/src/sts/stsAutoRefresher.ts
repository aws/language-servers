import { StsCache } from './cache/stsCache'
import { Observability } from '@aws/lsp-core'
import { AutoRefresher, invalidDelay } from '../language-server/autoRefresher'
import { IamCredentials, StsCredentialChangedKind } from '@aws/language-server-runtimes/protocol'
import { SendStsCredentialChanged } from '../iam/utils'

interface StsCredentialDetail {
    lastRefreshMillis: number
}

export class StsAutoRefresher extends AutoRefresher {
    private readonly stsCredentialDetails: Record<string, StsCredentialDetail> = {}

    constructor(
        private readonly stsCache: StsCache,
        private readonly raiseStsCredentialChanged: SendStsCredentialChanged,
        observability: Observability
    ) {
        super(observability)
    }

    async watch(iamCredentialId: string, refreshCallback: () => Promise<IamCredentials>): Promise<void> {
        try {
            this.unwatch(iamCredentialId)

            const credential = await this.stsCache.getStsCredential(iamCredentialId).catch(_ => undefined)

            if (!credential?.expiration) {
                this.observability.logging.log(
                    'STS credentials do not exist or have no expiration, will not be auto-refreshed.'
                )
                return
            }

            // Get or create StsCredentialDetail
            const stsCredentialDetail =
                this.stsCredentialDetails[iamCredentialId] ??
                (this.stsCredentialDetails[iamCredentialId] = { lastRefreshMillis: 0 })

            const delayMillis = this.getDelay(credential.expiration.toISOString())
            if (delayMillis !== invalidDelay) {
                this.observability.logging.info(`Auto-refreshing STS credentials in ${delayMillis} milliseconds.`)
                this.timeouts[iamCredentialId] = setTimeout(async () => {
                    try {
                        // Update last refresh attempt time (matching SSO pattern)
                        stsCredentialDetail.lastRefreshMillis = Date.now()

                        // Passing refresh function into here is easier than refreshing from STS cache
                        const newCredentials = await refreshCallback()
                        this.observability.logging.log(`Generated new STS credentials`)
                        await this.stsCache.setStsCredential(iamCredentialId, newCredentials)

                        // Continue watching with the new credentials (allows multiple refreshes)
                        this.watch(iamCredentialId, refreshCallback)

                        this.raiseStsCredentialChanged({
                            kind: StsCredentialChangedKind.Refreshed,
                            stsCredentialId: iamCredentialId,
                        })
                    } catch (error) {
                        this.observability.logging.log(`Failed to refresh STS credentials: ${error}`)

                        // On error, continue watching to retry later (matching SSO pattern)
                        this.watch(iamCredentialId, refreshCallback)
                    }
                }, delayMillis)
            }
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
