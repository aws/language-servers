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
    SsoConnectionType,
    CancellationToken,
} from '@aws/language-server-runtimes/server-interface'
import { DEFAULT_AWS_Q_ENDPOINT_URL, DEFAULT_AWS_Q_REGION, AWS_Q_ENDPOINTS } from '../../constants'
import { CodeWhispererServiceToken } from '../codeWhispererService'
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
import { listAvailableProfiles } from './listAvailableProfilesMock'
import { Q_CONFIGURATION_SECTION } from '../configuration/qConfigurationServer'
import { undefinedIfEmpty } from '../utilities/textUtils'

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

/**
 * AmazonQTokenServiceManager manages state and provides centralized access to
 * instance of CodeWhispererServiceToken SDK client to any consuming code.
 * It ensures that CodeWhispererServiceToken is configured to always access correct regionalized Amazon Q Developer API endpoint.
 * Regional endppoint is selected based on:
 * 1) current SSO auth connection type (BuilderId or IDC).
 * 2) selected Amazon Q Developer profile (only for IDC connection type).
 *
 * @states
 * - PENDING_CONNECTION: Initial state when no bearer token is set
 * - PENDING_Q_PROFILE: When using Identity Center and waiting for profile selection
 * - PENDING_Q_PROFILE_UPDATE: During profile update operation
 * - INITIALIZED: Service is ready to handle requests
 *
 * @connectionTypes
 * - none: No active connection
 * - builderId: Connected via Builder ID
 * - identityCenter: Connected via Identity Center
 *
 * AmazonQTokenServiceManager is a singleton class, which must be instantiated with Language Server runtimes [Features](https://github.com/aws/language-server-runtimes/blob/21d5d1dc7c73499475b7c88c98d2ce760e5d26c8/runtimes/server-interface/server.ts#L31-L42)
 * To get access to current CodeWhispererServiceToken client object, call `getCodewhispererService()` mathod:
 *
 * @example
 * const AmazonQServiceManager = AmazonQTokenServiceManager.getInstance(features);
 * const codewhispererService = AmazonQServiceManager.getCodewhispererService();
 */
export class AmazonQTokenServiceManager implements BaseAmazonQServiceManager {
    private static instance: AmazonQTokenServiceManager | null = null
    private features!: Features
    private logging!: Logging
    private cachedCodewhispererService?: CodeWhispererServiceToken
    private customUserAgent: string = 'Amazon Q Language Server'
    private enableDeveloperProfileSupport?: boolean
    private configurationCache = new Map()
    private activeIdcProfile?: AmazonQDeveloperProfile
    private connectionType?: SsoConnectionType
    /**
     * Internal state of Service connection, based on status of bearer token and Amazon Q Developer profile selection.
     * Supported states:
     * PENDING_CONNECTION - Waiting for Bearer Token and StartURL to be passed
     * PENDING_Q_PROFILE - (only for identityCenter connection) waiting for setting Developer Profile
     * PENDING_Q_PROFILE_UPDATE (only for identityCenter connection) waiting for Developer Profile to complete
     * INITIALIZED - Service is initialized
     */
    private state: 'PENDING_CONNECTION' | 'PENDING_Q_PROFILE' | 'PENDING_Q_PROFILE_UPDATE' | 'INITIALIZED' =
        'PENDING_CONNECTION'

    private constructor() {}

    public static getInstance(features: Features, enableDeveloperProfileSupport = false): AmazonQTokenServiceManager {
        if (!AmazonQTokenServiceManager.instance) {
            AmazonQTokenServiceManager.instance = new AmazonQTokenServiceManager()
            AmazonQTokenServiceManager.instance.initialize(features, enableDeveloperProfileSupport)
        }
        return AmazonQTokenServiceManager.instance
    }

    private initialize(features: Features, enableDeveloperProfileSupport = false): void {
        if (!features || !features.logging || !features.lsp) {
            throw new Error('Service features not initialized. Please ensure proper initialization.')
        }

        this.features = features
        this.logging = features.logging

        this.enableDeveloperProfileSupport = enableDeveloperProfileSupport

        this.connectionType = 'none'
        this.state = 'PENDING_CONNECTION'

        this.setupAuthListener()
        this.setupConfigurationListeners()

        this.logging?.log('Amazon Q: Initialized CodeWhispererToken Service Manager')
    }

    public updateClientConfig(config: { userAgent: string }) {
        if (config.userAgent) {
            this.customUserAgent = config.userAgent
        }
    }

    private setupAuthListener(): void {
        // TODO: listen on changes to credentials and signout events from client to manage state correctly.
    }

    private setupConfigurationListeners(): void {
        this.features.lsp.onInitialized(this.handleDidChangeConfiguration)
        this.features.lsp.didChangeConfiguration(this.handleDidChangeConfiguration)

        this.features.lsp.workspace.onUpdateConfiguration(
            async (params: UpdateConfigurationParams, _token: CancellationToken) => {
                try {
                    if (params.section === Q_CONFIGURATION_SECTION && params.settings.profileArn) {
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
            }
        )
    }

    /**
     * Validate if Bearer Token Connection type has changed mid-session.
     * When connection type change is detected: reinitialize CodeWhispererService class with current connection type.
     */
    private handleSsoConnectionChange() {
        const newConnectionType = this.features.credentialsProvider.getConnectionType()

        this.logServiceState('Validate State of SSO Connection')

        if (newConnectionType === 'none' || !this.features.credentialsProvider.hasCredentials('bearer')) {
            // Connection was reset, wait for SSO connection token from client
            this.resetCodewhispererService()
            this.connectionType = 'none'
            this.state = 'PENDING_CONNECTION'

            this.logServiceState('Connection is not set')

            return
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
            this.createCodewhispererServiceInstance('builderId')
            this.state = 'INITIALIZED'
            this.logging.log('Initialized Amazon Q service with builderId connection')

            return
        }

        // Connection type changed to 'identityCenter'

        if (newConnectionType === 'identityCenter') {
            this.logging.log('Detected New connection type: identityCenter')

            this.resetCodewhispererService()

            if (this.enableDeveloperProfileSupport) {
                this.connectionType = 'identityCenter'
                this.state = 'PENDING_Q_PROFILE'
                this.logServiceState('Pending profile selection for IDC connection')

                return
            }

            this.createCodewhispererServiceInstance('identityCenter')
            this.state = 'INITIALIZED'
            this.logging.log('Initialized Amazon Q service with identityCenter connection')
        }

        this.logServiceState('Unknown Connection state')
    }

    private async handleDidChangeConfiguration() {
        try {
            const qConfig = await this.features.lsp.workspace.getConfiguration(Q_CONFIGURATION_SECTION)
            if (qConfig) {
                // aws.q.customizationArn - selected customization
                const customizationArn = undefinedIfEmpty(qConfig.customization)
                this.configurationCache.set('customizationArn', customizationArn)
                this.logging.log(`Amazon Q Service Configuration updated to use ${customizationArn}`)

                // aws.q.optOutTelemetry - telemetry optout option
                const optOutTelemetryPreference = qConfig['optOutTelemetry'] === true ? 'OPTOUT' : 'OPTIN'
                this.configurationCache.set('optOutTelemetryPreference', optOutTelemetryPreference)

                if (this.cachedCodewhispererService) {
                    this.cachedCodewhispererService.customizationArn = customizationArn
                }
            }

            const codeWhispererConfig = await this.features.lsp.workspace.getConfiguration('aws.codeWhisperer')
            if (codeWhispererConfig) {
                // aws.codeWhisperer.includeSuggestionsWithCodeReferences - return suggestions with code references
                const includeSuggestionsWithCodeReferences =
                    codeWhispererConfig['includeSuggestionsWithCodeReferences'] === true
                this.logging.log(
                    `Configuration updated to ${includeSuggestionsWithCodeReferences ? 'include' : 'exclude'} suggestions with code references`
                )

                // aws.codeWhisperershareCodeWhispererContentWithAWS - share content with AWS
                const shareCodeWhispererContentWithAWS =
                    codeWhispererConfig['shareCodeWhispererContentWithAWS'] === true
                this.logging.log(
                    `Configuration updated to ${shareCodeWhispererContentWithAWS ? 'share' : 'not share'} Amazon Q content with AWS`
                )

                this.configurationCache.set(
                    'includeSuggestionsWithCodeReferences',
                    includeSuggestionsWithCodeReferences
                )
                this.configurationCache.set('shareCodeWhispererContentWithAWS', shareCodeWhispererContentWithAWS)

                if (this.cachedCodewhispererService) {
                    this.cachedCodewhispererService.shareCodeWhispererContentWithAWS = shareCodeWhispererContentWithAWS
                }
            }
        } catch (error) {
            this.logging.log(`Error in GetConfiguration: ${error}`)
        }
    }

    private async handleProfileChange(newProfileArn: string): Promise<void> {
        if (!this.enableDeveloperProfileSupport) {
            this.logging.log('Developer Profiles Support is not enabled')
            return
        }

        if (!newProfileArn || newProfileArn.length === 0) {
            throw new Error('Received invalid Profile ARN')
        }

        this.logServiceState('UpdateProfile is requested')

        // Test if connection type changed
        this.handleSsoConnectionChange()

        if (this.connectionType === 'none') {
            throw new AmazonQServicePendingSigninError()
        }

        if (this.connectionType !== 'identityCenter') {
            this.logServiceState('Q Profile can not be set')
            throw new AmazonQServiceNoProfileSupportError(
                `Connection type ${this.connectionType} does not support Developer Profiles feature.`
            )
        }

        if (this.state === 'INITIALIZED' && this.activeIdcProfile) {
            // Change status to pending to prevent API calls until profile is updated.
            // Because `listAvailableProfiles` below can take few seconds to complete,
            // there is possibility that client could send requests while profile is changing.
            this.state = 'PENDING_Q_PROFILE_UPDATE'
        }

        // TODO: Using tmp helper, switch to proper API call service provider https://github.com/aws/language-servers/pull/822
        const profiles = await listAvailableProfiles(this.features)

        const newProfile = profiles.find(el => el.arn === newProfileArn)

        if (!newProfile) {
            this.logging.log(`Amazon Q Profile ${newProfileArn} is not valid`)
            this.resetCodewhispererService()
            this.state = 'PENDING_Q_PROFILE'

            throw new AmazonQServiceInvalidProfileError('Requested Amazon Q Profile does not exist')
        }

        if (!this.activeIdcProfile) {
            this.createCodewhispererServiceInstance('identityCenter', newProfile.region)
            this.state = 'INITIALIZED'
            this.activeIdcProfile = newProfile

            return
        }

        // Profile didn't change
        if (this.activeIdcProfile && this.activeIdcProfile.arn === newProfile.arn) {
            // Update cached profile fields, keep existing client
            this.logging?.log('Amazon Q Profile Change: profile selection did not change')
            this.activeIdcProfile = newProfile
            this.state = 'INITIALIZED'

            return
        }

        // At this point new valid profile is selected.

        const oldRegion = this.activeIdcProfile.region
        const newRegion = newProfile.region
        if (oldRegion === newRegion) {
            this.logging?.log(`Amazon Q server: new profile is in the same region as old one, keeping exising service.`)
            this.activeIdcProfile = newProfile
            this.state = 'INITIALIZED'

            return
        }

        this.logging?.log(`Amazon Q: switching service client region from ${oldRegion} to ${newRegion}`)

        // Selected new profile is in different region. Re-initialize service and terminate inflight requests
        this.resetCodewhispererService()
        this.createCodewhispererServiceInstance('identityCenter', newProfile.region)
        this.state = 'INITIALIZED'

        this.activeIdcProfile = newProfile

        return
    }

    public getCodewhispererService(): CodeWhispererServiceToken {
        // Prevent initiating requests while profile change is in progress.
        if (this.state === 'PENDING_Q_PROFILE_UPDATE') {
            throw new AmazonQServicePendingProfileUpdateError()
        }

        this.handleSsoConnectionChange()

        if (this.state === 'INITIALIZED' && this.cachedCodewhispererService) {
            return this.cachedCodewhispererService
        }

        if (this.state === 'PENDING_CONNECTION') {
            throw new AmazonQServicePendingSigninError()
        }

        if (this.state === 'PENDING_Q_PROFILE') {
            throw new AmazonQServicePendingProfileError()
        }

        throw new AmazonQServiceNotInitializedError()
    }

    private resetCodewhispererService() {
        // TODO: terminate inflight requests for old service, if exist

        this.cachedCodewhispererService = undefined
        this.activeIdcProfile = undefined
    }

    private createCodewhispererServiceInstance(
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

        this.cachedCodewhispererService = this.serviceFactory(awsQRegion, awsQEndpointUrl)
        this.cachedCodewhispererService.updateClientConfig({
            customUserAgent: this.customUserAgent,
        })

        this.connectionType = connectionType

        this.logServiceState('CodewhispererService Initialization finished')
    }

    private serviceFactory(region: string, endpoint: string): CodeWhispererServiceToken {
        return new CodeWhispererServiceToken(
            this.features.credentialsProvider,
            this.features.workspace,
            region,
            endpoint,
            this.features.sdkInitializator
        )
    }

    private logServiceState(context: string): void {
        this.logging?.debug(
            JSON.stringify({
                context,
                state: {
                    serviceStatus: this.state,
                    connectionType: this.connectionType,
                    activeIdcProfile: this.activeIdcProfile,
                },
            })
        )
    }

    // For Unit Tests
    public static resetInstance(): void {
        AmazonQTokenServiceManager.instance = null
    }

    public getState() {
        return this.state
    }

    public getConnectionType() {
        return this.connectionType
    }

    public getActiveProfileArn() {
        return this.activeIdcProfile?.arn
    }

    public setServiceFactory(factory: (region: string, endpoint: string) => CodeWhispererServiceToken) {
        this.serviceFactory = factory
    }
}
