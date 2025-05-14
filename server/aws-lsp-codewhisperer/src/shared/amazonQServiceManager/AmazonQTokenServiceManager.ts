import {
    UpdateConfigurationParams,
    ResponseError,
    LSPErrorCodes,
    SsoConnectionType,
    CancellationToken,
    CredentialsType,
    InitializeParams,
    CancellationTokenSource,
} from '@aws/language-server-runtimes/server-interface'
import { CodeWhispererServiceToken } from '../codeWhispererService'
import {
    AmazonQError,
    AmazonQServiceAlreadyInitializedError,
    AmazonQServiceInitializationError,
    AmazonQServiceInvalidProfileError,
    AmazonQServiceNoProfileSupportError,
    AmazonQServiceNotInitializedError,
    AmazonQServicePendingProfileError,
    AmazonQServicePendingProfileUpdateError,
    AmazonQServicePendingSigninError,
    AmazonQServiceProfileUpdateCancelled,
} from './errors'
import {
    AmazonQBaseServiceManager,
    BaseAmazonQServiceManager,
    QServiceManagerFeatures,
} from './BaseAmazonQServiceManager'
import { AWS_Q_ENDPOINTS, Q_CONFIGURATION_SECTION } from '../constants'
import { AmazonQDeveloperProfile, signalsAWSQDeveloperProfilesEnabled } from './qDeveloperProfiles'
import { isStringOrNull } from '../utils'
import { getAmazonQRegionAndEndpoint } from './configurationUtils'
import { getUserAgent } from '../telemetryUtils'
import { StreamingClientServiceToken } from '../streamingClientService'
import { parse } from '@aws-sdk/util-arn-parser'

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
 * in the `AmazonQServiceServer` via the `initBaseTokenServiceManager` factory. Dependencies of this class can access the singleton via
 * the `getOrThrowBaseTokenServiceManager` factory or `getInstance()` method after the initialized notification has been received during
 * the LSP hand shake.
 *
 */
export class AmazonQTokenServiceManager extends BaseAmazonQServiceManager<
    CodeWhispererServiceToken,
    StreamingClientServiceToken
> {
    private static instance: AmazonQTokenServiceManager | null = null
    private enableDeveloperProfileSupport?: boolean
    private activeIdcProfile?: AmazonQDeveloperProfile
    private connectionType?: SsoConnectionType
    private profileChangeTokenSource: CancellationTokenSource | undefined
    private region?: string
    private endpoint?: string
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

    private constructor(features: QServiceManagerFeatures) {
        super(features)
    }

    // @VisibleForTesting, please DO NOT use in production
    setState(state: 'PENDING_CONNECTION' | 'PENDING_Q_PROFILE' | 'PENDING_Q_PROFILE_UPDATE' | 'INITIALIZED') {
        this.state = state
    }

    public static initInstance(features: QServiceManagerFeatures): AmazonQTokenServiceManager {
        if (!AmazonQTokenServiceManager.instance) {
            AmazonQTokenServiceManager.instance = new AmazonQTokenServiceManager(features)
            AmazonQTokenServiceManager.instance.initialize()

            return AmazonQTokenServiceManager.instance
        }

        throw new AmazonQServiceAlreadyInitializedError()
    }

    public static getInstance(): AmazonQTokenServiceManager {
        if (!AmazonQTokenServiceManager.instance) {
            throw new AmazonQServiceInitializationError(
                'Amazon Q service has not been initialized yet. Make sure the Amazon Q server is present and properly initialized.'
            )
        }

        return AmazonQTokenServiceManager.instance
    }

    private initialize(): void {
        if (!this.features.lsp.getClientInitializeParams()) {
            this.log('AmazonQTokenServiceManager initialized before LSP connection was initialized.')
            throw new AmazonQServiceInitializationError(
                'AmazonQTokenServiceManager initialized before LSP connection was initialized.'
            )
        }

        // Bind methods that are passed by reference to some handlers to maintain proper scope.
        this.serviceFactory = this.serviceFactory.bind(this)

        this.log('Reading enableDeveloperProfileSupport setting from AWSInitializationOptions')
        if (this.features.lsp.getClientInitializeParams()?.initializationOptions?.aws) {
            const awsOptions = this.features.lsp.getClientInitializeParams()?.initializationOptions?.aws || {}
            this.enableDeveloperProfileSupport = signalsAWSQDeveloperProfilesEnabled(awsOptions)

            this.log(`Enabled Q Developer Profile support: ${this.enableDeveloperProfileSupport}`)
        }

        this.connectionType = 'none'
        this.state = 'PENDING_CONNECTION'

        this.log('Manager instance is initialize')
    }

    public handleOnCredentialsDeleted(type: CredentialsType): void {
        this.log(`Received credentials delete event for type: ${type}`)
        if (type === 'iam') {
            return
        }
        this.cancelActiveProfileChangeToken()

        this.resetCodewhispererService()
        this.connectionType = 'none'
        this.state = 'PENDING_CONNECTION'
    }

    public async handleOnUpdateConfiguration(params: UpdateConfigurationParams, _token: CancellationToken) {
        try {
            if (params.section === Q_CONFIGURATION_SECTION && params.settings.profileArn !== undefined) {
                const profileArn = params.settings.profileArn
                const region = params.settings.region

                if (!isStringOrNull(profileArn)) {
                    throw new Error('Expected params.settings.profileArn to be of either type string or null')
                }

                this.log(`Profile update is requested for profile ${profileArn}`)
                this.cancelActiveProfileChangeToken()
                this.profileChangeTokenSource = new CancellationTokenSource()

                await this.handleProfileChange(profileArn, this.profileChangeTokenSource.token)
            }
        } catch (error) {
            this.log('Error updating profiles: ' + error)
            if (error instanceof AmazonQServiceProfileUpdateCancelled) {
                throw new ResponseError(LSPErrorCodes.ServerCancelled, error.message, {
                    awsErrorCode: error.code,
                })
            }
            if (error instanceof AmazonQError) {
                throw new ResponseError(LSPErrorCodes.RequestFailed, error.message, {
                    awsErrorCode: error.code,
                })
            }

            throw new ResponseError(LSPErrorCodes.RequestFailed, 'Failed to update configuration')
        } finally {
            if (this.profileChangeTokenSource) {
                this.profileChangeTokenSource.dispose()
                this.profileChangeTokenSource = undefined
            }
        }
    }

    /**
     * Validate if Bearer Token Connection type has changed mid-session.
     * When connection type change is detected: reinitialize CodeWhispererService class with current connection type.
     */
    private handleSsoConnectionChange() {
        const newConnectionType = this.features.credentialsProvider.getConnectionType()

        this.logServiceState('Validate State of SSO Connection')

        const noCreds = !this.features.credentialsProvider.hasCredentials('bearer')
        const noConnectionType = newConnectionType === 'none'
        if (noCreds || noConnectionType) {
            // Connection was reset, wait for SSO connection token from client
            this.log(
                `No active SSO connection is detected: no ${noCreds ? 'credentials' : 'connection type'} provided. Resetting the client`
            )
            this.resetCodewhispererService()
            this.connectionType = 'none'
            this.state = 'PENDING_CONNECTION'

            return
        }

        // Connection type hasn't change.

        if (newConnectionType === this.connectionType) {
            this.logging.debug(`Connection type did not change: ${this.connectionType}`)

            return
        }

        // Connection type changed to 'builderId'

        if (newConnectionType === 'builderId') {
            this.log('Detected New connection type: builderId')
            this.resetCodewhispererService()

            // For the builderId connection type regional endpoint discovery chain is:
            // region set by client -> runtime region -> default region
            const clientParams = this.features.lsp.getClientInitializeParams()

            this.createCodewhispererServiceInstances('builderId', clientParams?.initializationOptions?.aws?.region)
            this.state = 'INITIALIZED'
            this.log('Initialized Amazon Q service with builderId connection')

            return
        }

        // Connection type changed to 'identityCenter'

        if (newConnectionType === 'identityCenter') {
            this.log('Detected New connection type: identityCenter')

            this.resetCodewhispererService()

            if (this.enableDeveloperProfileSupport) {
                this.connectionType = 'identityCenter'
                this.state = 'PENDING_Q_PROFILE'
                this.logServiceState('Pending profile selection for IDC connection')

                return
            }

            this.createCodewhispererServiceInstances('identityCenter')
            this.state = 'INITIALIZED'
            this.log('Initialized Amazon Q service with identityCenter connection')

            return
        }

        this.logServiceState('Unknown Connection state')
    }

    private cancelActiveProfileChangeToken() {
        this.profileChangeTokenSource?.cancel()
        this.profileChangeTokenSource?.dispose()
        this.profileChangeTokenSource = undefined
    }

    private handleTokenCancellationRequest(token: CancellationToken) {
        if (token.isCancellationRequested) {
            this.logServiceState('Handling CancellationToken cancellation request')
            throw new AmazonQServiceProfileUpdateCancelled('Requested profile update got cancelled')
        }
    }

    private async handleProfileChange(newProfileArn: string | null, token: CancellationToken): Promise<void> {
        if (!this.enableDeveloperProfileSupport) {
            this.log('Developer Profiles Support is not enabled')
            return
        }

        if (typeof newProfileArn === 'string' && newProfileArn.length === 0) {
            throw new Error('Received invalid Profile ARN (empty string)')
        }

        this.logServiceState('UpdateProfile is requested')

        // Test if connection type changed
        this.handleSsoConnectionChange()

        if (this.connectionType === 'none') {
            if (newProfileArn !== null) {
                throw new AmazonQServicePendingSigninError()
            }

            this.logServiceState('Received null profile while not connected, ignoring request')
            return
        }

        if (this.connectionType !== 'identityCenter') {
            this.logServiceState('Q Profile can not be set')
            throw new AmazonQServiceNoProfileSupportError(
                `Connection type ${this.connectionType} does not support Developer Profiles feature.`
            )
        }

        if ((this.state === 'INITIALIZED' && this.activeIdcProfile) || this.state === 'PENDING_Q_PROFILE') {
            // Change status to pending to prevent API calls until profile is updated.
            // Because `listAvailableProfiles` below can take few seconds to complete,
            // there is possibility that client could send requests while profile is changing.
            this.state = 'PENDING_Q_PROFILE_UPDATE'
        }

        // Client sent an explicit null, indicating they want to reset the assigned profile (if any)
        if (newProfileArn === null) {
            this.logServiceState('Received null profile, resetting to PENDING_Q_PROFILE state')
            this.resetCodewhispererService()
            this.state = 'PENDING_Q_PROFILE'

            return
        }

        const parsedArn = parse(newProfileArn)
        const region = parsedArn.region
        const endpoint = AWS_Q_ENDPOINTS.get(region)
        if (!endpoint) {
            throw new Error('Requested profileArn region is not supported')
        }

        // Hack to inject a dummy profile name as it's not used by client IDE for now, if client IDE starts consuming name field then we should also pass both profile name and arn from the IDE
        // When service is ready to take more tps, revert https://github.com/aws/language-servers/pull/1329 to add profile validation
        const newProfile: AmazonQDeveloperProfile = {
            arn: newProfileArn,
            name: 'Client provided profile',
            identityDetails: {
                region: parsedArn.region,
            },
        }

        if (!newProfile || !newProfile.identityDetails?.region) {
            this.log(`Amazon Q Profile ${newProfileArn} is not valid`)
            this.resetCodewhispererService()
            this.state = 'PENDING_Q_PROFILE'

            throw new AmazonQServiceInvalidProfileError('Requested Amazon Q Profile does not exist')
        }

        this.handleTokenCancellationRequest(token)

        if (!this.activeIdcProfile) {
            this.activeIdcProfile = newProfile
            this.createCodewhispererServiceInstances('identityCenter', newProfile.identityDetails.region)
            this.state = 'INITIALIZED'
            this.log(
                `Initialized identityCenter connection to region ${newProfile.identityDetails.region} for profile ${newProfile.arn}`
            )

            return
        }

        // Profile didn't change
        if (this.activeIdcProfile && this.activeIdcProfile.arn === newProfile.arn) {
            // Update cached profile fields, keep existing client
            this.log(`Profile selection did not change, active profile is ${this.activeIdcProfile.arn}`)
            this.activeIdcProfile = newProfile
            this.state = 'INITIALIZED'

            return
        }

        this.handleTokenCancellationRequest(token)

        // At this point new valid profile is selected.

        const oldRegion = this.activeIdcProfile.identityDetails?.region
        const newRegion = newProfile.identityDetails.region
        if (oldRegion === newRegion) {
            this.log(`New profile is in the same region as old one, keeping exising service.`)
            this.log(`New active profile is ${this.activeIdcProfile.arn}, region ${oldRegion}`)
            this.activeIdcProfile = newProfile
            this.state = 'INITIALIZED'

            if (this.cachedCodewhispererService) {
                this.cachedCodewhispererService.profileArn = newProfile.arn
            }

            if (this.cachedStreamingClient) {
                this.cachedStreamingClient.profileArn = newProfile.arn
            }

            return
        }

        this.log(`Switching service client region from ${oldRegion} to ${newRegion}`)

        this.handleTokenCancellationRequest(token)

        // Selected new profile is in different region. Re-initialize service
        this.resetCodewhispererService()

        this.activeIdcProfile = newProfile

        this.createCodewhispererServiceInstances('identityCenter', newProfile.identityDetails.region)
        this.state = 'INITIALIZED'

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

    public getStreamingClient() {
        this.log('Getting instance of CodeWhispererStreaming client')

        // Trigger checks in token service
        const tokenService = this.getCodewhispererService()

        if (!tokenService || !this.region || !this.endpoint) {
            throw new AmazonQServiceNotInitializedError()
        }

        if (!this.cachedStreamingClient) {
            this.cachedStreamingClient = this.streamingClientFactory(this.region, this.endpoint)
        }

        return this.cachedStreamingClient
    }

    private resetCodewhispererService() {
        this.cachedCodewhispererService?.abortInflightRequests()
        this.cachedCodewhispererService = undefined
        this.cachedStreamingClient?.abortInflightRequests()
        this.cachedStreamingClient = undefined
        this.activeIdcProfile = undefined
        this.region = undefined
        this.endpoint = undefined
    }

    private createCodewhispererServiceInstances(
        connectionType: 'builderId' | 'identityCenter',
        clientOrProfileRegion?: string
    ) {
        this.logServiceState('Initializing CodewhispererService')

        const { region, endpoint } = getAmazonQRegionAndEndpoint(
            this.features.runtime,
            this.features.logging,
            clientOrProfileRegion
        )

        // Cache active region and endpoint selection
        this.connectionType = connectionType
        this.region = region
        this.endpoint = endpoint

        this.cachedCodewhispererService = this.serviceFactory(region, endpoint)
        this.log(`CodeWhispererToken service for connection type ${connectionType} was initialized, region=${region}`)

        this.cachedStreamingClient = this.streamingClientFactory(region, endpoint)
        this.log(`StreamingClient service for connection type ${connectionType} was initialized, region=${region}`)

        this.logServiceState('CodewhispererService and StreamingClient Initialization finished')
    }

    private getCustomUserAgent() {
        const initializeParams = this.features.lsp.getClientInitializeParams() || {}

        return getUserAgent(initializeParams as InitializeParams, this.features.runtime.serverInfo)
    }

    private serviceFactory(region: string, endpoint: string): CodeWhispererServiceToken {
        const service = new CodeWhispererServiceToken(
            this.features.credentialsProvider,
            this.features.workspace,
            this.features.logging,
            region,
            endpoint,
            this.features.sdkInitializator
        )

        const customUserAgent = this.getCustomUserAgent()
        service.updateClientConfig({
            customUserAgent: customUserAgent,
        })
        service.customizationArn = this.configurationCache.getProperty('customizationArn')
        service.profileArn = this.activeIdcProfile?.arn
        service.shareCodeWhispererContentWithAWS = this.configurationCache.getProperty(
            'shareCodeWhispererContentWithAWS'
        )

        this.log('Configured CodeWhispererServiceToken instance settings:')
        this.log(
            `customUserAgent=${customUserAgent}, customizationArn=${service.customizationArn}, shareCodeWhispererContentWithAWS=${service.shareCodeWhispererContentWithAWS}`
        )

        return service
    }

    private streamingClientFactory(region: string, endpoint: string): StreamingClientServiceToken {
        const streamingClient = new StreamingClientServiceToken(
            this.features.credentialsProvider,
            this.features.sdkInitializator,
            this.features.logging,
            region,
            endpoint,
            this.getCustomUserAgent()
        )
        streamingClient.profileArn = this.activeIdcProfile?.arn

        this.logging.debug(`Created streaming client instance region=${region}, endpoint=${endpoint}`)
        return streamingClient
    }

    private log(message: string): void {
        const prefix = 'Amazon Q Token Service Manager'
        this.logging?.log(`${prefix}: ${message}`)
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
        this.serviceFactory = factory.bind(this)
    }

    public getServiceFactory() {
        return this.serviceFactory
    }

    public getEnableDeveloperProfileSupport(): boolean {
        return this.enableDeveloperProfileSupport === undefined ? false : this.enableDeveloperProfileSupport
    }
}

export const initBaseTokenServiceManager = (features: QServiceManagerFeatures) =>
    AmazonQTokenServiceManager.initInstance(features)

export const getOrThrowBaseTokenServiceManager = (): AmazonQBaseServiceManager =>
    AmazonQTokenServiceManager.getInstance()
