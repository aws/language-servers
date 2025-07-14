import {
    BearerCredentials,
    CredentialsProvider,
    CredentialsType,
    Workspace,
    Logging,
    SDKInitializator,
    CancellationToken,
    CancellationTokenSource,
    TextDocument,
    Position,
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
import { applyUnifiedDiff, getEndOfEditPosition } from '../language-server/inline-completion/diffUtils'

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

// This abstract class can grow in the future to account for any additional changes across the clients
export abstract class CodeWhispererServiceBase {
    protected readonly codeWhispererRegion
    protected readonly codeWhispererEndpoint
    public shareCodeWhispererContentWithAWS = false
    public customizationArn?: string
    public profileArn?: string
    abstract client: CodeWhispererSigv4Client | CodeWhispererTokenClient
    protected isGcInProgress: boolean = false

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

    isGenerateCompletionInProgress(): boolean {
        return this.isGcInProgress
    }

    abstract getCredentialsType(): CredentialsType

    abstract generateSuggestions(request: GenerateSuggestionsRequest): Promise<GenerateSuggestionsResponse>

    abstract clearCachedSuggestions(reason?: string): void

    abstract generateCompletionsAndEdits(
        textDocument: TextDocument,
        request: GenerateSuggestionsRequest,
        config: {
            enablePrefetch: boolean
            cacheKey: string | number | undefined
        }
    ): Promise<GenerateSuggestionsResponse>

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
            suggestionType: SuggestionType.COMPLETION,
            responseContext,
        }
    }

    generateCompletionsAndEdits(
        textDocument: TextDocument,
        request: GenerateSuggestionsRequest,
        config: {
            enablePrefetch: boolean
            cacheKey: string | number
        }
    ): Promise<GenerateSuggestionsResponse> {
        return this.generateSuggestions(request)
    }

    // No effect as IAM clients don't have this functionality yet
    clearCachedSuggestions(reason?: string) {}
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

    prefetchCache: Map<
        string | number,
        { id: string; response: GenerateSuggestionsResponse; request: GenerateSuggestionsRequest }
    > = new Map()

    isPrefetchInProgress: boolean = false

    editStreakStates: { coldStartSessionid: string; enabled: boolean } = { coldStartSessionid: '', enabled: false }

    private prefetchConfig = {
        duration: 500, // 500ms
        maxCacheSuggestionSize: 2,
        maxRecursiveCallDepth: 2,
        // TODO: make it shorter, 100s for dev purpose
        cacheClearIntervalInMs: 100 * 1000, // 100s
    }

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

    getEditStreakState(): { coldStartSessionid: string; enabled: boolean } {
        return {
            ...this.editStreakStates,
        }
    }

    enableEditStreakMode(flag: boolean) {
        if (flag) {
            this.editStreakStates.enabled = true
            setTimeout(() => {
                this.editStreakStates.enabled = false
            }, 60 * 1000)
        } else {
            this.editStreakStates.enabled = false
        }
    }

    clearCachedSuggestions(reason?: string) {
        this.logging.info(`[NEP] clearing prefetch cache because: ${reason}`)
        this.prefetchCache.clear()
    }

    async generateSuggestions(request: GenerateSuggestionsRequest): Promise<GenerateSuggestionsResponse> {
        // add cancellation check
        // add error check
        if (this.customizationArn) request.customizationArn = this.customizationArn
        const response = await this.client.generateCompletions(this.withProfileArn(request)).promise()
        this.logging.info(`GenerateCompletion response: 
    "requestId": ${response.$response.requestId},
    "responseCompletionCount": ${response.completions?.length ?? 0},
    "responsePredictionCount": ${response.predictions?.length ?? 0},
    "suggestionType": ${request.predictionTypes?.toString() ?? ''},
    "filename": ${request.fileContext.filename},
    "language": ${request.fileContext.programmingLanguage.languageName},
    "supplementalContextLength": ${request.supplementalContexts?.length ?? 0}`)
        const responseContext = {
            requestId: response?.$response?.requestId,
            codewhispererSessionId: response?.$response?.httpResponse?.headers['x-amzn-sessionid'],
            nextToken: response.nextToken,
        }
        return this.mapCodeWhispererApiResponseToSuggestion(response, responseContext)
    }

    generateCompletionsAndEdits(
        textDocument: TextDocument,
        request: GenerateSuggestionsRequest,
        config: {
            enablePrefetch: boolean
            cacheKey: string | number | undefined
        }
    ): Promise<GenerateSuggestionsResponse> {
        try {
            this.isGcInProgress = true
            if (!config.enablePrefetch) {
                return this.generateSuggestions(request)
            }

            return this.generateSuggestionsAndPrefetch(textDocument, request, config.cacheKey)
        } finally {
            this.isGcInProgress = false
        }
    }

    private async generateSuggestionsAndPrefetch(
        textDocument: TextDocument,
        originalRequest: GenerateSuggestionsRequest,
        cacheKey: string | number | undefined
    ): Promise<GenerateSuggestionsResponse> {
        const t0 = performance.now()
        let r: GenerateSuggestionsResponse
        let type: string = ''
        if (cacheKey) {
            // It's possible that we're still waiting for server's response, so should waitUntil
            const rr = await waitUntil(
                async () => {
                    // TODO: use nextToken to retrieve cached suggestion
                    return this.prefetchCache.get(cacheKey)
                },
                {
                    timeout: 1000,
                    interval: 50,
                }
            )
            if (!rr) {
                this.clearCachedSuggestions('there is no cached suggestion')
                throw new Error('time out')
            }

            r = rr.response
            type = 'prefetch'
        } else {
            this.clearCachedSuggestions('before cold start')
            r = await this.generateSuggestions(originalRequest)
            // TODO: nextToken
            r.responseContext.nextToken = 'cold-start-fake-token'
            type = 'coldstart'

            if (r.suggestions.length > 0) {
                this.editStreakStates.coldStartSessionid = r.responseContext.codewhispererSessionId
                setTimeout(() => {
                    this.chainedGenerateCompletionCall(originalRequest, r, textDocument, 0)
                        .catch(e => {})
                        .finally(async () => {
                            // Cache is only valid for x seconds
                            setTimeout(() => {
                                this.clearCachedSuggestions('cache is invalid after 100 seconds')
                            }, this.prefetchConfig.cacheClearIntervalInMs)
                        })
                }, this.prefetchConfig.duration)
            }
        }

        const logstr = `[NEP] returning suggestions @generateSuggestionsAndPrefetch:
- latency: ${performance.now() - t0}
- type: ${type}
- nextToken: ${r.responseContext.nextToken}
- suggestion: 
${r.suggestions[0]?.content ?? '[NO SUGGESTION'}`

        this.logging.info(logstr)

        return r
    }

    private async chainedGenerateCompletionCall(
        baseRequest: GenerateSuggestionsRequest,
        baseResponse: GenerateSuggestionsResponse,
        textDocument: TextDocument,
        depth: number,
        token?: CancellationToken
    ) {
        // Only prefetch for EDIT type suggestions
        if (baseResponse.suggestionType !== SuggestionType.EDIT) {
            return
        }

        if (baseResponse.suggestions.length === 0) {
            return
        }

        if (depth >= this.prefetchConfig.maxRecursiveCallDepth) {
            return
        }

        if (token && token.isCancellationRequested) {
            return
        }

        const request = this.buildSubsequentNepRequest(baseRequest, baseResponse, textDocument)

        try {
            const response = await this.generateSuggestions(request)
            const isResponseValid =
                response.suggestions.length > 0 &&
                response.suggestions[0] &&
                baseResponse.suggestions[0] &&
                response.suggestions[0].content !== baseResponse.suggestions[0].content

            if (isResponseValid) {
                // TODO: nextToken
                if (depth + 1 < this.prefetchConfig.maxRecursiveCallDepth) {
                    response.responseContext.nextToken = `fake-token-point-to-depth ${depth + 1}`
                }

                const nextToken = response.responseContext.nextToken

                const nt = baseResponse.responseContext.nextToken
                if (nt) {
                    this.prefetchCache.set(nt, {
                        id: baseResponse.responseContext.codewhispererSessionId,
                        response: response,
                        request: request,
                    })
                }

                setTimeout(async () => {
                    await this.chainedGenerateCompletionCall(request, response, textDocument, depth + 1, token)
                }, this.prefetchConfig.duration)
            }

            this.logging.info(`[NEP] prefetch success @chainedGenerateCompletionCall:
- file: ${baseRequest.fileContext.filename}
- depth: ${depth}
- current prefetch suggestion length: ${this.prefetchCache.size}
- is prefetch response valid: ${isResponseValid}
- suggestion (next line):
${response.suggestions[0].content}`)
        } catch (e) {
            this.logging.error(`[NEP] prefetch failure @chainedGenerateCompletionCall:
- file: ${baseRequest.fileContext.filename}
- depth: ${depth}
- current prefetch suggestion length: ${this.prefetchCache.size}
- error: ${(e as Error).message}`)
        }
    }

    // TODO: Confirm/Validate this is correct
    private buildSubsequentNepRequest(
        baseRequest: GenerateSuggestionsRequest,
        baseResponse: GenerateSuggestionsResponse,
        textDocument: TextDocument
    ): GenerateSuggestionsRequest {
        if (baseResponse.suggestionType !== SuggestionType.EDIT) {
            throw new Error(
                `Illegal argument: expecting baseResponse to be Edits type but ${baseResponse.suggestionType} is provided`
            )
        }

        // Service will only return 1 Edit suggestion
        const suggestion = baseResponse.suggestions[0]

        // 1. Copy the base request
        const subsequentRequest = {
            ...baseRequest,
            nextToken: undefined,
        }

        // 2. Apply unified diff and get updated code
        const docText = baseRequest.fileContext.leftFileContent + baseRequest.fileContext.rightFileContent
        const newCode = applyUnifiedDiff(docText, suggestion.content)
        const afterChangePosition = getEndOfEditPosition(docText, newCode)

        // 3. Update file context
        const { leftContent, rightContent } = this.splitContentAtPosition(newCode, afterChangePosition)
        subsequentRequest.fileContext = {
            ...baseRequest.fileContext,
            leftFileContent: leftContent.slice(-10240),
            rightFileContent: rightContent.slice(0, 10240),
        }

        // 4. Update supplemental context
        subsequentRequest.supplementalContexts = baseRequest.supplementalContexts
            ? [...baseRequest.supplementalContexts]
            : []
        // TODO: handle sup context length > 5 ?
        subsequentRequest.supplementalContexts.push({
            content: suggestion.content,
            filePath: subsequentRequest.fileContext.filename,
            type: 'PreviousEditorState',
            metadata: {
                previousEditorStateMetadata: {
                    timeOffset: 1000,
                },
            },
        })

        // 5. Update editor state
        subsequentRequest.editorState = {
            ...baseRequest.editorState,
            document: {
                relativeFilePath: textDocument.uri,
                programmingLanguage: {
                    languageName: textDocument.languageId,
                },
                text: leftContent + rightContent,
            },
            cursorState: {
                position: {
                    line: afterChangePosition.line,
                    character: afterChangePosition.character,
                },
            },
        }

        return subsequentRequest
    }

    // TODO: Confirm/Validate this is correct
    private splitContentAtPosition(
        content: string,
        position: Position
    ): {
        leftContent: string
        rightContent: string
    } {
        // Split content into lines
        const lines = content.split('\n')

        // Normalize position
        const targetLine = Math.max(0, Math.min(position.line, lines.length - 1))
        const targetChar = Math.max(0, Math.min(position.character, lines[targetLine].length))

        // Create left content
        const leftLines = lines.slice(0, targetLine)
        const leftPartOfTargetLine = lines[targetLine].substring(0, targetChar)
        const leftContent = [...leftLines, leftPartOfTargetLine].join('\n')

        // Create right content
        const rightPartOfTargetLine = lines[targetLine].substring(targetChar)
        const rightLines = lines.slice(targetLine + 1)
        const rightContent = [rightPartOfTargetLine, ...rightLines].join('\n')

        return { leftContent, rightContent }
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
