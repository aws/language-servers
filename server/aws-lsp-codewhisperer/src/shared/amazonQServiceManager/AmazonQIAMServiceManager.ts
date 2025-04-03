import { CodeWhispererServiceBase, CodeWhispererServiceIAM } from '../codeWhispererService'
import { AmazonQBaseServiceManager, BaseAmazonQServiceManager, Features } from './BaseAmazonQServiceManager'
import { getAmazonQRegionAndEndpoint } from './configurationUtils'

export class AmazonQIAMServiceManager extends BaseAmazonQServiceManager<CodeWhispererServiceIAM> {
    private static instance: AmazonQIAMServiceManager | null = null

    private constructor(features: Features) {
        super(features)
    }

    public static getInstance(features: Features): AmazonQIAMServiceManager {
        if (!AmazonQIAMServiceManager.instance) {
            AmazonQIAMServiceManager.instance = new AmazonQIAMServiceManager(features)
        }

        return AmazonQIAMServiceManager.instance
    }

    public getCodewhispererService(): CodeWhispererServiceBase {
        if (!this.cachedCodewhispererService) {
            const { region, endpoint } = getAmazonQRegionAndEndpoint(this.features.runtime, this.features.logging)
            this.cachedCodewhispererService = new CodeWhispererServiceIAM(
                this.features.credentialsProvider,
                this.features.workspace,
                region,
                endpoint,
                this.features.sdkInitializator
            )

            this.updateCachedServiceConfig()
        }

        return this.cachedCodewhispererService
    }
}

export const initBaseIAMServiceManager = (features: Features): AmazonQBaseServiceManager => {
    return AmazonQIAMServiceManager.getInstance(features)
}
