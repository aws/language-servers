import {
    CodeWhispererStreaming,
    GenerateAssistantResponseCommandInput,
    GenerateAssistantResponseCommandOutput,
} from '@amzn/codewhisperer-streaming'
import { ConfiguredRetryStrategy } from '@aws-sdk/util-retry'
import { CredentialsProvider } from '@aws/language-server-runtimes/server-interface'
import { AbortController } from '@smithy/abort-controller'
import { getBearerTokenFromProvider } from '../utils'

export class ChatSessionService {
    public shareCodeWhispererContentWithAWS = false
    readonly #codeWhispererRegion = 'us-east-1'
    readonly #codeWhispererEndpoint = 'https://codewhisperer.us-east-1.amazonaws.com/'
    #client: CodeWhispererStreaming
    #abortController?: AbortController
    #sessionId?: string
    #credentialsProvider: CredentialsProvider

    public get sessionId(): string | undefined {
        return this.#sessionId
    }

    public set sessionId(value: string | undefined) {
        this.#sessionId = value
    }

    constructor(credentialsProvider: CredentialsProvider) {
        this.#credentialsProvider = credentialsProvider

        this.#client = new CodeWhispererStreaming({
            region: this.#codeWhispererRegion,
            endpoint: this.#codeWhispererEndpoint,
            token: () => Promise.resolve({ token: getBearerTokenFromProvider(this.#credentialsProvider) }),
            retryStrategy: new ConfiguredRetryStrategy(0, (attempt: number) => 500 + attempt ** 10),
        })
    }

    async generateAssistantResponse(
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
