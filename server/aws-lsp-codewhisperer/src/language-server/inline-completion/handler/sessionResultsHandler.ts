import {
    Logging,
    LogInlineCompletionSessionResultsParams,
    Telemetry,
} from '@aws/language-server-runtimes/server-interface'
import { IdeDiagnostic } from '@amzn/codewhisperer-runtime'
import { SessionManager } from '../session/sessionManager'
import { CodePercentageTracker } from '../tracker/codePercentageTracker'
import { RejectedEditTracker } from '../tracker/rejectedEditTracker'
import { StreakTracker } from '../tracker/streakTracker'
import { TelemetryService } from '../../../shared/telemetry/telemetryService'
import { AcceptedInlineSuggestionEntry, CodeDiffTracker } from '../tracker/codeDiffTracker'
import { SuggestionType, Suggestion } from '../../../shared/codeWhispererService'
import { getAddedAndDeletedLines, getCharacterDifferences } from '../utils/diffUtils'
import { getCompletionType, getEndPositionForAcceptedSuggestion } from '../../../shared/utils'
import { emitPerceivedLatencyTelemetry, emitUserTriggerDecisionTelemetry } from '../telemetry/telemetry'

export class SessionResultsHandler {
    constructor(
        private readonly logging: Logging,
        private readonly telemetry: Telemetry,
        private readonly telemetryService: TelemetryService,
        private readonly completionSessionManager: SessionManager,
        private readonly editSessionManager: SessionManager,
        private readonly codePercentageTracker: CodePercentageTracker,
        private readonly codeDiffTracker: CodeDiffTracker<AcceptedInlineSuggestionEntry>,
        private readonly rejectedEditTracker: RejectedEditTracker,
        private readonly streakTracker: StreakTracker,
        private readonly getEditsEnabled: () => boolean,
        private readonly getTimeSinceLastUserModification: () => number
    ) {}

    // Schedule tracker for UserModification Telemetry event
    private enqueueCodeDiffEntry(session: any, acceptedSuggestion: Suggestion, addedCharactersForEdit?: string) {
        const endPosition = getEndPositionForAcceptedSuggestion(acceptedSuggestion.content, session.startPosition)
        // use the addedCharactersForEdit if it is EDIT suggestion type
        const originalString = addedCharactersForEdit ? addedCharactersForEdit : acceptedSuggestion.content

        this.codeDiffTracker.enqueue({
            sessionId: session.codewhispererSessionId || '',
            requestId: session.responseContext?.requestId || '',
            fileUrl: session.document.uri,
            languageId: session.language,
            time: Date.now(),
            originalString: originalString ?? '',
            startPosition: session.startPosition,
            endPosition: endPosition,
            customizationArn: session.customizationArn,
            completionType: getCompletionType(acceptedSuggestion),
            triggerType: session.triggerType,
            credentialStartUrl: session.credentialStartUrl,
        })
    }

    async handleSessionResults(params: LogInlineCompletionSessionResultsParams) {
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

        // Comment this out because Edit request might return Completion as well so we can't rely on this flag
        // const sessionManager = params.isInlineEdit ? this.editSessionManager : this.completionSessionManager

        // TODO: Not elegant, worth refactoring
        const editSession = this.editSessionManager.getSessionById(sessionId)
        const completionSession = this.completionSessionManager.getSessionById(sessionId)

        const session = editSession ?? completionSession
        const sessionManager = editSession ? this.editSessionManager : this.completionSessionManager
        if (!session) {
            this.logging.log(`ERROR: Session ID ${sessionId} was not found`)
            return
        }

        if (session.state !== 'ACTIVE') {
            this.logging.log(
                `ERROR: Trying to record trigger decision for not-active session ${sessionId} with wrong state ${session.state}`
            )
            return
        }

        const acceptedItemId = Object.keys(params.completionSessionResult).find(
            k => params.completionSessionResult[k].accepted
        )
        const isAccepted = acceptedItemId ? true : false
        const acceptedSuggestion = session.suggestions.find(s => s.itemId === acceptedItemId)
        let addedLengthForEdits = 0
        let deletedLengthForEdits = 0

        if (acceptedSuggestion) {
            this.codePercentageTracker.countSuccess(session.language)
            if (session.predictionType === SuggestionType.EDIT && acceptedSuggestion.content) {
                // [acceptedSuggestion.insertText] will be undefined for NEP suggestion. Use [acceptedSuggestion.content] instead.
                // Since [acceptedSuggestion.content] is in the form of a diff, transform the content into addedCharacters and deletedCharacters.
                const { addedLines, deletedLines } = getAddedAndDeletedLines(acceptedSuggestion.content)
                const charDiffResult = getCharacterDifferences(addedLines, deletedLines)
                addedLengthForEdits = charDiffResult.charactersAdded
                deletedLengthForEdits = charDiffResult.charactersRemoved

                this.codePercentageTracker.countAcceptedTokensUsingCount(
                    session.language,
                    charDiffResult.charactersAdded
                )
                this.codePercentageTracker.addTotalTokensForEdits(session.language, charDiffResult.charactersAdded)
                this.enqueueCodeDiffEntry(session, acceptedSuggestion, addedLines.join('\n'))
            } else if (acceptedSuggestion.insertText) {
                this.codePercentageTracker.countAcceptedTokens(session.language, acceptedSuggestion.insertText)
                this.codePercentageTracker.countTotalTokens(session.language, acceptedSuggestion.insertText, true)
                this.enqueueCodeDiffEntry(session, acceptedSuggestion)
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
        sessionManager.closeSession(session)
        const streakLength = this.getEditsEnabled() ? this.streakTracker.getAndUpdateStreakLength(isAccepted) : 0
        await emitUserTriggerDecisionTelemetry(
            this.telemetry,
            this.telemetryService,
            session,
            this.getTimeSinceLastUserModification(),
            addedLengthForEdits,
            deletedLengthForEdits,
            addedDiagnostics as IdeDiagnostic[],
            removedDiagnostics as IdeDiagnostic[],
            streakLength,
            Object.keys(params.completionSessionResult)[0]
        )
    }
}
