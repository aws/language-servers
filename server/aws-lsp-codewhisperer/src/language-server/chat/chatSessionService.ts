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
import { AmazonQTokenServiceManager } from '../amazonQServiceManager/AmazonQTokenServiceManager'

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
    #amazonQServiceManager?: AmazonQTokenServiceManager

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
        config?: CodeWhispererStreamingClientConfig,
        amazonQServiceManager?: AmazonQTokenServiceManager
    ) {
        this.#credentialsProvider = credentialsProvider
        this.#codeWhispererRegion = codeWhispererRegion
        this.#codeWhispererEndpoint = codeWhispererEndpoint
        this.#sdkInitializator = sdkInitializator
        this.#config = config

        if (amazonQServiceManager) {
            this.#amazonQServiceManager = amazonQServiceManager
        }
    }

    public async sendMessage(request: SendMessageCommandInput): Promise<SendMessageCommandOutput> {
        this.#abortController = new AbortController()

        if (this.#conversationId && request.conversationState) {
            request.conversationState.conversationId = this.#conversationId
        }

        if (!this.#amazonQServiceManager) {
            throw new Error('amazonQServiceManager is not initialized')
        }

        const client = this.#amazonQServiceManager.createStreamingClient()

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
