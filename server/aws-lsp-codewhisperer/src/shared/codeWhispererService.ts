import {
    BearerCredentials,
    CredentialsProvider,
    CredentialsType,
    Workspace,
    Logging,
    SDKInitializator,
    CancellationToken,
    CancellationTokenSource,
} from '@aws/language-server-runtimes/server-interface'
import { waitUntil } from '@aws/lsp-core/out/util/timeoutUtils'
import { AWSError, ConfigurationOptions, CredentialProviderChain, Credentials } from 'aws-sdk'
import { PromiseResult } from 'aws-sdk/lib/request'
import { Request } from 'aws-sdk/lib/core'
import { v4 as uuidv4 } from 'uuid'
import {
    CodeWhispererSigv4ClientConfigurationOptions,
    createCodeWhispererSigv4Client,
} from '../client/sigv4/codewhisperer'
import {
    CodeWhispererTokenClientConfigurationOptions,
    createCodeWhispererTokenClient,
    RequestExtras,
} from '../client/token/codewhisperer'

// Define our own Suggestion interface to wrap the differences between Token and IAM Client
export interface Suggestion extends CodeWhispererTokenClient.Completion, CodeWhispererSigv4Client.Recommendation {
    itemId: string
}

export interface GenerateSuggestionsRequest
    extends CodeWhispererTokenClient.GenerateCompletionsRequest,
        CodeWhispererSigv4Client.GenerateRecommendationsRequest {
    maxResults: number
}

export type FileContext = GenerateSuggestionsRequest['fileContext']

export interface ResponseContext {
    requestId: string
    codewhispererSessionId: string
    nextToken?: string
}

export interface GenerateSuggestionsResponse {
    suggestions: Suggestion[]
    responseContext: ResponseContext
}

import CodeWhispererSigv4Client = require('../client/sigv4/codewhisperersigv4client')
import CodeWhispererTokenClient = require('../client/token/codewhispererbearertokenclient')
import { getErrorId } from './utils'

// Right now the only difference between the token client and the IAM client for codewhsiperer is the difference in function name
// This abstract class can grow in the future to account for any additional changes across the clients
export abstract class CodeWhispererServiceBase {
    protected readonly codeWhispererRegion
    protected readonly codeWhispererEndpoint
    public shareCodeWhispererContentWithAWS = false
    public customizationArn?: string
    public profileArn?: string
    abstract client: CodeWhispererSigv4Client | CodeWhispererTokenClient

    inflightRequests: Set<AWS.Request<any, AWSError> & RequestExtras> = new Set()

    abortInflightRequests() {
        this.inflightRequests.forEach(request => {
            request.abort()
        })
        this.inflightRequests.clear()
    }

    trackRequest(request: AWS.Request<any, AWSError> & RequestExtras) {
        this.inflightRequests.add(request)
    }

    completeRequest(request: AWS.Request<any, AWSError> & RequestExtras) {
        this.inflightRequests.delete(request)
    }

    abstract getCredentialsType(): CredentialsType

    abstract generateSuggestions(request: GenerateSuggestionsRequest): Promise<GenerateSuggestionsResponse>

    constructor(codeWhispererRegion: string, codeWhispererEndpoint: string) {
        this.codeWhispererRegion = codeWhispererRegion
        this.codeWhispererEndpoint = codeWhispererEndpoint
    }

    /**
     * Updates Service Client options after client was instantiated.
     */
    public updateClientConfig(options: ConfigurationOptions) {
        this.client.config.update(options)
    }

    generateItemId = () => uuidv4()
}

export class CodeWhispererServiceIAM extends CodeWhispererServiceBase {
    client: CodeWhispererSigv4Client
    constructor(
        credentialsProvider: CredentialsProvider,
        workspace: Workspace,
        logging: Logging,
        codeWhispererRegion: string,
        codeWhispererEndpoint: string,
        sdkInitializator: SDKInitializator
    ) {
        super(codeWhispererRegion, codeWhispererEndpoint)
        const options: CodeWhispererSigv4ClientConfigurationOptions = {
            region: this.codeWhispererRegion,
            endpoint: this.codeWhispererEndpoint,
            credentialProvider: new CredentialProviderChain([
                () => credentialsProvider.getCredentials('iam') as Credentials,
            ]),
        }
        this.client = createCodeWhispererSigv4Client(options, sdkInitializator, logging)
        // Avoid overwriting any existing client listeners
        const clientRequestListeners = this.client.setupRequestListeners
        this.client.setupRequestListeners = (request: Request<unknown, AWSError>) => {
            if (clientRequestListeners) {
                clientRequestListeners.call(this.client, request)
            }
            request.httpRequest.headers['x-amzn-codewhisperer-optout'] = `${!this.shareCodeWhispererContentWithAWS}`
        }
    }

    getCredentialsType(): CredentialsType {
        return 'iam'
    }

    async generateSuggestions(request: GenerateSuggestionsRequest): Promise<GenerateSuggestionsResponse> {
        // add cancellation check
        // add error check
        if (this.customizationArn) request = { ...request, customizationArn: this.customizationArn }

        const response = await this.client.generateRecommendations(request).promise()
        const responseContext = {
            requestId: response?.$response?.requestId,
            codewhispererSessionId: response?.$response?.httpResponse?.headers['x-amzn-sessionid'],
            nextToken: response.nextToken,
        }

        for (const recommendation of response?.recommendations ?? []) {
            Object.assign(recommendation, { itemId: this.generateItemId() })
        }

        return {
            suggestions: response.recommendations as Suggestion[],
            responseContext,
        }
    }
}

/**
 * Hint: to get an instance of this: `AmazonQTokenServiceManager.getInstance().getCodewhispererService()`
 */
export class CodeWhispererServiceToken extends CodeWhispererServiceBase {
    client: CodeWhispererTokenClient
    /** Debounce createSubscriptionToken by storing the current, pending promise (if any). */
    #createSubscriptionTokenPromise?: Promise<CodeWhispererTokenClient.CreateSubscriptionTokenResponse>
    /** If user clicks "Upgrade" multiple times, cancel the previous wait-promise. */
    #waitUntilSubscriptionCancelSource?: CancellationTokenSource

    constructor(
        private credentialsProvider: CredentialsProvider,
        workspace: Workspace,
        private logging: Logging,
        codeWhispererRegion: string,
        codeWhispererEndpoint: string,
        sdkInitializator: SDKInitializator
    ) {
        super(codeWhispererRegion, codeWhispererEndpoint)
        const options: CodeWhispererTokenClientConfigurationOptions = {
            region: this.codeWhispererRegion,
            endpoint: this.codeWhispererEndpoint,
            onRequestSetup: [
                req => {
                    logging.debug(`CodeWhispererServiceToken: req=${req.operation}`)
                    this.trackRequest(req)
                    req.on('build', async ({ httpRequest }) => {
                        try {
                            const creds = credentialsProvider.getCredentials('bearer') as BearerCredentials
                            if (!creds?.token) {
                                throw new Error('Authorization failed, bearer token is not set')
                            }
                            httpRequest.headers['Authorization'] = `Bearer ${creds.token}`
                            httpRequest.headers['x-amzn-codewhisperer-optout'] =
                                `${!this.shareCodeWhispererContentWithAWS}`
                        } catch (err) {
                            this.completeRequest(req)
                            throw err
                        }
                    })
                    req.on('complete', () => {
                        this.completeRequest(req)
                    })
                    req.on('error', () => {
                        this.completeRequest(req)
                    })
                },
            ],
        }
        this.client = createCodeWhispererTokenClient(options, sdkInitializator, logging)
    }

    getCredentialsType(): CredentialsType {
        return 'bearer'
    }

    private withProfileArn<T extends object>(request: T): T {
        if (!this.profileArn) return request

        return { ...request, profileArn: this.profileArn }
    }

    async generateSuggestions(request: GenerateSuggestionsRequest): Promise<GenerateSuggestionsResponse> {
        // add cancellation check
        // add error check
        if (this.customizationArn) request.customizationArn = this.customizationArn

        const response = await this.client.generateCompletions(this.withProfileArn(request)).promise()
        const responseContext = {
            requestId: response?.$response?.requestId,
            codewhispererSessionId: response?.$response?.httpResponse?.headers['x-amzn-sessionid'],
            nextToken: response.nextToken,
        }

        for (const recommendation of response?.completions ?? []) {
            Object.assign(recommendation, { itemId: this.generateItemId() })
        }

        return {
            suggestions: response.completions as Suggestion[],
            responseContext,
        }
    }
    public async codeModernizerCreateUploadUrl(
        request: CodeWhispererTokenClient.CreateUploadUrlRequest
    ): Promise<CodeWhispererTokenClient.CreateUploadUrlResponse> {
        return this.client.createUploadUrl(this.withProfileArn(request)).promise()
    }
    /**
     * @description Use this function to start the transformation job.
     * @param request
     * @returns transformationJobId - String id for the Job
     */

    public async codeModernizerStartCodeTransformation(
        request: CodeWhispererTokenClient.StartTransformationRequest
    ): Promise<PromiseResult<CodeWhispererTokenClient.StartTransformationResponse, AWSError>> {
        return await this.client.startTransformation(this.withProfileArn(request)).promise()
    }

    /**
     * @description Use this function to stop the transformation job.
     * @param request
     * @returns transformationJobId - String id for the Job
     */
    public async codeModernizerStopCodeTransformation(
        request: CodeWhispererTokenClient.StopTransformationRequest
    ): Promise<PromiseResult<CodeWhispererTokenClient.StopTransformationResponse, AWSError>> {
        return await this.client.stopTransformation(this.withProfileArn(request)).promise()
    }

    /**
     * @description Use this function to get the status of the code transformation. We should
     * be polling this function periodically to get updated results. When this function
     * returns COMPLETED we know the transformation is done.
     */
    public async codeModernizerGetCodeTransformation(
        request: CodeWhispererTokenClient.GetTransformationRequest
    ): Promise<PromiseResult<CodeWhispererTokenClient.GetTransformationResponse, AWSError>> {
        return await this.client.getTransformation(this.withProfileArn(request)).promise()
    }

    /**
     * @description After starting a transformation use this function to display the LLM
     * transformation plan to the user.
     * @params tranformationJobId - String id returned from StartCodeTransformationResponse
     */
    public async codeModernizerGetCodeTransformationPlan(
        request: CodeWhispererTokenClient.GetTransformationPlanRequest
    ): Promise<PromiseResult<CodeWhispererTokenClient.GetTransformationPlanResponse, AWSError>> {
        return this.client.getTransformationPlan(this.withProfileArn(request)).promise()
    }

    /**
     * @description get a pre-signed url to upload source code into S3 bucket
     */
    async createUploadUrl(
        request: CodeWhispererTokenClient.CreateUploadUrlRequest
    ): Promise<PromiseResult<CodeWhispererTokenClient.CreateUploadUrlResponse, AWSError>> {
        return this.client.createUploadUrl(this.withProfileArn(request)).promise()
    }

    /**
     * @description Once source code uploaded to S3, send a request to run security scan on uploaded source code.
     */
    async startCodeAnalysis(
        request: CodeWhispererTokenClient.StartCodeAnalysisRequest
    ): Promise<PromiseResult<CodeWhispererTokenClient.StartCodeAnalysisResponse, AWSError>> {
        return this.client.startCodeAnalysis(this.withProfileArn(request)).promise()
    }

    /**
     * @description Send a request to get the code scan status detail.
     */
    async getCodeAnalysis(
        request: CodeWhispererTokenClient.GetCodeAnalysisRequest
    ): Promise<PromiseResult<CodeWhispererTokenClient.GetCodeAnalysisResponse, AWSError>> {
        return this.client.getCodeAnalysis(this.withProfileArn(request)).promise()
    }

    /**
     * @description Once scan completed successfully, send a request to get list of all the findings for the given scan.
     */
    async listCodeAnalysisFindings(
        request: CodeWhispererTokenClient.ListCodeAnalysisFindingsRequest
    ): Promise<PromiseResult<CodeWhispererTokenClient.ListCodeAnalysisFindingsResponse, AWSError>> {
        return this.client.listCodeAnalysisFindings(this.withProfileArn(request)).promise()
    }

    /**
     * @description Get list of available customizations
     */
    async listAvailableCustomizations(request: CodeWhispererTokenClient.ListAvailableCustomizationsRequest) {
        return this.client.listAvailableCustomizations(this.withProfileArn(request)).promise()
    }

    /**
     * @description Get list of available profiles
     */
    async listAvailableProfiles(request: CodeWhispererTokenClient.ListAvailableProfilesRequest) {
        return this.client.listAvailableProfiles(request).promise()
    }

    /**
     * @description send telemetry event to code whisperer data warehouse
     */
    async sendTelemetryEvent(request: CodeWhispererTokenClient.SendTelemetryEventRequest) {
        return this.client.sendTelemetryEvent(this.withProfileArn(request)).promise()
    }

    /**
     * @description create a remote workspace
     */
    async createWorkspace(request: CodeWhispererTokenClient.CreateWorkspaceRequest) {
        return this.client.createWorkspace(this.withProfileArn(request)).promise()
    }

    /**
     * @description get list of workspace metadata
     */
    async listWorkspaceMetadata(request: CodeWhispererTokenClient.ListWorkspaceMetadataRequest) {
        return this.client.listWorkspaceMetadata(this.withProfileArn(request)).promise()
    }

    /**
     * @description delete the remote workspace
     */
    async deleteWorkspace(request: CodeWhispererTokenClient.DeleteWorkspaceRequest) {
        return this.client.deleteWorkspace(this.withProfileArn(request)).promise()
    }

    /*
     * @description get the list of feature evaluations
     */
    async listFeatureEvaluations(request: CodeWhispererTokenClient.ListFeatureEvaluationsRequest) {
        return this.client.listFeatureEvaluations(this.withProfileArn(request)).promise()
    }

    /**
     * (debounced by default)
     *
     * cool api you have there 🥹
     */
    async createSubscriptionToken(request: CodeWhispererTokenClient.CreateSubscriptionTokenRequest) {
        // Debounce.
        if (this.#createSubscriptionTokenPromise) {
            return this.#createSubscriptionTokenPromise
        }

        this.#createSubscriptionTokenPromise = (async () => {
            try {
                const r = await this.client.createSubscriptionToken(this.withProfileArn(request)).promise()
                if (!r.encodedVerificationUrl) {
                    this.logging.error(`setpaidtier
    request: ${JSON.stringify(request)}
    response: ${JSON.stringify(r as any)}
    requestId: ${(r as any).$response?.requestId}
    httpStatusCode: ${(r as any).$response?.httpResponse?.statusCode}
    headers: ${JSON.stringify((r as any).$response?.httpResponse?.headers)}`)
                }
                return r
            } finally {
                this.#createSubscriptionTokenPromise = undefined
            }
        })()

        return this.#createSubscriptionTokenPromise
    }

    /**
     * Gets the Subscription status of the given user.
     *
     * @param statusOnly use this if you don't need the encodedVerificationUrl, else a ConflictException is treated as "ACTIVE"
     */
    async getSubscriptionStatus(
        statusOnly?: boolean
    ): Promise<{ status: 'active' | 'active-expiring' | 'none'; encodedVerificationUrl?: string }> {
        // NOTE: The subscription API behaves in a non-intuitive way.
        // https://github.com/aws/amazon-q-developer-cli-autocomplete/blob/86edd86a338b549b5192de67c9fdef240e6014b7/crates/chat-cli/src/cli/chat/mod.rs#L4079-L4102
        //
        // If statusOnly=true, the service only returns "ACTIVE" and "INACTIVE".
        // If statusOnly=false, the following spec applies:
        //
        // 1. "ACTIVE" => 'active-expiring':
        //    - Active but cancelled. User *has* a subscription, but set to *not auto-renew* (i.e., cancelled).
        // 2. "INACTIVE" => 'none':
        //    - User has no subscription at all (no Pro access).
        // 3. ConflictException => 'active':
        //    - User has an active subscription *with auto-renewal enabled*.
        //
        // Also, it is currently not possible to subscribe or re-subscribe via console, only IDE/CLI.
        try {
            const r = await this.createSubscriptionToken({
                statusOnly: !!statusOnly,
                // clientToken: this.credentialsProvider.getCredentials('bearer').token,
            })
            const status = r.status === 'ACTIVE' ? 'active-expiring' : 'none'

            return {
                status: status,
                encodedVerificationUrl: r.encodedVerificationUrl,
            }
        } catch (e) {
            if (getErrorId(e as Error) === 'ConflictException') {
                return {
                    status: 'active',
                }
            }

            throw e
        }
    }

    /**
     * Polls the service until subscription status changes to "ACTIVE".
     *
     * Returns true on success, or false on timeout/cancellation.
     */
    async waitUntilSubscriptionActive(cancelToken?: CancellationToken): Promise<boolean> {
        // If user clicks "Upgrade" multiple times, cancel any pending waitUntil().
        if (this.#waitUntilSubscriptionCancelSource) {
            this.#waitUntilSubscriptionCancelSource.cancel()
            this.#waitUntilSubscriptionCancelSource.dispose()
        }

        this.#waitUntilSubscriptionCancelSource = new CancellationTokenSource()

        // Combine the external cancelToken (if provided) with our internal one.
        const combinedToken = cancelToken
            ? {
                  isCancellationRequested: () =>
                      cancelToken.isCancellationRequested ||
                      this.#waitUntilSubscriptionCancelSource!.token.isCancellationRequested,
              }
            : this.#waitUntilSubscriptionCancelSource.token

        const r = await waitUntil(
            async () => {
                if (combinedToken.isCancellationRequested) {
                    this.logging.info('waitUntilSubscriptionActive: cancelled')
                    return false
                }
                const s = await this.getSubscriptionStatus(true)
                this.logging.info(`waitUntilSubscriptionActive: ${s.status}`)
                if (s.status !== 'none') {
                    return true
                }
            },
            {
                timeout: 60 * 60 * 1000, // 1 hour
                interval: 2000,
                truthy: true,
            }
        ).finally(() => {
            this.#waitUntilSubscriptionCancelSource?.dispose()
            this.#waitUntilSubscriptionCancelSource = undefined
        })

        return !!r
    }
}
