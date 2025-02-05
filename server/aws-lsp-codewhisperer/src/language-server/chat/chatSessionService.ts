import {
    CodeWhispererStreaming,
    CodeWhispererStreamingClientConfig,
    SendMessageCommandInput,
    SendMessageCommandOutput,
} from '@amzn/codewhisperer-streaming'
import { ConfiguredRetryStrategy } from '@aws-sdk/util-retry'
import { CredentialsProvider } from '@aws/language-server-runtimes/server-interface'
import { getBearerTokenFromProvider } from '../utils'
import { SDKInitializator } from '@aws/language-server-runtimes/server-interface'

export type ChatSessionServiceConfig = CodeWhispererStreamingClientConfig
export class ChatSessionService {
    public shareCodeWhispererContentWithAWS = false
    readonly #codeWhispererRegion: string
    readonly #codeWhispererEndpoint: string
    #sdkInitializator: SDKInitializator
    #abortController?: AbortController
    #credentialsProvider: CredentialsProvider
    #config?: CodeWhispererStreamingClientConfig
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
        sdkInitializator: SDKInitializator,
        config?: CodeWhispererStreamingClientConfig
    ) {
        this.#credentialsProvider = credentialsProvider
        this.#codeWhispererRegion = codeWhispererRegion
        this.#codeWhispererEndpoint = codeWhispererEndpoint
        this.#sdkInitializator = sdkInitializator
        this.#config = config
    }

    public async sendMessage(request: SendMessageCommandInput): Promise<SendMessageCommandOutput> {
        this.#abortController = new AbortController()

        if (this.#conversationId && request.conversationState) {
            request.conversationState.conversationId = this.#conversationId
        }

        const client = this.#sdkInitializator(CodeWhispererStreaming, {
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
