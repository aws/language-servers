import {
    Logging,
    UpdateConfigurationParams,
    ResponseError,
    Lsp,
    CredentialsProvider,
    SDKInitializator,
    Runtime,
    Workspace,
    LSPErrorCodes,
} from '@aws/language-server-runtimes/server-interface'
import { DEFAULT_AWS_Q_ENDPOINT_URL, DEFAULT_AWS_Q_REGION, AWS_Q_ENDPOINTS } from '../../constants'
import { CodeWhispererServiceToken } from '../codeWhispererService'
import { getSsoConnectionType } from '../utils'
import {
    AmazonQError,
    AmazonQServiceInvalidProfileError,
    AmazonQServiceNotInitializedError,
    AmazonQServicePendingProfileError,
    AmazonQServicePendingSigninError,
} from './errors'

interface Features {
    lsp: Lsp
    logging: Logging
    runtime: Runtime
    credentialsProvider: CredentialsProvider
    sdkInitializator: SDKInitializator
    workspace: Workspace
}

interface AmazonQDeveloperProfile {
    arn: string
    profileName: string
    region: string
}

export class AmazonQTokenServiceManager {
    private static instance: AmazonQTokenServiceManager | null = null
    private features?: Features
    private logging?: Logging
    private cachedCodewhispererService?: CodeWhispererServiceToken
    private cachedProfile?: AmazonQDeveloperProfile
    private connectionType?: 'builderId' | 'identityCenter' | 'none'
    private serviceStatus: 'UNINITIALIZED' | 'PENDING_CONNECTION' | 'PENDING_Q_PROFILE' | 'INITIALIZED' =
        'UNINITIALIZED'

    private constructor() {}

    public static getInstance(features: Features): AmazonQTokenServiceManager {
        if (!AmazonQTokenServiceManager.instance) {
            AmazonQTokenServiceManager.instance = new AmazonQTokenServiceManager()
            AmazonQTokenServiceManager.instance.initialize(features)
        }
        return AmazonQTokenServiceManager.instance
    }

    private initialize(features: Features): void {
        this.features = features
        this.logging = features.logging

        this.setupCodewhispererService()
        this.setupAuthListener()
        this.setupConfigurationListener()
    }

    private setupCodewhispererService() {
        if (!this.features) {
            throw new Error('Features not initialized')
        }

        const connectionType = getSsoConnectionType(this.features.credentialsProvider)

        if (connectionType === 'none') {
            // Connection type is unknown, service is not initialized
            this.serviceStatus = 'PENDING_CONNECTION'

            return
        }

        if (connectionType === 'builderId') {
            // Always use default region for BuilderId.
            this.initializeCodewhispererService('builderId')

            return
        }

        if (connectionType === 'identityCenter') {
            this.serviceStatus = 'PENDING_Q_PROFILE'

            return
        }

        throw new Error('Amazon Q: Undefined SSO connection type')
    }

    private setupAuthListener(): void {
        // TODO: listen on changes to credentials and signout events from client to manage state correctly.
    }

    private setupConfigurationListener(): void {
        if (!this.features) {
            throw new Error('Features not initialized')
        }

        this.logging?.log(`Amazon Q server: setting Q Language Server Configuration handler`)

        this.features.lsp.workspace.onUpdateConfiguration(async (params: UpdateConfigurationParams) => {
            try {
                if (params.section === 'amazon.q' && params.settings.profileArn) {
                    await this.handleProfileChange(params.settings.profileArn)
                }
            } catch (error) {
                this.logging?.log(`Error handling configuration change: ${error}`)

                if (error instanceof AmazonQError) {
                    throw new ResponseError(LSPErrorCodes.RequestFailed, error.message, {
                        awsErrorCode: error.code,
                    })
                }

                throw new ResponseError(LSPErrorCodes.RequestFailed, 'Failed to update configuration')
            }
        })
    }

    private async handleProfileChange(newProfileArn: string): Promise<void> {
        if (!this.features) {
            throw new Error('Server is not properly configured')
        }

        if (!newProfileArn || newProfileArn.length === 0) {
            // TODO: more validation
            throw new Error('Received invalid Profile ARN')
        }

        // TODO: replace with reading ssoType directly from Credentials provider.
        // Validate connection type hasn't changed mid-session
        const newConnectionType = await getSsoConnectionType(this.features.credentialsProvider)

        // Connection type was builderId or none, and it didn't change.
        // Keep existing state, do nothing
        if (
            newConnectionType === this.connectionType &&
            (this.connectionType === 'builderId' || this.connectionType === 'none')
        ) {
            return
        }

        // Connection type changed to 'none'

        if (newConnectionType === 'none') {
            // Connection was reset mid-session, wait for singin token from client
            this.resetCodewhispererService()
            this.connectionType = 'none'
            this.serviceStatus = 'PENDING_CONNECTION'

            throw new AmazonQServicePendingSigninError()
        }

        // Connection type changed to 'builderId'

        if (newConnectionType === 'builderId') {
            if (this.cachedCodewhispererService && this.connectionType === 'identityCenter') {
                // TODO: terminate inflight requests for old service, if exist
                this.resetCodewhispererService()
            }

            this.initializeCodewhispererService('builderId')
            this.features.logging.log('Re-initalized service with BuilderID credentials')

            return
        }

        // Connection type is identityCenter (changed or unchanged)

        if (this.serviceStatus === 'PENDING_CONNECTION') {
            throw new AmazonQServicePendingSigninError()
        }

        const profiles = await this.listAllAvailableProfiles()
        const newProfile = profiles.find(el => el.arn === newProfileArn)

        if (!newProfile) {
            // TODO: do more validation if necessary, for now, checking only existence of the profile
            // TODO: do we need to reset service here if requested profile does not exist anymore?
            this.resetCodewhispererService()

            throw new AmazonQServiceInvalidProfileError('Requested Amazon Q Profile does not exist')
        }

        if (this.serviceStatus === 'PENDING_Q_PROFILE') {
            this.initializeCodewhispererService('identityCenter', newProfile.region)
            this.cachedProfile = newProfile

            return
        }

        if (this.serviceStatus === 'UNINITIALIZED') {
            // Should not happen at this point. Log error
            this.logging?.debug('Unexpected state: update profile for IDC called in UNINITIALIZED state')

            // TODO: decide what to do here
            throw new Error('Unexpected state.')
        }

        // From now, we are updating INITIALIZED state for IDC

        if (this.cachedProfile && this.cachedProfile.arn === newProfile.arn) {
            // Update cached profile fields, keep existing client
            this.cachedProfile = newProfile

            return
        }

        if (!this.cachedProfile) {
            this.initializeCodewhispererService('identityCenter', newProfile.region)
            this.cachedProfile = newProfile

            return
        }

        // At this point new valid profile is selected.

        const oldRegion = this.cachedProfile.region
        const newRegion = newProfile.region
        if (oldRegion === newRegion) {
            this.logging?.log(`Amazon Q server: new profile is in the same region as old one.`)
            return
        }

        // Selected new profile is in different region. Re-initialize service and terminate inflight requests
        this.resetCodewhispererService()
        this.initializeCodewhispererService('identityCenter', newProfile.region)

        // Cache profile
        this.cachedProfile = newProfile

        return
    }

    public getCodewhispererService(): CodeWhispererServiceToken {
        if (this.serviceStatus === 'UNINITIALIZED') {
            throw new AmazonQServiceNotInitializedError()
        }

        if (this.serviceStatus === 'PENDING_CONNECTION') {
            throw new AmazonQServicePendingSigninError()
        }

        if (this.serviceStatus === 'PENDING_Q_PROFILE') {
            throw new AmazonQServicePendingProfileError()
        }

        if (!this.cachedCodewhispererService) {
            throw new AmazonQServiceNotInitializedError()
        }

        return this.cachedCodewhispererService
    }

    private resetCodewhispererService() {
        this.cachedCodewhispererService = undefined
        this.cachedProfile = undefined
        this.serviceStatus = 'UNINITIALIZED'
    }

    private initializeCodewhispererService(connectionType: 'builderId' | 'identityCenter', region?: string) {
        if (!this.features) {
            throw new Error('Service is not initialized correctly')
        }

        let awsQRegion = this.features.runtime.getConfiguration('AWS_Q_REGION') ?? DEFAULT_AWS_Q_REGION
        let awsQEndpointUrl = this.features.runtime.getConfiguration('AWS_Q_ENDPOINT_URL') ?? DEFAULT_AWS_Q_ENDPOINT_URL

        if (region) {
            awsQRegion = region
            // @ts-ignore
            awsQEndpointUrl = AWS_Q_ENDPOINTS[region]
        }

        this.cachedCodewhispererService = new CodeWhispererServiceToken(
            this.features.credentialsProvider,
            this.features.workspace,
            awsQRegion,
            awsQEndpointUrl,
            this.features.sdkInitializator
        )

        this.connectionType = connectionType
        this.serviceStatus = 'INITIALIZED'
    }

    // Optional: Method to reset the singleton instance (mainly for testing purposes)
    public static resetInstance(): void {
        AmazonQTokenServiceManager.instance = null
    }

    public async listAllAvailableProfiles(): Promise<AmazonQDeveloperProfile[]> {
        // Check if connection type is set and is identityCenter
        if (!this.connectionType || this.connectionType !== 'identityCenter') {
            this.logging?.debug('Connection type is not set or not identityCenter - returning empty response')
            return []
        }

        const allProfiles: AmazonQDeveloperProfile[] = []

        try {
            // Loop through AWS_Q_ENDPOINTS and list available profiles
            for (const [region, endpoint] of Object.entries(AWS_Q_ENDPOINTS)) {
                try {
                    const codewhispererService = new CodeWhispererServiceToken(
                        this.features!.credentialsProvider,
                        this.features!.workspace,
                        region,
                        endpoint,
                        this.features!.sdkInitializator
                    )

                    const resp = await codewhispererService.listAvailableProfiles()

                    if (resp) {
                        // Add region information to each profile
                        const profilesWithRegion = resp.profiles.map(profile => ({
                            ...profile,
                            region,
                        }))

                        allProfiles.push(...profilesWithRegion)
                    }

                    this.features!.logging.log(`Got profiles from ${region}: ${JSON.stringify(resp)}`)
                } catch (error) {
                    // Log error but continue with other regions
                    this.features!.logging.error(`Error fetching profiles from ${region}: ${error}`)
                }
            }

            return allProfiles
        } catch (error) {
            this.features!.logging.error(`Failed to list all profiles: ${error}`)
            throw error
        }
    }
}
