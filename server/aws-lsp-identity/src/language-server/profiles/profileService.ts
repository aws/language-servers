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
import { SharedConfigInit, getHomeDir } from '@smithy/shared-ini-file-loader'
import { DuckTyper } from '../../duckTyper'
import { AwsError, Observability } from '@aws/lsp-core'
import { watch, FSWatcher } from 'fs'
import { join } from 'path'

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
    external_id: 'external_id',
    credential_cache: 'credential_cache',
    credential_cache_location: 'credential_cache_location',
} as const

export const SsoSessionFields = {
    sso_region: 'sso_region',
    sso_registration_scopes: 'sso_registration_scopes',
    sso_start_url: 'sso_start_url',
} as const

export const profileTypes = {
    SsoTokenProfile: {
        kind: ProfileKind.SsoTokenProfile,
        required: [ProfileFields.sso_session],
        optional: [ProfileFields.region],
        disallowed: [ProfileFields.sso_account_id, ProfileFields.sso_role_name],
    },
    IamCredentialsProfile: {
        kind: ProfileKind.IamCredentialsProfile,
        required: [ProfileFields.aws_access_key_id, ProfileFields.aws_secret_access_key],
        optional: [ProfileFields.aws_session_token],
        disallowed: [],
    },
    IamSourceProfileProfile: {
        kind: ProfileKind.IamSourceProfileProfile,
        required: [ProfileFields.role_arn, ProfileFields.source_profile],
        optional: [
            ProfileFields.external_id,
            ProfileFields.role_session_name,
            ProfileFields.region,
            ProfileFields.mfa_serial,
            ProfileFields.credential_cache,
            ProfileFields.credential_cache_location,
        ],
        disallowed: [ProfileFields.credential_source],
    },
    IamCredentialSourceProfile: {
        kind: ProfileKind.IamCredentialSourceProfile,
        required: [ProfileFields.role_arn, ProfileFields.credential_source],
        optional: [
            ProfileFields.external_id,
            ProfileFields.role_session_name,
            ProfileFields.region,
            ProfileFields.credential_cache,
            ProfileFields.credential_cache_location,
        ],
        disallowed: [ProfileFields.source_profile],
    },
    IamCredentialProcessProfile: {
        kind: ProfileKind.IamCredentialProcessProfile,
        required: [ProfileFields.credential_process],
        optional: [],
        disallowed: [],
    },
} as const

export const profileDuckTypers = Object.fromEntries(
    Object.entries(profileTypes).map(([key, def]) => [
        key,
        (() => {
            const typer = new DuckTyper()
            for (const field of def.required) {
                typer.requireProperty(field)
            }
            for (const field of def.optional) {
                typer.optionalProperty(field)
            }
            for (const field of def.disallowed) {
                typer.disallowProperty(field)
            }
            return typer
        })(),
    ])
)

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
    private fileWatchers: FSWatcher[] = []
    private profileCache?: ProfileData
    private onProfileChange?: (profiles: ProfileData) => void

    constructor(
        private profileStore: ProfileStore,
        private readonly observability: Observability
    ) {
        this.startWatching()
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async listProfiles(params: ListProfilesParams, token?: CancellationToken): Promise<ListProfilesResult> {
        // Currently only returns non-legacy sso-session profiles, will return more profile types in the future
        if (this.profileCache) {
            return this.profileCache
        }
        const profiles = await this.profileStore.load().catch(reason => {
            throw new AwsResponseError(reason.message, { awsErrorCode: AwsErrorCodes.E_CANNOT_READ_SHARED_CONFIG })
        })
        this.profileCache = profiles
        return profiles
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

        // TODO: can this be refactored and simplified using the existing DuckTypers?
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
        if (profile.kinds.includes(ProfileKind.IamCredentialsProfile)) {
            this.throwOnInvalidProfile(!profileSettings.aws_access_key_id, 'Access key required on profile.')
            this.throwOnInvalidProfile(!profileSettings.aws_secret_access_key, 'Secret key required on profile.')
        }

        if (profile.kinds.includes(ProfileKind.IamCredentialSourceProfile)) {
            this.throwOnInvalidProfile(!profileSettings.role_arn, 'Role ARN required on profile.')
            this.throwOnInvalidProfile(!profileSettings.credential_source, 'Credential source required on profile.')
        }

        if (profile.kinds.includes(ProfileKind.IamSourceProfileProfile)) {
            this.throwOnInvalidProfile(!profileSettings.role_arn, 'Role ARN required on profile.')
            this.throwOnInvalidProfile(!profileSettings.source_profile, 'Source profile required on profile.')
        }

        if (profile.kinds.includes(ProfileKind.IamCredentialProcessProfile)) {
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

    startWatching(onChange?: (profiles: ProfileData) => void): void {
        if (this.fileWatchers.length > 0) {
            return
        }

        this.onProfileChange = onChange
        const configPath = this.getConfigFilepath()
        const credentialsPath = this.getCredentialsFilepath()

        const handleChange = async () => {
            try {
                const newProfiles = await this.profileStore.load()
                this.profileCache = newProfiles
                this.onProfileChange?.(newProfiles)
            } catch (error) {
                this.observability.logging.log(`Error reloading profiles: ${error}`)
            }
        }

        this.fileWatchers.push(watch(configPath, { persistent: false }, handleChange))
        this.fileWatchers.push(watch(credentialsPath, { persistent: false }, handleChange))
    }

    stopWatching(): void {
        this.fileWatchers.forEach(watcher => watcher.close())
        this.fileWatchers = []
        this.onProfileChange = undefined
    }

    private getConfigFilepath(): string {
        const envVar = process.env['AWS_CONFIG_FILE']
        if (envVar) {
            return envVar.startsWith('~/') ? join(getHomeDir(), envVar.substring(2)) : envVar
        }
        return join(getHomeDir(), '.aws', 'config')
    }

    private getCredentialsFilepath(): string {
        const envVar = process.env['AWS_SHARED_CREDENTIALS_FILE']
        if (envVar) {
            return envVar.startsWith('~/') ? join(getHomeDir(), envVar.substring(2)) : envVar
        }
        return join(getHomeDir(), '.aws', 'credentials')
    }
}
