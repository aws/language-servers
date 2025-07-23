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
import CodeWhispererSigv4Client = require('../client/sigv4/codewhisperersigv4client')
import CodeWhispererTokenClient = require('../client/token/codewhispererbearertokenclient')
import { getErrorId } from './utils'
import { GenerateCompletionsResponse } from '../client/token/codewhispererbearertokenclient'

export interface Suggestion extends CodeWhispererTokenClient.Completion, CodeWhispererSigv4Client.Recommendation {
    itemId: string
}

export interface GenerateSuggestionsRequest extends CodeWhispererTokenClient.GenerateCompletionsRequest {
    // TODO : This is broken due to Interface 'GenerateSuggestionsRequest' cannot simultaneously extend types 'GenerateCompletionsRequest' and 'GenerateRecommendationsRequest'.
    //CodeWhispererSigv4Client.GenerateRecommendationsRequest {
    maxResults: number
}

export type FileContext = GenerateSuggestionsRequest['fileContext']

export interface ResponseContext {
    requestId: string
    codewhispererSessionId: string
    nextToken?: string
}

export enum SuggestionType {
    EDIT = 'EDIT',
    COMPLETION = 'COMPLETION',
}

export interface GenerateSuggestionsResponse {
    suggestions: Suggestion[]
    suggestionType?: SuggestionType
    responseContext: ResponseContext
}

type CodeWhispererClient = CodeWhispererSigv4Client | CodeWhispererTokenClient
type CodeWhispererConfigurationOptions =
    | CodeWhispererSigv4ClientConfigurationOptions
    | CodeWhispererTokenClientConfigurationOptions

// Right now the only difference between the token client and the IAM client for codewhsiperer is the difference in function name
// This abstract class can grow in the future to account for any additional changes across the clients
export abstract class CodeWhispererServiceBase {
    protected readonly codeWhispererRegion
    protected readonly codeWhispererEndpoint
    public shareCodeWhispererContentWithAWS = false
    public customizationArn?: string
    public profileArn?: string
    abstract client: CodeWhispererClient

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

    async getSubscriptionStatus(
        statusOnly?: boolean
    ): Promise<{ status: 'active' | 'active-expiring' | 'none'; encodedVerificationUrl?: string }> {
        // No-op/default implementation: assume no subscription
        return {
            status: 'none',
        }
    }

    async waitUntilSubscriptionActive(_cancelToken?: CancellationToken): Promise<boolean> {
        // No-op: base class doesn't support subscription polling
        return false
    }
}

/**
 * Hint: to get an instance of this: `AmazonQServiceManager.getInstance().getCodewhispererService()`
 */
export class CodeWhispererService extends CodeWhispererServiceBase {
    client: CodeWhispererClient
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
        const options = this.CreateCodeWhispererConfigurationOptions()
        this.client = this.createAppropriateClient(credentialsProvider, options, sdkInitializator, logging)
    }

    private CreateCodeWhispererConfigurationOptions(): CodeWhispererConfigurationOptions {
        if (this.credentialsProvider.hasCredentials('iam')) {
            const credentials = this.credentialsProvider.getCredentials('iam') as Credentials
            const options: CodeWhispererSigv4ClientConfigurationOptions = {
                region: this.codeWhispererRegion,
                endpoint: this.codeWhispererEndpoint,
                credentials: {
                    accessKeyId: credentials.accessKeyId,
                    secretAccessKey: credentials.secretAccessKey,
                    sessionToken: credentials.sessionToken,
                },
            }
            return options
        } else {
            const options: CodeWhispererTokenClientConfigurationOptions = {
                region: this.codeWhispererRegion,
                endpoint: this.codeWhispererEndpoint,
                onRequestSetup: [
                    req => {
                        this.logging.debug(`CodeWhispererService: req=${req.operation}`)
                        this.trackRequest(req)
                        req.on('build', async ({ httpRequest }) => {
                            try {
                                const creds = this.credentialsProvider.getCredentials('bearer') as BearerCredentials
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
                        req.on('complete', response => {
                            const requestStartTime = req.startTime?.getTime() || 0
                            const requestEndTime = new Date().getTime()
                            const latency = requestStartTime > 0 ? requestEndTime - requestStartTime : 0

                            const requestBody = req.httpRequest.body ? JSON.parse(String(req.httpRequest.body)) : {}
                            this.completeRequest(req)
                        })
                        req.on('error', async (error, response) => {
                            const requestStartTime = req.startTime?.getTime() || 0
                            const requestEndTime = new Date().getTime()
                            const latency = requestStartTime > 0 ? requestEndTime - requestStartTime : 0

                            const requestBody = req.httpRequest.body ? JSON.parse(String(req.httpRequest.body)) : {}
                            this.completeRequest(req)
                        })
                        req.on('error', () => {
                            this.completeRequest(req)
                        })
                        req.on('error', () => {
                            this.completeRequest(req)
                        })
                    },
                ],
            }
            return options
        }
    }

    private createAppropriateClient(
        credentialsProvider: CredentialsProvider,
        options: CodeWhispererTokenClientConfigurationOptions,
        sdkInitializator: SDKInitializator,
        logging: Logging
    ): CodeWhispererClient {
        if (credentialsProvider.hasCredentials('iam')) {
            const client = createCodeWhispererSigv4Client(options, sdkInitializator, logging)
            const clientRequestListeners = client.setupRequestListeners
            client.setupRequestListeners = (request: Request<unknown, AWSError>) => {
                if (clientRequestListeners) {
                    clientRequestListeners.call(this.client, request)
                }
                request.httpRequest.headers['x-amzn-codewhisperer-optout'] = `${!this.shareCodeWhispererContentWithAWS}`
            }
            return client
        } else {
            return createCodeWhispererTokenClient(options, sdkInitializator, logging)
        }
    }

    getCredentialsType(): CredentialsType {
        if (this.credentialsProvider.hasCredentials('iam')) {
            return 'iam'
        } else {
            return 'bearer'
        }
    }

    private withProfileArn<T extends object>(request: T): T {
        if (!this.profileArn) return request

        return { ...request, profileArn: this.profileArn }
    }

    async generateSuggestions(request: GenerateSuggestionsRequest): Promise<GenerateSuggestionsResponse> {
        // add cancellation check
        // add error check
        if (this.customizationArn) request.customizationArn = this.customizationArn

        if (this.getCredentialsType() === 'bearer') {
            const tokenClient = this.client as CodeWhispererTokenClient
            const response = await tokenClient.generateCompletions(this.withProfileArn(request)).promise()
            this.logging.info(
                `GenerateCompletion response: 
        "requestId": ${response.$response.requestId},
        "responseCompletionCount": ${response.completions?.length ?? 0},
        "responsePredictionCount": ${response.predictions?.length ?? 0},
        "suggestionType": ${request.predictionTypes?.toString() ?? ''},
        "filename": ${request.fileContext.filename},
        "language": ${request.fileContext.programmingLanguage.languageName},
        "supplementalContextLength": ${request.supplementalContexts?.length ?? 0},
        "request.nextToken": ${request.nextToken},
        "response.nextToken": ${response.nextToken}`
            )

            const responseContext = {
                requestId: response?.$response?.requestId,
                codewhispererSessionId: response?.$response?.httpResponse?.headers['x-amzn-sessionid'],
                nextToken: response.nextToken,
            }
            return this.mapCodeWhispererApiResponseToSuggestion(response, responseContext)
        } else if (this.getCredentialsType() === 'iam') {
            const sigv4Client = this.client as CodeWhispererSigv4Client
            const response = await sigv4Client.generateRecommendations(request).promise()
            const responseContext = {
                requestId: response?.$response?.requestId,
                codewhispererSessionId: response?.$response?.httpResponse?.headers['x-amzn-sessionid'],
                nextToken: response.nextToken,
            }
            // TODO: figure out why mapCodeWhispererApiResponseToSuggestion does not work with GenerateRecommendationsResponse
            for (const recommendation of response?.recommendations ?? []) {
                Object.assign(recommendation, { itemId: this.generateItemId() })
            }

            return {
                suggestions: response.recommendations as Suggestion[],
                responseContext,
            }
        } else {
            throw new Error('invalid credentialsType for generateSuggestions')
        }
    }

    private mapCodeWhispererApiResponseToSuggestion(
        apiResponse: GenerateCompletionsResponse,
        responseContext: ResponseContext
    ): GenerateSuggestionsResponse {
        if (apiResponse?.predictions && apiResponse.predictions.length > 0) {
            const suggestionType = apiResponse.predictions[0].edit ? SuggestionType.EDIT : SuggestionType.COMPLETION
            const predictionType = suggestionType === SuggestionType.COMPLETION ? 'completion' : 'edit'

            return {
                suggestions: apiResponse.predictions.map(prediction => ({
                    content: prediction[predictionType]?.content ?? '',
                    references: prediction[predictionType]?.references ?? [],
                    itemId: this.generateItemId(),
                })),
                suggestionType,
                responseContext,
            }
        }

        for (const recommendation of apiResponse?.completions ?? []) {
            Object.assign(recommendation, { itemId: this.generateItemId() })
        }

        return {
            suggestions: apiResponse.completions as Suggestion[],
            suggestionType: SuggestionType.COMPLETION,
            responseContext,
        }
    }

    public async codeModernizerCreateUploadUrl(
        request: CodeWhispererTokenClient.CreateUploadUrlRequest
    ): Promise<CodeWhispererTokenClient.CreateUploadUrlResponse> {
        if (this.getCredentialsType() === 'bearer') {
            const tokenClient = this.client as CodeWhispererTokenClient
            return tokenClient.createUploadUrl(this.withProfileArn(request)).promise()
        } else {
            throw new Error('unsupported credentialsType for codeModernizerCreateUploadUrl')
        }
    }

    /**
     * @description Use this function to start the transformation job.
     * @param request
     * @returns transformationJobId - String id for the Job
     */

    public async codeModernizerStartCodeTransformation(
        request: CodeWhispererTokenClient.StartTransformationRequest
    ): Promise<PromiseResult<CodeWhispererTokenClient.StartTransformationResponse, AWSError>> {
        if (this.getCredentialsType() === 'bearer') {
            const tokenClient = this.client as CodeWhispererTokenClient
            return await tokenClient.startTransformation(this.withProfileArn(request)).promise()
        } else {
            throw new Error('unsupported credentialsType for codeModernizerStartCodeTransformation')
        }
    }

    /**
     * @description Use this function to stop the transformation job.
     * @param request
     * @returns transformationJobId - String id for the Job
     */
    public async codeModernizerStopCodeTransformation(
        request: CodeWhispererTokenClient.StopTransformationRequest
    ): Promise<PromiseResult<CodeWhispererTokenClient.StopTransformationResponse, AWSError>> {
        if (this.getCredentialsType() === 'bearer') {
            const tokenClient = this.client as CodeWhispererTokenClient
            return await tokenClient.stopTransformation(this.withProfileArn(request)).promise()
        } else {
            throw new Error('unsupported credentialsType for codeModernizerStopCodeTransformation')
        }
    }

    /**
     * @description Use this function to get the status of the code transformation. We should
     * be polling this function periodically to get updated results. When this function
     * returns COMPLETED we know the transformation is done.
     */
    public async codeModernizerGetCodeTransformation(
        request: CodeWhispererTokenClient.GetTransformationRequest
    ): Promise<PromiseResult<CodeWhispererTokenClient.GetTransformationResponse, AWSError>> {
        if (this.getCredentialsType() === 'bearer') {
            const tokenClient = this.client as CodeWhispererTokenClient
            return await tokenClient.getTransformation(this.withProfileArn(request)).promise()
        } else {
            throw new Error('unsupported credentialsType for codeModernizerGetCodeTransformation')
        }
    }

    /**
     * @description After starting a transformation use this function to display the LLM
     * transformation plan to the user.
     * @params tranformationJobId - String id returned from StartCodeTransformationResponse
     */
    public async codeModernizerGetCodeTransformationPlan(
        request: CodeWhispererTokenClient.GetTransformationPlanRequest
    ): Promise<PromiseResult<CodeWhispererTokenClient.GetTransformationPlanResponse, AWSError>> {
        if (this.getCredentialsType() === 'bearer') {
            const tokenClient = this.client as CodeWhispererTokenClient
            return tokenClient.getTransformationPlan(this.withProfileArn(request)).promise()
        } else {
            throw new Error('unsupported credentialsType for codeModernizerGetCodeTransformationPlan')
        }
    }

    /**
     * @description get a pre-signed url to upload source code into S3 bucket
     */
    async createUploadUrl(
        request: CodeWhispererTokenClient.CreateUploadUrlRequest
    ): Promise<PromiseResult<CodeWhispererTokenClient.CreateUploadUrlResponse, AWSError>> {
        if (this.getCredentialsType() === 'bearer') {
            const tokenClient = this.client as CodeWhispererTokenClient
            return tokenClient.createUploadUrl(this.withProfileArn(request)).promise()
        } else {
            throw new Error('unsupported credentialsType for createUploadUrl')
        }
    }

    /**
     * @description Once source code uploaded to S3, send a request to run security scan on uploaded source code.
     */
    async startCodeAnalysis(
        request: CodeWhispererTokenClient.StartCodeAnalysisRequest
    ): Promise<PromiseResult<CodeWhispererTokenClient.StartCodeAnalysisResponse, AWSError>> {
        if (this.getCredentialsType() === 'bearer') {
            const tokenClient = this.client as CodeWhispererTokenClient
            return tokenClient.startCodeAnalysis(this.withProfileArn(request)).promise()
        } else {
            throw new Error('unsupported credentialsType for startCodeAnalysis')
        }
    }

    /**
     * @description Send a request to get the code scan status detail.
     */
    async getCodeAnalysis(
        request: CodeWhispererTokenClient.GetCodeAnalysisRequest
    ): Promise<PromiseResult<CodeWhispererTokenClient.GetCodeAnalysisResponse, AWSError>> {
        if (this.getCredentialsType() === 'bearer') {
            const tokenClient = this.client as CodeWhispererTokenClient
            return tokenClient.getCodeAnalysis(this.withProfileArn(request)).promise()
        } else {
            throw new Error('unsupported credentialsType for getCodeAnalysis')
        }
    }

    /**
     * @description Once scan completed successfully, send a request to get list of all the findings for the given scan.
     */
    async listCodeAnalysisFindings(
        request: CodeWhispererTokenClient.ListCodeAnalysisFindingsRequest
    ): Promise<PromiseResult<CodeWhispererTokenClient.ListCodeAnalysisFindingsResponse, AWSError>> {
        if (this.getCredentialsType() === 'bearer') {
            const tokenClient = this.client as CodeWhispererTokenClient
            return tokenClient.listCodeAnalysisFindings(this.withProfileArn(request)).promise()
        } else {
            throw new Error('unsupported credentialsType for listCodeAnalysisFindings')
        }
    }

    /**
     * @description Get list of available customizations
     */
    async listAvailableCustomizations(request: CodeWhispererTokenClient.ListAvailableCustomizationsRequest) {
        if (this.getCredentialsType() === 'bearer') {
            const tokenClient = this.client as CodeWhispererTokenClient
            return tokenClient.listAvailableCustomizations(this.withProfileArn(request)).promise()
        } else {
            throw new Error('unsupported credentialsType for listAvailableCustomizations')
        }
    }

    /**
     * @description Get list of available profiles
     */
    async listAvailableProfiles(request: CodeWhispererTokenClient.ListAvailableProfilesRequest) {
        if (this.getCredentialsType() === 'bearer') {
            const tokenClient = this.client as CodeWhispererTokenClient
            return tokenClient.listAvailableProfiles(request).promise()
        } else {
            throw new Error('unsupported credentialsType for listAvailableProfiles')
        }
    }

    /**
     * @description send telemetry event to code whisperer data warehouse
     */
    async sendTelemetryEvent(request: CodeWhispererTokenClient.SendTelemetryEventRequest) {
        if (this.getCredentialsType() === 'bearer') {
            const tokenClient = this.client as CodeWhispererTokenClient
            return tokenClient.sendTelemetryEvent(this.withProfileArn(request)).promise()
        } else {
            throw new Error('unsupported credentialsType for sendTelemetryEvent')
        }
    }

    /**
     * @description create a remote workspace
     */
    async createWorkspace(request: CodeWhispererTokenClient.CreateWorkspaceRequest) {
        if (this.getCredentialsType() === 'bearer') {
            const tokenClient = this.client as CodeWhispererTokenClient
            return tokenClient.createWorkspace(this.withProfileArn(request)).promise()
        } else {
            throw new Error('unsupported credentialsType for createWorkspace')
        }
    }

    /**
     * @description get list of workspace metadata
     */
    async listWorkspaceMetadata(request: CodeWhispererTokenClient.ListWorkspaceMetadataRequest) {
        if (this.getCredentialsType() === 'bearer') {
            const tokenClient = this.client as CodeWhispererTokenClient
            return tokenClient.listWorkspaceMetadata(this.withProfileArn(request)).promise()
        } else {
            throw new Error('unsupported credentialsType for listWorkspaceMetadata')
        }
    }

    /**
     * @description delete the remote workspace
     */
    async deleteWorkspace(request: CodeWhispererTokenClient.DeleteWorkspaceRequest) {
        if (this.getCredentialsType() === 'bearer') {
            const tokenClient = this.client as CodeWhispererTokenClient
            return tokenClient.deleteWorkspace(this.withProfileArn(request)).promise()
        } else {
            throw new Error('unsupported credentialsType for deleteWorkspace')
        }
    }

    /*
     * @description get the list of feature evaluations
     */
    async listFeatureEvaluations(request: CodeWhispererTokenClient.ListFeatureEvaluationsRequest) {
        if (this.getCredentialsType() === 'bearer') {
            const tokenClient = this.client as CodeWhispererTokenClient
            return tokenClient.listFeatureEvaluations(this.withProfileArn(request)).promise()
        } else {
            throw new Error('unsupported credentialsType for listFeatureEvaluations')
        }
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

        if (this.getCredentialsType() === 'bearer') {
            const tokenClient = this.client as CodeWhispererTokenClient
            this.#createSubscriptionTokenPromise = (async () => {
                try {
                    const r = await tokenClient.createSubscriptionToken(this.withProfileArn(request)).promise()
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
        } else {
            throw new Error('unsupported credentialsType for listFeatureEvaluations')
        }
    }

    /**
     * Gets the Subscription status of the given user.
     *
     * @param statusOnly use this if you don't need the encodedVerificationUrl, else a ConflictException is treated as "ACTIVE"
     */
    override async getSubscriptionStatus(
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
        if (this.getCredentialsType() === 'iam') {
            throw new Error('unsupported credentialsType for getSubscriptionStatus')
        }

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
    override async waitUntilSubscriptionActive(cancelToken?: CancellationToken): Promise<boolean> {
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
