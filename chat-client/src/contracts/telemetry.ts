export const ENTER_FOCUS = 'enterFocus'
export const EXIT_FOCUS = 'exitFocus'

export const ADD_MESSAGE_TELEMETRY_EVENT = `addMessage`
export const INSERT_TO_CURSOR_POSITION_TELEMETRY_EVENT = `insertToCursorPosition`
export const SEND_TO_PROMPT_TELEMETRY_EVENT = 'sendToPrompt'
export const TAB_ADD_TELEMETRY_EVENT = 'tabAdd'
export const COPY_TO_CLIPBOARD_TELEMETRY_EVENT = 'copyToClipboard'
export const VOTE_TELEMETRY_EVENT = 'vote'
export const ERROR_MESSAGE_TELEMETRY_EVENT = 'errorMessage'
export const LINK_CLICK_TELEMETRY_EVENT = 'linkClick'
export const INFO_LINK_CLICK_TELEMETRY_EVENT = 'infoLinkClick'
export const SOURCE_LINK_CLICK_TELEMETRY_EVENT = 'sourceLinkClick'
export const AUTH_FOLLOW_UP_CLICKED_TELEMETRY_EVENT = 'authFollowupClicked'
export const HISTORY_BUTTON_CLICK_TELEMETRY_EVENT = 'historyButtonClick'

export enum RelevancyVoteType {
    UP = 'upvote',
    DOWN = 'downvote',
}

export interface VoteParams {
    tabId: string
    messageId: string
    vote: RelevancyVoteType
    eventId?: string
}
