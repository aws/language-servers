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
    CodeCoverageEvent,
    TelemetryEvent,
    ChatAddMessageEvent,
    UserIntent,
} from '../client/token/codewhispererbearertokenclient'
import { getCompletionType, getSsoConnectionType, SsoConnectionType } from './utils'
import { ChatInteractionType, InteractWithMessageEvent } from './telemetry/types'
import { CodewhispererLanguage, getRuntimeLanguage } from './languageDetection'

export class TelemetryService extends CodeWhispererServiceToken {
    private userContext: UserContext | undefined
    private optOutPreference!: OptOutPreference
    private enableTelemetryEventsToDestination!: boolean
    private telemetry: Telemetry
    private ssoConnectionType: SsoConnectionType
    private credentialsType: CredentialsType
    private credentialsProvider: CredentialsProvider

    private readonly cwInteractionTypeMap: Record<ChatInteractionType, ChatMessageInteractionType> = {
        [ChatInteractionType.InsertAtCursor]: 'INSERT_AT_CURSOR',
        [ChatInteractionType.CopySnippet]: 'COPY_SNIPPET',
        [ChatInteractionType.Copy]: 'COPY',
        [ChatInteractionType.ClickLink]: 'CLICK_LINK',
        [ChatInteractionType.ClickFollowUp]: 'CLICK_FOLLOW_UP',
        [ChatInteractionType.HoverReference]: 'HOVER_REFERENCE',
        [ChatInteractionType.Upvote]: 'UPVOTE',
        [ChatInteractionType.Downvote]: 'DOWNVOTE',
        [ChatInteractionType.ClickBodyLink]: 'CLICK_BODY_LINK',
    }

    constructor(
        credentialsProvider: CredentialsProvider,
        credentialsType: CredentialsType,
        telemetry: Telemetry,
        additionalAwsConfig: AWS.ConfigurationOptions = {}
    ) {
        super(credentialsProvider, additionalAwsConfig)
        this.credentialsProvider = credentialsProvider
        this.credentialsType = credentialsType
        this.telemetry = telemetry
        this.ssoConnectionType = getSsoConnectionType(credentialsProvider)
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
            ((this.ssoConnectionType === 'builderId' && this.optOutPreference === 'OPTIN') ||
                this.ssoConnectionType === 'identityCenter')
        )
    }

    private invokeSendTelemetryEvent(event: TelemetryEvent) {
        if (!this.shouldSendTelemetry()) {
            return
        }
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
        return this.cwInteractionTypeMap[interactionType] || 'UNKNOWN'
    }

    public emitUserTriggerDecision(session: CodeWhispererSession, timeSinceLastUserModification?: number) {
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
        const acceptedCharacterCount =
            acceptedSuggestion && acceptedSuggestion.content ? acceptedSuggestion.content.length : 0
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
            perceivedLatencyMilliseconds: perceivedLatencyMilliseconds,
            acceptedCharacterCount: acceptedCharacterCount,
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
        if (options?.conversationId === undefined) {
            return
        }
        const event: ChatInteractWithMessageEvent = {
            conversationId: options.conversationId,
            messageId: metric.cwsprChatMessageId,
            customizationArn: this.credentialsProvider.getConnectionMetadata()?.sso?.startUrl,
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

    public emitCodeCoverageEvent(params: {
        languageId: CodewhispererLanguage
        acceptedCharacterCount: number
        totalCharacterCount: number
        customizationArn?: string
    }) {
        const event: CodeCoverageEvent = {
            programmingLanguage: {
                languageName: getRuntimeLanguage(params.languageId),
            },
            acceptedCharacterCount: params.acceptedCharacterCount,
            totalCharacterCount: params.totalCharacterCount,
            timestamp: new Date(Date.now()),
        }
        if (params.customizationArn) event.customizationArn = params.customizationArn

        this.invokeSendTelemetryEvent({
            codeCoverageEvent: event,
        })
    }

    public emitChatAddMessage(params: {
        conversationId?: string
        messageId?: string
        customizationArn?: string
        userIntent?: UserIntent
        hasCodeSnippet?: boolean
        programmingLanguage?: CodewhispererLanguage
        activeEditorTotalCharacters?: number
        timeToFirstChunkMilliseconds?: number
        timeBetweenChunks?: number[]
        fullResponselatency?: number
        requestLength?: number
        responseLength?: number
        numberOfCodeBlocks?: number
        hasProjectLevelContext?: number
    }) {
        if (!params.conversationId || !params.messageId) {
            return
        }
        const event: ChatAddMessageEvent = {
            conversationId: params.conversationId,
            messageId: params.messageId,
            customizationArn: params.customizationArn,
            userIntent: params.userIntent,
            hasCodeSnippet: params.hasCodeSnippet,
            programmingLanguage: params.programmingLanguage
                ? {
                      languageName: getRuntimeLanguage(params.programmingLanguage),
                  }
                : undefined,
            activeEditorTotalCharacters: params.activeEditorTotalCharacters,
            timeToFirstChunkMilliseconds: params.timeToFirstChunkMilliseconds,
            timeBetweenChunks: params.timeBetweenChunks,
            fullResponselatency: params.fullResponselatency,
            requestLength: params.requestLength,
            responseLength: params.responseLength,
            numberOfCodeBlocks: params.numberOfCodeBlocks,
            hasProjectLevelContext: false,
        }
        this.invokeSendTelemetryEvent({
            chatAddMessageEvent: event,
        })
    }
}
