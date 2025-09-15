import {
    normalizeSettingList,
    ProfileData,
    profileDuckTypers,
    ProfileStore,
    ssoSessionDuckTyper,
} from './profileService'
import { parseKnownFiles, SharedConfigInit } from '@smithy/shared-ini-file-loader'
import { IniSection, IniSectionType, ParsedIniData } from '@smithy/types'
import { AwsErrorCodes, ProfileKind, SsoSession } from '@aws/language-server-runtimes/server-interface'
import { SectionHeader } from '../../sharedConfig/types'
import { saveKnownFiles } from '../../sharedConfig'
import { normalizeParsedIniData } from '../../sharedConfig/saveKnownFiles'
import { AwsError, Observability } from '@aws/lsp-core'

// Uses AWS SDK for JavaScript v3
// Applies shared config files location resolution, but JVM system properties are not supported
// https://docs.aws.amazon.com/sdkref/latest/guide/file-location.html

type Section = { name: string; settings?: object }

// eslint-disable-next-line no-control-regex
const controlCharsRegex = /[\x00-\x1F\x7F-\x9F]/

export class SharedConfigProfileStore implements ProfileStore {
    constructor(
        private readonly observability: Observability,
        private readonly init: SharedConfigInit = { ignoreCache: true }
    ) {}

    async load(init?: SharedConfigInit): Promise<ProfileData> {
        const result: ProfileData = {
            profiles: [],
            ssoSessions: [],
        }

        const parsedIni = normalizeParsedIniData(
            await parseKnownFiles(this.getSharedConfigInit(init)).catch(reason => {
                this.observability.logging.log(`Unable to load shared config. ${reason}`)
                throw AwsError.wrap(reason, AwsErrorCodes.E_CANNOT_READ_SHARED_CONFIG)
            })
        )

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

        this.observability.logging.log('Loaded shared config.')
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
        const parsedKnownFiles = normalizeParsedIniData(
            await parseKnownFiles(this.getSharedConfigInit(init)).catch(reason => {
                this.observability.logging.log(`Unable to load shared config for saving. ${reason}`)
                throw AwsError.wrap(reason, AwsErrorCodes.E_CANNOT_READ_SHARED_CONFIG)
            })
        )

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

        await saveKnownFiles(parsedKnownFiles, init).catch(reason => {
            this.observability.logging.log(`Unable to save shared config. ${reason}`)
            throw AwsError.wrap(reason, AwsErrorCodes.E_CANNOT_WRITE_SHARED_CONFIG)
        })

        this.observability.logging.log('Saved shared config.')
    }

    private applySectionsToParsedIni<T extends Section>(
        sectionType: IniSectionType.PROFILE | IniSectionType.SSO_SESSION, // SERVICES not currently supported
        sections: T[],
        parsedKnownFiles: ParsedIniData,
        validator: (section: T, parsedSection: IniSection) => boolean
    ): void {
        const throwAwsError = (message: string) => {
            throw new AwsError(
                message,
                sectionType === IniSectionType.PROFILE
                    ? AwsErrorCodes.E_INVALID_PROFILE
                    : AwsErrorCodes.E_INVALID_SSO_SESSION
            )
        }

        for (const section of sections) {
            if (!section?.name) {
                throwAwsError('Section name is required.')
            }

            const parsedSectionName = new SectionHeader(section.name, sectionType).toParsedSectionName()

            // Remove sections that have no settings
            if (
                section.settings === undefined ||
                section.settings === null ||
                Object.keys(section.settings).length === 0
            ) {
                delete parsedKnownFiles[parsedSectionName]
                continue
            }

            // Settings must be an object
            if (section.settings !== Object(section.settings)) {
                throwAwsError('Section contains invalid settings value.')
            }

            const parsedSection = (parsedKnownFiles[parsedSectionName] ||= {})

            // eslint-disable-next-line prefer-const
            for (let [name, value] of Object.entries(section.settings)) {
                if (Array.isArray(value)) {
                    value = normalizeSettingList(value)?.join(',') ?? ''
                }

                // If and when needed in the future, handle object types for subsections (e.g. api_versions)
                if (value === Object(value)) {
                    throwAwsError(`Setting [${name}] cannot be an object.`)
                }

                // If setting passed with null or undefined then remove setting
                // If setting passed with any other value then update setting
                // If setting not passed then preserve setting in file as-is
                value = value?.toString().trim()
                if (value === undefined || value === null || value === '') {
                    Object.hasOwn(parsedSection, name) && delete parsedSection[name]
                } else {
                    if (controlCharsRegex.test(value)) {
                        throwAwsError(`Setting [${name}] cannot contain control characters.`)
                    }

                    parsedSection[name] = value.toString()
                }
            }

            if (!validator(section, parsedSection)) {
                throwAwsError('Section is invalid.')
            }
        }
    }

    private getSharedConfigInit(init?: SharedConfigInit): SharedConfigInit {
        return init ?? this.init ?? {}
    }
}
