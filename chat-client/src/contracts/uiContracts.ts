export const UI_IS_READY = 'ui-is-ready'
export const UI_FOCUS = 'ui-focus'
export const TAB_ID_RECEIVED = 'trigger-tabId-received'
export const SEND_TO_PROMPT = 'send-to-prompt'
export const AUTH_NEEDED_EXCEPTION = 'auth-needed-exception'
export const ERROR_MESSAGE = 'error-message'

export type UiMessageCommand =
    | typeof UI_IS_READY
    | typeof UI_FOCUS // TODO: Move to server
    | typeof TAB_ID_RECEIVED // TODO: Move to server
    | typeof SEND_TO_PROMPT
    | typeof AUTH_NEEDED_EXCEPTION
    | typeof ERROR_MESSAGE

export interface Message {
    command: UiMessageCommand
}

export interface UiMessage extends Message {
    params?: UiMessageParams
}

export type UiMessageParams = FocusParams | TabIdReceivedParams

// TODO: This needs to be event to server as well, as it records metrics
export interface FocusParams {
    type: string
}

export interface FocusMessage {
    command: typeof UI_FOCUS
    params: FocusParams
}

export interface TabIdReceivedParams {
    triggerId: string
    tabId: string
}

export interface TabIdReceivedMessage {
    command: typeof TAB_ID_RECEIVED
    params: TabIdReceivedParams
}

export interface SendToPromptParams {
    prompt: string
    triggerId: string
}

// TODO: Use generics?
export interface SendToPromptMessage {
    command: typeof SEND_TO_PROMPT
    params: SendToPromptParams
}
