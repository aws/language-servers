import {
    UpdateConfigurationParams,
    ResponseError,
    LSPErrorCodes,
    SsoConnectionType,
    CancellationToken,
    CredentialsType,
    CredentialsProvider,
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
import { ChatDatabase } from '../../language-server/agenticChat/tools/chatDb/chatDb'
import { ProfileStatusMonitor } from '../../language-server/agenticChat/tools/mcp/profileStatusMonitor'

const ATX_CONFIGURATION_SECTION = 'aws.atx'

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
    private regionChangeListeners: Array<(region: string) => void> = []

    // Separate profile tracking for ATX
    private activeAtxProfile?: AmazonQDeveloperProfile
    private state: 'PENDING_CONNECTION' | 'PENDING_Q_PROFILE' | 'PENDING_Q_PROFILE_UPDATE' | 'INITIALIZED' =
        'PENDING_CONNECTION'

    // @VisibleForTesting, please DO NOT use in production
    setState(state: 'PENDING_CONNECTION' | 'PENDING_Q_PROFILE' | 'PENDING_Q_PROFILE_UPDATE' | 'INITIALIZED') {
        this.state = state
    }

    endpointOverride(): string | undefined {
        return this.features.lsp.getClientInitializeParams()?.initializationOptions?.aws?.awsClientCapabilities
            ?.textDocument?.inlineCompletionWithReferences?.endpointOverride
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
            this.logging.log('AmazonQTokenServiceManager initialized before LSP connection was initialized.')
            throw new AmazonQServiceInitializationError(
                'AmazonQTokenServiceManager initialized before LSP connection was initialized.'
            )
        }

        // Bind methods that are passed by reference to some handlers to maintain proper scope.
        this.serviceFactory = this.serviceFactory.bind(this)
        this.streamingClientFactory = this.streamingClientFactory.bind(this)

        this.logging.log('Reading enableDeveloperProfileSupport setting from AWSInitializationOptions')
        if (this.features.lsp.getClientInitializeParams()?.initializationOptions?.aws) {
            const awsOptions = this.features.lsp.getClientInitializeParams()?.initializationOptions?.aws || {}
            this.enableDeveloperProfileSupport = signalsAWSQDeveloperProfilesEnabled(awsOptions)

            this.logging.log(`Enabled Q Developer Profile support: ${this.enableDeveloperProfileSupport}`)
        }

        this.connectionType = 'none'
        this.state = 'PENDING_CONNECTION'

        // Setup separate ATX credential handler
        this.setupAtxCredentialHandler()

        // Setup credential update logging and routing
        this.setupCredentialUpdateLogging()

        this.logging.log('Manager instance is initialize')
    }

    private setupAtxCredentialHandler(): void {
        this.logging.log('Setting up separate ATX credential handler')

        const originalProvider = this.features.credentialsProvider
        let alternateCredentials: any = undefined

        // Create intercepted provider for bearer support
        const interceptedProvider = {
            ...originalProvider,

            getCredentials: (type: CredentialsType) => {
                if (type === ('bearer' as any)) {
                    this.logging.log(`Getting ATX credentials: ${alternateCredentials ? 'found' : 'not found'}`)
                    return alternateCredentials
                }
                return originalProvider.getCredentials(type)
            },

            hasCredentials: (type: CredentialsType) => {
                if (type === ('bearer' as any)) {
                    return !!alternateCredentials
                }
                return originalProvider.hasCredentials(type)
            },
        }

        // Replace provider
        ;(this.features as any).credentialsProvider = interceptedProvider

        // ATX credentials now handled by existing aws/credentials/token/update handler with credential key routing
    }

    private async decodeCredentialsRequestToken(request: any): Promise<any> {
        // Simple passthrough for now - implement JWT decoding if needed
        return request.data
    }

    private setupCredentialUpdateLogging(): void {
        this.logging.log('Setting up credential update logging and ATX routing')

        // Intercept credential provider to save ATX credentials properly
        const originalCredentialsProvider = this.features.credentialsProvider

        // Create a wrapper that intercepts credential storage
        const credentialsWrapper = {
            ...originalCredentialsProvider,

            // Store original methods
            _originalGetCredentials: originalCredentialsProvider.getCredentials.bind(originalCredentialsProvider),
            _originalHasCredentials: originalCredentialsProvider.hasCredentials.bind(originalCredentialsProvider),

            // Custom credential storage for ATX
            _alternateCredentials: undefined as any,
            _qCredentials: undefined as any,

            getCredentials: (type: CredentialsType) => {
                if (type === ('bearer' as any)) {
                    this.logging.log(
                        `Getting bearer credentials: ${credentialsWrapper._alternateCredentials ? 'found' : 'not found'}`
                    )
                    return credentialsWrapper._alternateCredentials
                } else if (type === 'bearer') {
                    // Return Q credentials for bearer requests
                    this.logging.log(
                        `Getting Q bearer credentials: ${credentialsWrapper._qCredentials ? 'found' : 'not found'}`
                    )
                    return credentialsWrapper._qCredentials || credentialsWrapper._originalGetCredentials(type)
                }
                return credentialsWrapper._originalGetCredentials(type)
            },

            hasCredentials: (type: CredentialsType) => {
                if (type === ('bearer' as any)) {
                    const result = !!credentialsWrapper._alternateCredentials
                    this.logging.log(`Has bearer credentials: ${result}`)
                    return result
                } else if (type === 'bearer') {
                    const result =
                        !!credentialsWrapper._qCredentials || credentialsWrapper._originalHasCredentials(type)
                    this.logging.log(`Has Q bearer credentials: ${result}`)
                    return result
                }
                return credentialsWrapper._originalHasCredentials(type)
            },
        }

        // Replace the credentials provider
        ;(this.features as any).credentialsProvider = credentialsWrapper

        // Track the last profile update to determine if next credential update is for ATX
        let lastProfileUpdateWasAtx = false

        // Intercept profile updates to track ATX vs Q
        const originalHandleOnUpdateConfiguration = this.handleOnUpdateConfiguration.bind(this)
        this.handleOnUpdateConfiguration = async (params: any, token: any) => {
            if (params.section === 'aws.atx') {
                this.logging.log('ATX profile update detected - next credential update will be ATX')
                lastProfileUpdateWasAtx = true
            } else {
                this.logging.log('Q profile update detected - next credential update will be Q')
                lastProfileUpdateWasAtx = false
            }
            return originalHandleOnUpdateConfiguration(params, token)
        }

        // Try to intercept credential updates at the LSP connection level
        const connection = (this.features.lsp as any).connection
        if (connection && connection.onRequest) {
            this.logging.log('Found LSP connection, setting up request interceptors')

            // Intercept aws/credentials/token/update requests
            const originalOnRequest = connection.onRequest.bind(connection)
            connection.onRequest = (type: any, handler: any) => {
                if (typeof type === 'string' && type === 'aws/credentials/token/update') {
                    this.logging.log('Intercepting aws/credentials/token/update handler registration')
                    return originalOnRequest(type, (request: any) => {
                        this.logging.log(`aws/credentials/token/update called. ${JSON.stringify(request)}}`)
                        this.logging.log(
                            `aws/credentials/token/update called. Credential key: ${request.credentialkey || 'bearer'}`
                        )
                        this.logging.log(`Request data: ${JSON.stringify(request, null, 2)}`)

                        if (request.credentialkey === 'atx-bearer' && request.data && request.data.token) {
                            // This is an ATX credential update - store in bearer only
                            this.logging.log(
                                `Storing ATX credentials in atx-bearer: ${request.data.token.substring(0, 20)}...`
                            )
                            credentialsWrapper._alternateCredentials = request.data
                            lastProfileUpdateWasAtx = false // Reset flag
                            return // Don't call original handler to prevent overwriting bearer
                        } else if (request.data && request.data.token) {
                            // This is a Q credential update - store in bearer
                            this.logging.log(
                                `Storing Q credentials in bearer: ${request.data.token.substring(0, 20)}...`
                            )
                            credentialsWrapper._qCredentials = request.data
                            return handler(request) // Call original handler for Q credentials
                        }

                        return handler(request)
                    })
                } else if (type && type.method === 'aws/credentials/token/update') {
                    this.logging.log('Intercepting aws/credentials/token/update handler registration (typed)')
                    return originalOnRequest(type, (request: any) => {
                        this.logging.log(
                            `aws/credentials/token/update called (typed). Last profile update was ATX: ${lastProfileUpdateWasAtx}`
                        )

                        if (request.credentialkey === 'atx-bearer' && request.data && request.data.token) {
                            this.logging.log(
                                `Storing ATX credentials in atx-bearer: ${request.data.token.substring(0, 20)}...`
                            )
                            credentialsWrapper._alternateCredentials = request.data
                            lastProfileUpdateWasAtx = false
                            return
                        } else if (request.data && request.data.token) {
                            this.logging.log(
                                `Storing Q credentials in bearer: ${request.data.token.substring(0, 20)}...`
                            )
                            credentialsWrapper._qCredentials = request.data
                            return handler(request)
                        }

                        return handler(request)
                    })
                }
                return originalOnRequest(type, handler)
            }
        } else {
            this.logging.log('Could not find LSP connection for intercepting')
        }
    }

    public handleOnCredentialsDeleted(type: CredentialsType): void {
        this.logging.log(`Received credentials delete event for type: ${type}`)
        if (type === 'iam') {
            return
        }

        if (type === ('bearer' as CredentialsType)) {
            // Check if this is Q credentials or ATX credentials being deleted
            const hasQCredentials = this.features.credentialsProvider.hasCredentials('bearer' as CredentialsType)
            const atxCredentialsProvider = (this.features as any).auth?.getAtxCredentialsProvider?.()
            const hasAtxCredentials = atxCredentialsProvider?.hasCredentials('bearer')

            if (!hasQCredentials) {
                // Clear Q-specific state
                this.logging.log(`Clearing Q credentials and state`)
                ChatDatabase.clearModelCache()
                this.cancelActiveProfileChangeToken()
                this.resetCodewhispererService()
                this.connectionType = 'none'
                this.state = 'PENDING_CONNECTION'
                ProfileStatusMonitor.resetMcpState()
            }

            if (!hasAtxCredentials) {
                // Clear ATX-specific state
                this.logging.log(`Clearing ATX credentials and state`)
                this.cachedAtxCodewhispererService?.abortInflightRequests()
                this.cachedAtxCodewhispererService = undefined
                this.cachedAtxStreamingClient?.abortInflightRequests()
                this.cachedAtxStreamingClient = undefined
                this.activeAtxProfile = undefined
            }
        }
    }
    public handleOnCredentialsUpdated(type: CredentialsType): void {
        this.logging.log(`Received credentials update event for type: ${type}`)

        if (type === ('bearer' as CredentialsType)) {
            // Check both Q and ATX credentials
            const qCreds = this.features.credentialsProvider.getCredentials('bearer' as CredentialsType)
            if (qCreds && 'token' in qCreds && qCreds.token) {
                this.logging.log(`Q token updated: ${qCreds.token.substring(0, 20)}...`)
            }

            const atxCredentialsProvider = (this.features as any).auth?.getAtxCredentialsProvider?.()
            const atxCreds = atxCredentialsProvider?.getCredentials('bearer')
            if (atxCreds && 'token' in atxCreds && atxCreds.token) {
                this.logging.log(`ATX token updated: ${atxCreds.token.substring(0, 20)}...`)
            }
        }
    }

    public async handleOnUpdateConfiguration(params: UpdateConfigurationParams, _token: CancellationToken) {
        try {
            if (params.section === Q_CONFIGURATION_SECTION && params.settings.profileArn !== undefined) {
                const profileArn = params.settings.profileArn
                const region = params.settings.region

                if (!isStringOrNull(profileArn)) {
                    throw new Error('Expected params.settings.profileArn to be of either type string or null')
                }

                this.logging.log(`Profile update is requested for profile ${profileArn}`)
                this.cancelActiveProfileChangeToken()
                this.profileChangeTokenSource = new CancellationTokenSource()

                await this.handleProfileChange(profileArn, this.profileChangeTokenSource.token)
            } else if (params.section === ATX_CONFIGURATION_SECTION && params.settings.profileArn !== undefined) {
                const profileArn = params.settings.profileArn

                if (!isStringOrNull(profileArn)) {
                    throw new Error('Expected params.settings.profileArn to be of either type string or null')
                }

                this.logging.log(`ATX Profile update is requested for profile ${profileArn}`)
                await this.handleAtxProfileChange(profileArn, _token)
            }
        } catch (error) {
            this.logging.log('Error updating profiles: ' + error)
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

        const noCreds = !this.features.credentialsProvider.hasCredentials('bearer' as CredentialsType)
        const noConnectionType = newConnectionType === 'none'
        if (noCreds || noConnectionType) {
            // Connection was reset, wait for SSO connection token from client
            this.logging.log(
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

        const endpointOverride =
            this.features.lsp.getClientInitializeParams()?.initializationOptions?.aws?.awsClientCapabilities
                ?.textDocument?.inlineCompletionWithReferences?.endpointOverride

        // Connection type changed to 'builderId' | 'external_idp'
        // for now pretend External IdP is just a special case of Builder ID where the subscription has already been established
        // and user does not need a profile
        if (newConnectionType === 'builderId' || newConnectionType === 'external_idp') {
            this.logging.log(`Detected New connection type: ${newConnectionType}`)
            this.resetCodewhispererService()

            // For the builderId connection type regional endpoint discovery chain is:
            // region set by client -> runtime region -> default region
            const clientParams = this.features.lsp.getClientInitializeParams()

            this.createCodewhispererServiceInstances(
                newConnectionType,
                clientParams?.initializationOptions?.aws?.region,
                endpointOverride
            )
            this.state = 'INITIALIZED'
            this.logging.log(`Initialized Amazon Q service with ${newConnectionType} connection`)

            // Emit auth success event
            ProfileStatusMonitor.emitAuthSuccess()

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

            this.createCodewhispererServiceInstances('identityCenter', undefined, endpointOverride)
            this.state = 'INITIALIZED'
            this.logging.log('Initialized Amazon Q service with identityCenter connection')

            // Emit auth success event
            ProfileStatusMonitor.emitAuthSuccess()

            return
        }

        this.logServiceState('Unknown Connection state')
    }

    private handleAtxSsoConnectionChange() {
        const newConnectionType = this.features.credentialsProvider.getConnectionType()

        this.logServiceState('Validate State of ATX SSO Connection')

        // Use the new getAtxCredentialsProvider() from runtime
        const atxCredentialsProvider = (this.features as any).auth?.getAtxCredentialsProvider?.()
        const noCreds = !atxCredentialsProvider || !atxCredentialsProvider.hasCredentials('bearer')
        const noConnectionType = newConnectionType === 'none'
        if (noCreds || noConnectionType) {
            // ATX connection was reset
            this.logging.log(
                `No active ATX SSO connection is detected: no ${noCreds ? 'ATX credentials' : 'connection type'} provided. Resetting ATX services`
            )
            // Only reset ATX services, not Q services
            this.cachedAtxCodewhispererService?.abortInflightRequests()
            this.cachedAtxCodewhispererService = undefined
            this.cachedAtxStreamingClient?.abortInflightRequests()
            this.cachedAtxStreamingClient = undefined

            return
        }

        // ATX connection is valid
        this.logging.log('ATX SSO connection is valid')
    }
    private createAtxServiceInstances() {
        const { region, endpoint } = getAmazonQRegionAndEndpoint(
            this.features.runtime,
            this.features.logging,
            this.activeAtxProfile?.identityDetails?.region
        )

        this.cachedAtxCodewhispererService = this.serviceFactory(region, endpoint)
        this.cachedAtxCodewhispererService.profileArn = this.activeAtxProfile?.arn

        this.cachedAtxStreamingClient = this.atxStreamingClientFactory(region, endpoint)
        this.cachedAtxStreamingClient.profileArn = this.activeAtxProfile?.arn
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
            this.logging.log('Developer Profiles Support is not enabled')
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
                // During reauthentication, connection might be temporarily 'none' but user is providing a profile
                // Set connection type to identityCenter to proceed with profile setting
                this.connectionType = 'identityCenter'
                this.state = 'PENDING_Q_PROFILE_UPDATE'
            } else {
                this.logServiceState('Received null profile while not connected, ignoring request')
                return
            }
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
            this.logging.log(`Amazon Q Profile ${newProfileArn} is not valid`)
            this.resetCodewhispererService()
            this.state = 'PENDING_Q_PROFILE'

            throw new AmazonQServiceInvalidProfileError('Requested Amazon Q Profile does not exist')
        }

        this.handleTokenCancellationRequest(token)

        if (!this.activeIdcProfile) {
            this.activeIdcProfile = newProfile
            this.createCodewhispererServiceInstances(
                'identityCenter',
                newProfile.identityDetails.region,
                this.endpointOverride()
            )
            this.state = 'INITIALIZED'
            this.logging.log(
                `Initialized identityCenter connection to region ${newProfile.identityDetails.region} for profile ${newProfile.arn}`
            )

            // Emit auth success event
            ProfileStatusMonitor.emitAuthSuccess()

            return
        }

        // Profile didn't change
        if (this.activeIdcProfile && this.activeIdcProfile.arn === newProfile.arn) {
            // Update cached profile fields, keep existing client
            this.logging.log(`Profile selection did not change, active profile is ${this.activeIdcProfile.arn}`)
            this.activeIdcProfile = newProfile
            this.state = 'INITIALIZED'

            // Emit auth success event
            ProfileStatusMonitor.emitAuthSuccess()

            return
        }

        this.handleTokenCancellationRequest(token)

        // At this point new valid profile is selected.

        const oldRegion = this.activeIdcProfile.identityDetails?.region
        const newRegion = newProfile.identityDetails.region
        if (oldRegion === newRegion) {
            this.logging.log(`New profile is in the same region as old one, keeping exising service.`)
            this.activeIdcProfile = newProfile
            this.state = 'INITIALIZED'
            this.logging.log(`New active profile is ${this.activeIdcProfile.arn}, region ${newRegion}`)

            if (this.cachedCodewhispererService) {
                this.cachedCodewhispererService.profileArn = newProfile.arn
            }

            if (this.cachedStreamingClient) {
                this.cachedStreamingClient.profileArn = newProfile.arn
            }

            // Emit auth success event
            ProfileStatusMonitor.emitAuthSuccess()

            return
        }

        this.logging.log(`Switching service client region from ${oldRegion} to ${newRegion}`)
        this.notifyRegionChangeListeners(newRegion)

        this.handleTokenCancellationRequest(token)

        // Selected new profile is in different region. Re-initialize service
        this.resetCodewhispererService()

        this.activeIdcProfile = newProfile

        this.createCodewhispererServiceInstances(
            'identityCenter',
            newProfile.identityDetails.region,
            this.endpointOverride()
        )
        this.state = 'INITIALIZED'

        // Emit auth success event
        ProfileStatusMonitor.emitAuthSuccess()

        return
    }
    public async handleAtxProfileChange(profileArn: string | null, token: CancellationToken): Promise<void> {
        this.logging.log(`ATX Profile update is requested for profile ${profileArn}`)

        if (profileArn === null) {
            // Clear ATX profile
            if (this.cachedAtxCodewhispererService) {
                this.cachedAtxCodewhispererService.profileArn = undefined
            }
            if (this.cachedAtxStreamingClient) {
                this.cachedAtxStreamingClient.profileArn = undefined
            }
            this.logging.log('ATX profile cleared')
            return
        }

        // Set ATX profile
        const parsedArn = parse(profileArn)
        const region = parsedArn.region
        const endpoint = AWS_Q_ENDPOINTS.get(region)
        if (!endpoint) {
            throw new Error('Requested profileArn region is not supported')
        }

        // Create ATX profile object
        const newProfile: AmazonQDeveloperProfile = {
            arn: profileArn,
            name: 'ATX Client provided profile',
            identityDetails: {
                region: parsedArn.region,
            },
        }

        if (this.cachedAtxCodewhispererService) {
            this.cachedAtxCodewhispererService.profileArn = newProfile.arn
        }

        if (this.cachedAtxStreamingClient) {
            this.cachedAtxStreamingClient.profileArn = newProfile.arn
        }

        this.logging.log(`ATX profile updated to: ${newProfile.arn}`)

        // Log credential storage status
        setTimeout(() => {
            const hasBearerAtx = this.features.credentialsProvider.hasCredentials('bearer' as any)
            const hasBearer = this.features.credentialsProvider.hasCredentials('bearer' as CredentialsType)
            this.logging.log(`credential check: bearer=${hasBearerAtx}, bearer=${hasBearer}`)

            if (hasBearerAtx) {
                const atxCreds = this.features.credentialsProvider.getCredentials('bearer' as any)
                if (atxCreds && 'token' in atxCreds && atxCreds.token) {
                    this.logging.log(`Found ATX credentials in bearer: ${atxCreds.token.substring(0, 20)}...`)
                }
            }

            if (hasBearer) {
                const bearerCreds = this.features.credentialsProvider.getCredentials('bearer' as CredentialsType)
                if (bearerCreds && 'token' in bearerCreds && bearerCreds.token) {
                    this.logging.log(`Found credentials in bearer: ${bearerCreds.token.substring(0, 20)}...`)
                }
            }
        }, 200)
    }
    public getCodewhispererService(): CodeWhispererServiceToken {
        // Prevent initiating requests while profile change is in progress.
        if (this.state === 'PENDING_Q_PROFILE_UPDATE') {
            throw new AmazonQServicePendingProfileUpdateError()
        }
        // Explicitly check for Q-specific bearer credentials
        if (!this.features.credentialsProvider.hasCredentials('bearer' as CredentialsType)) {
            throw new AmazonQServicePendingSigninError()
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
    public getAtxCodewhispererService(): CodeWhispererServiceToken {
        this.handleAtxSsoConnectionChange()

        // Use the new getAtxCredentialsProvider() from runtime
        const atxCredentialsProvider = (this.features as any).auth?.getAtxCredentialsProvider?.()
        if (!atxCredentialsProvider || !atxCredentialsProvider.hasCredentials('bearer')) {
            throw new AmazonQServicePendingSigninError()
        }

        if (!this.cachedAtxCodewhispererService) {
            this.createAtxServiceInstances()
        }

        return this.cachedAtxCodewhispererService!
    }

    public getStreamingClient() {
        this.logging.log('Getting instance of CodeWhispererStreaming client')

        // Trigger checks in token service
        const tokenService = this.getCodewhispererService()

        // Use Q-specific region/endpoint from active profile
        const { region, endpoint } = getAmazonQRegionAndEndpoint(
            this.features.runtime,
            this.features.logging,
            this.activeIdcProfile?.identityDetails?.region
        )

        if (!tokenService || !region || !endpoint) {
            throw new AmazonQServiceNotInitializedError()
        }

        if (!this.cachedStreamingClient) {
            this.cachedStreamingClient = this.streamingClientFactory(region, endpoint)
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
        connectionType: Exclude<SsoConnectionType, 'none'>,
        clientOrProfileRegion: string | undefined,
        endpointOverride: string | undefined
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

        if (endpointOverride) {
            this.endpoint = endpointOverride
        }

        this.cachedCodewhispererService = this.serviceFactory(region, this.endpoint)
        this.logging.log(
            `CodeWhispererToken service for connection type ${connectionType} was initialized, region=${region}`
        )

        this.cachedStreamingClient = this.streamingClientFactory(region, this.endpoint)
        this.logging.log(
            `StreamingClient service for connection type ${connectionType} was initialized, region=${region}`
        )

        // Initialize separate ATX service instances
        this.cachedAtxCodewhispererService = this.serviceFactory(region, this.endpoint)
        this.logging.log(
            `ATX CodeWhispererToken service for connection type ${connectionType} was initialized, region=${region}`
        )

        this.cachedAtxStreamingClient = this.atxStreamingClientFactory(region, this.endpoint)
        this.logging.log(
            `ATX StreamingClient service for connection type ${connectionType} was initialized, region=${region}`
        )

        this.logServiceState('CodewhispererService and StreamingClient Initialization finished')
    }

    private getCustomUserAgent() {
        const initializeParams = this.features.lsp.getClientInitializeParams() || {}

        return getUserAgent(initializeParams as InitializeParams, this.features.runtime.serverInfo)
    }

    private serviceFactory(region: string, endpoint: string): CodeWhispererServiceToken {
        const customUserAgent = this.getCustomUserAgent()
        const service = new CodeWhispererServiceToken(
            this.features.credentialsProvider,
            this.features.workspace,
            this.features.logging,
            region,
            endpoint,
            this.features.sdkInitializator,
            customUserAgent
        )

        service.customizationArn = this.configurationCache.getProperty('customizationArn')
        service.profileArn = this.activeIdcProfile?.arn
        service.shareCodeWhispererContentWithAWS = this.configurationCache.getProperty(
            'shareCodeWhispererContentWithAWS'
        )

        this.logging.log('Configured CodeWhispererServiceToken instance settings:')
        this.logging.log(
            `customUserAgent=${customUserAgent}, customizationArn=${service.customizationArn}, shareCodeWhispererContentWithAWS=${service.shareCodeWhispererContentWithAWS}`
        )

        return service
    }
    private streamingClientFactory(region: string, endpoint: string): StreamingClientServiceToken {
        // Ensure Q streaming client uses only 'bearer' credentials
        this.logging.log('Creating Q-specific credentials provider for streaming client')
        const qCredentialsProvider = {
            hasCredentials: (type: CredentialsType) => {
                this.logging.log(`Q credentials provider: checking hasCredentials for type ${type}`)
                return this.features.credentialsProvider.hasCredentials(type)
            },
            getConnectionType: () => this.features.credentialsProvider.getConnectionType(),
            getCredentials: (type: CredentialsType) => {
                const creds = this.features.credentialsProvider.getCredentials(type)
                this.logging.log(
                    `Q credentials provider: getCredentials for ${type}, token present: ${creds && 'token' in creds && !!creds.token}`
                )
                if (creds && 'token' in creds && creds.token) {
                    this.logging.log(`Q using token: ${creds.token.substring(0, 20)}...`)
                }
                return creds
            },
        } as CredentialsProvider

        const streamingClient = new StreamingClientServiceToken(
            qCredentialsProvider,
            this.features.sdkInitializator,
            this.features.logging,
            region,
            endpoint,
            this.getCustomUserAgent()
        )
        streamingClient.profileArn = this.activeIdcProfile?.arn
        streamingClient.shareCodeWhispererContentWithAWS = this.configurationCache.getProperty(
            'shareCodeWhispererContentWithAWS'
        )

        this.logging.debug(`Created streaming client instance region=${region}, endpoint=${endpoint}`)
        return streamingClient
    }

    private atxStreamingClientFactory(region: string, endpoint: string): StreamingClientServiceToken {
        this.logging.log('Creating ATX streaming client using runtime getAtxCredentialsProvider v2.0')

        // Use the new getAtxCredentialsProvider() from runtime
        const atxCredentialsProvider = (this.features as any).auth?.getAtxCredentialsProvider?.()
        if (!atxCredentialsProvider) {
            throw new Error('ATX credentials provider not available from runtime')
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
        streamingClient.shareCodeWhispererContentWithAWS = this.configurationCache.getProperty(
            'shareCodeWhispererContentWithAWS'
        )

        this.logging.debug(`Created ATX streaming client instance region=${region}, endpoint=${endpoint}`)
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

    public override getActiveProfileArn() {
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

    /**
     * Registers a listener that will be called when the region changes
     * @param listener Function that will be called with the new region
     * @returns Function to unregister the listener
     */
    public override onRegionChange(listener: (region: string) => void): () => void {
        this.regionChangeListeners.push(listener)
        // If we already have a region, notify the listener immediately
        if (this.region) {
            try {
                listener(this.region)
            } catch (error) {
                this.logging.error(`Error in region change listener: ${error}`)
            }
        }
        return () => {
            this.regionChangeListeners = this.regionChangeListeners.filter(l => l !== listener)
        }
    }

    private notifyRegionChangeListeners(region: string): void {
        this.logging.debug(
            `Notifying ${this.regionChangeListeners.length} region change listeners of region: ${region}`
        )
        this.regionChangeListeners.forEach(listener => {
            try {
                listener(region)
            } catch (error) {
                this.logging.error(`Error in region change listener: ${error}`)
            }
        })
    }

    public getRegion(): string | undefined {
        return this.region
    }
}

export const initBaseTokenServiceManager = (features: QServiceManagerFeatures) =>
    AmazonQTokenServiceManager.initInstance(features)

export const getOrThrowBaseTokenServiceManager = (): AmazonQBaseServiceManager =>
    AmazonQTokenServiceManager.getInstance()
