import { CodeWhispererStreamingServiceException as __BaseException } from './CodeWhispererStreamingServiceException'
import { SENSITIVE_STRING } from '@smithy/smithy-client'
export const AccessDeniedExceptionReason = {
    UNAUTHORIZED_CUSTOMIZATION_RESOURCE_ACCESS: 'UNAUTHORIZED_CUSTOMIZATION_RESOURCE_ACCESS',
}
export class AccessDeniedException extends __BaseException {
    constructor(opts) {
        super({
            name: 'AccessDeniedException',
            $fault: 'client',
            ...opts,
        })
        this.name = 'AccessDeniedException'
        this.$fault = 'client'
        Object.setPrototypeOf(this, AccessDeniedException.prototype)
        this.reason = opts.reason
    }
}
export class InternalServerException extends __BaseException {
    constructor(opts) {
        super({
            name: 'InternalServerException',
            $fault: 'server',
            ...opts,
        })
        this.name = 'InternalServerException'
        this.$fault = 'server'
        this.$retryable = {}
        Object.setPrototypeOf(this, InternalServerException.prototype)
    }
}
export class ResourceNotFoundException extends __BaseException {
    constructor(opts) {
        super({
            name: 'ResourceNotFoundException',
            $fault: 'client',
            ...opts,
        })
        this.name = 'ResourceNotFoundException'
        this.$fault = 'client'
        Object.setPrototypeOf(this, ResourceNotFoundException.prototype)
    }
}
export class ThrottlingException extends __BaseException {
    constructor(opts) {
        super({
            name: 'ThrottlingException',
            $fault: 'client',
            ...opts,
        })
        this.name = 'ThrottlingException'
        this.$fault = 'client'
        this.$retryable = {
            throttling: true,
        }
        Object.setPrototypeOf(this, ThrottlingException.prototype)
    }
}
export const ValidationExceptionReason = {
    INVALID_CONVERSATION_ID: 'INVALID_CONVERSATION_ID',
}
export class ValidationException extends __BaseException {
    constructor(opts) {
        super({
            name: 'ValidationException',
            $fault: 'client',
            ...opts,
        })
        this.name = 'ValidationException'
        this.$fault = 'client'
        Object.setPrototypeOf(this, ValidationException.prototype)
        this.reason = opts.reason
    }
}
export const AssistantResponseEventFilterSensitiveLog = obj => ({
    ...obj,
    ...(obj.content && { content: SENSITIVE_STRING }),
})
export const UserIntent = {
    APPLY_COMMON_BEST_PRACTICES: 'APPLY_COMMON_BEST_PRACTICES',
    CITE_SOURCES: 'CITE_SOURCES',
    EXPLAIN_CODE_SELECTION: 'EXPLAIN_CODE_SELECTION',
    EXPLAIN_LINE_BY_LINE: 'EXPLAIN_LINE_BY_LINE',
    IMPROVE_CODE: 'IMPROVE_CODE',
    SHOW_EXAMPLES: 'SHOW_EXAMPLES',
    SUGGEST_ALTERNATE_IMPLEMENTATION: 'SUGGEST_ALTERNATE_IMPLEMENTATION',
}
export const FollowupPromptFilterSensitiveLog = obj => ({
    ...obj,
    ...(obj.content && { content: SENSITIVE_STRING }),
})
export const SupplementaryWebLinkFilterSensitiveLog = obj => ({
    ...obj,
    ...(obj.url && { url: SENSITIVE_STRING }),
    ...(obj.title && { title: SENSITIVE_STRING }),
    ...(obj.snippet && { snippet: SENSITIVE_STRING }),
})
export const AssistantResponseMessageFilterSensitiveLog = obj => ({
    ...obj,
    ...(obj.content && { content: SENSITIVE_STRING }),
    ...(obj.supplementaryWebLinks && {
        supplementaryWebLinks: obj.supplementaryWebLinks.map(item => SupplementaryWebLinkFilterSensitiveLog(item)),
    }),
    ...(obj.followupPrompt && { followupPrompt: FollowupPromptFilterSensitiveLog(obj.followupPrompt) }),
})
export class ConflictException extends __BaseException {
    constructor(opts) {
        super({
            name: 'ConflictException',
            $fault: 'client',
            ...opts,
        })
        this.name = 'ConflictException'
        this.$fault = 'client'
        Object.setPrototypeOf(this, ConflictException.prototype)
    }
}
export const ContentChecksumType = {
    SHA_256: 'SHA_256',
}
export const BinaryMetadataEventFilterSensitiveLog = obj => ({
    ...obj,
})
export const BinaryPayloadEventFilterSensitiveLog = obj => ({
    ...obj,
    ...(obj.bytes && { bytes: SENSITIVE_STRING }),
})
export const DiagnosticSeverity = {
    ERROR: 'ERROR',
    HINT: 'HINT',
    INFORMATION: 'INFORMATION',
    WARNING: 'WARNING',
}
export const RuntimeDiagnosticFilterSensitiveLog = obj => ({
    ...obj,
    ...(obj.source && { source: SENSITIVE_STRING }),
    ...(obj.message && { message: SENSITIVE_STRING }),
})
export const SymbolType = {
    DECLARATION: 'DECLARATION',
    USAGE: 'USAGE',
}
export const TextDocumentFilterSensitiveLog = obj => ({
    ...obj,
    ...(obj.relativeFilePath && { relativeFilePath: SENSITIVE_STRING }),
    ...(obj.text && { text: SENSITIVE_STRING }),
})
export const TextDocumentDiagnosticFilterSensitiveLog = obj => ({
    ...obj,
    ...(obj.document && { document: TextDocumentFilterSensitiveLog(obj.document) }),
    ...(obj.source && { source: SENSITIVE_STRING }),
    ...(obj.message && { message: SENSITIVE_STRING }),
})
export var Diagnostic
;(function (Diagnostic) {
    Diagnostic.visit = (value, visitor) => {
        if (value.textDocumentDiagnostic !== undefined)
            return visitor.textDocumentDiagnostic(value.textDocumentDiagnostic)
        if (value.runtimeDiagnostic !== undefined) return visitor.runtimeDiagnostic(value.runtimeDiagnostic)
        return visitor._(value.$unknown[0], value.$unknown[1])
    }
})(Diagnostic || (Diagnostic = {}))
export const DiagnosticFilterSensitiveLog = obj => {
    if (obj.textDocumentDiagnostic !== undefined)
        return { textDocumentDiagnostic: TextDocumentDiagnosticFilterSensitiveLog(obj.textDocumentDiagnostic) }
    if (obj.runtimeDiagnostic !== undefined)
        return { runtimeDiagnostic: RuntimeDiagnosticFilterSensitiveLog(obj.runtimeDiagnostic) }
    if (obj.$unknown !== undefined) return { [obj.$unknown[0]]: 'UNKNOWN' }
}
export var CursorState
;(function (CursorState) {
    CursorState.visit = (value, visitor) => {
        if (value.position !== undefined) return visitor.position(value.position)
        if (value.range !== undefined) return visitor.range(value.range)
        return visitor._(value.$unknown[0], value.$unknown[1])
    }
})(CursorState || (CursorState = {}))
export const EditorStateFilterSensitiveLog = obj => ({
    ...obj,
    ...(obj.document && { document: TextDocumentFilterSensitiveLog(obj.document) }),
    ...(obj.cursorState && { cursorState: obj.cursorState }),
})
export const UserInputMessageContextFilterSensitiveLog = obj => ({
    ...obj,
    ...(obj.editorState && { editorState: EditorStateFilterSensitiveLog(obj.editorState) }),
    ...(obj.diagnostic && { diagnostic: DiagnosticFilterSensitiveLog(obj.diagnostic) }),
})
export const UserInputMessageFilterSensitiveLog = obj => ({
    ...obj,
    ...(obj.content && { content: SENSITIVE_STRING }),
    ...(obj.userInputMessageContext && {
        userInputMessageContext: UserInputMessageContextFilterSensitiveLog(obj.userInputMessageContext),
    }),
})
export var ChatMessage
;(function (ChatMessage) {
    ChatMessage.visit = (value, visitor) => {
        if (value.userInputMessage !== undefined) return visitor.userInputMessage(value.userInputMessage)
        if (value.assistantResponseMessage !== undefined)
            return visitor.assistantResponseMessage(value.assistantResponseMessage)
        return visitor._(value.$unknown[0], value.$unknown[1])
    }
})(ChatMessage || (ChatMessage = {}))
export const ChatMessageFilterSensitiveLog = obj => {
    if (obj.userInputMessage !== undefined)
        return { userInputMessage: UserInputMessageFilterSensitiveLog(obj.userInputMessage) }
    if (obj.assistantResponseMessage !== undefined)
        return { assistantResponseMessage: AssistantResponseMessageFilterSensitiveLog(obj.assistantResponseMessage) }
    if (obj.$unknown !== undefined) return { [obj.$unknown[0]]: 'UNKNOWN' }
}
export const FollowupPromptEventFilterSensitiveLog = obj => ({
    ...obj,
    ...(obj.followupPrompt && { followupPrompt: FollowupPromptFilterSensitiveLog(obj.followupPrompt) }),
})
export const InvalidStateReason = {
    INVALID_TASK_ASSIST_PLAN: 'INVALID_TASK_ASSIST_PLAN',
}
export const SupplementaryWebLinksEventFilterSensitiveLog = obj => ({
    ...obj,
    ...(obj.supplementaryWebLinks && {
        supplementaryWebLinks: obj.supplementaryWebLinks.map(item => SupplementaryWebLinkFilterSensitiveLog(item)),
    }),
})
export var ChatResponseStream
;(function (ChatResponseStream) {
    ChatResponseStream.visit = (value, visitor) => {
        if (value.messageMetadataEvent !== undefined) return visitor.messageMetadataEvent(value.messageMetadataEvent)
        if (value.assistantResponseEvent !== undefined)
            return visitor.assistantResponseEvent(value.assistantResponseEvent)
        if (value.codeReferenceEvent !== undefined) return visitor.codeReferenceEvent(value.codeReferenceEvent)
        if (value.supplementaryWebLinksEvent !== undefined)
            return visitor.supplementaryWebLinksEvent(value.supplementaryWebLinksEvent)
        if (value.followupPromptEvent !== undefined) return visitor.followupPromptEvent(value.followupPromptEvent)
        if (value.invalidStateEvent !== undefined) return visitor.invalidStateEvent(value.invalidStateEvent)
        if (value.error !== undefined) return visitor.error(value.error)
        return visitor._(value.$unknown[0], value.$unknown[1])
    }
})(ChatResponseStream || (ChatResponseStream = {}))
export const ChatResponseStreamFilterSensitiveLog = obj => {
    if (obj.messageMetadataEvent !== undefined) return { messageMetadataEvent: obj.messageMetadataEvent }
    if (obj.assistantResponseEvent !== undefined)
        return { assistantResponseEvent: AssistantResponseEventFilterSensitiveLog(obj.assistantResponseEvent) }
    if (obj.codeReferenceEvent !== undefined) return { codeReferenceEvent: obj.codeReferenceEvent }
    if (obj.supplementaryWebLinksEvent !== undefined)
        return {
            supplementaryWebLinksEvent: SupplementaryWebLinksEventFilterSensitiveLog(obj.supplementaryWebLinksEvent),
        }
    if (obj.followupPromptEvent !== undefined)
        return { followupPromptEvent: FollowupPromptEventFilterSensitiveLog(obj.followupPromptEvent) }
    if (obj.invalidStateEvent !== undefined) return { invalidStateEvent: obj.invalidStateEvent }
    if (obj.error !== undefined) return { error: obj.error }
    if (obj.$unknown !== undefined) return { [obj.$unknown[0]]: 'UNKNOWN' }
}
export const ChatTriggerType = {
    DIAGNOSTIC: 'DIAGNOSTIC',
    MANUAL: 'MANUAL',
}
export const ContextTruncationScheme = {
    ANALYSIS: 'ANALYSIS',
    GUMBY: 'GUMBY',
}
export const ConversationStateFilterSensitiveLog = obj => ({
    ...obj,
    ...(obj.history && { history: obj.history.map(item => ChatMessageFilterSensitiveLog(item)) }),
    ...(obj.currentMessage && { currentMessage: ChatMessageFilterSensitiveLog(obj.currentMessage) }),
})
export const ExportIntent = {
    TASK_ASSIST: 'TASK_ASSIST',
    TRANSFORMATION: 'TRANSFORMATION',
}
export var ResultArchiveStream
;(function (ResultArchiveStream) {
    ResultArchiveStream.visit = (value, visitor) => {
        if (value.binaryMetadataEvent !== undefined) return visitor.binaryMetadataEvent(value.binaryMetadataEvent)
        if (value.binaryPayloadEvent !== undefined) return visitor.binaryPayloadEvent(value.binaryPayloadEvent)
        if (value.internalServerException !== undefined)
            return visitor.internalServerException(value.internalServerException)
        return visitor._(value.$unknown[0], value.$unknown[1])
    }
})(ResultArchiveStream || (ResultArchiveStream = {}))
export const ResultArchiveStreamFilterSensitiveLog = obj => {
    if (obj.binaryMetadataEvent !== undefined) return { binaryMetadataEvent: SENSITIVE_STRING }
    if (obj.binaryPayloadEvent !== undefined) return { binaryPayloadEvent: SENSITIVE_STRING }
    if (obj.internalServerException !== undefined) return { internalServerException: obj.internalServerException }
    if (obj.$unknown !== undefined) return { [obj.$unknown[0]]: 'UNKNOWN' }
}
export const GenerateAssistantResponseRequestFilterSensitiveLog = obj => ({
    ...obj,
    ...(obj.conversationState && { conversationState: ConversationStateFilterSensitiveLog(obj.conversationState) }),
})
export const GenerateAssistantResponseResponseFilterSensitiveLog = obj => ({
    ...obj,
    ...(obj.generateAssistantResponseResponse && { generateAssistantResponseResponse: 'STREAMING_CONTENT' }),
})
export const ExportResultArchiveResponseFilterSensitiveLog = obj => ({
    ...obj,
    ...(obj.body && { body: 'STREAMING_CONTENT' }),
})
export const GenerateTaskAssistPlanRequestFilterSensitiveLog = obj => ({
    ...obj,
    ...(obj.conversationState && { conversationState: ConversationStateFilterSensitiveLog(obj.conversationState) }),
})
export const GenerateTaskAssistPlanResponseFilterSensitiveLog = obj => ({
    ...obj,
    ...(obj.planningResponseStream && { planningResponseStream: 'STREAMING_CONTENT' }),
})
