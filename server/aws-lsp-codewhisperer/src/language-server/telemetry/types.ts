import { CodewhispererLanguage } from '../languageDetection'

export interface CodeWhispererServiceInvocationEvent {
    codewhispererRequestId?: string
    codewhispererSessionId?: string
    codewhispererLastSuggestionIndex: number
    codewhispererTriggerType: string
    codewhispererAutomatedTriggerType?: string
    result: 'Succeeded' | 'Failed'
    duration?: number
    codewhispererLineNumber?: number
    codewhispererCursorOffset?: number
    codewhispererLanguage: CodewhispererLanguage
    // TODO: Check if CodewhispererGettingStartedTask is necessary for LSP?
    codewhispererGettingStartedTask?: string
    reason?: string
    // TODO: Clarify if this field is required and how to get it from the client
    credentialStartUrl?: string
}
