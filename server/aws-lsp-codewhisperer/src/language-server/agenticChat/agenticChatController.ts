/**
 * Copied from ../chat/chatController.ts for the purpose of developing a divergent implementation.
 * Will be deleted or merged.
 */

import * as path from 'path'
import {
    ChatTriggerType,
    GenerateAssistantResponseCommandInput,
    GenerateAssistantResponseCommandOutput,
    SendMessageCommandInput,
    SendMessageCommandInput as SendMessageCommandInputCodeWhispererStreaming,
    SendMessageCommandOutput,
    ToolResult,
    ToolResultContentBlock,
    ToolUse,
} from '@amzn/codewhisperer-streaming'
import {
    Button,
    ButtonClickParams,
    ButtonClickResult,
    ChatMessage,
    chatRequestType,
    FileDetails,
    InlineChatResultParams,
    PromptInputOptionChangeParams,
} from '@aws/language-server-runtimes/protocol'
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
    CreatePromptParams,
    FileClickParams,
} from '@aws/language-server-runtimes/protocol'
import {
    CancellationToken,
    Chat,
    ChatParams,
    ChatResult,
    FileList,
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
import {
    AgenticChatEventParser,
    ChatResultWithMetadata as AgenticChatResultWithMetadata,
} from './agenticChatEventParser'
import { ChatSessionService } from '../chat/chatSessionService'
import { AgenticChatResultStream } from './agenticChatResultStream'
import { executeToolMessage, toolErrorMessage, toolResultMessage } from './textFormatting'
import {
    AdditionalContentEntryAddition,
    AgenticChatTriggerContext,
    TriggerContext,
} from './context/agenticChatTriggerContext'
import { AdditionalContextProvider } from './context/addtionalContextProvider'
import { getNewPromptFilePath, getUserPromptsDirectory, promptFileExtension } from './context/contextUtils'
import { ContextCommandsProvider } from './context/contextCommandsProvider'
import { LocalProjectContextController } from '../../shared/localProjectContextController'
import { CancellationError, workspaceUtils } from '@aws/lsp-core'
import { FsRead, FsReadParams } from './tools/fsRead'
import { ListDirectory, ListDirectoryParams } from './tools/listDirectory'
import { FsWrite, FsWriteParams, getDiffChanges } from './tools/fsWrite'
import { ExecuteBash, ExecuteBashOutput, ExecuteBashParams } from './tools/executeBash'
import { ExplanatoryParams, InvokeOutput, ToolApprovalException } from './tools/toolShared'
import { ModelServiceException } from './errors'
import { FileSearch, FileSearchParams } from './tools/fileSearch'

type ChatHandlers = Omit<
    LspHandlers<Chat>,
    | 'openTab'
    | 'sendChatUpdate'
    | 'sendContextCommands'
    | 'onListConversations'
    | 'onConversationClick'
    | 'onTabBarAction'
    | 'getSerializedChat'
    | 'chatOptionsUpdate'
>

export class AgenticChatController implements ChatHandlers {
    #features: Features
    #chatSessionManagementService: ChatSessionManagementService
    #telemetryController: ChatTelemetryController
    #triggerContext: AgenticChatTriggerContext
    #customizationArn?: string
    #telemetryService: TelemetryService
    #amazonQServiceManager?: AmazonQTokenServiceManager
    #tabBarController: TabBarController
    #chatHistoryDb: ChatDatabase
    #additionalContextProvider: AdditionalContextProvider
    #contextCommandsProvider: ContextCommandsProvider

    constructor(
        chatSessionManagementService: ChatSessionManagementService,
        features: Features,
        telemetryService: TelemetryService,
        amazonQServiceManager?: AmazonQTokenServiceManager
    ) {
        this.#features = features
        this.#chatSessionManagementService = chatSessionManagementService
        this.#triggerContext = new AgenticChatTriggerContext(features)
        this.#telemetryController = new ChatTelemetryController(features, telemetryService)
        this.#telemetryService = telemetryService
        this.#amazonQServiceManager = amazonQServiceManager
        this.#chatHistoryDb = new ChatDatabase(features)
        this.#tabBarController = new TabBarController(features, this.#chatHistoryDb)
        this.#additionalContextProvider = new AdditionalContextProvider(features.workspace, features.lsp)
        this.#contextCommandsProvider = new ContextCommandsProvider(
            this.#features.logging,
            this.#features.chat,
            this.#features.workspace
        )
    }

    async onButtonClick(params: ButtonClickParams): Promise<ButtonClickResult> {
        this.#log(`onButtonClick event with params: ${JSON.stringify(params)}`)
        if (
            params.buttonId === 'run-shell-command' ||
            params.buttonId === 'reject-shell-command' ||
            params.buttonId === 'allow-tools'
        ) {
            const session = this.#chatSessionManagementService.getSession(params.tabId)
            if (!session.data) {
                return { success: false, failureReason: `could not find chat session for tab: ${params.tabId} ` }
            }
            const handler = session.data.getDeferredToolExecution(params.messageId)
            if (!handler?.reject || !handler.resolve) {
                return {
                    success: false,
                    failureReason: `could not find deferred tool execution for message: ${params.messageId} `,
                }
            }
            params.buttonId === 'reject-shell-command' ? handler.reject(new ToolApprovalException()) : handler.resolve()
            return {
                success: true,
            }
        } else if (params.buttonId === 'undo-changes') {
            const toolUseId = params.messageId
            try {
                await this.#undoFileChange(toolUseId)
                const cachedToolUse = this.#triggerContext.getToolUseLookup().get(toolUseId)
                if (cachedToolUse) {
                    this.#features.chat.sendChatUpdate({
                        tabId: params.tabId,
                        data: {
                            messages: [
                                {
                                    ...cachedToolUse.chatResult,
                                    header: {
                                        ...cachedToolUse.chatResult?.header,
                                        buttons: cachedToolUse.chatResult?.header?.buttons?.filter(
                                            button => button.id !== 'undo-changes'
                                        ),
                                        status: { status: 'error', icon: 'cancel', text: 'Change discarded' },
                                    },
                                },
                            ],
                        },
                    })
                }
            } catch (err: any) {
                return { success: false, failureReason: err.message }
            }
            return {
                success: true,
            }
        } else {
            return {
                success: false,
                failureReason: 'not implemented',
            }
        }
    }

    async #undoFileChange(toolUseId: string): Promise<void> {
        this.#log(`Reverting file change for tooluseId: ${toolUseId}`)
        const toolUse = this.#triggerContext.getToolUseLookup().get(toolUseId)

        const input = toolUse?.input as unknown as FsWriteParams
        if (toolUse?.oldContent) {
            await this.#features.workspace.fs.writeFile(input.path, toolUse.oldContent)
        } else {
            await this.#features.workspace.fs.rm(input.path)
        }
    }

    async onCreatePrompt(params: CreatePromptParams): Promise<void> {
        const newFilePath = getNewPromptFilePath(params.promptName)
        const newFileContent = ''
        try {
            await this.#features.workspace.fs.writeFile(newFilePath, newFileContent, { mode: 0o600 })
            await this.#features.lsp.window.showDocument({ uri: newFilePath })
        } catch (e) {
            this.#features.logging.warn(`Error creating prompt file: ${e}`)
        }
    }

    dispose() {
        this.#chatSessionManagementService.dispose()
        this.#telemetryController.dispose()
        this.#chatHistoryDb.close()
        this.#contextCommandsProvider?.dispose()
    }

    async onListConversations(params: ListConversationsParams) {
        return this.#tabBarController.onListConversations(params)
    }

    async onConversationClick(params: ConversationClickParams) {
        return this.#tabBarController.onConversationClick(params)
    }

    async #sendProgressToClient(chunk: ChatResult | string, partialResultToken?: string | number) {
        if (!isNullish(partialResultToken)) {
            await this.#features.lsp.sendProgress(chatRequestType, partialResultToken, chunk)
        }
    }

    #getChatResultStream(partialResultToken?: string | number): AgenticChatResultStream {
        return new AgenticChatResultStream(async (result: ChatResult | string) => {
            return this.#sendProgressToClient(result, partialResultToken)
        })
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
            cwsprChatConversationType: 'AgenticChat',
        })

        const triggerContext = await this.#getTriggerContext(params, metric)
        const isNewConversation = !session.conversationId
        if (isNewConversation) {
            // agentic chat does not support conversationId in API response,
            // so we set it to random UUID per session, as other chat functionality
            // depends on it
            session.conversationId = uuid()
        }

        token.onCancellationRequested(() => {
            this.#log('cancellation requested')
            session.abortRequest()
            session.rejectAllDeferredToolExecutions(new CancellationError('user'))
        })

        const chatResultStream = this.#getChatResultStream(params.partialResultToken)
        try {
            const additionalContext = await this.#additionalContextProvider.getAdditionalContext(
                triggerContext,
                (params.prompt as any).context
            )
            if (additionalContext.length) {
                triggerContext.documentReference =
                    this.#additionalContextProvider.getFileListFromContext(additionalContext)
            }
            // Get the initial request input
            const initialRequestInput = await this.#prepareRequestInput(
                params,
                session,
                triggerContext,
                additionalContext,
                chatResultStream
            )

            // Start the agent loop
            const finalResult = await this.#runAgentLoop(
                initialRequestInput,
                session,
                metric,
                chatResultStream,
                params.tabId,
                session.conversationId,
                token,
                triggerContext.documentReference
            )

            // Phase 5: Result Handling - This happens only once
            return await this.#handleFinalResult(
                finalResult,
                session,
                params,
                metric,
                triggerContext,
                isNewConversation,
                chatResultStream
            )
        } catch (err) {
            // HACK: the chat-client needs to have a partial event with the associated messageId sent before it can accept the final result.
            // Without this, the `thinking` indicator never goes away.
            // Note: buttons being explicitly empty is required for this hack to work.
            const errorMessageId = `error-message-id-${uuid()}`
            await this.#sendProgressToClient(
                {
                    type: 'answer',
                    body: '',
                    messageId: errorMessageId,
                    buttons: [],
                },
                params.partialResultToken
            )
            if (this.isUserAction(err, token)) {
                /**
                 * when the session is aborted it generates an error.
                 * we need to resolve this error with an answer so the
                 * stream stops
                 */
                return {
                    type: 'answer',
                    body: '',
                    messageId: errorMessageId,
                    buttons: [],
                }
            }
            return this.#handleRequestError(err, errorMessageId, params.tabId, metric)
        }
    }

    /**
     * Prepares the initial request input for the chat prompt
     */
    async #prepareRequestInput(
        params: ChatParams,
        session: ChatSessionService,
        triggerContext: TriggerContext,
        additionalContext: AdditionalContentEntryAddition[],
        chatResultStream: AgenticChatResultStream
    ): Promise<GenerateAssistantResponseCommandInput> {
        this.#debug('Preparing request input')
        const profileArn = AmazonQTokenServiceManager.getInstance(this.#features).getActiveProfileArn()
        const requestInput = await this.#triggerContext.getChatParamsFromTrigger(
            params,
            triggerContext,
            ChatTriggerType.MANUAL,
            this.#customizationArn,
            chatResultStream,
            profileArn,
            [],
            this.#getTools(session),
            additionalContext
        )

        return requestInput
    }

    /**
     * Runs the agent loop, making requests and processing tool uses until completion
     */
    async #runAgentLoop(
        initialRequestInput: GenerateAssistantResponseCommandInput,
        session: ChatSessionService,
        metric: Metric<CombinedConversationEvent>,
        chatResultStream: AgenticChatResultStream,
        tabId: string,
        conversationIdentifier?: string,
        token?: CancellationToken,
        documentReference?: FileList
    ): Promise<Result<AgenticChatResultWithMetadata, string>> {
        let currentRequestInput = { ...initialRequestInput }
        let finalResult: Result<AgenticChatResultWithMetadata, string> | null = null
        let iterationCount = 0
        const maxIterations = 100 // Safety limit to prevent infinite loops
        metric.recordStart()

        let loadingMessageId
        while (iterationCount < maxIterations) {
            iterationCount++
            this.#debug(`Agent loop iteration ${iterationCount} for conversation id:`, conversationIdentifier || '')

            // Check for cancellation
            if (token?.isCancellationRequested) {
                throw new CancellationError('user')
            }

            const currentMessage = currentRequestInput.conversationState?.currentMessage
            const conversationId = conversationIdentifier ?? ''

            // show loading message while we process request
            loadingMessageId = `loading-${uuid()}-${iterationCount}`
            await chatResultStream.writeResultBlock({ messageId: loadingMessageId, type: 'answer' })

            if (!currentMessage || !conversationId) {
                this.#debug(
                    `Warning: ${!currentMessage ? 'currentMessage' : ''}${!currentMessage && !conversationId ? ' and ' : ''}${!conversationId ? 'conversationIdentifier' : ''} is empty in agent loop iteration ${iterationCount}.`
                )
            }

            //  Fix the history to maintain invariants
            if (currentMessage) {
                this.#chatHistoryDb.fixHistory(tabId, currentMessage, conversationIdentifier ?? '')
            }

            //  Retrieve the history from DB; Do not include chatHistory for requests going to Mynah Backend
            currentRequestInput.conversationState!.history = currentRequestInput.conversationState?.currentMessage
                ?.userInputMessage?.userIntent
                ? []
                : this.#chatHistoryDb.getMessages(tabId)

            //  Add the current user message to the history DB
            if (currentMessage && conversationIdentifier) {
                this.#chatHistoryDb.addMessage(tabId, 'cwc', conversationIdentifier, {
                    body: currentMessage.userInputMessage?.content ?? '',
                    type: 'prompt' as any,
                    userIntent: currentMessage.userInputMessage?.userIntent,
                    origin: currentMessage.userInputMessage?.origin,
                    userInputMessageContext: currentMessage.userInputMessage?.userInputMessageContext,
                })
            }

            // Phase 3: Request Execution
            const response = await this.fetchModelResponse(currentRequestInput, i =>
                session.generateAssistantResponse(i)
            )

            // remove the temp loading message when we have response
            if (loadingMessageId) {
                await chatResultStream.removeResultBlock(loadingMessageId)
                this.#features.chat.sendChatUpdate({ tabId, state: { inProgress: false } })
                loadingMessageId = undefined
            }

            // Phase 4: Response Processing
            const result = await this.#processGenerateAssistantResponseResponse(
                response,
                metric.mergeWith({
                    cwsprChatResponseCode: response.$metadata.httpStatusCode,
                    cwsprChatMessageId: response.$metadata.requestId,
                }),
                chatResultStream,
                documentReference
            )

            // show loading message after we render text response and before processing toolUse
            loadingMessageId = `loading-${uuid()}-${iterationCount}`
            await chatResultStream.writeResultBlock({ messageId: loadingMessageId, type: 'answer' })

            //  Add the current assistantResponse message to the history DB
            if (result.data?.chatResult.body !== undefined) {
                this.#chatHistoryDb.addMessage(tabId, 'cwc', conversationIdentifier ?? '', {
                    body: result.data?.chatResult.body,
                    type: 'answer' as any,
                    codeReference: result.data.chatResult.codeReference,
                    relatedContent:
                        result.data.chatResult.relatedContent?.content &&
                        result.data.chatResult.relatedContent.content.length > 0
                            ? result.data?.chatResult.relatedContent
                            : undefined,
                    toolUses: Object.keys(result.data?.toolUses!).map(k => ({
                        toolUseId: result.data!.toolUses[k].toolUseId,
                        name: result.data!.toolUses[k].name,
                        input: result.data!.toolUses[k].input,
                    })),
                })
            }

            // Check if we have any tool uses that need to be processed
            const pendingToolUses = this.#getPendingToolUses(result.data?.toolUses || {})

            // remove the temp loading message when we are going to process toolUse
            if (loadingMessageId) {
                await chatResultStream.removeResultBlock(loadingMessageId)
                this.#features.chat.sendChatUpdate({ tabId, state: { inProgress: false } })
                loadingMessageId = undefined
            }

            if (pendingToolUses.length === 0) {
                // No more tool uses, we're done
                finalResult = result
                break
            }

            // Process tool uses and update the request input for the next iteration
            const toolResults = await this.#processToolUses(pendingToolUses, chatResultStream, session, tabId, token)
            currentRequestInput = this.#updateRequestInputWithToolResults(currentRequestInput, toolResults)
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
     * Creates a promise that does not resolve until the user accepts or rejects the tool usage.
     * @param toolUseId
     * @param toolUseName
     * @param resultStream
     * @param promptBlockId id of approval block. This allows us to overwrite the buttons with 'accepted' or 'rejected' text.
     * @param session
     */
    async waitForToolApproval(
        toolUse: ToolUse,
        resultStream: AgenticChatResultStream,
        promptBlockId: number,
        session: ChatSessionService
    ) {
        const deferred = this.#createDeferred()
        session.setDeferredToolExecution(toolUse.toolUseId!, deferred.resolve, deferred.reject)
        this.#log(`Prompting for tool approval for tool: ${toolUse.name}`)
        await deferred.promise
        if (toolUse.name === 'executeBash') {
            // Note: we want to overwrite the button block because it already exists in the stream.
            await resultStream.overwriteResultBlock(this.#getUpdateBashConfirmResult(toolUse, true), promptBlockId)
        }
    }

    /**
     * Processes tool uses by running the tools and collecting results
     */
    async #processToolUses(
        toolUses: Array<ToolUse & { stop: boolean }>,
        chatResultStream: AgenticChatResultStream,
        session: ChatSessionService,
        tabId: string,
        token?: CancellationToken
    ): Promise<ToolResult[]> {
        const results: ToolResult[] = []
        let buttonBlockId
        let loadingMessageId

        for (const toolUse of toolUses) {
            if (!toolUse.name || !toolUse.toolUseId) continue
            this.#triggerContext.getToolUseLookup().set(toolUse.toolUseId, toolUse)

            try {
                const { explanation } = toolUse.input as unknown as ExplanatoryParams
                if (explanation) {
                    await chatResultStream.writeResultBlock({
                        type: 'directive',
                        messageId: toolUse.toolUseId + '_explanation',
                        body: explanation,
                    })
                }
                switch (toolUse.name) {
                    case 'fsRead':
                    case 'listDirectory':
                    case 'fileSearch':
                    case 'fsWrite':
                    case 'executeBash': {
                        const toolMap = {
                            fsRead: { Tool: FsRead },
                            listDirectory: { Tool: ListDirectory },
                            fsWrite: { Tool: FsWrite },
                            executeBash: { Tool: ExecuteBash },
                            fileSearch: { Tool: FileSearch },
                        }

                        const { Tool } = toolMap[toolUse.name as keyof typeof toolMap]
                        const tool = new Tool(this.#features)
                        const { requiresAcceptance, warning } = await tool.requiresAcceptance(toolUse.input as any)

                        if (requiresAcceptance || toolUse.name === 'executeBash') {
                            // for executeBash, we till send the confirmation message without action buttons
                            const confirmationResult = this.#processToolConfirmation(
                                toolUse,
                                requiresAcceptance,
                                warning
                            )
                            const buttonBlockId = await chatResultStream.writeResultBlock(confirmationResult)
                            if (requiresAcceptance) {
                                await this.waitForToolApproval(toolUse, chatResultStream, buttonBlockId, session)
                            }
                        }
                        break
                    }
                    default:
                        await chatResultStream.writeResultBlock({
                            type: 'tool',
                            body: `${executeToolMessage(toolUse)}`,
                            messageId: toolUse.toolUseId,
                        })
                        break
                }
                // show thinking spinner when tool is running
                loadingMessageId = `loading-${toolUse.toolUseId}`
                await chatResultStream.writeResultBlock({ messageId: loadingMessageId, type: 'answer' })
                this.#features.chat.sendChatUpdate({ tabId, state: { inProgress: true } })

                if (toolUse.name === 'fsWrite') {
                    const input = toolUse.input as unknown as FsWriteParams
                    const document = await this.#triggerContext.getTextDocument(input.path)
                    this.#triggerContext
                        .getToolUseLookup()
                        .set(toolUse.toolUseId, { ...toolUse, oldContent: document?.getText() })
                }

                const ws = this.#getWritableStream(chatResultStream, toolUse)
                const result = await this.#features.agent.runTool(toolUse.name, toolUse.input, token, ws)

                // remove the temp loading message when tool finishes
                if (loadingMessageId) {
                    await chatResultStream.removeResultBlock(loadingMessageId)
                    this.#features.chat.sendChatUpdate({ tabId, state: { inProgress: false } })
                    loadingMessageId = undefined
                }

                let toolResultContent: ToolResultContentBlock

                if (typeof result === 'string') {
                    toolResultContent = { text: result }
                } else if (Array.isArray(result)) {
                    toolResultContent = { json: { items: result } }
                } else if (typeof result === 'object') {
                    toolResultContent = { json: result }
                } else toolResultContent = { text: JSON.stringify(result) }
                this.#validateToolResult(toolUse, toolResultContent)

                results.push({
                    toolUseId: toolUse.toolUseId,
                    status: 'success',
                    content: [toolResultContent],
                })

                switch (toolUse.name) {
                    case 'fsRead':
                    case 'listDirectory':
                    case 'fileSearch':
                        const initialListDirResult = this.#processReadOrListOrSearch(toolUse, chatResultStream)
                        if (initialListDirResult) {
                            await chatResultStream.writeResultBlock(initialListDirResult)
                        }
                        break
                    // no need to write tool result for listDir,fsRead,fileSearch into chat stream
                    case 'executeBash':
                        // no need to write tool result for listDir and fsRead into chat stream
                        // executeBash will stream the output instead of waiting until the end
                        break
                    case 'fsWrite':
                        const chatResult = await this.#getFsWriteChatResult(toolUse)
                        const toolUseLookup = this.#triggerContext.getToolUseLookup()
                        const cachedToolUse = toolUseLookup.get(toolUse.toolUseId)
                        if (cachedToolUse) {
                            toolUseLookup.set(toolUse.toolUseId, { ...cachedToolUse, chatResult })
                        }
                        await chatResultStream.writeResultBlock(chatResult)
                        break
                    default:
                        await chatResultStream.writeResultBlock({
                            type: 'tool',
                            body: toolResultMessage(toolUse, result),
                            messageId: toolUse.toolUseId,
                        })
                        break
                }
                if (toolUse.name) {
                    this.#telemetryController.emitToolUseSuggested(toolUse, session.conversationId || '')
                }
            } catch (err) {
                if (loadingMessageId) {
                    await chatResultStream.removeResultBlock(loadingMessageId)
                    this.#features.chat.sendChatUpdate({ tabId, state: { inProgress: false } })
                    loadingMessageId = undefined
                }

                if (this.isUserAction(err, token)) {
                    if (err instanceof ToolApprovalException && toolUse.name === 'executeBash') {
                        if (buttonBlockId) {
                            await chatResultStream.overwriteResultBlock(
                                this.#getUpdateBashConfirmResult(toolUse, false),
                                buttonBlockId
                            )
                        } else {
                            this.#features.logging.log('Failed to update executeBash block: no blockId is available.')
                        }
                    }
                    throw err
                }
                const errMsg = err instanceof Error ? err.message : 'unknown error'
                this.#log(`Error running tool ${toolUse.name}:`, errMsg)
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
     * Determines if error is thrown as a result of a user action (Ex. rejecting tool, stop button)
     * @param err
     * @returns
     */
    isUserAction(err: unknown, token?: CancellationToken): boolean {
        return (
            CancellationError.isUserCancelled(err) ||
            err instanceof ToolApprovalException ||
            (token?.isCancellationRequested ?? false)
        )
    }

    async fetchModelResponse<RequestType, ResponseType>(
        requestInput: RequestType,
        makeRequest: (requestInput: RequestType) => Promise<ResponseType>
    ): Promise<ResponseType> {
        this.#debug(`Q Backend Request: ${JSON.stringify(requestInput)}`)
        try {
            const response = await makeRequest(requestInput)
            this.#debug(`Q Backend Response: ${JSON.stringify(response)}`)
            return response
        } catch (e) {
            this.#features.logging.error(`Error in call: ${JSON.stringify(e)}`)
            throw new ModelServiceException(e as Error)
        }
    }

    #validateToolResult(toolUse: ToolUse, result: ToolResultContentBlock) {
        let maxToolResponseSize
        switch (toolUse.name) {
            case 'fsRead':
                maxToolResponseSize = 200_000
                break
            case 'listDirectory':
                maxToolResponseSize = 30_000
                break
            default:
                maxToolResponseSize = 100_000
                break
        }
        if (
            (result.text && result.text.length > maxToolResponseSize) ||
            (result.json && JSON.stringify(result.json).length > maxToolResponseSize)
        ) {
            throw Error(`${toolUse.name} output exceeds maximum character limit of ${maxToolResponseSize}`)
        }
    }

    #getWritableStream(chatResultStream: AgenticChatResultStream, toolUse: ToolUse): WritableStream | undefined {
        if (toolUse.name !== 'executeBash') {
            return
        }
        return new WritableStream({
            write: async chunk => {
                await chatResultStream.writeResultBlock({
                    type: 'tool',
                    body: chunk,
                    messageId: toolUse.toolUseId,
                })
            },
            close: async () => {
                await chatResultStream.writeResultBlock({
                    type: 'tool',
                    body: '```',
                    messageId: toolUse.toolUseId,
                })
            },
        })
    }

    #getUpdateBashConfirmResult(toolUse: ToolUse, isAccept: boolean): ChatResult {
        return {
            messageId: toolUse.toolUseId,
            type: 'tool',
            body: '```shell\n' + (toolUse.input as unknown as ExecuteBashParams).command + '\n',
            header: {
                body: 'shell',
                status: {
                    status: isAccept ? 'success' : 'error',
                    icon: isAccept ? 'ok' : 'cancel',
                    text: isAccept ? 'Accepted' : 'Rejected',
                },
            },
        }
    }

    #processToolConfirmation(
        toolUse: ToolUse,
        requiresAcceptance: Boolean,
        warning?: string,
        toolType?: string
    ): ChatResult {
        let buttons: Button[] = []
        let header: { body: string; buttons: Button[]; icon?: string; iconForegroundStatus?: string }
        let body: string

        switch (toolType || toolUse.name) {
            case 'executeBash':
                buttons = requiresAcceptance
                    ? [
                          {
                              id: 'reject-shell-command',
                              text: 'Reject',
                              icon: 'cancel',
                          },
                          {
                              id: 'run-shell-command',
                              text: 'Run',
                              icon: 'play',
                          },
                      ]
                    : []
                header = {
                    body: 'shell',
                    buttons,
                }
                const commandString = (toolUse.input as unknown as ExecuteBashParams).command
                body = '```shell\n' + commandString + '\n'
                break

            case 'fsWrite':
                buttons = [
                    {
                        id: 'allow-tools', // Reusing the same ID for simplicity, could be changed to 'allow-write-tools'
                        text: 'Allow',
                        icon: 'ok',
                        status: 'clear',
                    },
                ]
                header = {
                    icon: 'warning',
                    iconForegroundStatus: 'warning',
                    body: '#### Allow file modification outside of your workspace',
                    buttons,
                }
                const writeFilePath = (toolUse.input as unknown as FsWriteParams).path
                body = `I need permission to modify files in your workspace.\n\`${writeFilePath}\``
                break

            case 'fsRead':
            case 'listDirectory':
            default:
                buttons = [
                    {
                        id: 'allow-tools',
                        text: 'Allow',
                        icon: 'ok',
                        status: 'clear',
                    },
                ]
                header = {
                    icon: 'warning',
                    iconForegroundStatus: 'warning',
                    body: '#### Allow read-only tools outside your workspace',
                    buttons,
                }
                // ⚠️ Warning: This accesses files outside the workspace
                const readFilePath = (toolUse.input as unknown as FsReadParams | ListDirectoryParams).path
                body = `I need permission to read files and list directories outside the workspace.\n\`${readFilePath}\``
                break
        }

        return {
            type: 'tool',
            messageId: toolUse.toolUseId,
            header,
            body: warning ? warning + (toolType === 'executeBash' ? '' : '\n\n') + body : body,
        }
    }

    async #getFsWriteChatResult(toolUse: ToolUse): Promise<ChatMessage> {
        const input = toolUse.input as unknown as FsWriteParams
        const oldContent = this.#triggerContext.getToolUseLookup().get(toolUse.toolUseId!)?.oldContent ?? ''
        const diffChanges = getDiffChanges(input, oldContent)
        // Get just the filename instead of the full path
        const fileName = path.basename(input.path)
        const changes = diffChanges.reduce(
            (acc, { count = 0, added, removed }) => {
                if (added) {
                    acc.added += count
                } else if (removed) {
                    acc.deleted += count
                }
                return acc
            },
            { added: 0, deleted: 0 }
        )
        return {
            type: 'tool',
            messageId: toolUse.toolUseId,
            header: {
                fileList: {
                    filePaths: [fileName],
                    details: {
                        [fileName]: {
                            changes,
                            description: input.path,
                        },
                    },
                },
                buttons: [{ id: 'undo-changes', text: 'Undo', icon: 'undo' }],
            },
        }
    }

    #processReadOrListOrSearch(toolUse: ToolUse, chatResultStream: AgenticChatResultStream): ChatMessage | undefined {
        let messageIdToUpdate = toolUse.toolUseId!
        const currentId = chatResultStream.getMessageIdToUpdateForTool(toolUse.name!)

        if (currentId) {
            messageIdToUpdate = currentId
        } else {
            chatResultStream.setMessageIdToUpdateForTool(toolUse.name!, messageIdToUpdate)
        }

        const currentPath = (toolUse.input as unknown as FsReadParams | ListDirectoryParams | FileSearchParams)?.path
        if (!currentPath) return
        const existingPaths = chatResultStream.getMessageOperation(messageIdToUpdate)?.filePaths || []
        // Check if path already exists in the list
        const isPathAlreadyProcessed = existingPaths.some(path => path.relativeFilePath === currentPath)
        if (!isPathAlreadyProcessed) {
            const currentFileDetail = {
                relativeFilePath: currentPath,
                lineRanges: [{ first: -1, second: -1 }],
            }
            chatResultStream.addMessageOperation(messageIdToUpdate, toolUse.name!, [
                ...existingPaths,
                currentFileDetail,
            ])
        }
        let title: string
        const itemCount = chatResultStream.getMessageOperation(messageIdToUpdate)?.filePaths.length
        const filePathsPushed = chatResultStream.getMessageOperation(messageIdToUpdate)?.filePaths ?? []
        if (!itemCount) {
            title = 'Gathering context'
        } else {
            title =
                toolUse.name === 'fsRead'
                    ? `${itemCount} file${itemCount > 1 ? 's' : ''} read`
                    : toolUse.name === 'fileSearch'
                      ? `${itemCount} ${itemCount === 1 ? 'directory' : 'directories'} searched`
                      : `${itemCount} ${itemCount === 1 ? 'directory' : 'directories'} listed`
        }
        const fileDetails: Record<string, FileDetails> = {}
        for (const item of filePathsPushed) {
            fileDetails[item.relativeFilePath] = {
                lineRanges: item.lineRanges,
            }
        }

        const contextList: FileList = {
            rootFolderTitle: title,
            filePaths: filePathsPushed.map(item => item.relativeFilePath),
            details: fileDetails,
        }
        return {
            type: 'tool',
            contextList,
            messageId: messageIdToUpdate,
            body: '',
        }
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
        isNewConversation: boolean,
        chatResultStream: AgenticChatResultStream
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

        return chatResultStream.getResult()
    }

    /**
     * Handles errors that occur during the request
     */
    #handleRequestError(
        err: any,
        errorMessageId: string,
        tabId: string,
        metric: Metric<CombinedConversationEvent>
    ): ChatResult | ResponseError<ChatResult> {
        if (isAwsError(err) || (isObject(err) && 'statusCode' in err && typeof err.statusCode === 'number')) {
            metric.setDimension('cwsprChatRepsonseCode', err.statusCode ?? 400)
            this.#telemetryController.emitMessageResponseError(tabId, metric.metric, err.requestId, err.message)
        }

        // return non-model errors back to the client as errors
        if (!(err instanceof ModelServiceException)) {
            this.#log(`unknown error ${err instanceof Error ? JSON.stringify(err) : 'unknown'}`)
            this.#debug(`stack ${err instanceof Error ? JSON.stringify(err.stack) : 'unknown'}`)
            this.#debug(`cause ${err instanceof Error ? JSON.stringify(err.cause) : 'unknown'}`)
            return new ResponseError<ChatResult>(
                LSPErrorCodes.RequestFailed,
                err instanceof Error ? err.message : 'Unknown request error'
            )
        }

        if (err.cause instanceof AmazonQServicePendingSigninError) {
            this.#log(`Q Chat SSO Connection error: ${getErrorMessage(err)}`)
            return createAuthFollowUpResult('full-auth')
        }

        if (err.cause instanceof AmazonQServicePendingProfileError) {
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

        const backendError = err.cause
        // Send the backend error message directly to the client to be displayed in chat.
        return {
            type: 'answer',
            body: backendError.message,
            messageId: errorMessageId,
            buttons: [],
        }
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
            requestInput = await this.#triggerContext.getChatParamsFromTrigger(
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

    async onFileClicked(params: FileClickParams) {
        const toolUseId = params.messageId
        const toolUse = toolUseId ? this.#triggerContext.getToolUseLookup().get(toolUseId) : undefined

        if (toolUse?.name === 'fsWrite') {
            const input = toolUse.input as unknown as FsWriteParams
            // TODO: since the tool already executed, we need to reverse the old/new content for the diff
            this.#features.lsp.workspace.openFileDiff({
                originalFileUri: input.path,
                isDeleted: false,
                fileContent: toolUse.oldContent,
            })
        } else if (toolUse?.name === 'fsRead') {
            await this.#features.lsp.window.showDocument({ uri: params.filePath })
        } else {
            const absolutePath = params.fullPath ?? (await this.#resolveAbsolutePath(params.filePath))
            if (absolutePath) {
                await this.#features.lsp.window.showDocument({ uri: absolutePath })
            }
        }
    }

    onFollowUpClicked() {}

    onInfoLinkClick() {}

    onLinkClick() {}

    async onReady() {
        await this.#tabBarController.loadChats()
        try {
            const localProjectContextController = await LocalProjectContextController.getInstance()
            const contextItems = await localProjectContextController.getContextCommandItems()
            await this.#contextCommandsProvider.processContextCommandUpdate(contextItems)
            void this.#contextCommandsProvider.maybeUpdateCodeSymbols()
        } catch (error) {
            this.#log('Error initializing context commands: ' + error)
        }
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

    async #resolveAbsolutePath(relativePath: string): Promise<string | undefined> {
        try {
            const workspaceFolders = workspaceUtils.getWorkspaceFolderPaths(this.#features.lsp)
            for (const workspaceRoot of workspaceFolders) {
                const candidatePath = path.join(workspaceRoot, relativePath)
                if (await this.#features.workspace.fs.exists(candidatePath)) {
                    return candidatePath
                }
            }

            // handle prompt file outside of workspace
            if (relativePath.endsWith(promptFileExtension)) {
                return path.join(getUserPromptsDirectory(), relativePath)
            }

            this.#features.logging.error(`File not found: ${relativePath}`)
        } catch (e: any) {
            this.#features.logging.error(`Error resolving absolute path: ${e.message}`)
        }

        return undefined
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
        chatResultStream: AgenticChatResultStream,
        contextList?: FileList
    ): Promise<Result<AgenticChatResultWithMetadata, string>> {
        const requestId = response.$metadata.requestId!
        const chatEventParser = new AgenticChatEventParser(requestId, metric)
        const streamWriter = chatResultStream.getResultStreamWriter()

        // Display context transparency list once at the beginning of response
        if (contextList) {
            await streamWriter.write({ body: '', contextList })
        }

        for await (const chatEvent of response.generateAssistantResponseResponse!) {
            const result = chatEventParser.processPartialEvent(chatEvent)

            // terminate early when there is an error
            if (!result.success) {
                return result
            }

            if (chatEvent.assistantResponseEvent) {
                await streamWriter.write(result.data.chatResult)
            }
        }
        await streamWriter.close()

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

            await this.#sendProgressToClient(result.data.chatResult, partialResultToken)
        }

        return chatEventParser.getResult()
    }

    onPromptInputOptionChange(params: PromptInputOptionChangeParams) {
        const sessionResult = this.#chatSessionManagementService.getSession(params.tabId)
        const { data: session, success } = sessionResult

        if (!success) {
            this.#log('onPromptInputOptionChange: on valid session found')
            return
        }

        session.pairProgrammingMode = !session.pairProgrammingMode
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

    #getTools(session: ChatSessionService) {
        const tools = this.#features.agent.getTools({ format: 'bedrock' })

        // it's disabled so filter out the write tools
        if (!session.pairProgrammingMode) {
            return tools.filter(tool => !['fsWrite', 'executeBash'].includes(tool.toolSpecification?.name || ''))
        }
        return tools
    }

    #createDeferred() {
        let resolve
        let reject
        const promise = new Promise((res, rej) => {
            resolve = res
            reject = (e: Error) => rej(e)
        })
        return { promise, resolve, reject }
    }

    #log(...messages: string[]) {
        this.#features.logging.log(messages.join(' '))
    }

    #debug(...messages: string[]) {
        this.#features.logging.debug(messages.join(' '))
    }
}
