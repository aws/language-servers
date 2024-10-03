import {
    ListProfilesError,
    ListProfilesParams,
    ListProfilesResult,
    Profile,
    ProfileKind,
    SsoSession,
} from '@aws/language-server-runtimes/protocol/identity-management'
import {
    UpdateProfileError,
    UpdateProfileErrorData,
    updateProfileOptionsDefaults,
    UpdateProfileParams,
    UpdateProfileResult,
} from '@aws/language-server-runtimes/protocol/identity-management'
import { CancellationToken } from 'vscode-languageserver'
import {
    AwsErrorCodes,
    AwsResponseError,
    AwsResponseErrorData,
} from '@aws/language-server-runtimes/protocol/identity-management'
import { SharedConfigInit } from '@smithy/shared-ini-file-loader'
import { DuckTyper } from '../../utils/duckTyper'

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
}

export const ssoSessionDuckTyper = new DuckTyper()
    .requireProperty(SsoSessionFields.sso_start_url)
    .requireProperty(SsoSessionFields.sso_region)
    .optionalProperty(SsoSessionFields.sso_registration_scopes)

export function detectProfileKind(profile: object): ProfileKind {
    return (profileDuckTypers.SsoTokenProfile.eval(profile) && ProfileKind.SsoTokenProfile) || ProfileKind.Unknown
}

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
    constructor(private store: ProfileStore) {}

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async listProfiles(params: ListProfilesParams, token?: CancellationToken): Promise<ListProfilesResult> {
        // Currently only returns non-legacy sso-session profiles, will return more profile types in the future
        return await this.tryAsync(
            this.store.load,
            messageOrError =>
                new ListProfilesError(messageOrError, { awsErrorCode: AwsErrorCodes.E_CANNOT_READ_SHARED_CONFIG })
        )
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async updateProfile(params: UpdateProfileParams, _token?: CancellationToken): Promise<UpdateProfileResult> {
        // Currently only supports non-legacy SSO profiles with sso-sessions
        const result: UpdateProfileResult = {}
        const options = { ...updateProfileOptionsDefaults, ...params.options }

        // Validate params
        this.throwOnInvalidProfile(!params.profile, 'Profile required.')
        const profile = params.profile!
        this.throwOnInvalidProfile(
            profile.kind !== ProfileKind.SsoTokenProfile,
            'Profile must be non-legacy sso-session type.'
        )
        this.throwOnInvalidProfile(!profile.name, 'Profile name required.')
        this.throwOnInvalidProfile(!profile.settings.sso_session, 'Sso-session name required on profile.')

        this.throwOnInvalidSsoSession(!params.ssoSession, 'Sso-session required.')
        const ssoSession: SsoSession = params.ssoSession!
        this.throwOnInvalidSsoSession(!ssoSession.name, 'Sso-session name required.')
        this.throwOnInvalidSsoSession(!ssoSession.settings.sso_region, 'Sso-session region required.')
        this.throwOnInvalidSsoSession(!ssoSession.settings.sso_start_url, 'Sso-session start URL required.')

        this.throwOnInvalidProfile(
            profile.settings.sso_session !== ssoSession.name,
            'Profile sso-session name must be the same as provided sso-session.'
        )

        const { profiles, ssoSessions } = await this.tryAsync(
            this.store.load,
            messageOrError =>
                new UpdateProfileError(messageOrError, { awsErrorCode: AwsErrorCodes.E_CANNOT_READ_SHARED_CONFIG })
        )

        // Enforce options
        if (!options.createNonexistentProfile && !profiles.some(p => p.name === profile.name)) {
            throw new UpdateProfileError('Cannot create profile.', {
                awsErrorCode: AwsErrorCodes.E_CANNOT_CREATE_PROFILE,
            })
        }

        if (!options.createNonexistentSsoSession && !ssoSessions.some(s => s.name === ssoSession.name)) {
            throw new UpdateProfileError('Cannot create sso-session.', {
                awsErrorCode: AwsErrorCodes.E_CANNOT_CREATE_SSO_SESSION,
            })
        }

        if (
            !options.updateSharedSsoSession &&
            this.isSharedSsoSession(ssoSession.name, profiles, profile.name) &&
            this.willUpdateExistingSsoSession(ssoSession, ssoSessions)
        ) {
            throw new UpdateProfileError('Cannot update shared sso-session.', {
                awsErrorCode: AwsErrorCodes.E_CANNOT_OVERWRITE_SSO_SESSION,
            })
        }

        // Update profile for profile store
        const parsedProfile = profiles.find(p => p.name === profile.name)
        if (parsedProfile) {
            parsedProfile.settings = {
                ...parsedProfile.settings,
                ...{
                    region: profile.settings.region,
                    sso_session: profile.settings.sso_session,
                },
            }
        } else {
            profiles.push({
                kind: ProfileKind.SsoTokenProfile,
                name: profile.name,
                settings: profile.settings,
            })
        }

        // Update sso-session for sso-session store
        const parsedSsoSession = ssoSessions.find(s => s.name === ssoSession.name)
        if (parsedSsoSession) {
            parsedSsoSession.settings = {
                ...parsedSsoSession.settings,
                ...{
                    sso_region: ssoSession.settings.sso_region,
                    sso_start_url: ssoSession.settings.sso_start_url,
                    sso_registration_scopes: normalizeSettingList(ssoSession.settings.sso_registration_scopes),
                },
            }
        } else {
            ssoSessions.push({
                name: ssoSession.name,
                settings: ssoSession.settings,
            })
        }

        await this.tryAsync(
            () => this.store.save({ profiles, ssoSessions }),
            messageOrError =>
                new UpdateProfileError(messageOrError, { awsErrorCode: AwsErrorCodes.E_CANNOT_WRITE_SHARED_CONFIG })
        )

        return result
    }

    private async tryAsync<R, E extends AwsResponseError<AwsResponseErrorData>>(
        tryThis: () => Promise<R>,
        catchIt: (messageOrError: string | Error) => E
    ): Promise<R> {
        try {
            return await tryThis()
        } catch (e) {
            throw catchIt(e instanceof Error ? e : (e as object)?.toString())
        }
    }

    private willUpdateExistingSsoSession(ssoSession: SsoSession, ssoSessions: SsoSession[]): boolean {
        const other = ssoSessions.find(s => s.name === ssoSession.name)

        if (!other) {
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
            if (profile.name !== skipProfileName && profile.settings.sso_session === ssoSessionName) {
                return true
            }
        }

        return false
    }

    private throwOnInvalidProfile(expr: boolean, message: string): void {
        this.throwOnInvalid(expr, message, { awsErrorCode: AwsErrorCodes.E_INVALID_PROFILE })
    }

    private throwOnInvalidSsoSession(expr: boolean, message: string): void {
        this.throwOnInvalid(expr, message, { awsErrorCode: AwsErrorCodes.E_INVALID_SSO_SESSION })
    }

    private throwOnInvalid(expr: boolean, message: string, data: UpdateProfileErrorData): void {
        if (expr) {
            throw new UpdateProfileError(message, data)
        }
    }
}
