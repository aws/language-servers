import { SSOToken } from '@smithy/shared-ini-file-loader'
import { SsoCache, SsoClientRegistration } from './ssoCache'
import { AwsErrorCodes, SsoSession, SsoTokenChangedKind } from '@aws/language-server-runtimes/server-interface'
import { AwsError } from '../../awsError'
import {
    getSsoOidc,
    throwOnInvalidSsoSession,
    throwOnInvalidClientName,
    UpdateSsoTokenFromCreateToken,
    throwOnInvalidSsoSessionName,
} from '../utils'
import { RaiseSsoTokenChanged } from '../../language-server/ssoTokenAutoRefresher'
import { Observability } from '../../language-server/utils'

export const refreshWindowMillis: number = 5 * 60 * 1000
export const retryWindowMillis: number = 30000

interface SsoTokenDetail {
    lastRefreshMillis: number
}

export class RefreshingSsoCache implements SsoCache {
    private readonly ssoTokenDetails: Record<string, SsoTokenDetail> = {}

    constructor(
        private readonly next: SsoCache,
        private readonly raiseSsoTokenChanged: RaiseSsoTokenChanged,
        private readonly observability: Observability
    ) {}

    async getSsoClientRegistration(
        clientName: string,
        ssoSession: SsoSession
    ): Promise<SsoClientRegistration | undefined> {
        throwOnInvalidClientName(clientName)
        throwOnInvalidSsoSession(ssoSession)

        // Check cache
        let clientRegistration = await this.next.getSsoClientRegistration(clientName, ssoSession)

        // Isn't cached or has expired, create a new registration
        if (!clientRegistration || Date.parse(clientRegistration.expiresAt) < Date.now()) {
            this.observability.logging.log(
                'Client registration is not cached or has expired, creating a new registration.'
            )
            const oidc = getSsoOidc(ssoSession.settings.sso_region)

            const result = await oidc
                .registerClient({
                    clientName,
                    clientType: 'public',
                    grantTypes: ['authorization_code', 'refresh_token'],
                    issuerUrl: ssoSession.settings.sso_start_url,
                    redirectUris: ['http://127.0.0.1/oauth/callback'],
                    scopes: ssoSession.settings.sso_registration_scopes,
                })
                .catch(reason => {
                    this.observability.logging.log(`Cannot register client: ${reason}`)
                    throw new AwsError(
                        `Cannot register client [${clientName}].`,
                        AwsErrorCodes.E_CANNOT_REGISTER_CLIENT,
                        {
                            cause: reason,
                        }
                    )
                })

            clientRegistration = {
                clientId: result.clientId!,
                clientSecret: result.clientSecret!,
                issuedAt: new Date(result.clientIdIssuedAt! * 1000).toISOString(),
                expiresAt: new Date(result.clientSecretExpiresAt! * 1000).toISOString(),
                scopes: ssoSession.settings.sso_registration_scopes,
            } satisfies SsoClientRegistration

            // Cache it
            this.observability.logging.log('Caching client registration.')
            await this.setSsoClientRegistration(clientName, ssoSession, clientRegistration)
        }

        this.observability.logging.log('Returning client registration.')
        return clientRegistration
    }

    async setSsoClientRegistration(
        clientName: string,
        ssoSession: SsoSession,
        clientRegistration: SsoClientRegistration
    ): Promise<void> {
        this.observability.logging.log('Storing client registration.')
        await this.next.setSsoClientRegistration(clientName, ssoSession, clientRegistration)
    }

    async removeSsoToken(ssoSessionName: string): Promise<void> {
        this.observability.logging.log('Removing SSO token.')
        throwOnInvalidSsoSessionName(ssoSessionName)

        await this.next.removeSsoToken(ssoSessionName)
    }

    async getSsoToken(clientName: string, ssoSession: SsoSession): Promise<SSOToken | undefined> {
        this.observability.logging.log('Retrieving SSO token.')

        throwOnInvalidClientName(clientName)
        throwOnInvalidSsoSession(ssoSession)

        // Can only get token from next SsoCache, cannot login or create a new token here
        const ssoToken = await this.next.getSsoToken(clientName, ssoSession)

        // No existing token? We're done
        if (!ssoToken) {
            this.observability.logging.log('SSO token not found.')
            return undefined
        }

        const expiresAtMillis = Date.parse(ssoToken.expiresAt)

        // Already expired? We're done
        if (expiresAtMillis < Date.now()) {
            this.observability.logging.log('SSO token expired.')
            return undefined
        }

        // Current time is before start of refresh window? Just return it
        const refreshAfterMillis = expiresAtMillis - refreshWindowMillis
        if (Date.now() < refreshAfterMillis) {
            this.observability.logging.log('SSO token before refresh window.')
            return ssoToken
        }

        // Get or create SsoTokenDetail
        const ssoTokenDetail =
            this.ssoTokenDetails[ssoSession.name] ?? (this.ssoTokenDetails[ssoSession.name] = { lastRefreshMillis: 0 })

        // Last refresh attempt was less than the retry window?  Just return it
        const retryAfterMillis = ssoTokenDetail.lastRefreshMillis + retryWindowMillis
        if (Date.now() < retryAfterMillis) {
            this.observability.logging.log('SSO token still in retry window from last refresh attempt.')
            return ssoToken
        }

        // No refreshToken?  We're done
        if (!ssoToken.refreshToken) {
            this.observability.logging.log('No SSO token refresh token.')
            return undefined
        }

        const clientRegistration = await this.getSsoClientRegistration(clientName, ssoSession)
        if (!clientRegistration) {
            this.observability.logging.log(`Client registration [${clientName}] is not found.`)
            throw new AwsError(`Client registration [${clientName}] is not found.`, AwsErrorCodes.E_INVALID_SSO_CLIENT)
        }

        // TODO Do we need a customUserAgent from the client here?  How is this handled in other LSP servers?
        // https://github.com/aws/language-servers/blob/main/server/aws-lsp-codewhisperer/src/language-server/utils.ts#L92
        using oidc = getSsoOidc(ssoSession.settings.sso_region)

        this.observability.logging.log('Calling SSO OIDC to refresh SSO token.')
        const result = await oidc
            .createToken({
                clientId: clientRegistration?.clientId,
                clientSecret: clientRegistration?.clientSecret,
                grantType: 'refresh_token',
                refreshToken: ssoToken.refreshToken,
            })
            .catch(reason => {
                this.observability.logging.log('Cannot refresh SSO token.')
                throw new AwsError('Cannot refresh SSO token.', AwsErrorCodes.E_CANNOT_REFRESH_SSO_TOKEN, {
                    cause: reason,
                })
            })

        UpdateSsoTokenFromCreateToken(result, clientRegistration, ssoSession, ssoToken)

        // Cache it
        this.observability.logging.log('Caching refreshed SSO token.')
        await this.setSsoToken(clientName, ssoSession, ssoToken)

        this.observability.logging.log('Notifying client SSO token was refreshed.')
        this.raiseSsoTokenChanged({ kind: SsoTokenChangedKind.Refreshed, ssoTokenId: ssoSession.name })

        return ssoToken
    }

    async setSsoToken(clientName: string, ssoSession: SsoSession, ssoToken: SSOToken): Promise<void> {
        this.observability.logging.log('Storing SSO token.')
        await this.next.setSsoToken(clientName, ssoSession, ssoToken)
    }
}
