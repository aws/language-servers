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
    GenerateSuggestionsRequest,
    GenerateSuggestionsResponse,
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

    public async codeModernizerCreateUploadUrl(
        request: CodeWhispererTokenClient.CreateUploadUrlRequest
    ): Promise<CodeWhispererTokenClient.CreateUploadUrlResponse> {
        throw new Error('Method not implemented.')
    }
    public async codeModernizerStartCodeTransformation(
        request: CodeWhispererTokenClient.StartTransformationRequest
    ): Promise<PromiseResult<CodeWhispererTokenClient.StartTransformationResponse, AWSError>> {
        throw new Error('Method not implemented.')
    }
    public async codeModernizerStopCodeTransformation(
        request: CodeWhispererTokenClient.StopTransformationRequest
    ): Promise<PromiseResult<CodeWhispererTokenClient.StopTransformationResponse, AWSError>> {
        throw new Error('Method not implemented.')
    }
    public async codeModernizerGetCodeTransformation(
        request: CodeWhispererTokenClient.GetTransformationRequest
    ): Promise<PromiseResult<CodeWhispererTokenClient.GetTransformationResponse, AWSError>> {
        throw new Error('Method not implemented.')
    }
    public async codeModernizerGetCodeTransformationPlan(
        request: CodeWhispererTokenClient.GetTransformationPlanRequest
    ): Promise<PromiseResult<CodeWhispererTokenClient.GetTransformationPlanResponse, AWSError>> {
        throw new Error('Method not implemented.')
    }
    public async createUploadUrl(
        request: CodeWhispererTokenClient.CreateUploadUrlRequest
    ): Promise<PromiseResult<CodeWhispererTokenClient.CreateUploadUrlResponse, AWSError>> {
        throw new Error('Method not implemented.')
    }
    public async startCodeAnalysis(
        request: CodeWhispererTokenClient.StartCodeAnalysisRequest
    ): Promise<PromiseResult<CodeWhispererTokenClient.StartCodeAnalysisResponse, AWSError>> {
        throw new Error('Method not implemented.')
    }
    public async getCodeAnalysis(
        request: CodeWhispererTokenClient.GetCodeAnalysisRequest
    ): Promise<PromiseResult<CodeWhispererTokenClient.GetCodeAnalysisResponse, AWSError>> {
        throw new Error('Method not implemented.')
    }
    public async listCodeAnalysisFindings(
        request: CodeWhispererTokenClient.ListCodeAnalysisFindingsRequest
    ): Promise<PromiseResult<CodeWhispererTokenClient.ListCodeAnalysisFindingsResponse, AWSError>> {
        throw new Error('Method not implemented.')
    }
    public async listAvailableCustomizations(
        request: CodeWhispererTokenClient.ListAvailableCustomizationsRequest
    ): Promise<PromiseResult<CodeWhispererTokenClient.ListAvailableCustomizationsResponse, AWSError>> {
        throw new Error('Method not implemented.')
    }
    public async listAvailableProfiles(
        request: CodeWhispererTokenClient.ListAvailableProfilesRequest
    ): Promise<PromiseResult<CodeWhispererTokenClient.ListAvailableProfilesRequest, AWSError>> {
        throw new Error('Method not implemented.')
    }
    public async sendTelemetryEvent(
        request: CodeWhispererTokenClient.SendTelemetryEventRequest
    ): Promise<PromiseResult<CodeWhispererTokenClient.SendTelemetryEventResponse, AWSError>> {
        throw new Error('Method not implemented.')
    }
    public async createWorkspace(
        request: CodeWhispererTokenClient.CreateWorkspaceRequest
    ): Promise<PromiseResult<CodeWhispererTokenClient.CreateWorkspaceResponse, AWSError>> {
        throw new Error('Method not implemented.')
    }
    public async listWorkspaceMetadata(
        request: CodeWhispererTokenClient.ListWorkspaceMetadataRequest
    ): Promise<PromiseResult<CodeWhispererTokenClient.ListWorkspaceMetadataResponse, AWSError>> {
        throw new Error('Method not implemented.')
    }
    public async deleteWorkspace(
        request: CodeWhispererTokenClient.DeleteWorkspaceRequest
    ): Promise<PromiseResult<CodeWhispererTokenClient.DeleteWorkspaceResponse, AWSError>> {
        throw new Error('Method not implemented.')
    }
    public async listFeatureEvaluations(
        request: CodeWhispererTokenClient.ListFeatureEvaluationsRequest
    ): Promise<PromiseResult<CodeWhispererTokenClient.ListFeatureEvaluationsResponse, AWSError>> {
        throw new Error('Method not implemented.')
    }
}
