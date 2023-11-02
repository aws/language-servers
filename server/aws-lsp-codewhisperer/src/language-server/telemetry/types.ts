// Todo: finalize these types
export type CodewhispererTriggerType = 'OnDemand' | 'AutoTrigger'
export type CodewhispererAutomatedTriggerType =
    | 'Enter'
    | 'SpecialCharacters'
    | 'Classifier'
    | 'IntelliSenseAcceptance'
    | 'IdleTime'
    | 'KeyStrokeCount'
    | 'Unknown'
export type CodewhispererLanguage =
    | 'java'
    | 'python'
    | 'jsx'
    | 'javascript'
    | 'typescript'
    | 'tsx'
    | 'csharp'
    | 'c'
    | 'cpp'
    | 'cpp'
    | 'go'
    | 'kotlin'
    | 'php'
    | 'ruby'
    | 'rust'
    | 'scala'
    | 'shell'
    | 'shell'
    | 'sql'
    | 'plaintext'

export interface CodeWhispererServiceInvocationEvent {
    codewhispererRequestId?: string
    codewhispererSessionId?: string
    codewhispererLastSuggestionIndex: number
    codewhispererTriggerType: CodewhispererTriggerType
    codewhispererAutomatedTriggerType?: CodewhispererAutomatedTriggerType
    result: 'Succeeded' | 'Failed'
    duration?: number
    codewhispererLineNumber?: number
    codewhispererCursorOffset?: number
    codewhispererLanguage: string
    // TODO: Check if CodewhispererGettingStartedTask is necessary for LSP?
    codewhispererGettingStartedTask?: string
    reason?: string
    credentialStartUrl?: string
}
