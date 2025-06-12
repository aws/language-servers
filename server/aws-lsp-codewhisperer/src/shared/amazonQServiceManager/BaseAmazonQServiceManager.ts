import {
    CancellationToken,
    CancellationTokenSource,
    CredentialsProvider,
    CredentialsType,
    InitializeParams,
    Logging,
    Lsp,
    LSPErrorCodes,
    ResponseError,
    Runtime,
    SDKInitializator,
    SsoConnectionType,
    UpdateConfigurationParams,
    Workspace,
} from '@aws/language-server-runtimes/server-interface'
import { CodeWhispererServiceBase } from '../codeWhispererService'
import {
    AmazonQConfigurationCache,
    AmazonQWorkspaceConfig,
    getAmazonQRegionAndEndpoint,
    getAmazonQRelatedWorkspaceConfigs,
} from './configurationUtils'
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
import { StreamingClientServiceBase } from '../streamingClientService'
import { AmazonQDeveloperProfile, signalsAWSQDeveloperProfilesEnabled } from './qDeveloperProfiles'
import { getUserAgent } from '../telemetryUtils'
import { AWS_Q_ENDPOINTS, Q_CONFIGURATION_SECTION } from '../constants'
import { isStringOrNull } from '../utils'
import { parse } from '@aws-sdk/util-arn-parser'

export interface QServiceManagerFeatures {
    lsp: Lsp
    logging: Logging
    runtime: Runtime
    credentialsProvider: CredentialsProvider
    sdkInitializator: SDKInitializator
    workspace: Workspace
}

export const CONFIGURATION_CHANGE_IN_PROGRESS_MSG = 'handleDidChangeConfiguration already in progress, exiting.'
type DidChangeConfigurationListener = (updatedConfig: AmazonQWorkspaceConfig) => void | Promise<void>

/**
 * BaseAmazonQServiceManager is a base abstract class that can be generically extended
 * to manage a centralized CodeWhispererService that extends CodeWhispererServiceBase and
 * a centralized StreamingClientService that extends StreamingClientServiceBase.
 *
 * It implements `handleDidChangeConfiguration` which is intended to be passed to the LSP server's
 * `didChangeConfiguration` and `onInitialized` handlers in the AmazonQServiceServer. Servers **should
 * not call this method directly** and can instead listen to  the completion of these configuration
 * updates by attaching a listener that handles the updated configuration as needed. The base class also
 * triggers the `updateCachedServiceConfig` method, updating the cached CodeWhisperer service if defined.
 *
 * @example
 *
 * ```ts
 * const listener = (updateConfig: AmazonQWorkspaceConfig) => { ... }
 * await serviceManager.addDidChangeConfigurationListener(listener)
 * // service manager attached and called the listener once to provide current config
 * await serviceManager.handleDidChangeConfiguration()
 * // configuration is updated and listener invoked with updatedConfig
 * ```
 *
 * Concrete implementations can define reponses to the `UpdateConfiguration` request and the on
 * credentials deleted event produced by the runtime's CredentialsProvider through the respective
 * abstract methods `handleOnUpdateConfiguration` and `handleOnCredentialsDeleted`. These handlers
 * are then wired accordingly in the `AmazonQServiceServer`. **Dependent servers should not call
 * these handlers directly**.
 *
 * @remarks
 *
 * 1. `BaseAmazonQServiceManager` is intended to be extended as a singleton which should only be
 * initialized in the corresponding `AmazonQServiceServer`. Other servers should not attempt to
 * initialize any concrete implementation of this class.
 *
 * 2. For testing, be aware that if other server's unit tests depend on the (LSP) handling defined by
 *  this class and provided through `AmazonQServiceServer`, the responses from this class (such as
 * `handleDidChangeConfiguration`) have to be manually triggered in your mock routines.
 *
 */
// use resolve

export class BaseAmazonQServiceManager {
    private static instance: BaseAmazonQServiceManager | null = null

    protected features!: QServiceManagerFeatures
    protected configurationCache = new AmazonQConfigurationCache()
    protected cachedCodewhispererService?: CodeWhispererServiceBase
    protected cachedStreamingClient?: StreamingClientServiceBase

    private handleDidChangeConfigurationListeners = new Set<DidChangeConfigurationListener>()
    private isConfigChangeInProgress = false

    // Token service specific properties
    private enableDeveloperProfileSupport?: boolean
    private activeIdcProfile?: AmazonQDeveloperProfile
    private connectionType?: SsoConnectionType
    private profileChangeTokenSource?: CancellationTokenSource | undefined
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

    protected constructor(features: QServiceManagerFeatures) {
        if (!features || !features.logging || !features.lsp) {
            throw new AmazonQServiceInitializationError(
                'Service features not initialized. Please ensure proper initialization.'
            )
        }

        this.features = features

        this.features.logging.debug('BaseAmazonQServiceManager functionality initialized')

        // if (this.features.credentialsProvider.getCredentialsType() === 'bearer') {
        //     this.initializeToken()
        // } else if (this.features.credentialsProvider.getCredentialsType() === 'iam') {
        //     this.initializeIam()
        // } else {
        //     throw new Error('Unknown credentials type abc')
        // }
    }

    public getCredentialsType(): CredentialsType {
        return this.features.credentialsProvider.getCredentialsType()
    }

    public static initInstance(features: QServiceManagerFeatures): BaseAmazonQServiceManager {
        if (!BaseAmazonQServiceManager.instance) {
            BaseAmazonQServiceManager.instance = new BaseAmazonQServiceManager(features)
            BaseAmazonQServiceManager.instance.initialize()

            return BaseAmazonQServiceManager.instance
        }

        throw new AmazonQServiceAlreadyInitializedError()
    }

    public static getInstance(): BaseAmazonQServiceManager {
        if (!BaseAmazonQServiceManager.instance) {
            throw new AmazonQServiceInitializationError(
                'Amazon Q service has not been initialized yet. Make sure the Amazon Q server is present and properly initialized.'
            )
        }

        return BaseAmazonQServiceManager.instance
    }

    private initialize(): void {
        // Check if LSP connection is initialized
        if (!this.features.lsp.getClientInitializeParams()) {
            this.features.logging.log('AmazonQTokenServiceManager initialized before LSP connection was initialized.')
            throw new AmazonQServiceInitializationError(
                'AmazonQTokenServiceManager initialized before LSP connection was initialized.'
            )
        }

        // Bind methods that are passed by reference to some handlers to maintain proper scope.
        this.serviceFactory = this.serviceFactory.bind(this)

        this.features.logging.log('Reading enableDeveloperProfileSupport setting from AWSInitializationOptions')
        if (this.features.lsp.getClientInitializeParams()?.initializationOptions?.aws) {
            const awsOptions = this.features.lsp.getClientInitializeParams()?.initializationOptions?.aws || {}
            this.enableDeveloperProfileSupport = signalsAWSQDeveloperProfilesEnabled(awsOptions)

            this.features.logging.log(`Enabled Q Developer Profile support: ${this.enableDeveloperProfileSupport}`)
        }

        // Initialize Amazon Q connection parameters
        const amazonQRegionAndEndpoint = getAmazonQRegionAndEndpoint(this.features.runtime, this.features.logging)
        this.region = amazonQRegionAndEndpoint.region
        this.endpoint = amazonQRegionAndEndpoint.endpoint

        // Initialize connection state
        this.connectionType = 'none'
        this.state = 'PENDING_CONNECTION'

        this.features.logging.log('Amazon Q service manager instance is initialized')
    }

    // private initializeToken(): void {
    //     if (!this.features.lsp.getClientInitializeParams()) {
    //         this.features.logging.log('BaseAmazonQServiceManager initialized before LSP connection was initialized.')
    //         throw new AmazonQServiceInitializationError(
    //             'BaseAmazonQServiceManager initialized before LSP connection was initialized.'
    //         )
    //     }

    //     this.features.logging.log('Reading enableDeveloperProfileSupport setting from AWSInitializationOptions')
    //     if (this.features.lsp.getClientInitializeParams()?.initializationOptions?.aws) {
    //         const awsOptions = this.features.lsp.getClientInitializeParams()?.initializationOptions?.aws || {}
    //         this.enableDeveloperProfileSupport = signalsAWSQDeveloperProfilesEnabled(awsOptions)

    //         this.features.logging.log(`Enabled Q Developer Profile support: ${this.enableDeveloperProfileSupport}`)
    //     }

    //     this.connectionType = 'none'
    //     this.state = 'PENDING_CONNECTION'

    //     this.features.logging.log('Token service manager instance is initialize')
    // }

    // private initializeIam(): void {
    //     const amazonQRegionAndEndpoint = getAmazonQRegionAndEndpoint(this.features.runtime, this.features.logging)
    //     this.region = amazonQRegionAndEndpoint.region
    //     this.endpoint = amazonQRegionAndEndpoint.endpoint

    //     this.features.logging.log('IAM service manager instance is initialize')
    // }

    public getCodewhispererService(): CodeWhispererServiceBase {
        if (this.getCredentialsType() == 'bearer') {
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
        } else if (this.getCredentialsType() == 'iam') {
            if (!this.cachedCodewhispererService) {
                this.cachedCodewhispererService = new CodeWhispererServiceBase(
                    this.features.credentialsProvider,
                    this.features.workspace,
                    this.features.logging,
                    this.features.sdkInitializator,
                    this.region,
                    this.endpoint
                )

                this.updateCachedServiceConfig()
            }
            return this.cachedCodewhispererService
        } else {
            throw new Error('Unknown credentials type')
        }
    }

    public getStreamingClient(): StreamingClientServiceBase {
        this.features.logging.log('Getting instance of CodeWhispererStreaming client')

        // Trigger checks in token service
        const CWService = this.getCodewhispererService()

        if (!CWService || !this.region || !this.endpoint) {
            throw new AmazonQServiceNotInitializedError()
        }

        // Note: check after refactoring StreamingClientServiceBase
        if (!this.cachedStreamingClient) {
            this.cachedStreamingClient = new StreamingClientServiceBase(
                this.features.credentialsProvider,
                this.features.sdkInitializator,
                this.features.logging,
                this.region,
                this.endpoint
            )
        }

        return this.cachedStreamingClient
    }

    public getConfiguration(): Readonly<AmazonQWorkspaceConfig> {
        return this.configurationCache.getConfig()
    }

    public async addDidChangeConfigurationListener(listener: DidChangeConfigurationListener) {
        this.handleDidChangeConfigurationListeners.add(listener)

        // invoke the listener once at attachment to bring them up-to-date
        const currentConfig = this.getConfiguration()
        await listener(currentConfig)

        this.features.logging.log('Attached new listener and notified of current config.')
    }

    public removeDidChangeConfigurationListener(listener: DidChangeConfigurationListener) {
        this.handleDidChangeConfigurationListeners.delete(listener)
    }

    // TODO: check if IAM credentials needs deletion
    public handleOnCredentialsDeleted(): void {
        if (this.getCredentialsType() === 'bearer' || this.getCredentialsType() === 'iam') {
            this.cancelActiveProfileChangeToken()
            this.resetCodewhispererService()
            this.connectionType = 'none'
            this.state = 'PENDING_CONNECTION'
        } else {
            throw new Error('Unknown credentials type')
        }
    }

    public async handleOnUpdateConfiguration(
        params: UpdateConfigurationParams,
        token: CancellationToken
    ): Promise<void> {
        if (this.getCredentialsType() === 'bearer') {
            await this.handleTokenUpdateConfiguration(params, token)
        } else if (this.getCredentialsType() === 'iam') {
            await this.handleIamUpdateConfiguration(params, token)
        }
    }

    public async handleTokenUpdateConfiguration(params: UpdateConfigurationParams, _token: CancellationToken) {
        try {
            if (params.section === Q_CONFIGURATION_SECTION && params.settings.profileArn !== undefined) {
                const profileArn = params.settings.profileArn
                const region = params.settings.region

                if (!isStringOrNull(profileArn)) {
                    throw new Error('Expected params.settings.profileArn to be of either type string or null')
                }

                this.features.logging.log(`Profile update is requested for profile ${profileArn}`)
                this.cancelActiveProfileChangeToken()
                this.profileChangeTokenSource = new CancellationTokenSource()

                await this.handleProfileChange(profileArn, this.profileChangeTokenSource.token)
            }
        } catch (error) {
            this.features.logging.log('Error updating profiles: ' + error)
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

    public async handleIamUpdateConfiguration(params: UpdateConfigurationParams, _token: CancellationToken) {
        return Promise.resolve()
    }

    public async handleDidChangeConfiguration(): Promise<void> {
        if (this.isConfigChangeInProgress) {
            this.features.logging.debug(CONFIGURATION_CHANGE_IN_PROGRESS_MSG)
            return
        }

        try {
            this.isConfigChangeInProgress = true
            const amazonQConfig = await getAmazonQRelatedWorkspaceConfigs(this.features.lsp, this.features.logging)
            this.configurationCache.updateConfig(amazonQConfig)

            this.updateCachedServiceConfig()

            await this.notifyDidChangeConfigurationListeners()
        } catch (error) {
            this.features.logging.error(`Unexpected error in getAmazonQRelatedWorkspaceConfigs: ${error}`)
        } finally {
            this.isConfigChangeInProgress = false
        }
    }

    protected updateCachedServiceConfig(): void {
        if (this.cachedCodewhispererService) {
            const customizationArn = this.configurationCache.getProperty('customizationArn')
            this.features.logging.debug(`Using customization=${customizationArn}`)
            this.cachedCodewhispererService.customizationArn = customizationArn

            const shareCodeWhispererContentWithAWS = this.configurationCache.getProperty(
                'shareCodeWhispererContentWithAWS'
            )
            this.features.logging.debug(
                'Update shareCodeWhispererContentWithAWS setting on cachedCodewhispererService to ' +
                    shareCodeWhispererContentWithAWS
            )
            this.cachedCodewhispererService.shareCodeWhispererContentWithAWS = shareCodeWhispererContentWithAWS
        }
    }

    private async notifyDidChangeConfigurationListeners(): Promise<void> {
        this.features.logging.debug('Notifying did change configuration listeners')

        const updatedConfig = this.configurationCache.getConfig()
        const listenPromises = Array.from(this.handleDidChangeConfigurationListeners, async listener => {
            try {
                await listener(updatedConfig)
            } catch (error) {
                this.features.logging.error(`Error occured in did change configuration listener: ${error}`)
            }
        })

        await Promise.allSettled(listenPromises)
    }

    private cancelActiveProfileChangeToken() {
        this.profileChangeTokenSource?.cancel()
        this.profileChangeTokenSource?.dispose()
        this.profileChangeTokenSource = undefined
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

    /**
     * Validate if Bearer Token Connection type has changed mid-session.
     * When connection type change is detected: reinitialize CodeWhispererService class with current connection type.
     */
    private handleSsoConnectionChange() {
        const newConnectionType = this.features.credentialsProvider.getConnectionType()

        this.features.logging.log('Validate State of SSO Connection')

        const noCreds = !this.features.credentialsProvider.hasCredentials()
        const noConnectionType = newConnectionType === 'none'
        if (noCreds || noConnectionType) {
            // Connection was reset, wait for SSO connection token from client
            this.features.logging.log(
                `No active SSO connection is detected: no ${noCreds ? 'credentials' : 'connection type'} provided. Resetting the client`
            )
            this.resetCodewhispererService()
            this.connectionType = 'none'
            this.state = 'PENDING_CONNECTION'

            return
        }

        // Connection type hasn't change.

        if (newConnectionType === this.connectionType) {
            this.features.logging.debug(`Connection type did not change: ${this.connectionType}`)

            return
        }

        // Connection type changed to 'builderId'

        if (newConnectionType === 'builderId') {
            this.features.logging.log('Detected New connection type: builderId')
            this.resetCodewhispererService()

            // For the builderId connection type regional endpoint discovery chain is:
            // region set by client -> runtime region -> default region
            const clientParams = this.features.lsp.getClientInitializeParams()

            this.createCodewhispererServiceInstances('builderId', clientParams?.initializationOptions?.aws?.region)
            this.state = 'INITIALIZED'
            this.features.logging.log('Initialized Amazon Q service with builderId connection')

            return
        }

        // Connection type changed to 'identityCenter'

        if (newConnectionType === 'identityCenter') {
            this.features.logging.log('Detected New connection type: identityCenter')

            this.resetCodewhispererService()

            if (this.enableDeveloperProfileSupport) {
                this.connectionType = 'identityCenter'
                this.state = 'PENDING_Q_PROFILE'
                this.features.logging.log('Pending profile selection for IDC connection')

                return
            }

            this.createCodewhispererServiceInstances('identityCenter')
            this.state = 'INITIALIZED'
            this.features.logging.log('Initialized Amazon Q service with identityCenter connection')

            return
        }

        this.features.logging.log('Unknown Connection state')
    }

    private createCodewhispererServiceInstances(
        connectionType: 'builderId' | 'identityCenter',
        clientOrProfileRegion?: string
    ) {
        this.features.logging.log('Initializing CodewhispererService')

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
        this.features.logging.log(
            `CodeWhispererToken service for connection type ${connectionType} was initialized, region=${region}`
        )

        this.cachedStreamingClient = this.streamingClientFactory(region, endpoint)
        this.features.logging.log(
            `StreamingClient service for connection type ${connectionType} was initialized, region=${region}`
        )

        this.features.logging.log('CodewhispererService and StreamingClient Initialization finished')
    }

    private getCustomUserAgent() {
        const initializeParams = this.features.lsp.getClientInitializeParams() || {}

        return getUserAgent(initializeParams as InitializeParams, this.features.runtime.serverInfo)
    }

    private serviceFactory(region: string, endpoint: string): CodeWhispererServiceBase {
        const service = new CodeWhispererServiceBase(
            this.features.credentialsProvider,
            this.features.workspace,
            this.features.logging,
            this.features.sdkInitializator,
            region,
            endpoint
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

        this.features.logging.log('Configured CodeWhispererServiceToken instance settings:')
        this.features.logging.log(
            `customUserAgent=${customUserAgent}, customizationArn=${service.customizationArn}, shareCodeWhispererContentWithAWS=${service.shareCodeWhispererContentWithAWS}`
        )

        return service
    }

    private streamingClientFactory(region: string, endpoint: string): StreamingClientServiceBase {
        const streamingClient = new StreamingClientServiceBase(
            this.features.credentialsProvider,
            this.features.sdkInitializator,
            this.features.logging,
            region,
            endpoint,
            this.getCustomUserAgent()
        )
        streamingClient.profileArn = this.activeIdcProfile?.arn

        this.features.logging.debug(`Created streaming client instance region=${region}, endpoint=${endpoint}`)
        return streamingClient
    }

    // For Token  Unit Tests
    public static resetInstance(): void {
        BaseAmazonQServiceManager.instance = null
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

    public setServiceFactory(factory: (region: string, endpoint: string) => CodeWhispererServiceBase) {
        this.serviceFactory = factory.bind(this)
    }

    public getServiceFactory() {
        return this.serviceFactory
    }

    public getEnableDeveloperProfileSupport(): boolean {
        return this.enableDeveloperProfileSupport === undefined ? false : this.enableDeveloperProfileSupport
    }

    private handleTokenCancellationRequest(token: CancellationToken) {
        if (token.isCancellationRequested) {
            this.features.logging.log('Handling CancellationToken cancellation request')
            throw new AmazonQServiceProfileUpdateCancelled('Requested profile update got cancelled')
        }
    }

    private async handleProfileChange(newProfileArn: string | null, token: CancellationToken): Promise<void> {
        if (!this.enableDeveloperProfileSupport) {
            this.features.logging.log('Developer Profiles Support is not enabled')
            return
        }

        if (typeof newProfileArn === 'string' && newProfileArn.length === 0) {
            throw new Error('Received invalid Profile ARN (empty string)')
        }

        this.features.logging.log('UpdateProfile is requested')

        // Test if connection type changed
        this.handleSsoConnectionChange()

        if (this.connectionType === 'none') {
            if (newProfileArn !== null) {
                throw new AmazonQServicePendingSigninError()
            }

            this.features.logging.log('Received null profile while not connected, ignoring request')
            return
        }

        if (this.connectionType !== 'identityCenter') {
            this.features.logging.log('Q Profile can not be set')
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
            this.features.logging.log('Received null profile, resetting to PENDING_Q_PROFILE state')
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
            this.features.logging.log(`Amazon Q Profile ${newProfileArn} is not valid`)
            this.resetCodewhispererService()
            this.state = 'PENDING_Q_PROFILE'

            throw new AmazonQServiceInvalidProfileError('Requested Amazon Q Profile does not exist')
        }

        this.handleTokenCancellationRequest(token)

        if (!this.activeIdcProfile) {
            this.activeIdcProfile = newProfile
            this.createCodewhispererServiceInstances('identityCenter', newProfile.identityDetails.region)
            this.state = 'INITIALIZED'
            this.features.logging.log(
                `Initialized identityCenter connection to region ${newProfile.identityDetails.region} for profile ${newProfile.arn}`
            )

            return
        }

        // Profile didn't change
        if (this.activeIdcProfile && this.activeIdcProfile.arn === newProfile.arn) {
            // Update cached profile fields, keep existing client
            this.features.logging.log(
                `Profile selection did not change, active profile is ${this.activeIdcProfile.arn}`
            )
            this.activeIdcProfile = newProfile
            this.state = 'INITIALIZED'

            return
        }

        this.handleTokenCancellationRequest(token)

        // At this point new valid profile is selected.

        const oldRegion = this.activeIdcProfile.identityDetails?.region
        const newRegion = newProfile.identityDetails.region
        if (oldRegion === newRegion) {
            this.features.logging.log(`New profile is in the same region as old one, keeping exising service.`)
            this.features.logging.log(`New active profile is ${this.activeIdcProfile.arn}, region ${oldRegion}`)
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

        this.features.logging.log(`Switching service client region from ${oldRegion} to ${newRegion}`)

        this.handleTokenCancellationRequest(token)

        // Selected new profile is in different region. Re-initialize service
        this.resetCodewhispererService()

        this.activeIdcProfile = newProfile

        this.createCodewhispererServiceInstances('identityCenter', newProfile.identityDetails.region)
        this.state = 'INITIALIZED'

        return
    }
}

export const initBaseServiceManager = (features: QServiceManagerFeatures) =>
    BaseAmazonQServiceManager.initInstance(features)

export const getOrThrowBaseServiceManager = (): BaseAmazonQServiceManager => BaseAmazonQServiceManager.getInstance()
