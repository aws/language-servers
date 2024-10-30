import { TelemetryService } from './telemetryService'
import {
    BearerCredentials,
    ConnectionMetadata,
    CredentialsProvider,
    CredentialsType,
    IamCredentials,
    Telemetry,
} from '@aws/language-server-runtimes/server-interface'
import { UserContext, OptOutPreference } from '../client/token/codewhispererbearertokenclient'
import { CodeWhispererSession } from './session/sessionManager'
import sinon from 'ts-sinon'
import { BUILDER_ID_START_URL } from './constants'
import { ChatInteractionType } from './telemetry/types'

class MockCredentialsProvider implements CredentialsProvider {
    private mockIamCredentials: IamCredentials | undefined
    private mockBearerCredentials: BearerCredentials | undefined
    private mockConnectionMetadata: ConnectionMetadata | undefined

    hasCredentials(type: CredentialsType): boolean {
        if (type === 'iam') {
            return this.mockIamCredentials !== undefined
        } else if (type === 'bearer') {
            return this.mockBearerCredentials !== undefined
        }
        return false
    }

    getCredentials(type: CredentialsType): IamCredentials | BearerCredentials | undefined {
        if (type === 'iam') {
            return this.mockIamCredentials
        } else if (type === 'bearer') {
            return this.mockBearerCredentials
        }
        return undefined
    }

    getConnectionMetadata(): ConnectionMetadata | undefined {
        return this.mockConnectionMetadata
    }

    setConnectionMetadata(metadata: ConnectionMetadata | undefined) {
        this.mockConnectionMetadata = metadata
    }
}

describe('TelemetryService', () => {
    let clock: sinon.SinonFakeTimers
    let telemetryService: TelemetryService
    let mockCredentialsProvider: MockCredentialsProvider
    const mockSession: Partial<CodeWhispererSession> = {
        codewhispererSessionId: 'test-session-id',
        responseContext: {
            requestId: 'test-request-id',
            codewhispererSessionId: 'test-session-id',
        },
        customizationArn: 'test-arn',
        language: 'tsx',
        suggestions: [
            {
                itemId: 'item-id-1',
                content: 'line1\nline2\nline3',
                references: [],
            },
        ],
        completionSessionResult: {
            'item-id-1': {
                accepted: true,
                seen: true,
                discarded: false,
            },
        },
        acceptedSuggestionId: 'item-id-1',
        firstCompletionDisplayLatency: 100,
        timeToFirstRecommendation: 200,
        getAggregatedUserTriggerDecision: () => 'Accept',
    }

    beforeEach(() => {
        clock = sinon.useFakeTimers({
            now: 1483228800000,
        })
        mockCredentialsProvider = new MockCredentialsProvider()
    })

    afterEach(() => {
        clock.restore()
        sinon.restore()
    })

    it('updateUserContext updates the userContext property', () => {
        telemetryService = new TelemetryService(mockCredentialsProvider, 'bearer', {} as Telemetry, {})
        const mockUserContext: UserContext = {
            clientId: 'aaaabbbbccccdddd',
            ideCategory: 'ECLIPSE',
            ideVersion: '1.1.1',
            operatingSystem: 'MAC',
            product: 'INLINE',
        }
        telemetryService.updateUserContext(mockUserContext)

        sinon.assert.match((telemetryService as any).userContext, mockUserContext)
    })

    it('updateOptOutPreference updates the optOutPreference property', () => {
        telemetryService = new TelemetryService(mockCredentialsProvider, 'bearer', {} as Telemetry, {})
        const mockOptOutPreference: OptOutPreference = 'OPTIN'
        telemetryService.updateOptOutPreference(mockOptOutPreference)

        sinon.assert.match((telemetryService as any).optOutPreference, mockOptOutPreference)
    })

    it('updateEnableTelemetryEventsToDestination updates the enableTelemetryEventsToDestination property', () => {
        telemetryService = new TelemetryService(mockCredentialsProvider, 'bearer', {} as Telemetry, {})
        telemetryService.updateEnableTelemetryEventsToDestination(true)

        sinon.assert.match((telemetryService as any).enableTelemetryEventsToDestination, true)
    })

    it('getSuggestionState fetches the suggestion state from CodeWhispererSession', () => {
        telemetryService = new TelemetryService(mockCredentialsProvider, 'bearer', {} as Telemetry, {})
        const getSuggestionState = (telemetryService as any).getSuggestionState.bind(telemetryService)
        let session = {
            getAggregatedUserTriggerDecision: () => {
                return 'Accept'
            },
        } as unknown as CodeWhispererSession

        sinon.assert.match(getSuggestionState(session), 'ACCEPT')

        session = {
            getAggregatedUserTriggerDecision: () => {
                return 'Reject'
            },
        } as unknown as CodeWhispererSession

        sinon.assert.match(getSuggestionState(session), 'REJECT')

        session = {
            getAggregatedUserTriggerDecision: () => {
                return 'Discard'
            },
        } as unknown as CodeWhispererSession
        sinon.assert.match(getSuggestionState(session), 'DISCARD')

        session = {
            getAggregatedUserTriggerDecision: () => {
                return 'Empty'
            },
        } as unknown as CodeWhispererSession
        sinon.assert.match(getSuggestionState(session), 'EMPTY')

        session = {
            getAggregatedUserTriggerDecision: () => {
                return undefined
            },
        } as unknown as CodeWhispererSession
        sinon.assert.match(getSuggestionState(session), 'EMPTY')
    })

    it('should not emit user trigger decision if login is invalid (IAM)', () => {
        telemetryService = new TelemetryService(mockCredentialsProvider, 'iam', {} as Telemetry, {})
        const invokeSendTelemetryEventStub: sinon.SinonStub = sinon.stub(telemetryService, 'sendTelemetryEvent' as any)
        telemetryService.emitUserTriggerDecision(mockSession as CodeWhispererSession)
        sinon.assert.notCalled(invokeSendTelemetryEventStub)
    })

    it('should not emit user trigger decision if login is BuilderID, but user chose OPTOUT option', () => {
        mockCredentialsProvider.setConnectionMetadata({
            sso: {
                startUrl: BUILDER_ID_START_URL,
            },
        })
        telemetryService = new TelemetryService(mockCredentialsProvider, 'bearer', {} as Telemetry, {})
        telemetryService.updateOptOutPreference('OPTOUT')
        telemetryService.emitUserTriggerDecision(mockSession as CodeWhispererSession)
        const invokeSendTelemetryEventStub: sinon.SinonStub = sinon.stub(telemetryService, 'sendTelemetryEvent' as any)
        sinon.assert.notCalled(invokeSendTelemetryEventStub)
    })

    it('should emit userTriggerDecision event correctly', () => {
        const expectedUserTriggerDecisionEvent = {
            telemetryEvent: {
                userTriggerDecisionEvent: {
                    sessionId: 'test-session-id',
                    requestId: 'test-request-id',
                    customizationArn: 'test-arn',
                    programmingLanguage: { languageName: 'typescript' },
                    completionType: 'BLOCK',
                    suggestionState: 'ACCEPT',
                    recommendationLatencyMilliseconds: 100,
                    timestamp: new Date(Date.now()),
                    triggerToResponseLatencyMilliseconds: 200,
                    suggestionReferenceCount: 0,
                    generatedLine: 3,
                    numberOfRecommendations: 1,
                    perceivedLatencyMilliseconds: undefined,
                },
            },
            optOutPreference: 'OPTIN',
        }
        mockCredentialsProvider.setConnectionMetadata({
            sso: {
                startUrl: 'idc-start-url',
            },
        })
        telemetryService = new TelemetryService(mockCredentialsProvider, 'bearer', {} as Telemetry, {})
        const invokeSendTelemetryEventStub: sinon.SinonStub = sinon.stub(telemetryService, 'sendTelemetryEvent' as any)
        telemetryService.updateOptOutPreference('OPTIN')

        telemetryService.emitUserTriggerDecision(mockSession as CodeWhispererSession)

        sinon.assert.calledOnceWithExactly(invokeSendTelemetryEventStub, expectedUserTriggerDecisionEvent)
    })

    describe('Chat interact with message', () => {
        let telemetryService: TelemetryService
        let mockCredentialsProvider: MockCredentialsProvider
        let invokeSendTelemetryEventStub: sinon.SinonStub

        beforeEach(() => {
            mockCredentialsProvider = new MockCredentialsProvider()
            mockCredentialsProvider.setConnectionMetadata({
                sso: {
                    startUrl: 'idc-start-url',
                },
            })
            telemetryService = new TelemetryService(mockCredentialsProvider, 'bearer', {} as Telemetry, {})
            invokeSendTelemetryEventStub = sinon.stub(telemetryService, 'sendTelemetryEvent' as any)
        })

        afterEach(() => {
            sinon.restore()
        })

        it('should send InteractWithMessage event with correct parameters', () => {
            const metric = {
                cwsprChatMessageId: 'message123',
                codewhispererCustomizationArn: 'arn:123',
                cwsprChatInteractionType: ChatInteractionType.InsertAtCursor,
                cwsprChatInteractionTarget: 'CODE',
                cwsprChatAcceptedCharactersLength: 100,
            }
            const conversationId = 'conv123'
            const acceptedLineCount = 5
            telemetryService.emitChatInteractWithMessage(metric, {
                conversationId,
                acceptedLineCount,
            })

            const expectedEvent = {
                telemetryEvent: {
                    chatInteractWithMessageEvent: {
                        conversationId: conversationId,
                        messageId: metric.cwsprChatMessageId,
                        customizationArn: metric.codewhispererCustomizationArn,
                        interactionType: 'INSERT_AT_CURSOR',
                        interactionTarget: metric.cwsprChatInteractionTarget,
                        acceptedCharacterCount: metric.cwsprChatAcceptedCharactersLength,
                        acceptedLineCount: acceptedLineCount,
                        acceptedSnippetHasReference: false,
                        hasProjectLevelContext: false,
                    },
                },
            }

            sinon.assert.calledOnceWithExactly(invokeSendTelemetryEventStub, expectedEvent)
        })

        it('should not send InteractWithMessage when conversationId is undefined', () => {
            const metric = {
                cwsprChatMessageId: 'message123',
                codewhispererCustomizationArn: 'arn:123',
                cwsprChatInteractionType: ChatInteractionType.InsertAtCursor,
                cwsprChatInteractionTarget: 'CODE',
                cwsprChatAcceptedCharactersLength: 100,
            }
            telemetryService.emitChatInteractWithMessage(metric, {
                acceptedLineCount: 5,
            })

            sinon.assert.notCalled(invokeSendTelemetryEventStub)
        })

        it('should not send InteractWithMessage when credentialsType is IAM', () => {
            telemetryService = new TelemetryService(mockCredentialsProvider, 'iam', {} as Telemetry, {})
            invokeSendTelemetryEventStub = sinon.stub(telemetryService, 'sendTelemetryEvent' as any)
            const metric = {
                cwsprChatMessageId: 'message123',
                codewhispererCustomizationArn: 'arn:123',
                cwsprChatInteractionType: ChatInteractionType.InsertAtCursor,
                cwsprChatInteractionTarget: 'CODE',
                cwsprChatAcceptedCharactersLength: 100,
            }
            telemetryService.emitChatInteractWithMessage(metric, {
                conversationId: 'conv123',
                acceptedLineCount: 5,
            })

            sinon.assert.notCalled(invokeSendTelemetryEventStub)
        })

        it('should not send InteractWithMessage when login is BuilderID, but user chose OPTOUT option', () => {
            mockCredentialsProvider.setConnectionMetadata({
                sso: {
                    startUrl: BUILDER_ID_START_URL,
                },
            })
            telemetryService = new TelemetryService(mockCredentialsProvider, 'bearer', {} as Telemetry, {})
            invokeSendTelemetryEventStub = sinon.stub(telemetryService, 'sendTelemetryEvent' as any)
            telemetryService.updateOptOutPreference('OPTOUT')
            const metric = {
                cwsprChatMessageId: 'message123',
                codewhispererCustomizationArn: 'arn:123',
                cwsprChatInteractionType: ChatInteractionType.InsertAtCursor,
                cwsprChatInteractionTarget: 'CODE',
                cwsprChatAcceptedCharactersLength: 100,
            }
            telemetryService.emitChatInteractWithMessage(metric, {
                conversationId: 'conv123',
                acceptedLineCount: 5,
            })

            sinon.assert.notCalled(invokeSendTelemetryEventStub)
        })

        it('should send InteractWithMessage but with optional acceptedLineCount parameter', () => {
            const metric = {
                cwsprChatMessageId: 'message123',
                codewhispererCustomizationArn: 'arn:123',
                cwsprChatInteractionType: ChatInteractionType.InsertAtCursor,
                cwsprChatInteractionTarget: 'CODE',
                cwsprChatAcceptedCharactersLength: 100,
            }
            const conversationId = 'conv123'
            telemetryService.emitChatInteractWithMessage(metric, {
                conversationId,
                acceptedLineCount: undefined,
            })

            sinon.assert.calledWithExactly(invokeSendTelemetryEventStub, {
                telemetryEvent: {
                    chatInteractWithMessageEvent: {
                        conversationId: 'conv123',
                        messageId: 'message123',
                        customizationArn: 'arn:123',
                        interactionType: 'INSERT_AT_CURSOR',
                        interactionTarget: 'CODE',
                        acceptedCharacterCount: 100,
                        acceptedLineCount: undefined, // Should be undefined
                        acceptedSnippetHasReference: false,
                        hasProjectLevelContext: false,
                    },
                },
            })
        })
    })

    it('should emit CodeCoverageEvent event', () => {
        const expectedEvent = {
            telemetryEvent: {
                codeCoverageEvent: {
                    customizationArn: 'test-arn',
                    programmingLanguage: { languageName: 'typescript' },
                    acceptedCharacterCount: 123,
                    totalCharacterCount: 456,
                    timestamp: new Date(Date.now()),
                },
            },
            optOutPreference: 'OPTIN',
        }
        mockCredentialsProvider.setConnectionMetadata({
            sso: {
                startUrl: 'idc-start-url',
            },
        })
        telemetryService = new TelemetryService(mockCredentialsProvider, 'bearer', {} as Telemetry, {})
        const invokeSendTelemetryEventStub: sinon.SinonStub = sinon.stub(telemetryService, 'sendTelemetryEvent' as any)
        telemetryService.updateOptOutPreference('OPTIN')

        telemetryService.emitCodeCoverageEvent({
            languageId: 'typescript',
            customizationArn: 'test-arn',
            acceptedCharacterCount: 123,
            totalCharacterCount: 456,
        })

        sinon.assert.calledOnceWithExactly(invokeSendTelemetryEventStub, expectedEvent)
    })
})
