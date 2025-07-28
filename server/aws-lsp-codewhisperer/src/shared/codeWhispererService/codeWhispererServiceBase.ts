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

// TODO: CodeWhispererSigv4Client requests and responses do not exist yet and should be added in the future
export interface CreateUploadUrlRequest extends CodeWhispererTokenClient.CreateUploadUrlRequest {}
export interface CreateUploadUrlResponse extends CodeWhispererTokenClient.CreateUploadUrlResponse {}

export interface StartTransformationRequest extends CodeWhispererTokenClient.StartTransformationRequest {}
export interface StartTransformationResponse extends CodeWhispererTokenClient.StartTransformationResponse {}

export interface StopTransformationRequest extends CodeWhispererTokenClient.StopTransformationRequest {}
export interface StopTransformationResponse extends CodeWhispererTokenClient.StopTransformationResponse {}

export interface GetTransformationRequest extends CodeWhispererTokenClient.GetTransformationRequest {}
export interface GetTransformationResponse extends CodeWhispererTokenClient.GetTransformationResponse {}

export interface GetTransformationPlanRequest extends CodeWhispererTokenClient.GetTransformationPlanRequest {}
export interface GetTransformationPlanResponse extends CodeWhispererTokenClient.GetTransformationPlanResponse {}

export interface StartCodeAnalysisRequest extends CodeWhispererTokenClient.StartCodeAnalysisRequest {}
export interface StartCodeAnalysisResponse extends CodeWhispererTokenClient.StartCodeAnalysisResponse {}

export interface GetCodeAnalysisRequest extends CodeWhispererTokenClient.GetCodeAnalysisRequest {}
export interface GetCodeAnalysisResponse extends CodeWhispererTokenClient.GetCodeAnalysisResponse {}

export interface ListCodeAnalysisFindingsRequest extends CodeWhispererTokenClient.ListCodeAnalysisFindingsRequest {}
export interface ListCodeAnalysisFindingsResponse extends CodeWhispererTokenClient.ListCodeAnalysisFindingsResponse {}

export interface ListAvailableCustomizationsRequest
    extends CodeWhispererTokenClient.ListAvailableCustomizationsRequest {}
export interface ListAvailableCustomizationsResponse
    extends CodeWhispererTokenClient.ListAvailableCustomizationsResponse {}

export interface ListAvailableProfilesRequest extends CodeWhispererTokenClient.ListAvailableProfilesRequest {}
export interface ListAvailableProfilesResponse extends CodeWhispererTokenClient.ListAvailableProfilesResponse {}

export interface SendTelemetryEventRequest extends CodeWhispererTokenClient.SendTelemetryEventRequest {}
export interface SendTelemetryEventResponse extends CodeWhispererTokenClient.SendTelemetryEventResponse {}

export interface CreateWorkspaceRequest extends CodeWhispererTokenClient.CreateWorkspaceRequest {}
export interface CreateWorkspaceResponse extends CodeWhispererTokenClient.CreateWorkspaceResponse {}

export interface ListWorkspaceMetadataRequest extends CodeWhispererTokenClient.ListWorkspaceMetadataRequest {}
export interface ListWorkspaceMetadataResponse extends CodeWhispererTokenClient.ListWorkspaceMetadataResponse {}

export interface DeleteWorkspaceRequest extends CodeWhispererTokenClient.DeleteWorkspaceRequest {}
export interface DeleteWorkspaceResponse extends CodeWhispererTokenClient.DeleteWorkspaceResponse {}

export interface ListFeatureEvaluationsRequest extends CodeWhispererTokenClient.ListFeatureEvaluationsRequest {}
export interface ListFeatureEvaluationsResponse extends CodeWhispererTokenClient.ListFeatureEvaluationsResponse {}

export interface CreateSubscriptionTokenRequest extends CodeWhispererTokenClient.CreateSubscriptionTokenRequest {}
export interface CreateSubscriptionTokenResponse extends CodeWhispererTokenClient.CreateSubscriptionTokenResponse {}

type CodeWhispererClient = CodeWhispererSigv4Client | CodeWhispererTokenClient

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

    abstract codeModernizerCreateUploadUrl(request: CreateUploadUrlRequest): Promise<CreateUploadUrlResponse>

    abstract codeModernizerStartCodeTransformation(
        request: StartTransformationRequest
    ): Promise<PromiseResult<StartTransformationResponse, AWSError>>

    abstract codeModernizerStopCodeTransformation(
        request: StopTransformationRequest
    ): Promise<PromiseResult<StopTransformationResponse, AWSError>>

    abstract codeModernizerGetCodeTransformation(
        request: GetTransformationRequest
    ): Promise<PromiseResult<GetTransformationResponse, AWSError>>

    abstract codeModernizerGetCodeTransformationPlan(
        request: GetTransformationPlanRequest
    ): Promise<PromiseResult<GetTransformationPlanResponse, AWSError>>

    abstract createUploadUrl(request: CreateUploadUrlRequest): Promise<PromiseResult<CreateUploadUrlResponse, AWSError>>

    abstract startCodeAnalysis(
        request: StartCodeAnalysisRequest
    ): Promise<PromiseResult<StartCodeAnalysisResponse, AWSError>>

    abstract getCodeAnalysis(request: GetCodeAnalysisRequest): Promise<PromiseResult<GetCodeAnalysisResponse, AWSError>>

    abstract listCodeAnalysisFindings(
        request: ListCodeAnalysisFindingsRequest
    ): Promise<PromiseResult<ListCodeAnalysisFindingsResponse, AWSError>>

    abstract listAvailableCustomizations(
        request: ListAvailableCustomizationsRequest
    ): Promise<PromiseResult<ListAvailableCustomizationsResponse, AWSError>>

    abstract listAvailableProfiles(
        request: ListAvailableProfilesRequest
    ): Promise<PromiseResult<ListAvailableProfilesRequest, AWSError>>

    abstract sendTelemetryEvent(
        request: SendTelemetryEventRequest
    ): Promise<PromiseResult<SendTelemetryEventResponse, AWSError>>

    abstract createWorkspace(request: CreateWorkspaceRequest): Promise<PromiseResult<CreateWorkspaceResponse, AWSError>>

    abstract listWorkspaceMetadata(
        request: ListWorkspaceMetadataRequest
    ): Promise<PromiseResult<ListWorkspaceMetadataResponse, AWSError>>

    abstract deleteWorkspace(request: DeleteWorkspaceRequest): Promise<PromiseResult<DeleteWorkspaceResponse, AWSError>>

    abstract listFeatureEvaluations(
        request: ListFeatureEvaluationsRequest
    ): Promise<PromiseResult<ListFeatureEvaluationsResponse, AWSError>>

    abstract createSubscriptionToken(request: CreateSubscriptionTokenRequest): Promise<CreateSubscriptionTokenResponse>
}
