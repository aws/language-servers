import { CredentialsType, CancellationToken } from '@aws/language-server-runtimes/server-interface'
import { AWSError, ConfigurationOptions } from 'aws-sdk'
import { PromiseResult } from 'aws-sdk/lib/request'
import { v4 as uuidv4 } from 'uuid'
import { RequestExtras } from '../../client/token/codewhisperer'
import CodeWhispererSigv4Client = require('../../client/sigv4/codewhisperersigv4client')
import CodeWhispererTokenClient = require('../../client/token/codewhispererbearertokenclient')

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

    abstract getCredentialsType(): CredentialsType
    abstract generateSuggestions(request: GenerateSuggestionsRequest): Promise<GenerateSuggestionsResponse>
    abstract codeModernizerCreateUploadUrl(
        request: CodeWhispererTokenClient.CreateUploadUrlRequest
    ): Promise<CodeWhispererTokenClient.CreateUploadUrlResponse>
    abstract codeModernizerStartCodeTransformation(
        request: CodeWhispererTokenClient.StartTransformationRequest
    ): Promise<PromiseResult<CodeWhispererTokenClient.StartTransformationResponse, AWSError>>
    abstract codeModernizerStopCodeTransformation(
        request: CodeWhispererTokenClient.StopTransformationRequest
    ): Promise<PromiseResult<CodeWhispererTokenClient.StopTransformationResponse, AWSError>>
    abstract codeModernizerGetCodeTransformation(
        request: CodeWhispererTokenClient.GetTransformationRequest
    ): Promise<PromiseResult<CodeWhispererTokenClient.GetTransformationResponse, AWSError>>
    abstract codeModernizerGetCodeTransformationPlan(
        request: CodeWhispererTokenClient.GetTransformationPlanRequest
    ): Promise<PromiseResult<CodeWhispererTokenClient.GetTransformationPlanResponse, AWSError>>
    abstract createUploadUrl(
        request: CodeWhispererTokenClient.CreateUploadUrlRequest
    ): Promise<PromiseResult<CodeWhispererTokenClient.CreateUploadUrlResponse, AWSError>>
    abstract startCodeAnalysis(
        request: CodeWhispererTokenClient.StartCodeAnalysisRequest
    ): Promise<PromiseResult<CodeWhispererTokenClient.StartCodeAnalysisResponse, AWSError>>
    abstract getCodeAnalysis(
        request: CodeWhispererTokenClient.GetCodeAnalysisRequest
    ): Promise<PromiseResult<CodeWhispererTokenClient.GetCodeAnalysisResponse, AWSError>>
    abstract listCodeAnalysisFindings(
        request: CodeWhispererTokenClient.ListCodeAnalysisFindingsRequest
    ): Promise<PromiseResult<CodeWhispererTokenClient.ListCodeAnalysisFindingsResponse, AWSError>>
    abstract listAvailableCustomizations(
        request: CodeWhispererTokenClient.ListAvailableCustomizationsRequest
    ): Promise<PromiseResult<CodeWhispererTokenClient.ListAvailableCustomizationsResponse, AWSError>>
    abstract listAvailableProfiles(
        request: CodeWhispererTokenClient.ListAvailableProfilesRequest
    ): Promise<PromiseResult<CodeWhispererTokenClient.ListAvailableProfilesRequest, AWSError>>
    abstract sendTelemetryEvent(
        request: CodeWhispererTokenClient.SendTelemetryEventRequest
    ): Promise<PromiseResult<CodeWhispererTokenClient.SendTelemetryEventResponse, AWSError>>
    abstract createWorkspace(
        request: CodeWhispererTokenClient.CreateWorkspaceRequest
    ): Promise<PromiseResult<CodeWhispererTokenClient.CreateWorkspaceResponse, AWSError>>
    abstract listWorkspaceMetadata(
        request: CodeWhispererTokenClient.ListWorkspaceMetadataRequest
    ): Promise<PromiseResult<CodeWhispererTokenClient.ListWorkspaceMetadataResponse, AWSError>>
    abstract deleteWorkspace(
        request: CodeWhispererTokenClient.DeleteWorkspaceRequest
    ): Promise<PromiseResult<CodeWhispererTokenClient.DeleteWorkspaceResponse, AWSError>>
    abstract listFeatureEvaluations(
        request: CodeWhispererTokenClient.ListFeatureEvaluationsRequest
    ): Promise<PromiseResult<CodeWhispererTokenClient.ListFeatureEvaluationsResponse, AWSError>>
}
