export interface ReferenceTrackerInformation {
    licenseName?: string
    repository?: string
    url?: string
    recommendationContentSpan?: {
        start: number
        end: number
    }
    information: string
}
export type CodeSelectionType = 'selection' | 'block'

export const TAB_ID_RECEIVED = 'triggerTabIdReceived'
export const SEND_TO_PROMPT = 'sendToPrompt'
export const AUTH_NEEDED_EXCEPTION = 'authNeededException'
export const ERROR_MESSAGE = 'errorMessage'
export const INSERT_TO_CURSOR_POSITION = 'insertToCursorPosition'

export type UiMessageCommand =
    | typeof TAB_ID_RECEIVED
    | typeof SEND_TO_PROMPT
    | typeof AUTH_NEEDED_EXCEPTION
    | typeof ERROR_MESSAGE
    | typeof INSERT_TO_CURSOR_POSITION

export interface Message {
    command: UiMessageCommand
}

export interface UiMessage extends Message {
    params?: UiMessageParams
}

export type UiMessageParams = TabIdReceivedParams | InsertToCursorPositionParams

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

export interface InsertToCursorPositionParams {
    tabId: string
    messageId: string
    code?: string
    type?: CodeSelectionType
    referenceTrackerInformation?: ReferenceTrackerInformation[]
    eventId?: string
    codeBlockIndex?: number
    totalCodeBlocks?: number
}

export interface InsertToCursorPositionMessage {
    command: typeof INSERT_TO_CURSOR_POSITION
    params: InsertToCursorPositionParams
}
