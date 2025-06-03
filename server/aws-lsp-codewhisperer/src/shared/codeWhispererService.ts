import {
    BearerCredentials,
    CredentialsProvider,
    CredentialsType,
    Workspace,
    Logging,
    SDKInitializator,
    TextDocument,
} from '@aws/language-server-runtimes/server-interface'
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

import { PredictionType, GenerateCompletionsResponse } from '../client/token/codewhispererbearertokenclient'

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

import CodeWhispererSigv4Client = require('../client/sigv4/codewhisperersigv4client')
import CodeWhispererTokenClient = require('../client/token/codewhispererbearertokenclient')
import { applyUnifiedDiff, getEndOfEditPosition } from '../language-server/inline-completion/diffUtils'
import { CodewhispererLanguage, getSupportedLanguageId } from './languageDetection'
import { Position } from 'vscode-languageserver-textdocument'

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

    prefetchSuggestions:
        | { id: string; response: GenerateSuggestionsResponse; request: GenerateSuggestionsRequest }
        | undefined

    clearPrefetch() {
        this.prefetchSuggestions = undefined
    }

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

    abstract generateSuggestionsAndPrefetch(
        textDocument: TextDocument,
        request: GenerateSuggestionsRequest
    ): Promise<GenerateSuggestionsResponse>

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

    // TODO: same as regular GC until we want to enable prefetch with IAM client
    override async generateSuggestionsAndPrefetch(
        textDocument: TextDocument,
        request: GenerateSuggestionsRequest
    ): Promise<GenerateSuggestionsResponse> {
        return await this.generateSuggestions(request)
    }

    async generateSuggestions(request: GenerateSuggestionsRequest): Promise<GenerateSuggestionsResponse> {
        // add cancellation check
        // add error check
        if (this.customizationArn) request = { ...request, customizationArn: this.customizationArn }

        console.log(
            '[CWSPR-API] generateRecommendations request:',
            JSON.stringify(request),
            `time: ${Date.now() / 1000}s`
        )
        const response = await this.client.generateRecommendations(request).promise()
        console.log(
            '[CWSPR-API] generateRecommendations response:',
            JSON.stringify(response),
            `time: ${Date.now() / 1000}s`
        )

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

export class CodeWhispererServiceToken extends CodeWhispererServiceBase {
    client: CodeWhispererTokenClient

    constructor(
        credentialsProvider: CredentialsProvider,
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
                    this.trackRequest(req)
                    req.on('build', ({ httpRequest }) => {
                        try {
                            const creds = credentialsProvider.getCredentials('bearer') as BearerCredentials
                            if (!creds?.token) {
                                throw new Error('Authorization failed, bearer token is not set')
                            }
                            httpRequest.headers['Authorization'] = `Bearer ${creds.token}`
                            httpRequest.headers['x-amzn-codewhisperer-optout'] =
                                `${!this.shareCodeWhispererContentWithAWS}`
                            console.debug('CWSPR Request Headers:', JSON.stringify(httpRequest.headers, null, 2))
                            console.debug(
                                'CWSPR Request Body:',
                                httpRequest.body
                                    ? JSON.stringify(JSON.parse(httpRequest.body.toString()), null, 2)
                                    : 'No body'
                            )
                        } catch (error) {
                            console.error('CWSPR Error during request build:', error)
                            throw error
                        }
                    })
                    req.on('send', () => {
                        console.log('CWSPR Request details:', req)
                    })
                    req.on('complete', response => {
                        console.log('CWSPR Request completed with response:', response)
                        this.completeRequest(req)
                    })
                    req.on('error', (e, k) => {
                        console.log('CWSPR Request failed with error:', e, 'and response:', k)
                    })
                    // Final outcome events
                    req.on('success', (response: AWS.Response<any, AWSError>) => {
                        console.log('RequestId:', response.requestId)
                        console.debug('CWSPR Completed Succesfully', JSON.stringify(response.data, null, 2))
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

        console.log('[CWSPR] generateCompletions request:', JSON.stringify(request), `time: ${Date.now() / 1000}s`)

        const response = await this.client.generateCompletions(this.withProfileArn(request)).promise()

        console.log('[CWSPR] generateCompletions response:', JSON.stringify(response), `time: ${Date.now() / 1000}s`)

        const responseContext = {
            requestId: response?.$response?.requestId,
            codewhispererSessionId: response?.$response?.httpResponse?.headers['x-amzn-sessionid'],
            nextToken: response.nextToken,
        }

        return this.mapCodeWhispererApiResponseToSuggestion(response, responseContext)
    }

    // Only used when it's a cold start
    override async generateSuggestionsAndPrefetch(
        textDocument: TextDocument,
        firstRequest: GenerateSuggestionsRequest
    ): Promise<GenerateSuggestionsResponse> {
        // If codewhispererService has prefetched result && id matches, return the cached prefetched result directly
        const shouldUsePrefetch = this.prefetchSuggestions
        if (shouldUsePrefetch) {
            this.logging.info(`will use prefetch suggestion`)
        } else {
            this.logging.info(`cold start`)
        }

        const curResponse =
            (shouldUsePrefetch ? this.prefetchSuggestions?.response : undefined) ??
            (await this.generateSuggestions(firstRequest))

        if (curResponse.suggestions && curResponse.suggestions.length > 0) {
            const suggestion = curResponse.suggestions[0]

            setTimeout(async () => {
                const secondRequest = {
                    ...firstRequest,
                    fileContext: {
                        ...firstRequest.fileContext,
                        leftFileContent: firstRequest.fileContext.leftFileContent + suggestion.content,
                    },
                    nextToken: undefined,
                }

                // NEP flow requires more updates other than left/right filecontent
                if (curResponse.suggestionType && curResponse.suggestionType === SuggestionType.EDIT) {
                    const docText = textDocument.getText()
                    const afterDiff = applyUnifiedDiff(docText, suggestion.content)
                    const newCode = afterDiff.newCode

                    const afterChangePosition = getEndOfEditPosition(docText, newCode)
                    // Calculate new left context & right context
                    const { leftContent, rightContent } = splitContentAtPosition(newCode, afterChangePosition)

                    secondRequest.fileContext = {
                        ...firstRequest.fileContext,
                        leftFileContent: leftContent.slice(-10240),
                        rightFileContent: rightContent.slice(0, 10240),
                    }

                    secondRequest.supplementalContexts = firstRequest.supplementalContexts
                        ? [...firstRequest.supplementalContexts]
                        : []

                    secondRequest.editorState = {
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

                    // updated edit supplemental context
                    if (curResponse.suggestions[0]) {
                        // TODO: handle sup context length > 5 ?
                        secondRequest.supplementalContexts.push({
                            content: curResponse.suggestions[0].content,
                            filePath: secondRequest.fileContext.filename,
                            type: 'PreviousEditorState',
                            metadata: {
                                previousEditorStateMetadata: {
                                    timeOffset: 1000,
                                },
                            },
                        })
                    }
                }

                try {
                    const secondResponse = await this.generateSuggestions(secondRequest)
                    if (
                        secondResponse.suggestions.length > 0 &&
                        secondResponse.suggestions[0].content !== curResponse.suggestions[0].content
                    ) {
                        console.log(`prefetch result: `)
                        console.log(secondResponse.suggestions[0].content)
                        this.prefetchSuggestions = {
                            id: curResponse.suggestions[0].content, // TODO: either session id, suggestion for the purpose of checking it's the right followup/subsequent call?
                            response: secondResponse,
                            request: secondRequest,
                        }
                    }

                    if (curResponse.suggestions[0].content === secondResponse.suggestions[0].content) {
                        console.log('identical result, discard', curResponse.suggestions[0].content)
                    }
                } catch (e) {
                    console.log(e)
                }
            }, 250)
        }

        console.log(`current result: `)
        console.log(curResponse.suggestions[0].content)
        return curResponse
    }

    private mapCodeWhispererApiResponseToSuggestion(
        apiResponse: GenerateCompletionsResponse,
        responseContext: ResponseContext
    ): GenerateSuggestionsResponse {
        // Return suggestions based on whether we have completions or predictions
        // For now completions and edits are mutually exclusive

        if (apiResponse.predictions && apiResponse.predictions.length > 0) {
            const suggestionType = apiResponse.predictions[0].edit ? SuggestionType.EDIT : SuggestionType.COMPLETION

            var suggestions: Suggestion[]

            if (suggestionType === SuggestionType.COMPLETION) {
                suggestions = apiResponse.predictions.map(prediction => ({
                    content: prediction.completion?.content ?? '',
                    references: prediction.completion?.references ?? [],
                    itemId: this.generateItemId(),
                }))
            } else {
                suggestions = apiResponse.predictions.map(prediction => ({
                    content: prediction.edit?.content ?? '',
                    references: prediction.edit?.references ?? [],
                    itemId: this.generateItemId(),
                }))
            }

            return {
                suggestions: suggestions,
                suggestionType: suggestionType,
                responseContext: responseContext,
            }
        } else {
            return {
                suggestions: apiResponse.completions as Suggestion[],
                suggestionType: SuggestionType.COMPLETION,
                responseContext: responseContext,
            }
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
}

// Both clients (token, sigv4) define their own types, this return value needs to match both of them.
export const getFileContext = (params: {
    textDocument: TextDocument
    position: Position
    inferredLanguageId: CodewhispererLanguage
}): {
    filename: string
    programmingLanguage: {
        languageName: CodewhispererLanguage
    }
    leftFileContent: string
    rightFileContent: string
} => {
    const left = params.textDocument.getText({
        start: { line: 0, character: 0 },
        end: params.position,
    })
    const right = params.textDocument.getText({
        start: params.position,
        end: params.textDocument.positionAt(params.textDocument.getText().length),
    })

    return {
        filename: params.textDocument.uri,
        programmingLanguage: {
            languageName: params.inferredLanguageId,
        },
        leftFileContent: left,
        rightFileContent: right,
    }
}

// TODO: not precise
function splitContentAtPosition(
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
