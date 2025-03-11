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
    AmazonQServiceNoProfileSupportError,
    AmazonQServiceNotInitializedError,
    AmazonQServicePendingProfileError,
    AmazonQServicePendingProfileUpdateError,
    AmazonQServicePendingSigninError,
} from './errors'
import { BaseAmazonQServiceManager } from './BaseAmazonQServiceManager'
import { Q_LSP_CONFIGURATION_SECTION } from '../constants'
import { listAvailableProfiles } from './listAvailableProfilesMock'

export interface Features {
    lsp: Lsp
    logging: Logging
    runtime: Runtime
    credentialsProvider: CredentialsProvider
    sdkInitializator: SDKInitializator
    workspace: Workspace
}

export interface AmazonQDeveloperProfile {
    arn: string
    profileName: string
    region: string
}

export class AmazonQTokenServiceManager implements BaseAmazonQServiceManager {
    private static instance: AmazonQTokenServiceManager | null = null
    private features!: Features
    private logging!: Logging
    private cachedCodewhispererService?: CodeWhispererServiceToken
    private activeIdcProfile?: AmazonQDeveloperProfile
    private connectionType?: 'builderId' | 'identityCenter' | 'none'
    private serviceStatus: 'PENDING_CONNECTION' | 'PENDING_Q_PROFILE' | 'PENDING_Q_PROFILE_UPDATE' | 'INITIALIZED' =
        'PENDING_CONNECTION'

    private constructor() {}

    public static getInstance(features: Features): AmazonQTokenServiceManager {
        if (!AmazonQTokenServiceManager.instance) {
            AmazonQTokenServiceManager.instance = new AmazonQTokenServiceManager()
            AmazonQTokenServiceManager.instance.initialize(features)
        }
        return AmazonQTokenServiceManager.instance
    }

    private initialize(features: Features): void {
        if (!this.features) {
            throw new Error('Service features not initialized. Please ensure proper initialization.')
        }
        this.features = features
        this.logging = features.logging

        this.handleSsoConnectionChange()
        this.setupAuthListener()
        this.setupConfigurationListener()

        this.logging?.log('Amazon Q: Initialized CodeWhispererToken Service Manager')
    }

    private setupAuthListener(): void {
        // TODO: listen on changes to credentials and signout events from client to manage state correctly.
    }

    private handleSsoConnectionChange() {
        // TODO: replace with reading ssoType directly from Credentials provider.
        const newConnectionType = getSsoConnectionType(this.features.credentialsProvider)

        this.logServiceState('Validate State of SSO Connection')

        if (newConnectionType === 'none') {
            // Connection was reset, wait for SSO connection token from client
            this.resetCodewhispererService()
            this.connectionType = 'none'

            this.logServiceState('Connection is not set')

            return
        }

        if (!this.features.credentialsProvider.hasCredentials('bearer')) {
            this.resetCodewhispererService()

            throw new AmazonQServicePendingSigninError()
        }

        // Connection type hasn't change.
        if (newConnectionType === this.connectionType) {
            this.logServiceState('Connection type did not change.')

            return
        }

        // Connection type changed to 'builderId'

        if (newConnectionType === 'builderId') {
            this.logging.log('Detected New connection type: builderId')
            this.resetCodewhispererService()
            this.initializeCodewhispererService('builderId')

            return
        }

        // Connection type changed to identityCenter

        if (newConnectionType === 'identityCenter') {
            this.logging.log('Detected New connection type: identityCenter')

            this.resetCodewhispererService()

            this.connectionType = 'identityCenter'
            this.serviceStatus = 'PENDING_Q_PROFILE'

            this.logServiceState('Pending profile selection for IDC connection')

            // if (!this.activeIdcProfile) {
            //     this.logging?.log('[Amazon Q Validate Connection] Profile is not set for connectionType identityCenter')

            //     this.connectionType = 'identityCenter'
            //     this.serviceStatus = 'PENDING_Q_PROFILE'

            //     this.logging?.log(
            //         `[Amazon Q Validate Connection] New State: connectionType=${this.connectionType}, serviceStatus=${this.serviceStatus}`
            //     )

            //     return
            // }

            // this.initializeCodewhispererService('identityCenter', this.activeIdcProfile.region)
        }

        this.logServiceState('Unknown Connection state')
    }

    private setupConfigurationListener(): void {
        this.features.lsp.workspace.onUpdateConfiguration(async (params: UpdateConfigurationParams) => {
            try {
                if (params.section === Q_LSP_CONFIGURATION_SECTION && params.settings.profileArn) {
                    await this.handleProfileChange(params.settings.profileArn)
                }
            } catch (error) {
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
        if (!newProfileArn || newProfileArn.length === 0) {
            throw new Error('Received invalid Profile ARN')
        }

        this.logServiceState('UpdateProfile is requested')

        if (this.connectionType !== 'identityCenter') {
            this.logServiceState('Q Profile can not be set')
            throw new AmazonQServiceNoProfileSupportError(
                `Connection type ${this.connectionType} does not support profiles feature.`
            )
        }

        // Check if profile region changed compared to cached value
        // Reset client if yes, to prevent making calls to wrong region
        if (this.serviceStatus === 'INITIALIZED' && this.activeIdcProfile) {
            // Change status to pending to prevent API calls until profile is updated.
            // Because `listAvailableProfiles` below can take few seconds to complete,
            // there is possibility that client could send requests while profile is changing.
            this.serviceStatus = 'PENDING_Q_PROFILE_UPDATE'
        }

        const profiles = await listAvailableProfiles(this.features)

        const newProfile = profiles.find(el => el.arn === newProfileArn)

        if (!newProfile) {
            // TODO: do more validation if necessary, for now, checking only existence of the profile
            // TODO: do we need to reset service here if requested profile does not exist anymore?
            this.logging?.log(`Amazon Q Profile ${newProfileArn} is not valid`)
            this.resetCodewhispererService()
            this.serviceStatus = 'PENDING_Q_PROFILE'

            throw new AmazonQServiceInvalidProfileError('Requested Amazon Q Profile does not exist')
        }

        if (!this.activeIdcProfile) {
            this.initializeCodewhispererService('identityCenter', newProfile.region)
            this.activeIdcProfile = newProfile

            return
        }

        // Profile didn't change
        if (this.activeIdcProfile && this.activeIdcProfile.arn === newProfile.arn) {
            // Update cached profile fields, keep existing client
            this.logging?.log('Amazon Q Profile Change: profile selection did not change')
            this.activeIdcProfile = newProfile
            this.serviceStatus = 'INITIALIZED'

            return
        }

        // At this point new valid profile is selected.

        const oldRegion = this.activeIdcProfile.region
        const newRegion = newProfile.region
        if (oldRegion === newRegion) {
            this.logging?.log(`Amazon Q server: new profile is in the same region as old one, keeping exising service.`)
            this.activeIdcProfile = newProfile
            this.serviceStatus = 'INITIALIZED'

            return
        }

        this.logging?.log(`Amazon Q: switching service client region from ${oldRegion} to ${newRegion}`)

        // Selected new profile is in different region. Re-initialize service and terminate inflight requests
        this.resetCodewhispererService()
        this.initializeCodewhispererService('identityCenter', newProfile.region)

        this.activeIdcProfile = newProfile

        return
    }

    public getCodewhispererService(): CodeWhispererServiceToken {
        if (this.serviceStatus === 'PENDING_Q_PROFILE_UPDATE') {
            throw new AmazonQServicePendingProfileUpdateError()
        }

        this.handleSsoConnectionChange()

        if (this.serviceStatus === 'INITIALIZED' && this.cachedCodewhispererService) {
            return this.cachedCodewhispererService
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

        this.logServiceState('Active CodeWhispererService Instance is found')

        return this.cachedCodewhispererService
    }

    private resetCodewhispererService() {
        // TODO: terminate inflight requests for old service, if exist

        this.cachedCodewhispererService = undefined
        this.activeIdcProfile = undefined
        this.serviceStatus = 'PENDING_CONNECTION'
    }

    private initializeCodewhispererService(
        connectionType: 'builderId' | 'identityCenter',
        region: string = DEFAULT_AWS_Q_REGION
    ) {
        this.logServiceState('Initializing CodewhispererService')

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

        this.logServiceState('CodewhispererService Initialization finished')
    }

    // Optional: Method to reset the singleton instance (mainly for testing purposes)
    public static resetInstance(): void {
        AmazonQTokenServiceManager.instance = null
    }

    private logServiceState(context: string): void {
        this.logging?.debug(
            JSON.stringify({
                context,
                state: {
                    serviceStatus: this.serviceStatus,
                    connectionType: this.connectionType,
                    activeIdcProfile: this.activeIdcProfile,
                },
            })
        )
    }
}
