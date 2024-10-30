import { MetricEvent } from '@aws/language-server-runtimes/server-interface/telemetry'
import { TriggerType } from '@aws/chat-client-ui-types'
import {
    ChatInteractionType,
    ChatTelemetryEventMap,
    ChatTelemetryEventName,
    CombinedConversationEvent,
    InteractWithMessageEvent,
    ModifyCodeEvent,
} from '../../telemetry/types'
import { Features, KeysMatching } from '../../types'
import {
    ChatUIEventName,
    InsertToCursorPositionParams,
    RelevancyVoteType,
    isClientTelemetryEvent,
} from './clientTelemetry'
import { UserIntent } from '@amzn/codewhisperer-streaming'
import { TriggerContext } from '../contexts/triggerContext'
import { AcceptedSuggestionEntry, CodeDiffTracker } from '../../telemetry/codeDiffTracker'
import { TelemetryService } from '../../telemetryService'

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
    messageId: string
}

export class ChatTelemetryController {
    #activeTabId?: string
    #tabTelemetryInfoByTabId: { [tabId: string]: ConversationTriggerInfo }
    #currentTriggerByTabId: { [tabId: string]: TriggerType } = {}
    #customizationInfoByTabAndMessageId: { [tabId: string]: { [messageId: string]: string } }
    #credentialsProvider: Features['credentialsProvider']
    #telemetry: Features['telemetry']
    #codeDiffTracker: CodeDiffTracker<AcceptedSuggestionChatEntry>
    #telemetryService: TelemetryService

    constructor(features: Features, telemetryService: TelemetryService) {
        this.#tabTelemetryInfoByTabId = {}
        this.#currentTriggerByTabId = {}
        this.#customizationInfoByTabAndMessageId = {}
        this.#telemetry = features.telemetry
        this.#credentialsProvider = features.credentialsProvider
        this.#telemetry.onClientTelemetry(params => this.#handleClientTelemetry(params))
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
        const data: Omit<ModifyCodeEvent, 'cwsprChatConversationId'> = {
            cwsprChatMessageId: entry.messageId,
            cwsprChatModificationPercentage: percentage,
            codewhispererCustomizationArn: entry.customizationArn,
        }

        this.emitConversationMetric({
            name: ChatTelemetryEventName.ModifyCode,
            data,
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
                    codewhispererCustomizationArn: metric.codewhispererCustomizationArn,
                    // not possible: cwsprChatResponseType: metric.cwsprChatResponseType,
                },
            },
            tabId
        )
        // Store the customization value associated with the message
        if (metric.cwsprChatMessageId && metric.codewhispererCustomizationArn) {
            this.#customizationInfoByTabAndMessageId[tabId] = {
                ...this.#customizationInfoByTabAndMessageId[tabId],
                [metric.cwsprChatMessageId]: metric.codewhispererCustomizationArn,
            }
        }
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
        this.#telemetryService.emitChatInteractWithMessage(metric, {
            conversationId: this.getConversationId(tabId),
        })
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

    public enqueueCodeDiffEntry(params: Omit<InsertToCursorPositionParams, 'name'>) {
        if (!params.code || !params.cursorPosition || !params.textDocument?.uri) {
            return
        }

        const startPosition = params.cursorPosition
        const insertedLines = params.code.split('\n')
        const numberOfInsertedLines = insertedLines.length

        // Calculate the new cursor position
        let endPosition
        if (numberOfInsertedLines === 1) {
            // If single line, add the length of the inserted code to the character
            endPosition = {
                line: startPosition.line,
                character: startPosition.character + params.code.length,
            }
        } else {
            // If multiple lines, set the cursor to the end of the last inserted line
            endPosition = {
                line: startPosition.line + numberOfInsertedLines - 1,
                character: insertedLines[numberOfInsertedLines - 1].length,
            }
        }

        this.#codeDiffTracker.enqueue({
            messageId: params.messageId,
            fileUrl: params.textDocument.uri,
            time: Date.now(),
            originalString: params.code,
            customizationArn: this.getCustomizationId(params.tabId, params.messageId),
            startPosition,
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
                    const voteData: Omit<InteractWithMessageEvent, 'cwsprChatConversationId'> = {
                        cwsprChatMessageId: params.messageId,
                        cwsprChatInteractionType:
                            params.vote === RelevancyVoteType.UP
                                ? ChatInteractionType.Upvote
                                : ChatInteractionType.Downvote,
                        codewhispererCustomizationArn: this.getCustomizationId(params.tabId, params.messageId),
                    }
                    this.#telemetryService.emitChatInteractWithMessage(voteData, {
                        conversationId: this.getConversationId(params.tabId),
                    })
                    this.emitConversationMetric({
                        name: ChatTelemetryEventName.InteractWithMessage,
                        data: voteData,
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
                    this.#telemetryService.emitChatInteractWithMessage(interactData, {
                        conversationId: this.getConversationId(params.tabId),
                        acceptedLineCount:
                            params.name === ChatUIEventName.InsertToCursorPosition
                                ? params.code?.split('\n').length
                                : undefined,
                    })
                    this.emitConversationMetric({
                        name: ChatTelemetryEventName.InteractWithMessage,
                        data: interactData,
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
                    this.emitInteractWithMessageMetric(params.tabId, clickBodyLinkData)
                    break
                case ChatUIEventName.SourceLinkClick:
                    const clickLinkData: Omit<InteractWithMessageEvent, 'cwsprChatConversationId'> = {
                        cwsprChatMessageId: params.messageId,
                        cwsprChatInteractionType: ChatInteractionType.ClickLink,
                        cwsprChatInteractionTarget: params.link,
                        codewhispererCustomizationArn: this.getCustomizationId(params.tabId, params.messageId),
                    }
                    this.emitInteractWithMessageMetric(params.tabId, clickLinkData)
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
