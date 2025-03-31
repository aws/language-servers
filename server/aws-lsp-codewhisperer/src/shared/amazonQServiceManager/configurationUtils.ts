import { Logging, Lsp, Runtime } from '@aws/language-server-runtimes/server-interface'
import { Q_CONFIGURATION_SECTION } from '../../language-server/configuration/qConfigurationServer'
import { textUtils } from '@aws/lsp-core'
import {
    AWS_Q_ENDPOINT_URL_ENV_VAR,
    AWS_Q_ENDPOINTS,
    AWS_Q_REGION_ENV_VAR,
    DEFAULT_AWS_Q_ENDPOINT_URL,
    DEFAULT_AWS_Q_REGION,
} from '../constants'

export interface AWSQRegionAndEndpoint {
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
export function getAWSQRegionAndEndpoint(runtime: Runtime, logging: Logging, region?: string): AWSQRegionAndEndpoint {
    let awsQRegion: string
    let awsQEndpoint: string | undefined

    if (region) {
        logging.log(`Selecting region (found: ${region}) provided by caller`)
        awsQRegion = region
        awsQEndpoint = AWS_Q_ENDPOINTS.get(awsQRegion)
    } else {
        const runtimeRegion = runtime.getConfiguration(AWS_Q_REGION_ENV_VAR)

        if (runtimeRegion) {
            logging.log(`Selecting region (found: ${runtimeRegion}) provided by runtime`)
            awsQRegion = runtimeRegion
            awsQEndpoint = runtime.getConfiguration(AWS_Q_ENDPOINT_URL_ENV_VAR) ?? AWS_Q_ENDPOINTS.get(awsQRegion)
        } else {
            logging.log('Region not provided by caller or runtime, falling back to default region and endpoint')
            awsQRegion = DEFAULT_AWS_Q_REGION
            awsQEndpoint = DEFAULT_AWS_Q_ENDPOINT_URL
        }
    }

    if (!awsQEndpoint) {
        logging.log(
            `Unable to determine endpoint (found: ${awsQEndpoint}) for region: ${awsQRegion}, falling back to default region and endpoint`
        )
        awsQRegion = DEFAULT_AWS_Q_REGION
        awsQEndpoint = DEFAULT_AWS_Q_ENDPOINT_URL
    }

    return {
        region: awsQRegion,
        endpoint: awsQEndpoint,
    }
}

interface QInlineSuggestions {
    extraContext: string | undefined // aws.q.inlineSuggestions.extraContext
}

interface QConfigSection {
    customizationArn: string | undefined // aws.q.customizationArn - selected customization
    optOutTelemetryPreference: 'OPTOUT' | 'OPTIN' // aws.q.optOutTelemetry - telemetry optout option
    inlineSuggestions: QInlineSuggestions
}

interface CodeWhispererConfigSection {
    includeSuggestionsWithCodeReferences: boolean // aws.codeWhisperer.includeSuggestionsWithCodeReferences - return suggestions with code references
    shareCodeWhispererContentWithAWS: boolean // aws.codeWhisperer.shareCodeWhispererContentWithAWS - share content with AWS
}

export type AmazonQWorkspaceConfig = QConfigSection & CodeWhispererConfigSection

export const CODE_WHISPERER_CONFIGURATION_SECTION = 'aws.codeWhisperer'

/**
 * Attempts to fetch the workspace configurations set in:
 *   - aws.q
 *   - aws.codeWhisperer
 *
 * and consolidates them into one configuration.
 */
export async function getAWSQRelatedWorkspaceConfigs(
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
                shareCodeWhispererContentWithAWS: newCodeWhispererConfig['shareCodeWhispererContentWithAWS'] === true,
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

export const defaultAWSQWorkspaceConfigFactory = (): AmazonQWorkspaceConfig => {
    return {
        customizationArn: undefined,
        optOutTelemetryPreference: 'OPTIN',
        inlineSuggestions: {
            extraContext: undefined,
        },
        includeSuggestionsWithCodeReferences: false,
        shareCodeWhispererContentWithAWS: false,
    }
}

export class AmazonQConfigurationCache {
    private _cachedConfig: AmazonQWorkspaceConfig

    constructor() {
        this._cachedConfig = defaultAWSQWorkspaceConfigFactory()
    }

    setProperty<K extends keyof AmazonQWorkspaceConfig>(key: K, newProperty: AmazonQWorkspaceConfig[K]) {
        this._cachedConfig[key] = typeof newProperty === 'object' ? { ...newProperty } : newProperty
    }

    getProperty<K extends keyof AmazonQWorkspaceConfig>(key: K): Readonly<AmazonQWorkspaceConfig[K]> {
        const property = this._cachedConfig[key]
        return typeof property === 'object' ? { ...property } : property
    }

    updateConfig(newConfig: Readonly<Partial<AmazonQWorkspaceConfig>>) {
        Object.entries(newConfig).forEach(([key, value]) => {
            this.setProperty(key as keyof AmazonQWorkspaceConfig, value)
        })
    }

    getConfig(): Readonly<AmazonQWorkspaceConfig> {
        return { ...this._cachedConfig }
    }
}
