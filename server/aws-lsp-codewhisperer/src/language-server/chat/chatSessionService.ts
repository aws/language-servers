import {
    CodeWhispererStreaming,
    GenerateAssistantResponseCommandInput,
    GenerateAssistantResponseCommandOutput,
} from '@amzn/codewhisperer-streaming'
import { ConfiguredRetryStrategy } from '@aws-sdk/util-retry'
import { CredentialsProvider } from '@aws/language-server-runtimes/server-interface'
import { AbortController } from '@smithy/abort-controller'
import { addProxyToClient } from 'aws-sdk-v3-proxy'
import { getBearerTokenFromProvider } from '../utils'

export class ChatSessionService {
    public shareCodeWhispererContentWithAWS = false
    readonly #codeWhispererRegion = 'us-east-1'
    readonly #codeWhispererEndpoint = 'https://codewhisperer.us-east-1.amazonaws.com/'
    #client: CodeWhispererStreaming
    #abortController?: AbortController
    #sessionId?: string

    public get sessionId(): string | undefined {
        return this.#sessionId
    }

    public set sessionId(value: string | undefined) {
        this.#sessionId = value
    }

    constructor(credentialsProvider: CredentialsProvider) {
        const steamingClient = new CodeWhispererStreaming({
            region: this.#codeWhispererRegion,
            endpoint: this.#codeWhispererEndpoint,
            token: () => Promise.resolve({ token: getBearerTokenFromProvider(credentialsProvider) }),
            retryStrategy: new ConfiguredRetryStrategy(0, (attempt: number) => 500 + attempt ** 10),
        })

        /**
         * Streaming client use v3 sdk so there is no longer a global configuration for proxy
         *
         * addProxyToClient detects environment variables and determines whether or not to attach proxy
         */

        this.#client = addProxyToClient(steamingClient, { throwOnNoProxy: false })
    }

    public async generateAssistantResponse(
        request: GenerateAssistantResponseCommandInput
    ): Promise<GenerateAssistantResponseCommandOutput> {
        this.#abortController = new AbortController()

        if (this.#sessionId && request.conversationState) {
            request.conversationState.conversationId = this.#sessionId
        }

        const response = await this.#client.generateAssistantResponse(request, {
            abortSignal: this.#abortController?.signal,
        })

        this.#sessionId = response.conversationId

        return response
    }

    public dispose() {
        this.#abortController?.abort()
        this.#client.destroy()
    }

    public abortRequest() {
        this.#abortController?.abort()
    }
}
