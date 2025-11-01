import {
    CredentialsType,
    UpdateConfigurationParams,
    CancellationToken,
} from '@aws/language-server-runtimes/server-interface'
import { QServiceManagerFeatures } from './BaseAmazonQServiceManager'
import { TRANSFORM_PROFILES_CONFIGURATION_SECTION } from '../../language-server/configuration/transformConfigurationServer'

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

    public handleOnUpdateConfiguration(params: UpdateConfigurationParams, _token: CancellationToken): void {
        if (params.section === TRANSFORM_PROFILES_CONFIGURATION_SECTION) {
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
        return this.features.credentialsProvider.hasCredentials('bearer')
    }

    public async getBearerToken(): Promise<string> {
        if (!this.hasValidCredentials()) {
            throw new Error('No bearer credentials available for ATX')
        }

        const credentials = await this.features.credentialsProvider.getCredentials('bearer')
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
