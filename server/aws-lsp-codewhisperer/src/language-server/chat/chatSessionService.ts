import {
    CodeWhispererStreaming,
    CodeWhispererStreamingClientConfig,
    SendMessageCommandInput,
    SendMessageCommandOutput,
} from '@amzn/codewhisperer-streaming'
import { ConfiguredRetryStrategy } from '@aws-sdk/util-retry'
import { CredentialsProvider } from '@aws/language-server-runtimes/server-interface'
import { getBearerTokenFromProvider } from '../utils'

export type ChatSessionServiceConfig = CodeWhispererStreamingClientConfig
export class ChatSessionService {
    public shareCodeWhispererContentWithAWS = false
    readonly #codeWhispererRegion = 'us-east-1'
    readonly #codeWhispererEndpoint = 'https://codewhisperer.us-east-1.amazonaws.com/'
    #abortController?: AbortController
    #credentialsProvider: CredentialsProvider
    #config?: CodeWhispererStreamingClientConfig
    #sessionId?: string

    public get sessionId(): string | undefined {
        return this.#sessionId
    }

    public set sessionId(value: string | undefined) {
        this.#sessionId = value
    }

    constructor(credentialsProvider: CredentialsProvider, config?: CodeWhispererStreamingClientConfig) {
        this.#credentialsProvider = credentialsProvider
        this.#config = config
    }

    public async sendMessage(request: SendMessageCommandInput): Promise<SendMessageCommandOutput> {
        this.#abortController = new AbortController()

        if (this.#sessionId && request.conversationState) {
            request.conversationState.conversationId = this.#sessionId
        }

        const client = new CodeWhispererStreaming({
            region: this.#codeWhispererRegion,
            endpoint: this.#codeWhispererEndpoint,
            token: () => Promise.resolve({ token: getBearerTokenFromProvider(this.#credentialsProvider) }),
            retryStrategy: new ConfiguredRetryStrategy(0, (attempt: number) => 500 + attempt ** 10),
            ...this.#config,
        })

        const response = await client.sendMessage(request, {
            abortSignal: this.#abortController?.signal,
        })

        this.#sessionId = response.conversationId

        return response
    }

    public clear(): void {
        this.#abortController?.abort()
        this.#sessionId = undefined
    }

    public dispose(): void {
        this.#abortController?.abort()
    }

    public abortRequest(): void {
        this.#abortController?.abort()
    }
}
