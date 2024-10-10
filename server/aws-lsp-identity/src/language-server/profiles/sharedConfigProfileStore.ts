import {
    normalizeSettingList,
    ProfileData,
    profileDuckTypers,
    ProfileStore,
    ssoSessionDuckTyper,
} from './profileService'
import { parseKnownFiles, SharedConfigInit } from '@smithy/shared-ini-file-loader'
import { IniSection, IniSectionType, ParsedIniData } from '@smithy/types'
import { ProfileKind, SsoSession } from '@aws/language-server-runtimes/server-interface'
import { SectionHeader } from '../../sharedConfig/types'
import { saveKnownFiles } from '../../sharedConfig'
import { normalizeParsedIniData } from '../../sharedConfig/saveKnownFiles'

// Uses AWS SDK for JavaScript v3
// Applies shared config files location resolution, but JVM system properties are not supported
// https://docs.aws.amazon.com/sdkref/latest/guide/file-location.html

type Section = { name: string; settings?: object }

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
                    result.profiles.push({
                        kinds: [
                            // As more profile kinds are added this will get more complex and need refactored
                            profileDuckTypers.SsoTokenProfile.eval(settings)
                                ? ProfileKind.SsoTokenProfile
                                : ProfileKind.Unknown,
                        ],
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
                        ssoSession.settings!.sso_registration_scopes = normalizeSettingList(
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

    // If a setting is set to undefined or null, it will be removed from shared config files
    // If the settings property is set to undefined or null, the entire section will be removed
    // from the shared config files.  This is equivalent to deleting a section.
    // Any settings or sections in the shared config files that are not passed into data will
    // be preserved as-is.
    async save(data: ProfileData, init?: SharedConfigInit): Promise<void> {
        if (!(data?.profiles?.length || data?.ssoSessions?.length)) {
            return
        }

        init = this.getSharedConfigInit(init)
        const parsedKnownFiles = normalizeParsedIniData(await parseKnownFiles(init))

        if (data.profiles) {
            this.applySectionsToParsedIni(
                IniSectionType.PROFILE,
                data.profiles,
                parsedKnownFiles,
                (section, parsedSection) =>
                    !section.kinds.includes(ProfileKind.SsoTokenProfile) ||
                    profileDuckTypers.SsoTokenProfile.eval(parsedSection)
            )
        }

        if (data.ssoSessions) {
            this.applySectionsToParsedIni(
                IniSectionType.SSO_SESSION,
                data.ssoSessions,
                parsedKnownFiles,
                (_, parsedSection) => ssoSessionDuckTyper.eval(parsedSection)
            )
        }

        await saveKnownFiles(parsedKnownFiles, init)
    }

    private applySectionsToParsedIni<T extends Section>(
        sectionType: IniSectionType,
        sections: T[],
        parsedKnownFiles: ParsedIniData,
        validator: (section: T, parsedSection: IniSection) => boolean
    ): void {
        for (const section of sections) {
            if (!section?.name) {
                throw new Error('Section name is required.')
            }

            const parsedSectionName = new SectionHeader(section.name, sectionType).toParsedSectionName()

            // Remove sections that have no settings
            if (!section.settings) {
                delete parsedKnownFiles[parsedSectionName]
                continue
            }

            const parsedSection = (parsedKnownFiles[parsedSectionName] ||= {})

            // eslint-disable-next-line prefer-const
            for (let [name, value] of Object.entries(section.settings)) {
                if (Array.isArray(value)) {
                    value = normalizeSettingList(value)?.join(',') ?? ''
                }

                // If and when needed in the future, handle object types for subsections (e.g. api_versions)

                // If setting passed with null or undefined then remove setting
                // If setting passed with any other value then update setting
                // If setting not passed then preserve setting in file as-is
                if (value === null || value === undefined) {
                    Object.hasOwn(parsedSection, name) && delete parsedSection[name]
                } else {
                    parsedSection[name] = value.toString()
                }
            }

            if (!validator(section, parsedSection)) {
                throw new Error(`Section [${parsedSectionName}] is invalid.`)
            }
        }
    }

    private getSharedConfigInit(init?: SharedConfigInit): SharedConfigInit {
        return init ?? this.init ?? {}
    }
}
