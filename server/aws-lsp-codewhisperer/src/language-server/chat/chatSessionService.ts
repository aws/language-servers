import {
    CodeWhispererStreamingClientConfig,
    GenerateAssistantResponseCommandInput,
    GenerateAssistantResponseCommandOutput,
    ToolUse,
} from '@amzn/codewhisperer-streaming'

import { AmazonQBaseServiceManager } from '../../shared/amazonQServiceManager/BaseAmazonQServiceManager'
import {
    StreamingClientServiceToken,
    SendMessageCommandInput,
    SendMessageCommandOutput,
} from '../../shared/streamingClientService'
import { ChatResult } from '@aws/language-server-runtimes/server-interface'
import { AgenticChatError, wrapErrorWithCode } from '../agenticChat/errors'

export type ChatSessionServiceConfig = CodeWhispererStreamingClientConfig
type FileChange = { before?: string; after?: string }

type DeferredHandler = {
    resolve: () => void
    reject: (err: Error) => void
}
export class ChatSessionService {
    public shareCodeWhispererContentWithAWS = false
    public pairProgrammingMode: boolean = true
    #abortController?: AbortController
    #conversationId?: string
    #amazonQServiceManager?: AmazonQBaseServiceManager
    #deferredToolExecution: Record<string, DeferredHandler> = {}
    #toolUseLookup: Map<
        string,
        ToolUse & { fileChange?: FileChange; relatedToolUses?: Set<string>; chatResult?: ChatResult }
    > = new Map()
    #currentUndoAllId?: string

    public get conversationId(): string | undefined {
        return this.#conversationId
    }

    public set conversationId(value: string | undefined) {
        this.#conversationId = value
    }

    public getDeferredToolExecution(messageId: string): DeferredHandler | undefined {
        return this.#deferredToolExecution[messageId]
    }
    public setDeferredToolExecution(messageId: string, resolve: any, reject: any) {
        this.#deferredToolExecution[messageId] = { resolve, reject }
    }

    public rejectAllDeferredToolExecutions(error: Error): void {
        for (const messageId in this.#deferredToolExecution) {
            const handler = this.#deferredToolExecution[messageId]
            if (handler && handler.reject) {
                handler.reject(error)
            }
        }
        // Clear all handlers after rejecting them
        this.#deferredToolExecution = {}
    }

    public get toolUseLookup() {
        return this.#toolUseLookup
    }

    public get currentUndoAllId(): string | undefined {
        return this.#currentUndoAllId
    }

    public set currentUndoAllId(toolUseId: string | undefined) {
        this.#currentUndoAllId = toolUseId
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

    public async generateAssistantResponse(
        request: GenerateAssistantResponseCommandInput
    ): Promise<GenerateAssistantResponseCommandOutput> {
        this.#abortController = new AbortController()

        if (this.#conversationId && request.conversationState) {
            request.conversationState.conversationId = this.#conversationId
        }

        if (!this.#amazonQServiceManager) {
            throw new AgenticChatError('amazonQServiceManager is not initialized', 'AmazonQServiceManager')
        }

        const client = this.#amazonQServiceManager.getStreamingClient()

        if (client instanceof StreamingClientServiceToken) {
            try {
                return await client.generateAssistantResponse(request, this.#abortController)
            } catch (e) {
                throw wrapErrorWithCode(e, 'QModelResponse')
            }
        } else {
            // error
            return Promise.reject(
                'Client is not instance of StreamingClientServiceToken, generateAssistantResponse not available for IAM client.'
            )
        }
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
