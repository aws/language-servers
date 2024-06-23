import { MetricEvent } from '@aws/language-server-runtimes/server-interface/telemetry'
import { TriggerType } from '@aws/chat-client-ui-types'
import {
    ChatInteractionType,
    ChatTelemetryEventMap,
    ChatTelemetryEventName,
    CombinedConversationEvent,
} from '../../telemetry/types'
import { Features, KeysMatching } from '../../types'
import { ChatUIEventName, RelevancyVoteType, isClientTelemetryEvent } from './clientTelemetry'

export const CONVERSATION_ID_METRIC_KEY = 'cwsprChatConversationId'

export interface ChatMetricEvent<
    TName extends ChatTelemetryEventName,
    TData extends ChatTelemetryEventMap[TName] = ChatTelemetryEventMap[TName],
> extends MetricEvent {
    name: TName
    data: TData
}

type ConversationMetricName = KeysMatching<ChatTelemetryEventMap, { [CONVERSATION_ID_METRIC_KEY]: string }>

interface TabTelemetryInfo {
    conversationId?: string
    messageTriggerType?: TriggerType
    startConversationTriggerType?: TriggerType
}

export class ChatTelemetryController {
    #activeTabId?: string
    #tabTelemetryInfoByTabId: { [tabId: string]: TabTelemetryInfo }
    #telemetry: Features['telemetry']

    constructor(telemetry: Features['telemetry']) {
        this.#tabTelemetryInfoByTabId = {}
        this.#telemetry = telemetry

        this.#telemetry.onClientTelemetry(params => this.#handleClientTelemetry(params))
    }

    public set activeTabId(tabId: string | undefined) {
        this.#activeTabId = tabId
    }

    public get activeTabId(): string | undefined {
        return this.#activeTabId
    }

    public getConversationId(tabId?: string) {
        return tabId && this.#tabTelemetryInfoByTabId[tabId]?.conversationId
    }

    public removeConversationId(tabId: string) {
        if (this.#tabTelemetryInfoByTabId[tabId]?.conversationId) {
            this.#tabTelemetryInfoByTabId[tabId].conversationId = undefined
        }
    }

    public setConversationId(tabId: string, conversationId: string) {
        this.#tabTelemetryInfoByTabId[tabId] = { ...this.#tabTelemetryInfoByTabId[tabId], conversationId }
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
                    // good
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

                    // confirm
                    cwsprChatTriggerInteraction: this.#tabTelemetryInfoByTabId[tabId]?.startConversationTriggerType,

                    // missing
                    cwsprChatActiveEditorTotalCharacters: metric.cwsprChatActiveEditorTotalCharacters,
                    cwsprChatActiveEditorImportCount: metric.cwsprChatActiveEditorImportCount,
                    cwsprChatHasCodeSnippet: metric.cwsprChatHasCodeSnippet,

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
                    cwsprChatUserIntent: metric.cwsprChatUserIntent,
                    cwsprChatProgrammingLanguage: metric.cwsprChatProgrammingLanguage,
                    cwsprChatConversationType: metric.cwsprChatConversationType,

                    // missing
                    cwsprChatHasCodeSnippet: metric.cwsprChatHasCodeSnippet,

                    // confirm
                    cwsprChatTriggerInteraction: this.#tabTelemetryInfoByTabId[tabId]?.messageTriggerType,
                },
            },
            tabId
        )
    }

    public emitMessageResponseError(tabId: string, metric: Partial<CombinedConversationEvent>) {
        this.emitConversationMetric(
            {
                name: ChatTelemetryEventName.MessageResponseError,
                data: {
                    cwsprChatTriggerInteraction: this.#tabTelemetryInfoByTabId[tabId]?.startConversationTriggerType,
                    cwsprChatUserIntent: metric.cwsprChatUserIntent,
                    cwsprChatHasCodeSnippet: metric.cwsprChatHasCodeSnippet,
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
                    this.#tabTelemetryInfoByTabId[params.tabId] = {
                        ...this.#tabTelemetryInfoByTabId[params.tabId],
                        messageTriggerType: params.triggerType,
                    }
                    break
                case ChatUIEventName.TabAdd:
                    this.#tabTelemetryInfoByTabId[params.tabId] = {
                        ...this.#tabTelemetryInfoByTabId[params.tabId],
                        startConversationTriggerType: params.triggerType,
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
                                    : ChatInteractionType.downvote,
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
                        },
                    })
                    break
                case ChatUIEventName.LinkClick:
                case ChatUIEventName.InfoLinkClick:
                case ChatUIEventName.SourceLinkClick:
                    this.emitConversationMetric({
                        name: ChatTelemetryEventName.InteractWithMessage,
                        data: {
                            cwsprChatMessageId: params.messageId,
                            cwsprChatInteractionType: ChatInteractionType.ClickLink,
                            cwsprChatInteractionTarget: params.link,
                        },
                    })
                    break
            }
        }
    }
}
