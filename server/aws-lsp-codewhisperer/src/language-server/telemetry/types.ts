import { CodewhispererLanguage } from '../languageDetection'
import { UserDecision } from '../session/sessionManager'

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
    codewhispererSuggestionState?: string
    codewhispererCompletionType?: string
    codewhispererLanguage: CodewhispererLanguage
    codewhispererTriggerType: string
    codewhispererAutomatedTriggerType?: string
    codewhispererTriggerCharacter?: string
    codewhispererLineNumber: number
    codewhispererCursorOffset: number
    codewhispererSuggestionCount: number
    codewhispererClassifierResult?: number
    codewhispererClassifierThreshold?: number
    codewhispererTotalShownTime: number
    codewhispererTypeaheadLength: number // TODO
    codewhispererTimeSinceLastDocumentChange?: number // TODO
    // Data about previous triggers may be not available if client results were not sent in order
    codewhispererTimeSinceLastUserDecision?: number
    codewhispererTimeToFirstRecommendation: number
    codewhispererPreviousSuggestionState?: string
}

export interface CodeWhispererCodePercentageEvent {
    codewhispererTotalTokens: number
    codewhispererLanguage: string
    codewhispererAcceptedTokens: number
    codewhispererPercentage: number
    successCount: number
}

export interface CodeWhispererUserDecisionEvent {
    codewhispererRequestId?: string
    codewhispererSessionId?: string
    codewhispererCompletionType?: CodewhispererCompletionType
    codewhispererTriggerType: string
    codewhispererLanguage: CodewhispererLanguage
    credentialStartUrl?: string
    codewhispererSuggestionIndex: number
    codewhispererSuggestionState?: UserDecision
    codewhispererSuggestionReferences?: string[]
    codewhispererSuggestionReferenceCount: number
}

export type Result = 'Succeeded' | 'Failed' | 'Cancelled'

export interface SecurityScanEvent {
    codewhispererCodeScanJobId?: string
    codewhispererLanguage: CodewhispererLanguage
    codewhispererCodeScanProjectBytes?: number
    codewhispererCodeScanSrcPayloadBytes: number
    codewhispererCodeScanBuildPayloadBytes?: number
    codewhispererCodeScanSrcZipFileBytes: number
    codewhispererCodeScanBuildZipFileBytes?: number
    codewhispererCodeScanLines: number
    duration: number
    contextTruncationDuration: number
    artifactsUploadDuration: number
    codeScanServiceInvocationsDuration: number
    result: Result
    reason?: string
    codewhispererCodeScanTotalIssues: number
    codewhispererCodeScanIssuesWithFixes: number
    credentialStartUrl: string | undefined
}
