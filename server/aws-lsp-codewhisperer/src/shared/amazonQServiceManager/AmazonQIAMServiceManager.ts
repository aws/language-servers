import { CodeWhispererServiceBase, CodeWhispererServiceIAM } from '../codeWhispererService'
import {
    AmazonQBaseServiceManager,
    BaseAmazonQServiceManager,
    QServiceManagerFeatures,
} from './BaseAmazonQServiceManager'
import { getAmazonQRegionAndEndpoint } from './configurationUtils'
import { StreamingClientServiceIAM } from '../streamingClientService'

export class AmazonQIAMServiceManager extends BaseAmazonQServiceManager<
    CodeWhispererServiceIAM,
    StreamingClientServiceIAM
> {
    private static instance: AmazonQIAMServiceManager | null = null
    private region: string
    private endpoint: string

    private constructor(features: QServiceManagerFeatures) {
        super(features)
        const amazonQRegionAndEndpoint = getAmazonQRegionAndEndpoint(features.runtime, features.logging)
        this.region = amazonQRegionAndEndpoint.region
        this.endpoint = amazonQRegionAndEndpoint.endpoint
    }

    public static getInstance(features: QServiceManagerFeatures): AmazonQIAMServiceManager {
        if (!AmazonQIAMServiceManager.instance) {
            AmazonQIAMServiceManager.instance = new AmazonQIAMServiceManager(features)
        }

        return AmazonQIAMServiceManager.instance
    }

    public getCodewhispererService(): CodeWhispererServiceBase {
        if (!this.cachedCodewhispererService) {
            this.cachedCodewhispererService = new CodeWhispererServiceIAM(
                this.features.credentialsProvider,
                this.features.workspace,
                this.features.logging,
                this.region,
                this.endpoint,
                this.features.sdkInitializator
            )

            this.updateCachedServiceConfig()
        }

        return this.cachedCodewhispererService
    }

    public getStreamingClient() {
        if (!this.cachedStreamingClient) {
            this.cachedStreamingClient = new StreamingClientServiceIAM(
                this.features.credentialsProvider,
                this.features.sdkInitializator,
                this.features.logging,
                this.region,
                this.endpoint
            )
        }
        return this.cachedStreamingClient
    }
}

export const initBaseIAMServiceManager = (features: QServiceManagerFeatures): AmazonQBaseServiceManager => {
    return AmazonQIAMServiceManager.getInstance(features)
}
