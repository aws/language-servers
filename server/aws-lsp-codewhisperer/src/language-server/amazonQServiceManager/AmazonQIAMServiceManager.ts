import {
    Logging,
    Lsp,
    CredentialsProvider,
    SDKInitializator,
    Runtime,
    Workspace,
} from '@aws/language-server-runtimes/server-interface'
import { DEFAULT_AWS_Q_ENDPOINT_URL, DEFAULT_AWS_Q_REGION } from '../../constants'
import { CodeWhispererServiceIAM } from '../codeWhispererService'
import { AmazonQServiceNotInitializedError, AmazonQServicePendingSigninError } from './errors'
import { BaseAmazonQServiceManager } from './BaseAmazonQServiceManager'

interface Features {
    lsp: Lsp
    logging: Logging
    runtime: Runtime
    credentialsProvider: CredentialsProvider
    sdkInitializator: SDKInitializator
    workspace: Workspace
}

export class AmazonQIAMServiceManager implements BaseAmazonQServiceManager {
    private static instance: AmazonQIAMServiceManager | null = null
    private features?: Features
    private logging?: Logging
    private codewhispererService?: CodeWhispererServiceIAM
    private serviceStatus: 'PENDING_CONNECTION' | 'INITIALIZED' = 'PENDING_CONNECTION'

    private constructor() {}

    public static getInstance(features: Features): AmazonQIAMServiceManager {
        if (!AmazonQIAMServiceManager.instance) {
            AmazonQIAMServiceManager.instance = new AmazonQIAMServiceManager()
            AmazonQIAMServiceManager.instance.initialize(features)
        }
        return AmazonQIAMServiceManager.instance
    }

    private initialize(features: Features): void {
        this.features = features
        this.logging = features.logging

        this.setupCodewhispererService()

        this.logging?.log('Amazon Q: Initialized IAM credentials Service manager')
    }

    private setupCodewhispererService() {
        if (!this.features) {
            throw new Error('Features not initialized')
        }

        // Starting with default region.
        const awsQRegion = this.features.runtime.getConfiguration('AWS_Q_REGION') ?? DEFAULT_AWS_Q_REGION
        const awsQEndpointUrl =
            this.features.runtime.getConfiguration('AWS_Q_ENDPOINT_URL') ?? DEFAULT_AWS_Q_ENDPOINT_URL

        this.codewhispererService = new CodeWhispererServiceIAM(
            this.features.credentialsProvider,
            this.features.workspace,
            awsQRegion,
            awsQEndpointUrl,
            this.features.sdkInitializator
        )
        this.serviceStatus = 'INITIALIZED'

        return
    }

    public getCodewhispererService(): CodeWhispererServiceIAM {
        if (this.serviceStatus === 'PENDING_CONNECTION') {
            throw new AmazonQServicePendingSigninError()
        }

        if (!this.codewhispererService) {
            throw new AmazonQServiceNotInitializedError()
        }

        return this.codewhispererService
    }
}
