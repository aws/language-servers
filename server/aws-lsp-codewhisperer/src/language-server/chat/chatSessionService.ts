import {
    CodeWhispererStreamingClientConfig,
    CodeWhispererStreamingServiceException,
    GenerateAssistantResponseCommandInput,
    GenerateAssistantResponseCommandOutput,
    Origin,
    SendMessageCommand,
    ToolUse,
} from '@amzn/codewhisperer-streaming'
import {
    StreamingClientServiceToken,
    SendMessageCommandInput,
    SendMessageCommandOutput,
    StreamingClientServiceIAM,
    ChatCommandInput,
    ChatCommandOutput,
} from '../../shared/streamingClientService'
import { ChatResult } from '@aws/language-server-runtimes/server-interface'
import {
    AgenticChatError,
    isInputTooLongError,
    isRequestAbortedError,
    isThrottlingRelated,
    wrapErrorWithCode,
} from '../agenticChat/errors'
import { AmazonQBaseServiceManager } from '../../shared/amazonQServiceManager/BaseAmazonQServiceManager'
import { loggingUtils } from '@aws/lsp-core'
import { Logging } from '@aws/language-server-runtimes/server-interface'
import { Features } from '../types'
import { getOriginFromClientInfo, getClientName, getRequestID, isUsageLimitError } from '../../shared/utils'
import { enabledModelSelection } from '../../shared/utils'

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
    public modelId: string | undefined
    #lsp?: Features['lsp']
    #abortController?: AbortController
    #currentPromptId?: string
    #conversationId?: string
    #conversationType: string = 'AgenticChat'
    #deferredToolExecution: Record<string, DeferredHandler> = {}
    #toolUseLookup: Map<
        string,
        ToolUse & { fileChange?: FileChange; relatedToolUses?: Set<string>; chatResult?: ChatResult }
    > = new Map()
    #currentUndoAllId?: string
    // Map to store approved paths to avoid repeated validation
    #approvedPaths: Set<string> = new Set<string>()
    #serviceManager?: AmazonQBaseServiceManager
    #logging?: Logging
    #origin?: Origin

    public getConversationType(): string {
        return this.#conversationType
    }

    public setConversationType(value: string) {
        this.#conversationType = value
    }

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

    public getAllDeferredCompactMessageIds(): string[] {
        return Object.keys(this.#deferredToolExecution).filter(messageId => messageId.endsWith('_compact'))
    }

    public rejectAllDeferredToolExecutions(error: Error): void {
        Object.keys(this.#deferredToolExecution).forEach(messageId => {
            const handler = this.#deferredToolExecution[messageId]
            if (handler && handler.reject) {
                handler.reject(error)
            }
        })
        // Clear all handlers after rejecting them
        this.#deferredToolExecution = {}
    }

    public get toolUseLookup() {
        return this.#toolUseLookup
    }

    public set toolUseLookup(toolUseLookup) {
        this.#toolUseLookup = toolUseLookup
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

    constructor(serviceManager?: AmazonQBaseServiceManager, lsp?: Features['lsp'], logging?: Logging) {
        this.#serviceManager = serviceManager
        this.#lsp = lsp
        this.#logging = logging
        this.#origin = getOriginFromClientInfo(getClientName(this.#lsp?.getClientInitializeParams()))
    }

    public async sendMessage(request: SendMessageCommandInput): Promise<SendMessageCommandOutput> {
        this.#abortController = new AbortController()

        if (this.#conversationId && request.conversationState) {
            request.conversationState.conversationId = this.#conversationId
        }

        if (!this.#serviceManager) {
            throw new Error('amazonQServiceManager is not initialized')
        }

        const client = this.#serviceManager.getStreamingClient()

        const response = await client.sendMessage(request, this.#abortController)

        return response
    }

    private isModelSelectionEnabled(): boolean {
        return enabledModelSelection(this.#lsp?.getClientInitializeParams())
    }

    public async getChatResponse(request: ChatCommandInput): Promise<ChatCommandOutput> {
        this.#abortController = new AbortController()

        if (this.#conversationId && request.conversationState) {
            request.conversationState.conversationId = this.#conversationId
        }

        if (!this.#serviceManager) {
            throw new AgenticChatError('amazonQServiceManager is not initialized', 'AmazonQServiceManager')
        }

        const client = this.#serviceManager.getStreamingClient()

        if (client instanceof StreamingClientServiceToken) {
            try {
                return await client.generateAssistantResponse(request, this.#abortController)
            } catch (e) {
                // Log the error using the logging property if available, otherwise fall back to console.error
                if (this.#logging) {
                    this.#logging.error(`Error in generateAssistantResponse: ${loggingUtils.formatErr(e)}`)
                }

                const requestId = getRequestID(e)
                if (isUsageLimitError(e)) {
                    throw new AgenticChatError(
                        'Request aborted',
                        'AmazonQUsageLimitError',
                        e instanceof Error ? e : undefined,
                        requestId
                    )
                }
                if (isRequestAbortedError(e)) {
                    throw new AgenticChatError(
                        'Request aborted',
                        'RequestAborted',
                        e instanceof Error ? e : undefined,
                        requestId
                    )
                }
                if (isInputTooLongError(e)) {
                    throw new AgenticChatError(
                        'Too much context loaded. I have cleared the conversation history. Please retry your request with smaller input.',
                        'InputTooLong',
                        e instanceof Error ? e : undefined,
                        requestId
                    )
                }
                if (isThrottlingRelated(e)) {
                    throw new AgenticChatError(
                        'Service is currently experiencing high traffic. Please try again later.',
                        'RequestThrottled',
                        e instanceof Error ? e : undefined,
                        requestId
                    )
                }
                let error = wrapErrorWithCode(e, 'QModelResponse')
                if (
                    (request.conversationState?.currentMessage?.userInputMessage?.modelId !== undefined &&
                        (error.cause as any)?.$metadata?.httpStatusCode === 500 &&
                        error.message ===
                            'Encountered unexpectedly high load when processing the request, please try again.') ||
                    (error.cause &&
                        typeof error.cause === 'object' &&
                        '$metadata' in error.cause &&
                        (error.cause as any).$metadata?.httpStatusCode === 429 &&
                        'reason' in error.cause &&
                        error.cause.reason === 'INSUFFICIENT_MODEL_CAPACITY')
                ) {
                    error.message = this.isModelSelectionEnabled()
                        ? `The model you selected is temporarily unavailable. Please switch to a different model and try again.`
                        : `I am experiencing high traffic, please try again shortly.`
                }

                throw error
            }
        } else if (client instanceof StreamingClientServiceIAM) {
            try {
                // @ts-ignore
                // SendMessageStreaming checks for origin from request source
                // https://code.amazon.com/packages/AWSVectorConsolasRuntimeService/blobs/ac917609a28dbcb6757a8427bcc585a42fd15bf2/--/src/com/amazon/aws/vector/consolas/runtimeservice/activity/SendMessageStreamingActivity.java#L246
                request.source = this.#origin ? this.#origin : 'IDE'
                return await client.sendMessage(request, this.#abortController)
            } catch (e) {
                // Log the error using the logging property if available, otherwise fall back to console.error
                if (this.#logging) {
                    this.#logging.error(`Error in Send Message response: ${loggingUtils.formatErr(e)}`)
                }

                const requestId = getRequestID(e)
                if (isUsageLimitError(e)) {
                    throw new AgenticChatError(
                        'Request aborted',
                        'AmazonQUsageLimitError',
                        e instanceof Error ? e : undefined,
                        requestId
                    )
                }
                if (isRequestAbortedError(e)) {
                    throw new AgenticChatError(
                        'Request aborted',
                        'RequestAborted',
                        e instanceof Error ? e : undefined,
                        requestId
                    )
                }
                if (isInputTooLongError(e)) {
                    throw new AgenticChatError(
                        'Too much context loaded. I have cleared the conversation history. Please retry your request with smaller input.',
                        'InputTooLong',
                        e instanceof Error ? e : undefined,
                        requestId
                    )
                }
                let error = wrapErrorWithCode(e, 'QModelResponse')
                if (
                    (request.conversationState?.currentMessage?.userInputMessage?.modelId !== undefined &&
                        (error.cause as any)?.$metadata?.httpStatusCode === 500 &&
                        error.message ===
                            'Encountered unexpectedly high load when processing the request, please try again.') ||
                    (error.cause &&
                        typeof error.cause === 'object' &&
                        '$metadata' in error.cause &&
                        (error.cause as any).$metadata?.httpStatusCode === 429 &&
                        'reason' in error.cause &&
                        error.cause.reason === 'INSUFFICIENT_MODEL_CAPACITY')
                ) {
                    error.message = this.isModelSelectionEnabled()
                        ? `The model you selected is temporarily unavailable. Please switch to a different model and try again.`
                        : `I am experiencing high traffic, please try again shortly.`
                }
                throw error
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

    /**
     * Sets the current prompt ID
     * @param promptId The unique ID of the current prompt
     */
    public setCurrentPromptId(promptId: string): void {
        this.#currentPromptId = promptId
    }

    /**
     * Checks if the given prompt ID matches the current one
     * @param promptId The prompt ID to check
     * @returns True if the given prompt ID matches the current one
     */
    public isCurrentPrompt(promptId: string): boolean {
        return this.#currentPromptId === promptId
    }

    public abortRequest(): void {
        this.#abortController?.abort()
    }

    /**
     * Sets the logging object for this session
     * @param logging The logging object to use
     */
    public setLogging(logging: Logging): void {
        this.#logging = logging
    }
}
