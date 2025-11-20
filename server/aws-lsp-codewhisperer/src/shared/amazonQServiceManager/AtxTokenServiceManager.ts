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
    private cachedApplicationUrl: string | null = null
    private activeProfileArn: string | null = null
    private cachedTransformProfiles: any[] = []
    private activeApplicationUrl: string | null = null

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
        // Handle aws.transformProfiles, aws.atx, and aws.transform sections
        if (
            (params.section === 'aws.transformProfiles' ||
                params.section === 'aws.atx' ||
                params.section === 'aws.transform') &&
            params.settings.profileArn !== undefined
        ) {
            const profileArn = params.settings.profileArn as string

            this.activeProfileArn = profileArn
            this.setActiveProfileByArn(profileArn)

            // Get the main service manager and call ATX profile update
            const { AmazonQTokenServiceManager } = await import('./AmazonQTokenServiceManager')
            const mainServiceManager = AmazonQTokenServiceManager.getInstance()
            await mainServiceManager.handleAtxProfileChange(profileArn, token)
        }
    }

    /**
     * Cache Transform profiles for ARN-based lookup
     */
    public cacheTransformProfiles(profiles: any[]): void {
        this.cachedTransformProfiles = profiles
    }

    /**
     * Set active profile by ARN (looks up applicationUrl from cached profiles)
     */
    public setActiveProfileByArn(profileArn: string): void {
        const profile = this.cachedTransformProfiles.find((p: any) => p.arn === profileArn)
        if (profile && profile.applicationUrl) {
            this.activeProfileArn = profileArn
            this.activeApplicationUrl = profile.applicationUrl
        } else {
            this.clearActiveProfile()
        }
    }

    /**
     * Clear the active profile cache
     */
    public clearActiveProfile(): void {
        this.activeProfileArn = null
        this.activeApplicationUrl = null
    }

    public getActiveApplicationUrl(): string | null {
        return this.activeApplicationUrl
    }

    public getActiveProfileArn(): string | null {
        return this.activeProfileArn
    }

    public registerCacheCallback(callback: () => void): void {
        this.cacheCallbacks.push(callback)
    }

    private clearAllCaches(): void {
        this.cachedApplicationUrl = null
        this.activeProfileArn = null
        this.activeApplicationUrl = null
        // Don't clear cachedTransformProfiles - they should persist
        this.cacheCallbacks.forEach(callback => callback())
    }

    public hasValidCredentials(): boolean {
        return this.features.credentialsProvider.hasCredentials('bearer' as any)
    }

    public async getBearerToken(): Promise<string> {
        if (!this.hasValidCredentials()) {
            throw new Error('No bearer credentials available for ATX')
        }

        const credentials = this.features.credentialsProvider.getCredentials('bearer' as any)
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
