import { IniSection, ParsedIniData } from '@smithy/types'

/**
 * Recommended:
 * Store all non-secret settings in config, only store secret settings in creds
 *
 * Retain:
 * If setting doesn't exist, use Recommended rules
 * If setting defined exclusively in one file, overwrite in that file
 * If setting defined in both files (tiebreaker):
 *   1) Recommended rules (preferConfig)
 *   2) overwrite creds, retain config (updateCredentials)
 *   3) overwrite both (updateBoth)
 *
 * {
 *     mode: 'preferConfig' | 'retain',
 *     tiebreaker: 'preferConfig' | 'updateCredentials' | 'updateBoth'
 * }
 *
 * aws_access_key_id, aws_secret_access_key, and aws_session_token are considered secret
 */

export function unmergeConfigFiles(
    parsedKnownFiles: ParsedIniData,
    configFile: ParsedIniData,
    credentialsFile: ParsedIniData
): void {
    // Assume sections not passed in parsedKnownFiles have been deleted
    removeDeletedEntries({ removeFrom: configFile, deletedFrom: parsedKnownFiles })
    removeDeletedEntries({ removeFrom: credentialsFile, deletedFrom: parsedKnownFiles })

    // Unmerge parsedKnownFiles into configFile and credentialsFile
    for (const [parsedSectionName, parsedSettings] of Object.entries(parsedKnownFiles)) {
        unmergeSectionToConfigFiles(parsedSectionName, parsedSettings, configFile, credentialsFile)
    }
}

// An options parameter can be added to allow variations in heuristics/rules for unmerging, but for now
// it is fixed with a focus on retaining as much of the customer's file as reasonable, applying best practices
// in cases where security is a concern.
function unmergeSectionToConfigFiles(
    sectionName: string,
    mergedSettings: IniSection,
    configFile: ParsedIniData,
    credentialsFile: ParsedIniData
): void {
    const configSection = (configFile[sectionName] ||= {})
    const credentialsSection = (credentialsFile[sectionName] ||= {})

    // Remove existing settings not on mergedSettings (i.e. deleted)
    removeDeletedEntries({ removeFrom: configSection, deletedFrom: mergedSettings })
    removeDeletedEntries({ removeFrom: credentialsSection, deletedFrom: mergedSettings })

    // Apply each setting to the correct file section, in some cases, both
    for (const [settingName, settingValue] of Object.entries(mergedSettings)) {
        const inConfig: boolean = configSection && Object.hasOwn(configSection, settingName)
        const inCredentials: boolean = credentialsSection && Object.hasOwn(credentialsSection, settingName)

        // BEST PRACTICE: Secrets should be stored in credentials only
        // https://docs.aws.amazon.com/sdkref/latest/guide/file-format.html#file-format-creds
        if (isSecretSetting(settingName)) {
            credentialsSection[settingName] = settingValue

            if (inConfig) {
                delete configSection[settingName]
            }
            continue
        }

        // Whether non-secret setting wasn't previously stored or just in config, prefer config
        if (!inCredentials) {
            configSection[settingName] = settingValue
            continue
        }

        // Otherwise set in credentials and only update in config if it exists
        credentialsSection[settingName] = settingValue
        inConfig && (configSection[settingName] = settingValue)
    }

    // Remove empty sections
    !Object.keys(configSection).length && delete configFile[sectionName]
    !Object.keys(credentialsSection).length && delete credentialsFile[sectionName]
}

export function removeDeletedEntries(args: { removeFrom: Record<string, unknown>; deletedFrom: object }): void {
    const { removeFrom, deletedFrom } = args

    if (!(removeFrom && deletedFrom)) {
        return
    }

    for (const key of Object.keys(removeFrom)) {
        if (!Object.hasOwn(deletedFrom, key)) {
            delete removeFrom[key]
        }
    }
}

function isSecretSetting(name: string): boolean {
    // Settings containing "secrets" as defined in the public docs are to be stored in creds
    // if not already defined in config (this is for "retain" support, future options may
    // allow forcing secrets to always be written to credentials, existing or not).
    // https://docs.aws.amazon.com/sdkref/latest/guide/file-format.html#file-format-creds
    return ['aws_access_key_id', 'aws_secret_access_key', 'aws_session_token'].includes(name)
}
