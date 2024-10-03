import {
    normalizeSettingList,
    ProfileData,
    profileDuckTypers,
    ProfileStore,
    ssoSessionDuckTyper,
} from './profileService'
import { parseKnownFiles, SharedConfigInit } from '@smithy/shared-ini-file-loader'
import { IniSectionType, ParsedIniData } from '@smithy/types'
import { ProfileKind, SsoSession } from '@aws/language-server-runtimes/protocol/identity-management'
import { SectionHeader } from '../../sharedConfig/types'
import { saveKnownFiles } from '../../sharedConfig'
import { normalizeParsedIniData } from '../../sharedConfig/saveKnownFiles'

// Uses AWS SDK for JavaScript v3
// Applies shared config files location resolution, but JVM system properties are not supported
// https://docs.aws.amazon.com/sdkref/latest/guide/file-location.html

type Section = { name: string; settings: object }

const ssoAccountAccessScope = 'sso:account:access'

export class SharedConfigProfileStore implements ProfileStore {
    constructor(private init: SharedConfigInit = { ignoreCache: true }) {}

    async load(init?: SharedConfigInit): Promise<ProfileData> {
        const result: ProfileData = {
            profiles: [],
            ssoSessions: [],
        }

        const parsedIni = normalizeParsedIniData(await parseKnownFiles(this.getSharedConfigInit(init)))

        for (const [parsedSectionName, settings] of Object.entries(parsedIni)) {
            const sectionHeader = SectionHeader.fromParsedSectionName(parsedSectionName)
            switch (sectionHeader.type) {
                case IniSectionType.PROFILE:
                    // Limiting to SSO token profiles is only temporary, more profile types will be added
                    // and returned in the future, so use the kind property to filter.
                    if (!profileDuckTypers.SsoTokenProfile.eval(settings)) {
                        continue
                    }

                    result.profiles.push({
                        kind: ProfileKind.SsoTokenProfile,
                        name: sectionHeader.name,
                        settings: {
                            // Only apply settings expected on Profile
                            region: settings.region,
                            sso_session: settings.sso_session,
                        },
                    })
                    break
                case IniSectionType.SSO_SESSION: {
                    if (!ssoSessionDuckTyper.eval(settings)) {
                        continue
                    }

                    const ssoSession: SsoSession = {
                        name: sectionHeader.name,
                        settings: {
                            // Only apply settings expected on SsoSession
                            sso_region: settings.sso_region!,
                            sso_start_url: settings.sso_start_url!,
                        },
                    }

                    if (settings.sso_registration_scopes) {
                        ssoSession.settings.sso_registration_scopes = normalizeSettingList(
                            settings.sso_registration_scopes
                        )
                    }

                    result.ssoSessions.push(ssoSession)
                    break
                }
                // IniSectionType.SERVICES not currently supported
            }
        }

        return result
    }

    async save(data: ProfileData, init?: SharedConfigInit): Promise<void> {
        // Safety check.  If there is ever a valid reason for the caller to delete all profiles
        // and sso-sessions, add an options parameter with a setting to show the intent.  This
        // is to guard against buggy code accidentally wiping out the users files.
        if (!(data?.profiles?.length || data?.ssoSessions?.length)) {
            return
        }

        init = this.getSharedConfigInit(init)
        const parsedKnownFiles = normalizeParsedIniData(await parseKnownFiles(init))

        this.applySectionsToParsedIni(
            data.profiles,
            parsedKnownFiles,
            section =>
                section.kind === ProfileKind.SsoTokenProfile && profileDuckTypers.SsoTokenProfile.eval(section.settings)
        )

        // Ensure all SsoSessions have sso:account:access set explicitly to support token refresh
        for (const ssoSession of data.ssoSessions) {
            if (!ssoSession.settings.sso_registration_scopes) {
                ssoSession.settings.sso_registration_scopes = [ssoAccountAccessScope]
                continue
            }

            if (!ssoSession.settings.sso_registration_scopes.includes(ssoAccountAccessScope)) {
                ssoSession.settings.sso_registration_scopes.push(ssoAccountAccessScope)
            }
        }

        this.applySectionsToParsedIni(data.ssoSessions, parsedKnownFiles, section =>
            ssoSessionDuckTyper.eval(section.settings)
        )

        await saveKnownFiles(parsedKnownFiles, init)
    }

    private applySectionsToParsedIni<T extends Section>(
        sections: T[],
        parsedKnownFiles: ParsedIniData,
        validator: (section: T) => boolean
    ): void {
        for (const section of sections) {
            if (!section?.name) {
                throw new Error('Section name is required.')
            }

            if (!validator(section)) {
                throw new Error(`Section [${section.name}] is invalid.`)
            }

            const parsedSection = (parsedKnownFiles[section.name] ||= {})

            // eslint-disable-next-line prefer-const
            for (let [name, value] of Object.entries(section.settings)) {
                if (Array.isArray(value)) {
                    value = normalizeSettingList(value)?.join(',') ?? ''
                }

                // If and when needed in the future, handle object types for subsections

                if (!value) {
                    throw new Error(`Setting [${name}] must have a value.`)
                }

                parsedSection[name] = value.toString()
            }
        }
    }

    private getSharedConfigInit(init?: SharedConfigInit): SharedConfigInit {
        return init ?? this.init ?? {}
    }
}
