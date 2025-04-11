import { CodeWhispererServiceBase, CodeWhispererServiceIAM } from '../codeWhispererService'
import {
    AmazonQBaseServiceManager,
    BaseAmazonQServiceManager,
    QServiceManagerFeatures,
} from './BaseAmazonQServiceManager'
import { getAmazonQRegionAndEndpoint } from './configurationUtils'
import { AmazonQServiceNotInitializedError } from './errors'
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

    public getStreamingClient() {
        const iamService = this.getCodewhispererService()

        if (!iamService || !this.region || !this.endpoint) {
            throw new AmazonQServiceNotInitializedError()
        }

        if (!this.cachedStreamingClient) {
            this.cachedStreamingClient = this.streamingClientFactory(this.region, this.endpoint)
        }

        return this.cachedStreamingClient
    }

    private streamingClientFactory(region: string, endpoint: string): StreamingClientServiceIAM {
        const streamingClient = new StreamingClientServiceIAM(
            this.features.credentialsProvider,
            this.features.sdkInitializator,
            region,
            endpoint
        )
        return streamingClient
    }
}

export const initBaseIAMServiceManager = (features: QServiceManagerFeatures): AmazonQBaseServiceManager => {
    return AmazonQIAMServiceManager.getInstance(features)
}
