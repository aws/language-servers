import {
    AwsBuilderIdSsoTokenSource,
    AwsErrorCodes,
    CancellationToken,
    getSsoTokenOptionsDefaults,
    GetSsoTokenParams,
    GetSsoTokenResult,
    IamIdentityCenterSsoTokenSource,
    InvalidateSsoTokenParams,
    InvalidateSsoTokenResult,
    SsoSession,
    SsoTokenSourceKind,
} from '@aws/language-server-runtimes/server-interface'
import { ProfileStore } from './profiles/profileService'
import { authorizationCodePkceFlow, awsBuilderIdReservedName, awsBuilderIdSsoRegion, ShowUrl } from '../sso'
import { AwsError } from '../awsError'
import { SsoCache } from '../sso/cache'
import { SsoTokenAutoRefresher } from './ssoTokenAutoRefresher'
import { throwOnInvalidClientRegistration, throwOnInvalidSsoSession, throwOnInvalidSsoSessionName } from '../sso/utils'

type SsoTokenSource = IamIdentityCenterSsoTokenSource | AwsBuilderIdSsoTokenSource

export class IdentityService {
    constructor(
        private readonly profileStore: ProfileStore,
        private readonly ssoCache: SsoCache,
        private readonly autoRefresher: SsoTokenAutoRefresher,
        private readonly showUrl: ShowUrl
    ) {}

    async getSsoToken(params: GetSsoTokenParams, token: CancellationToken): Promise<GetSsoTokenResult> {
        const options = { ...getSsoTokenOptionsDefaults, ...params.options }

        const ssoSession = await this.getSsoSession(params.source)
        throwOnInvalidSsoSession(ssoSession)

        let ssoToken = await this.ssoCache.getSsoToken(params.clientName, ssoSession)

        if (!ssoToken) {
            // If no cached token and cannot start the login process, give up
            if (!options.loginOnInvalidToken) {
                throw new AwsError('SSO token not found.', AwsErrorCodes.E_INVALID_SSO_TOKEN)
            }

            const clientRegistration = await this.ssoCache.getSsoClientRegistration(params.clientName, ssoSession)
            throwOnInvalidClientRegistration(clientRegistration)

            ssoToken = await authorizationCodePkceFlow(clientRegistration, ssoSession, this.showUrl, token).catch(
                reason => {
                    throw AwsError.wrap(reason, AwsErrorCodes.E_CANNOT_CREATE_SSO_TOKEN)
                }
            )

            await this.ssoCache.setSsoToken(params.clientName, ssoSession, ssoToken!).catch(reason => {
                throw AwsError.wrap(reason, AwsErrorCodes.E_CANNOT_WRITE_SSO_CACHE)
            })
        }

        // Auto refresh is best effort
        await this.autoRefresher.watch(params.clientName, ssoSession).catch(_ => {
            // TODO Add logging in future PR
        })

        return { ssoToken: { accessToken: ssoToken.accessToken, id: ssoSession.name } }
    }

    async invalidateSsoToken(
        params: InvalidateSsoTokenParams,
        token: CancellationToken
    ): Promise<InvalidateSsoTokenResult> {
        throwOnInvalidSsoSessionName(params?.ssoTokenId)

        this.autoRefresher.unwatch(params.ssoTokenId)

        await this.ssoCache.removeSsoToken(params.ssoTokenId)

        return {}
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
            throw new AwsError(`Profile [${source.profileName}] not found.`, AwsErrorCodes.E_PROFILE_NOT_FOUND)
        }

        const ssoSession = profileData.ssoSessions.find(ssoSession => ssoSession.name === profile.settings?.sso_session)
        if (!ssoSession) {
            throw new AwsError(
                `SSO session [${profile.settings?.sso_session}] not found.`,
                AwsErrorCodes.E_SSO_SESSION_NOT_FOUND
            )
        }

        return ssoSession
    }
}
