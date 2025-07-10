import {
    AwsErrorCodes,
    AwsResponseError,
    CancellationToken,
    ListProfilesParams,
    ListProfilesResult,
    Profile,
    ProfileKind,
    SsoSession,
    updateProfileOptionsDefaults,
    UpdateProfileParams,
    UpdateProfileResult,
} from '@aws/language-server-runtimes/server-interface'
import { SharedConfigInit } from '@smithy/shared-ini-file-loader'
import { DuckTyper } from '../../duckTyper'
import { AwsError, Observability } from '@aws/lsp-core'

export interface ProfileData {
    profiles: Profile[]
    ssoSessions: SsoSession[]
}

export interface ProfileStore {
    load(init?: SharedConfigInit): Promise<ProfileData>
    save(data: ProfileData, init?: SharedConfigInit): Promise<void>
}

export const ProfileFields = {
    region: 'region',
    sso_account_id: 'sso_account_id',
    sso_role_name: 'sso_role_name',
    sso_session: 'sso_session',
    aws_access_key_id: 'aws_access_key_id',
    aws_secret_access_key: 'aws_secret_access_key',
    aws_session_token: 'aws_session_token',
    role_arn: 'role_arn',
    role_session_name: 'role_session_name',
    credential_process: 'credential_process',
    credential_source: 'credential_source',
    source_profile: 'source_profile',
    mfa_serial: 'mfa_serial',
} as const

export const SsoSessionFields = {
    sso_region: 'sso_region',
    sso_registration_scopes: 'sso_registration_scopes',
    sso_start_url: 'sso_start_url',
} as const

export const profileDuckTypers = {
    SsoTokenProfile: new DuckTyper()
        .requireProperty(ProfileFields.sso_session)
        .disallowProperty(ProfileFields.sso_account_id)
        .disallowProperty(ProfileFields.sso_role_name),
    IamUserProfile: new DuckTyper()
        .requireProperty(ProfileFields.aws_access_key_id)
        .requireProperty(ProfileFields.aws_secret_access_key)
        .optionalProperty(ProfileFields.aws_session_token),
    RoleSourceProfile: new DuckTyper()
        .requireProperty(ProfileFields.role_arn)
        .requireProperty(ProfileFields.source_profile)
        .optionalProperty(ProfileFields.role_session_name)
        .optionalProperty(ProfileFields.mfa_serial)
        .disallowProperty(ProfileFields.credential_source),
    RoleInstanceProfile: new DuckTyper()
        .requireProperty(ProfileFields.role_arn)
        .requireProperty(ProfileFields.credential_source)
        .requireProperty(ProfileFields.region)
        .optionalProperty(ProfileFields.role_session_name)
        .disallowProperty(ProfileFields.source_profile),
    ProcessProfile: new DuckTyper().requireProperty(ProfileFields.credential_process),
    Unknown: new DuckTyper(),
}

export const ssoSessionDuckTyper = new DuckTyper()
    .requireProperty(SsoSessionFields.sso_start_url)
    .requireProperty(SsoSessionFields.sso_region)
    .optionalProperty(SsoSessionFields.sso_registration_scopes)

export function normalizeSettingList(
    list: string | string[] | null | undefined,
    delimiter: string = ','
): string[] | undefined {
    if (!list) {
        return undefined
    }

    if (!Array.isArray(list)) {
        list = list.split(delimiter)
    }

    return [...new Set(list)]
        .map(item => item.trim())
        .filter(item => item !== '')
        .sort()
}

export class ProfileService {
    constructor(
        private profileStore: ProfileStore,
        private readonly observability: Observability
    ) {}

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async listProfiles(params: ListProfilesParams, token?: CancellationToken): Promise<ListProfilesResult> {
        // Currently only returns non-legacy sso-session profiles, will return more profile types in the future
        return await this.profileStore.load().catch(reason => {
            throw new AwsResponseError(reason.message, { awsErrorCode: AwsErrorCodes.E_CANNOT_READ_SHARED_CONFIG })
        })
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async updateProfile(params: UpdateProfileParams, token?: CancellationToken): Promise<UpdateProfileResult> {
        // Currently only supports non-legacy SSO profiles with sso-sessions
        const result: UpdateProfileResult = {}
        const options = { ...updateProfileOptionsDefaults, ...params.options }

        // Validate params, this will change as more profile kinds are added
        // Validate profile
        this.throwOnInvalidProfile(!params.profile, 'Profile required.')
        const profile = params.profile!

        // Removing this check for profile deletion
        this.throwOnInvalidProfile(
            !profile.kinds.some(kind => Object.values(ProfileKind).includes(kind)),
            'Profile must be non-legacy sso-session or iam-credentials type.'
        )
        this.throwOnInvalidProfile(!profile.name, 'Profile name required.')
        this.throwOnInvalidProfile(!profile.settings, 'Settings required on profile.')
        const profileSettings = profile.settings!

        // Get profiles and SSO sessions to check whether a duplicate will be created
        const { profiles, ssoSessions } = await this.profileStore.load().catch(reason => {
            throw AwsError.wrap(reason, AwsErrorCodes.E_CANNOT_READ_SHARED_CONFIG)
        })

        // Check if the profile can be created
        if (!options.createNonexistentProfile && !profiles.some(p => p.name === profile.name)) {
            this.observability.logging.log(`Cannot create profile. options: ${JSON.stringify(options)}`)
            throw new AwsError('Cannot create profile.', AwsErrorCodes.E_CANNOT_CREATE_PROFILE)
        }

        // Validate SSO profile
        if (profile.kinds.includes(ProfileKind.SsoTokenProfile)) {
            this.throwOnInvalidProfile(!profileSettings.sso_session, 'Sso-session name required on profile.')
            this.throwOnInvalidSsoSession(!params.ssoSession, 'Sso-session required.')
            const ssoSession: SsoSession = params.ssoSession!

            this.throwOnInvalidSsoSession(!ssoSession.name, 'Sso-session name required.')
            this.throwOnInvalidSsoSession(!ssoSession.settings, 'Settings required on sso-session.')
            const ssoSessionSettings = ssoSession.settings!

            this.throwOnInvalidSsoSession(!ssoSessionSettings.sso_region, 'Sso-session region required.')
            this.throwOnInvalidSsoSession(!ssoSessionSettings.sso_start_url, 'Sso-session start URL required.')

            this.throwOnInvalidProfile(
                profileSettings.sso_session !== ssoSession.name,
                'Profile sso-session name must be the same as provided sso-session.'
            )

            // Check if the SSO session can be created
            if (!options.createNonexistentSsoSession && !ssoSessions.some(s => s.name === ssoSession.name)) {
                this.observability.logging.log(`Cannot create sso-session. options: ${JSON.stringify(options)}`)
                throw new AwsError('Cannot create sso-session.', AwsErrorCodes.E_CANNOT_CREATE_SSO_SESSION)
            }

            // Check if the SSO session can be updated
            if (
                !options.updateSharedSsoSession &&
                this.isSharedSsoSession(ssoSession.name, profiles, profile.name) &&
                this.willUpdateExistingSsoSession(ssoSession, ssoSessions)
            ) {
                this.observability.logging.log(`Cannot update shared sso-session. options: ${JSON.stringify(options)}`)
                throw new AwsError('Cannot update shared sso-session.', AwsErrorCodes.E_CANNOT_OVERWRITE_SSO_SESSION)
            }
        }

        // Validate IAM profiles
        if (profile.kinds.includes(ProfileKind.IamUserProfile)) {
            this.throwOnInvalidProfile(!profileSettings.aws_access_key_id, 'Access key required on profile.')
            this.throwOnInvalidProfile(!profileSettings.aws_secret_access_key, 'Secret key required on profile.')
        }

        if (profile.kinds.includes(ProfileKind.RoleInstanceProfile)) {
            this.throwOnInvalidProfile(!profileSettings.role_arn, 'Role ARN required on profile.')
            this.throwOnInvalidProfile(!profileSettings.region, 'Region required on profile.')
            this.throwOnInvalidProfile(!profileSettings.credential_source, 'Credential source required on profile.')
        }

        if (profile.kinds.includes(ProfileKind.RoleSourceProfile)) {
            this.throwOnInvalidProfile(!profileSettings.role_arn, 'Role ARN required on profile.')
            this.throwOnInvalidProfile(!profileSettings.source_profile, 'Source profile required on profile.')
        }

        if (profile.kinds.includes(ProfileKind.ProcessProfile)) {
            this.throwOnInvalidProfile(!profileSettings.credential_process, 'Credential process required on profile.')
        }

        await this.profileStore
            .save({
                profiles: [params.profile],
                ssoSessions: params.ssoSession ? [params.ssoSession] : [],
            })
            .catch(reason => {
                throw AwsError.wrap(reason, AwsErrorCodes.E_CANNOT_WRITE_SHARED_CONFIG)
            })

        return result
    }

    private willUpdateExistingSsoSession(ssoSession: SsoSession, ssoSessions: SsoSession[]): boolean {
        const other = ssoSessions.find(s => s.name === ssoSession.name)

        if (!(ssoSession.settings && other?.settings)) {
            return false
        }

        return (
            ssoSession.settings.sso_region !== other.settings.sso_region ||
            ssoSession.settings.sso_start_url !== other.settings.sso_start_url ||
            normalizeSettingList(ssoSession.settings.sso_registration_scopes) !==
                normalizeSettingList(other.settings.sso_registration_scopes)
        )
    }

    private isSharedSsoSession(ssoSessionName: string, profiles: Profile[], skipProfileName: string): boolean {
        for (const profile of profiles) {
            if (profile.name !== skipProfileName && profile.settings?.sso_session === ssoSessionName) {
                return true
            }
        }

        return false
    }

    private throwOnInvalidProfile(expr: boolean, message: string): void {
        this.throwOnInvalid(expr, message, AwsErrorCodes.E_INVALID_PROFILE)
    }

    private throwOnInvalidSsoSession(expr: boolean, message: string): void {
        this.throwOnInvalid(expr, message, AwsErrorCodes.E_INVALID_SSO_SESSION)
    }

    private throwOnInvalid(expr: boolean, message: string, awsErrorCode: string): void {
        if (expr) {
            this.observability.logging.log(message)
            throw new AwsError(message, awsErrorCode)
        }
    }
}
