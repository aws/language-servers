import {
    AuthorizationFlowKind,
    AwsBuilderIdSsoTokenSource,
    AwsErrorCodes,
    CancellationToken,
    GetIamCredentialParams,
    GetIamCredentialResult,
    getSsoTokenOptionsDefaults,
    getIamCredentialOptionsDefaults,
    GetSsoTokenParams,
    GetSsoTokenResult,
    IamCredentials,
    IamIdentityCenterSsoTokenSource,
    InvalidateSsoTokenParams,
    InvalidateSsoTokenResult,
    InvalidateStsCredentialParams,
    InvalidateStsCredentialResult,
    MetricEvent,
    SsoSession,
    SsoTokenSourceKind,
    Profile,
} from '@aws/language-server-runtimes/server-interface'

import { normalizeSettingList, ProfileStore } from './profiles/profileService'
import { authorizationCodePkceFlow, awsBuilderIdReservedName, awsBuilderIdSsoRegion } from '../sso'
import { SsoCache, SsoClientRegistration } from '../sso/cache'
import { SsoTokenAutoRefresher } from './ssoTokenAutoRefresher'
import { StsCache, StsCredential } from '../sts/cache/stsCache'
import { StsAutoRefresher } from '../sts/stsAutoRefresher'
import {
    throwOnInvalidClientRegistration,
    throwOnInvalidSsoSession,
    throwOnInvalidSsoSessionName,
    SsoFlowParams,
} from '../sso/utils'
import { AwsError, Observability } from '@aws/lsp-core'
import { GetCallerIdentityCommand, STSClient, AssumeRoleCommand } from '@aws-sdk/client-sts'
import { __ServiceException } from '@aws-sdk/client-sso-oidc/dist-types/models/SSOOIDCServiceException'
import { deviceCodeFlow } from '../sso/deviceCode/deviceCodeFlow'
import { SSOToken } from '@smithy/shared-ini-file-loader'
import { IAMClient, SimulatePrincipalPolicyCommand } from '@aws-sdk/client-iam'
import { getProcessCredential } from '../providers/processProvider'

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
        private readonly stsCache: StsCache,
        private readonly stsAutoRefresher: StsAutoRefresher,
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

    async getIamCredential(params: GetIamCredentialParams, token: CancellationToken): Promise<GetIamCredentialResult> {
        const emitMetric = this.emitMetric.bind(
            this,
            'flareIdentity_getIamCredential',
            this.getIamCredential.name,
            Date.now()
        )

        try {
            const options = { ...getIamCredentialOptionsDefaults, ...params.options }

            token.onCancellationRequested(_ => {
                if (options.generateOnInvalidStsCredential) {
                    emitMetric('Cancelled', null)
                }
            })

            // Get the profile with provided name
            const profileData = await this.profileStore.load()
            const profile = profileData.profiles.find(profile => profile.name === params.profileName)
            if (!profile) {
                this.observability.logging.log('Profile not found.')
                throw new AwsError('Profile not found.', AwsErrorCodes.E_PROFILE_NOT_FOUND)
            }

            let credentials: IamCredentials
            // Assume the role matching the found ARN
            if (profile.settings?.role_arn) {
                credentials = await this.getAssumedRoleCredential(
                    profile,
                    options.generateOnInvalidStsCredential,
                    params.mfaCode
                )
            }
            // Get the credentials from the process output
            else if (profile.settings?.credential_process) {
                credentials = await getProcessCredential(profile.settings.credential_process)
            }
            // Get the credentials directly from the profile
            else if (profile.settings?.aws_access_key_id && profile.settings?.aws_secret_access_key) {
                credentials = {
                    accessKeyId: profile.settings.aws_access_key_id,
                    secretAccessKey: profile.settings.aws_secret_access_key,
                    sessionToken: profile.settings.aws_session_token,
                }
            } else {
                throw new AwsError('Credentials could not be found for profile', AwsErrorCodes.E_INVALID_PROFILE)
            }

            // Validate permissions on user or assumed role
            const hasPermissions = await this.validatePermissions(credentials, profile.settings?.region)
            if (!hasPermissions) {
                throw new AwsError(
                    `User or assumed role has insufficient permissions.`,
                    AwsErrorCodes.E_INVALID_PROFILE
                )
            }

            emitMetric('Succeeded')
            return {
                id: profile.name,
                credentials: credentials,
                updateCredentialsParams: { data: credentials, encrypted: false },
            }
        } catch (e) {
            emitMetric('Failed', e)
            throw e
        }
    }

    private async getAssumedRoleCredential(
        profile: Profile,
        generateOnInvalidStsCredential: boolean,
        mfaCode?: string
    ): Promise<IamCredentials> {
        // TODO: add other parent authentication methods to role assumption
        if (!profile.settings?.aws_access_key_id || !profile.settings?.aws_secret_access_key) {
            throw new Error('IAM credentials not found when assuming role.')
        }

        // Create STS client for role assumption
        const stsClient = new STSClient({
            region: profile.settings.region || 'us-east-1',
            credentials: {
                accessKeyId: profile.settings.aws_access_key_id,
                secretAccessKey: profile.settings.aws_secret_access_key,
                sessionToken: profile.settings.aws_session_token,
            },
        })

        // Try to get the STS credentials from cache
        let result: IamCredentials
        const stsCredentials = await this.stsCache.getStsCredential(profile.name).catch(_ => undefined)

        if (stsCredentials?.Credentials) {
            result = {
                accessKeyId: stsCredentials.Credentials.AccessKeyId!,
                secretAccessKey: stsCredentials.Credentials.SecretAccessKey!,
                sessionToken: stsCredentials.Credentials.SessionToken!,
                expiration: stsCredentials.Credentials.Expiration!,
            }
        } else if (generateOnInvalidStsCredential && profile.settings.role_arn) {
            // Generate STS credentials
            const response = await this.generateStsCredential(
                stsClient,
                profile.settings.role_arn,
                profile.settings.mfa_serial,
                mfaCode
            )
            if (!response.Credentials) {
                throw new AwsError(
                    'Failed to assume role: No credentials returned',
                    AwsErrorCodes.E_INVALID_STS_CREDENTIAL
                )
            }
            // Cache STS credentials
            await this.stsCache.setStsCredential(profile.name, response)
            result = {
                accessKeyId: response.Credentials.AccessKeyId!,
                secretAccessKey: response.Credentials.SecretAccessKey!,
                sessionToken: response.Credentials.SessionToken!, // Always present in STS response
                expiration: response.Credentials.Expiration!,
            }
        } else {
            // If we could not get the cached STS credential and cannot generate a new credential, give up
            this.observability.logging.log(
                'STS credential not found an generateOnInvalidStsCredential = false, returning no credential.'
            )
            throw new AwsError('STS credential not found.', AwsErrorCodes.E_INVALID_STS_CREDENTIAL)
        }

        // Set up auto-refresh if MFA is disabled
        if (!profile.settings.mfa_serial) {
            await this.stsAutoRefresher
                .watch(profile.name, () => {
                    if (profile.settings?.role_arn) {
                        return this.generateStsCredential(stsClient, profile.settings.role_arn)
                    } else {
                        throw new AwsError(
                            'Cannot find role ARN associated with profile',
                            AwsErrorCodes.E_CANNOT_REFRESH_STS_CREDENTIAL
                        )
                    }
                })
                .catch(reason => {
                    this.observability.logging.log(`Unable to auto-refresh STS credentials. ${reason}`)
                })
        }

        return result
    }

    private async generateStsCredential(
        stsClient: STSClient,
        roleArn: string,
        mfaSerial?: string,
        mfaCode?: string
    ): Promise<StsCredential> {
        try {
            const mfaFields = mfaSerial && mfaCode ? { SerialNumber: mfaSerial, TokenCode: mfaCode } : {}
            const command = new AssumeRoleCommand({
                RoleArn: roleArn,
                RoleSessionName: `session-${Date.now()}`,
                DurationSeconds: 3600,
                ...mfaFields,
            })

            const { Credentials, AssumedRoleUser } = await stsClient.send(command)
            return { Credentials, AssumedRoleUser }
        } catch (e) {
            this.observability.logging.log(`Error generating STS credentials.`)
            throw new AwsError(`Error generating STS credentials.`, AwsErrorCodes.E_CANNOT_CREATE_STS_CREDENTIAL)
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

    async invalidateStsCredential(
        params: InvalidateStsCredentialParams,
        token: CancellationToken
    ): Promise<InvalidateStsCredentialResult> {
        const emitMetric = this.emitMetric.bind(
            this,
            'flareIdentity_invalidateStsCredential',
            this.invalidateStsCredential.name,
            Date.now()
        )

        token.onCancellationRequested(_ => {
            emitMetric('Cancelled')
        })

        try {
            if (!params?.profileName?.trim()) {
                throw new AwsError('Profile name is invalid.', AwsErrorCodes.E_INVALID_PROFILE)
            }

            this.stsAutoRefresher.unwatch(params.profileName)

            await this.stsCache.removeStsCredential(params.profileName)

            emitMetric('Succeeded')
            this.observability.logging.log('Successfully invalidated STS credentials.')
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

    // Returns whether the identity associated with the provided credentials has sufficient permissions
    private async validatePermissions(
        credentials: IamCredentials,
        region: string | undefined
    ): Promise<boolean | undefined> {
        // Get the identity associated with the credentials
        const stsClient = new STSClient({ region: region || 'us-east-1', credentials: credentials })
        const identity = await stsClient.send(new GetCallerIdentityCommand({}))
        if (!identity.Arn) {
            throw new AwsError('Caller identity ARN not found.', AwsErrorCodes.E_INVALID_PROFILE)
        }

        // Check the permissions attached to the identity
        const iamClient = new IAMClient({ region: region || 'us-east-1', credentials: credentials })
        const response = await iamClient.send(
            new SimulatePrincipalPolicyCommand({
                PolicySourceArn: this.convertToIamArn(identity.Arn),
                ActionNames: [
                    'q:StartConversation',
                    'q:SendMessage',
                    'q:GetConversation',
                    'q:ListConversations',
                    'q:UpdateConversation',
                    'q:DeleteConversation',
                    'q:PassRequest',
                    'q:StartTroubleshootingAnalysis',
                    'q:StartTroubleshootingResolutionExplanation',
                    'q:GetTroubleshootingResults',
                    'q:UpdateTroubleshootingCommandResult',
                    'q:GetIdentityMetaData',
                    'q:GenerateCodeFromCommands',
                    'q:UsePlugin',
                    'codewhisperer:GenerateRecommendations',
                ],
            })
        )
        return response.EvaluationResults?.every(result => result.EvalDecision === 'allowed')
    }

    // Converts an assumed role ARN into an IAM role ARN
    private convertToIamArn(arn: string) {
        if (arn.includes(':assumed-role/')) {
            const parts = arn.split(':')
            const roleName = parts[5].split('/')[1]
            return `arn:aws:iam::${parts[4]}:role/${roleName}`
        } else {
            return arn
        }
    }
}
