import { CodeSelectionType, ReferenceTrackerInformation } from '@aws/language-server-runtimes-types'

export const ENTER_FOCUS = 'enterFocus'
export const EXIT_FOCUS = 'exitFocus'

export interface CopyCodeToClipboardParams {
    tabId: string
    messageId: string
    code?: string
    type?: CodeSelectionType
    referenceTrackerInformation?: ReferenceTrackerInformation[]
    eventId?: string
    codeBlockIndex?: number
    totalCodeBlocks?: number
}

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
