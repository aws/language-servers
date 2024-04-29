export const TAB_ID_RECEIVED = 'trigger-tabId-received'
export const SEND_TO_PROMPT = 'sendToPrompt'
export const AUTH_NEEDED_EXCEPTION = 'authNeededException'
export const ERROR_MESSAGE = 'errorMessage'

export type UiMessageCommand =
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

export type UiMessageParams = TabIdReceivedParams

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
