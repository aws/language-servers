import { AmazonQTokenServiceManager, Features } from './AmazonQTokenServiceManager'
import { BaseAmazonQServiceManager } from './BaseAmazonQServiceManager'
import { AWSQConfigurationCache, getAWSQRegionAndEndpoint, getAWSQRelatedWorkspaceConfigs } from './configurationUtils'
import { CodeWhispererServiceBase, CodeWhispererServiceIAM } from '../codeWhispererService'
import { CredentialsType } from '@aws/language-server-runtimes/server-interface'

const initTokenServiceManager = (features: Features) => {
    return AmazonQTokenServiceManager.getInstance(features)
}

export const initFallbackServiceManager = (features: Features, serviceOverride?: CodeWhispererServiceBase) => {
    const { region, endpoint } = getAWSQRegionAndEndpoint(features.runtime, features.logging)
    const codeWhisperService =
        serviceOverride ??
        new CodeWhispererServiceIAM(
            features.credentialsProvider,
            features.workspace,
            region,
            endpoint,
            features.sdkInitializator
        )

    const configurationCache = new AWSQConfigurationCache()

    return {
        handleDidChangeConfiguration: async () => {
            try {
                const { qConfig, codeWhispererConfig } = await getAWSQRelatedWorkspaceConfigs(
                    features.lsp,
                    features.logging,
                    configurationCache
                )

                if (qConfig) {
                    codeWhisperService.customizationArn = qConfig.customizationArn
                }

                if (codeWhispererConfig) {
                    codeWhisperService.shareCodeWhispererContentWithAWS =
                        codeWhispererConfig.shareCodeWhispererContentWithAWS
                }
            } catch (error) {
                features.logging.debug(`Unexpected error in getAWSQRelatedWorkspaceConfigs: ${error}`)
            }
        },
        getCodewhispererService: () => {
            return codeWhisperService
        },
        getConfiguration: () => {
            return configurationCache.getAggregateConfig()
        },
    }
}

export const initBaseServiceManager = (credentialsType: CredentialsType) => {
    return (features: Features): BaseAmazonQServiceManager => {
        if (credentialsType === 'bearer') {
            features.logging.debug('Initializing token service manager')
            return initTokenServiceManager(features)
        } else {
            features.logging.debug(`Falling back to IAM service manager (found credentialsType: ${credentialsType}`)
            return initFallbackServiceManager(features)
        }
    }
}
