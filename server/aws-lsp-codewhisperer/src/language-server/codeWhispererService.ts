import { CredentialsProvider } from '@aws-placeholder/aws-language-server-runtimes/out/features'
import { BearerCredentials } from '@aws-placeholder/aws-language-server-runtimes/out/features/auth/auth'
import { CredentialProviderChain, Credentials } from 'aws-sdk'
import { createCodeWhispererSigv4Client } from '../client/sigv4/codewhisperer'
import {
    CodeWhispererTokenClientConfigurationOptions,
    createCodeWhispererTokenClient,
} from '../client/token/codewhisperer'

// Define our own Suggestion interface to wrap the differences between Token and IAM Client
export interface Suggestion extends CodeWhispererTokenClient.Completion, CodeWhispererSigv4Client.Recommendation {}

export interface GenerateSuggestionsRequest
    extends CodeWhispererTokenClient.GenerateCompletionsRequest,
        CodeWhispererSigv4Client.GenerateRecommendationsRequest {
    maxResults: number
}

import CodeWhispererSigv4Client = require('../client/sigv4/codewhispererclient')
import CodeWhispererTokenClient = require('../client/token/codewhispererclient')

// Right now the only difference between the token client and the IAM client for codewhsiperer is the difference in function name
// This abstract class can grow in the future to account for any additional changes across the clients
export abstract class CodeWhispererServiceBase {
    public shareCodeWhispererContentWithAWS: boolean = true
    abstract client: CodeWhispererSigv4Client | CodeWhispererTokenClient

    abstract generateSuggestions(request: GenerateSuggestionsRequest): Promise<Suggestion[]>
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
                        if (!this.shareCodeWhispererContentWithAWS) {
                            httpRequest.headers['x-amzn-codewhisperer-optout'] = ''
                        }
                    })
                },
            ],
        }
        this.client = createCodeWhispererSigv4Client(options)
    }

    async generateSuggestions(request: GenerateSuggestionsRequest): Promise<Suggestion[]> {
        const results: Suggestion[] = []
        do {
            // add cancellation check
            // add error check

            const response = await this.client.generateRecommendations(request).promise()

            request.nextToken = response.nextToken

            if (response.recommendations) {
                results.push(...response.recommendations)
            }
        } while (request.nextToken !== undefined && request.nextToken !== '' && results.length < request.maxResults)

        return results
    }
}

export class CodeWhispererServiceToken extends CodeWhispererServiceBase {
    client: CodeWhispererTokenClient
    private readonly codeWhispererRegion = 'us-east-1'
    private readonly codeWhispererEndpoint = 'https://codewhisperer.us-east-1.amazonaws.com/'

    constructor(credentialsProvider: CredentialsProvider) {
        super()

        const options: CodeWhispererTokenClientConfigurationOptions = {
            region: this.codeWhispererRegion,
            endpoint: this.codeWhispererEndpoint,
            onRequestSetup: [
                req => {
                    req.on('build', ({ httpRequest }) => {
                        const creds = credentialsProvider.getCredentials('bearer') as BearerCredentials
                        httpRequest.headers['Authorization'] = `Bearer ${creds.token}`
                        if (!this.shareCodeWhispererContentWithAWS) {
                            httpRequest.headers['x-amzn-codewhisperer-optout'] = ''
                        }
                    })
                },
            ],
        }
        this.client = createCodeWhispererTokenClient(options)
    }

    async generateSuggestions(request: GenerateSuggestionsRequest): Promise<Suggestion[]> {
        const results: Suggestion[] = []

        do {
            // add cancellation check
            // add error check

            const response = await this.client.generateCompletions(request).promise()

            request.nextToken = response.nextToken

            if (response.completions) {
                results.push(...response.completions)
            }
        } while (request.nextToken !== undefined && request.nextToken !== '' && results.length < request.maxResults)

        return results
    }
}
