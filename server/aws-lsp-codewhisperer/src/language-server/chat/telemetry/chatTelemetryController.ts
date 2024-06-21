import { MetricEvent } from '@aws/language-server-runtimes/server-interface/telemetry'
import { ChatInteractionType, ChatTelemetryEventMap, ChatTelemetryEventName } from '../../telemetry/types'
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

export class ChatTelemetryController {
    #activeTabId?: string
    #conversationIdByTabId: { [tabId: string]: string }
    #telemetry: Features['telemetry']

    constructor(telemetry: Features['telemetry']) {
        this.#conversationIdByTabId = {}
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
        return tabId && this.#conversationIdByTabId[tabId]
    }

    public removeConversationId(tabId: string) {
        delete this.#conversationIdByTabId[tabId]
    }

    public setConversationId(tabId: string, conversationId: string) {
        this.#conversationIdByTabId[tabId] = conversationId
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
        }
    ) {
        const conversationId = this.getConversationId(this.activeTabId)
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

    #handleClientTelemetry(params: unknown) {
        if (isClientTelemetryEvent(params)) {
            switch (params.name) {
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
                case ChatUIEventName.LinkClick:
                case ChatUIEventName.InfoLinkClick:
                case ChatUIEventName.SourceLinkClick:
                    this.emitConversationMetric({
                        name: ChatTelemetryEventName.InteractWithMessage,
                        data: {
                            cwsprChatMessageId: params.messageId,
                            cwsprChatInteractionType: ChatInteractionType.ClickLink,
                        },
                    })
                    break
            }
        }
    }
}
