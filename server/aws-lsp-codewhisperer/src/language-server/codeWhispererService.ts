import { CredentialsProvider } from '@aws/language-server-runtimes/out/features'
import { BearerCredentials } from '@aws/language-server-runtimes/out/features/auth/auth'
import { AWSError, CredentialProviderChain, Credentials } from 'aws-sdk'
import { v4 as uuidv4 } from 'uuid'
import { createCodeWhispererSigv4Client } from '../client/sigv4/codewhisperer'
import {
    CodeWhispererTokenClientConfigurationOptions,
    createCodeWhispererTokenClient,
    createCodeWhispererTokenUserClient,
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

import CodeWhispererSigv4Client = require('../client/sigv4/codewhispererclient')
import CodeWhispererTokenClient = require('../client/token/codewhispererclient')
import CodeWhispererTokenUserClient = require('../client/token/codewhispereruserclient')
import AWS = require('aws-sdk')
import { PromiseResult } from 'aws-sdk/lib/request'

// Right now the only difference between the token client and the IAM client for codewhsiperer is the difference in function name
// This abstract class can grow in the future to account for any additional changes across the clients
export abstract class CodeWhispererServiceBase {
    public shareCodeWhispererContentWithAWS: boolean = false
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
    userClient: CodeWhispererTokenUserClient
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
        const userOptions: CodeWhispererTokenClientConfigurationOptions = {
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
        this.userClient = createCodeWhispererTokenUserClient(userOptions)
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
        request: CodeWhispererTokenUserClient.CreateUploadUrlRequest
    ): Promise<CodeWhispererTokenUserClient.CreateUploadUrlResponse> {
        return this.userClient.createUploadUrl(request).promise()
    }
    /**
     * @description Use this function to start the transformation job.
     * @param request
     * @returns transformationJobId - String id for the Job
     */

    public async codeModernizerStartCodeTransformation(
        request: CodeWhispererTokenUserClient.StartTransformationRequest
    ): Promise<PromiseResult<CodeWhispererTokenUserClient.StartTransformationResponse, AWSError>> {
        return await this.userClient.startTransformation(request).promise()
    }

    /**
     * @description Use this function to stop the transformation job.
     * @param request
     * @returns transformationJobId - String id for the Job
     */
    public async codeModernizerStopCodeTransformation(
        request: CodeWhispererTokenUserClient.StopTransformationRequest
    ): Promise<PromiseResult<CodeWhispererTokenUserClient.StopTransformationResponse, AWSError>> {
        return await this.userClient.stopTransformation(request).promise()
    }

    /**
     * @description Use this function to get the status of the code transformation. We should
     * be polling this function periodically to get updated results. When this function
     * returns COMPLETED we know the transformation is done.
     */
    public async codeModernizerGetCodeTransformation(
        request: CodeWhispererTokenUserClient.GetTransformationRequest
    ): Promise<PromiseResult<CodeWhispererTokenUserClient.GetTransformationResponse, AWSError>> {
        return await this.userClient.getTransformation(request).promise()
    }

    /**
     * @description After starting a transformation use this function to display the LLM
     * transformation plan to the user.
     * @params tranformationJobId - String id returned from StartCodeTransformationResponse
     */
    public async codeModernizerGetCodeTransformationPlan(
        request: CodeWhispererTokenUserClient.GetTransformationPlanRequest
    ): Promise<PromiseResult<CodeWhispererTokenUserClient.GetTransformationPlanResponse, AWSError>> {
        return this.userClient.getTransformationPlan(request).promise()
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
