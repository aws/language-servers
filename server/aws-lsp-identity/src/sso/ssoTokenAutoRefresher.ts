import { SsoSession } from '@aws/language-server-runtimes/protocol'
import { RefreshingSsoCache } from './cache/refreshingSsoCache'
import { throwOnInvalidClientName, throwOnInvalidSsoSession, throwOnInvalidSsoSessionName } from './utils'
import { MetricEvent } from '@aws/language-server-runtimes/server-interface'
import { normalizeSettingList } from '../language-server/profiles/profileService'
import { __ServiceException } from '@aws-sdk/client-sso-oidc/dist-types/models/SSOOIDCServiceException'
import { AwsError, Observability } from '@aws/lsp-core'
import { AutoRefresher } from '../language-server/autoRefresher'

export class SsoTokenAutoRefresher extends AutoRefresher {
    constructor(
        private readonly ssoCache: RefreshingSsoCache,
        observability: Observability
    ) {
        super(observability)
    }

    async watch(clientName: string, ssoSession: SsoSession): Promise<void> {
        const emitMetric = this.emitMetric.bind(this, 'flareIdentity_watch', SsoTokenAutoRefresher.name, Date.now())

        try {
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

            // Refresh timeout if delay is valid
            const delayMillis = this.getDelay(ssoToken.expiresAt)
            if (delayMillis >= 0) {
                this.observability.logging.log(`Auto-refreshing SSO token in ${delayMillis} milliseconds.`)
                this.timeouts[ssoSession.name] = setTimeout(this.watch.bind(this, clientName, ssoSession), delayMillis)
            }
        } catch (e) {
            emitMetric(e, ssoSession)

            throw e
        }
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

    private emitMetric(
        name: string,
        source: string,
        startMillis: number,
        error?: unknown,
        ssoSession?: SsoSession
    ): void {
        const metric: MetricEvent = {
            name,
            result: 'Failed',
            data: {
                authScopes: normalizeSettingList(ssoSession?.settings?.sso_registration_scopes),
                awsRegion: ssoSession?.settings?.sso_region,
                credentialStartUrl: ssoSession?.settings?.sso_start_url,
                duration: Date.now() - startMillis,
                source,
            },
        }

        if (error) {
            metric.errorData = {
                errorCode: (error as AwsError)?.awsErrorCode,
                httpStatusCode:
                    (error as __ServiceException)?.$metadata?.httpStatusCode ||
                    ((error as Error).cause as __ServiceException)?.$metadata?.httpStatusCode,
                reason: error?.constructor?.name ?? 'unknown',
            }
        }

        this.observability.telemetry.emitMetric(metric)
    }
}
