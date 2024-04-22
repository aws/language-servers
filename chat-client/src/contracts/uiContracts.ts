export const UI_IS_READY = 'ui-is-ready'
export const UI_FOCUS = 'ui-focus'
export const TAB_ID_RECEIVED = 'trigger-tabId-received'
export const SEND_TO_PROMPT = 'send-to-prompt'
export const AUTH_NEEDED_EXCEPTION = 'auth-needed-exception'
export const ERROR_MESSAGE = 'error-message'

export type UiMessageCommand =
    | typeof UI_IS_READY
    | typeof UI_FOCUS
    | typeof TAB_ID_RECEIVED
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

export interface SendToPromptMessage {
    command: typeof SEND_TO_PROMPT
    params: SendToPromptParams
}
