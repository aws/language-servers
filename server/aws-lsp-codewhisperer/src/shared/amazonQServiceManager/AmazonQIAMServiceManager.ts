// import { CodeWhispererServiceIAM } from '../codeWhispererService'
// import {
//     AmazonQBaseServiceManager,
//     BaseAmazonQServiceManager,
//     QServiceManagerFeatures,
// } from './BaseAmazonQServiceManager'
// import { getAmazonQRegionAndEndpoint } from './configurationUtils'
// import { StreamingClientServiceIAM } from '../streamingClientService'
// import { AmazonQServiceAlreadyInitializedError, AmazonQServiceInitializationError } from './errors'
// import {
//     CancellationToken,
//     CredentialsType,
//     UpdateConfigurationParams,
// } from '@aws/language-server-runtimes/server-interface'

// export class AmazonQIAMServiceManager extends BaseAmazonQServiceManager<
//     CodeWhispererServiceIAM,
//     StreamingClientServiceIAM
// > {
//     private static instance: AmazonQIAMServiceManager | null = null
//     private region: string
//     private endpoint: string

//     // moved
//     private constructor(features: QServiceManagerFeatures) {
//         super(features)
//         const amazonQRegionAndEndpoint = getAmazonQRegionAndEndpoint(features.runtime, features.logging)
//         this.region = amazonQRegionAndEndpoint.region
//         this.endpoint = amazonQRegionAndEndpoint.endpoint
//     }

//     // moved
//     public static initInstance(features: QServiceManagerFeatures): AmazonQIAMServiceManager {
//         if (!AmazonQIAMServiceManager.instance) {
//             AmazonQIAMServiceManager.instance = new AmazonQIAMServiceManager(features)

//             return AmazonQIAMServiceManager.instance
//         }

//         throw new AmazonQServiceAlreadyInitializedError()
//     }

//     // moved
//     public static getInstance(): AmazonQIAMServiceManager {
//         if (!AmazonQIAMServiceManager.instance) {
//             throw new AmazonQServiceInitializationError(
//                 'Amazon Q service has not been initialized yet. Make sure the Amazon Q service server is present and properly initialized.'
//             )
//         }

//         return AmazonQIAMServiceManager.instance
//     }

//     // moved
//     public getCodewhispererService() {
//         if (!this.cachedCodewhispererService) {
//             this.cachedCodewhispererService = new CodeWhispererServiceIAM(
//                 this.features.credentialsProvider,
//                 this.features.workspace,
//                 this.features.logging,
//                 this.region,
//                 this.endpoint,
//                 this.features.sdkInitializator
//             )

//             this.updateCachedServiceConfig()
//         }

//         return this.cachedCodewhispererService
//     }

//     // moved
//     public getStreamingClient() {
//         if (!this.cachedStreamingClient) {
//             this.cachedStreamingClient = new StreamingClientServiceIAM(
//                 this.features.credentialsProvider,
//                 this.features.sdkInitializator,
//                 this.features.logging,
//                 this.region,
//                 this.endpoint
//             )
//         }
//         return this.cachedStreamingClient
//     }

//     // moved
//     public handleOnCredentialsDeleted(_type: CredentialsType): void {
//         return
//     }

//     // moved
//     public override handleOnUpdateConfiguration(
//         _params: UpdateConfigurationParams,
//         _token: CancellationToken
//     ): Promise<void> {
//         return Promise.resolve()
//     }

//     // For Unit Tests
//     public static resetInstance(): void {
//         AmazonQIAMServiceManager.instance = null
//     }
// }

// export const initBaseIAMServiceManager = (features: QServiceManagerFeatures) =>
//     AmazonQIAMServiceManager.initInstance(features)

// export const getOrThrowBaseIAMServiceManager = (): AmazonQBaseServiceManager => AmazonQIAMServiceManager.getInstance()
