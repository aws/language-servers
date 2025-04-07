import { AmazonQTokenServiceManager, Features } from './AmazonQTokenServiceManager'
import { BaseAmazonQServiceManager } from './BaseAmazonQServiceManager'
import {
    AmazonQConfigurationCache,
    AmazonQWorkspaceConfig,
    getAmazonQRegionAndEndpoint,
    getAmazonQRelatedWorkspaceConfigs,
} from './configurationUtils'
import { CodeWhispererServiceBase, CodeWhispererServiceIAM } from '../codeWhispererService'

const initTokenServiceManager = (features: Features) => {
    return AmazonQTokenServiceManager.getInstance(features)
}

export const initFallbackServiceManager = (features: Features, serviceOverride?: CodeWhispererServiceBase) => {
    const { region, endpoint } = getAmazonQRegionAndEndpoint(features.runtime, features.logging)
    const codeWhisperService =
        serviceOverride ??
        new CodeWhispererServiceIAM(
            features.credentialsProvider,
            features.workspace,
            features.logging,
            region,
            endpoint,
            features.sdkInitializator
        )

    const configurationCache = new AmazonQConfigurationCache()

    return {
        handleDidChangeConfiguration: async (): Promise<Readonly<AmazonQWorkspaceConfig>> => {
            try {
                const amazonQConfig = await getAmazonQRelatedWorkspaceConfigs(features.lsp, features.logging)

                codeWhisperService.customizationArn = amazonQConfig.customizationArn

                if (amazonQConfig.shareCodeWhispererContentWithAWS !== undefined) {
                    codeWhisperService.shareCodeWhispererContentWithAWS = amazonQConfig.shareCodeWhispererContentWithAWS
                }

                configurationCache.updateConfig(amazonQConfig)
            } catch (error) {
                features.logging.debug(`Unexpected error in getAWSQRelatedWorkspaceConfigs: ${error}`)
            }

            return configurationCache.getConfig()
        },
        getCodewhispererService: () => {
            return codeWhisperService
        },
        getConfiguration: () => {
            return configurationCache.getConfig()
        },
    }
}

export const initBaseTokenServiceManager = (features: Features): BaseAmazonQServiceManager => {
    return initTokenServiceManager(features)
}
export const initBaseIAMServiceManager = (features: Features) => {
    return initFallbackServiceManager(features)
}
