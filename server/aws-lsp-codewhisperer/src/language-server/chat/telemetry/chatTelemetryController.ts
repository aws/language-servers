import { MetricEvent } from '@aws/language-server-runtimes/server-interface/telemetry'
import { TriggerType } from '@aws/chat-client-ui-types'
import {
    ChatInteractionType,
    ChatTelemetryEventMap,
    ChatTelemetryEventName,
    CombinedConversationEvent,
    InteractWithMessageEvent,
} from '../../telemetry/types'
import { Features, KeysMatching } from '../../types'
import { ChatUIEventName, RelevancyVoteType, isClientTelemetryEvent } from './clientTelemetry'
import { UserIntent } from '@amzn/codewhisperer-streaming'
import { TriggerContext } from '../contexts/triggerContext'

export const CONVERSATION_ID_METRIC_KEY = 'cwsprChatConversationId'

export interface ChatMetricEvent<
    TName extends ChatTelemetryEventName,
    TData extends ChatTelemetryEventMap[TName] = ChatTelemetryEventMap[TName],
> extends MetricEvent {
    name: TName
    data: TData
}

type ConversationMetricName = KeysMatching<ChatTelemetryEventMap, { [CONVERSATION_ID_METRIC_KEY]: string }>

interface MessageTrigger extends TriggerContext {
    messageId?: string
    followUpActions?: Set<string>
}

interface StartTrigger {
    triggerType?: TriggerType
    hasUserSnippet?: boolean
}

interface ConversationTriggerInfo {
    conversationId: string
    startTrigger?: StartTrigger
    lastMessageTrigger?: MessageTrigger
}

export class ChatTelemetryController {
    #activeTabId?: string
    #tabTelemetryInfoByTabId: { [tabId: string]: ConversationTriggerInfo }
    #currentTriggerByTabId: { [tabId: string]: TriggerType } = {}
    #telemetry: Features['telemetry']

    constructor(telemetry: Features['telemetry']) {
        this.#tabTelemetryInfoByTabId = {}
        this.#currentTriggerByTabId = {}
        this.#telemetry = telemetry

        this.#telemetry.onClientTelemetry(params => this.#handleClientTelemetry(params))
    }

    public get activeTabId(): string | undefined {
        return this.#activeTabId
    }

    public set activeTabId(activeTabId: string | undefined) {
        this.#activeTabId = activeTabId
    }

    public getCurrentTrigger(tabId: string) {
        return this.#currentTriggerByTabId[tabId]
    }

    public getConversationId(tabId?: string) {
        return tabId && this.#tabTelemetryInfoByTabId[tabId]?.conversationId
    }

    public removeConversation(tabId: string) {
        delete this.#tabTelemetryInfoByTabId[tabId]
    }

    public setConversationId(tabId: string, conversationId: string) {
        this.updateTriggerInfo(tabId, { conversationId })
    }

    public updateTriggerInfo(tabId: string, info: Partial<ConversationTriggerInfo>) {
        this.#tabTelemetryInfoByTabId[tabId] = { ...this.#tabTelemetryInfoByTabId[tabId], ...info }
    }

    public getLastMessageTrigger(tabId: string) {
        return this.#tabTelemetryInfoByTabId[tabId]?.lastMessageTrigger
    }

    public emitChatMetric<TName extends ChatTelemetryEventName>(
        metric: ChatMetricEvent<TName, ChatTelemetryEventMap[TName]>
    ) {
        this.#telemetry.emitMetric(metric)
    }

    public emitConversationMetric<
        TName extends ConversationMetricName,
        TEvent extends ChatMetricEvent<TName, ChatTelemetryEventMap[TName]>,
    >(
        metric: Omit<TEvent, 'data'> & {
            data: Omit<TEvent['data'], typeof CONVERSATION_ID_METRIC_KEY>
        },
        tabId = this.activeTabId
    ) {
        const conversationId = this.getConversationId(tabId)
        if (conversationId) {
            this.#telemetry.emitMetric({
                ...metric,
                data: {
                    ...metric.data,
                    [CONVERSATION_ID_METRIC_KEY]: conversationId,
                },
            })
        }
    }

    public emitAddMessageMetric(tabId: string, metric: Partial<CombinedConversationEvent>) {
        this.emitConversationMetric(
            {
                name: ChatTelemetryEventName.AddMessage,
                data: {
                    cwsprChatHasCodeSnippet: metric.cwsprChatHasCodeSnippet,
                    cwsprChatTriggerInteraction: metric.cwsprChatTriggerInteraction,
                    cwsprChatMessageId: metric.cwsprChatMessageId,
                    cwsprChatUserIntent: metric.cwsprChatUserIntent,
                    cwsprChatProgrammingLanguage: metric.cwsprChatProgrammingLanguage,
                    cwsprChatResponseCodeSnippetCount: metric.cwsprChatResponseCodeSnippetCount,
                    cwsprChatResponseCode: metric.cwsprChatResponseCode,
                    cwsprChatSourceLinkCount: metric.cwsprChatSourceLinkCount,
                    cwsprChatReferencesCount: metric.cwsprChatReferencesCount,
                    cwsprChatFollowUpCount: metric.cwsprChatFollowUpCount,
                    cwsprTimeToFirstChunk: metric.cwsprTimeToFirstChunk,
                    cwsprChatFullResponseLatency: metric.cwsprChatFullResponseLatency,
                    cwsprChatTimeBetweenChunks: metric.cwsprChatTimeBetweenChunks,
                    cwsprChatRequestLength: metric.cwsprChatRequestLength,
                    cwsprChatResponseLength: metric.cwsprChatResponseLength,
                    cwsprChatConversationType: metric.cwsprChatConversationType,
                    cwsprChatActiveEditorTotalCharacters: metric.cwsprChatActiveEditorTotalCharacters,
                    cwsprChatActiveEditorImportCount: metric.cwsprChatActiveEditorImportCount,
                    // not possible: cwsprChatResponseType: metric.cwsprChatResponseType,
                },
            },
            tabId
        )
    }

    public emitStartConversationMetric(tabId: string, metric: Partial<CombinedConversationEvent>) {
        this.emitConversationMetric(
            {
                name: ChatTelemetryEventName.StartConversation,
                data: {
                    cwsprChatHasCodeSnippet: metric.cwsprChatHasCodeSnippet,
                    cwsprChatTriggerInteraction: metric.cwsprChatTriggerInteraction,
                    cwsprChatUserIntent: metric.cwsprChatUserIntent,
                    cwsprChatProgrammingLanguage: metric.cwsprChatProgrammingLanguage,
                    cwsprChatConversationType: metric.cwsprChatConversationType,
                },
            },
            tabId
        )
    }

    public emitInteractWithMessageMetric(
        tabId: string,
        metric: Omit<InteractWithMessageEvent, 'cwsprChatConversationId'>
    ) {
        this.emitConversationMetric(
            {
                name: ChatTelemetryEventName.InteractWithMessage,
                data: metric,
            },
            tabId
        )
    }

    public emitMessageResponseError(tabId: string, metric: Partial<CombinedConversationEvent>) {
        this.emitConversationMetric(
            {
                name: ChatTelemetryEventName.MessageResponseError,
                data: {
                    cwsprChatHasCodeSnippet: metric.cwsprChatHasCodeSnippet,
                    cwsprChatTriggerInteraction: metric.cwsprChatTriggerInteraction,
                    cwsprChatUserIntent: metric.cwsprChatUserIntent,
                    cwsprChatProgrammingLanguage: metric.cwsprChatProgrammingLanguage,
                    cwsprChatActiveEditorTotalCharacters: metric.cwsprChatActiveEditorTotalCharacters,
                    cwsprChatActiveEditorImportCount: metric.cwsprChatActiveEditorImportCount,
                    cwsprChatRepsonseCode: metric.cwsprChatRepsonseCode,
                    cwsprChatRequestLength: metric.cwsprChatRequestLength,
                    cwsprChatConversationType: metric.cwsprChatConversationType,
                },
            },
            tabId
        )
    }

    #handleClientTelemetry(params: unknown) {
        if (isClientTelemetryEvent(params)) {
            switch (params.name) {
                case ChatUIEventName.AddMessage:
                    // we are trusting that the notification comes just right before the request
                    this.#currentTriggerByTabId[params.tabId] = params.triggerType
                    break
                case ChatUIEventName.TabAdd:
                    this.#tabTelemetryInfoByTabId[params.tabId] = {
                        ...this.#tabTelemetryInfoByTabId[params.tabId],
                        startTrigger: {
                            triggerType: params.triggerType,
                        },
                    }
                    break
                case ChatUIEventName.EnterFocusChat:
                    this.emitChatMetric({
                        name: ChatTelemetryEventName.EnterFocusChat,
                        data: {},
                    })
                    break
                case ChatUIEventName.ExitFocusChat:
                    this.emitChatMetric({
                        name: ChatTelemetryEventName.ExitFocusChat,
                        data: {},
                    })
                    break
                case ChatUIEventName.Vote:
                    this.emitConversationMetric({
                        name: ChatTelemetryEventName.InteractWithMessage,
                        data: {
                            cwsprChatMessageId: params.messageId,
                            cwsprChatInteractionType:
                                params.vote === RelevancyVoteType.UP
                                    ? ChatInteractionType.Upvote
                                    : ChatInteractionType.Downvote,
                        },
                    })
                    break
                case ChatUIEventName.InsertToCursorPosition:
                case ChatUIEventName.CopyToClipboard:
                    this.emitConversationMetric({
                        name: ChatTelemetryEventName.InteractWithMessage,
                        data: {
                            cwsprChatMessageId: params.messageId,
                            cwsprChatInteractionType:
                                params.name === ChatUIEventName.InsertToCursorPosition
                                    ? ChatInteractionType.InsertAtCursor
                                    : ChatInteractionType.CopySnippet,
                            cwsprChatAcceptedCharactersLength: params.code?.length ?? 0,
                            cwsprChatHasReference: Boolean(params.referenceTrackerInformation?.length),
                            cwsprChatCodeBlockIndex: params.codeBlockIndex,
                            cwsprChatTotalCodeBlocks: params.totalCodeBlocks,
                        },
                    })
                    break
                case ChatUIEventName.LinkClick:
                case ChatUIEventName.InfoLinkClick:
                    this.emitInteractWithMessageMetric(params.tabId, {
                        cwsprChatMessageId: params.messageId,
                        cwsprChatInteractionType: ChatInteractionType.ClickBodyLink,
                        cwsprChatInteractionTarget: params.link,
                    })
                    break
                case ChatUIEventName.SourceLinkClick:
                    this.emitInteractWithMessageMetric(params.tabId, {
                        cwsprChatMessageId: params.messageId,
                        cwsprChatInteractionType: ChatInteractionType.ClickLink,
                        cwsprChatInteractionTarget: params.link,
                    })
                    break
            }
        }
    }
}

export function convertToTelemetryUserIntent(userIntent?: UserIntent) {
    switch (userIntent) {
        case UserIntent.EXPLAIN_CODE_SELECTION:
            return 'explainCodeSelection'
        case UserIntent.SUGGEST_ALTERNATE_IMPLEMENTATION:
            return 'suggestAlternateImplementation'
        case UserIntent.APPLY_COMMON_BEST_PRACTICES:
            return 'applyCommonBestPractices'
        case UserIntent.IMPROVE_CODE:
            return 'improveCode'
        case UserIntent.CITE_SOURCES:
            return 'citeSources'
        case UserIntent.EXPLAIN_LINE_BY_LINE:
            return 'explainLineByLine'
        case UserIntent.SHOW_EXAMPLES:
            return 'showExamples'
        default:
            return ''
    }
}
