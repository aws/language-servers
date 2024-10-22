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
    private toolkitTelemetry!: Telemetry

    constructor(credentialsProvider: CredentialsProvider, additionalAwsConfig: AWS.ConfigurationOptions = {}) {
        super(credentialsProvider, additionalAwsConfig)
    }

    public setToolkitTelemetry(toolkitTelemetry: Telemetry): void {
        this.toolkitTelemetry = toolkitTelemetry
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
            suggestionState = ''
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
            // TODO: Need to change this value of recommendationLatencyMilliseconds
            recommendationLatencyMilliseconds: 0,
            timestamp: new Date(Date.now()),
            triggerToResponseLatencyMilliseconds: session.timeToFirstRecommendation,
            suggestionReferenceCount: session.suggestions.length,
            /* TODO: populate correct values for generatedLine and numberOfRecommendations
            generatedLine: 0,
            numberOfRecommendations: 0
             */
        }
        this.sendTelemetryEvent({
            telemetryEvent: {
                userTriggerDecisionEvent: event,
            },
            userContext: this.userContext ? this.userContext : undefined,
            optOutPreference: this.optOutPreference ? this.optOutPreference : undefined,
        })
    }
}
