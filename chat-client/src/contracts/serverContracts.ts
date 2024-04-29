import { TabAddParams, TabChangeParams, TabRemoveParams } from '@aws/language-server-runtimes-types'

export const CHAT_PROMPT = 'aws/chat/sendChatPrompt'
export const NEW_TAB_CREATED = 'aws/chat/tabAdd'
export const TAB_REMOVED = 'aws/chat/tabChange'
export const TAB_CHANGED = 'aws/chat/tabRemove'
export const UI_IS_READY = 'aws/chat/ready'

export const TELEMETRY = 'telemetry/event'

export type ServerMessageCommand =
    | typeof CHAT_PROMPT
    | typeof NEW_TAB_CREATED
    | typeof TAB_REMOVED
    | typeof TAB_CHANGED
    | typeof UI_IS_READY
    | typeof TELEMETRY

export interface Message {
    command: ServerMessageCommand
}

export interface ServerMessage extends Message {
    params?: ServerMessageParams
}

export interface TelemetryParams {
    name: string
}

export type ServerMessageParams = TabAddParams | TabChangeParams | TabRemoveParams | TelemetryParams
