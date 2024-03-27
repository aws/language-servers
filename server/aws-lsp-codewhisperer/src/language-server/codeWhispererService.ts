import { CredentialsProvider, BearerCredentials } from '@aws/language-server-runtimes/server-interface'
import { AWSError, CredentialProviderChain, Credentials } from 'aws-sdk'
import { PromiseResult } from 'aws-sdk/lib/request'
import { v4 as uuidv4 } from 'uuid'
import { createCodeWhispererSigv4Client } from '../client/sigv4/codewhisperer'
import {
    CodeWhispererTokenClientConfigurationOptions,
    createCodeWhispererTokenClient,
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
import AWS = require('aws-sdk')

// Right now the only difference between the token client and the IAM client for codewhsiperer is the difference in function name
// This abstract class can grow in the future to account for any additional changes across the clients
export abstract class CodeWhispererServiceBase {
    public shareCodeWhispererContentWithAWS = false
    abstract client: CodeWhispererSigv4Client | CodeWhispererTokenClient

    abstract generateSuggestions(request: GenerateSuggestionsRequest): Promise<GenerateSuggestionsResponse>
}

export class CodeWhispererServiceIAM extends CodeWhispererServiceBase {
    client: CodeWhispererSigv4Client
    private readonly codeWhispererRegion = 'us-east-1'
    private readonly codeWhispererEndpoint = 'https://codewhisperer.us-east-1.amazonaws.com/'

    constructor(credentialsProvider: CredentialsProvider) {
        super()

        const options: CodeWhispererTokenClientConfigurationOptions = {
            region: this.codeWhispererRegion,
            endpoint: this.codeWhispererEndpoint,
            credentialProvider: new CredentialProviderChain([
                () => credentialsProvider.getCredentials('iam') as Credentials,
            ]),
            onRequestSetup: [
                req => {
                    req.on('build', ({ httpRequest }) => {
                        httpRequest.headers['x-amzn-codewhisperer-optout'] = `${!this.shareCodeWhispererContentWithAWS}`
                    })
                },
            ],
        }
        this.client = createCodeWhispererSigv4Client(options)
    }

    async generateSuggestions(request: GenerateSuggestionsRequest): Promise<GenerateSuggestionsResponse> {
        // add cancellation check
        // add error check

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

    generateItemId = () => uuidv4()
}

export class CodeWhispererServiceToken extends CodeWhispererServiceBase {
    client: CodeWhispererTokenClient
    private readonly codeWhispererRegion = 'us-east-1'
    private readonly codeWhispererEndpoint = 'https://codewhisperer.us-east-1.amazonaws.com/'

    constructor(credentialsProvider: CredentialsProvider, additionalAwsConfig: any) {
        super()
        this.updateAwsConfiguration(additionalAwsConfig)

        const options: CodeWhispererTokenClientConfigurationOptions = {
            region: this.codeWhispererRegion,
            endpoint: this.codeWhispererEndpoint,
            onRequestSetup: [
                req => {
                    req.on('build', ({ httpRequest }) => {
                        const creds = credentialsProvider.getCredentials('bearer') as BearerCredentials
                        if (!creds?.token) {
                            throw new Error('Authorization failed, bearer token is not set')
                        }
                        httpRequest.headers['Authorization'] = `Bearer ${creds.token}`
                        httpRequest.headers['x-amzn-codewhisperer-optout'] = `${!this.shareCodeWhispererContentWithAWS}`
                    })
                },
            ],
        }
        this.client = createCodeWhispererTokenClient(options)
    }

    async generateSuggestions(request: GenerateSuggestionsRequest): Promise<GenerateSuggestionsResponse> {
        // add cancellation check
        // add error check

        const response = await this.client.generateCompletions(request).promise()
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
        return this.client.createUploadUrl(request).promise()
    }
    /**
     * @description Use this function to start the transformation job.
     * @param request
     * @returns transformationJobId - String id for the Job
     */

    public async codeModernizerStartCodeTransformation(
        request: CodeWhispererTokenClient.StartTransformationRequest
    ): Promise<PromiseResult<CodeWhispererTokenClient.StartTransformationResponse, AWSError>> {
        return await this.client.startTransformation(request).promise()
    }

    /**
     * @description Use this function to stop the transformation job.
     * @param request
     * @returns transformationJobId - String id for the Job
     */
    public async codeModernizerStopCodeTransformation(
        request: CodeWhispererTokenClient.StopTransformationRequest
    ): Promise<PromiseResult<CodeWhispererTokenClient.StopTransformationResponse, AWSError>> {
        return await this.client.stopTransformation(request).promise()
    }

    /**
     * @description Use this function to get the status of the code transformation. We should
     * be polling this function periodically to get updated results. When this function
     * returns COMPLETED we know the transformation is done.
     */
    public async codeModernizerGetCodeTransformation(
        request: CodeWhispererTokenClient.GetTransformationRequest
    ): Promise<PromiseResult<CodeWhispererTokenClient.GetTransformationResponse, AWSError>> {
        return await this.client.getTransformation(request).promise()
    }

    /**
     * @description After starting a transformation use this function to display the LLM
     * transformation plan to the user.
     * @params tranformationJobId - String id returned from StartCodeTransformationResponse
     */
    public async codeModernizerGetCodeTransformationPlan(
        request: CodeWhispererTokenClient.GetTransformationPlanRequest
    ): Promise<PromiseResult<CodeWhispererTokenClient.GetTransformationPlanResponse, AWSError>> {
        return this.client.getTransformationPlan(request).promise()
    }

    /**
     * @description get a pre-signed url to upload source code into S3 bucket
     */
    async createUploadUrl(
        request: CodeWhispererTokenClient.CreateUploadUrlRequest
    ): Promise<PromiseResult<CodeWhispererTokenClient.CreateUploadUrlResponse, AWSError>> {
        return this.client.createUploadUrl(request).promise()
    }

    /**
     * @description Once source code uploaded to S3, send a request to run security scan on uploaded source code.
     */
    async startCodeAnalysis(
        request: CodeWhispererTokenClient.StartCodeAnalysisRequest
    ): Promise<PromiseResult<CodeWhispererTokenClient.StartCodeAnalysisResponse, AWSError>> {
        return this.client.startCodeAnalysis(request).promise()
    }

    /**
     * @description Send a request to get the code scan status detail.
     */
    async getCodeAnalysis(
        request: CodeWhispererTokenClient.GetCodeAnalysisRequest
    ): Promise<PromiseResult<CodeWhispererTokenClient.GetCodeAnalysisResponse, AWSError>> {
        return this.client.getCodeAnalysis(request).promise()
    }

    /**
     * @description Once scan completed successfully, send a request to get list of all the findings for the given scan.
     */
    async listCodeAnalysisFindings(
        request: CodeWhispererTokenClient.ListCodeAnalysisFindingsRequest
    ): Promise<PromiseResult<CodeWhispererTokenClient.ListCodeAnalysisFindingsResponse, AWSError>> {
        return this.client.listCodeAnalysisFindings(request).promise()
    }

    updateAwsConfiguration = (awsConfig: any) => {
        if (awsConfig.proxy) {
            AWS.config.update({
                httpOptions: { agent: awsConfig.proxy },
            })
        }
    }

    generateItemId = () => uuidv4()
}
