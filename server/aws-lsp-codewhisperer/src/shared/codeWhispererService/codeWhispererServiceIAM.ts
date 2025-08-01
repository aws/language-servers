import {
    CredentialsProvider,
    CredentialsType,
    Workspace,
    Logging,
    SDKInitializator,
} from '@aws/language-server-runtimes/server-interface'
import { AWSError, CredentialProviderChain, Credentials } from 'aws-sdk'
import { Request } from 'aws-sdk/lib/core'
import {
    CodeWhispererSigv4ClientConfigurationOptions,
    createCodeWhispererSigv4Client,
} from '../../client/sigv4/codewhisperer'
import CodeWhispererSigv4Client = require('../../client/sigv4/codewhisperersigv4client')
import CodeWhispererTokenClient = require('../../client/token/codewhispererbearertokenclient')
import {
    CodeWhispererServiceBase,
    CreateSubscriptionTokenRequest,
    CreateSubscriptionTokenResponse,
    CreateUploadUrlRequest,
    CreateUploadUrlResponse,
    CreateWorkspaceRequest,
    CreateWorkspaceResponse,
    DeleteWorkspaceRequest,
    DeleteWorkspaceResponse,
    GenerateSuggestionsRequest,
    GenerateSuggestionsResponse,
    GetCodeAnalysisRequest,
    GetCodeAnalysisResponse,
    GetTransformationPlanRequest,
    GetTransformationPlanResponse,
    GetTransformationRequest,
    GetTransformationResponse,
    ListAvailableCustomizationsRequest,
    ListAvailableCustomizationsResponse,
    ListAvailableProfilesRequest,
    ListAvailableProfilesResponse,
    ListCodeAnalysisFindingsRequest,
    ListCodeAnalysisFindingsResponse,
    ListFeatureEvaluationsRequest,
    ListFeatureEvaluationsResponse,
    ListWorkspaceMetadataRequest,
    ListWorkspaceMetadataResponse,
    SendTelemetryEventRequest,
    SendTelemetryEventResponse,
    StartCodeAnalysisRequest,
    StartCodeAnalysisResponse,
    StartTransformationRequest,
    StartTransformationResponse,
    StopTransformationRequest,
    StopTransformationResponse,
    Suggestion,
    SuggestionType,
} from './codeWhispererServiceBase'
import { PromiseResult } from 'aws-sdk/lib/request'

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

    async codeModernizerCreateUploadUrl(request: CreateUploadUrlRequest): Promise<CreateUploadUrlResponse> {
        throw new Error('Method not implemented.')
    }

    async codeModernizerStartCodeTransformation(
        request: StartTransformationRequest
    ): Promise<PromiseResult<StartTransformationResponse, AWSError>> {
        throw new Error('Method not implemented.')
    }

    async codeModernizerStopCodeTransformation(
        request: StopTransformationRequest
    ): Promise<PromiseResult<StopTransformationResponse, AWSError>> {
        throw new Error('Method not implemented.')
    }

    async codeModernizerGetCodeTransformation(
        request: GetTransformationRequest
    ): Promise<PromiseResult<GetTransformationResponse, AWSError>> {
        throw new Error('Method not implemented.')
    }

    async codeModernizerGetCodeTransformationPlan(
        request: GetTransformationPlanRequest
    ): Promise<PromiseResult<GetTransformationPlanResponse, AWSError>> {
        throw new Error('Method not implemented.')
    }

    async createUploadUrl(request: CreateUploadUrlRequest): Promise<PromiseResult<CreateUploadUrlResponse, AWSError>> {
        throw new Error('Method not implemented.')
    }

    async startCodeAnalysis(
        request: StartCodeAnalysisRequest
    ): Promise<PromiseResult<StartCodeAnalysisResponse, AWSError>> {
        throw new Error('Method not implemented.')
    }

    async getCodeAnalysis(request: GetCodeAnalysisRequest): Promise<PromiseResult<GetCodeAnalysisResponse, AWSError>> {
        throw new Error('Method not implemented.')
    }

    async listCodeAnalysisFindings(
        request: ListCodeAnalysisFindingsRequest
    ): Promise<PromiseResult<ListCodeAnalysisFindingsResponse, AWSError>> {
        throw new Error('Method not implemented.')
    }

    async listAvailableCustomizations(
        request: ListAvailableCustomizationsRequest
    ): Promise<PromiseResult<ListAvailableCustomizationsResponse, AWSError>> {
        throw new Error('Method not implemented.')
    }

    async listAvailableProfiles(
        request: ListAvailableProfilesRequest
    ): Promise<PromiseResult<ListAvailableProfilesResponse, AWSError>> {
        throw new Error('Method not implemented.')
    }

    async sendTelemetryEvent(
        request: SendTelemetryEventRequest
    ): Promise<PromiseResult<SendTelemetryEventResponse, AWSError>> {
        throw new Error('Method not implemented.')
    }

    async createWorkspace(request: CreateWorkspaceRequest): Promise<PromiseResult<CreateWorkspaceResponse, AWSError>> {
        throw new Error('Method not implemented.')
    }

    async listWorkspaceMetadata(
        request: ListWorkspaceMetadataRequest
    ): Promise<PromiseResult<ListWorkspaceMetadataResponse, AWSError>> {
        throw new Error('Method not implemented.')
    }

    async deleteWorkspace(request: DeleteWorkspaceRequest): Promise<PromiseResult<DeleteWorkspaceResponse, AWSError>> {
        throw new Error('Method not implemented.')
    }

    async listFeatureEvaluations(
        request: ListFeatureEvaluationsRequest
    ): Promise<PromiseResult<ListFeatureEvaluationsResponse, AWSError>> {
        throw new Error('Method not implemented.')
    }

    async createSubscriptionToken(request: CreateSubscriptionTokenRequest): Promise<CreateSubscriptionTokenResponse> {
        throw new Error('Method not implemented.')
    }
}
