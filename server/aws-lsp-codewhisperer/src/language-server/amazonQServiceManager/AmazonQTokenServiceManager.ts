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
    BearerCredentials,
    CredentialsType,
    InitializeParams,
} from '@aws/language-server-runtimes/server-interface'
import { DEFAULT_AWS_Q_ENDPOINT_URL, DEFAULT_AWS_Q_REGION, AWS_Q_ENDPOINTS } from '../../constants'
import { CodeWhispererServiceToken } from '../codeWhispererService'
import {
    AmazonQError,
    AmazonQServiceInitializationError,
    AmazonQServiceInvalidProfileError,
    AmazonQServiceNoProfileSupportError,
    AmazonQServiceNotInitializedError,
    AmazonQServicePendingProfileError,
    AmazonQServicePendingProfileUpdateError,
    AmazonQServicePendingSigninError,
} from './errors'
import { BaseAmazonQServiceManager } from './BaseAmazonQServiceManager'
import { Q_CONFIGURATION_SECTION } from '../configuration/qConfigurationServer'
import { textUtils } from '@aws/lsp-core'
import { CodeWhispererStreaming } from '@amzn/codewhisperer-streaming'
import { MISSING_BEARER_TOKEN_ERROR } from '../constants'
import { ConfiguredRetryStrategy } from '@aws-sdk/util-retry'
import {
    AmazonQDeveloperProfile,
    getListAllAvailableProfilesHandler,
    signalsAWSQDeveloperProfilesEnabled,
} from './qDeveloperProfiles'
import { getUserAgent } from '../utilities/telemetryUtils'
import { getBearerTokenFromProvider } from '../utils'

export interface Features {
    lsp: Lsp
    logging: Logging
    runtime: Runtime
    credentialsProvider: CredentialsProvider
    sdkInitializator: SDKInitializator
    workspace: Workspace
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
    private enableDeveloperProfileSupport?: boolean
    private configurationCache = new Map()
    private activeIdcProfile?: AmazonQDeveloperProfile
    private connectionType?: SsoConnectionType
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

    private constructor() {}

    public static getInstance(features: Features): AmazonQTokenServiceManager {
        if (!AmazonQTokenServiceManager.instance) {
            AmazonQTokenServiceManager.instance = new AmazonQTokenServiceManager()
            AmazonQTokenServiceManager.instance.initialize(features)
        }
        return AmazonQTokenServiceManager.instance
    }

    private initialize(features: Features): void {
        if (!features || !features.logging || !features.lsp) {
            throw new AmazonQServiceInitializationError(
                'Service features not initialized. Please ensure proper initialization.'
            )
        }

        this.features = features
        this.logging = features.logging

        if (!this.features.lsp.getClientInitializeParams()) {
            this.log('AmazonQTokenServiceManager initialized before LSP connection was initialized.')
            throw new AmazonQServiceInitializationError(
                'AmazonQTokenServiceManager initialized before LSP connection was initialized.'
            )
        }

        // Bind methods that are passed by reference to some handlers to maintain proper scope.
        this.serviceFactory = this.serviceFactory.bind(this)
        this.handleDidChangeConfiguration = this.handleDidChangeConfiguration.bind(this)

        this.log('Reading enableDeveloperProfileSupport setting from AWSInitializationOptions')
        if (this.features.lsp.getClientInitializeParams()?.initializationOptions?.aws) {
            const awsOptions = this.features.lsp.getClientInitializeParams()?.initializationOptions?.aws || {}
            this.enableDeveloperProfileSupport = signalsAWSQDeveloperProfilesEnabled(awsOptions)

            this.log(`Enabled Q Developer Profile support: ${this.enableDeveloperProfileSupport}`)
        }

        this.connectionType = 'none'
        this.state = 'PENDING_CONNECTION'

        this.setupAuthListener()
        this.setupConfigurationListeners()

        this.log('Manager instance is initialize')
    }

    private setupAuthListener(): void {
        this.features.credentialsProvider.onCredentialsDeleted((type: CredentialsType) => {
            this.log(`Received credentials delete event for type: ${type}`)
            if (type === 'iam') {
                return
            }
            this.resetCodewhispererService()
            this.connectionType = 'none'
            this.state = 'PENDING_CONNECTION'
        })
    }

    private setupConfigurationListeners(): void {
        // TODO: refactor how handleDidChangeConfiguration can be hooked to lsp Feature.
        // Currently can't do this, as it overrides handler set by Server, using ServiceManager.
        // this.features.lsp.onInitialized(this.handleDidChangeConfiguration)
        // this.features.lsp.didChangeConfiguration(this.handleDidChangeConfiguration)

        this.features.lsp.workspace.onUpdateConfiguration(
            async (params: UpdateConfigurationParams, _token: CancellationToken) => {
                try {
                    if (params.section === Q_CONFIGURATION_SECTION && params.settings.profileArn) {
                        this.log(`Profile update is requested for profile ${params.settings.profileArn}`)

                        await this.handleProfileChange(params.settings.profileArn)
                    }
                } catch (error) {
                    this.log('Error updating profiles: ' + error)
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
            this.log('No active SSO connection is detected, resetting the client')
            this.resetCodewhispererService()
            this.connectionType = 'none'
            this.state = 'PENDING_CONNECTION'

            return
        }

        // Connection type hasn't change.

        if (newConnectionType === this.connectionType) {
            this.log('Connection type did not change.')

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

    public async handleDidChangeConfiguration() {
        try {
            const qConfig = await this.features.lsp.workspace.getConfiguration(Q_CONFIGURATION_SECTION)
            if (qConfig) {
                // aws.q.customizationArn - selected customization
                const customizationArn = textUtils.undefinedIfEmpty(qConfig.customization)
                this.log(`Read configuration customizationArn=${customizationArn}`)
                this.configurationCache.set('customizationArn', customizationArn)

                // aws.q.optOutTelemetry - telemetry optout option
                const optOutTelemetryPreference = qConfig['optOutTelemetry'] === true ? 'OPTOUT' : 'OPTIN'
                this.log(`Read configuration optOutTelemetryPreference=${optOutTelemetryPreference}`)
                this.configurationCache.set('optOutTelemetryPreference', optOutTelemetryPreference)

                if (this.cachedCodewhispererService) {
                    this.log(`Using customization=${customizationArn}`)
                    this.cachedCodewhispererService.customizationArn = customizationArn
                }
            }

            const codeWhispererConfig = await this.features.lsp.workspace.getConfiguration('aws.codeWhisperer')
            if (codeWhispererConfig) {
                // aws.codeWhisperer.includeSuggestionsWithCodeReferences - return suggestions with code references
                const includeSuggestionsWithCodeReferences =
                    codeWhispererConfig['includeSuggestionsWithCodeReferences'] === true
                this.log(
                    `Read сonfiguration includeSuggestionsWithCodeReferences=${includeSuggestionsWithCodeReferences}`
                )
                this.configurationCache.set(
                    'includeSuggestionsWithCodeReferences',
                    includeSuggestionsWithCodeReferences
                )

                // aws.codeWhisperershareCodeWhispererContentWithAWS - share content with AWS
                const shareCodeWhispererContentWithAWS =
                    codeWhispererConfig['shareCodeWhispererContentWithAWS'] === true
                this.log(`Read configuration shareCodeWhispererContentWithAWS=${shareCodeWhispererContentWithAWS}`)
                this.configurationCache.set('shareCodeWhispererContentWithAWS', shareCodeWhispererContentWithAWS)

                if (this.cachedCodewhispererService) {
                    this.log(
                        'Update shareCodeWhispererContentWithAWS setting on cachedCodewhispererService to ' +
                            shareCodeWhispererContentWithAWS
                    )
                    this.cachedCodewhispererService.shareCodeWhispererContentWithAWS = shareCodeWhispererContentWithAWS
                }
            }
        } catch (error) {
            this.log(`Error in GetConfiguration: ${error}`)
        }
    }

    private async handleProfileChange(newProfileArn: string): Promise<void> {
        if (!this.enableDeveloperProfileSupport) {
            this.log('Developer Profiles Support is not enabled')
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

        if ((this.state === 'INITIALIZED' && this.activeIdcProfile) || this.state === 'PENDING_Q_PROFILE') {
            // Change status to pending to prevent API calls until profile is updated.
            // Because `listAvailableProfiles` below can take few seconds to complete,
            // there is possibility that client could send requests while profile is changing.
            this.state = 'PENDING_Q_PROFILE_UPDATE'
        }

        const profiles = await getListAllAvailableProfilesHandler(this.serviceFactory)({
            connectionType: 'identityCenter',
            logging: this.logging,
        })

        const newProfile = profiles.find(el => el.arn === newProfileArn)

        if (!newProfile || !newProfile.identityDetails?.region) {
            this.log(`Amazon Q Profile ${newProfileArn} is not valid`)
            this.resetCodewhispererService()
            this.state = 'PENDING_Q_PROFILE'

            throw new AmazonQServiceInvalidProfileError('Requested Amazon Q Profile does not exist')
        }

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

            return
        }

        this.log(`Switching service client region from ${oldRegion} to ${newRegion}`)

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

    public getStreamingClient(): CodeWhispererStreaming {
        this.log('Getting instance of CodeWhispererStreaming client')

        // Trigger checks in token service
        const tokenService = this.getCodewhispererService()

        if (!tokenService || !this.region || !this.endpoint) {
            throw new AmazonQServiceNotInitializedError()
        }

        return this.streamingClientFactory(this.region, this.endpoint)
    }

    private resetCodewhispererService() {
        this.cachedCodewhispererService?.abortInflightRequests()
        this.cachedCodewhispererService = undefined
        this.activeIdcProfile = undefined
    }

    private createCodewhispererServiceInstances(connectionType: 'builderId' | 'identityCenter', region?: string) {
        this.logServiceState('Initializing CodewhispererService')
        let awsQRegion = this.features.runtime.getConfiguration('AWS_Q_REGION') ?? DEFAULT_AWS_Q_REGION
        let awsQEndpoint: string | undefined =
            this.features.runtime.getConfiguration('AWS_Q_ENDPOINT_URL') ?? DEFAULT_AWS_Q_ENDPOINT_URL

        if (region) {
            awsQRegion = region
            // @ts-ignore
            awsQEndpoint = AWS_Q_ENDPOINTS[region]
        }

        if (!awsQEndpoint) {
            this.log(
                `Unable to determine endpoint (found: ${awsQEndpoint}) for region: ${awsQRegion}, falling back to default region and endpoint`
            )
            awsQRegion = DEFAULT_AWS_Q_REGION
            awsQEndpoint = DEFAULT_AWS_Q_ENDPOINT_URL
        }

        // Cache active region and endpoint selection
        this.connectionType = connectionType
        this.region = awsQRegion
        this.endpoint = awsQEndpoint

        this.cachedCodewhispererService = this.serviceFactory(awsQRegion, awsQEndpoint)

        this.log(
            `CodeWhispererToken service for connection type ${connectionType} was initialized, region=${awsQRegion}`
        )
        this.logServiceState('CodewhispererService Initialization finished')
    }

    private getCustomUserAgent() {
        const initializeParams = this.features.lsp.getClientInitializeParams() || {}

        return getUserAgent(initializeParams as InitializeParams, this.features.runtime.serverInfo)
    }

    private serviceFactory(region: string, endpoint: string): CodeWhispererServiceToken {
        const service = new CodeWhispererServiceToken(
            this.features.credentialsProvider,
            this.features.workspace,
            region,
            endpoint,
            this.features.sdkInitializator
        )

        const customUserAgent = this.getCustomUserAgent()
        service.updateClientConfig({
            customUserAgent: customUserAgent,
        })
        service.customizationArn = textUtils.undefinedIfEmpty(this.configurationCache.get('customizationArn'))
        service.profileArn = this.activeIdcProfile?.arn
        service.shareCodeWhispererContentWithAWS =
            this.configurationCache.get('shareCodeWhispererContentWithAWS') === true

        this.log('Configured CodeWhispererServiceToken instance settings:')
        this.log(
            `customUserAgent=${customUserAgent}, customizationArn=${service.customizationArn}, shareCodeWhispererContentWithAWS=${service.shareCodeWhispererContentWithAWS}`
        )

        return service
    }

    private streamingClientFactory(region: string, endpoint: string): CodeWhispererStreaming {
        const token = getBearerTokenFromProvider(this.features.credentialsProvider)

        // TODO: Follow-up with creating CodeWhispererStreaming client which supports inplace access to CredentialsProvider instead of caching static value.
        // Without this, we need more complex mechanism for managing token change state when caching streaming client.
        const streamingClient = this.features.sdkInitializator(CodeWhispererStreaming, {
            region,
            endpoint,
            token: { token: token },
            retryStrategy: new ConfiguredRetryStrategy(0, (attempt: number) => 500 + attempt ** 10),
            customUserAgent: this.getCustomUserAgent(),
        })
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
