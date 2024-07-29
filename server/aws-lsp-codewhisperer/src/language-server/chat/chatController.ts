import { GenerateAssistantResponseCommandOutput } from '@amzn/codewhisperer-streaming'
import { ErrorCodes, FeedbackParams, chatRequestType } from '@aws/language-server-runtimes/protocol'
import {
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
} from '@aws/language-server-runtimes/server-interface'
import { v4 as uuid } from 'uuid'
import {
    AddMessageEvent,
    ChatInteractionType,
    ChatTelemetryEventName,
    CombinedConversationEvent,
} from '../telemetry/types'
import { Features, LspHandlers, Result } from '../types'
import { ChatEventParser } from './chatEventParser'
import { createAuthFollowUpResult, getAuthFollowUpType, getDefaultChatResponse } from './utils'
import { ChatSessionManagementService } from './chatSessionManagementService'
import { ChatTelemetryController } from './telemetry/chatTelemetryController'
import { QuickAction } from './quickActions'
import { getErrorMessage, hasCode, isAwsError, isNullish, isObject } from '../utils'
import { Metric } from '../telemetry/metric'
import { TriggerContext, TriggerContextExtractor } from './contexts/triggerContextExtractor'
import { HELP_MESSAGE } from './constants'

type ChatHandlers = LspHandlers<Chat>

export class ChatController implements ChatHandlers {
    #features: Features
    #chatSessionManagementService: ChatSessionManagementService
    #telemetryController: ChatTelemetryController
    #triggerContext: TriggerContextExtractor

    constructor(chatSessionManagementService: ChatSessionManagementService, features: Features) {
        this.#features = features
        this.#chatSessionManagementService = chatSessionManagementService
        this.#triggerContext = new TriggerContextExtractor(features.workspace, { logger: features.logging })
        this.#telemetryController = new ChatTelemetryController(features)
    }

    dispose() {
        this.#chatSessionManagementService.dispose()
        this.#triggerContext.dispose()
        this.#telemetryController.dispose()
    }

    async onChatPrompt(params: ChatParams, token: CancellationToken): Promise<ChatResult | ResponseError<ChatResult>> {
        const maybeDefaultResponse = getDefaultChatResponse(params.prompt.prompt)

        if (maybeDefaultResponse) {
            return maybeDefaultResponse
        }

        const sessionResult = this.#chatSessionManagementService.getSession(params.tabId)

        const { data: session, success } = sessionResult

        if (!success) {
            return new ResponseError<ChatResult>(ErrorCodes.InternalError, sessionResult.error)
        }

        return this.#withLspCancellation<ChatResult>(params.tabId, token, async checkIsCancelled => {
            const metric = new Metric<CombinedConversationEvent>({
                cwsprChatConversationType: 'Chat',
            })

            const triggerContext = await this.#getTriggerContext(params, metric)

            // return empty result since the other promise will have been resolved
            if (checkIsCancelled()) {
                return {}
            }

            const isNewConversation = !session.sessionId

            let response: GenerateAssistantResponseCommandOutput

            const conversationIdentifier = session?.sessionId ?? 'New session'
            try {
                this.#log('Request for conversation id:', conversationIdentifier)
                const requestInput = TriggerContextExtractor.getChatParamsFromTrigger(params, triggerContext)

                metric.recordStart()
                response = await session.generateAssistantResponse(requestInput)
                this.#log('Response for conversationId:', conversationIdentifier, JSON.stringify(response.$metadata))
            } catch (err) {
                if (isObject(err) && 'name' in err && err.name === 'AbortError') {
                    this.#log('Q api request aborted')

                    return new ResponseError<ChatResult>(LSPErrorCodes.RequestCancelled, 'Request cancelled')
                } else if (
                    isAwsError(err) ||
                    (isObject(err) && 'statusCode' in err && typeof err.statusCode === 'number')
                ) {
                    metric.setDimension('cwsprChatRepsonseCode', err.statusCode ?? 400)
                    this.#telemetryController.emitMessageResponseError(params.tabId, metric.metric)
                }

                const authFollowType = getAuthFollowUpType(err)

                if (authFollowType) {
                    this.#log(`Q auth error: ${getErrorMessage(err)}`)

                    return createAuthFollowUpResult(authFollowType)
                }

                this.#log(`Q api request error ${err instanceof Error ? err.message : 'unknown'}`)
                return new ResponseError<ChatResult>(
                    LSPErrorCodes.RequestFailed,
                    err instanceof Error ? err.message : 'Unknown request error'
                )
            }

            if (response.conversationId) {
                this.#telemetryController.setConversationId(params.tabId, response.conversationId)

                if (isNewConversation) {
                    this.#telemetryController.emitStartConversationMetric(params.tabId, metric.metric)
                }
            }

            // return empty result since the other promise will have been resolved
            if (checkIsCancelled()) {
                return {}
            }

            try {
                const result = await this.#processAssistantResponse(
                    response,
                    metric.mergeWith({
                        cwsprChatResponseCode: response.$metadata.httpStatusCode,
                        cwsprChatMessageId: response.$metadata.requestId,
                    }),
                    params.partialResultToken
                )

                this.#telemetryController.emitAddMessageMetric(params.tabId, metric.metric)

                this.#telemetryController.updateTriggerInfo(params.tabId, {
                    lastMessageTrigger: {
                        ...triggerContext,
                        messageId: response.$metadata.requestId,
                        followUpActions: new Set(
                            result.data?.followUp?.options
                                ?.map(option => option.prompt ?? '')
                                .filter(prompt => prompt.length > 0)
                        ),
                    },
                })

                return result.success
                    ? result.data
                    : new ResponseError<ChatResult>(LSPErrorCodes.RequestFailed, result.error)
            } catch (err) {
                if (hasCode(err) && err.code === 'ECONNRESET') {
                    this.#log('Response streaming aborted')
                    return new ResponseError<ChatResult>(LSPErrorCodes.RequestCancelled, 'Request cancelled')
                }

                this.#log(
                    'Error encountered during response streaming:',
                    err instanceof Error ? err.message : 'unknown'
                )

                return new ResponseError<ChatResult>(
                    LSPErrorCodes.RequestFailed,
                    err instanceof Error ? err.message : 'Unknown error occured during response stream'
                )
            }
        })
    }

    onCodeInsertToCursorPosition() {}
    onCopyCodeToClipboard() {}

    onEndChat(params: EndChatParams, _token: CancellationToken): boolean {
        this.#log('end chat')
        this.#cancelRequest(params.tabId)

        return true
    }

    onFollowUpClicked() {}

    onInfoLinkClick() {}

    onLinkClick() {}

    onReady() {}

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

    async #getTriggerContext(params: ChatParams, metric: Metric<CombinedConversationEvent>) {
        const lastMessageTrigger = this.#telemetryController.getLastMessageTrigger(params.tabId)

        let triggerContext: TriggerContext

        // this is the only way we can detect a follow up action
        // we can reuse previous trigger information
        if (lastMessageTrigger?.followUpActions?.has(params.prompt?.prompt ?? '')) {
            this.#telemetryController.emitInteractWithMessageMetric(params.tabId, {
                cwsprChatMessageId: lastMessageTrigger.messageId!,
                cwsprChatInteractionType: ChatInteractionType.ClickFollowUp,
            })

            triggerContext = lastMessageTrigger
        } else {
            triggerContext = await this.#triggerContext.getTriggerContext(params)
            triggerContext.triggerType = this.#telemetryController.getCurrentTrigger(params.tabId) ?? 'click'
        }

        metric.mergeWith({
            cwsprChatUserIntent: triggerContext?.userIntent,
            cwsprChatProgrammingLanguage: triggerContext?.programmingLanguage?.languageName,
            cwsprChatRequestLength: params.prompt?.prompt?.length ?? 0,
            cwsprChatTriggerInteraction: triggerContext?.triggerType,
            cwsprChatHasCodeSnippet: triggerContext.hasCodeSnippet ?? false,
            cwsprChatActiveEditorImportCount: triggerContext.documentSymbols?.length ?? 0,
            cwsprChatActiveEditorTotalCharacters: triggerContext.totalEditorCharacters ?? 0,
        })

        return triggerContext
    }

    async #processAssistantResponse(
        response: GenerateAssistantResponseCommandOutput,
        metric: Metric<AddMessageEvent>,
        partialResultToken?: string | number
    ): Promise<Result<ChatResult, string>> {
        const requestId = response.$metadata.requestId!
        const chatEventParser = new ChatEventParser(requestId, metric)

        for await (const chatEvent of response.generateAssistantResponseResponse!) {
            const chatResult = chatEventParser.processPartialEvent(chatEvent)

            // terminate early when there is an error
            if (!chatResult.success) {
                return chatResult
            }

            if (!isNullish(partialResultToken)) {
                this.#features.lsp.sendProgress(chatRequestType, partialResultToken, chatResult.data)
            }
        }

        metric.mergeWith({
            cwsprChatFullResponseLatency: metric.getTimeElapsed(),
            cwsprChatFollowUpCount: chatEventParser.totalEvents.followupPromptEvent,
            cwsprChatReferencesCount: chatEventParser.totalEvents.codeReferenceEvent,
            cwsprChatSourceLinkCount: chatEventParser.totalEvents.supplementaryWebLinksEvent,
            cwsprChatResponseLength: chatEventParser.body?.length ?? 0,
        })

        return chatEventParser.getChatResult()
    }

    #log(...messages: string[]) {
        this.#features.logging.log(messages.join(' '))
    }

    #cancelRequest(tabId: string) {
        this.#triggerContext.cancel(tabId)
        this.#chatSessionManagementService.getSession(tabId).data?.abortRequest()
    }

    #withLspCancellation<TReturnValue>(
        tabId: string,
        token: CancellationToken,
        action: (checkIsCancelled: () => boolean) => Promise<TReturnValue | ResponseError<TReturnValue>>
    ): Promise<TReturnValue | ResponseError<TReturnValue>> {
        let isCancelled = false

        return Promise.race([
            new Promise<ResponseError<TReturnValue>>(resolve => {
                token.onCancellationRequested(() => {
                    this.#log('cancellation requested')

                    this.#cancelRequest(tabId)
                    isCancelled = true

                    resolve(new ResponseError<TReturnValue>(LSPErrorCodes.RequestCancelled, 'Request cancelled'))
                })
            }),
            // .race doesn't stop the "losing" promise from executing so we need to provide this boolean for early termination
            action(() => isCancelled),
        ])
    }
}
