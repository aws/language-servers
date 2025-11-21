import {
    CredentialsType,
    UpdateConfigurationParams,
    CancellationToken,
} from '@aws/language-server-runtimes/server-interface'
import { QServiceManagerFeatures } from './BaseAmazonQServiceManager'
import { ATX_CONFIGURATION_SECTION } from '../../language-server/configuration/transformConfigurationServer'

export class AtxTokenServiceManager {
    private static instance: AtxTokenServiceManager | null = null
    private features: QServiceManagerFeatures
    private cacheCallbacks: (() => void)[] = []

    private constructor(features: QServiceManagerFeatures) {
        this.features = features
    }

    public static initInstance(features: QServiceManagerFeatures): AtxTokenServiceManager {
        if (!AtxTokenServiceManager.instance) {
            AtxTokenServiceManager.instance = new AtxTokenServiceManager(features)
            return AtxTokenServiceManager.instance
        }
        throw new Error('ATX Token Service Manager already initialized')
    }

    public static getInstance(): AtxTokenServiceManager {
        if (!AtxTokenServiceManager.instance) {
            throw new Error('ATX Token Service Manager not initialized')
        }
        return AtxTokenServiceManager.instance
    }

    public handleOnCredentialsDeleted(type: CredentialsType): void {
        this.clearAllCaches()
    }

    public async handleOnUpdateConfiguration(
        params: UpdateConfigurationParams,
        token: CancellationToken
    ): Promise<void> {
        if (params.section === ATX_CONFIGURATION_SECTION && params.settings.profileArn !== undefined) {
            const profileArn = params.settings.profileArn

            // Get the main service manager and call ATX profile update
            const { AmazonQTokenServiceManager } = await import('./AmazonQTokenServiceManager')
            const mainServiceManager = AmazonQTokenServiceManager.getInstance()
            await mainServiceManager.handleAtxProfileChange(profileArn, token)
        }

        if (params.section === ATX_CONFIGURATION_SECTION) {
            this.clearAllCaches()
        }
    }

    public registerCacheCallback(callback: () => void): void {
        this.cacheCallbacks.push(callback)
    }

    private clearAllCaches(): void {
        this.cacheCallbacks.forEach(callback => callback())
    }

    public hasValidCredentials(): boolean {
        this.log('Checking ATX credentials availability')
        const runtime = (this.features as any).runtime
        this.log(`Runtime available: ${!!runtime}`)
        if (runtime && runtime.getAtxCredentialsProvider) {
            this.log('Runtime has getAtxCredentialsProvider method')
            const atxCredentialsProvider = runtime.getAtxCredentialsProvider()
            this.log(`ATX credentials provider: ${!!atxCredentialsProvider}`)
            const hasCredentials = atxCredentialsProvider?.hasCredentials('bearer') || false
            this.log(`ATX has bearer credentials: ${hasCredentials}`)
            return hasCredentials
        }
        this.log('Runtime does not have getAtxCredentialsProvider method')
        return false
    }

    public async getBearerToken(): Promise<string> {
        if (!this.hasValidCredentials()) {
            throw new Error('No bearer credentials available for ATX')
        }
        this.log('Getting ATX bearer token')
        const runtime = (this.features as any).runtime
        this.log(`Runtime available: ${!!runtime}`)
        const atxCredentialsProvider = runtime.getAtxCredentialsProvider()
        this.log(`ATX credentials provider: ${!!atxCredentialsProvider}`)
        const credentials = atxCredentialsProvider?.getCredentials('bearer')
        this.log(`ATX credentials: ${!!credentials}`)

        if (!credentials || !('token' in credentials) || !credentials.token) {
            throw new Error('Bearer token is null or empty')
        }

        return credentials.token
    }

    public isReady(): boolean {
        return this.hasValidCredentials()
    }

    private log(message: string): void {
        this.features.logging?.log(`ATX Token Service Manager: ${message}`)
    }

    public static resetInstance(): void {
        AtxTokenServiceManager.instance = null
    }
}
