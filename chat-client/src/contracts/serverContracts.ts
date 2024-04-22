import { TabEventParams } from '@aws/language-server-runtimes/protocol'

export const CHAT_PROMPT = 'chat-prompt'
export const NEW_TAB_CREATED = 'new-tab-was-created'
export const TAB_REMOVED = 'tab-was-removed'
export const TAB_CHANGED = 'tab-was-changed'

export type ServerMessageCommand =
    | typeof CHAT_PROMPT
    | 'trigger-message-processed'
    | typeof NEW_TAB_CREATED
    | typeof TAB_REMOVED
    | typeof TAB_CHANGED
    | 'follow-up-was-clicked'
    | 'auth-follow-up-was-clicked'
    | 'open-diff'
    | 'code_was_copied_to_clipboard'
    | 'insert_code_at_cursor_position'
    | 'stop-response'
    | 'trigger-tabID-received'
    | 'clear'
    | 'help'
    | 'chat-item-voted'
    | 'chat-item-feedback'
    | 'link-was-clicked'
    | 'onboarding-page-interaction'
    | 'source-link-click'
    | 'response-body-link-click'
    | 'transform'
    | 'footer-info-link-click'
    | 'file-click'
    | 'form-action-click'

export interface Message {
    command: ServerMessageCommand
}

export interface ServerMessage extends Message {
    params?: ServerMessageParams
}

export type ServerMessageParams = TabEventParams
