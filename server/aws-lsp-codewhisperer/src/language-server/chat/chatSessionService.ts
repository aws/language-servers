import {
    CodeWhispererStreamingClientConfig,
    CodeWhispererStreamingServiceException,
    GenerateAssistantResponseCommandInput,
    GenerateAssistantResponseCommandOutput,
    ToolUse,
} from '@amzn/codewhisperer-streaming'
import {
    StreamingClientServiceToken,
    SendMessageCommandInput,
    SendMessageCommandOutput,
} from '../../shared/streamingClientService'
import { ChatResult } from '@aws/language-server-runtimes/server-interface'
import { AgenticChatError, isInputTooLongError, wrapErrorWithCode } from '../agenticChat/errors'
import { AmazonQServiceBase } from '../../shared/amazonQServiceManager/BaseAmazonQServiceManager'

export type ChatSessionServiceConfig = CodeWhispererStreamingClientConfig
type FileChange = { before?: string; after?: string }

type DeferredHandler = {
    resolve: () => void
    reject: (err: Error) => void
}
export class ChatSessionService {
    public shareCodeWhispererContentWithAWS = false
    public pairProgrammingMode: boolean = true
    public contextListSent: boolean = false
    #abortController?: AbortController
    #conversationId?: string
    #deferredToolExecution: Record<string, DeferredHandler> = {}
    #toolUseLookup: Map<
        string,
        ToolUse & { fileChange?: FileChange; relatedToolUses?: Set<string>; chatResult?: ChatResult }
    > = new Map()
    #currentUndoAllId?: string
    // Map to store approved paths to avoid repeated validation
    #approvedPaths: Set<string> = new Set<string>()
    #amazonQService?: AmazonQServiceBase

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

    /**
     * Gets the set of approved paths for this session
     */
    public get approvedPaths(): Set<string> {
        return this.#approvedPaths
    }

    /**
     * Adds a path to the approved paths list for this session
     * @param filePath The absolute path to add
     */
    public addApprovedPath(filePath: string): void {
        if (!filePath) {
            return
        }

        // Normalize path separators for consistent comparison
        const normalizedPath = filePath.replace(/\\/g, '/')
        this.#approvedPaths.add(normalizedPath)
    }

    constructor(amazonQService?: AmazonQServiceBase) {
        this.#amazonQService = amazonQService
    }

    public async sendMessage(request: SendMessageCommandInput): Promise<SendMessageCommandOutput> {
        this.#abortController = new AbortController()

        if (this.#conversationId && request.conversationState) {
            request.conversationState.conversationId = this.#conversationId
        }

        if (!this.#amazonQService) {
            throw new Error('No AmazonQService has been attached')
        }

        const client = this.#amazonQService.getStreamingClient()

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

        if (!this.#amazonQService) {
            throw new AgenticChatError('amazonQServiceManager is not initialized', 'AmazonQServiceManager')
        }
        
        const client = this.#amazonQService.getStreamingClient()

        if (client instanceof StreamingClientServiceToken) {
            try {
                return await client.generateAssistantResponse(request, this.#abortController)
            } catch (e) {
                if (isInputTooLongError(e)) {
                    let requestId
                    if (e instanceof CodeWhispererStreamingServiceException) {
                        requestId = e.$metadata?.requestId
                    }
                    throw new AgenticChatError(
                        'Too much context loaded. Please start a new conversation or ask about specific files.',
                        'InputTooLong',
                        e instanceof Error ? e : undefined,
                        requestId
                    )
                }
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
        this.contextListSent = false
    }

    public dispose(): void {
        this.#abortController?.abort()
    }

    public abortRequest(): void {
        this.#abortController?.abort()
    }
}
