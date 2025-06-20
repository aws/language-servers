import { SSOToken } from '@smithy/shared-ini-file-loader'
import { SsoCache, SsoClientRegistration } from './ssoCache'
import { AwsErrorCodes, SsoSession, SsoTokenChangedKind } from '@aws/language-server-runtimes/server-interface'
import {
    getSsoOidc,
    throwOnInvalidSsoSession,
    throwOnInvalidClientName,
    UpdateSsoTokenFromCreateToken,
    throwOnInvalidSsoSessionName,
} from '../utils'
import { RaiseSsoTokenChanged } from '../../language-server/ssoTokenAutoRefresher'
import { CreateTokenCommandOutput, InvalidGrantException } from '@aws-sdk/client-sso-oidc'
import { AwsError, Observability } from '@aws/lsp-core'

export const refreshWindowMillis: number = 5 * 60 * 1000
export const retryCooldownWindowMillis: number = 30000

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

        const nowMillis = Date.now()
        const accessTokenExpiresAtMillis = Date.parse(ssoToken.expiresAt)

        // Get or create SsoTokenDetail
        const ssoTokenDetail =
            this.ssoTokenDetails[ssoSession.name] ?? (this.ssoTokenDetails[ssoSession.name] = { lastRefreshMillis: 0 })

        // Refresh details
        // https://docs.aws.amazon.com/sdkref/latest/guide/understanding-sso.html#idccredres3

        // accessToken hasn't expired?  Determine if refresh should be attempted or just return the existing token
        if (nowMillis < accessTokenExpiresAtMillis) {
            // Current time is before start of refresh window? Just return it
            const refreshAfterMillis = accessTokenExpiresAtMillis - refreshWindowMillis
            if (nowMillis < refreshAfterMillis) {
                this.observability.logging.log('SSO token before refresh window.  Returning current SSO token.')
                return ssoToken
            }

            // Last refresh attempt was less than the retry window?  Just return it
            const retryAfterMillis = ssoTokenDetail.lastRefreshMillis + retryCooldownWindowMillis
            if (nowMillis < retryAfterMillis) {
                this.observability.logging.log('SSO token in retry cooldown window.  Returning current SSO token.')
                return ssoToken
            }
        }

        // No refreshToken?  We're done
        if (!ssoToken.refreshToken) {
            this.observability.logging.log('SSO token expired and no refresh token.')
            throw new AwsError('No refresh token available.', AwsErrorCodes.E_SSO_TOKEN_EXPIRED)
        }

        // Good to go, try a refresh
        ssoTokenDetail.lastRefreshMillis = nowMillis

        const clientRegistration = await this.getSsoClientRegistration(clientName, ssoSession)
        if (!clientRegistration) {
            this.observability.logging.log(`Client registration [${clientName}] is not found.`)
            throw new AwsError(`Client registration [${clientName}] is not found.`, AwsErrorCodes.E_INVALID_SSO_CLIENT)
        }

        // TODO Do we need a customUserAgent from the client here?  How is this handled in other LSP servers?
        // https://github.com/aws/language-servers/blob/main/server/aws-lsp-codewhisperer/src/language-server/utils.ts#L92
        using oidc = getSsoOidc(ssoSession.settings.sso_region)

        this.observability.logging.log('Calling SSO OIDC to refresh SSO token.')
        const result: CreateTokenCommandOutput = await oidc
            .createToken({
                clientId: clientRegistration?.clientId,
                clientSecret: clientRegistration?.clientSecret,
                grantType: 'refresh_token',
                refreshToken: ssoToken.refreshToken,
            })
            .catch(reason => {
                // Check if SSO session has expired
                if (
                    reason instanceof InvalidGrantException &&
                    reason.error_description === 'Invalid refresh token provided'
                ) {
                    this.observability.logging.log('Cannot refresh SSO token.  SSO session has expired.')
                    throw new AwsError('SSO session is expired.', AwsErrorCodes.E_SSO_TOKEN_EXPIRED)
                }

                this.observability.logging.log('Error when attempting to refresh SSO token.')
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
