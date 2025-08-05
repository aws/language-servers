import { InitializeParams, LogInlineCompletionSessionResultsParams } from '@aws/language-server-runtimes/protocol'
import { CodeWhispererSession, SessionManager } from './session/sessionManager'
import { Logging, Lsp, Telemetry } from '@aws/language-server-runtimes/server-interface'
import { CodePercentageTracker } from './codePercentage'
import { AcceptedInlineSuggestionEntry, CodeDiffTracker } from './codeDiffTracker'
import { RejectedEditTracker } from './tracker/rejectedEditTracker'
import { TelemetryService } from '../../shared/telemetry/telemetryService'
import { DocumentChangedListener } from './documentChangedListener'
import { AmazonQWorkspaceConfig } from '../../shared/amazonQServiceManager/configurationUtils'
import { Suggestion, SuggestionType } from '../../shared/codeWhispererService'
import { UserWrittenCodeTracker } from '../../shared/userWrittenCodeTracker'
import { getAddedAndDeletedChars } from './diffUtils'
import { emitPerceivedLatencyTelemetry, emitUserTriggerDecisionTelemetry } from './telemetry'
import { getEndPositionForAcceptedSuggestion, getCompletionType } from '../../shared/utils'

export class LogInlineCompletionSessionResultsHandler {
    readonly editsEnabled: boolean

    constructor(
        readonly logging: Logging,
        readonly lsp: Lsp,
        readonly sessionManager: SessionManager,
        readonly codePercentageTracker: CodePercentageTracker,
        readonly codeDiffTracker: CodeDiffTracker<AcceptedInlineSuggestionEntry>,
        readonly rejectedEditTracker: RejectedEditTracker,
        readonly documentChangedListener: DocumentChangedListener,
        readonly telemetry: Telemetry,
        readonly telemetryService: TelemetryService
    ) {
        this.editsEnabled =
            this.lsp.getClientInitializeParams()?.initializationOptions?.aws?.awsClientCapabilities?.textDocument
                ?.inlineCompletionWithReferences?.inlineEditSupport ?? false
    }
    async onLogInlineCompletionSessionResultsHandler(params: LogInlineCompletionSessionResultsParams) {
        const {
            sessionId,
            completionSessionResult,
            firstCompletionDisplayLatency,
            totalSessionDisplayTime,
            typeaheadLength,
            isInlineEdit,
            addedDiagnostics,
            removedDiagnostics,
        } = params

        const session = this.sessionManager.getSessionById(sessionId)
        if (!session) {
            this.logging.log(`ERROR: Session ID ${sessionId} was not found`)
            return
        }

        if (session.state !== 'ACTIVE') {
            this.logging.log(`ERROR: Trying to record trigger decision for not-active session ${sessionId}`)
            return
        }

        const acceptedItemId = Object.keys(params.completionSessionResult).find(
            k => params.completionSessionResult[k].accepted
        )
        const isAccepted = acceptedItemId ? true : false
        const acceptedSuggestion = session.suggestions.find(s => s.itemId === acceptedItemId)
        let addedCharactersForEditSuggestion = ''
        let deletedCharactersForEditSuggestion = ''
        if (acceptedSuggestion !== undefined) {
            if (acceptedSuggestion) {
                this.codePercentageTracker.countSuccess(session.language)
                if (session.suggestionType === SuggestionType.EDIT && acceptedSuggestion.content) {
                    // [acceptedSuggestion.insertText] will be undefined for NEP suggestion. Use [acceptedSuggestion.content] instead.
                    // Since [acceptedSuggestion.content] is in the form of a diff, transform the content into addedCharacters and deletedCharacters.
                    const addedAndDeletedChars = getAddedAndDeletedChars(acceptedSuggestion.content)
                    if (addedAndDeletedChars) {
                        addedCharactersForEditSuggestion = addedAndDeletedChars.addedCharacters
                        deletedCharactersForEditSuggestion = addedAndDeletedChars.deletedCharacters

                        this.codePercentageTracker.countAcceptedTokens(
                            session.language,
                            addedCharactersForEditSuggestion
                        )
                        this.codePercentageTracker.countTotalTokens(
                            session.language,
                            addedCharactersForEditSuggestion,
                            true
                        )
                        this.enqueueCodeDiffEntry(session, acceptedSuggestion, addedCharactersForEditSuggestion)
                    }
                } else if (acceptedSuggestion.insertText) {
                    this.codePercentageTracker.countAcceptedTokens(session.language, acceptedSuggestion.insertText)
                    this.codePercentageTracker.countTotalTokens(session.language, acceptedSuggestion.insertText, true)

                    this.enqueueCodeDiffEntry(session, acceptedSuggestion)
                }
            }
        }

        // Handle rejected edit predictions
        if (isInlineEdit && !isAccepted) {
            // Find all rejected suggestions in this session
            const rejectedSuggestions = session.suggestions.filter(suggestion => {
                const result = completionSessionResult[suggestion.itemId]
                return result && result.seen && !result.accepted
            })

            // Record each rejected edit
            for (const rejectedSuggestion of rejectedSuggestions) {
                if (rejectedSuggestion.content) {
                    this.rejectedEditTracker.recordRejectedEdit({
                        content: rejectedSuggestion.content,
                        timestamp: Date.now(),
                        documentUri: session.document.uri,
                        position: session.startPosition,
                    })

                    this.logging.debug(
                        `[EDIT_PREDICTION] Recorded rejected edit: ${rejectedSuggestion.content.substring(0, 20)}...`
                    )
                }
            }
        }

        session.setClientResultData(
            completionSessionResult,
            firstCompletionDisplayLatency,
            totalSessionDisplayTime,
            typeaheadLength
        )

        if (firstCompletionDisplayLatency) emitPerceivedLatencyTelemetry(this.telemetry, session)

        // Always emit user trigger decision at session close
        this.sessionManager.closeSession(session)
        const streakLength = this.editsEnabled ? this.sessionManager.getAndUpdateStreakLength(isAccepted) : 0
        await emitUserTriggerDecisionTelemetry(
            this.telemetry,
            this.telemetryService,
            session,
            this.documentChangedListener.timeSinceLastUserModification,
            addedCharactersForEditSuggestion.length,
            deletedCharactersForEditSuggestion.length,
            addedDiagnostics,
            removedDiagnostics,
            streakLength
        )
    }

    // Schedule tracker for UserModification Telemetry event
    enqueueCodeDiffEntry(
        session: CodeWhispererSession,
        acceptedSuggestion: Suggestion,
        addedCharactersForEdit?: string
    ) {
        const endPosition = getEndPositionForAcceptedSuggestion(acceptedSuggestion.content, session.startPosition)
        // use the addedCharactersForEdit if it is EDIT suggestion type
        const originalString = addedCharactersForEdit ? addedCharactersForEdit : acceptedSuggestion.content

        this.codeDiffTracker.enqueue({
            sessionId: session.codewhispererSessionId || '',
            requestId: session.responseContext?.requestId || '',
            fileUrl: session.document.uri,
            languageId: session.language,
            time: Date.now(),
            originalString: originalString,
            startPosition: session.startPosition,
            endPosition: endPosition,
            customizationArn: session.customizationArn,
            completionType: getCompletionType(acceptedSuggestion),
            triggerType: session.triggerType,
            credentialStartUrl: session.credentialStartUrl,
        })
    }
}
