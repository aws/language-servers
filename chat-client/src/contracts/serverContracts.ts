import {
    ChatParams,
    FeedbackParams,
    FollowUpClickParams,
    InfoLinkClickParams,
    InsertToCursorPositionParams,
    LinkClickParams,
    SourceLinkClickParams,
    TabAddParams,
    TabChangeParams,
    TabRemoveParams,
} from '@aws/language-server-runtimes-types'

export const CHAT_PROMPT = 'aws/chat/sendChatPrompt'
export const NEW_TAB_CREATED = 'aws/chat/tabAdd'
export const TAB_CHANGED = 'aws/chat/tabChange'
export const TAB_REMOVED = 'aws/chat/tabRemove'
export const UI_IS_READY = 'aws/chat/ready'
export const FOLLOW_UP_CLICKED = 'aws/chat/followUpClick'
export const FEEDBACK = 'aws/chat/feedback'
export const LINK_CLICK = 'aws/chat/linkClick'
export const SOURCE_LINK_CLICK = 'aws/chat/sourceLinkClick'
export const INFO_LINK_CLICK = 'aws/chat/infoLinkClick'
export const INSERT_TO_CURSOR_POSITION = 'aws/chat/insertToCursorPosition'
export const TELEMETRY = 'telemetry/event'

export type ServerMessageCommand =
    | typeof CHAT_PROMPT
    | typeof NEW_TAB_CREATED
    | typeof TAB_REMOVED
    | typeof TAB_CHANGED
    | typeof UI_IS_READY
    | typeof TELEMETRY
    | typeof FOLLOW_UP_CLICKED
    | typeof FEEDBACK
    | typeof LINK_CLICK
    | typeof SOURCE_LINK_CLICK
    | typeof INFO_LINK_CLICK
    | typeof INSERT_TO_CURSOR_POSITION

export interface Message {
    command: ServerMessageCommand
}

export interface ServerMessage extends Message {
    params?: ServerMessageParams
}

export type TelemetryParams = any

export type ServerMessageParams =
    | TabAddParams
    | TabChangeParams
    | TabRemoveParams
    | TelemetryParams
    | ChatParams
    | FeedbackParams
    | LinkClickParams
    | InfoLinkClickParams
    | SourceLinkClickParams
    | FollowUpClickParams
    | InsertToCursorPositionParams
