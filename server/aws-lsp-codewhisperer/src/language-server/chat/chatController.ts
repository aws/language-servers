import { SendMessageCommandInput, SendMessageCommandOutput } from '@amzn/codewhisperer-streaming'
import { ErrorCodes, FeedbackParams, chatRequestType } from '@aws/language-server-runtimes/protocol'
import {
    CancellationToken,
    ChatParams,
    ChatResult,
    LSPErrorCodes,
    QuickActionParams,
    ResponseError,
} from '@aws/language-server-runtimes/server-interface'
import { v4 as uuid } from 'uuid'
import {
    AddMessageEvent,
    ChatInteractionType,
    ChatTelemetryEventName,
    CombinedConversationEvent,
} from '../telemetry/types'
import { Features, Result } from '../types'
import { ChatEventParser, ChatResultWithMetadata } from './chatEventParser'
import { createAuthFollowUpResult, getAuthFollowUpType, getDefaultChatResponse } from './utils'
import { ChatSessionManagementService } from './chatSessionManagementService'
import { ChatTelemetryController } from './telemetry/chatTelemetryController'
import { QuickAction } from './quickActions'
import { getErrorMessage, isAwsError, isNullish, isObject } from '../utils'
import { Metric } from '../telemetry/metric'
import { QChatTriggerContext, TriggerContext } from './contexts/triggerContext'
import { HELP_MESSAGE } from './constants'
import { TelemetryService } from '../telemetryService'
import { BaseController } from './baseController'

export class ChatController extends BaseController {
    #telemetryController: ChatTelemetryController
    #triggerContext: QChatTriggerContext
    #customizationArn?: string

    constructor(
        chatSessionManagementService: ChatSessionManagementService,
        features: Features,
        telemetryService: TelemetryService
    ) {
        super(chatSessionManagementService, features, telemetryService)
        this.#triggerContext = new QChatTriggerContext(features.workspace, features.logging)
        this.#telemetryController = new ChatTelemetryController(features, telemetryService)
    }

    override dispose() {
        super.dispose()
        this.#telemetryController.dispose()
    }

    override async onChatPrompt(
        params: ChatParams,
        token: CancellationToken
    ): Promise<ChatResult | ResponseError<ChatResult>> {
        const maybeDefaultResponse = getDefaultChatResponse(params.prompt.prompt)

        if (maybeDefaultResponse) {
            return maybeDefaultResponse
        }

        const sessionResult = this.chatSessionManagementService.getSession(params.tabId)

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
            this.log('cancellation requested')
            session.abortRequest()
        })

        let response: SendMessageCommandOutput
        let requestInput: SendMessageCommandInput

        const conversationIdentifier = session?.conversationId ?? 'New conversation'
        try {
            this.log('Request for conversation id:', conversationIdentifier)
            requestInput = this.#triggerContext.getChatParamsFromTrigger(params, triggerContext, this.#customizationArn)

            metric.recordStart()
            response = await session.sendMessage(requestInput)
            this.log('Response for conversation id:', conversationIdentifier, JSON.stringify(response.$metadata))
        } catch (err) {
            if (isAwsError(err) || (isObject(err) && 'statusCode' in err && typeof err.statusCode === 'number')) {
                metric.setDimension('cwsprChatRepsonseCode', err.statusCode ?? 400)
                this.#telemetryController.emitMessageResponseError(params.tabId, metric.metric)
            }

            const authFollowType = getAuthFollowUpType(err)

            if (authFollowType) {
                this.log(`Q auth error: ${getErrorMessage(err)}`)

                return createAuthFollowUpResult(authFollowType)
            }

            this.log(`Q api request error ${err instanceof Error ? err.message : 'unknown'}`)
            return new ResponseError<ChatResult>(
                LSPErrorCodes.RequestFailed,
                err instanceof Error ? err.message : 'Unknown request error'
            )
        }

        try {
            const result = await this.#processSendMessageResponse(
                response,
                metric.mergeWith({
                    cwsprChatResponseCode: response.$metadata.httpStatusCode,
                    cwsprChatMessageId: response.$metadata.requestId,
                }),
                params.partialResultToken
            )

            session.conversationId = result.data?.conversationId
            this.log('Session conversation id:', session.conversationId || '')

            if (session.conversationId) {
                this.#telemetryController.setConversationId(params.tabId, session.conversationId)

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

            metric.setDimension('codewhispererCustomizationArn', requestInput.conversationState?.customizationArn)
            await this.#telemetryController.emitAddMessageMetric(params.tabId, metric.metric)

            this.#telemetryController.updateTriggerInfo(params.tabId, {
                lastMessageTrigger: {
                    ...triggerContext,
                    messageId: response.$metadata.requestId,
                    followUpActions: new Set(
                        result.data?.chatResult.followUp?.options
                            ?.map(option => option.prompt ?? '')
                            .filter(prompt => prompt.length > 0)
                    ),
                },
            })

            return result.success
                ? result.data.chatResult
                : new ResponseError<ChatResult>(LSPErrorCodes.RequestFailed, result.error)
        } catch (err) {
            this.log('Error encountered during response streaming:', err instanceof Error ? err.message : 'unknown')

            return new ResponseError<ChatResult>(
                LSPErrorCodes.RequestFailed,
                err instanceof Error ? err.message : 'Unknown error occured during response stream'
            )
        }
    }

    override onSendFeedback({ tabId, feedbackPayload }: FeedbackParams) {
        this.features.telemetry.emitMetric({
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

    override onQuickAction(params: QuickActionParams, _cancellationToken: CancellationToken) {
        switch (params.quickAction) {
            case QuickAction.Clear: {
                const sessionResult = this.chatSessionManagementService.getSession(params.tabId)

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

    async #processSendMessageResponse(
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
                await this.features.lsp.sendProgress(chatRequestType, partialResultToken, result.data.chatResult)
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
}
