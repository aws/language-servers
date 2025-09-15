import type * as ServerInterface from '@aws/language-server-runtimes/server-interface'
import type * as ChatClientType from '@aws/chat-client-ui-types'
import { isObject } from '../../../shared/utils'

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
    HistoryButtonClick = 'historyButtonClick',
}

/* Chat client only telemetry - we should import these in the future */
export enum RelevancyVoteType {
    UP = 'upvote',
    DOWN = 'downvote',
}

export type VoteTelemetryParams = BaseClientTelemetryParams<ChatUIEventName.Vote> & {
    vote: RelevancyVoteType
    messageId: string
}

export type CopyCodeToClipboardParams = BaseClientTelemetryParams<ChatUIEventName.CopyToClipboard> & {
    messageId: string
    code?: string
    type?: ServerInterface.CodeSelectionType
    referenceTrackerInformation?: ServerInterface.ReferenceTrackerInformation[]
    codeBlockIndex?: number
    totalCodeBlocks?: number
}

/* end Chat client only telemetry */

export interface BaseClientTelemetryParams<TName extends ChatUIEventName> {
    name: TName
    tabId: string
    eventId?: string
}

export type TabAddParams = BaseClientTelemetryParams<ChatUIEventName.TabAdd> & {
    triggerType: ChatClientType.TriggerType
}

export type AddMessageParams = {
    triggerType: ChatClientType.TriggerType
    tabId: string
    name: ChatUIEventName.AddMessage
}

export type SendToPromptParams = ChatClientType.SendToPromptParams &
    BaseClientTelemetryParams<ChatUIEventName.SendToPrompt> & {
        messageId: string
    }

export type InfoLinkClickParams = ServerInterface.InfoLinkClickParams &
    BaseClientTelemetryParams<ChatUIEventName.InfoLinkClick> & {
        messageId: string
    }

export type LinkClickParams = ServerInterface.LinkClickParams &
    BaseClientTelemetryParams<ChatUIEventName.LinkClick> & {
        messageId: string
    }

export type SourceLinkClickParams = ServerInterface.SourceLinkClickParams &
    BaseClientTelemetryParams<ChatUIEventName.SourceLinkClick>

export type InsertToCursorPositionParams = ServerInterface.InsertToCursorPositionParams &
    BaseClientTelemetryParams<ChatUIEventName.InsertToCursorPosition> & {
        cursorState?: ServerInterface.CursorState[]
    }

export type HistoryButtonClickParams = { name: ChatUIEventName.HistoryButtonClick }

export type ClientTelemetryEvent =
    | BaseClientTelemetryParams<ChatUIEventName.EnterFocusChat>
    | BaseClientTelemetryParams<ChatUIEventName.ExitFocusChat>
    | TabAddParams
    | AddMessageParams
    | SendToPromptParams
    | VoteTelemetryParams
    | CopyCodeToClipboardParams
    | InfoLinkClickParams
    | LinkClickParams
    | SourceLinkClickParams
    | InsertToCursorPositionParams
    | HistoryButtonClickParams

const chatUIEventNameSet = new Set<string>(Object.values(ChatUIEventName))

export function isClientTelemetryEvent(event: unknown): event is ClientTelemetryEvent {
    return isObject(event) && typeof event.name === 'string' && chatUIEventNameSet.has(event.name)
}
