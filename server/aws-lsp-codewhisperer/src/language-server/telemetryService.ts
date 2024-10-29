import { CodeWhispererServiceToken } from './codeWhispererService'
import { CredentialsProvider, CredentialsType, Telemetry } from '@aws/language-server-runtimes/server-interface'
import { CodeWhispererSession } from './session/sessionManager'
import {
    SuggestionState,
    UserTriggerDecisionEvent,
    UserContext,
    OptOutPreference,
    SendTelemetryEventRequest,
    ChatInteractWithMessageEvent,
    ChatMessageInteractionType,
    TelemetryEvent,
} from '../client/token/codewhispererbearertokenclient'
import { getCompletionType, getLoginTypeFromProvider, LoginType } from './utils'
import { getRuntimeLanguage } from './languageDetection'
import { ChatInteractionType, InteractWithMessageEvent } from './telemetry/types'

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

    private shouldSendTelemetry(): boolean {
        return (
            this.credentialsType === 'bearer' &&
            ((this.loginType === 'builderId' && this.optOutPreference === 'OPTIN') ||
                this.loginType === 'identityCenter')
        )
    }

    private invokeSendTelemetryEvent(event: TelemetryEvent) {
        const request: SendTelemetryEventRequest = {
            telemetryEvent: event,
        }
        if (this.userContext !== undefined) {
            request.userContext = this.userContext
        }
        if (this.optOutPreference !== undefined) {
            request.optOutPreference = this.optOutPreference
        }
        this.sendTelemetryEvent(request)
    }

    private getCWClientTelemetryInteractionType(interactionType: ChatInteractionType): ChatMessageInteractionType {
        let chatMessageInteractionType: ChatMessageInteractionType
        switch (interactionType) {
            case ChatInteractionType.InsertAtCursor:
                chatMessageInteractionType = 'INSERT_AT_CURSOR'
                break
            case ChatInteractionType.CopySnippet:
                chatMessageInteractionType = 'COPY_SNIPPET'
                break
            case ChatInteractionType.Copy:
                chatMessageInteractionType = 'COPY'
                break
            case ChatInteractionType.ClickLink:
                chatMessageInteractionType = 'CLICK_LINK'
                break
            case ChatInteractionType.ClickFollowUp:
                chatMessageInteractionType = 'CLICK_FOLLOW_UP'
                break
            case ChatInteractionType.HoverReference:
                chatMessageInteractionType = 'HOVER_REFERENCE'
                break
            case ChatInteractionType.Upvote:
                chatMessageInteractionType = 'UPVOTE'
                break
            case ChatInteractionType.Downvote:
                chatMessageInteractionType = 'DOWNVOTE'
                break
            case ChatInteractionType.ClickBodyLink:
                chatMessageInteractionType = 'CLICK_BODY_LINK'
                break
            default:
                chatMessageInteractionType = 'UNKNOWN'
        }
        return chatMessageInteractionType
    }

    public emitUserTriggerDecision(session: CodeWhispererSession, timeSinceLastUserModification?: number) {
        if (!this.shouldSendTelemetry()) {
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
        this.invokeSendTelemetryEvent({
            userTriggerDecisionEvent: event,
        })
    }

    public emitChatInteractWithMessage(
        metric: Omit<InteractWithMessageEvent, 'cwsprChatConversationId'>,
        options?: {
            conversationId?: string
            acceptedLineCount?: number
        }
    ) {
        if (!this.shouldSendTelemetry() || options?.conversationId === undefined) {
            return
        }
        const event: ChatInteractWithMessageEvent = {
            conversationId: options.conversationId,
            messageId: metric.cwsprChatMessageId,
            customizationArn: metric.codewhispererCustomizationArn,
            interactionType: this.getCWClientTelemetryInteractionType(metric.cwsprChatInteractionType),
            interactionTarget: metric.cwsprChatInteractionTarget,
            acceptedCharacterCount: metric.cwsprChatAcceptedCharactersLength,
            acceptedLineCount: options.acceptedLineCount,
            acceptedSnippetHasReference: false,
            hasProjectLevelContext: false,
        }
        this.invokeSendTelemetryEvent({
            chatInteractWithMessageEvent: event,
        })
    }
}
