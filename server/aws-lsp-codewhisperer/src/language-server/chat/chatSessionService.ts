import {
    QDeveloperStreaming,
    QDeveloperStreamingClientConfig,
    SendMessageCommandInput,
    SendMessageCommandOutput,
} from '@amzn/qdeveloper-streaming-client'
import { ConfiguredRetryStrategy } from '@aws-sdk/util-retry'
import { CredentialsProvider } from '@aws/language-server-runtimes/server-interface'
import { getBearerTokenFromProvider } from '../utils'

export type ChatSessionServiceConfig = QDeveloperStreamingClientConfig
export class ChatSessionService {
    public shareCodeWhispererContentWithAWS = false
    readonly #codeWhispererRegion: string
    readonly #codeWhispererEndpoint: string
    #abortController?: AbortController
    #credentialsProvider: CredentialsProvider
    #config?: QDeveloperStreamingClientConfig
    #conversationId?: string

    public get conversationId(): string | undefined {
        return this.#conversationId
    }

    public set conversationId(value: string | undefined) {
        this.#conversationId = value
    }

    constructor(
        credentialsProvider: CredentialsProvider,
        codeWhispererRegion: string,
        codeWhispererEndpoint: string,
        config?: QDeveloperStreamingClientConfig
    ) {
        this.#credentialsProvider = credentialsProvider
        this.#codeWhispererRegion = codeWhispererRegion
        this.#codeWhispererEndpoint = codeWhispererEndpoint
        this.#config = config
    }

    public async sendMessage(request: SendMessageCommandInput): Promise<SendMessageCommandOutput> {
        this.#abortController = new AbortController()

        if (this.#conversationId && request.conversationState) {
            request.conversationState.conversationId = this.#conversationId
        }

        const client = new QDeveloperStreaming({
            region: this.#codeWhispererRegion,
            endpoint: this.#codeWhispererEndpoint,
            token: () => Promise.resolve({ token: getBearerTokenFromProvider(this.#credentialsProvider) }),
            retryStrategy: new ConfiguredRetryStrategy(0, (attempt: number) => 500 + attempt ** 10),
            ...this.#config,
        })

        const response = await client.sendMessage(request, {
            abortSignal: this.#abortController?.signal,
        })

        return response
    }

    public clear(): void {
        this.#abortController?.abort()
        this.#conversationId = undefined
    }

    public dispose(): void {
        this.#abortController?.abort()
    }

    public abortRequest(): void {
        this.#abortController?.abort()
    }
}
