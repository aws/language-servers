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
    WorkspaceFolder,
    InlineCompletionWithReferencesParams,
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
import { getRelativePath } from '../language-server/workspaceContext/util'
import { CodewhispererLanguage, getRuntimeLanguage } from './languageDetection'
import { RecentEditTracker } from '../language-server/inline-completion/tracker/codeEditTracker'
import { CodeWhispererSupplementalContext } from './models/model'
import { fetchSupplementalContext } from './supplementalContextUtil/supplementalContextUtil'
import * as path from 'path'
import {
    CONTEXT_CHARACTERS_LIMIT,
    FILE_URI_CHARS_LIMIT,
    FILENAME_CHARS_LIMIT,
} from '../language-server/inline-completion/constants'

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

export function getFileContext(params: {
    textDocument: TextDocument
    position: Position
    inferredLanguageId: CodewhispererLanguage
    workspaceFolder: WorkspaceFolder | null | undefined
}): {
    fileUri: string
    filename: string
    programmingLanguage: {
        languageName: CodewhispererLanguage
    }
    leftFileContent: string
    rightFileContent: string
} {
    const left = params.textDocument.getText({
        start: { line: 0, character: 0 },
        end: params.position,
    })
    const trimmedLeft = left.slice(-CONTEXT_CHARACTERS_LIMIT).replaceAll('\r\n', '\n')

    const right = params.textDocument.getText({
        start: params.position,
        end: params.textDocument.positionAt(params.textDocument.getText().length),
    })
    const trimmedRight = right.slice(0, CONTEXT_CHARACTERS_LIMIT).replaceAll('\r\n', '\n')

    const relativeFilePath = params.workspaceFolder
        ? getRelativePath(params.workspaceFolder, params.textDocument.uri)
        : path.basename(params.textDocument.uri)

    return {
        fileUri: params.textDocument.uri.substring(0, FILE_URI_CHARS_LIMIT),
        filename: relativeFilePath.substring(0, FILENAME_CHARS_LIMIT),
        programmingLanguage: {
            languageName: getRuntimeLanguage(params.inferredLanguageId),
        },
        leftFileContent: trimmedLeft,
        rightFileContent: trimmedRight,
    }
}

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

    abstract constructSupplementalContext(
        document: TextDocument,
        position: Position,
        workspace: Workspace,
        recentEditTracker: RecentEditTracker,
        logging: Logging,
        cancellationToken: CancellationToken,
        opentabs: InlineCompletionWithReferencesParams['openTabFilepaths'],
        config: { includeRecentEdits: boolean }
    ): Promise<
        | {
              supContextData: CodeWhispererSupplementalContext
              items: CodeWhispererTokenClient.SupplementalContextList
          }
        | undefined
    >

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

    async constructSupplementalContext(
        document: TextDocument,
        position: Position,
        workspace: Workspace,
        recentEditTracker: RecentEditTracker,
        logging: Logging,
        cancellationToken: CancellationToken,
        opentabs: InlineCompletionWithReferencesParams['openTabFilepaths'],
        config: { includeRecentEdits: boolean }
    ): Promise<
        | {
              supContextData: CodeWhispererSupplementalContext
              items: CodeWhispererTokenClient.SupplementalContextList
          }
        | undefined
    > {
        return undefined
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
        this.client = createCodeWhispererTokenClient(options, sdkInitializator, logging)
    }

    getCredentialsType(): CredentialsType {
        return 'bearer'
    }

    async constructSupplementalContext(
        document: TextDocument,
        position: Position,
        workspace: Workspace,
        recentEditTracker: RecentEditTracker,
        logging: Logging,
        cancellationToken: CancellationToken,
        opentabs: InlineCompletionWithReferencesParams['openTabFilepaths'],
        config: { includeRecentEdits: boolean }
    ): Promise<
        | {
              supContextData: CodeWhispererSupplementalContext
              items: CodeWhispererTokenClient.SupplementalContextList
          }
        | undefined
    > {
        const items: CodeWhispererTokenClient.SupplementalContext[] = []

        const projectContext = await fetchSupplementalContext(
            document,
            position,
            workspace,
            logging,
            cancellationToken,
            opentabs
        )
        if (projectContext) {
            items.push(
                ...projectContext.supplementalContextItems.map(v => ({
                    content: v.content,
                    filePath: v.filePath,
                }))
            )
        }

        const recentEditsContext = config.includeRecentEdits
            ? await recentEditTracker.generateEditBasedContext(document)
            : undefined
        if (recentEditsContext) {
            items.push(
                ...recentEditsContext.supplementalContextItems.map(item => ({
                    content: item.content,
                    filePath: item.filePath,
                    type: 'PreviousEditorState',
                    metadata: {
                        previousEditorStateMetadata: {
                            timeOffset: 1000,
                        },
                    },
                }))
            )
        }

        const merged: CodeWhispererSupplementalContext | undefined = recentEditsContext
            ? {
                  contentsLength: (projectContext?.contentsLength || 0) + (recentEditsContext?.contentsLength || 0),
                  latency: Math.max(projectContext?.latency || 0, recentEditsContext?.latency || 0),
                  isUtg: projectContext?.isUtg || false,
                  isProcessTimeout: projectContext?.isProcessTimeout || false,
                  strategy: recentEditsContext ? 'recentEdits' : projectContext?.strategy || 'Empty',
                  supplementalContextItems: [
                      ...(projectContext?.supplementalContextItems || []),
                      ...(recentEditsContext?.supplementalContextItems || []),
                  ],
              }
            : projectContext

        return merged
            ? {
                  supContextData: merged,
                  items: items,
              }
            : undefined
    }

    private withProfileArn<T extends object>(request: T): T {
        if (!this.profileArn) return request

        return { ...request, profileArn: this.profileArn }
    }

    async generateSuggestions(request: GenerateSuggestionsRequest): Promise<GenerateSuggestionsResponse> {
        // add cancellation check
        // add error check
        if (this.customizationArn) request.customizationArn = this.customizationArn
        const beforeApiCall = performance.now()
        let recentEditsLogStr = ''
        const recentEdits = request.supplementalContexts?.filter(it => it.type === 'PreviousEditorState')
        if (recentEdits) {
            if (recentEdits.length === 0) {
                recentEditsLogStr += `No recent edits`
            } else {
                recentEditsLogStr += '\n'
                for (let i = 0; i < recentEdits.length; i++) {
                    const e = recentEdits[i]
                    recentEditsLogStr += `[recentEdits ${i}th]:\n`
                    recentEditsLogStr += `${e.content}\n`
                }
            }
        }
        this.logging.info(
            `GenerateCompletion request: 
    "endpoint": ${this.codeWhispererEndpoint},
    "predictionType": ${request.predictionTypes?.toString() ?? 'Not specified (COMPLETIONS)'},
    "filename": ${request.fileContext.filename},
    "language": ${request.fileContext.programmingLanguage.languageName},
    "supplementalContextCount": ${request.supplementalContexts?.length ?? 0},
    "request.nextToken": ${request.nextToken},
    "recentEdits": ${recentEditsLogStr}`
        )

        const response = await this.client.generateCompletions(this.withProfileArn(request)).promise()

        const responseContext = {
            requestId: response?.$response?.requestId,
            codewhispererSessionId: response?.$response?.httpResponse?.headers['x-amzn-sessionid'],
            nextToken: response.nextToken,
        }

        const r = this.mapCodeWhispererApiResponseToSuggestion(response, responseContext)
        const firstSuggestionLogstr = r.suggestions.length > 0 ? `\n${r.suggestions[0].content}` : 'No suggestion'

        this.logging.info(
            `GenerateCompletion response: 
    "endpoint": ${this.codeWhispererEndpoint},
    "requestId": ${responseContext.requestId},
    "sessionId": ${responseContext.codewhispererSessionId},
    "responseCompletionCount": ${response.completions?.length ?? 0},
    "responsePredictionCount": ${response.predictions?.length ?? 0},
    "predictionType": ${request.predictionTypes?.toString() ?? ''},
    "latency": ${performance.now() - beforeApiCall},
    "filename": ${request.fileContext.filename},
    "response.nextToken": ${response.nextToken},
    "firstSuggestion": ${firstSuggestionLogstr}`
        )
        return r
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
