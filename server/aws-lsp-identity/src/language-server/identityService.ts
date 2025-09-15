import {
    AuthorizationFlowKind,
    AwsBuilderIdSsoTokenSource,
    AwsErrorCodes,
    CancellationToken,
    getSsoTokenOptionsDefaults,
    GetSsoTokenParams,
    GetSsoTokenResult,
    IamIdentityCenterSsoTokenSource,
    InvalidateSsoTokenParams,
    InvalidateSsoTokenResult,
    MetricEvent,
    SsoSession,
    SsoTokenSourceKind,
} from '@aws/language-server-runtimes/server-interface'
import { normalizeSettingList, ProfileStore } from './profiles/profileService'
import { authorizationCodePkceFlow, awsBuilderIdReservedName, awsBuilderIdSsoRegion } from '../sso'
import { SsoCache, SsoClientRegistration } from '../sso/cache'
import { SsoTokenAutoRefresher } from './ssoTokenAutoRefresher'
import {
    throwOnInvalidClientRegistration,
    throwOnInvalidSsoSession,
    throwOnInvalidSsoSessionName,
    SsoFlowParams,
} from '../sso/utils'
import { AwsError, Observability } from '@aws/lsp-core'
import { __ServiceException } from '@aws-sdk/client-sso-oidc/dist-types/models/SSOOIDCServiceException'
import { deviceCodeFlow } from '../sso/deviceCode/deviceCodeFlow'
import { SSOToken } from '@smithy/shared-ini-file-loader'

type SsoTokenSource = IamIdentityCenterSsoTokenSource | AwsBuilderIdSsoTokenSource
type AuthFlows = Record<AuthorizationFlowKind, (params: SsoFlowParams) => Promise<SSOToken>>

const flows: AuthFlows = {
    [AuthorizationFlowKind.DeviceCode]: deviceCodeFlow,
    [AuthorizationFlowKind.Pkce]: authorizationCodePkceFlow,
}

export class IdentityService {
    constructor(
        private readonly profileStore: ProfileStore,
        private readonly ssoCache: SsoCache,
        private readonly autoRefresher: SsoTokenAutoRefresher,
        private readonly handlers: SsoFlowParams['handlers'],
        private readonly clientName: string,
        private readonly observability: Observability,
        private readonly authFlows: AuthFlows = flows
    ) {}

    async getSsoToken(params: GetSsoTokenParams, token: CancellationToken): Promise<GetSsoTokenResult> {
        const emitMetric = this.emitMetric.bind(this, 'flareIdentity_getSsoToken', this.getSsoToken.name, Date.now())

        let clientRegistration: SsoClientRegistration | undefined
        let ssoSession: SsoSession | undefined

        try {
            const options = { ...getSsoTokenOptionsDefaults, ...params.options }

            token.onCancellationRequested(_ => {
                if (options.loginOnInvalidToken) {
                    emitMetric('Cancelled', null, ssoSession, clientRegistration)
                }
            })

            ssoSession = await this.getSsoSession(params.source)
            throwOnInvalidSsoSession(ssoSession)

            let err: unknown
            let ssoToken = await this.ssoCache.getSsoToken(this.clientName, ssoSession).catch(e => {
                err = e
                return undefined
            })

            if (!ssoToken) {
                // If we could not get the cached token and cannot start the login process, give up
                if (!options.loginOnInvalidToken) {
                    if (err) {
                        this.observability.logging.log(
                            'Error when attempting to retrieve SSO token and loginOnInvalidToken = false, returning no token.'
                        )
                        throw err
                    }

                    this.observability.logging.log(
                        'SSO token not found an loginOnInvalidToken = false, returning no token.'
                    )
                    throw new AwsError('SSO token not found.', AwsErrorCodes.E_INVALID_SSO_TOKEN)
                }

                clientRegistration = await this.ssoCache.getSsoClientRegistration(this.clientName, ssoSession)
                throwOnInvalidClientRegistration(clientRegistration)

                const flowOpts: SsoFlowParams = {
                    clientName: this.clientName,
                    clientRegistration,
                    ssoSession,
                    handlers: this.handlers,
                    token,
                    observability: this.observability,
                }

                const flowKind = params.options?.authorizationFlow ?? getSsoTokenOptionsDefaults.authorizationFlow
                if (!Object.keys(this.authFlows).includes(flowKind)) {
                    throw new AwsError(
                        `Unsupported authorization flow requested: ${flowKind}`,
                        AwsErrorCodes.E_CANNOT_CREATE_SSO_TOKEN
                    )
                }

                const flow = this.authFlows[flowKind]
                ssoToken = await flow(flowOpts).catch(reason => {
                    throw AwsError.wrap(reason, AwsErrorCodes.E_CANNOT_CREATE_SSO_TOKEN)
                })

                emitMetric('Succeeded', null, ssoSession, clientRegistration)

                await this.ssoCache.setSsoToken(this.clientName, ssoSession, ssoToken!).catch(reason => {
                    throw AwsError.wrap(reason, AwsErrorCodes.E_CANNOT_WRITE_SSO_CACHE)
                })
            }

            // Auto refresh is best effort
            await this.autoRefresher.watch(this.clientName, ssoSession).catch(reason => {
                this.observability.logging.log(`Unable to auto-refresh token. ${reason}`)
            })

            this.observability.logging.log('Successfully retrieved existing or newly authenticated SSO token.')
            return {
                ssoToken: { accessToken: ssoToken.accessToken, id: ssoSession.name },
                updateCredentialsParams: { data: { token: ssoToken.accessToken }, encrypted: false },
            }
        } catch (e) {
            emitMetric('Failed', e, ssoSession, clientRegistration)

            throw e
        }
    }

    async invalidateSsoToken(
        params: InvalidateSsoTokenParams,
        token: CancellationToken
    ): Promise<InvalidateSsoTokenResult> {
        const emitMetric = this.emitMetric.bind(
            this,
            'flareIdentity_invalidateSsoToken',
            this.invalidateSsoToken.name,
            Date.now()
        )

        token.onCancellationRequested(_ => {
            emitMetric('Cancelled')
        })

        try {
            throwOnInvalidSsoSessionName(params?.ssoTokenId)

            this.autoRefresher.unwatch(params.ssoTokenId)

            await this.ssoCache.removeSsoToken(params.ssoTokenId)

            emitMetric('Succeeded')
            this.observability.logging.log('Successfully invalidated SSO token.')
            return {}
        } catch (e) {
            emitMetric('Failed', e)

            throw e
        }
    }

    private emitMetric(
        name: string,
        source: string,
        startMillis: number,
        result: 'Succeeded' | 'Failed' | 'Cancelled',
        error?: unknown,
        ssoSession?: SsoSession,
        clientRegistration?: SsoClientRegistration
    ): void {
        const metric: MetricEvent = {
            name,
            result,
            data: {
                authScopes: normalizeSettingList(ssoSession?.settings?.sso_registration_scopes),
                awsRegion: ssoSession?.settings?.sso_region,
                credentialStartUrl: ssoSession?.settings?.sso_start_url,
                duration: Date.now() - startMillis,
                source,
                ssoRegistrationClientId: clientRegistration?.clientId,
                ssoRegistrationExpiresAt: clientRegistration?.expiresAt,
                ssoRegistrationIssuedAt: clientRegistration?.issuedAt,
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

    private async getSsoSession(source: SsoTokenSource): Promise<SsoSession> {
        switch (source.kind) {
            case SsoTokenSourceKind.AwsBuilderId:
                return {
                    name: awsBuilderIdReservedName,
                    settings: {
                        sso_region: awsBuilderIdSsoRegion,
                        sso_registration_scopes: source.ssoRegistrationScopes,
                        sso_start_url: 'https://view.awsapps.com/start',
                    },
                }
            case SsoTokenSourceKind.IamIdentityCenter:
                return await this.getSsoSessionFromProfileStore(source)
            default:
                this.observability.logging.log(`SSO token source [${source['kind']}] is not supported.`)
                throw new AwsError(
                    `SSO token source [${source['kind']}] is not supported.`,
                    AwsErrorCodes.E_SSO_TOKEN_SOURCE_NOT_SUPPORTED
                )
        }
    }

    private async getSsoSessionFromProfileStore(source: IamIdentityCenterSsoTokenSource): Promise<SsoSession> {
        const profileData = await this.profileStore.load()

        const profile = profileData.profiles.find(profile => profile.name === source.profileName)
        if (!profile) {
            this.observability.logging.log('Profile not found.')
            throw new AwsError('Profile not found.', AwsErrorCodes.E_PROFILE_NOT_FOUND)
        }

        const ssoSession = profileData.ssoSessions.find(ssoSession => ssoSession.name === profile.settings?.sso_session)
        if (!ssoSession) {
            this.observability.logging.log('SSO session not found.')
            throw new AwsError('SSO session not found.', AwsErrorCodes.E_SSO_SESSION_NOT_FOUND)
        }

        // eslint-disable-next-line no-extra-semi
        ;(ssoSession.settings ||= {}).sso_registration_scopes = ssoSession.settings.sso_registration_scopes

        return ssoSession
    }
}
