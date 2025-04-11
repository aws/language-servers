import { CodeWhispererStreamingClientConfig } from '@amzn/codewhisperer-streaming'

import { AmazonQBaseServiceManager } from '../../shared/amazonQServiceManager/BaseAmazonQServiceManager'
import { SendMessageCommandInput, SendMessageCommandOutput } from '../../shared/streamingClientService'

export type ChatSessionServiceConfig = CodeWhispererStreamingClientConfig
export class ChatSessionService {
    public shareCodeWhispererContentWithAWS = false
    public localHistoryHydrated: boolean = false
    #abortController?: AbortController
    #conversationId?: string
    #amazonQServiceManager?: AmazonQBaseServiceManager

    public get conversationId(): string | undefined {
        return this.#conversationId
    }

    public set conversationId(value: string | undefined) {
        this.#conversationId = value
    }

    constructor(amazonQServiceManager?: AmazonQBaseServiceManager) {
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

        const response = await client.sendMessage(request, this.#abortController)

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
