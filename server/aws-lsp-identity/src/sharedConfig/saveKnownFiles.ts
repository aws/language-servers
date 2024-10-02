import { getHomeDir, loadSharedConfigFiles, SharedConfigInit } from '@smithy/shared-ini-file-loader'
import { ParsedIniData } from '@smithy/types'
import { join } from 'path'
import { unmergeConfigFiles } from './unmergeConfigFiles'
import { IniFileType } from './types'
import { saveSharedConfigFile } from './saveSharedConfigFile'

export async function saveKnownFiles(parsedKnownFiles: ParsedIniData, init: SharedConfigInit): Promise<void> {
    init = { ...init } // Don't mutate passed init, make shallow copy
    init.filepath ||= getCredentialsFilepath()
    init.configFilepath ||= getConfigFilepath()

    const { configFile, credentialsFile } = await loadSharedConfigFiles(init)
    normalizeParsedIniData(configFile)
    normalizeParsedIniData(credentialsFile)

    unmergeConfigFiles(parsedKnownFiles, configFile, credentialsFile)

    await saveSharedConfigFile(init.configFilepath, IniFileType.config, configFile)
    await saveSharedConfigFile(init.filepath, IniFileType.credentials, credentialsFile)
}

export function normalizeParsedIniData(parsedIniData: ParsedIniData): ParsedIniData {
    for (const [_, sectionValue] of Object.entries(parsedIniData)) {
        for (const [settingName, settingValue] of Object.entries(sectionValue)) {
            if (settingName !== settingName.toLowerCase()) {
                sectionValue[settingName.toLowerCase()] = settingValue
                delete sectionValue[settingName]
            }
        }
    }

    return parsedIniData
}

// Based on:
// https://github.com/smithy-lang/smithy-typescript/blob/main/packages/shared-ini-file-loader/src/getCredentialsFilepath.ts
function getCredentialsFilepath(): string {
    return getSharedConfigFilepath('credentials', 'AWS_SHARED_CREDENTIALS_FILE')
}

// Based on:
// https://github.com/smithy-lang/smithy-typescript/blob/main/packages/shared-ini-file-loader/src/getConfigFilepath.ts
function getConfigFilepath(): string {
    return getSharedConfigFilepath('config', 'AWS_CONFIG_FILE')
}

function getSharedConfigFilepath(filename: string, envVar: string): string {
    const envVarValue = process.env[envVar]
    if (envVarValue) {
        return envVarValue.startsWith('~/') ? join(getHomeDir(), envVarValue.substring(2)) : envVarValue
    }

    return join(getHomeDir(), '.aws', filename)
}
