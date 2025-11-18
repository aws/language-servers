import {
    CredentialsType,
    UpdateConfigurationParams,
    CancellationToken,
} from '@aws/language-server-runtimes/server-interface'
import { QServiceManagerFeatures } from './BaseAmazonQServiceManager'
import { TRANSFORM_PROFILES_CONFIGURATION_SECTION } from '../../language-server/configuration/transformConfigurationServer'
import { AmazonQDeveloperProfile } from './qDeveloperProfiles'

export class AtxTokenServiceManager {
    private static instance: AtxTokenServiceManager | null = null
    private features: QServiceManagerFeatures
    private cacheCallbacks: (() => void)[] = []
    private activeProfileArn: string | null = null
    private activeApplicationUrl: string | null = null
    private cachedTransformProfiles: AmazonQDeveloperProfile[] = []

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
        this.log(`handleOnUpdateConfiguration called with section: ${params.section}`)
        this.log(`handleOnUpdateConfiguration settings: ${JSON.stringify(params.settings, null, 2)}`)

        if (params.section === TRANSFORM_PROFILES_CONFIGURATION_SECTION) {
            const profileArn = params.settings?.profileArn as string

            this.log(`Extracted profileArn: ${profileArn}`)

            if (profileArn) {
                // Use ARN-based lookup to find applicationUrl
                this.setActiveProfileByArn(profileArn)
            } else {
                this.clearActiveProfile()
            }
        }
    }

    public registerCacheCallback(callback: () => void): void {
        this.cacheCallbacks.push(callback)
    }

    private clearAllCaches(): void {
        this.cacheCallbacks.forEach(callback => callback())
        this.cachedTransformProfiles = []
    }

    public hasValidCredentials(): boolean {
        return this.features.credentialsProvider.hasCredentials('bearer')
    }

    public async getBearerToken(): Promise<string> {
        this.log('getBearerToken called')
        if (!this.hasValidCredentials()) {
            throw new Error('No bearer credentials available for ATX')
        }

        const credentials = await this.features.credentialsProvider.getCredentials('bearer')
        if (!credentials || !('token' in credentials) || !credentials.token) {
            throw new Error('Bearer token is null or empty')
        }

        this.log('Bearer token retrieved successfully')
        return credentials.token
    }

    public isReady(): boolean {
        return this.hasValidCredentials()
    }

    private log(message: string): void {
        this.features.logging?.log(`ATX Token Service Manager: ${message}`)
    }

    /**
     * Cache Transform profiles for ARN-based lookup
     */
    public cacheTransformProfiles(profiles: AmazonQDeveloperProfile[]): void {
        this.cachedTransformProfiles = profiles
        this.log(`Cached ${profiles.length} Transform profiles for ARN lookup`)
    }

    /**
     * Set active profile by ARN (looks up applicationUrl from cached profiles)
     */
    public setActiveProfileByArn(profileArn: string): void {
        const profile = this.cachedTransformProfiles.find(p => p.arn === profileArn)
        if (profile && (profile as any).applicationUrl) {
            this.activeProfileArn = profileArn
            this.activeApplicationUrl = (profile as any).applicationUrl
            this.log(`Active profile set via ARN lookup: ${profileArn}, applicationUrl: ${this.activeApplicationUrl}`)
        } else {
            this.log(`Profile not found in cache for ARN: ${profileArn}`)
            this.clearActiveProfile()
        }
    }

    /**
     * Set the active Transform profile (legacy method - kept for compatibility)
     */
    public setActiveProfile(profileArn: string, applicationUrl: string): void {
        this.activeProfileArn = profileArn
        this.activeApplicationUrl = applicationUrl
        this.log(`Active profile set: ${profileArn}, applicationUrl: ${applicationUrl}`)
    }

    /**
     * Get the active Transform profile applicationUrl (for Origin header)
     */
    public getActiveApplicationUrl(): string | null {
        return this.activeApplicationUrl
    }

    /**
     * Clear the active profile cache
     */
    public clearActiveProfile(): void {
        this.activeProfileArn = null
        this.activeApplicationUrl = null
        this.log('Active profile cache cleared')
    }

    public static resetInstance(): void {
        AtxTokenServiceManager.instance = null
    }
}
