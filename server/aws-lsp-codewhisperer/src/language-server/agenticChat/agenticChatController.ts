/**
 * Copied from ../chat/chatController.ts for the purpose of developing a divergent implementation.
 * Will be deleted or merged.
 */

import {
    ChatTriggerType,
    GenerateAssistantResponseCommandInput,
    GenerateAssistantResponseCommandOutput,
    SendMessageCommandInput as SendMessageCommandInputCodeWhispererStreaming,
    ToolResult,
    ToolResultContentBlock,
    ToolUse,
} from '@amzn/codewhisperer-streaming'
import { chatRequestType, InlineChatResultParams } from '@aws/language-server-runtimes/protocol'
import {
    ApplyWorkspaceEditParams,
    ErrorCodes,
    FeedbackParams,
    InsertToCursorPositionParams,
    TextDocumentEdit,
    TextEdit,
    InlineChatParams,
    ConversationClickParams,
    ListConversationsParams,
    TabBarActionParams,
    CancellationToken,
    Chat,
    ChatParams,
    ChatResult,
    EndChatParams,
    LSPErrorCodes,
    QuickActionParams,
    ResponseError,
    TabAddParams,
    TabRemoveParams,
    TabChangeParams,
    InlineChatResult,
} from '@aws/language-server-runtimes/server-interface'
import { v4 as uuid } from 'uuid'
import * as path from 'path'
import {
    AddMessageEvent,
    ChatInteractionType,
    ChatTelemetryEventName,
    CombinedConversationEvent,
} from '../../shared/telemetry/types'
import { Features, LspHandlers, Result } from '../types'
import { ChatEventParser, ChatResultWithMetadata } from '../chat/chatEventParser'
import { createAuthFollowUpResult, getAuthFollowUpType, getDefaultChatResponse } from '../chat/utils'
import { ChatSessionManagementService } from '../chat/chatSessionManagementService'
import { ChatTelemetryController } from '../chat/telemetry/chatTelemetryController'
import { QuickAction } from '../chat/quickActions'
import { Metric } from '../../shared/telemetry/metric'
import { getErrorMessage, isAwsError, isNullish, isObject } from '../../shared/utils'
import { QChatTriggerContext, TriggerContext } from '../chat/contexts/triggerContext'
import { HELP_MESSAGE } from '../chat/constants'
import { TelemetryService } from '../../shared/telemetry/telemetryService'
import {
    AmazonQServicePendingProfileError,
    AmazonQServicePendingSigninError,
} from '../../shared/amazonQServiceManager/errors'
import { AmazonQTokenServiceManager } from '../../shared/amazonQServiceManager/AmazonQTokenServiceManager'
import { AmazonQWorkspaceConfig } from '../../shared/amazonQServiceManager/configurationUtils'
import { TabBarController } from './tabBarController'
import { ChatDatabase } from './tools/chatDb/chatDb'
import { SendMessageCommandInput, SendMessageCommandOutput } from '../../shared/streamingClientService'
import {
    AgenticChatEventParser,
    ChatResultWithMetadata as AgenticChatResultWithMetadata,
} from './agenticChatEventParser'
import { ChatSessionService } from '../chat/chatSessionService'
import { LocalProjectContextController } from '../../shared/localProjectContextController'
import { RelevantTextDocumentAddition } from '../types'

type ChatHandlers = Omit<
    LspHandlers<Chat>,
    | 'openTab'
    | 'sendChatUpdate'
    | 'onFileClicked'
    | 'sendContextCommands'
    | 'onCreatePrompt'
    | 'getSerializedChat'
    | 'chatOptionsUpdate'
>

export class AgenticChatController implements ChatHandlers {
    #features: Features
    #chatSessionManagementService: ChatSessionManagementService
    #telemetryController: ChatTelemetryController
    #triggerContext: QChatTriggerContext
    #customizationArn?: string
    #telemetryService: TelemetryService
    #amazonQServiceManager?: AmazonQTokenServiceManager
    #tabBarController: TabBarController
    #chatHistoryDb: ChatDatabase

    constructor(
        chatSessionManagementService: ChatSessionManagementService,
        features: Features,
        telemetryService: TelemetryService,
        amazonQServiceManager?: AmazonQTokenServiceManager
    ) {
        this.#features = features
        this.#chatSessionManagementService = chatSessionManagementService
        this.#triggerContext = new QChatTriggerContext(features.workspace, features.logging)
        this.#telemetryController = new ChatTelemetryController(features, telemetryService)
        this.#telemetryService = telemetryService
        this.#amazonQServiceManager = amazonQServiceManager
        this.#chatHistoryDb = new ChatDatabase(features)
        this.#tabBarController = new TabBarController(features, this.#chatHistoryDb)
    }

    dispose() {
        this.#chatSessionManagementService.dispose()
        this.#telemetryController.dispose()
        this.#chatHistoryDb.close()
    }

    async onListConversations(params: ListConversationsParams) {
        return this.#tabBarController.onListConversations(params)
    }

    async onConversationClick(params: ConversationClickParams) {
        return this.#tabBarController.onConversationClick(params)
    }

    async onChatPrompt(params: ChatParams, token: CancellationToken): Promise<ChatResult | ResponseError<ChatResult>> {
        // Phase 1: Initial Setup - This happens only once
        const maybeDefaultResponse = getDefaultChatResponse(params.prompt.prompt)

        if (maybeDefaultResponse) {
            return maybeDefaultResponse
        }

        const sessionResult = this.#chatSessionManagementService.getSession(params.tabId)

        const { data: session, success } = sessionResult

        if (!success) {
            return new ResponseError<ChatResult>(ErrorCodes.InternalError, sessionResult.error)
        }

        const metric = new Metric<CombinedConversationEvent>({
            cwsprChatConversationType: 'Chat',
        })

        const triggerContext = await this.#getTriggerContext(params, metric)
        const isNewConversation = !session.conversationId

        token.onCancellationRequested(() => {
            this.#log('cancellation requested')
            session.abortRequest()
        })

        const conversationIdentifier = session?.conversationId ?? 'New conversation'

        try {
            // Get the initial request input
            const initialRequestInput = await this.#prepareRequestInput(params, session, triggerContext)

            // Start the agent loop
            const finalResult = await this.#runAgentLoop(
                initialRequestInput,
                session,
                metric,
                params.partialResultToken,
                conversationIdentifier,
                token
            )

            // Phase 5: Result Handling - This happens only once
            return await this.#handleFinalResult(
                finalResult,
                session,
                params,
                metric,
                triggerContext,
                isNewConversation
            )
        } catch (err) {
            return this.#handleRequestError(err, params.tabId, metric)
        }
    }

    /**
     * Prepares the initial request input for the chat prompt
     */
    async #prepareRequestInput(
        params: ChatParams,
        session: ChatSessionService,
        triggerContext: TriggerContext
    ): Promise<GenerateAssistantResponseCommandInput> {
        const profileArn = AmazonQTokenServiceManager.getInstance(this.#features).getActiveProfileArn()
        const useRelevantDocuments = params.context?.some(c => c.command === '@workspace')
        const relevantDocuments = useRelevantDocuments
            ? await this.#getRelevantDocuments(params.prompt.prompt ?? '')
            : undefined
        const requestInput = this.#triggerContext.getChatParamsFromTrigger(
            params,
            triggerContext,
            ChatTriggerType.MANUAL,
            this.#customizationArn,
            profileArn,
            this.#features.agent.getTools({ format: 'bedrock' }),
            useRelevantDocuments,
            relevantDocuments
        )

        if (!session.localHistoryHydrated && requestInput.conversationState) {
            requestInput.conversationState.history = this.#chatHistoryDb.getMessages(params.tabId, 10)
            session.localHistoryHydrated = true
        }

        return requestInput
    }

    /**
     * Runs the agent loop, making requests and processing tool uses until completion
     */
    async #runAgentLoop(
        initialRequestInput: GenerateAssistantResponseCommandInput,
        session: ChatSessionService,
        metric: Metric<CombinedConversationEvent>,
        partialResultToken?: string | number,
        conversationIdentifier?: string,
        token?: CancellationToken
    ): Promise<Result<AgenticChatResultWithMetadata, string>> {
        let currentRequestInput = { ...initialRequestInput }
        let finalResult: Result<AgenticChatResultWithMetadata, string> | null = null
        let iterationCount = 0
        const maxIterations = 10 // Safety limit to prevent infinite loops

        metric.recordStart()

        while (iterationCount < maxIterations) {
            iterationCount++
            this.#debug(`Agent loop iteration ${iterationCount} for conversation id:`, conversationIdentifier || '')

            // Check for cancellation
            if (token?.isCancellationRequested) {
                this.#debug('Request cancelled during agent loop')
                break
            }

            // Phase 3: Request Execution
            this.#debug(`Request Input: ${JSON.stringify(currentRequestInput)}`)
            const response = await session.generateAssistantResponse(currentRequestInput)
            this.#debug(`Response received for iteration ${iterationCount}:`, JSON.stringify(response.$metadata))

            // Phase 4: Response Processing
            const result = await this.#processGenerateAssistantResponseResponse(
                response,
                metric.mergeWith({
                    cwsprChatResponseCode: response.$metadata.httpStatusCode,
                    cwsprChatMessageId: response.$metadata.requestId,
                }),
                partialResultToken
            )

            // Store the conversation ID from the first response
            if (iterationCount === 1 && result.data?.conversationId) {
                session.conversationId = result.data.conversationId
            }

            // Check if we have any tool uses that need to be processed
            const pendingToolUses = this.#getPendingToolUses(result.data?.toolUses || {})

            if (pendingToolUses.length === 0) {
                // No more tool uses, we're done
                finalResult = result
                break
            }

            const currentMessage = currentRequestInput.conversationState?.currentMessage

            // Process tool uses and update the request input for the next iteration
            const toolResults = await this.#processToolUses(pendingToolUses)
            currentRequestInput = this.#updateRequestInputWithToolResults(currentRequestInput, toolResults)

            if (!currentRequestInput.conversationState!.history) {
                currentRequestInput.conversationState!.history = []
            }

            currentRequestInput.conversationState!.history.push({
                userInputMessage: {
                    content: currentMessage?.userInputMessage?.content,
                    origin: currentMessage?.userInputMessage?.origin,
                    userIntent: currentMessage?.userInputMessage?.userIntent,
                    userInputMessageContext: currentMessage?.userInputMessage?.userInputMessageContext,
                },
            })

            currentRequestInput.conversationState!.history.push({
                assistantResponseMessage: {
                    content: result.data?.chatResult.body,
                    toolUses: Object.keys(result.data?.toolUses!).map(k => ({
                        toolUseId: result.data!.toolUses[k].toolUseId,
                        name: result.data!.toolUses[k].name,
                        input: result.data!.toolUses[k].input,
                    })),
                },
            })
        }

        if (iterationCount >= maxIterations) {
            this.#log('Agent loop reached maximum iterations limit')
        }

        return (
            finalResult || {
                success: false,
                error: 'Agent loop failed to produce a final result',
                data: { chatResult: {}, toolUses: {} },
            }
        )
    }

    /**
     * Extracts tool uses that need to be processed
     */
    #getPendingToolUses(toolUses: Record<string, ToolUse & { stop: boolean }>): Array<ToolUse & { stop: boolean }> {
        return Object.values(toolUses).filter(toolUse => toolUse.stop)
    }

    /**
     * Processes tool uses by running the tools and collecting results
     */
    async #processToolUses(toolUses: Array<ToolUse & { stop: boolean }>): Promise<ToolResult[]> {
        const results: ToolResult[] = []

        for (const toolUse of toolUses) {
            if (!toolUse.name || !toolUse.toolUseId) continue

            try {
                this.#debug(`Running tool ${toolUse.name} with input:`, JSON.stringify(toolUse.input))

                const result = await this.#features.agent.runTool(toolUse.name, toolUse.input)
                let toolResultContent: ToolResultContentBlock

                if (typeof result === 'string') {
                    toolResultContent = { text: result }
                } else if (Array.isArray(result)) {
                    toolResultContent = { json: { items: result } }
                } else if (typeof result === 'object') {
                    toolResultContent = { json: result }
                } else toolResultContent = { text: JSON.stringify(result) }

                results.push({
                    toolUseId: toolUse.toolUseId,
                    status: 'success',
                    content: [toolResultContent],
                })

                this.#debug(`Tool ${toolUse.name} completed with result:`, JSON.stringify(result))
            } catch (err) {
                this.#log(`Error running tool ${toolUse.name}:`, err instanceof Error ? err.message : 'unknown error')
                results.push({
                    toolUseId: toolUse.toolUseId,
                    status: 'error',
                    content: [{ json: { error: err instanceof Error ? err.message : 'Unknown error' } }],
                })
            }
        }

        return results
    }

    /**
     * Updates the request input with tool results for the next iteration
     */
    #updateRequestInputWithToolResults(
        requestInput: GenerateAssistantResponseCommandInput,
        toolResults: ToolResult[]
    ): GenerateAssistantResponseCommandInput {
        // Create a deep copy of the request input
        const updatedRequestInput = JSON.parse(JSON.stringify(requestInput)) as GenerateAssistantResponseCommandInput

        // Add tool results to the request
        updatedRequestInput.conversationState!.currentMessage!.userInputMessage!.userInputMessageContext!.toolResults =
            []
        updatedRequestInput.conversationState!.currentMessage!.userInputMessage!.content = ''

        for (const toolResult of toolResults) {
            this.#debug(`ToolResult: ${JSON.stringify(toolResult)}`)
            updatedRequestInput.conversationState!.currentMessage!.userInputMessage!.userInputMessageContext!.toolResults.push(
                {
                    ...toolResult,
                }
            )
        }

        return updatedRequestInput
    }

    /**
     * Handles the final result after the agent loop completes
     */
    async #handleFinalResult(
        result: Result<AgenticChatResultWithMetadata, string>,
        session: ChatSessionService,
        params: ChatParams,
        metric: Metric<CombinedConversationEvent>,
        triggerContext: TriggerContext,
        isNewConversation: boolean
    ): Promise<ChatResult | ResponseError<ChatResult>> {
        if (!result.success) {
            return new ResponseError<ChatResult>(LSPErrorCodes.RequestFailed, result.error)
        }

        const conversationId = session.conversationId
        this.#debug('Final session conversation id:', conversationId || '')

        if (conversationId) {
            this.#telemetryController.setConversationId(params.tabId, conversationId)

            if (isNewConversation) {
                this.#telemetryController.updateTriggerInfo(params.tabId, {
                    startTrigger: {
                        hasUserSnippet: metric.metric.cwsprChatHasCodeSnippet ?? false,
                        triggerType: triggerContext.triggerType,
                    },
                })

                this.#telemetryController.emitStartConversationMetric(params.tabId, metric.metric)
            }
        }

        metric.setDimension('codewhispererCustomizationArn', this.#customizationArn)
        await this.#telemetryController.emitAddMessageMetric(params.tabId, metric.metric)

        this.#telemetryController.updateTriggerInfo(params.tabId, {
            lastMessageTrigger: {
                ...triggerContext,
                messageId: result.data?.chatResult.messageId,
                followUpActions: new Set(
                    result.data?.chatResult.followUp?.options
                        ?.map(option => option.prompt ?? '')
                        .filter(prompt => prompt.length > 0)
                ),
            },
        })

        // Save question/answer interaction to chat history
        if (params.prompt.prompt && conversationId && result.data?.chatResult.body) {
            this.#chatHistoryDb.addMessage(params.tabId, 'cwc', conversationId, {
                body: params.prompt.prompt,
                type: 'prompt' as any,
            })

            this.#chatHistoryDb.addMessage(params.tabId, 'cwc', conversationId, {
                body: result.data.chatResult.body,
                type: 'answer' as any,
                codeReference: result.data.chatResult.codeReference,
                relatedContent:
                    result.data.chatResult.relatedContent?.content &&
                    result.data.chatResult.relatedContent.content.length > 0
                        ? result.data?.chatResult.relatedContent
                        : undefined,
            })
        }

        return result.data.chatResult
    }

    /**
     * Handles errors that occur during the request
     */
    #handleRequestError(
        err: any,
        tabId: string,
        metric: Metric<CombinedConversationEvent>
    ): ChatResult | ResponseError<ChatResult> {
        if (isAwsError(err) || (isObject(err) && 'statusCode' in err && typeof err.statusCode === 'number')) {
            metric.setDimension('cwsprChatRepsonseCode', err.statusCode ?? 400)
            this.#telemetryController.emitMessageResponseError(tabId, metric.metric)
        }

        if (err instanceof AmazonQServicePendingSigninError) {
            this.#log(`Q Chat SSO Connection error: ${getErrorMessage(err)}`)
            return createAuthFollowUpResult('full-auth')
        }

        if (err instanceof AmazonQServicePendingProfileError) {
            this.#log(`Q Chat SSO Connection error: ${getErrorMessage(err)}`)
            const followUpResult = createAuthFollowUpResult('use-supported-auth')
            // Access first element in array
            if (followUpResult.followUp?.options) {
                followUpResult.followUp.options[0].pillText = 'Select Q Developer Profile'
            }
            return followUpResult
        }

        const authFollowType = getAuthFollowUpType(err)
        if (authFollowType) {
            this.#log(`Q auth error: ${getErrorMessage(err)}`)
            return createAuthFollowUpResult(authFollowType)
        }

        this.#log(`Q api request error ${err instanceof Error ? JSON.stringify(err) : 'unknown'}`)
        this.#debug(`Q api request error stack ${err instanceof Error ? JSON.stringify(err.stack) : 'unknown'}`)
        this.#debug(`Q api request error cause ${err instanceof Error ? JSON.stringify(err.cause) : 'unknown'}`)
        return new ResponseError<ChatResult>(
            LSPErrorCodes.RequestFailed,
            err instanceof Error ? err.message : 'Unknown request error'
        )
    }

    async onInlineChatPrompt(
        params: InlineChatParams,
        token: CancellationToken
    ): Promise<InlineChatResult | ResponseError<InlineChatResult>> {
        // TODO: This metric needs to be removed later, just added for now to be able to create a ChatEventParser object
        const metric = new Metric<AddMessageEvent>({
            cwsprChatConversationType: 'Chat',
        })
        const triggerContext = await this.#getInlineChatTriggerContext(params)

        let response: SendMessageCommandOutput
        let requestInput: SendMessageCommandInput

        try {
            requestInput = this.#triggerContext.getChatParamsFromTrigger(
                params,
                triggerContext,
                ChatTriggerType.INLINE_CHAT,
                this.#customizationArn
            )

            if (!this.#amazonQServiceManager) {
                throw new Error('amazonQServiceManager is not initialized')
            }

            const client = this.#amazonQServiceManager.getStreamingClient()
            response = await client.sendMessage(requestInput as SendMessageCommandInputCodeWhispererStreaming)
            this.#log('Response for inline chat', JSON.stringify(response.$metadata), JSON.stringify(response))
        } catch (err) {
            if (err instanceof AmazonQServicePendingSigninError || err instanceof AmazonQServicePendingProfileError) {
                this.#log(`Q Inline Chat SSO Connection error: ${getErrorMessage(err)}`)
                return new ResponseError<ChatResult>(LSPErrorCodes.RequestFailed, err.message)
            }
            this.#log(`Q api request error ${err instanceof Error ? JSON.stringify(err) : 'unknown'}`)
            return new ResponseError<ChatResult>(
                LSPErrorCodes.RequestFailed,
                err instanceof Error ? err.message : 'Unknown request error'
            )
        }

        try {
            const result = await this.#processSendMessageResponseForInlineChat(
                response,
                metric,
                params.partialResultToken
            )

            return result.success
                ? {
                      ...result.data.chatResult,
                      requestId: response.$metadata.requestId,
                  }
                : new ResponseError<ChatResult>(LSPErrorCodes.RequestFailed, result.error)
        } catch (err) {
            this.#log(
                'Error encountered during inline chat response streaming:',
                err instanceof Error ? err.message : 'unknown'
            )
            return new ResponseError<ChatResult>(
                LSPErrorCodes.RequestFailed,
                err instanceof Error ? err.message : 'Unknown error occurred during inline chat response stream'
            )
        }
    }

    async onInlineChatResult(handler: InlineChatResultParams) {}

    async onCodeInsertToCursorPosition(params: InsertToCursorPositionParams) {
        // Implementation based on https://github.com/aws/aws-toolkit-vscode/blob/1814cc84228d4bf20270574c5980b91b227f31cf/packages/core/src/amazonq/commons/controllers/contentController.ts#L38
        if (!params.textDocument || !params.cursorPosition || !params.code) {
            const missingParams = []

            if (!params.textDocument) missingParams.push('textDocument')
            if (!params.cursorPosition) missingParams.push('cursorPosition')
            if (!params.code) missingParams.push('code')

            this.#log(
                `Q Chat server failed to insert code. Missing required parameters for insert code: ${missingParams.join(', ')}`
            )

            return
        }

        let cursorPosition = params.cursorPosition

        const indentRange = {
            start: { line: cursorPosition.line, character: 0 },
            end: cursorPosition,
        }
        const documentContent = await this.#features.workspace.getTextDocument(params.textDocument.uri)
        // linePrefix is the raw text that is between the start of the line and the current cursor position
        let linePrefix = documentContent?.getText(indentRange)
        // calculatedIndent is the indent we calculate inside this function and apply to the text to be inserted
        let calculatedIndent = ''
        let hasVirtualSpace = false

        if (linePrefix) {
            // If linePrefix object is not empty, there are two possibilities:
            // Case 1: If linePrefix contains only whitespace: Use the entire linePrefix as is for the indent
            // Case 2: If linePrefix contains non-whitespace characters: Extract leading whitespace from linePrefix (if any), ignore rest of text
            calculatedIndent =
                linePrefix.trim().length == 0
                    ? linePrefix
                    : ' '.repeat(linePrefix.length - linePrefix.trimStart().length)
        } else if (documentContent && cursorPosition.character > 0) {
            // When the cursor is not at the start of the line (position > 0) but there's no actual text at the indentation range
            // It means there are virtual spaces that is being rendered by the IDE
            // In this case, the indentation is determined by the cursorPosition
            this.#log('Indent is nullish and the cursor position is greater than zero while inserting code')
            calculatedIndent = ' '.repeat(cursorPosition.character)
            hasVirtualSpace = true
            cursorPosition.character = 0
        }

        const textWithIndent = params.code
            .split('\n')
            .map((line, index) => {
                if (index === 0) {
                    return hasVirtualSpace && line ? calculatedIndent + line : line
                }
                // Only indent non-empty lines
                return line ? calculatedIndent + line : ''
            })
            .join('\n')

        const workspaceEdit: ApplyWorkspaceEditParams = {
            edit: {
                documentChanges: [
                    TextDocumentEdit.create({ uri: params.textDocument.uri, version: 0 }, [
                        TextEdit.insert(cursorPosition, textWithIndent),
                    ]),
                ],
            },
        }
        const applyResult = await this.#features.lsp.workspace.applyWorkspaceEdit(workspaceEdit)

        if (applyResult.applied) {
            this.#log(`Q Chat server inserted code successfully`)
            this.#telemetryController.enqueueCodeDiffEntry({ ...params, code: textWithIndent })
        } else {
            this.#log(
                `Q Chat server failed to insert code: ${applyResult.failureReason ?? 'No failure reason provided'}`
            )
        }
    }
    onCopyCodeToClipboard() {}

    onEndChat(params: EndChatParams, _token: CancellationToken): boolean {
        const { success } = this.#chatSessionManagementService.deleteSession(params.tabId)

        return success
    }

    onFollowUpClicked() {}

    onInfoLinkClick() {}

    onLinkClick() {}

    async onReady() {
        await this.#tabBarController.loadChats()
    }

    onSendFeedback({ tabId, feedbackPayload }: FeedbackParams) {
        this.#features.telemetry.emitMetric({
            name: 'amazonq_sendFeedback',
            data: {
                comment: JSON.stringify({
                    type: 'codewhisperer-chat-answer-feedback',
                    conversationId: this.#telemetryController.getConversationId(tabId) ?? '',
                    messageId: feedbackPayload.messageId,
                    reason: feedbackPayload.selectedOption,
                    userComment: feedbackPayload.comment,
                }),
                // this is always Negative because only thumbs down has a form
                sentiment: 'Negative',
            },
        })
    }

    onSourceLinkClick() {}

    onTabAdd(params: TabAddParams) {
        this.#telemetryController.activeTabId = params.tabId
        this.#chatSessionManagementService.createSession(params.tabId)
    }

    onTabChange(params: TabChangeParams) {
        this.#telemetryController.emitConversationMetric({
            name: ChatTelemetryEventName.ExitFocusConversation,
            data: {},
        })

        this.#telemetryController.activeTabId = params.tabId

        this.#telemetryController.emitConversationMetric({
            name: ChatTelemetryEventName.EnterFocusConversation,
            data: {},
        })
    }

    onTabRemove(params: TabRemoveParams) {
        if (this.#telemetryController.activeTabId === params.tabId) {
            this.#telemetryController.emitConversationMetric({
                name: ChatTelemetryEventName.ExitFocusConversation,
                data: {},
            })
            this.#telemetryController.activeTabId = undefined
        }
        this.#chatHistoryDb.updateTabOpenState(params.tabId, false)
        this.#chatSessionManagementService.deleteSession(params.tabId)
        this.#telemetryController.removeConversation(params.tabId)
    }

    onQuickAction(params: QuickActionParams, _cancellationToken: CancellationToken) {
        switch (params.quickAction) {
            case QuickAction.Clear: {
                const sessionResult = this.#chatSessionManagementService.getSession(params.tabId)

                this.#telemetryController.emitChatMetric({
                    name: ChatTelemetryEventName.RunCommand,
                    data: {
                        cwsprChatCommandType: params.quickAction,
                    },
                })

                this.#telemetryController.removeConversation(params.tabId)
                this.#chatHistoryDb.clearTab(params.tabId)

                sessionResult.data?.clear()

                return {}
            }

            case QuickAction.Help:
                this.#telemetryController.emitChatMetric({
                    name: ChatTelemetryEventName.RunCommand,
                    data: {
                        cwsprChatCommandType: params.quickAction,
                    },
                })
                return {
                    messageId: uuid(),
                    body: HELP_MESSAGE,
                }
            default:
                return {}
        }
    }

    async onTabBarAction(params: TabBarActionParams) {
        return this.#tabBarController.onTabBarAction(params)
    }

    async #getInlineChatTriggerContext(params: InlineChatParams) {
        let triggerContext: TriggerContext = await this.#triggerContext.getNewTriggerContext(params)
        return triggerContext
    }

    async #getTriggerContext(params: ChatParams, metric: Metric<CombinedConversationEvent>) {
        const lastMessageTrigger = this.#telemetryController.getLastMessageTrigger(params.tabId)

        let triggerContext: TriggerContext

        // this is the only way we can detect a follow up action
        // we can reuse previous trigger information
        if (lastMessageTrigger?.followUpActions?.has(params.prompt?.prompt ?? '')) {
            await this.#telemetryController.emitInteractWithMessageMetric(params.tabId, {
                cwsprChatMessageId: lastMessageTrigger.messageId!,
                cwsprChatInteractionType: ChatInteractionType.ClickFollowUp,
            })

            triggerContext = lastMessageTrigger
        } else {
            triggerContext = await this.#triggerContext.getNewTriggerContext(params)
            triggerContext.triggerType = this.#telemetryController.getCurrentTrigger(params.tabId) ?? 'click'
        }

        metric.mergeWith({
            cwsprChatUserIntent: triggerContext?.userIntent,
            cwsprChatProgrammingLanguage: triggerContext?.programmingLanguage?.languageName,
            cwsprChatRequestLength: params.prompt?.prompt?.length ?? 0,
            cwsprChatTriggerInteraction: triggerContext?.triggerType,
            cwsprChatHasCodeSnippet: triggerContext.hasCodeSnippet ?? false,
            cwsprChatActiveEditorTotalCharacters: triggerContext.totalEditorCharacters ?? 0,
        })

        return triggerContext
    }

    async #processGenerateAssistantResponseResponse(
        response: GenerateAssistantResponseCommandOutput,
        metric: Metric<AddMessageEvent>,
        partialResultToken?: string | number
    ): Promise<Result<AgenticChatResultWithMetadata, string>> {
        const requestId = response.$metadata.requestId!
        const chatEventParser = new AgenticChatEventParser(requestId, metric)

        for await (const chatEvent of response.generateAssistantResponseResponse!) {
            const result = chatEventParser.processPartialEvent(chatEvent)

            // terminate early when there is an error
            if (!result.success) {
                return result
            }

            if (!isNullish(partialResultToken)) {
                await this.#features.lsp.sendProgress(chatRequestType, partialResultToken, result.data.chatResult)
            }
        }

        metric.mergeWith({
            cwsprChatFullResponseLatency: metric.getTimeElapsed(),
            cwsprChatFollowUpCount: chatEventParser.totalEvents.followupPromptEvent,
            cwsprChatReferencesCount: chatEventParser.totalEvents.codeReferenceEvent,
            cwsprChatSourceLinkCount: chatEventParser.totalEvents.supplementaryWebLinksEvent,
            cwsprChatResponseLength: chatEventParser.body?.length ?? 0,
        })

        return chatEventParser.getResult()
    }

    async #processSendMessageResponseForInlineChat(
        response: SendMessageCommandOutput,
        metric: Metric<AddMessageEvent>,
        partialResultToken?: string | number
    ): Promise<Result<ChatResultWithMetadata, string>> {
        const requestId = response.$metadata.requestId!
        const chatEventParser = new ChatEventParser(requestId, metric)

        for await (const chatEvent of response.sendMessageResponse!) {
            const result = chatEventParser.processPartialEvent(chatEvent)

            // terminate early when there is an error
            if (!result.success) {
                return result
            }

            if (!isNullish(partialResultToken)) {
                await this.#features.lsp.sendProgress(chatRequestType, partialResultToken, result.data.chatResult)
            }
        }

        return chatEventParser.getResult()
    }

    updateConfiguration = (newConfig: AmazonQWorkspaceConfig) => {
        this.#customizationArn = newConfig.customizationArn
        this.#log(`Chat configuration updated customizationArn to ${this.#customizationArn}`)
        /*
            The flag enableTelemetryEventsToDestination is set to true temporarily. It's value will be determined through destination
            configuration post all events migration to STE. It'll be replaced by qConfig['enableTelemetryEventsToDestination'] === true
        */
        // const enableTelemetryEventsToDestination = true
        // this.#telemetryService.updateEnableTelemetryEventsToDestination(enableTelemetryEventsToDestination)
        const updatedOptOutPreference = newConfig.optOutTelemetryPreference
        this.#telemetryService.updateOptOutPreference(updatedOptOutPreference)
        this.#log(`Chat configuration telemetry preference to ${updatedOptOutPreference}`)
    }

    #log(...messages: string[]) {
        this.#features.logging.log(messages.join(' '))
    }

    #debug(...messages: string[]) {
        this.#features.logging.debug(messages.join(' '))
    }

    async #getRelevantDocuments(prompt: string): Promise<RelevantTextDocumentAddition[]> {
        try {
            this.#log('Querying relevant documents from local project index')
            const localProjectContextController = LocalProjectContextController.getInstance()
            const chunks = await localProjectContextController.queryVectorIndex({ query: prompt })
            // adapted from vscode toolkit
            const relevantTextDocuments = chunks.map(chunk => ({
                text: chunk.context ? chunk.context : chunk.content,
                relativeFilePath: chunk.relativePath ? chunk.relativePath : path.basename(chunk.filePath),
                programmingLanguage:
                    chunk.programmingLanguage && chunk.programmingLanguage !== 'unknown'
                        ? { languageName: chunk.programmingLanguage }
                        : undefined,
                startLine: chunk.startLine ?? -1,
                endLine: chunk.endLine ?? -1,
            }))
            return relevantTextDocuments
        } catch (e) {
            this.#log(`Error: cannot query vector index to get relevant documents. ${e}`)
            // TODO: trigger a server event to warn the user that error happened.
            //
            // There are two possibilities:
            //
            //   1. the local project index is not yet initialized, this should not happen
            //      if the user is using just UI because the `@workspace` context option is
            //      only available after the local project index server is initialized.
            //   2. querying vector index caused error. Might be worthy of handling the two
            //      types of exceptions differently.
            return []
        }
    }
}
