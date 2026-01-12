import {
    CredentialsType,
    UpdateConfigurationParams,
    CancellationToken,
} from '@aws/language-server-runtimes/server-interface'
import { QServiceManagerFeatures } from './BaseAmazonQServiceManager'
import { ATX_CONFIGURATION_SECTION } from '../../language-server/configuration/transformConfigurationServer'
import { TransformConfigurationServer } from '../../language-server/configuration/transformConfigurationServer'
import { CodeWhispererServiceToken } from '../codeWhispererService'
import { StreamingClientServiceToken } from '../streamingClientService'
import { getAtxEndPointByRegion } from '../constants'
import { AmazonQDeveloperProfile } from './qDeveloperProfiles'
import { parse } from '@aws-sdk/util-arn-parser'
import { getUserAgent, makeUserContextObject } from '../telemetryUtils'
import { AmazonQServicePendingSigninError } from './errors'

export class AtxTokenServiceManager {
    private static instance: AtxTokenServiceManager | null = null
    private features: QServiceManagerFeatures
    private cacheCallbacks: (() => void)[] = []
    private activeProfileArn: string | null = null
    private cachedTransformProfiles: any[] = []
    private activeApplicationUrl: string | null = null

    // ATX service instances
    private cachedAtxCodewhispererService?: CodeWhispererServiceToken
    private cachedAtxStreamingClient?: StreamingClientServiceToken
    private activeAtxProfile?: AmazonQDeveloperProfile

    private constructor(features: QServiceManagerFeatures) {
        this.features = features
    }

    public static initInstance(features: QServiceManagerFeatures): AtxTokenServiceManager {
        if (!AtxTokenServiceManager.instance) {
            AtxTokenServiceManager.instance = new AtxTokenServiceManager(features)
            return AtxTokenServiceManager.instance
        }
        // throw new Error('ATX Token Service Manager already initialized')
        return AtxTokenServiceManager.instance
    }

    public static getInstance(): AtxTokenServiceManager {
        if (!AtxTokenServiceManager.instance) {
            throw new Error('ATX Token Service Manager not initialized')
        }
        return AtxTokenServiceManager.instance
    }

    public handleOnCredentialsDeleted(type: CredentialsType): void {
        if (type === ('bearer' as CredentialsType)) {
            const atxCredentialsProvider = this.features.runtime.getAtxCredentialsProvider?.()
            const hasAtxCredentials = atxCredentialsProvider?.hasCredentials('bearer')
            if (!hasAtxCredentials) {
                this.log(`ATX: Clearing credentials and services`)
                this.cachedAtxCodewhispererService?.abortInflightRequests()
                this.cachedAtxCodewhispererService = undefined
                this.cachedAtxStreamingClient?.abortInflightRequests()
                this.cachedAtxStreamingClient = undefined
                this.activeAtxProfile = undefined
            }
        }
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

            await this.ensureProfilesLoaded()

            this.activeProfileArn = profileArn
            this.setActiveProfileByArn(profileArn)

            // Handle ATX profile change directly
            await this.handleAtxProfileChange(profileArn, token)

            // Clears Transform Handler gumby client since profile changed
            this.cacheCallbacks.forEach(callback => callback())
        }
    }

    public async handleAtxProfileChange(profileArn: string | null, token: CancellationToken): Promise<void> {
        if (profileArn === null) {
            this.log('ATX: Clearing profile')
            if (this.cachedAtxCodewhispererService) {
                this.cachedAtxCodewhispererService.profileArn = undefined
            }
            if (this.cachedAtxStreamingClient) {
                this.cachedAtxStreamingClient.profileArn = undefined
            }
            this.activeAtxProfile = undefined
            return
        }

        const parsedArn = parse(profileArn)
        const region = parsedArn.region
        const endpoint = getAtxEndPointByRegion(region)
        if (!endpoint) {
            throw new Error('Requested profileArn region is not supported')
        }
        this.log(`ATX: Setting profile for region ${region}`)

        const newProfile: AmazonQDeveloperProfile = {
            arn: profileArn,
            name: 'ATX Client provided profile',
            identityDetails: {
                region: parsedArn.region,
            },
        }

        this.activeAtxProfile = newProfile

        if (this.cachedAtxCodewhispererService) {
            this.cachedAtxCodewhispererService.profileArn = newProfile.arn
        } else {
            this.createAtxServiceInstances()
        }

        if (this.cachedAtxStreamingClient) {
            this.cachedAtxStreamingClient.profileArn = newProfile.arn
        }

        this.log(`ATX: Profile updated successfully`)
    }

    private createAtxServiceInstances() {
        const region = this.activeAtxProfile?.identityDetails?.region || 'us-east-1'
        const endpoint = getAtxEndPointByRegion(region)

        if (!endpoint) {
            throw new Error(`ATX region ${region} is not supported`)
        }

        this.log(`ATX: Creating service instances for region ${region}`)
        this.cachedAtxCodewhispererService = this.atxServiceFactory(region, endpoint)
        this.cachedAtxCodewhispererService.profileArn = this.activeAtxProfile?.arn

        this.cachedAtxStreamingClient = this.atxStreamingClientFactory(region, endpoint)
        this.cachedAtxStreamingClient.profileArn = this.activeAtxProfile?.arn
        this.log('ATX: Service instances created successfully')
    }

    public getAtxCodewhispererService(): CodeWhispererServiceToken {
        const atxCredentialsProvider = this.features.runtime.getAtxCredentialsProvider?.()
        if (!atxCredentialsProvider) {
            throw new AmazonQServicePendingSigninError()
        }

        const hasBearer = atxCredentialsProvider.hasCredentials('bearer')
        if (!hasBearer) {
            throw new AmazonQServicePendingSigninError()
        }

        const creds = atxCredentialsProvider.getCredentials('bearer')
        if (!creds || !('token' in creds) || !creds.token) {
            throw new AmazonQServicePendingSigninError()
        }

        if (!this.cachedAtxCodewhispererService) {
            this.createAtxServiceInstances()
        }

        return this.cachedAtxCodewhispererService!
    }

    public getAtxStreamingClient(): StreamingClientServiceToken {
        // Trigger service creation if needed
        this.getAtxCodewhispererService()

        return this.cachedAtxStreamingClient!
    }

    private atxServiceFactory(region: string, endpoint: string): CodeWhispererServiceToken {
        const atxCredentialsProvider = this.features.runtime.getAtxCredentialsProvider?.()
        if (!atxCredentialsProvider) {
            throw new Error('ATX credentials provider not available in runtime')
        }

        const customUserAgent = this.getCustomUserAgent()
        const initParam = this.features.lsp.getClientInitializeParams()
        const atxUserContext = initParam
            ? makeUserContextObject(
                  initParam,
                  this.features.runtime.platform,
                  'atx-token',
                  this.features.runtime.serverInfo
              )
            : undefined

        const service = new CodeWhispererServiceToken(
            atxCredentialsProvider,
            this.features.workspace,
            this.features.logging,
            region,
            endpoint,
            this.features.sdkInitializator,
            atxUserContext,
            customUserAgent
        )

        service.profileArn = this.activeAtxProfile?.arn
        return service
    }

    private atxStreamingClientFactory(region: string, endpoint: string): StreamingClientServiceToken {
        const atxCredentialsProvider = this.features.runtime.getAtxCredentialsProvider?.()
        if (!atxCredentialsProvider) {
            throw new Error('ATX credentials provider not available in runtime')
        }

        const streamingClient = new StreamingClientServiceToken(
            atxCredentialsProvider,
            this.features.sdkInitializator,
            this.features.logging,
            region,
            endpoint,
            this.getCustomUserAgent()
        )
        streamingClient.profileArn = this.activeAtxProfile?.arn
        return streamingClient
    }

    private getCustomUserAgent() {
        const initializeParams = this.features.lsp.getClientInitializeParams() || {}
        return getUserAgent(initializeParams as any, this.features.runtime.serverInfo)
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

    /**
     * Ensure profiles are loaded from ATX FES before profile operations
     */
    public async ensureProfilesLoaded(): Promise<void> {
        try {
            if (this.cachedTransformProfiles.length === 0 && this.hasValidCredentials()) {
                this.log('ATX: Loading available profiles')
                await this.refreshAvailableProfiles()
            }
        } catch (error) {
            this.log(`ATX: Error ensuring profiles loaded: ${String(error)}`)
        }
    }

    /**
     * Refresh available ATX profiles from FES using TransformConfigurationServer
     */
    public async refreshAvailableProfiles(): Promise<void> {
        try {
            if (!this.hasValidCredentials()) {
                return
            }

            this.log('ATX: Refreshing available profiles')
            const configServer = new TransformConfigurationServer(this.features.logging, this.features)
            const profiles = await configServer.listAvailableProfiles({} as CancellationToken)

            this.log(`ATX: Refreshed ${profiles.length} profiles`)
            this.cacheTransformProfiles(profiles)
        } catch (error) {
            this.log(`ATX: Error refreshing profiles: ${String(error)}`)
        }
    }

    public registerCacheCallback(callback: () => void): void {
        this.cacheCallbacks.push(callback)
    }

    private clearAllCaches(): void {
        this.activeProfileArn = null
        this.activeApplicationUrl = null
        // Don't clear cachedTransformProfiles - they should persist
        this.cacheCallbacks.forEach(callback => callback())
    }

    public hasValidCredentials(): boolean {
        const runtime = (this.features as any).runtime
        if (runtime && runtime.getAtxCredentialsProvider) {
            const atxCredentialsProvider = runtime.getAtxCredentialsProvider()
            return atxCredentialsProvider?.hasCredentials('bearer') || false
        }
        return false
    }

    public async getBearerToken(): Promise<string> {
        if (!this.hasValidCredentials()) {
            throw new Error('No bearer credentials available for ATX')
        }

        const runtime = (this.features as any).runtime
        const atxCredentialsProvider = runtime.getAtxCredentialsProvider()
        const credentials = atxCredentialsProvider?.getCredentials('bearer')

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
