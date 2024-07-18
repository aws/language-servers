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

export enum ChatTelemetryEventName {
    EnterFocusChat = 'amazonq_enterFocusChat',
    ExitFocusChat = 'amazonq_exitFocusChat',
    EnterFocusConversation = 'amazonq_enterFocusConversation',
    ExitFocusConversation = 'amazonq_exitFocusConversation',
    StartConversation = 'amazonq_startConversation',
    InteractWithMessage = 'amazonq_interactWithMessage',
    AddMessage = 'amazonq_addMessage',
    RunCommand = 'amazonq_runCommand',
    MessageResponseError = 'amazonq_messageResponseError',
    ModifyCode = 'amazonq_modifyCode',
}

export interface ChatTelemetryEventMap {
    [ChatTelemetryEventName.EnterFocusChat]: EnterFocusChatEvent
    [ChatTelemetryEventName.ExitFocusChat]: ExitFocusChatEvent
    [ChatTelemetryEventName.EnterFocusConversation]: EnterFocusConversationEvent
    [ChatTelemetryEventName.ExitFocusConversation]: ExitFocusConversationEvent
    [ChatTelemetryEventName.StartConversation]: StartConversationEvent
    [ChatTelemetryEventName.InteractWithMessage]: InteractWithMessageEvent
    [ChatTelemetryEventName.AddMessage]: AddMessageEvent
    [ChatTelemetryEventName.RunCommand]: RunCommandEvent
    [ChatTelemetryEventName.MessageResponseError]: MessageResponseErrorEvent
    [ChatTelemetryEventName.ModifyCode]: ModifyCodeEvent
}

export type ModifyCodeEvent = {
    cwsprChatConversationId: string
    cwsprChatMessageId: string
    cwsprChatModificationPercentage: number
}

export type AddMessageEvent = {
    credentialStartUrl?: string
    cwsprChatConversationId: string
    cwsprChatMessageId: string
    cwsprChatTriggerInteraction: string
    cwsprChatUserIntent?: string
    cwsprChatHasCodeSnippet: boolean
    cwsprChatProgrammingLanguage?: string
    cwsprChatActiveEditorTotalCharacters?: number
    cwsprChatActiveEditorImportCount?: number
    cwsprChatResponseCodeSnippetCount?: number
    cwsprChatResponseCode: number
    cwsprChatSourceLinkCount?: number
    cwsprChatReferencesCount?: number
    cwsprChatFollowUpCount?: number
    cwsprTimeToFirstChunk: number
    cwsprChatFullResponseLatency: number
    cwsprChatTimeBetweenChunks: number[]
    cwsprChatResponseType?: string
    cwsprChatRequestLength?: number
    cwsprChatResponseLength?: number
    cwsprChatConversationType: ChatConversationType
}

export type EnterFocusChatEvent = {
    credentialStartUrl?: string
}

export type ExitFocusChatEvent = {
    credentialStartUrl?: string
}

export type EnterFocusConversationEvent = {
    credentialStartUrl?: string
    cwsprChatConversationId: string
}

export type ExitFocusConversationEvent = {
    credentialStartUrl?: string
    cwsprChatConversationId: string
}

export enum ChatInteractionType {
    InsertAtCursor = 'insertAtCursor',
    CopySnippet = 'copySnippet',
    Copy = 'copy',
    ClickLink = 'clickLink',
    ClickFollowUp = 'clickFollowUp',
    HoverReference = 'hoverReference',
    Upvote = 'upvote',
    Downvote = 'downvote',
    ClickBodyLink = 'clickBodyLink',
}

export type ChatConversationType = 'Chat' | 'Assign' | 'Transform'

export type InteractWithMessageEvent = {
    credentialStartUrl?: string
    cwsprChatConversationId: string
    cwsprChatMessageId: string
    cwsprChatInteractionType: ChatInteractionType
    cwsprChatInteractionTarget?: string
    cwsprChatAcceptedCharactersLength?: number
    cwsprChatHasReference?: boolean
    cwsprChatCodeBlockIndex?: number
    cwsprChatTotalCodeBlocks?: number
}

export type StartConversationEvent = {
    credentialStartUrl?: string
    cwsprChatConversationId: string
    cwsprChatTriggerInteraction?: string
    cwsprChatUserIntent?: string
    cwsprChatHasCodeSnippet?: boolean
    cwsprChatProgrammingLanguage?: string
    cwsprChatConversationType: ChatConversationType
}

export type MessageResponseErrorEvent = {
    credentialStartUrl?: string
    cwsprChatConversationId: string
    cwsprChatTriggerInteraction: string
    cwsprChatUserIntent?: string
    cwsprChatHasCodeSnippet?: boolean
    cwsprChatProgrammingLanguage?: string
    cwsprChatActiveEditorTotalCharacters?: number
    cwsprChatActiveEditorImportCount?: number
    cwsprChatRepsonseCode: number
    cwsprChatRequestLength?: number
    cwsprChatConversationType: ChatConversationType
}

export type RunCommandEvent = {
    credentialStartUrl?: string
    cwsprChatCommandType: string
    cwsprChatCommandName?: string
}

export type CombinedConversationEvent = AddMessageEvent & StartConversationEvent & MessageResponseErrorEvent
