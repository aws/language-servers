import {
    CodeWhispererStreamingClientConfig,
    SendMessageCommandInput,
    SendMessageCommandOutput,
} from '@amzn/codewhisperer-streaming'
import { AmazonQTokenServiceManager } from '../amazonQServiceManager/AmazonQTokenServiceManager'

export type ChatSessionServiceConfig = CodeWhispererStreamingClientConfig
export class ChatSessionService {
    public shareCodeWhispererContentWithAWS = false
    #abortController?: AbortController
    #conversationId?: string
    #amazonQServiceManager?: AmazonQTokenServiceManager

    public get conversationId(): string | undefined {
        return this.#conversationId
    }

    public set conversationId(value: string | undefined) {
        this.#conversationId = value
    }

    constructor(amazonQServiceManager?: AmazonQTokenServiceManager) {
        this.#amazonQServiceManager = amazonQServiceManager
    }

    public async sendMessage(request: SendMessageCommandInput): Promise<SendMessageCommandOutput> {
        this.#abortController = new AbortController()

        if (this.#conversationId && request.conversationState) {
            request.conversationState.conversationId = this.#conversationId
        }

        if (!this.#amazonQServiceManager) {
            throw new Error('amazonQServiceManager is not initialized')
        }

        const client = this.#amazonQServiceManager.getStreamingClient()

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
