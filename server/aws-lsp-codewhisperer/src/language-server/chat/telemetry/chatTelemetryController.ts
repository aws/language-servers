import { MetricEvent, Telemetry } from '@aws/language-server-runtimes/server-interface/telemetry'
import { TriggerType } from '@aws/chat-client-ui-types'
import {
    AgenticChatInteractionType,
    ChatInteractionType,
    ChatTelemetryEventMap,
    ChatTelemetryEventName,
    CombinedConversationEvent,
    InteractWithMessageEvent,
} from '../../../shared/telemetry/types'
import { Features, KeysMatching } from '../../types'
import {
    ChatUIEventName,
    InsertToCursorPositionParams,
    RelevancyVoteType,
    isClientTelemetryEvent,
} from './clientTelemetry'
import { ToolUse, UserIntent } from '@aws/codewhisperer-streaming-client'
import { TriggerContext } from '../contexts/triggerContext'

import { CredentialsProvider, Logging } from '@aws/language-server-runtimes/server-interface'
import { AcceptedSuggestionEntry, CodeDiffTracker } from '../../inline-completion/codeDiffTracker'
import { TelemetryService } from '../../../shared/telemetry/telemetryService'
import { getEndPositionForAcceptedSuggestion, getTelemetryReasonDesc } from '../../../shared/utils'
import { CodewhispererLanguage } from '../../../shared/languageDetection'
import { AgenticChatEventStatus } from '../../../client/token/codewhispererbearertokenclient'

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

interface AcceptedSuggestionChatEntry extends AcceptedSuggestionEntry {
    conversationId: string
    messageId: string
}

export class ChatTelemetryController {
    #activeTabId?: string
    #tabTelemetryInfoByTabId: { [tabId: string]: ConversationTriggerInfo }
    #currentTriggerByTabId: { [tabId: string]: TriggerType } = {}
    #customizationInfoByTabAndMessageId: { [tabId: string]: { [messageId: string]: string } }
    #credentialsProvider: CredentialsProvider
    #telemetry: Telemetry
    #logging: Logging
    #codeDiffTracker: CodeDiffTracker<AcceptedSuggestionChatEntry>
    #telemetryService: TelemetryService

    constructor(features: Features, telemetryService: TelemetryService) {
        this.#tabTelemetryInfoByTabId = {}
        this.#currentTriggerByTabId = {}
        this.#customizationInfoByTabAndMessageId = {}
        this.#telemetry = features.telemetry
        this.#logging = features.logging
        this.#credentialsProvider = features.credentialsProvider
        this.#telemetry.onClientTelemetry(async params => await this.#handleClientTelemetry(params))
        this.#codeDiffTracker = new CodeDiffTracker(features.workspace, features.logging, (entry, percentage) =>
            this.emitModifyCodeMetric(entry, percentage)
        )
        this.#telemetryService = telemetryService
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

    public getCustomizationId(tabId: string, messageId: string) {
        return tabId && messageId && this.#customizationInfoByTabAndMessageId[tabId]?.[messageId]
    }

    public removeConversation(tabId: string) {
        delete this.#tabTelemetryInfoByTabId[tabId]
        delete this.#customizationInfoByTabAndMessageId[tabId]
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

    // Used for accessing codeDiffTracker in unit tests
    public get codeDiffTracker(): CodeDiffTracker<AcceptedSuggestionChatEntry> {
        return this.#codeDiffTracker
    }

    public emitModifyCodeMetric(entry: AcceptedSuggestionChatEntry, percentage: number) {
        return this.#telemetryService.emitChatUserModificationEvent({
            conversationId: entry.conversationId,
            messageId: entry.messageId,
            modificationPercentage: percentage,
            customizationArn: entry.customizationArn,
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
                result: 'Succeeded',
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
                    result: 'Succeeded',
                },
            })
        }
    }

    public emitAgencticLoop_InvokeLLM(
        requestId: string,
        conversationId: string,
        conversationType: string,
        toolNames: string[] | undefined,
        toolUseId: string[] | undefined,
        result: string,
        languageServerVersion: string,
        latency?: number[],
        agenticCodingMode?: boolean
    ) {
        this.#telemetry.emitMetric({
            name: ChatTelemetryEventName.AgencticLoop_InvokeLLM,
            data: {
                [CONVERSATION_ID_METRIC_KEY]: conversationId,
                cwsprChatConversationType: conversationType,
                credentialStartUrl: this.#credentialsProvider.getConnectionMetadata()?.sso?.startUrl,
                cwsprToolName: toolNames?.join(','),
                cwsprToolUseId: toolUseId?.join(','),
                result,
                languageServerVersion: languageServerVersion,
                latency: latency?.join(','),
                requestId,
                enabled: agenticCodingMode,
            },
        })
    }

    public emitToolUseSuggested(
        toolUse: ToolUse,
        conversationId: string,
        languageServerVersion: string,
        latency?: number,
        agenticCodingMode?: boolean
    ) {
        this.#telemetry.emitMetric({
            name: ChatTelemetryEventName.ToolUseSuggested,
            data: {
                [CONVERSATION_ID_METRIC_KEY]: conversationId,
                cwsprChatConversationType: 'AgenticChatWithToolUse',
                credentialStartUrl: this.#credentialsProvider.getConnectionMetadata()?.sso?.startUrl,
                cwsprToolName: toolUse.name ?? '',
                cwsprToolUseId: toolUse.toolUseId ?? '',
                perfE2ELatency: latency,
                result: 'Succeeded',
                languageServerVersion: languageServerVersion,
                enabled: agenticCodingMode,
            },
        })
    }

    public emitInteractWithAgenticChat(
        interactionType: AgenticChatInteractionType,
        tabId: string,
        agenticCodingMode?: boolean,
        conversationType?: string
    ) {
        this.#telemetry.emitMetric({
            name: ChatTelemetryEventName.InteractWithAgenticChat,
            data: {
                [CONVERSATION_ID_METRIC_KEY]: this.getConversationId(tabId) ?? '',
                cwsprChatConversationType: conversationType,
                credentialStartUrl: this.#credentialsProvider.getConnectionMetadata()?.sso?.startUrl,
                cwsprAgenticChatInteractionType: interactionType,
                result: 'Succeeded',
                enabled: agenticCodingMode,
            },
        })
    }

    public emitAddMessageMetric(tabId: string, metric: Partial<CombinedConversationEvent>, result?: string) {
        const conversationId = this.getConversationId(tabId)
        // Store the customization value associated with the message
        if (metric.cwsprChatMessageId && metric.codewhispererCustomizationArn) {
            this.#customizationInfoByTabAndMessageId[tabId] = {
                ...this.#customizationInfoByTabAndMessageId[tabId],
                [metric.cwsprChatMessageId]: metric.codewhispererCustomizationArn,
            }
        }
        return this.#telemetryService.emitChatAddMessage(
            {
                conversationId: conversationId,
                messageId: metric.cwsprChatMessageId,
                customizationArn: metric.codewhispererCustomizationArn,
                userIntent: metric.cwsprChatUserIntent,
                hasCodeSnippet: metric.cwsprChatHasCodeSnippet,
                programmingLanguage: metric.cwsprChatProgrammingLanguage as CodewhispererLanguage,
                activeEditorTotalCharacters: metric.cwsprChatActiveEditorTotalCharacters,
                timeToFirstChunkMilliseconds: metric.cwsprTimeToFirstChunk,
                timeBetweenChunks: metric.cwsprChatTimeBetweenChunks,
                fullResponselatency: metric.cwsprChatFullResponseLatency,
                requestLength: metric.cwsprChatRequestLength,
                responseLength: metric.cwsprChatResponseLength,
                numberOfCodeBlocks: metric.cwsprChatResponseCodeSnippetCount,
                agenticCodingMode: metric.enabled,
                result: result,
            },
            {
                chatTriggerInteraction: metric.cwsprChatTriggerInteraction,
                chatResponseCode: metric.cwsprChatResponseCode,
                chatSourceLinkCount: metric.cwsprChatSourceLinkCount,
                chatReferencesCount: metric.cwsprChatReferencesCount,
                chatFollowUpCount: metric.cwsprChatFollowUpCount,
                chatConversationType: metric.cwsprChatConversationType,
                chatActiveEditorImportCount: metric.cwsprChatActiveEditorImportCount,
                cwsprChatHasContextList: metric.cwsprChatHasContextList,
                cwsprChatFolderContextCount: metric.cwsprChatFolderContextCount,
                cwsprChatFileContextCount: metric.cwsprChatFileContextCount,
                cwsprChatRuleContextCount: metric.cwsprChatRuleContextCount,
                cwsprChatPromptContextCount: metric.cwsprChatPromptContextCount,
                cwsprChatFileContextLength: metric.cwsprChatFileContextLength,
                cwsprChatRuleContextLength: metric.cwsprChatRuleContextLength,
                cwsprChatPromptContextLength: metric.cwsprChatPromptContextLength,
                cwsprChatCodeContextLength: metric.cwsprChatCodeContextLength,
                cwsprChatCodeContextCount: metric.cwsprChatCodeContextCount,
                cwsprChatFocusFileContextLength: metric.cwsprChatFocusFileContextLength,
                languageServerVersion: metric.languageServerVersion,
                requestIds: metric.requestIds,
            }
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
        return this.#telemetryService.emitChatInteractWithMessage(metric, {
            conversationId: this.getConversationId(tabId),
        })
    }

    public emitMessageResponseError(
        tabId: string,
        metric: Partial<CombinedConversationEvent>,
        requestId?: string,
        errorReason?: string,
        agenticCodingMode?: boolean
    ) {
        this.#telemetry.emitMetric({
            name: ChatTelemetryEventName.MessageResponseError,
            data: {
                cwsprChatHasCodeSnippet: metric.cwsprChatHasCodeSnippet,
                cwsprChatTriggerInteraction: metric.cwsprChatTriggerInteraction,
                cwsprChatUserIntent: metric.cwsprChatUserIntent,
                cwsprChatProgrammingLanguage: metric.cwsprChatProgrammingLanguage,
                cwsprChatActiveEditorTotalCharacters: metric.cwsprChatActiveEditorTotalCharacters,
                cwsprChatActiveEditorImportCount: metric.cwsprChatActiveEditorImportCount,
                cwsprChatResponseCode: metric.cwsprChatResponseCode,
                cwsprChatRequestLength: metric.cwsprChatRequestLength,
                cwsprChatConversationType: metric.cwsprChatConversationType,
                requestId: requestId,
                reasonDesc: getTelemetryReasonDesc(errorReason),
                credentialStartUrl: this.#credentialsProvider.getConnectionMetadata()?.sso?.startUrl,
                result: 'Succeeded',
                enabled: agenticCodingMode,
                [CONVERSATION_ID_METRIC_KEY]: this.getConversationId(tabId),
                languageServerVersion: metric.languageServerVersion,
            },
        })
    }

    public enqueueCodeDiffEntry(params: Omit<InsertToCursorPositionParams, 'name'>) {
        if (!params.code || !params.cursorPosition || !params.textDocument?.uri) {
            return
        }

        // Calculate the new cursor position
        const endPosition = getEndPositionForAcceptedSuggestion(params.code, params.cursorPosition)

        this.#codeDiffTracker.enqueue({
            conversationId: this.getConversationId(params.tabId) || '',
            messageId: params.messageId,
            fileUrl: params.textDocument.uri,
            time: Date.now(),
            originalString: params.code,
            customizationArn: this.getCustomizationId(params.tabId, params.messageId),
            startPosition: params.cursorPosition,
            endPosition,
        })
    }

    // Current clients don't send the inserToCursorPosition event to server as a chat request but the information comes as a telemetry notification
    // Therefore currently modifyCode telemetry is calculated in the chatTelemetryController
    // Once clients start sending the inserToCursorPosition chat event and stops sending the telemetry event, we can remove this private function and its invocation
    #enqueueCodeDiffEntry(params: InsertToCursorPositionParams) {
        const documentUri = params.textDocument?.uri
        const cursorRangeOrPosition = params.cursorState?.[0]

        if (params.code && documentUri && cursorRangeOrPosition) {
            const startPosition =
                'position' in cursorRangeOrPosition ? cursorRangeOrPosition.position : cursorRangeOrPosition.range.start
            const endPosition =
                'position' in cursorRangeOrPosition ? cursorRangeOrPosition.position : cursorRangeOrPosition.range.end

            this.#codeDiffTracker.enqueue({
                conversationId: this.getConversationId(params.tabId) || '',
                messageId: params.messageId,
                fileUrl: documentUri,
                time: Date.now(),
                originalString: params.code,
                customizationArn: this.getCustomizationId(params.tabId, params.messageId),
                startPosition,
                endPosition,
            })
        }
    }

    async #handleClientTelemetry(params: unknown) {
        try {
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
                        const voteData: Omit<InteractWithMessageEvent, 'cwsprChatConversationId'> = {
                            cwsprChatMessageId: params.messageId,
                            cwsprChatInteractionType:
                                params.vote === RelevancyVoteType.UP
                                    ? ChatInteractionType.Upvote
                                    : ChatInteractionType.Downvote,
                            codewhispererCustomizationArn: this.getCustomizationId(params.tabId, params.messageId),
                        }
                        await this.#telemetryService.emitChatInteractWithMessage(voteData, {
                            conversationId: this.getConversationId(params.tabId),
                        })
                        break
                    case ChatUIEventName.InsertToCursorPosition:
                    case ChatUIEventName.CopyToClipboard:
                        if (params.name === ChatUIEventName.InsertToCursorPosition) {
                            this.#enqueueCodeDiffEntry(params)
                        }

                        const interactData: Omit<InteractWithMessageEvent, 'cwsprChatConversationId'> = {
                            cwsprChatMessageId: params.messageId,
                            cwsprChatInteractionType:
                                params.name === ChatUIEventName.InsertToCursorPosition
                                    ? ChatInteractionType.InsertAtCursor
                                    : ChatInteractionType.CopySnippet,
                            cwsprChatAcceptedCharactersLength: params.code?.length ?? 0,
                            cwsprChatHasReference: Boolean(params.referenceTrackerInformation?.length),
                            cwsprChatCodeBlockIndex: params.codeBlockIndex,
                            cwsprChatTotalCodeBlocks: params.totalCodeBlocks,
                            codewhispererCustomizationArn: this.getCustomizationId(params.tabId, params.messageId),
                        }
                        await this.#telemetryService.emitChatInteractWithMessage(interactData, {
                            conversationId: this.getConversationId(params.tabId),
                            acceptedLineCount:
                                params.name === ChatUIEventName.InsertToCursorPosition
                                    ? params.code?.split('\n').length
                                    : undefined,
                        })
                        break
                    case ChatUIEventName.LinkClick:
                    case ChatUIEventName.InfoLinkClick:
                        const clickBodyLinkData: Omit<InteractWithMessageEvent, 'cwsprChatConversationId'> = {
                            cwsprChatMessageId: params.messageId,
                            cwsprChatInteractionType: ChatInteractionType.ClickBodyLink,
                            cwsprChatInteractionTarget: params.link,
                            codewhispererCustomizationArn: this.getCustomizationId(params.tabId, params.messageId),
                        }
                        await this.emitInteractWithMessageMetric(params.tabId, clickBodyLinkData)
                        break
                    case ChatUIEventName.SourceLinkClick:
                        const clickLinkData: Omit<InteractWithMessageEvent, 'cwsprChatConversationId'> = {
                            cwsprChatMessageId: params.messageId,
                            cwsprChatInteractionType: ChatInteractionType.ClickLink,
                            cwsprChatInteractionTarget: params.link,
                            codewhispererCustomizationArn: this.getCustomizationId(params.tabId, params.messageId),
                        }
                        await this.emitInteractWithMessageMetric(params.tabId, clickLinkData)
                        break
                    case ChatUIEventName.HistoryButtonClick:
                        this.#telemetryService.emitUiClick({ elementId: 'amazonq_historyTabButton' })
                        break
                }
            }
        } catch (err) {
            this.#logging.log(`Exception Thrown from ChatTelemetryController: ${err}`)
        }
    }

    public dispose() {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
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
