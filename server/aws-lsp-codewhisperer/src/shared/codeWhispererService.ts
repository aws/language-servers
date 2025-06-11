import {
    BearerCredentials,
    CredentialsProvider,
    CredentialsType,
    Workspace,
    Logging,
    SDKInitializator,
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

export class CodeWhispererServiceBase {
    protected readonly codeWhispererRegion?: string
    protected readonly codeWhispererEndpoint?: string
    public readonly client: CodeWhispererSigv4Client | CodeWhispererTokenClient
    public shareCodeWhispererContentWithAWS = false
    public customizationArn?: string
    public profileArn?: string
    private credentialsType!: CredentialsType | undefined

    inflightRequests: Set<AWS.Request<any, AWSError> & RequestExtras> = new Set()

    constructor(
        credentialsProvider: CredentialsProvider,
        workspace: Workspace,
        logging: Logging,
        sdkInitializator: SDKInitializator,
        codeWhispererRegion?: string,
        codeWhispererEndpoint?: string
    ) {
        this.codeWhispererRegion = codeWhispererRegion
        this.codeWhispererEndpoint = codeWhispererEndpoint
        this.credentialsType = credentialsProvider.getCredentialsType()

        if (this.credentialsType === 'iam') {
            const options: CodeWhispererSigv4ClientConfigurationOptions = {
                region: this.codeWhispererRegion,
                endpoint: this.codeWhispererEndpoint,
                credentialProvider: new CredentialProviderChain([
                    () => credentialsProvider.getCredentials() as Credentials,
                ]),
            }
            this.client = createCodeWhispererSigv4Client(options, sdkInitializator, logging)
            // Avoid overwriting any existing client listeners
            const clientRequestListeners = (this.client as CodeWhispererSigv4Client).setupRequestListeners
            ;(this.client as CodeWhispererSigv4Client).setupRequestListeners = (
                request: Request<unknown, AWSError>
            ) => {
                if (clientRequestListeners) {
                    clientRequestListeners.call(this.client, request)
                }
                request.httpRequest.headers['x-amzn-codewhisperer-optout'] = `${!this.shareCodeWhispererContentWithAWS}`
            }
        } else {
            const options: CodeWhispererTokenClientConfigurationOptions = {
                region: this.codeWhispererRegion,
                endpoint: this.codeWhispererEndpoint,
                onRequestSetup: [
                    req => {
                        this.trackRequest(req)
                        req.on('build', ({ httpRequest }) => {
                            const creds = credentialsProvider.getCredentials() as BearerCredentials
                            if (!creds?.token) {
                                throw new Error('Authorization failed, bearer token is not set')
                            }
                            httpRequest.headers['Authorization'] = `Bearer ${creds.token}`
                            httpRequest.headers['x-amzn-codewhisperer-optout'] =
                                `${!this.shareCodeWhispererContentWithAWS}`
                        })
                        req.on('complete', () => {
                            this.completeRequest(req)
                        })
                    },
                ],
            }
            this.client = createCodeWhispererTokenClient(options, sdkInitializator, logging)
        }
    }

    getCredentialsType(): CredentialsType {
        if (!this.credentialsType) {
            throw new Error('Credentials type is not set')
        }
        return this.credentialsType
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

    /**
     * Updates Service Client options after client was instantiated.
     */
    public updateClientConfig(options: ConfigurationOptions) {
        this.client.config.update(options)
    }

    generateItemId = () => uuidv4()

    private withProfileArn<T extends object>(request: T): T {
        if (!this.profileArn || this.credentialsType === 'iam') return request
        return { ...request, profileArn: this.profileArn }
    }

    async generateSuggestions(request: GenerateSuggestionsRequest): Promise<GenerateSuggestionsResponse> {
        if (this.customizationArn) {
            if (this.credentialsType === 'iam') {
                request = { ...request, customizationArn: this.customizationArn }
            } else {
                request.customizationArn = this.customizationArn
            }
        }

        if (this.credentialsType === 'iam') {
            const iamClient = this.client as CodeWhispererSigv4Client
            const response = await iamClient.generateRecommendations(request).promise()
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
        } else {
            const tokenClient = this.client as CodeWhispererTokenClient
            const response = await tokenClient.generateCompletions(this.withProfileArn(request)).promise()
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
    }

    // Token-only methods - throw error if used with IAM auth
    public async codeModernizerCreateUploadUrl(
        request: CodeWhispererTokenClient.CreateUploadUrlRequest
    ): Promise<CodeWhispererTokenClient.CreateUploadUrlResponse> {
        if (this.credentialsType !== 'bearer') {
            throw new Error('codeModernizerCreateUploadUrl is only available for token-based authentication')
        }
        const tokenClient = this.client as CodeWhispererTokenClient
        return tokenClient.createUploadUrl(this.withProfileArn(request)).promise()
    }

    public async codeModernizerStartCodeTransformation(
        request: CodeWhispererTokenClient.StartTransformationRequest
    ): Promise<PromiseResult<CodeWhispererTokenClient.StartTransformationResponse, AWSError>> {
        if (this.credentialsType !== 'bearer') {
            throw new Error('codeModernizerStartCodeTransformation is only available for token-based authentication')
        }
        const tokenClient = this.client as CodeWhispererTokenClient
        return await tokenClient.startTransformation(this.withProfileArn(request)).promise()
    }

    public async codeModernizerStopCodeTransformation(
        request: CodeWhispererTokenClient.StopTransformationRequest
    ): Promise<PromiseResult<CodeWhispererTokenClient.StopTransformationResponse, AWSError>> {
        if (this.credentialsType !== 'bearer') {
            throw new Error('codeModernizerStopCodeTransformation is only available for token-based authentication')
        }
        const tokenClient = this.client as CodeWhispererTokenClient
        return await tokenClient.stopTransformation(this.withProfileArn(request)).promise()
    }

    public async codeModernizerGetCodeTransformation(
        request: CodeWhispererTokenClient.GetTransformationRequest
    ): Promise<PromiseResult<CodeWhispererTokenClient.GetTransformationResponse, AWSError>> {
        if (this.credentialsType !== 'bearer') {
            throw new Error('codeModernizerGetCodeTransformation is only available for token-based authentication')
        }
        const tokenClient = this.client as CodeWhispererTokenClient
        return await tokenClient.getTransformation(this.withProfileArn(request)).promise()
    }

    public async codeModernizerGetCodeTransformationPlan(
        request: CodeWhispererTokenClient.GetTransformationPlanRequest
    ): Promise<PromiseResult<CodeWhispererTokenClient.GetTransformationPlanResponse, AWSError>> {
        if (this.credentialsType !== 'bearer') {
            throw new Error('codeModernizerGetCodeTransformationPlan is only available for token-based authentication')
        }
        const tokenClient = this.client as CodeWhispererTokenClient
        return tokenClient.getTransformationPlan(this.withProfileArn(request)).promise()
    }

    async createUploadUrl(
        request: CodeWhispererTokenClient.CreateUploadUrlRequest
    ): Promise<PromiseResult<CodeWhispererTokenClient.CreateUploadUrlResponse, AWSError>> {
        if (this.credentialsType !== 'bearer') {
            throw new Error('createUploadUrl is only available for token-based authentication')
        }
        const tokenClient = this.client as CodeWhispererTokenClient
        return tokenClient.createUploadUrl(this.withProfileArn(request)).promise()
    }

    async startCodeAnalysis(
        request: CodeWhispererTokenClient.StartCodeAnalysisRequest
    ): Promise<PromiseResult<CodeWhispererTokenClient.StartCodeAnalysisResponse, AWSError>> {
        if (this.credentialsType !== 'bearer') {
            throw new Error('startCodeAnalysis is only available for token-based authentication')
        }
        const tokenClient = this.client as CodeWhispererTokenClient
        return tokenClient.startCodeAnalysis(this.withProfileArn(request)).promise()
    }

    async getCodeAnalysis(
        request: CodeWhispererTokenClient.GetCodeAnalysisRequest
    ): Promise<PromiseResult<CodeWhispererTokenClient.GetCodeAnalysisResponse, AWSError>> {
        if (this.credentialsType !== 'bearer') {
            throw new Error('getCodeAnalysis is only available for token-based authentication')
        }
        const tokenClient = this.client as CodeWhispererTokenClient
        return tokenClient.getCodeAnalysis(this.withProfileArn(request)).promise()
    }

    async listCodeAnalysisFindings(
        request: CodeWhispererTokenClient.ListCodeAnalysisFindingsRequest
    ): Promise<PromiseResult<CodeWhispererTokenClient.ListCodeAnalysisFindingsResponse, AWSError>> {
        if (this.credentialsType !== 'bearer') {
            throw new Error('listCodeAnalysisFindings is only available for token-based authentication')
        }
        const tokenClient = this.client as CodeWhispererTokenClient
        return tokenClient.listCodeAnalysisFindings(this.withProfileArn(request)).promise()
    }

    async listAvailableCustomizations(request: CodeWhispererTokenClient.ListAvailableCustomizationsRequest) {
        if (this.credentialsType !== 'bearer') {
            throw new Error('listAvailableCustomizations is only available for token-based authentication')
        }
        const tokenClient = this.client as CodeWhispererTokenClient
        return tokenClient.listAvailableCustomizations(this.withProfileArn(request)).promise()
    }

    async listAvailableProfiles(request: CodeWhispererTokenClient.ListAvailableProfilesRequest) {
        if (this.credentialsType !== 'bearer') {
            throw new Error('listAvailableProfiles is only available for token-based authentication')
        }
        const tokenClient = this.client as CodeWhispererTokenClient
        return tokenClient.listAvailableProfiles(request).promise()
    }

    async sendTelemetryEvent(request: CodeWhispererTokenClient.SendTelemetryEventRequest) {
        if (this.credentialsType !== 'bearer') {
            throw new Error('sendTelemetryEvent is only available for token-based authentication')
        }
        const tokenClient = this.client as CodeWhispererTokenClient
        return tokenClient.sendTelemetryEvent(this.withProfileArn(request)).promise()
    }

    async createWorkspace(request: CodeWhispererTokenClient.CreateWorkspaceRequest) {
        if (this.credentialsType !== 'bearer') {
            throw new Error('createWorkspace is only available for token-based authentication')
        }
        const tokenClient = this.client as CodeWhispererTokenClient
        return tokenClient.createWorkspace(this.withProfileArn(request)).promise()
    }

    async listWorkspaceMetadata(request: CodeWhispererTokenClient.ListWorkspaceMetadataRequest) {
        if (this.credentialsType !== 'bearer') {
            throw new Error('listWorkspaceMetadata is only available for token-based authentication')
        }
        const tokenClient = this.client as CodeWhispererTokenClient
        return tokenClient.listWorkspaceMetadata(this.withProfileArn(request)).promise()
    }

    async deleteWorkspace(request: CodeWhispererTokenClient.DeleteWorkspaceRequest) {
        if (this.credentialsType !== 'bearer') {
            throw new Error('deleteWorkspace is only available for token-based authentication')
        }
        const tokenClient = this.client as CodeWhispererTokenClient
        return tokenClient.deleteWorkspace(this.withProfileArn(request)).promise()
    }

    async listFeatureEvaluations(request: CodeWhispererTokenClient.ListFeatureEvaluationsRequest) {
        if (this.credentialsType !== 'bearer') {
            throw new Error('listFeatureEvaluations is only available for token-based authentication')
        }
        const tokenClient = this.client as CodeWhispererTokenClient
        return tokenClient.listFeatureEvaluations(this.withProfileArn(request)).promise()
    }
}

// import {
//     BearerCredentials,
//     CredentialsProvider,
//     CredentialsType,
//     Workspace,
//     Logging,
//     SDKInitializator,
// } from '@aws/language-server-runtimes/server-interface'
// import { AWSError, ConfigurationOptions, CredentialProviderChain, Credentials } from 'aws-sdk'
// import { PromiseResult } from 'aws-sdk/lib/request'
// import { Request } from 'aws-sdk/lib/core'
// import { v4 as uuidv4 } from 'uuid'
// import {
//     CodeWhispererSigv4ClientConfigurationOptions,
//     createCodeWhispererSigv4Client,
// } from '../client/sigv4/codewhisperer'
// import {
//     CodeWhispererTokenClientConfigurationOptions,
//     createCodeWhispererTokenClient,
//     RequestExtras,
// } from '../client/token/codewhisperer'

// // Define our own Suggestion interface to wrap the differences between Token and IAM Client
// export interface Suggestion extends CodeWhispererTokenClient.Completion, CodeWhispererSigv4Client.Recommendation {
//     itemId: string
// }

// export interface GenerateSuggestionsRequest
//     extends CodeWhispererTokenClient.GenerateCompletionsRequest,
//         CodeWhispererSigv4Client.GenerateRecommendationsRequest {
//     maxResults: number
// }

// export type FileContext = GenerateSuggestionsRequest['fileContext']

// export interface ResponseContext {
//     requestId: string
//     codewhispererSessionId: string
//     nextToken?: string
// }

// export interface GenerateSuggestionsResponse {
//     suggestions: Suggestion[]
//     responseContext: ResponseContext
// }

// import CodeWhispererSigv4Client = require('../client/sigv4/codewhisperersigv4client')
// import CodeWhispererTokenClient = require('../client/token/codewhispererbearertokenclient')

// // Right now the only difference between the token client and the IAM client for codewhsiperer is the difference in function name
// // This abstract class can grow in the future to account for any additional changes across the clients
// export abstract class CodeWhispererServiceBase {
//     protected readonly codeWhispererRegion
//     protected readonly codeWhispererEndpoint
//     public shareCodeWhispererContentWithAWS = false
//     public customizationArn?: string
//     public profileArn?: string
//     abstract client: CodeWhispererSigv4Client | CodeWhispererTokenClient

//     inflightRequests: Set<AWS.Request<any, AWSError> & RequestExtras> = new Set()

//     abortInflightRequests() {
//         this.inflightRequests.forEach(request => {
//             request.abort()
//         })
//         this.inflightRequests.clear()
//     }

//     trackRequest(request: AWS.Request<any, AWSError> & RequestExtras) {
//         this.inflightRequests.add(request)
//     }

//     completeRequest(request: AWS.Request<any, AWSError> & RequestExtras) {
//         this.inflightRequests.delete(request)
//     }

//     abstract getCredentialsType(): CredentialsType

//     abstract generateSuggestions(request: GenerateSuggestionsRequest): Promise<GenerateSuggestionsResponse>

//     constructor(codeWhispererRegion: string, codeWhispererEndpoint: string) {
//         this.codeWhispererRegion = codeWhispererRegion
//         this.codeWhispererEndpoint = codeWhispererEndpoint
//     }

//     /**
//      * Updates Service Client options after client was instantiated.
//      */
//     public updateClientConfig(options: ConfigurationOptions) {
//         this.client.config.update(options)
//     }

//     generateItemId = () => uuidv4()
// }

// export class CodeWhispererServiceIAM extends CodeWhispererServiceBase {
//     client: CodeWhispererSigv4Client
//     constructor(
//         credentialsProvider: CredentialsProvider,
//         workspace: Workspace,
//         logging: Logging,
//         codeWhispererRegion: string,
//         codeWhispererEndpoint: string,
//         sdkInitializator: SDKInitializator
//     ) {
//         super(codeWhispererRegion, codeWhispererEndpoint)
//         const options: CodeWhispererSigv4ClientConfigurationOptions = {
//             region: this.codeWhispererRegion,
//             endpoint: this.codeWhispererEndpoint,
//             credentialProvider: new CredentialProviderChain([
//                 () => credentialsProvider.getCredentials() as Credentials,
//             ]),
//         }
//         this.client = createCodeWhispererSigv4Client(options, sdkInitializator, logging)
//         // Avoid overwriting any existing client listeners
//         const clientRequestListeners = this.client.setupRequestListeners
//         this.client.setupRequestListeners = (request: Request<unknown, AWSError>) => {
//             if (clientRequestListeners) {
//                 clientRequestListeners.call(this.client, request)
//             }
//             request.httpRequest.headers['x-amzn-codewhisperer-optout'] = `${!this.shareCodeWhispererContentWithAWS}`
//         }
//     }

//     getCredentialsType(): CredentialsType {
//         return 'iam'
//     }

//     async generateSuggestions(request: GenerateSuggestionsRequest): Promise<GenerateSuggestionsResponse> {
//         // add cancellation check
//         // add error check
//         if (this.customizationArn) request = { ...request, customizationArn: this.customizationArn }

//         const response = await this.client.generateRecommendations(request).promise()
//         const responseContext = {
//             requestId: response?.$response?.requestId,
//             codewhispererSessionId: response?.$response?.httpResponse?.headers['x-amzn-sessionid'],
//             nextToken: response.nextToken,
//         }

//         for (const recommendation of response?.recommendations ?? []) {
//             Object.assign(recommendation, { itemId: this.generateItemId() })
//         }

//         return {
//             suggestions: response.recommendations as Suggestion[],
//             responseContext,
//         }
//     }
// }

// export class CodeWhispererServiceToken extends CodeWhispererServiceBase {
//     client: CodeWhispererTokenClient

//     constructor(
//         credentialsProvider: CredentialsProvider,
//         workspace: Workspace,
//         logging: Logging,
//         codeWhispererRegion: string,
//         codeWhispererEndpoint: string,
//         sdkInitializator: SDKInitializator
//     ) {
//         super(codeWhispererRegion, codeWhispererEndpoint)
//         const options: CodeWhispererTokenClientConfigurationOptions = {
//             region: this.codeWhispererRegion,
//             endpoint: this.codeWhispererEndpoint,
//             onRequestSetup: [
//                 req => {
//                     this.trackRequest(req)
//                     req.on('build', ({ httpRequest }) => {
//                         const creds = credentialsProvider.getCredentials() as BearerCredentials
//                         if (!creds?.token) {
//                             throw new Error('Authorization failed, bearer token is not set')
//                         }
//                         httpRequest.headers['Authorization'] = `Bearer ${creds.token}`
//                         httpRequest.headers['x-amzn-codewhisperer-optout'] = `${!this.shareCodeWhispererContentWithAWS}`
//                     })
//                     req.on('complete', () => {
//                         this.completeRequest(req)
//                     })
//                 },
//             ],
//         }
//         this.client = createCodeWhispererTokenClient(options, sdkInitializator, logging)
//     }

//     getCredentialsType(): CredentialsType {
//         return 'bearer'
//     }

//     private withProfileArn<T extends object>(request: T): T {
//         if (!this.profileArn) return request

//         return { ...request, profileArn: this.profileArn }
//     }

//     async generateSuggestions(request: GenerateSuggestionsRequest): Promise<GenerateSuggestionsResponse> {
//         // add cancellation check
//         // add error check
//         if (this.customizationArn) request.customizationArn = this.customizationArn

//         const response = await this.client.generateCompletions(this.withProfileArn(request)).promise()
//         const responseContext = {
//             requestId: response?.$response?.requestId,
//             codewhispererSessionId: response?.$response?.httpResponse?.headers['x-amzn-sessionid'],
//             nextToken: response.nextToken,
//         }

//         for (const recommendation of response?.completions ?? []) {
//             Object.assign(recommendation, { itemId: this.generateItemId() })
//         }

//         return {
//             suggestions: response.completions as Suggestion[],
//             responseContext,
//         }
//     }
//     public async codeModernizerCreateUploadUrl(
//         request: CodeWhispererTokenClient.CreateUploadUrlRequest
//     ): Promise<CodeWhispererTokenClient.CreateUploadUrlResponse> {
//         return this.client.createUploadUrl(this.withProfileArn(request)).promise()
//     }
//     /**
//      * @description Use this function to start the transformation job.
//      * @param request
//      * @returns transformationJobId - String id for the Job
//      */

//     public async codeModernizerStartCodeTransformation(
//         request: CodeWhispererTokenClient.StartTransformationRequest
//     ): Promise<PromiseResult<CodeWhispererTokenClient.StartTransformationResponse, AWSError>> {
//         return await this.client.startTransformation(this.withProfileArn(request)).promise()
//     }

//     /**
//      * @description Use this function to stop the transformation job.
//      * @param request
//      * @returns transformationJobId - String id for the Job
//      */
//     public async codeModernizerStopCodeTransformation(
//         request: CodeWhispererTokenClient.StopTransformationRequest
//     ): Promise<PromiseResult<CodeWhispererTokenClient.StopTransformationResponse, AWSError>> {
//         return await this.client.stopTransformation(this.withProfileArn(request)).promise()
//     }

//     /**
//      * @description Use this function to get the status of the code transformation. We should
//      * be polling this function periodically to get updated results. When this function
//      * returns COMPLETED we know the transformation is done.
//      */
//     public async codeModernizerGetCodeTransformation(
//         request: CodeWhispererTokenClient.GetTransformationRequest
//     ): Promise<PromiseResult<CodeWhispererTokenClient.GetTransformationResponse, AWSError>> {
//         return await this.client.getTransformation(this.withProfileArn(request)).promise()
//     }

//     /**
//      * @description After starting a transformation use this function to display the LLM
//      * transformation plan to the user.
//      * @params tranformationJobId - String id returned from StartCodeTransformationResponse
//      */
//     public async codeModernizerGetCodeTransformationPlan(
//         request: CodeWhispererTokenClient.GetTransformationPlanRequest
//     ): Promise<PromiseResult<CodeWhispererTokenClient.GetTransformationPlanResponse, AWSError>> {
//         return this.client.getTransformationPlan(this.withProfileArn(request)).promise()
//     }

//     /**
//      * @description get a pre-signed url to upload source code into S3 bucket
//      */
//     async createUploadUrl(
//         request: CodeWhispererTokenClient.CreateUploadUrlRequest
//     ): Promise<PromiseResult<CodeWhispererTokenClient.CreateUploadUrlResponse, AWSError>> {
//         return this.client.createUploadUrl(this.withProfileArn(request)).promise()
//     }

//     /**
//      * @description Once source code uploaded to S3, send a request to run security scan on uploaded source code.
//      */
//     async startCodeAnalysis(
//         request: CodeWhispererTokenClient.StartCodeAnalysisRequest
//     ): Promise<PromiseResult<CodeWhispererTokenClient.StartCodeAnalysisResponse, AWSError>> {
//         return this.client.startCodeAnalysis(this.withProfileArn(request)).promise()
//     }

//     /**
//      * @description Send a request to get the code scan status detail.
//      */
//     async getCodeAnalysis(
//         request: CodeWhispererTokenClient.GetCodeAnalysisRequest
//     ): Promise<PromiseResult<CodeWhispererTokenClient.GetCodeAnalysisResponse, AWSError>> {
//         return this.client.getCodeAnalysis(this.withProfileArn(request)).promise()
//     }

//     /**
//      * @description Once scan completed successfully, send a request to get list of all the findings for the given scan.
//      */
//     async listCodeAnalysisFindings(
//         request: CodeWhispererTokenClient.ListCodeAnalysisFindingsRequest
//     ): Promise<PromiseResult<CodeWhispererTokenClient.ListCodeAnalysisFindingsResponse, AWSError>> {
//         return this.client.listCodeAnalysisFindings(this.withProfileArn(request)).promise()
//     }

//     /**
//      * @description Get list of available customizations
//      */
//     async listAvailableCustomizations(request: CodeWhispererTokenClient.ListAvailableCustomizationsRequest) {
//         return this.client.listAvailableCustomizations(this.withProfileArn(request)).promise()
//     }

//     /**
//      * @description Get list of available profiles
//      */
//     async listAvailableProfiles(request: CodeWhispererTokenClient.ListAvailableProfilesRequest) {
//         return this.client.listAvailableProfiles(request).promise()
//     }

//     /**
//      * @description send telemetry event to code whisperer data warehouse
//      */
//     async sendTelemetryEvent(request: CodeWhispererTokenClient.SendTelemetryEventRequest) {
//         return this.client.sendTelemetryEvent(this.withProfileArn(request)).promise()
//     }

//     /**
//      * @description create a remote workspace
//      */
//     async createWorkspace(request: CodeWhispererTokenClient.CreateWorkspaceRequest) {
//         return this.client.createWorkspace(this.withProfileArn(request)).promise()
//     }

//     /**
//      * @description get list of workspace metadata
//      */
//     async listWorkspaceMetadata(request: CodeWhispererTokenClient.ListWorkspaceMetadataRequest) {
//         return this.client.listWorkspaceMetadata(this.withProfileArn(request)).promise()
//     }

//     /**
//      * @description delete the remote workspace
//      */
//     async deleteWorkspace(request: CodeWhispererTokenClient.DeleteWorkspaceRequest) {
//         return this.client.deleteWorkspace(this.withProfileArn(request)).promise()
//     }

//     /*
//      * @description get the list of feature evaluations
//      */
//     async listFeatureEvaluations(request: CodeWhispererTokenClient.ListFeatureEvaluationsRequest) {
//         return this.client.listFeatureEvaluations(this.withProfileArn(request)).promise()
//     }
// }
