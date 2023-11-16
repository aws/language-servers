import { CodewhispererLanguage } from '../languageDetection'

export type CodewhispererCompletionType = 'Block' | 'Line'

export interface CodeWhispererServiceInvocationEvent {
    codewhispererRequestId?: string
    codewhispererSessionId?: string
    codewhispererLastSuggestionIndex?: number
    codewhispererCompletionType?: CodewhispererCompletionType
    codewhispererTriggerType: string
    codewhispererAutomatedTriggerType?: string
    duration?: number
    codewhispererLineNumber?: number
    codewhispererCursorOffset?: number
    codewhispererLanguage: CodewhispererLanguage
    // TODO: Check if CodewhispererGettingStartedTask is necessary for LSP?
    codewhispererGettingStartedTask?: string
    reason?: string
    credentialStartUrl?: string
}

export interface CodeWhispererPerceivedLatencyEvent {
    codewhispererRequestId?: string
    codewhispererSessionId?: string
    codewhispererCompletionType?: CodewhispererCompletionType
    codewhispererTriggerType: string
    duration?: number
    codewhispererLanguage: CodewhispererLanguage
    credentialStartUrl?: string
}

export interface CodeWhispererUserTriggerDecisionEvent {
    codewhispererSessionId: string
    codewhispererFirstRequestId: string
    credentialStartUrl?: string
    codewhispererSuggestionState: string
    codewhispererCompletionType: string
    codewhispererLanguage: CodewhispererLanguage
    codewhispererTriggerType: string
    codewhispererAutomatedTriggerType?: string
    codewhispererLineNumber: number
    codewhispererCursorOffset: number
    codewhispererSuggestionCount: number
    codewhispererClassifierResult?: number
    codewhispererClassifierThreshold?: number
    codewhispererTotalShownTime: number
    codewhispererTriggerCharacter?: string
    codewhispererTypeaheadLength: number
    codewhispererTimeSinceLastDocumentChange: number
    // Data about previous triggers may be not available if client results were not sent in order
    codewhispererTimeSinceLastUserDecision: number
    codewhispererTimeToFirstRecommendation: number
    codewhispererPreviousSuggestionState?: string
}
