import { CodeWhispererServiceToken } from './codeWhispererService'
import {
    CredentialsProvider,
    CredentialsType,
    Logging,
    Telemetry,
} from '@aws/language-server-runtimes/server-interface'
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
    ChatUserModificationEvent,
    ChatAddMessageEvent,
    UserIntent,
} from '../client/token/codewhispererbearertokenclient'
import { getCompletionType, getSsoConnectionType, isAwsError } from './utils'
import {
    ChatConversationType,
    ChatInteractionType,
    ChatTelemetryEventName,
    CodeWhispererUserTriggerDecisionEvent,
    InteractWithMessageEvent,
} from './telemetry/types'
import { CodewhispererLanguage, getRuntimeLanguage } from './languageDetection'
import { CONVERSATION_ID_METRIC_KEY } from './chat/telemetry/chatTelemetryController'

export class TelemetryService extends CodeWhispererServiceToken {
    private userContext: UserContext | undefined
    private optOutPreference!: OptOutPreference
    private enableTelemetryEventsToDestination: boolean
    private telemetry: Telemetry
    private credentialsType: CredentialsType
    private credentialsProvider: CredentialsProvider
    private logging: Logging

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
        logging: Logging,
        additionalAwsConfig: AWS.ConfigurationOptions = {}
    ) {
        super(credentialsProvider, additionalAwsConfig)
        this.credentialsProvider = credentialsProvider
        this.credentialsType = credentialsType
        this.telemetry = telemetry
        this.logging = logging
        this.enableTelemetryEventsToDestination = true
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
        const ssoConnectionType = getSsoConnectionType(this.credentialsProvider)

        return (
            this.credentialsType === 'bearer' &&
            ((ssoConnectionType === 'builderId' && this.optOutPreference === 'OPTIN') ||
                ssoConnectionType === 'identityCenter')
        )
    }

    private logSendTelemetryEventFailure(error: any) {
        let requestId: string | undefined
        if (isAwsError(error)) {
            requestId = error.requestId
        }

        this.logging.log(
            `Failed to sendTelemetryEvent to CodeWhisperer, requestId: ${requestId ?? ''}, message: ${error?.message}`
        )
    }

    private async invokeSendTelemetryEvent(event: TelemetryEvent) {
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
        try {
            await this.sendTelemetryEvent(request)
        } catch (error) {
            this.logSendTelemetryEventFailure(error)
        }
    }

    private getCWClientTelemetryInteractionType(interactionType: ChatInteractionType): ChatMessageInteractionType {
        return this.cwInteractionTypeMap[interactionType] || 'UNKNOWN'
    }

    public emitUserTriggerDecision(session: CodeWhispererSession, timeSinceLastUserModification?: number) {
        if (this.enableTelemetryEventsToDestination) {
            const data: CodeWhispererUserTriggerDecisionEvent = {
                codewhispererSessionId: session.codewhispererSessionId || '',
                codewhispererFirstRequestId: session.responseContext?.requestId || '',
                credentialStartUrl: session.credentialStartUrl,
                codewhispererSuggestionState: session.getAggregatedUserTriggerDecision(),
                codewhispererCompletionType:
                    session.suggestions.length > 0 ? getCompletionType(session.suggestions[0]) : undefined,
                codewhispererLanguage: session.language,
                codewhispererTriggerType: session.triggerType,
                codewhispererAutomatedTriggerType: session.autoTriggerType,
                codewhispererTriggerCharacter:
                    session.autoTriggerType === 'SpecialCharacters' ? session.triggerCharacter : undefined,
                codewhispererLineNumber: session.startPosition.line,
                codewhispererCursorOffset: session.startPosition.character,
                codewhispererSuggestionCount: session.suggestions.length,
                codewhispererClassifierResult: session.classifierResult,
                codewhispererClassifierThreshold: session.classifierThreshold,
                codewhispererTotalShownTime: session.totalSessionDisplayTime || 0,
                codewhispererTypeaheadLength: session.typeaheadLength || 0,
                // Global time between any 2 document changes
                codewhispererTimeSinceLastDocumentChange: timeSinceLastUserModification,
                codewhispererTimeSinceLastUserDecision: session.previousTriggerDecisionTime
                    ? session.startTime - session.previousTriggerDecisionTime
                    : undefined,
                codewhispererTimeToFirstRecommendation: session.timeToFirstRecommendation,
                codewhispererPreviousSuggestionState: session.previousTriggerDecision,
                codewhispererSupplementalContextTimeout: session.supplementalMetadata?.isProcessTimeout,
                codewhispererSupplementalContextIsUtg: session.supplementalMetadata?.isUtg,
                codewhispererSupplementalContextLength: session.supplementalMetadata?.contentsLength,
                codewhispererCustomizationArn: session.customizationArn,
            }
            this.telemetry.emitMetric({
                name: 'codewhisperer_userTriggerDecision',
                data: data,
            })
        }
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
        if (this.enableTelemetryEventsToDestination) {
            this.telemetry.emitMetric({
                name: ChatTelemetryEventName.InteractWithMessage,
                data: {
                    ...metric,
                    [CONVERSATION_ID_METRIC_KEY]: options.conversationId,
                    credentialStartUrl: this.credentialsProvider.getConnectionMetadata()?.sso?.startUrl,
                },
            })
        }
        const event: ChatInteractWithMessageEvent = {
            conversationId: options.conversationId,
            messageId: metric.cwsprChatMessageId,
            interactionType: this.getCWClientTelemetryInteractionType(metric.cwsprChatInteractionType),
            interactionTarget: metric.cwsprChatInteractionTarget,
            acceptedCharacterCount: metric.cwsprChatAcceptedCharactersLength,
            acceptedLineCount: options.acceptedLineCount,
            acceptedSnippetHasReference: false,
            hasProjectLevelContext: false,
        }
        if (metric.codewhispererCustomizationArn) {
            event.customizationArn = metric.codewhispererCustomizationArn
        }
        this.invokeSendTelemetryEvent({
            chatInteractWithMessageEvent: event,
        })
    }

    public emitChatUserModificationEvent(params: {
        conversationId: string
        messageId: string
        modificationPercentage: number
        customizationArn?: string
    }) {
        if (this.enableTelemetryEventsToDestination) {
            this.telemetry.emitMetric({
                name: ChatTelemetryEventName.ModifyCode,
                data: {
                    [CONVERSATION_ID_METRIC_KEY]: params.conversationId,
                    cwsprChatMessageId: params.messageId,
                    cwsprChatModificationPercentage: params.modificationPercentage,
                    codewhispererCustomizationArn: params.customizationArn,
                    credentialStartUrl: this.credentialsProvider.getConnectionMetadata()?.sso?.startUrl,
                },
            })
        }
        this.invokeSendTelemetryEvent({
            chatUserModificationEvent: params,
        })
    }

    public emitUserModificationEvent(params: {
        sessionId: string
        requestId: string
        languageId: CodewhispererLanguage
        customizationArn?: string
        timestamp: Date
        modificationPercentage: number
        acceptedCharacterCount: number
        unmodifiedAcceptedCharacterCount: number
    }) {
        this.invokeSendTelemetryEvent({
            userModificationEvent: {
                sessionId: params.sessionId,
                requestId: params.requestId,
                programmingLanguage: {
                    languageName: getRuntimeLanguage(params.languageId),
                },
                // deprecated % value and should not be used by service side
                modificationPercentage: params.modificationPercentage,
                customizationArn: params.customizationArn,
                timestamp: params.timestamp,
                acceptedCharacterCount: params.acceptedCharacterCount,
                unmodifiedAcceptedCharacterCount: params.unmodifiedAcceptedCharacterCount,
            },
        })
    }

    public emitCodeCoverageEvent(
        params: {
            languageId: CodewhispererLanguage
            acceptedCharacterCount: number
            totalCharacterCount: number
            customizationArn?: string
        },
        additionalParams: Partial<{
            percentage: number
            successCount: number
        }>
    ) {
        if (this.enableTelemetryEventsToDestination) {
            this.telemetry.emitMetric({
                name: 'codewhisperer_codePercentage',
                data: {
                    codewhispererTotalTokens: params.totalCharacterCount,
                    codewhispererLanguage: params.languageId,
                    codewhispererSuggestedTokens: params.acceptedCharacterCount,
                    codewhispererPercentage: additionalParams.percentage,
                    successCount: additionalParams.successCount,
                },
            })
        }
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

    public emitChatAddMessage(
        params: {
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
        },
        additionalParams: Partial<{
            chatTriggerInteraction: string
            chatResponseCode: number
            chatSourceLinkCount?: number
            chatReferencesCount?: number
            chatFollowUpCount?: number
            chatConversationType: ChatConversationType
            chatActiveEditorImportCount?: number
        }>
    ) {
        if (!params.conversationId || !params.messageId) {
            return
        }

        if (this.enableTelemetryEventsToDestination) {
            this.telemetry.emitMetric({
                name: ChatTelemetryEventName.AddMessage,
                data: {
                    credentialStartUrl: this.credentialsProvider.getConnectionMetadata()?.sso?.startUrl,
                    [CONVERSATION_ID_METRIC_KEY]: params.conversationId,
                    cwsprChatHasCodeSnippet: params.hasCodeSnippet,
                    cwsprChatTriggerInteraction: additionalParams.chatTriggerInteraction,
                    cwsprChatMessageId: params.messageId,
                    cwsprChatUserIntent: params.userIntent,
                    cwsprChatProgrammingLanguage: params.programmingLanguage,
                    cwsprChatResponseCodeSnippetCount: params.numberOfCodeBlocks,
                    cwsprChatResponseCode: additionalParams.chatResponseCode,
                    cwsprChatSourceLinkCount: additionalParams.chatSourceLinkCount,
                    cwsprChatReferencesCount: additionalParams.chatReferencesCount,
                    cwsprChatFollowUpCount: additionalParams.chatFollowUpCount,
                    cwsprTimeToFirstChunk: params.timeToFirstChunkMilliseconds,
                    cwsprChatFullResponseLatency: params.fullResponselatency,
                    cwsprChatTimeBetweenChunks: params.timeBetweenChunks,
                    cwsprChatRequestLength: params.requestLength,
                    cwsprChatResponseLength: params.responseLength,
                    cwsprChatConversationType: additionalParams.chatConversationType,
                    cwsprChatActiveEditorTotalCharacters: params.activeEditorTotalCharacters,
                    cwsprChatActiveEditorImportCount: additionalParams.chatActiveEditorImportCount,
                    codewhispererCustomizationArn: params.customizationArn,
                },
            })
        }

        const event: ChatAddMessageEvent = {
            conversationId: params.conversationId,
            messageId: params.messageId,
            userIntent: params.userIntent,
            hasCodeSnippet: params.hasCodeSnippet,
            activeEditorTotalCharacters: params.activeEditorTotalCharacters,
            timeToFirstChunkMilliseconds: params.timeToFirstChunkMilliseconds,
            timeBetweenChunks: params.timeBetweenChunks,
            fullResponselatency: params.fullResponselatency,
            requestLength: params.requestLength,
            responseLength: params.responseLength,
            numberOfCodeBlocks: params.numberOfCodeBlocks,
            hasProjectLevelContext: false,
        }
        if (params.customizationArn) {
            event.customizationArn = params.customizationArn
        }
        if (params.programmingLanguage) {
            event.programmingLanguage = {
                languageName: getRuntimeLanguage(params.programmingLanguage),
            }
        }
        this.invokeSendTelemetryEvent({
            chatAddMessageEvent: event,
        })
    }
}
