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
import {
    QRetryClassifier,
    RetryAction,
    DelayTracker,
    DelayNotification,
    AdaptiveRetryConfig,
    RetryConfig,
    ClientSideRateLimiter,
    TokenCost,
    RetryErrorHandler,
    RetryTelemetryController,
} from '../agenticChat/retry'

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
    #retryClassifier: QRetryClassifier
    #delayTracker: DelayTracker
    #rateLimiter: ClientSideRateLimiter
    #retryConfig: RetryConfig
    #errorHandler: RetryErrorHandler
    #telemetryController: RetryTelemetryController

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

    public removeDeferredToolExecution(messageId: string) {
        if (messageId in this.#deferredToolExecution) {
            delete this.#deferredToolExecution[messageId]
        }
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

        // Initialize retry components
        this.#retryClassifier = new QRetryClassifier(logging)
        this.#retryConfig = AdaptiveRetryConfig.getRetryConfig()
        this.#rateLimiter = new ClientSideRateLimiter(AdaptiveRetryConfig.getRateLimiterConfig(), logging)
        this.#delayTracker = new DelayTracker(logging, this.#onDelayNotification.bind(this))
        this.#errorHandler = new RetryErrorHandler(this.isModelSelectionEnabled())
        this.#telemetryController = new RetryTelemetryController()
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

        // Execute with retry logic
        return await this.#executeWithRetry(() => client.sendMessage(request), 'sendMessage', TokenCost.InitialRequest)
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

        // Execute with retry logic
        return await this.#executeWithRetry(
            () => this.#performChatRequest(client, request),
            'getChatResponse',
            TokenCost.InitialRequest
        )
    }

    async #performChatRequest(client: any, request: ChatCommandInput): Promise<ChatCommandOutput> {
        if (client instanceof StreamingClientServiceToken) {
            return await client.generateAssistantResponse(request)
        } else if (client instanceof StreamingClientServiceIAM) {
            // @ts-ignore
            // SendMessageStreaming checks for origin from request source
            // https://code.amazon.com/packages/AWSVectorConsolasRuntimeService/blobs/ac917609a28dbcb6757a8427bcc585a42fd15bf2/--/src/com/amazon/aws/vector/consolas/runtimeservice/activity/SendMessageStreamingActivity.java#L246
            request.source = this.#origin ? this.#origin : 'IDE'
            return await client.sendMessage(request)
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

    /**
     * Sets the delay notification callback for UI integration
     * @param callback Function to call when delay notifications occur
     */
    public setDelayNotificationCallback(callback: (notification: DelayNotification) => void): void {
        this.#delayTracker = new DelayTracker(this.#logging, callback)
    }

    #onDelayNotification(notification: DelayNotification): void {
        // This can be extended to send notifications to the UI
        // For now, just log the notification
        this.#logging?.info(`Delay notification: ${notification.message}`)

        // TODO: Integrate with chat result stream to show delay notifications to users
        // This would require passing the chat result stream to the session service
        // Example: this.#chatResultStream?.updateProgressMessage(notification.message)
    }

    async #executeWithRetry<T>(
        operation: () => Promise<T>,
        operationName: string,
        tokenCost: TokenCost = TokenCost.InitialRequest
    ): Promise<T> {
        if (AdaptiveRetryConfig.isRetryDisabled()) {
            return await operation()
        }

        let attempt = 1
        let lastError: any
        let previousDelayMs: number | undefined
        const startTime = Date.now()

        while (attempt <= this.#retryConfig.maxAttempts) {
            try {
                // Check rate limiter and apply delay if needed
                const rateLimitDelayMs = this.#rateLimiter.checkAndCalculateDelay(tokenCost)
                if (rateLimitDelayMs > 0) {
                    if (attempt === 1) {
                        this.#delayTracker.trackInitialDelay(rateLimitDelayMs)
                    }
                    await this.#rateLimiter.applyDelayAndConsumeTokens(rateLimitDelayMs, tokenCost)
                } else if (this.#rateLimiter.isEnabled()) {
                    // Consume tokens even if no delay
                    await this.#rateLimiter.applyDelayAndConsumeTokens(0, tokenCost)
                }

                const response = await operation()

                // Track success for rate limiter recovery
                this.#rateLimiter.onSuccessfulRequest()

                // Track delay summary if there were significant delays
                const totalDelayMs = Date.now() - startTime
                this.#delayTracker.summarizeDelayImpact(totalDelayMs, attempt, previousDelayMs)

                return response
            } catch (error) {
                lastError = error
                const retryAction = this.#retryClassifier.classifyRetry(error)

                this.#logging?.debug(
                    `${operationName} attempt ${attempt} failed with retry action: ${retryAction}. Error: ${error instanceof Error ? error.message : String(error)}`
                )

                // Check if we should stop retrying
                if (retryAction === RetryAction.RetryForbidden || attempt >= this.#retryConfig.maxAttempts) {
                    break
                }

                // Activate rate limiter for throttling errors
                if (retryAction === RetryAction.ThrottlingError) {
                    const wasEnabled = this.#rateLimiter.isEnabled()
                    this.#rateLimiter.activate()

                    // Emit telemetry for rate limiter activation
                    if (!wasEnabled) {
                        const state = this.#rateLimiter.getState()
                        this.#telemetryController.emitRateLimiterStateChanged({
                            conversationId: this.#conversationId || 'unknown',
                            enabled: state.enabled,
                            capacity: state.capacity,
                            fillRate: state.fillRate,
                            triggerErrorType: retryAction,
                        })
                    }

                    tokenCost = TokenCost.ThrottlingRetry // Higher cost for throttling retries
                } else if (retryAction === RetryAction.TransientError) {
                    tokenCost = TokenCost.Retry // Standard retry cost
                }

                // Calculate backoff delay
                const jitterBase = AdaptiveRetryConfig.generateJitterBase(this.#retryConfig.useStaticExponentialBase)
                const backoffDelayMs = AdaptiveRetryConfig.calculateExponentialBackoff(
                    jitterBase,
                    this.#retryConfig.initialBackoffMs / 1000, // Convert to seconds
                    attempt - 1, // 0-based for calculation
                    this.#retryConfig.maxBackoffMs
                )

                // Check rate limiter delay for retry
                const rateLimitDelayMs = this.#rateLimiter.checkAndCalculateDelay(tokenCost)
                const totalDelayMs = Math.max(backoffDelayMs, rateLimitDelayMs)

                // Track retry delay
                this.#delayTracker.trackRetryDelay(totalDelayMs, attempt + 1, previousDelayMs)
                previousDelayMs = totalDelayMs

                // Apply the delay
                if (totalDelayMs > 0) {
                    await new Promise(resolve => setTimeout(resolve, totalDelayMs))
                }

                // Consume tokens after delay
                if (this.#rateLimiter.isEnabled()) {
                    await this.#rateLimiter.applyDelayAndConsumeTokens(0, tokenCost)
                }

                attempt++
            }
        }

        // All retries exhausted, transform and throw the final error
        const finalRetryAction = this.#retryClassifier.classifyRetry(lastError)
        throw this.#errorHandler.transformFinalError(lastError, attempt - 1, finalRetryAction)
    }
}
