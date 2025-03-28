import { Logging, Lsp, Runtime } from '@aws/language-server-runtimes/server-interface'
import { Q_CONFIGURATION_SECTION } from '../configuration/qConfigurationServer'
import { textUtils } from '@aws/lsp-core'
import {
    AWS_Q_ENDPOINT_URL_ENV_VAR,
    AWS_Q_ENDPOINTS,
    AWS_Q_REGION_ENV_VAR,
    DEFAULT_AWS_Q_ENDPOINT_URL,
    DEFAULT_AWS_Q_REGION,
} from '../../constants'

interface QConfig {
    customizationArn: string | undefined // aws.q.customizationArn - selected customization
    optOutTelemetryPreference: 'OPTOUT' | 'OPTIN' // aws.q.optOutTelemetry - telemetry optout option
    inlineSuggestions: {
        extraContext: string | undefined // aws.q.inlineSuggestions.extraContext
    }
}

interface CodeWhispererConfig {
    includeSuggestionsWithCodeReferences: boolean // aws.codeWhisperer.includeSuggestionsWithCodeReferences - return suggestions with code references
    shareCodeWhispererContentWithAWS: boolean // aws.codeWhisperershareCodeWhispererContentWithAWS - share content with AWS
}

export interface AWSQWorkspaceConfigs {
    qConfig: QConfig
    codeWhispererConfig: CodeWhispererConfig
}

const CODE_WHISPERER_CONFIGURATION_SECTION = 'aws.codeWhisperer'

export async function getAWSQRelatedWorkspaceConfigs(
    lsp: Lsp,
    logging: Logging,
    cache: AWSQConfigurationCache
): Promise<Readonly<Partial<AWSQWorkspaceConfigs>>> {
    let qConfig: Readonly<QConfig> | undefined = undefined
    let codeWhispererConfig: Readonly<CodeWhispererConfig> | undefined = undefined

    try {
        logging.debug(`Calling getConfiguration(${Q_CONFIGURATION_SECTION})`)
        const newQConfig = await lsp.workspace.getConfiguration(Q_CONFIGURATION_SECTION)

        if (newQConfig) {
            cache.setQConfig({
                customizationArn: textUtils.undefinedIfEmpty(newQConfig.customization),
                optOutTelemetryPreference: newQConfig['optOutTelemetry'] === true ? 'OPTOUT' : 'OPTIN',
                inlineSuggestions: {
                    extraContext: textUtils.undefinedIfEmpty(newQConfig.inlineSuggestions?.extraContext),
                },
            })

            qConfig = cache.getConfig('qConfig')

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
            cache.setCodeWhispererConfig({
                includeSuggestionsWithCodeReferences:
                    newCodeWhispererConfig['includeSuggestionsWithCodeReferences'] === true,
                shareCodeWhispererContentWithAWS: newCodeWhispererConfig['shareCodeWhispererContentWithAWS'] === true,
            })

            codeWhispererConfig = cache.getConfig('codeWhispererConfig')

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
        qConfig,
        codeWhispererConfig,
    }
}

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
        // @ts-ignore
        awsQEndpoint = AWS_Q_ENDPOINTS[awsQRegion]
    } else {
        const runtimeRegion = runtime.getConfiguration(AWS_Q_REGION_ENV_VAR)

        if (runtimeRegion) {
            logging.log(`Selecting region (found: ${runtimeRegion}) provided by runtime`)
            awsQRegion = runtimeRegion
            // @ts-ignore
            awsQEndpoint = runtime.getConfiguration(AWS_Q_ENDPOINT_URL_ENV_VAR) ?? AWS_Q_ENDPOINTS[awsQRegion]
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

const defaultAWSQWorkspaceConfigFactory = (): AWSQWorkspaceConfigs => {
    return {
        qConfig: {
            customizationArn: undefined,
            optOutTelemetryPreference: 'OPTIN',
            inlineSuggestions: {
                extraContext: undefined,
            },
        },
        codeWhispererConfig: {
            includeSuggestionsWithCodeReferences: false,
            shareCodeWhispererContentWithAWS: false,
        },
    }
}

export class AWSQConfigurationCache {
    private _cachedConfig: AWSQWorkspaceConfigs

    constructor() {
        this._cachedConfig = defaultAWSQWorkspaceConfigFactory()
    }

    setQConfig(newConfig: Readonly<QConfig>) {
        this._cachedConfig.qConfig = { ...newConfig }
    }

    setCodeWhispererConfig(newConfig: Readonly<CodeWhispererConfig>) {
        this._cachedConfig.codeWhispererConfig = { ...newConfig }
    }

    getConfig<K extends keyof AWSQWorkspaceConfigs>(config: K): Readonly<AWSQWorkspaceConfigs[K]> {
        return { ...this._cachedConfig[config] }
    }

    getConfigProperty<K extends keyof AWSQWorkspaceConfigs, P extends keyof AWSQWorkspaceConfigs[K]>(
        config: K,
        property: P
    ): Readonly<AWSQWorkspaceConfigs[K][P]> {
        return this._cachedConfig[config][property]
    }

    getAggregateConfig(): Readonly<AWSQWorkspaceConfigs> {
        return { ...this._cachedConfig }
    }

    reset() {
        this._cachedConfig = defaultAWSQWorkspaceConfigFactory()
    }
}
