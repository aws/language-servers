/**
 * Copied from ../chat/chatController.ts for the purpose of developing a divergent implementation.
 * Will be deleted or merged.
 */

import * as crypto from 'crypto'
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
    ToolResultStatus,
    ToolUse,
    ToolUseEvent,
} from '@amzn/codewhisperer-streaming'
import {
    Button,
    Status,
    ButtonClickParams,
    ButtonClickResult,
    ChatMessage,
    chatRequestType,
    FileDetails,
    InlineChatResultParams,
    PromptInputOptionChangeParams,
    TextDocument,
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
    ListMcpServersParams,
    McpServerClickParams,
    McpServerClickResult,
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
    ChatConversationType,
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
import { getErrorMessage, getHttpStatusCode, getRequestID, isAwsError, isNullish, isObject } from '../../shared/utils'
import { HELP_MESSAGE, loadingMessage } from '../chat/constants'
import { TelemetryService } from '../../shared/telemetry/telemetryService'
import {
    AmazonQError,
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
import { AgenticChatResultStream, progressPrefix, ResultStreamWriter } from './agenticChatResultStream'
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
import { FsWrite, FsWriteParams } from './tools/fsWrite'
import { ExecuteBash, ExecuteBashParams } from './tools/executeBash'
import { ExplanatoryParams, ToolApprovalException } from './tools/toolShared'
import { FileSearch, FileSearchParams } from './tools/fileSearch'
import { GrepSearch, SanitizedRipgrepOutput } from './tools/grepSearch'
import { loggingUtils } from '@aws/lsp-core'
import { diffLines } from 'diff'
import {
    genericErrorMsg,
    loadingThresholdMs,
    generateAssistantResponseInputLimit,
    outputLimitExceedsPartialMsg,
    responseTimeoutMs,
    responseTimeoutPartialMsg,
} from './constants'
import { AgenticChatError, customerFacingErrorCodes, unactionableErrorCodes } from './errors'
import { URI } from 'vscode-uri'
import { McpManager } from './tools/mcp/mcpManager'
import { McpTool } from './tools/mcp/mcpTool'
import { CommandCategory } from './tools/executeBash'
import { UserWrittenCodeTracker } from '../../shared/userWrittenCodeTracker'
import { McpEventHandler } from './tools/mcp/mcpEventHandler'
import { createNamespacedToolName, getOriginalToolNames } from './tools/mcp/mcpUtils'
import { enabledMCP } from './tools/mcp/mcpUtils'

type ChatHandlers = Omit<
    LspHandlers<Chat>,
    | 'openTab'
    | 'sendChatUpdate'
    | 'sendContextCommands'
    | 'onListConversations'
    | 'onConversationClick'
    | 'onListMcpServers'
    | 'onMcpServerClick'
    | 'onTabBarAction'
    | 'getSerializedChat'
    | 'chatOptionsUpdate'
    | 'onListMcpServers'
    | 'onMcpServerClick'
>

export class AgenticChatController implements ChatHandlers {
    #features: Features
    #chatSessionManagementService: ChatSessionManagementService
    #telemetryController: ChatTelemetryController
    #triggerContext: AgenticChatTriggerContext
    #customizationArn?: string
    #telemetryService: TelemetryService
    #serviceManager?: AmazonQTokenServiceManager
    #tabBarController: TabBarController
    #chatHistoryDb: ChatDatabase
    #additionalContextProvider: AdditionalContextProvider
    #contextCommandsProvider: ContextCommandsProvider
    #stoppedToolUses = new Set<string>()
    #userWrittenCodeTracker: UserWrittenCodeTracker | undefined
    #toolUseStartTimes: Record<string, number> = {}
    #toolUseLatencies: Array<{ toolName: string; toolUseId: string; latency: number }> = []
    #mcpEventHandler: McpEventHandler

    /**
     * Determines the appropriate message ID for a tool use based on tool type and name
     * @param toolType The type of tool being used
     * @param toolUse The tool use object
     * @returns The message ID to use
     */
    #getMessageIdForToolUse(toolType: string | undefined, toolUse: ToolUse): string {
        const toolUseId = toolUse.toolUseId!
        // Return plain toolUseId for executeBash, add "_permission" suffix for all other tools
        return toolUse.name === 'executeBash' || toolType === 'executeBash' ? toolUseId : `${toolUseId}_permission`
    }

    constructor(
        chatSessionManagementService: ChatSessionManagementService,
        features: Features,
        telemetryService: TelemetryService,
        serviceManager?: AmazonQTokenServiceManager
    ) {
        this.#features = features
        this.#chatSessionManagementService = chatSessionManagementService
        this.#triggerContext = new AgenticChatTriggerContext(features)
        this.#telemetryController = new ChatTelemetryController(features, telemetryService)
        this.#telemetryService = telemetryService
        this.#serviceManager = serviceManager
        this.#chatHistoryDb = new ChatDatabase(features)
        this.#tabBarController = new TabBarController(features, this.#chatHistoryDb, telemetryService)
        this.#additionalContextProvider = new AdditionalContextProvider(features.workspace)
        this.#contextCommandsProvider = new ContextCommandsProvider(
            this.#features.logging,
            this.#features.chat,
            this.#features.workspace,
            this.#features.lsp
        )
        this.#mcpEventHandler = new McpEventHandler(features)
    }

    async onButtonClick(params: ButtonClickParams): Promise<ButtonClickResult> {
        this.#log(`onButtonClick event with params: ${JSON.stringify(params)}`)
        const session = this.#chatSessionManagementService.getSession(params.tabId)
        if (
            params.buttonId === 'run-shell-command' ||
            params.buttonId === 'reject-shell-command' ||
            params.buttonId === 'reject-mcp-tool' ||
            params.buttonId === 'allow-tools'
        ) {
            if (!session.data) {
                return { success: false, failureReason: `could not find chat session for tab: ${params.tabId} ` }
            }
            // For 'allow-tools', remove suffix as permission card needs to be seperate from file list card
            const messageId =
                params.buttonId === 'allow-tools' && params.messageId.endsWith('_permission')
                    ? params.messageId.replace('_permission', '')
                    : params.messageId

            const handler = session.data.getDeferredToolExecution(messageId)
            if (!handler?.reject || !handler.resolve) {
                return {
                    success: false,
                    failureReason: `could not find deferred tool execution for message: ${messageId} `,
                }
            }
            params.buttonId === 'reject-shell-command' || params.buttonId === 'reject-mcp-tool'
                ? (() => {
                      handler.reject(new ToolApprovalException('Command was rejected.', true))
                      this.#stoppedToolUses.add(messageId)
                  })()
                : handler.resolve()
            return {
                success: true,
            }
        } else if (params.buttonId === 'undo-changes') {
            const toolUseId = params.messageId
            try {
                await this.#undoFileChange(toolUseId, session.data)
                this.#updateUndoButtonAfterClick(params.tabId, toolUseId, session.data)
                this.#telemetryController.emitInteractWithAgenticChat(
                    'RejectDiff',
                    params.tabId,
                    session.data?.pairProgrammingMode,
                    session.data?.getConversationType()
                )
            } catch (err: any) {
                return { success: false, failureReason: err.message }
            }
            return {
                success: true,
            }
        } else if (params.buttonId === 'undo-all-changes') {
            const toolUseId = params.messageId.replace('_undoall', '')
            await this.#undoAllFileChanges(params.tabId, toolUseId, session.data)
            return {
                success: true,
            }
        } else if (params.buttonId === 'stop-shell-command') {
            this.#stoppedToolUses.add(params.messageId)
            await this.#renderStoppedShellCommand(params.tabId, params.messageId)
            return { success: true }
        } else {
            return {
                success: false,
                failureReason: 'not implemented',
            }
        }
    }

    async #undoFileChange(toolUseId: string, session: ChatSessionService | undefined): Promise<void> {
        this.#log(`Reverting file change for tooluseId: ${toolUseId}`)
        const toolUse = session?.toolUseLookup.get(toolUseId)

        const input = toolUse?.input as unknown as FsWriteParams
        if (toolUse?.fileChange?.before) {
            await this.#features.workspace.fs.writeFile(input.path, toolUse.fileChange.before)
        } else {
            await this.#features.workspace.fs.rm(input.path)
        }
    }

    #updateUndoButtonAfterClick(tabId: string, toolUseId: string, session: ChatSessionService | undefined) {
        const cachedToolUse = session?.toolUseLookup.get(toolUseId)
        if (!cachedToolUse) {
            return
        }
        const fileList = cachedToolUse.chatResult?.header?.fileList
        const button = cachedToolUse.chatResult?.header?.buttons?.filter(button => button.id !== 'undo-changes')

        const updatedHeader = {
            ...cachedToolUse.chatResult?.header,
            buttons: button,
            status: {
                status: 'error' as const,
                icon: 'cancel',
                text: 'Change discarded',
            },
            muted: true,
        }

        if (fileList && fileList.filePaths && fileList.details) {
            const updatedFileList = {
                ...fileList,
                muted: true,
            }
            const updatedDetails = { ...fileList.details }
            for (const filePath of fileList.filePaths) {
                if (updatedDetails[filePath]) {
                    ;(updatedDetails[filePath] as any) = {
                        ...updatedDetails[filePath],
                        clickable: false,
                    } as Partial<FileDetails>
                }
            }
            updatedFileList.details = updatedDetails
            updatedHeader.fileList = updatedFileList
        }

        this.#features.chat.sendChatUpdate({
            tabId,
            data: {
                messages: [
                    {
                        ...cachedToolUse.chatResult,
                        header: updatedHeader,
                    },
                ],
            },
        })
    }

    async #undoAllFileChanges(
        tabId: string,
        toolUseId: string,
        session: ChatSessionService | undefined
    ): Promise<void> {
        this.#log(`Reverting all file changes starting from ${toolUseId}`)
        const toUndo = session?.toolUseLookup.get(toolUseId)?.relatedToolUses
        if (!toUndo) {
            return
        }
        for (const messageId of [...toUndo].reverse()) {
            await this.onButtonClick({ buttonId: 'undo-changes', messageId, tabId })
        }
    }

    async onCreatePrompt(params: CreatePromptParams): Promise<void> {
        const newFilePath = getNewPromptFilePath(params.promptName)
        const newFileContent = ''
        try {
            await this.#features.workspace.fs.mkdir(getUserPromptsDirectory(), { recursive: true })
            await this.#features.workspace.fs.writeFile(newFilePath, newFileContent, { mode: 0o600 })
            await this.#features.lsp.window.showDocument({ uri: URI.file(newFilePath).toString() })
        } catch (e) {
            this.#features.logging.warn(`Error creating prompt file: ${e}`)
        }
    }

    dispose() {
        this.#chatSessionManagementService.dispose()
        this.#telemetryController.dispose()
        this.#chatHistoryDb.close()
        this.#contextCommandsProvider?.dispose()
        this.#userWrittenCodeTracker?.dispose()
    }

    async onListConversations(params: ListConversationsParams) {
        return this.#tabBarController.onListConversations(params)
    }

    async onConversationClick(params: ConversationClickParams) {
        return this.#tabBarController.onConversationClick(params)
    }

    async onListMcpServers(params: ListMcpServersParams) {
        return this.#mcpEventHandler.onListMcpServers(params)
    }

    async onMcpServerClick(params: McpServerClickParams) {
        return this.#mcpEventHandler.onMcpServerClick(params)
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

        session.rejectAllDeferredToolExecutions(new ToolApprovalException('Command ignored: new prompt', false))
        await this.#invalidateAllShellCommands(params.tabId, session)

        const metric = new Metric<CombinedConversationEvent>({
            cwsprChatConversationType: 'AgenticChat',
        })

        try {
            const triggerContext = await this.#getTriggerContext(params, metric)
            if (triggerContext.programmingLanguage?.languageName) {
                this.#userWrittenCodeTracker?.recordUsageCount(triggerContext.programmingLanguage.languageName)
            }
            const isNewConversation = !session.conversationId
            session.contextListSent = false
            if (isNewConversation) {
                // agentic chat does not support conversationId in API response,
                // so we set it to random UUID per session, as other chat functionality
                // depends on it
                session.conversationId = uuid()
            }
            const chatResultStream = this.#getChatResultStream(params.partialResultToken)
            token.onCancellationRequested(async () => {
                this.#log('cancellation requested')
                await this.#showUndoAllIfRequired(chatResultStream, session)
                await chatResultStream.updateOngoingProgressResult('Canceled')
                await this.#getChatResultStream(params.partialResultToken).writeResultBlock({
                    type: 'directive',
                    messageId: 'stopped' + uuid(),
                    body: 'You stopped your current work, please provide additional examples or ask another question.',
                })
                this.#telemetryController.emitInteractWithAgenticChat(
                    'StopChat',
                    params.tabId,
                    session.pairProgrammingMode,
                    session.getConversationType()
                )
                await this.#telemetryController.emitAddMessageMetric(params.tabId, metric.metric, 'Cancelled')

                session.abortRequest()
                void this.#invalidateAllShellCommands(params.tabId, session)
                session.rejectAllDeferredToolExecutions(new CancellationError('user'))
            })
            session.setConversationType('AgenticChat')

            const additionalContext = await this.#additionalContextProvider.getAdditionalContext(
                triggerContext,
                params.context
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

            // Generate a unique ID for this prompt
            const promptId = crypto.randomUUID()
            session.setCurrentPromptId(promptId)

            // Start the agent loop
            const finalResult = await this.#runAgentLoop(
                initialRequestInput,
                session,
                metric,
                chatResultStream,
                params.tabId,
                promptId,
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
            return this.#handleRequestError(
                session.conversationId,
                err,
                errorMessageId,
                params.tabId,
                metric,
                session.pairProgrammingMode
            )
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
        const profileArn = AmazonQTokenServiceManager.getInstance().getActiveProfileArn()
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
        promptId: string,
        conversationIdentifier?: string,
        token?: CancellationToken,
        documentReference?: FileList
    ): Promise<Result<AgenticChatResultWithMetadata, string>> {
        let currentRequestInput = { ...initialRequestInput }
        let finalResult: Result<AgenticChatResultWithMetadata, string> | null = null
        let iterationCount = 0
        let shouldDisplayMessage = true
        metric.recordStart()

        while (true) {
            iterationCount++
            this.#debug(`Agent loop iteration ${iterationCount} for conversation id:`, conversationIdentifier || '')

            // Check for cancellation
            if (this.#isPromptCanceled(token, session, promptId)) {
                this.#debug('Stopping agent loop - cancelled by user')
                throw new CancellationError('user')
            }

            const currentMessage = currentRequestInput.conversationState?.currentMessage
            const conversationId = conversationIdentifier ?? ''
            if (!currentMessage || !conversationId) {
                this.#debug(
                    `Warning: ${!currentMessage ? 'currentMessage' : ''}${!currentMessage && !conversationId ? ' and ' : ''}${!conversationId ? 'conversationIdentifier' : ''} is empty in agent loop iteration ${iterationCount}.`
                )
            }
            const remainingCharacterBudget = this.truncateRequest(currentRequestInput)
            //  Fix the history to maintain invariants
            if (currentMessage) {
                const isHistoryValid = this.#chatHistoryDb.fixAndValidateHistory(
                    tabId,
                    currentMessage,
                    conversationIdentifier ?? '',
                    remainingCharacterBudget
                )
                if (!isHistoryValid) {
                    this.#features.logging.warn('Skipping request due to invalid tool result/tool use relationship')
                    break
                }
            }

            //  Retrieve the history from DB; Do not include chatHistory for requests going to Mynah Backend
            currentRequestInput.conversationState!.history = currentRequestInput.conversationState?.currentMessage
                ?.userInputMessage?.userIntent
                ? []
                : this.#chatHistoryDb.getMessages(tabId)

            // Add loading message before making the request
            const loadingMessageId = `loading-${uuid()}`
            await chatResultStream.writeResultBlock({ ...loadingMessage, messageId: loadingMessageId })

            // Phase 3: Request Execution
            // Note: these logs are very noisy, but contain information redacted on the backend.
            this.#debug(`generateAssistantResponse Request: ${JSON.stringify(currentRequestInput, undefined, 2)}`)
            const response = await session.generateAssistantResponse(currentRequestInput)

            if (response.$metadata.requestId) {
                metric.mergeWith({
                    requestIds: [response.$metadata.requestId],
                })
            }
            this.#features.logging.info(
                `generateAssistantResponse ResponseMetadata: ${loggingUtils.formatObj(response.$metadata)}`
            )
            await chatResultStream.removeResultBlock(loadingMessageId)

            //  Add the current user message to the history DB
            if (currentMessage && conversationIdentifier) {
                if (this.#isPromptCanceled(token, session, promptId)) {
                    this.#debug('Skipping adding user message to history - cancelled by user')
                } else {
                    this.#chatHistoryDb.addMessage(tabId, 'cwc', conversationIdentifier, {
                        body: currentMessage.userInputMessage?.content ?? '',
                        type: 'prompt' as any,
                        userIntent: currentMessage.userInputMessage?.userIntent,
                        origin: currentMessage.userInputMessage?.origin,
                        userInputMessageContext: currentMessage.userInputMessage?.userInputMessageContext,
                        shouldDisplayMessage: shouldDisplayMessage,
                    })
                }
            }
            shouldDisplayMessage = true

            // Phase 4: Response Processing
            const result = await this.#processGenerateAssistantResponseResponseWithTimeout(
                response,
                metric.mergeWith({
                    cwsprChatResponseCode: response.$metadata.httpStatusCode,
                    cwsprChatMessageId: response.$metadata.requestId,
                }),
                chatResultStream,
                session,
                documentReference
            )
            // This is needed to handle the case where the response stream times out
            // and we want to auto-retry
            if (!result.success && result.error.startsWith(responseTimeoutPartialMsg)) {
                const content =
                    'You took too long to respond - try to split up the work into smaller steps. Do not apologize.'
                if (!this.#isPromptCanceled(token, session, promptId)) {
                    this.#chatHistoryDb.addMessage(tabId, 'cwc', conversationIdentifier ?? '', {
                        body: 'Response timed out - message took too long to generate',
                        type: 'answer',
                        shouldDisplayMessage: false,
                    })
                }
                currentRequestInput = this.#updateRequestInputWithToolResults(currentRequestInput, [], content)
                shouldDisplayMessage = false
                // set the in progress tool use UI status to Error
                await chatResultStream.updateOngoingProgressResult('Error')
                continue
            }

            //  Add the current assistantResponse message to the history DB
            if (result.data?.chatResult.body !== undefined) {
                if (this.#isPromptCanceled(token, session, promptId)) {
                    this.#debug('Skipping adding assistant message to history - cancelled by user')
                } else {
                    this.#chatHistoryDb.addMessage(tabId, 'cwc', conversationIdentifier ?? '', {
                        body: result.data?.chatResult.body,
                        type: 'answer' as any,
                        codeReference: result.data.chatResult.codeReference,
                        relatedContent:
                            result.data.chatResult.relatedContent?.content &&
                            result.data.chatResult.relatedContent.content.length > 0
                                ? result.data?.chatResult.relatedContent
                                : undefined,
                        toolUses: Object.keys(result.data?.toolUses!)
                            .filter(k => result.data!.toolUses[k].stop)
                            .map(k => ({
                                toolUseId: result.data!.toolUses[k].toolUseId,
                                name: result.data!.toolUses[k].name,
                                input: result.data!.toolUses[k].input,
                            })),
                        shouldDisplayMessage: shouldDisplayMessage,
                    })
                }
            } else {
                this.#features.logging.warn('No ChatResult body in response, skipping adding to history')
            }

            // Check if we have any tool uses that need to be processed
            const pendingToolUses = this.#getPendingToolUses(result.data?.toolUses || {})

            if (pendingToolUses.length === 0) {
                // No more tool uses, we're done
                this.#telemetryController.emitAgencticLoop_InvokeLLM(
                    response.$metadata.requestId!,
                    conversationId,
                    'AgenticChat',
                    undefined,
                    undefined,
                    'Succeeded',
                    this.#features.runtime.serverInfo.version ?? '',
                    undefined,
                    session.pairProgrammingMode
                )
                finalResult = result
                break
            }

            let content = ''
            let toolResults: ToolResult[]
            session.setConversationType('AgenticChatWithToolUse')
            if (result.success) {
                // Process tool uses and update the request input for the next iteration
                toolResults = await this.#processToolUses(pendingToolUses, chatResultStream, session, tabId, token)
                if (toolResults.some(toolResult => this.#shouldSendBackErrorContent(toolResult))) {
                    content = 'There was an error processing one or more tool uses. Try again, do not apologize.'
                    shouldDisplayMessage = false
                }
                const conversationType = session.getConversationType() as ChatConversationType
                metric.setDimension('cwsprChatConversationType', conversationType)
                metric.setDimension('requestIds', metric.metric.requestIds)
                const toolNames = this.#toolUseLatencies.map(item => item.toolName)
                const toolUseIds = this.#toolUseLatencies.map(item => item.toolUseId)
                const latency = this.#toolUseLatencies.map(item => item.latency)
                this.#telemetryController.emitAgencticLoop_InvokeLLM(
                    response.$metadata.requestId!,
                    conversationId,
                    'AgenticChatWithToolUse',
                    toolNames ?? undefined,
                    toolUseIds ?? undefined,
                    'Succeeded',
                    this.#features.runtime.serverInfo.version ?? '',
                    latency,
                    session.pairProgrammingMode
                )
            } else {
                // Send an error card to UI?
                toolResults = pendingToolUses.map(toolUse => ({
                    toolUseId: toolUse.toolUseId,
                    status: ToolResultStatus.ERROR,
                    content: [{ text: result.error }],
                }))
                this.#telemetryController.emitAgencticLoop_InvokeLLM(
                    response.$metadata.requestId!,
                    conversationId,
                    'AgenticChatWithToolUse',
                    undefined,
                    undefined,
                    'Failed',
                    this.#features.runtime.serverInfo.version ?? '',
                    undefined,
                    session.pairProgrammingMode
                )
                if (result.error.startsWith('ToolUse input is invalid JSON:')) {
                    content =
                        'Your toolUse input is incomplete, try again. If the error happens consistently, break this task down into multiple tool uses with smaller input. Do not apologize.'
                    shouldDisplayMessage = false
                }
                // set the in progress tool use UI status to Error
                await chatResultStream.updateOngoingProgressResult('Error')
            }
            if (result.success && this.#toolUseLatencies.length > 0) {
                // Clear latencies for the next LLM call
                this.#toolUseLatencies = []
            }
            currentRequestInput = this.#updateRequestInputWithToolResults(currentRequestInput, toolResults, content)
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
     * performs truncation of request before sending to backend service.
     * Returns the remaining character budget for chat history.
     * @param request
     */
    truncateRequest(request: GenerateAssistantResponseCommandInput): number {
        let remainingCharacterBudget = generateAssistantResponseInputLimit
        if (!request?.conversationState?.currentMessage?.userInputMessage) {
            return remainingCharacterBudget
        }
        const message = request.conversationState?.currentMessage?.userInputMessage?.content

        // 1. prioritize user input message
        let truncatedUserInputMessage = ''
        if (message) {
            if (message.length > generateAssistantResponseInputLimit) {
                this.#debug(`Truncating userInputMessage to ${generateAssistantResponseInputLimit} characters}`)
                truncatedUserInputMessage = message.substring(0, generateAssistantResponseInputLimit)
                remainingCharacterBudget = remainingCharacterBudget - truncatedUserInputMessage.length
                request.conversationState.currentMessage.userInputMessage.content = truncatedUserInputMessage
            } else {
                remainingCharacterBudget = remainingCharacterBudget - message.length
            }
        }

        // 2. try to fit @context into budget
        let truncatedRelevantDocuments = []
        if (
            request.conversationState.currentMessage.userInputMessage.userInputMessageContext?.editorState
                ?.relevantDocuments
        ) {
            for (const relevantDoc of request.conversationState.currentMessage.userInputMessage.userInputMessageContext
                ?.editorState?.relevantDocuments) {
                const docLength = relevantDoc?.text?.length || 0
                if (remainingCharacterBudget > docLength) {
                    truncatedRelevantDocuments.push(relevantDoc)
                    remainingCharacterBudget = remainingCharacterBudget - docLength
                }
            }
            request.conversationState.currentMessage.userInputMessage.userInputMessageContext.editorState.relevantDocuments =
                truncatedRelevantDocuments
        }

        // 3. try to fit current file context
        let truncatedCurrentDocument = undefined
        if (request.conversationState.currentMessage.userInputMessage.userInputMessageContext?.editorState?.document) {
            const docLength =
                request.conversationState.currentMessage.userInputMessage.userInputMessageContext?.editorState?.document
                    .text?.length || 0
            if (remainingCharacterBudget > docLength) {
                truncatedCurrentDocument =
                    request.conversationState.currentMessage.userInputMessage.userInputMessageContext?.editorState
                        ?.document
                remainingCharacterBudget = remainingCharacterBudget - docLength
            }
            request.conversationState.currentMessage.userInputMessage.userInputMessageContext.editorState.document =
                truncatedCurrentDocument
        }
        return remainingCharacterBudget
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
        // Note: we want to overwrite the button block because it already exists in the stream.
        await resultStream.overwriteResultBlock(this.#getUpdateToolConfirmResult(toolUse, true), promptBlockId)
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

        for (const toolUse of toolUses) {
            // Store buttonBlockId to use it in `catch` block if needed
            let cachedButtonBlockId
            if (!toolUse.name || !toolUse.toolUseId) continue
            session.toolUseLookup.set(toolUse.toolUseId, toolUse)

            // Record the start time for this tool use for latency calculation
            if (toolUse.toolUseId) {
                this.#toolUseStartTimes[toolUse.toolUseId] = Date.now()
            }

            try {
                // TODO: Can we move this check in the event parser before the stream completes?
                const availableToolNames = this.#getTools(session).map(tool => tool.toolSpecification.name)
                if (!availableToolNames.includes(toolUse.name)) {
                    throw new Error(`Tool ${toolUse.name} is not available in the current mode`)
                }

                // remove progress UI
                await chatResultStream.removeResultBlockAndUpdateUI(progressPrefix + toolUse.toolUseId)

                // fsRead and listDirectory write to an existing card and could show nothing in the current position
                if (!['fsWrite', 'fsRead', 'listDirectory'].includes(toolUse.name)) {
                    await this.#showUndoAllIfRequired(chatResultStream, session)
                }
                // fsWrite can take a long time, so we render fsWrite  Explanatory upon partial streaming responses.
                if (toolUse.name !== 'fsWrite') {
                    const { explanation } = toolUse.input as unknown as ExplanatoryParams
                    if (explanation) {
                        await chatResultStream.writeResultBlock({
                            type: 'directive',
                            messageId: toolUse.toolUseId + '_explanation',
                            body: explanation,
                        })
                    }
                }
                switch (toolUse.name) {
                    case 'fsRead':
                    case 'listDirectory':
                    case 'fileSearch':
                    case 'grepSearch':
                    case 'fsWrite':
                    case 'executeBash': {
                        const toolMap = {
                            fsRead: { Tool: FsRead },
                            listDirectory: { Tool: ListDirectory },
                            fsWrite: { Tool: FsWrite },
                            executeBash: { Tool: ExecuteBash },
                            grepSearch: { Tool: GrepSearch },
                            fileSearch: { Tool: FileSearch },
                        }

                        const { Tool } = toolMap[toolUse.name as keyof typeof toolMap]
                        const tool = new Tool(this.#features)

                        // For MCP tools, get the permission from McpManager
                        // const permission = McpManager.instance.getToolPerm('Built-in', toolUse.name)
                        // If permission is 'alwaysAllow', we don't need to ask for acceptance
                        // const builtInPermission = permission !== 'alwaysAllow'

                        // Get the approved paths from the session
                        const approvedPaths = session.approvedPaths

                        // Pass the approved paths to the tool's requiresAcceptance method
                        const { requiresAcceptance, warning, commandCategory } = await tool.requiresAcceptance(
                            toolUse.input as any,
                            approvedPaths
                        )

                        // Honor built-in permission if available, otherwise use tool's requiresAcceptance
                        // const requiresAcceptance = builtInPermission || toolRequiresAcceptance

                        if (requiresAcceptance || toolUse.name === 'executeBash') {
                            // for executeBash, we till send the confirmation message without action buttons
                            const confirmationResult = this.#processToolConfirmation(
                                toolUse,
                                requiresAcceptance,
                                warning,
                                commandCategory
                            )
                            cachedButtonBlockId = await chatResultStream.writeResultBlock(confirmationResult)
                            const isExecuteBash = toolUse.name === 'executeBash'
                            if (isExecuteBash) {
                                this.#telemetryController.emitInteractWithAgenticChat(
                                    'GeneratedCommand',
                                    tabId,
                                    session.pairProgrammingMode,
                                    session.getConversationType()
                                )
                            }
                            if (requiresAcceptance) {
                                await this.waitForToolApproval(toolUse, chatResultStream, cachedButtonBlockId, session)
                            }
                            if (isExecuteBash) {
                                this.#telemetryController.emitInteractWithAgenticChat(
                                    'RunCommand',
                                    tabId,
                                    session.pairProgrammingMode,
                                    session.getConversationType()
                                )
                            }
                        }
                        break
                    }
                    case 'codeSearch':
                        // no need to write tool message for code search.
                        break
                    // — DEFAULT ⇒ MCP tools
                    default:
                        // Get original server and tool names from the mapping
                        const originalNames = getOriginalToolNames(toolUse.name)
                        if (originalNames) {
                            const { serverName, toolName } = originalNames
                            const def = McpManager.instance
                                .getAllTools()
                                .find(d => d.serverName === serverName && d.toolName === toolName)
                            if (def) {
                                const mcpTool = new McpTool(this.#features, def)
                                const { requiresAcceptance, warning } = await mcpTool.requiresAcceptance(
                                    serverName,
                                    toolName
                                )
                                if (requiresAcceptance) {
                                    const confirmation = this.#processToolConfirmation(
                                        toolUse,
                                        requiresAcceptance,
                                        warning,
                                        undefined,
                                        toolName // Pass the original tool name here
                                    )
                                    cachedButtonBlockId = await chatResultStream.writeResultBlock(confirmation)
                                    await this.waitForToolApproval(
                                        toolUse,
                                        chatResultStream,
                                        cachedButtonBlockId,
                                        session
                                    )
                                }

                                // Store the blockId in the session for later use
                                if (toolUse.toolUseId) {
                                    // Use a type assertion to add the runningCardBlockId property
                                    const toolUseWithBlockId = {
                                        ...toolUse,
                                        cachedButtonBlockId,
                                    } as typeof toolUse & { cachedButtonBlockId: number }

                                    session.toolUseLookup.set(toolUse.toolUseId, toolUseWithBlockId)
                                }
                                break
                            }
                        }
                        break
                }

                if (toolUse.name === 'fsWrite') {
                    const input = toolUse.input as unknown as FsWriteParams
                    const document = await this.#triggerContext.getTextDocument(input.path)
                    session.toolUseLookup.set(toolUse.toolUseId, {
                        ...toolUse,
                        fileChange: { before: document?.getText() },
                    })
                }

                // After approval, add the path to the approved paths in the session
                const inputPath = (toolUse.input as any)?.path || (toolUse.input as any)?.cwd
                if (inputPath) {
                    session.addApprovedPath(inputPath)
                }

                const ws = this.#getWritableStream(chatResultStream, toolUse)
                const result = await this.#features.agent.runTool(toolUse.name, toolUse.input, token, ws)

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
                    case 'grepSearch':
                        const grepSearchResult = this.#processGrepSearchResult(toolUse, result, chatResultStream)
                        if (grepSearchResult) {
                            await chatResultStream.writeResultBlock(grepSearchResult)
                        }
                        break
                    case 'fsWrite':
                        const input = toolUse.input as unknown as FsWriteParams
                        const doc = await this.#triggerContext.getTextDocument(input.path)
                        const chatResult = await this.#getFsWriteChatResult(toolUse, doc, session)
                        const cachedToolUse = session.toolUseLookup.get(toolUse.toolUseId)
                        if (cachedToolUse) {
                            session.toolUseLookup.set(toolUse.toolUseId, {
                                ...cachedToolUse,
                                chatResult,
                                fileChange: { ...cachedToolUse.fileChange, after: doc?.getText() },
                            })
                        }
                        this.#telemetryController.emitInteractWithAgenticChat(
                            'GeneratedDiff',
                            tabId,
                            session.pairProgrammingMode,
                            session.getConversationType()
                        )
                        await chatResultStream.writeResultBlock(chatResult)
                        break
                    // — DEFAULT ⇒ MCP tools
                    default:
                        await this.#handleMcpToolResult(toolUse, result, session, chatResultStream)
                        break
                }
                this.#updateUndoAllState(toolUse, session)

                if (toolUse.name && toolUse.toolUseId) {
                    // Calculate latency if we have a start time for this tool use
                    let latency: number | undefined = undefined
                    if (this.#toolUseStartTimes[toolUse.toolUseId]) {
                        latency = Date.now() - this.#toolUseStartTimes[toolUse.toolUseId]
                        delete this.#toolUseStartTimes[toolUse.toolUseId]

                        if (latency !== undefined) {
                            this.#toolUseLatencies.push({
                                toolName: toolUse.name,
                                toolUseId: toolUse.toolUseId,
                                latency: latency,
                            })
                        }
                    }

                    this.#telemetryController.emitToolUseSuggested(
                        toolUse,
                        session.conversationId ?? '',
                        this.#features.runtime.serverInfo.version ?? '',
                        latency,
                        session.pairProgrammingMode
                    )
                }
            } catch (err) {
                await this.#showUndoAllIfRequired(chatResultStream, session)
                if (this.isUserAction(err, token)) {
                    // Handle ToolApprovalException for any tool
                    if (err instanceof ToolApprovalException && cachedButtonBlockId) {
                        await chatResultStream.overwriteResultBlock(
                            this.#getUpdateToolConfirmResult(toolUse, false),
                            cachedButtonBlockId
                        )
                        if (err.shouldShowMessage) {
                            await chatResultStream.writeResultBlock({
                                type: 'answer',
                                messageId: `reject-message-${toolUse.toolUseId}`,
                                body: err.message || 'Command was rejected.',
                            })
                        }
                    } else if (err instanceof ToolApprovalException) {
                        this.#features.logging.warn('Failed to update tool block: no blockId is available.')
                    }

                    // Handle CancellationError
                    if (err instanceof CancellationError) {
                        results.push({
                            toolUseId: toolUse.toolUseId,
                            status: ToolResultStatus.ERROR,
                            content: [{ text: 'Command stopped by user' }],
                        })
                        continue
                    }

                    // Rethrow error for executeBash or any named tool
                    if (toolUse.name === 'executeBash' || toolUse.name) {
                        throw err
                    }
                }

                // display fs write failure status in the UX of that file card
                if (toolUse.name === 'fsWrite' && toolUse.toolUseId) {
                    const existingCard = chatResultStream.getMessageBlockId(toolUse.toolUseId)
                    const fsParam = toolUse.input as unknown as FsWriteParams
                    const fileName = path.basename(fsParam.path)
                    const errorResult = {
                        type: 'tool',
                        messageId: toolUse.toolUseId,
                        header: {
                            fileList: {
                                filePaths: [fileName],
                                details: {
                                    [fileName]: {
                                        description: fsParam.path,
                                    },
                                },
                            },
                            status: {
                                status: 'error',
                                icon: 'error',
                                text: 'Error',
                            },
                        },
                    } as ChatResult
                    if (existingCard) {
                        await chatResultStream.overwriteResultBlock(errorResult, existingCard)
                    } else {
                        await chatResultStream.writeResultBlock(errorResult)
                    }
                }
                const errMsg = err instanceof Error ? err.message : 'unknown error'
                this.#log(`Error running tool ${toolUse.name}:`, errMsg)
                results.push({
                    toolUseId: toolUse.toolUseId,
                    status: ToolResultStatus.ERROR,
                    content: [{ json: { error: err instanceof Error ? err.message : 'Unknown error' } }],
                })
            }
        }

        return results
    }

    #shouldSendBackErrorContent(toolResult: ToolResult) {
        if (toolResult.status === ToolResultStatus.ERROR) {
            for (const content of toolResult.content ?? []) {
                if (content.json && JSON.stringify(content.json).includes(outputLimitExceedsPartialMsg)) {
                    // do not send the content response back for this case to avoid unnecessary messages
                    return false
                }
            }
            return true
        }
        return false
    }

    /**
     * Updates the currentUndoAllId state in the session
     */
    #updateUndoAllState(toolUse: ToolUse, session: ChatSessionService) {
        if (toolUse.name === 'fsRead' || toolUse.name === 'listDirectory') {
            return
        }
        if (toolUse.name === 'fsWrite') {
            if (session.currentUndoAllId === undefined) {
                session.currentUndoAllId = toolUse.toolUseId
            }
            if (session.currentUndoAllId) {
                const prev = session.toolUseLookup.get(session.currentUndoAllId)
                if (prev && toolUse.toolUseId) {
                    const relatedToolUses = prev.relatedToolUses || new Set()
                    relatedToolUses.add(toolUse.toolUseId)

                    session.toolUseLookup.set(session.currentUndoAllId, {
                        ...prev,
                        relatedToolUses,
                    })
                }
            }
        } else {
            session.currentUndoAllId = undefined
        }
    }

    /**
     * Shows an "Undo all changes" button if there are multiple related file changes
     * that can be undone together.
     */
    async #showUndoAllIfRequired(chatResultStream: AgenticChatResultStream, session: ChatSessionService) {
        if (session.currentUndoAllId === undefined) {
            return
        }

        const toUndo = session.toolUseLookup.get(session.currentUndoAllId)?.relatedToolUses
        if (!toUndo || toUndo.size <= 1) {
            session.currentUndoAllId = undefined
            return
        }

        await chatResultStream.writeResultBlock({
            type: 'answer',
            messageId: `${session.currentUndoAllId}_undoall`,
            buttons: [
                {
                    id: 'undo-all-changes',
                    text: 'Undo all changes',
                    icon: 'undo',
                    status: 'clear',
                    keepCardAfterClick: false,
                },
            ],
        })
        session.currentUndoAllId = undefined
    }

    /**
     * Determines if error is thrown as a result of a user action (Ex. rejecting tool, stop button)
     * @param err
     * @returns
     */
    isUserAction(err: unknown, token?: CancellationToken, session?: ChatSessionService): boolean {
        return (
            CancellationError.isUserCancelled(err) ||
            err instanceof ToolApprovalException ||
            (token?.isCancellationRequested ?? false)
        )
    }

    #isPromptCanceled(token: CancellationToken | undefined, session: ChatSessionService, promptId: string): boolean {
        return token?.isCancellationRequested === true || !session.isCurrentPrompt(promptId)
    }

    #validateToolResult(toolUse: ToolUse, result: ToolResultContentBlock) {
        let maxToolResponseSize
        switch (toolUse.name) {
            case 'fsRead':
            case 'executeBash':
                // fsRead and executeBash already have truncation logic
                return
            case 'listDirectory':
                maxToolResponseSize = 50_000
                break
            default:
                maxToolResponseSize = 100_000
                break
        }
        if (
            (result.text && result.text.length > maxToolResponseSize) ||
            (result.json && JSON.stringify(result.json).length > maxToolResponseSize)
        ) {
            throw Error(`${toolUse.name} ${outputLimitExceedsPartialMsg} ${maxToolResponseSize}`)
        }
    }

    /**
     * Get a description for the tooltip based on command category
     * @param commandCategory The category of the command
     * @returns A descriptive message for the tooltip
     */
    #getCommandCategoryDescription(category: CommandCategory): string | undefined {
        switch (category) {
            case CommandCategory.Mutate:
                return 'This command may modify your code and/or files.'
            case CommandCategory.Destructive:
                return 'This command may cause significant data loss or damage.'
            default:
                return undefined
        }
    }

    #getWritableStream(chatResultStream: AgenticChatResultStream, toolUse: ToolUse): WritableStream | undefined {
        if (toolUse.name !== 'executeBash') {
            return
        }

        const toolMsgId = toolUse.toolUseId!
        const chatMsgId = chatResultStream.getResult().messageId
        let headerEmitted = false

        const initialHeader: ChatMessage['header'] = {
            body: 'shell',
            buttons: [{ id: 'stop-shell-command', text: 'Stop', icon: 'stop' }],
        }

        const completedHeader: ChatMessage['header'] = {
            body: 'shell',
            status: { status: 'success', icon: 'ok', text: 'Completed' },
            buttons: [],
        }

        return new WritableStream({
            write: async chunk => {
                if (this.#stoppedToolUses.has(toolMsgId)) return

                await chatResultStream.writeResultBlock({
                    type: 'tool',
                    messageId: toolMsgId,
                    body: chunk,
                    header: headerEmitted ? undefined : initialHeader,
                })

                headerEmitted = true
            },

            close: async () => {
                if (this.#stoppedToolUses.has(toolMsgId)) return

                await chatResultStream.writeResultBlock({
                    type: 'tool',
                    messageId: toolMsgId,
                    body: '```',
                    header: completedHeader,
                })

                await chatResultStream.writeResultBlock({
                    type: 'answer',
                    messageId: chatMsgId,
                    body: '',
                    header: undefined,
                })

                this.#stoppedToolUses.add(toolMsgId)
            },
        })
    }

    /**
     * Creates an updated ChatResult for tool confirmation based on tool type
     * @param toolUse The tool use object
     * @param isAccept Whether the tool was accepted or rejected
     * @param toolType Optional tool type for specialized handling
     * @returns ChatResult with appropriate confirmation UI
     */
    #getUpdateToolConfirmResult(toolUse: ToolUse, isAccept: boolean, toolType?: string): ChatResult {
        const toolName = toolType || toolUse.name

        // Handle bash commands with special formatting
        if (toolName === 'executeBash') {
            return {
                messageId: toolUse.toolUseId,
                type: 'tool',
                body: '```shell\n' + (toolUse.input as unknown as ExecuteBashParams).command + '\n',
                header: {
                    body: 'shell',
                    ...(isAccept
                        ? {}
                        : {
                              status: {
                                  status: 'error',
                                  icon: 'cancel',
                                  text: 'Rejected',
                              },
                          }),
                    buttons: isAccept ? [{ id: 'stop-shell-command', text: 'Stop', icon: 'stop' }] : [],
                },
            }
        }

        // For file operations and other tools, create appropriate confirmation UI
        let header: {
            body: string | undefined
            status: { status: 'info' | 'success' | 'warning' | 'error'; icon: string; text: string }
        }
        let body: string | undefined

        switch (toolName) {
            case 'fsWrite':
            case 'fsRead':
            case 'listDirectory':
                header = {
                    body: undefined,
                    status: {
                        status: 'success',
                        icon: 'ok',
                        text: 'Allowed',
                    },
                }
                break

            case 'fileSearch':
                const searchPath = (toolUse.input as unknown as FileSearchParams).path
                header = {
                    body: 'File Search',
                    status: {
                        status: isAccept ? 'success' : 'error',
                        icon: isAccept ? 'ok' : 'cancel',
                        text: isAccept ? 'Allowed' : 'Rejected',
                    },
                }
                body = `File search ${isAccept ? 'allowed' : 'rejected'}: \`${searchPath}\``
                break

            default:
                // Default tool (not MCP)
                return {
                    type: 'tool',
                    messageId: toolUse.toolUseId!,
                    summary: {
                        content: {
                            header: {
                                icon: 'tools',
                                body: `${toolUse.name}`,
                                status: {
                                    status: isAccept ? 'success' : 'error',
                                    icon: isAccept ? 'ok' : 'cancel',
                                    text: isAccept ? 'Completed' : 'Rejected',
                                },
                                fileList: undefined,
                            },
                        },
                        collapsedContent: [
                            {
                                header: {
                                    body: 'Parameters',
                                    status: undefined,
                                },
                                body: `\`\`\`json\n${JSON.stringify(toolUse.input, null, 2)}\n\`\`\``,
                            },
                        ],
                    },
                }
        }

        return {
            messageId: this.#getMessageIdForToolUse(toolType, toolUse),
            type: 'tool',
            body,
            header,
        }
    }

    async #renderStoppedShellCommand(tabId: string, messageId: string): Promise<void> {
        const session = this.#chatSessionManagementService.getSession(tabId).data
        const toolUse = session?.toolUseLookup.get(messageId)
        const command = (toolUse!.input as unknown as ExecuteBashParams).command
        await this.#features.chat.sendChatUpdate({
            tabId,
            state: { inProgress: false },
            data: {
                messages: [
                    {
                        messageId,
                        type: 'tool',
                        body: `\`\`\`shell\n${command}\n\`\`\``,
                        header: {
                            body: 'shell',
                            status: {
                                status: 'error',
                                icon: 'stop',
                                text: 'Stopped',
                            },
                            buttons: [],
                        },
                    },
                ],
            },
        })
    }

    #processToolConfirmation(
        toolUse: ToolUse,
        requiresAcceptance: Boolean,
        warning?: string,
        commandCategory?: CommandCategory,
        toolType?: string,
        builtInPermission?: boolean
    ): ChatResult {
        const toolName = toolType || toolUse.name
        let buttons: Button[] = []
        let header: {
            body: string
            buttons: Button[]
            icon?: string
            iconForegroundStatus?: string
            status?: {
                status?: Status
                position?: 'left' | 'right'
                description?: string
                icon?: string
                text?: string
            }
        }
        let body: string | undefined

        // Configure tool-specific UI elements
        switch (toolName) {
            case 'executeBash': {
                const commandString = (toolUse.input as unknown as ExecuteBashParams).command
                buttons = requiresAcceptance
                    ? [
                          { id: 'run-shell-command', text: 'Run', icon: 'play' },
                          {
                              id: 'reject-shell-command',
                              status: 'dimmed-clear' as Status,
                              text: 'Reject',
                              icon: 'cancel',
                          },
                      ]
                    : []

                const statusIcon =
                    commandCategory === CommandCategory.Destructive
                        ? 'warning'
                        : commandCategory === CommandCategory.Mutate
                          ? 'info'
                          : 'none'
                const statusType =
                    commandCategory === CommandCategory.Destructive
                        ? 'warning'
                        : commandCategory === CommandCategory.Mutate
                          ? 'info'
                          : undefined

                header = {
                    status: requiresAcceptance
                        ? {
                              icon: statusIcon,
                              status: statusType,
                              position: 'left',
                              description: this.#getCommandCategoryDescription(
                                  commandCategory ?? CommandCategory.ReadOnly
                              ),
                          }
                        : {},
                    body: 'shell',
                    buttons,
                }
                body = '```shell\n' + commandString
                break
            }

            case 'fsWrite': {
                const writeFilePath = (toolUse.input as unknown as FsWriteParams).path
                buttons = [{ id: 'allow-tools', text: 'Allow', icon: 'ok', status: 'clear' }]
                header = {
                    icon: 'warning',
                    iconForegroundStatus: 'warning',
                    body: builtInPermission
                        ? '#### Allow file modification'
                        : '#### Allow file modification outside of your workspace',
                    buttons,
                }
                body = builtInPermission
                    ? `I need permission to modify files.\n\`${writeFilePath}\``
                    : `I need permission to modify files in your workspace.\n\`${writeFilePath}\``
                break
            }

            case 'fsRead':
            case 'listDirectory': {
                buttons = [{ id: 'allow-tools', text: 'Allow', icon: 'ok', status: 'clear' }]
                header = {
                    icon: 'tools',
                    iconForegroundStatus: 'tools',
                    body: builtInPermission
                        ? '#### Allow read-only tools'
                        : '#### Allow read-only tools outside your workspace',
                    buttons,
                }

                if (toolName === 'fsRead') {
                    const paths = (toolUse.input as unknown as FsReadParams).paths
                    const formattedPaths: string[] = []
                    paths.forEach(element => formattedPaths.push(`\`${element}\``))
                    body = builtInPermission
                        ? `I need permission to read files.\n${formattedPaths.join('\n')}`
                        : `I need permission to read files outside the workspace.\n${formattedPaths.join('\n')}`
                } else {
                    const readFilePath = (toolUse.input as unknown as ListDirectoryParams).path
                    body = builtInPermission
                        ? `I need permission to list directories.\n\`${readFilePath}\``
                        : `I need permission to list directories outside the workspace.\n\`${readFilePath}\``
                }
                break
            }

            default: {
                // — DEFAULT ⇒ MCP tools
                buttons = [{ id: 'allow-tools', text: 'Allow', icon: 'ok', status: 'clear' }]
                header = {
                    icon: 'tools',
                    iconForegroundStatus: 'warning',
                    body: `#### ${toolName}`,
                    buttons,
                }
                body = ' '
                break
            }
        }

        // Determine if this is a built-in tool or MCP tool
        const isStandardTool =
            toolName !== undefined && ['executeBash', 'fsWrite', 'fsRead', 'listDirectory'].includes(toolName)

        if (isStandardTool) {
            return {
                type: 'tool',
                messageId: this.#getMessageIdForToolUse(toolType, toolUse),
                header,
                body: warning ? (toolName === 'executeBash' ? '' : '\n\n') + body : body,
            }
        } else {
            return {
                type: 'tool',
                messageId: toolUse.toolUseId,
                summary: {
                    content: {
                        header: {
                            icon: 'tools',
                            body: `${toolName}`,
                            buttons: [
                                { id: 'allow-tools', text: 'Run', icon: 'play', status: 'clear' },
                                {
                                    id: 'reject-mcp-tool',
                                    text: 'Reject',
                                    icon: 'cancel',
                                    status: 'dimmed-clear' as Status,
                                },
                            ],
                        },
                    },
                    collapsedContent: [
                        {
                            header: { body: 'Parameters' },
                            body: `\`\`\`json\n${JSON.stringify(toolUse.input, null, 2)}\n\`\`\``,
                        },
                    ],
                },
            }
        }
    }

    async #getFsWriteChatResult(
        toolUse: ToolUse,
        doc: TextDocument | undefined,
        session: ChatSessionService
    ): Promise<ChatMessage> {
        const input = toolUse.input as unknown as FsWriteParams
        const oldContent = session.toolUseLookup.get(toolUse.toolUseId!)?.fileChange?.before ?? ''
        // Get just the filename instead of the full path
        const fileName = path.basename(input.path)
        const diffChanges = diffLines(oldContent, doc?.getText() ?? '')
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
        let currentPaths = []
        if (toolUse.name === 'fsRead') {
            currentPaths = (toolUse.input as unknown as FsReadParams)?.paths
        } else {
            currentPaths.push((toolUse.input as unknown as ListDirectoryParams | FileSearchParams)?.path)
        }

        if (!currentPaths) return

        for (const currentPath of currentPaths) {
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
        const details: Record<string, FileDetails> = {}
        for (const item of filePathsPushed) {
            details[item.relativeFilePath] = {
                lineRanges: item.lineRanges,
                description: item.relativeFilePath,
            }
        }

        const fileList: FileList = {
            rootFolderTitle: title,
            filePaths: filePathsPushed.map(item => item.relativeFilePath),
            details,
        }
        return {
            type: 'tool',
            fileList,
            messageId: messageIdToUpdate,
            body: '',
        }
    }

    /**
     * Process grep search results and format them for display in the chat UI
     */
    #processGrepSearchResult(
        toolUse: ToolUse,
        result: any,
        chatResultStream: AgenticChatResultStream
    ): ChatMessage | undefined {
        if (toolUse.name !== 'grepSearch') {
            return undefined
        }

        let messageIdToUpdate = toolUse.toolUseId!
        const currentId = chatResultStream.getMessageIdToUpdateForTool(toolUse.name!)

        if (currentId) {
            messageIdToUpdate = currentId
        } else {
            chatResultStream.setMessageIdToUpdateForTool(toolUse.name!, messageIdToUpdate)
        }

        // Extract search results from the tool output
        const output = result.output.content as SanitizedRipgrepOutput
        if (!output || !output.fileMatches || !Array.isArray(output.fileMatches)) {
            return {
                type: 'tool',
                messageId: messageIdToUpdate,
                body: 'No search results found.',
            }
        }

        // Process the matches into a structured format
        const matches = output.fileMatches
        const fileDetails: Record<string, FileDetails> = {}

        // Create file details directly from matches
        for (const match of matches) {
            const filePath = match.filePath
            if (!filePath) continue

            fileDetails[`${filePath} (${match.matches.length} ${match.matches.length <= 1 ? 'result' : 'results'})`] = {
                description: filePath,
                lineRanges: [{ first: -1, second: -1 }],
            }
        }

        // Create sorted array of file paths
        const sortedFilePaths = Object.keys(fileDetails)

        // Create the context list for display
        const query = (toolUse.input as any)?.query || 'search term'

        const contextList: FileList = {
            rootFolderTitle: `Grepped for "${query}", ${output.matchCount}  ${output.matchCount <= 1 ? 'result' : 'results'} found`,
            filePaths: sortedFilePaths,
            details: fileDetails,
        }

        return {
            type: 'tool',
            fileList: contextList,
            messageId: messageIdToUpdate,
            body: '',
        }
    }

    /**
     * Updates the request input with tool results for the next iteration
     */
    #updateRequestInputWithToolResults(
        requestInput: GenerateAssistantResponseCommandInput,
        toolResults: ToolResult[],
        content: string
    ): GenerateAssistantResponseCommandInput {
        // Create a deep copy of the request input
        const updatedRequestInput = JSON.parse(JSON.stringify(requestInput)) as GenerateAssistantResponseCommandInput

        // Add tool results to the request
        updatedRequestInput.conversationState!.currentMessage!.userInputMessage!.userInputMessageContext!.toolResults =
            []
        updatedRequestInput.conversationState!.currentMessage!.userInputMessage!.content = content

        for (const toolResult of toolResults) {
            this.#debug(`ToolResult: ${JSON.stringify(toolResult)} `)
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
    ): Promise<ChatResult> {
        if (!result.success) {
            throw new AgenticChatError(result.error, 'FailedResult')
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
        metric.setDimension('languageServerVersion', this.#features.runtime.serverInfo.version)
        metric.setDimension('enabled', session.pairProgrammingMode)
        const profileArn = AmazonQTokenServiceManager.getInstance().getActiveProfileArn()
        if (profileArn) {
            this.#telemetryService.updateProfileArn(profileArn)
        }
        if (triggerContext.contextInfo) {
            metric.mergeWith({
                cwsprChatHasContextList: triggerContext.documentReference?.filePaths?.length ? true : false,
                cwsprChatFolderContextCount: triggerContext.contextInfo.contextCount.folderContextCount,
                cwsprChatFileContextCount: triggerContext.contextInfo.contextCount.fileContextCount,
                cwsprChatRuleContextCount: triggerContext.contextInfo.contextCount.ruleContextCount,
                cwsprChatPromptContextCount: triggerContext.contextInfo.contextCount.promptContextCount,
                cwsprChatFileContextLength: triggerContext.contextInfo.contextLength.fileContextLength,
                cwsprChatRuleContextLength: triggerContext.contextInfo.contextLength.ruleContextLength,
                cwsprChatPromptContextLength: triggerContext.contextInfo.contextLength.promptContextLength,
                cwsprChatCodeContextCount: triggerContext.contextInfo.contextCount.codeContextCount,
                cwsprChatCodeContextLength: triggerContext.contextInfo.contextLength.codeContextLength,
                cwsprChatFocusFileContextLength: triggerContext.text?.length,
            })
        }
        await this.#telemetryController.emitAddMessageMetric(params.tabId, metric.metric, 'Succeeded')

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
    async #handleRequestError(
        conversationId: string | undefined,
        err: any,
        errorMessageId: string,
        tabId: string,
        metric: Metric<CombinedConversationEvent>,
        agenticCodingMode: boolean
    ): Promise<ChatResult | ResponseError<ChatResult>> {
        const errorMessage = getErrorMessage(err)
        const requestID = getRequestID(err) ?? ''
        metric.setDimension('cwsprChatResponseCode', getHttpStatusCode(err) ?? 0)
        metric.setDimension('languageServerVersion', this.#features.runtime.serverInfo.version)

        metric.metric.requestIds = [requestID]
        metric.metric.cwsprChatMessageId = errorMessageId
        metric.metric.cwsprChatConversationId = conversationId
        await this.#telemetryController.emitAddMessageMetric(tabId, metric.metric, 'Failed')
        // use custom error message for unactionable errors (user-dependent errors like PromptCharacterLimit)
        if (err.code && err.code in unactionableErrorCodes) {
            const customErrMessage = unactionableErrorCodes[err.code as keyof typeof unactionableErrorCodes]
            this.#telemetryController.emitMessageResponseError(
                tabId,
                metric.metric,
                requestID,
                customErrMessage,
                agenticCodingMode
            )
        } else {
            this.#telemetryController.emitMessageResponseError(
                tabId,
                metric.metric,
                requestID,
                errorMessage ?? genericErrorMsg,
                agenticCodingMode
            )
        }

        let authFollowType: ReturnType<typeof getAuthFollowUpType> = undefined
        // first check if there is an AmazonQ related auth follow up
        if (err.cause instanceof AmazonQError) {
            authFollowType = getAuthFollowUpType(err.cause)
        }

        // if not check full error for auth follow up
        if (!authFollowType) {
            authFollowType = getAuthFollowUpType(err)
        }

        if (authFollowType) {
            this.#log(`Q auth error: ${getErrorMessage(err)} `)

            return createAuthFollowUpResult(authFollowType)
        }

        if (customerFacingErrorCodes.includes(err.code)) {
            this.#features.logging.error(`${loggingUtils.formatErr(err)} `)
            if (err.code === 'InputTooLong') {
                // Clear the chat history in the database for this tab
                this.#chatHistoryDb.clearTab(tabId)
            }

            const errorBody =
                err.code === 'QModelResponse' && requestID
                    ? `${err.message} \n\nRequest ID: ${requestID} `
                    : err.message
            return new ResponseError<ChatResult>(LSPErrorCodes.RequestFailed, err.message, {
                type: 'answer',
                body: errorBody,
                messageId: errorMessageId,
                buttons: [],
            })
        }
        this.#features.logging.error(`Unknown Error: ${loggingUtils.formatErr(err)} `)
        return new ResponseError<ChatResult>(LSPErrorCodes.RequestFailed, err.message, {
            type: 'answer',
            body: requestID ? `${genericErrorMsg} \n\nRequest ID: ${requestID} ` : genericErrorMsg,
            messageId: errorMessageId,
            buttons: [],
        })
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

            if (!this.#serviceManager) {
                throw new Error('amazonQServiceManager is not initialized')
            }

            const client = this.#serviceManager.getStreamingClient()
            response = await client.sendMessage(requestInput as SendMessageCommandInputCodeWhispererStreaming)
            this.#log('Response for inline chat', JSON.stringify(response.$metadata), JSON.stringify(response))
        } catch (err) {
            if (err instanceof AmazonQServicePendingSigninError || err instanceof AmazonQServicePendingProfileError) {
                this.#log(`Q Inline Chat SSO Connection error: ${getErrorMessage(err)} `)
                return new ResponseError<ChatResult>(LSPErrorCodes.RequestFailed, err.message)
            }
            this.#log(`Q api request error ${err instanceof Error ? JSON.stringify(err) : 'unknown'} `)
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

    async onInlineChatResult(params: InlineChatResultParams) {
        await this.#telemetryService.emitInlineChatResultLog(params)
    }

    async onCodeInsertToCursorPosition(params: InsertToCursorPositionParams) {
        // Implementation based on https://github.com/aws/aws-toolkit-vscode/blob/1814cc84228d4bf20270574c5980b91b227f31cf/packages/core/src/amazonq/commons/controllers/contentController.ts#L38
        if (!params.textDocument || !params.cursorPosition || !params.code) {
            const missingParams = []

            if (!params.textDocument) missingParams.push('textDocument')
            if (!params.cursorPosition) missingParams.push('cursorPosition')
            if (!params.code) missingParams.push('code')

            this.#log(
                `Q Chat server failed to insert code.Missing required parameters for insert code: ${missingParams.join(', ')} `
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

        this.#userWrittenCodeTracker?.onQStartsMakingEdits()
        const applyResult = await this.#features.lsp.workspace.applyWorkspaceEdit(workspaceEdit)
        this.#userWrittenCodeTracker?.onQFinishesEdits()

        if (applyResult.applied) {
            this.#log(`Q Chat server inserted code successfully`)
            this.#telemetryController.enqueueCodeDiffEntry({ ...params, code: textWithIndent })
        } else {
            this.#log(
                `Q Chat server failed to insert code: ${applyResult.failureReason ?? 'No failure reason provided'} `
            )
        }
    }
    onCopyCodeToClipboard() {}

    onEndChat(params: EndChatParams, _token: CancellationToken): boolean {
        const { success } = this.#chatSessionManagementService.deleteSession(params.tabId)

        return success
    }

    async onFileClicked(params: FileClickParams) {
        const session = this.#chatSessionManagementService.getSession(params.tabId)
        const toolUseId = params.messageId
        const toolUse = toolUseId ? session.data?.toolUseLookup.get(toolUseId) : undefined

        if (toolUse?.name === 'fsWrite') {
            const input = toolUse.input as unknown as FsWriteParams
            this.#features.lsp.workspace.openFileDiff({
                originalFileUri: input.path,
                originalFileContent: toolUse.fileChange?.before,
                isDeleted: false,
                fileContent: toolUse.fileChange?.after,
            })
        } else if (toolUse?.name === 'fsRead') {
            await this.#features.lsp.window.showDocument({ uri: URI.file(params.filePath).toString() })
        } else {
            const absolutePath = params.fullPath ?? (await this.#resolveAbsolutePath(params.filePath))
            if (absolutePath) {
                await this.#features.lsp.window.showDocument({ uri: URI.file(absolutePath).toString() })
            }
        }
    }

    onFollowUpClicked() {}

    onInfoLinkClick() {}

    onLinkClick() {}

    async onReady() {
        await this.restorePreviousChats()
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
            const workspaceFolders = workspaceUtils.getWorkspaceFolderPaths(this.#features.workspace)
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

            this.#features.logging.error(`File not found: ${relativePath} `)
        } catch (e: any) {
            this.#features.logging.error(`Error resolving absolute path: ${e.message} `)
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

    async #invalidateAllShellCommands(tabId: string, session: ChatSessionService) {
        for (const [toolUseId, toolUse] of session.toolUseLookup.entries()) {
            if (toolUse.name !== 'executeBash' || this.#stoppedToolUses.has(toolUseId)) continue

            const params = toolUse.input as unknown as ExecuteBashParams
            const command = params.command

            await this.#features.chat.sendChatUpdate({
                tabId,
                state: { inProgress: false },
                data: {
                    messages: [
                        {
                            messageId: toolUseId,
                            type: 'tool',
                            body: `\`\`\`shell\n${command}\n\`\`\``,
                            header: {
                                body: 'shell',
                                status: { icon: 'block', text: 'Ignored' },
                                buttons: [],
                            },
                        },
                    ],
                },
            })

            this.#stoppedToolUses.add(toolUseId)
        }
    }

    async #processGenerateAssistantResponseResponseWithTimeout(
        response: GenerateAssistantResponseCommandOutput,
        metric: Metric<AddMessageEvent>,
        chatResultStream: AgenticChatResultStream,
        session: ChatSessionService,
        contextList?: FileList
    ): Promise<Result<AgenticChatResultWithMetadata, string>> {
        const abortController = new AbortController()
        const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => {
                abortController.abort()
                reject(
                    new AgenticChatError(
                        `${responseTimeoutPartialMsg} ${responseTimeoutMs}ms`,
                        'ResponseProcessingTimeout'
                    )
                )
            }, responseTimeoutMs)
        })
        const streamWriter = chatResultStream.getResultStreamWriter()
        const processResponsePromise = this.#processGenerateAssistantResponseResponse(
            response,
            metric,
            chatResultStream,
            streamWriter,
            session,
            contextList,
            abortController.signal
        )
        try {
            return await Promise.race([processResponsePromise, timeoutPromise])
        } catch (err) {
            await streamWriter.close()
            if (err instanceof AgenticChatError && err.code === 'ResponseProcessingTimeout') {
                return { success: false, error: err.message }
            }
            throw err
        }
    }

    async #showToolUseIntermediateResult(
        data: AgenticChatResultWithMetadata,
        chatResultStream: AgenticChatResultStream,
        streamWriter: ResultStreamWriter
    ) {
        // extract the key value from incomplete JSON response stream
        function extractKey(incompleteJson: string, key: string): string | undefined {
            const pattern = new RegExp(`"${key}":\\s*"([^"]*)"`, 'g')
            const match = pattern.exec(incompleteJson)
            return match?.[1]
        }
        const toolUses = Object.values(data.toolUses)
        for (const toolUse of toolUses) {
            if (toolUse.name === 'fsWrite' && typeof toolUse.input === 'string') {
                const filepath = extractKey(toolUse.input, 'path')
                const msgId = progressPrefix + toolUse.toolUseId
                // render fs write UI as soon as fs write starts
                if (filepath && !chatResultStream.hasMessage(msgId)) {
                    const fileName = path.basename(filepath)
                    await streamWriter.close()
                    await chatResultStream.writeResultBlock({
                        type: 'tool',
                        messageId: msgId,
                        header: {
                            fileList: {
                                filePaths: [fileName],
                                details: {
                                    [fileName]: {
                                        description: filepath,
                                    },
                                },
                            },
                            status: {
                                status: 'info',
                                icon: 'progress',
                                text: '',
                            },
                        },
                    })
                }
                // render the tool use explanatory as soon as this is received for fsWrite
                const explanation = extractKey(toolUse.input, 'explanation')
                const messageId = progressPrefix + toolUse.toolUseId + '_explanation'
                if (explanation && !chatResultStream.hasMessage(messageId)) {
                    await streamWriter.close()
                    await chatResultStream.writeResultBlock({
                        type: 'directive',
                        messageId: messageId,
                        body: explanation,
                    })
                }
            }
        }
    }

    async #processGenerateAssistantResponseResponse(
        response: GenerateAssistantResponseCommandOutput,
        metric: Metric<AddMessageEvent>,
        chatResultStream: AgenticChatResultStream,
        streamWriter: ResultStreamWriter,
        session: ChatSessionService,
        contextList?: FileList,
        abortSignal?: AbortSignal
    ): Promise<Result<AgenticChatResultWithMetadata, string>> {
        const requestId = response.$metadata.requestId!
        const chatEventParser = new AgenticChatEventParser(requestId, metric, this.#features.logging)

        // Display context transparency list once at the beginning of response
        // Use a flag to track if contextList has been sent already to avoid ux flickering
        if (contextList?.filePaths && contextList.filePaths.length > 0 && !session.contextListSent) {
            await streamWriter.write({ body: '', contextList })
            session.contextListSent = true
        }

        const toolUseStartTimes: Record<string, number> = {}
        const toolUseLoadingTimeouts: Record<string, NodeJS.Timeout> = {}
        for await (const chatEvent of response.generateAssistantResponseResponse!) {
            if (abortSignal?.aborted) {
                throw new Error('Operation was aborted')
            }
            if (chatEvent.assistantResponseEvent) {
                await this.#showUndoAllIfRequired(chatResultStream, session)
            }
            const result = chatEventParser.processPartialEvent(chatEvent)

            // terminate early when there is an error
            if (!result.success) {
                await streamWriter.close()
                return result
            }

            // make sure to save code reference events
            if (chatEvent.assistantResponseEvent || chatEvent.codeReferenceEvent) {
                await streamWriter.write(result.data.chatResult)
            }

            if (chatEvent.toolUseEvent) {
                await this.#showLoadingIfRequired(
                    chatEvent.toolUseEvent,
                    streamWriter,
                    toolUseStartTimes,
                    toolUseLoadingTimeouts
                )
                await this.#showToolUseIntermediateResult(result.data, chatResultStream, streamWriter)
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

    /**
     * This is needed to handle the case where a toolUseEvent takes a long time to resolve the stream and looks like
     * nothing is happening.
     */
    async #showLoadingIfRequired(
        toolUseEvent: ToolUseEvent,
        streamWriter: ResultStreamWriter,
        toolUseStartTimes: Record<string, number>,
        toolUseLoadingTimeouts: Record<string, NodeJS.Timeout>
    ) {
        const toolUseId = toolUseEvent.toolUseId
        if (!toolUseEvent.stop && toolUseId) {
            if (!toolUseStartTimes[toolUseId]) {
                toolUseStartTimes[toolUseId] = Date.now()
                // Also record in the class-level toolUseStartTimes for latency calculation
                if (!this.#toolUseStartTimes[toolUseId]) {
                    this.#toolUseStartTimes[toolUseId] = Date.now()
                }
                this.#debug(`ToolUseEvent ${toolUseId} started`)
                toolUseLoadingTimeouts[toolUseId] = setTimeout(async () => {
                    this.#debug(
                        `ToolUseEvent ${toolUseId} is taking longer than ${loadingThresholdMs}ms, showing loading indicator`
                    )
                    await streamWriter.write({ ...loadingMessage, messageId: `loading-${toolUseId}` })
                }, loadingThresholdMs)
            }
        } else if (toolUseEvent.stop && toolUseId) {
            if (toolUseStartTimes[toolUseId]) {
                const duration = Date.now() - toolUseStartTimes[toolUseId]
                this.#debug(`ToolUseEvent ${toolUseId} finished streaming after ${duration}ms`)
                if (toolUseLoadingTimeouts[toolUseId]) {
                    clearTimeout(toolUseLoadingTimeouts[toolUseId])
                    delete toolUseLoadingTimeouts[toolUseId]
                }
                delete toolUseStartTimes[toolUseId]
            }
        }
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
        if (newConfig.sendUserWrittenCodeMetrics) {
            this.#userWrittenCodeTracker = UserWrittenCodeTracker.getInstance(this.#telemetryService)
        }
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
        const allTools = this.#features.agent.getTools({ format: 'bedrock' })
        if (!enabledMCP(this.#features.lsp.getClientInitializeParams())) {
            if (!session.pairProgrammingMode) {
                return allTools.filter(tool => !['fsWrite', 'executeBash'].includes(tool.toolSpecification?.name || ''))
            }
            return allTools
        }

        // Read Only Tools = All Tools - Restricted Tools (MCP + Write Tools)
        // TODO: mcp tool spec name will be server___tool.
        // TODO: Will also need to handle rare edge cases of long server name + long tool name > 64 char
        const allNamespacedTools = new Set<string>()
        const mcpToolSpecNames = new Set(
            McpManager.instance
                .getAllTools()
                .map(tool => createNamespacedToolName(tool.serverName, tool.toolName, allNamespacedTools))
        )
        const writeToolNames = new Set(['fsWrite', 'executeBash'])
        const restrictedToolNames = new Set([...mcpToolSpecNames, ...writeToolNames])

        const readOnlyTools = allTools.filter(tool => {
            const toolName = tool.toolSpecification.name
            return !restrictedToolNames.has(toolName)
        })
        return session.pairProgrammingMode ? allTools : readOnlyTools
    }

    async restorePreviousChats() {
        try {
            await this.#tabBarController.loadChats()
        } catch (error) {
            this.#log('Error restoring previous chats: ' + error)
        }
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

    /**
     * Handles the result of an MCP tool execution
     * @param toolUse The tool use object
     * @param result The result from running the tool
     * @param session The chat session
     * @param chatResultStream The chat result stream for writing/updating blocks
     */
    async #handleMcpToolResult(
        toolUse: ToolUse,
        result: any,
        session: ChatSessionService,
        chatResultStream: AgenticChatResultStream
    ): Promise<void> {
        // Early return if name or toolUseId is undefined
        if (!toolUse.name || !toolUse.toolUseId) {
            this.#log(`Cannot handle MCP tool result: missing name or toolUseId`)
            return
        }

        // Get original server and tool names from the mapping
        const originalNames = getOriginalToolNames(toolUse.name)
        if (originalNames) {
            const { serverName, toolName } = originalNames
            const def = McpManager.instance
                .getAllTools()
                .find(d => d.serverName === serverName && d.toolName === toolName)
            if (def) {
                // Format the tool result and input as JSON strings
                const toolInput = JSON.stringify(toolUse.input, null, 2)
                const toolResultContent = typeof result === 'string' ? result : JSON.stringify(result, null, 2)

                const toolResultCard: ChatMessage = {
                    type: 'tool',
                    messageId: toolUse.toolUseId,
                    summary: {
                        content: {
                            header: {
                                icon: 'tools',
                                body: `${toolName}`,
                                fileList: undefined,
                            },
                        },
                        collapsedContent: [
                            {
                                header: {
                                    body: 'Parameters',
                                },
                                body: `\`\`\`json\n${toolInput}\n\`\`\``,
                            },
                            {
                                header: {
                                    body: 'Results',
                                },
                                body: `\`\`\`json\n${toolResultContent}\n\`\`\``,
                            },
                        ],
                    },
                }

                // Get the stored blockId for this tool use
                const cachedToolUse = session.toolUseLookup.get(toolUse.toolUseId)
                const cachedButtonBlockId = (cachedToolUse as any)?.cachedButtonBlockId

                if (cachedButtonBlockId !== undefined) {
                    // Update the existing card with the results
                    await chatResultStream.overwriteResultBlock(toolResultCard, cachedButtonBlockId)
                } else {
                    // Fallback to creating a new card
                    this.#log(`Warning: No blockId found for tool use ${toolUse.toolUseId}, creating new card`)
                    await chatResultStream.writeResultBlock(toolResultCard)
                }
                return
            }
        }

        // Fallback for tools not found in mapping
        await chatResultStream.writeResultBlock({
            type: 'tool',
            messageId: toolUse.toolUseId,
            body: toolResultMessage(toolUse, result),
        })
    }

    #log(...messages: string[]) {
        this.#features.logging.log(messages.join(' '))
    }

    #debug(...messages: string[]) {
        this.#features.logging.debug(messages.join(' '))
    }
}
