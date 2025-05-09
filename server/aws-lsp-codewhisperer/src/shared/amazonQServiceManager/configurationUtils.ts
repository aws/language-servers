import { Logging, Lsp, Runtime } from '@aws/language-server-runtimes/server-interface'
import { CODE_WHISPERER_CONFIGURATION_SECTION, Q_CONFIGURATION_SECTION } from '../constants'
import { textUtils } from '@aws/lsp-core'
import {
    AWS_Q_ENDPOINT_URL_ENV_VAR,
    AWS_Q_ENDPOINTS,
    AWS_Q_REGION_ENV_VAR,
    DEFAULT_AWS_Q_ENDPOINT_URL,
    DEFAULT_AWS_Q_REGION,
} from '../constants'

export interface AmazonQRegionAndEndpoint {
    region: string
    endpoint: string
}

/**
 * Determines Q region according to the following discovery chain:
 *
 * provided region (e.g. by client or profile) -> region set in runtime -> default region
 *
 * @returns region and endpoint for Q connection
 */
export function getAmazonQRegionAndEndpoint(
    runtime: Runtime,
    logging: Logging,
    region?: string
): AmazonQRegionAndEndpoint {
    let amazonQRegion: string
    let amazonQEndpoint: string | undefined

    if (region) {
        logging.log(`Selecting region (found: ${region}) provided by caller`)
        amazonQRegion = region
        amazonQEndpoint = AWS_Q_ENDPOINTS.get(amazonQRegion)
    } else {
        const runtimeRegion = runtime.getConfiguration(AWS_Q_REGION_ENV_VAR)

        if (runtimeRegion) {
            logging.log(`Selecting region (found: ${runtimeRegion}) provided by runtime`)
            amazonQRegion = runtimeRegion
            amazonQEndpoint = runtime.getConfiguration(AWS_Q_ENDPOINT_URL_ENV_VAR) ?? AWS_Q_ENDPOINTS.get(amazonQRegion)
        } else {
            logging.log(
                `Region not provided by caller or runtime, falling back to default region (${DEFAULT_AWS_Q_REGION}) and endpoint`
            )
            amazonQRegion = DEFAULT_AWS_Q_REGION
            amazonQEndpoint = DEFAULT_AWS_Q_ENDPOINT_URL
        }
    }

    if (!amazonQEndpoint) {
        logging.log(
            `Unable to determine endpoint (found: ${amazonQEndpoint}) for region: ${amazonQRegion}, falling back to default region (${DEFAULT_AWS_Q_REGION}) and endpoint`
        )
        amazonQRegion = DEFAULT_AWS_Q_REGION
        amazonQEndpoint = DEFAULT_AWS_Q_ENDPOINT_URL
    }

    return {
        region: amazonQRegion,
        endpoint: amazonQEndpoint,
    }
}

interface QInlineSuggestionsConfig {
    extraContext: string | undefined // aws.q.inlineSuggestions.extraContext
}

interface LocalIndexConfig {
    ignoreFilePatterns?: string[] // patterns must follow .gitignore convention
    maxFileSizeMB?: number
    maxIndexSizeMB?: number
    indexCacheDirPath?: string // defaults to homedir/.aws/amazonq/cache
}

interface QProjectContextConfig {
    enableLocalIndexing: boolean // aws.q.projectContext.enableLocalIndexing
    enableGpuAcceleration: boolean // aws.q.projectContext.enableGpuAcceleration
    indexWorkerThreads: number // aws.q.projectContext.indexWorkerThreads
    localIndexing?: LocalIndexConfig
}

interface QConfigSection {
    customizationArn: string | undefined // aws.q.customization - selected customization
    optOutTelemetryPreference: 'OPTOUT' | 'OPTIN' // aws.q.optOutTelemetry - telemetry optout option
    inlineSuggestions: QInlineSuggestionsConfig
    projectContext: QProjectContextConfig
}

interface CodeWhispererConfigSection {
    includeSuggestionsWithCodeReferences: boolean // aws.codeWhisperer.includeSuggestionsWithCodeReferences - return suggestions with code references
    includeImportsWithSuggestions: boolean // aws.codeWhisperer.includeImportsWithSuggestions - return imports with suggestions
    shareCodeWhispererContentWithAWS: boolean // aws.codeWhisperer.shareCodeWhispererContentWithAWS - share content with AWS
    sendUserWrittenCodeMetrics: boolean
}

export type AmazonQWorkspaceConfig = QConfigSection & CodeWhispererConfigSection

/**
 * Attempts to fetch the workspace configurations set in:
 *   - aws.q
 *   - aws.codeWhisperer
 *
 * and consolidates them into one configuration.
 */
export async function getAmazonQRelatedWorkspaceConfigs(
    lsp: Lsp,
    logging: Logging
): Promise<Readonly<Partial<AmazonQWorkspaceConfig>>> {
    let qConfig: Readonly<QConfigSection> | undefined = undefined
    let codeWhispererConfig: Readonly<CodeWhispererConfigSection> | undefined = undefined

    try {
        logging.debug(`Calling getConfiguration(${Q_CONFIGURATION_SECTION})`)
        const newQConfig = await lsp.workspace.getConfiguration(Q_CONFIGURATION_SECTION)

        if (newQConfig) {
            qConfig = {
                customizationArn: textUtils.undefinedIfEmpty(newQConfig.customization),
                optOutTelemetryPreference: newQConfig['optOutTelemetry'] === true ? 'OPTOUT' : 'OPTIN',
                inlineSuggestions: {
                    extraContext: textUtils.undefinedIfEmpty(newQConfig.inlineSuggestions?.extraContext),
                },
                projectContext: {
                    enableLocalIndexing: newQConfig.projectContext?.enableLocalIndexing === true,
                    enableGpuAcceleration: newQConfig.projectContext?.enableGpuAcceleration === true,
                    indexWorkerThreads: newQConfig.projectContext?.indexWorkerThreads ?? -1,
                    localIndexing: {
                        ignoreFilePatterns: newQConfig.projectContext?.localIndexing?.ignoreFilePatterns ?? [],
                        maxFileSizeMB: newQConfig.projectContext?.localIndexing?.maxFileSizeMB ?? 10,
                        maxIndexSizeMB: newQConfig.projectContext?.localIndexing?.maxIndexSizeMB ?? 2048,
                        indexCacheDirPath: newQConfig.projectContext?.localIndexing?.indexCacheDirPath ?? undefined,
                    },
                },
            }

            logging.log(`Read configuration customizationArn=${qConfig.customizationArn}`)
            logging.log(`Read configuration optOutTelemetryPreference=${qConfig.optOutTelemetryPreference}`)
        }
    } catch (error) {
        logging.error(`Error in getConfiguration(${Q_CONFIGURATION_SECTION}): ${error}`)
    }

    try {
        logging.debug(`Calling getConfiguration(${CODE_WHISPERER_CONFIGURATION_SECTION})`)
        const newCodeWhispererConfig = await lsp.workspace.getConfiguration(CODE_WHISPERER_CONFIGURATION_SECTION)
        if (newCodeWhispererConfig) {
            codeWhispererConfig = {
                includeSuggestionsWithCodeReferences:
                    newCodeWhispererConfig['includeSuggestionsWithCodeReferences'] === true,
                includeImportsWithSuggestions: newCodeWhispererConfig['includeImportsWithSuggestions'] === true,
                shareCodeWhispererContentWithAWS: newCodeWhispererConfig['shareCodeWhispererContentWithAWS'] === true,
                sendUserWrittenCodeMetrics: newCodeWhispererConfig['sendUserWrittenCodeMetrics'] === true,
            }

            logging.log(
                `Read сonfiguration includeSuggestionsWithCodeReferences=${codeWhispererConfig.includeSuggestionsWithCodeReferences}`
            )
            logging.log(
                `Read configuration shareCodeWhispererContentWithAWS=${codeWhispererConfig.shareCodeWhispererContentWithAWS}`
            )
        }
    } catch (error) {
        logging.error(`Error in getConfiguration(${CODE_WHISPERER_CONFIGURATION_SECTION}): ${error}`)
    }

    return {
        ...qConfig,
        ...codeWhispererConfig,
    }
}

export const defaultAmazonQWorkspaceConfigFactory = (): AmazonQWorkspaceConfig => {
    return {
        customizationArn: undefined,
        optOutTelemetryPreference: 'OPTIN',
        inlineSuggestions: {
            extraContext: undefined,
        },
        includeSuggestionsWithCodeReferences: false,
        includeImportsWithSuggestions: false,
        shareCodeWhispererContentWithAWS: false,
        sendUserWrittenCodeMetrics: false,
        projectContext: {
            enableLocalIndexing: false,
            enableGpuAcceleration: false,
            indexWorkerThreads: -1,
            localIndexing: {
                ignoreFilePatterns: [],
                maxFileSizeMB: 10,
                maxIndexSizeMB: 2048,
                indexCacheDirPath: undefined,
            },
        },
    }
}

export class AmazonQConfigurationCache {
    private _cachedConfig: AmazonQWorkspaceConfig

    constructor() {
        this._cachedConfig = defaultAmazonQWorkspaceConfigFactory()
    }

    setProperty<K extends keyof AmazonQWorkspaceConfig>(key: K, newProperty: AmazonQWorkspaceConfig[K]) {
        this._cachedConfig[key] = typeof newProperty === 'object' ? { ...newProperty } : newProperty
    }

    getProperty<K extends keyof AmazonQWorkspaceConfig>(key: K): Readonly<AmazonQWorkspaceConfig[K]> {
        const property = this._cachedConfig[key]
        return typeof property === 'object' ? { ...property } : property
    }

    updateConfig(newConfig: Readonly<Partial<AmazonQWorkspaceConfig>>) {
        Object.assign(this._cachedConfig, newConfig)
    }

    getConfig(): Readonly<AmazonQWorkspaceConfig> {
        return { ...this._cachedConfig }
    }
}
