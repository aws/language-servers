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
import {
    ChatUIEventName,
    InsertToCursorPositionParams,
    RelevancyVoteType,
    isClientTelemetryEvent,
} from './clientTelemetry'
import { UserIntent } from '@amzn/codewhisperer-streaming'
import { AcceptedSuggestionEntry, CodeDiffTracker } from '../../telemetry/codeDiffTracker'
import { TriggerContext } from '../contexts/triggerContextExtractor'

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

interface ConversationTriggerInfo {
    conversationId: string
    startTriggerType?: TriggerType
    lastMessageTrigger?: MessageTrigger
}

interface AcceptedSuggestionChatEntry extends AcceptedSuggestionEntry {
    messageId: string
}

export class ChatTelemetryController {
    #activeTabId?: string
    #tabTelemetryInfoByTabId: { [tabId: string]: ConversationTriggerInfo }
    #currentTriggerByTabId: { [tabId: string]: TriggerType } = {}
    #credentialsProvider: Features['credentialsProvider']
    #telemetry: Features['telemetry']
    #codeDiffTracker: CodeDiffTracker<AcceptedSuggestionChatEntry>

    constructor(features: Features) {
        this.#tabTelemetryInfoByTabId = {}
        this.#currentTriggerByTabId = {}
        this.#telemetry = features.telemetry
        this.#credentialsProvider = features.credentialsProvider
        this.#telemetry.onClientTelemetry(params => this.#handleClientTelemetry(params))
        this.#codeDiffTracker = new CodeDiffTracker(features.workspace, features.logging, (entry, percentage) =>
            this.emitModifyCodeMetric(entry, percentage)
        )
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

    public emitModifyCodeMetric(entry: AcceptedSuggestionChatEntry, percentage: number) {
        this.emitConversationMetric({
            name: ChatTelemetryEventName.ModifyCode,
            data: {
                cwsprChatMessageId: entry.messageId,
                cwsprChatModificationPercentage: percentage ? percentage : 0,
            },
        })
    }

    public emitChatMetric<TName extends ChatTelemetryEventName>(
        metric: ChatMetricEvent<TName, ChatTelemetryEventMap[TName]>
    ) {
        this.#telemetry.emitMetric({
            ...metric,
            data: {
                ...metric.data,
                credentialStartUrl: this.#credentialsProvider.getConnectionMetadata()?.sso?.startUrl,
            },
        })
    }

    public emitConversationMetric<
        TName extends ConversationMetricName,
        TEvent extends ChatMetricEvent<TName, ChatTelemetryEventMap[TName]>,
    >(
        metric: Omit<TEvent, 'data'> & {
            data: Omit<TEvent['data'], typeof CONVERSATION_ID_METRIC_KEY | 'credentialStartUrl'>
        },
        tabId = this.activeTabId
    ) {
        const conversationId = this.getConversationId(tabId)
        if (conversationId) {
            this.#telemetry.emitMetric({
                ...metric,
                data: {
                    ...metric.data,
                    credentialStartUrl: this.#credentialsProvider.getConnectionMetadata()?.sso?.startUrl,
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

    #enqueueCodeDiffEntry(params: InsertToCursorPositionParams) {
        const documentUri = params.textDocument?.uri
        const cursorRangeOrPosition = params.cursorState?.[0]

        if (params.code && documentUri && cursorRangeOrPosition) {
            const startPosition =
                'position' in cursorRangeOrPosition ? cursorRangeOrPosition.position : cursorRangeOrPosition.range.start
            const endPosition =
                'position' in cursorRangeOrPosition ? cursorRangeOrPosition.position : cursorRangeOrPosition.range.end

            this.#codeDiffTracker.enqueue({
                messageId: params.messageId,
                fileUrl: documentUri,
                time: Date.now(),
                originalString: params.code,
                startPosition,
                endPosition,
            })
        }
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
                        startTriggerType: params.triggerType,
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
                    if (params.name === ChatUIEventName.InsertToCursorPosition) {
                        this.#enqueueCodeDiffEntry(params)
                    }

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

    public dispose() {
        this.#codeDiffTracker.shutdown()
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
