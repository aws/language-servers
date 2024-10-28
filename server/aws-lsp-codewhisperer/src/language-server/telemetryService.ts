import { CodeWhispererServiceToken } from './codeWhispererService'
import { CredentialsProvider, CredentialsType, Telemetry } from '@aws/language-server-runtimes/server-interface'
import { CodeWhispererSession } from './session/sessionManager'
import {
    SuggestionState,
    UserTriggerDecisionEvent,
    UserContext,
    OptOutPreference,
    SendTelemetryEventRequest,
} from '../client/token/codewhispererbearertokenclient'
import { getCompletionType, getLoginTypeFromProvider, LoginType } from './utils'
import { getRuntimeLanguage } from './languageDetection'

export class TelemetryService extends CodeWhispererServiceToken {
    private userContext: UserContext | undefined
    private optOutPreference!: OptOutPreference
    private enableTelemetryEventsToDestination!: boolean
    private telemetry: Telemetry
    private loginType: LoginType
    private credentialsType: CredentialsType

    constructor(
        credentialsProvider: CredentialsProvider,
        credentialsType: CredentialsType,
        telemetry: Telemetry,
        additionalAwsConfig: AWS.ConfigurationOptions = {}
    ) {
        super(credentialsProvider, additionalAwsConfig)
        this.credentialsType = credentialsType
        this.telemetry = telemetry
        this.loginType = getLoginTypeFromProvider(credentialsProvider)
    }

    public updateUserContext(userContext: UserContext | undefined): void {
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
        switch (session.getAggregatedUserTriggerDecision()) {
            case 'Accept':
                suggestionState = 'ACCEPT'
                break
            case 'Reject':
                suggestionState = 'REJECT'
                break
            case 'Discard':
                suggestionState = 'DISCARD'
                break
            default:
                suggestionState = 'EMPTY'
        }
        return suggestionState
    }

    private shouldNotSendTelemetry(): boolean {
        return this.credentialsType === 'iam' || (this.loginType === 'builderId' && this.optOutPreference === 'OPTOUT')
    }

    private invokeSendTelemetryEvent(request: SendTelemetryEventRequest) {
        if (this.userContext !== undefined) {
            request.userContext = this.userContext
        }
        if (this.optOutPreference !== undefined) {
            request.optOutPreference = this.optOutPreference
        }
        this.sendTelemetryEvent(request)
    }

    public emitUserTriggerDecision(session: CodeWhispererSession, timeSinceLastUserModification?: number) {
        if (this.shouldNotSendTelemetry()) {
            return
        }
        const completionSessionResult = session.completionSessionResult ?? {}
        const acceptedSuggestion = session.suggestions.find(s => s.itemId === session.acceptedSuggestionId)
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
        const perceivedLatencyMilliseconds =
            session.triggerType === 'OnDemand' ? session.timeToFirstRecommendation : timeSinceLastUserModification

        const event: UserTriggerDecisionEvent = {
            sessionId: session.codewhispererSessionId || '',
            requestId: session.responseContext?.requestId || '',
            customizationArn: session.customizationArn === '' ? undefined : session.customizationArn,
            programmingLanguage: {
                languageName: getRuntimeLanguage(session.language),
            },
            completionType:
                session.suggestions.length > 0 ? getCompletionType(session.suggestions[0]).toUpperCase() : 'LINE',
            suggestionState: this.getSuggestionState(session),
            recommendationLatencyMilliseconds: session.firstCompletionDisplayLatency
                ? session.firstCompletionDisplayLatency
                : 0,
            timestamp: new Date(Date.now()),
            triggerToResponseLatencyMilliseconds: session.timeToFirstRecommendation,
            suggestionReferenceCount: referenceCount,
            generatedLine: generatedLines,
            numberOfRecommendations: session.suggestions.length,
            perceivedLatencyMilliseconds: timeSinceLastUserModification,
        }
        const request: SendTelemetryEventRequest = {
            telemetryEvent: {
                userTriggerDecisionEvent: event,
            },
        }
        this.invokeSendTelemetryEvent(request)
    }
}
