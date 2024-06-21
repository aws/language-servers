import { MetricEvent } from '@aws/language-server-runtimes/server-interface'

import { GenerateAssistantResponseCommandInput } from '@amzn/codewhisperer-streaming'
import {
    ChatConversationType,
    ChatInteractionType,
    ChatTelemetryEventMap,
    ChatTelemetryEventName,
} from '../telemetry/types'
import { Features, KeysMatching } from '../types'
import { isObject } from '../utils'

export const CONVERSATION_ID_METRIC_KEY = 'cwsprChatConversationId'

export enum ChatUIEventName {
    EnterFocusChat = 'enterFocus',
    ExitFocusChat = 'exitFocus',
    AddMessage = 'addMessage',
    SendToPrompt = 'sendToPrompt',
    TabAdd = 'tabAdd',
    CopyToClipboard = 'copyToClipboard',
    InsertToCursorPosition = 'insertToCursorPosition',
    Vote = 'vote',
    LinkClick = 'linkClick',
    InfoLinkClick = 'infoLinkClick',
    SourceLinkClick = 'sourceLinkClick',
}

enum RelevancyVoteType {
    UP = 'upvote',
    DOWN = 'downvote',
}

export interface BaseClientTelemetryParams<TName extends ChatUIEventName> {
    name: TName
    tabId: string
    eventId?: string
}

export interface VoteTelemetryParams extends BaseClientTelemetryParams<ChatUIEventName.Vote> {
    vote: RelevancyVoteType
    messageId: string
}

export interface LinkClickParams<
    TName extends ChatUIEventName.LinkClick | ChatUIEventName.InfoLinkClick | ChatUIEventName.SourceLinkClick =
        | ChatUIEventName.LinkClick
        | ChatUIEventName.InfoLinkClick
        | ChatUIEventName.SourceLinkClick,
> extends BaseClientTelemetryParams<TName> {
    messageId: string
}

export type ClientTelemetryEvent =
    | VoteTelemetryParams
    | BaseClientTelemetryParams<ChatUIEventName.EnterFocusChat>
    | BaseClientTelemetryParams<ChatUIEventName.ExitFocusChat>
    | BaseClientTelemetryParams<ChatUIEventName.TabAdd>
    | LinkClickParams

function isClientTelemetryEvent(event: unknown): event is ClientTelemetryEvent {
    return (
        isObject(event) &&
        typeof event.name === 'string' &&
        // unnecessary, also create a map
        Object.values(ChatUIEventName).includes(event.name as ChatUIEventName)
    )
}
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

    public emitStartConversationMetric(
        input: GenerateAssistantResponseCommandInput,
        conversationType: ChatConversationType
    ) {
        const maybeConversationState = input.conversationState
        const maybeUserInputMessage = maybeConversationState?.currentMessage?.userInputMessage
        const maybeDocument = maybeUserInputMessage?.userInputMessageContext?.editorState?.document

        this.emitConversationMetric({
            name: ChatTelemetryEventName.StartConversation,
            data: {
                cwsprChatTriggerInteraction: maybeConversationState?.chatTriggerType,
                cwsprChatUserIntent: maybeUserInputMessage?.userIntent,
                cwsprChatHasCodeSnippet: Boolean(maybeDocument?.text),
                cwsprChatProgrammingLanguage: maybeDocument?.programmingLanguage,
                cwsprChatConversationType: conversationType,
            },
        })
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
