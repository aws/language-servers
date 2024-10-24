import { CodeWhispererServiceToken } from './codeWhispererService'
import { CredentialsProvider, Telemetry } from '@aws/language-server-runtimes/server-interface'
import { CodeWhispererSession } from './session/sessionManager'
import {
    SuggestionState,
    UserTriggerDecisionEvent,
    UserContext,
    OptOutPreference,
} from '../client/token/codewhispererbearertokenclient'
import { getCompletionType } from './utils'

export class TelemetryService extends CodeWhispererServiceToken {
    private userContext!: UserContext
    private optOutPreference!: OptOutPreference
    private enableTelemetryEventsToDestination!: boolean
    private telemetry: Telemetry

    constructor(
        credentialsProvider: CredentialsProvider,
        additionalAwsConfig: AWS.ConfigurationOptions = {},
        telemetry: Telemetry
    ) {
        super(credentialsProvider, additionalAwsConfig)
        this.telemetry = telemetry
    }

    public updateUserContext(userContext: UserContext): void {
        this.userContext = userContext
    }

    public updateOptOutPreference(optOutPreference: OptOutPreference): void {
        this.optOutPreference = optOutPreference
    }

    public updateEnableTelemetryEventsToDestination(enableTelemetryEventsToDestination: boolean): void {
        this.enableTelemetryEventsToDestination = enableTelemetryEventsToDestination
    }

    private getSuggestionState(session: CodeWhispererSession): SuggestionState {
        let suggestionState: SuggestionState
        if (session.getAggregatedUserTriggerDecision() === undefined) {
            suggestionState = 'EMPTY'
        } else if (session.getAggregatedUserTriggerDecision() === 'Accept') {
            suggestionState = 'ACCEPT'
        } else if (session.getAggregatedUserTriggerDecision() === 'Reject') {
            suggestionState = 'REJECT'
        } else if (session.getAggregatedUserTriggerDecision() === 'Discard') {
            suggestionState = 'DISCARD'
        } else {
            suggestionState = 'EMPTY'
        }
        return suggestionState
    }

    public emitUserTriggerDecision(session: CodeWhispererSession) {
        const completionSessionResult = session.completionSessionResult ?? {}
        const acceptedItemId = Object.keys(completionSessionResult).find(k => completionSessionResult[k].accepted)
        const acceptedSuggestion = session.suggestions.find(s => s.itemId === acceptedItemId)
        const generatedLines =
            acceptedSuggestion === undefined || acceptedSuggestion.content.trim() === ''
                ? 0
                : acceptedSuggestion.content.split('\n').length
        const referenceCount =
            acceptedSuggestion === undefined
                ? 0
                : acceptedSuggestion.references && acceptedSuggestion.references.length > 0
                  ? 1
                  : 0

        const event: UserTriggerDecisionEvent = {
            sessionId: session.codewhispererSessionId || '',
            requestId: session.responseContext?.requestId || '',
            customizationArn: session.customizationArn || '',
            programmingLanguage: {
                languageName: session.language,
            },
            completionType:
                session.suggestions.length > 0 ? getCompletionType(session.suggestions[0]).toUpperCase() : '',
            suggestionState: this.getSuggestionState(session),
            recommendationLatencyMilliseconds: session.firstCompletionDisplayLatency
                ? session.firstCompletionDisplayLatency
                : 0,
            timestamp: new Date(Date.now()),
            triggerToResponseLatencyMilliseconds: session.timeToFirstRecommendation,
            suggestionReferenceCount: referenceCount,
            generatedLine: generatedLines,
            numberOfRecommendations: session.suggestions.length,
        }
        this.sendTelemetryEvent({
            telemetryEvent: {
                userTriggerDecisionEvent: event,
            },
            userContext: this.userContext,
            optOutPreference: this.optOutPreference,
        })
    }
}
