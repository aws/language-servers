import { expect } from 'chai'
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
    }
    mockSession['getAggregatedUserTriggerDecision'] = () => 'Accept'

    beforeEach(() => {
        mockCredentialsProvider = new MockCredentialsProvider()
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
        expect((telemetryService as any).userContext).to.equal(mockUserContext)
    })

    it('updateOptOutPreference updates the optOutPreference property', () => {
        telemetryService = new TelemetryService(mockCredentialsProvider, 'bearer', {} as Telemetry, {})
        const mockOptOutPreference: OptOutPreference = 'OPTIN'
        telemetryService.updateOptOutPreference(mockOptOutPreference)
        expect((telemetryService as any).optOutPreference).to.equal(mockOptOutPreference)
    })

    it('updateEnableTelemetryEventsToDestination updates the enableTelemetryEventsToDestination property', () => {
        telemetryService = new TelemetryService(mockCredentialsProvider, 'bearer', {} as Telemetry, {})
        telemetryService.updateEnableTelemetryEventsToDestination(true)
        expect((telemetryService as any).enableTelemetryEventsToDestination).to.be.true
    })

    it('getSuggestionState fetches the suggestion state from CodeWhispererSession', () => {
        telemetryService = new TelemetryService(mockCredentialsProvider, 'bearer', {} as Telemetry, {})
        const getSuggestionState = (telemetryService as any).getSuggestionState.bind(telemetryService)
        let session = {
            getAggregatedUserTriggerDecision: () => {
                return 'Accept'
            },
        } as unknown as CodeWhispererSession
        let suggestionState = getSuggestionState(session)
        expect(suggestionState).to.equal('ACCEPT')

        session = {
            getAggregatedUserTriggerDecision: () => {
                return 'Reject'
            },
        } as unknown as CodeWhispererSession
        suggestionState = getSuggestionState(session)
        expect(suggestionState).to.equal('REJECT')

        session = {
            getAggregatedUserTriggerDecision: () => {
                return 'Discard'
            },
        } as unknown as CodeWhispererSession
        suggestionState = getSuggestionState(session)
        expect(suggestionState).to.equal('DISCARD')

        session = {
            getAggregatedUserTriggerDecision: () => {
                return 'Empty'
            },
        } as unknown as CodeWhispererSession
        suggestionState = getSuggestionState(session)
        expect(suggestionState).to.equal('EMPTY')

        session = {
            getAggregatedUserTriggerDecision: () => {
                return undefined
            },
        } as unknown as CodeWhispererSession
        suggestionState = getSuggestionState(session)
        expect(suggestionState).to.equal('EMPTY')
    })

    it('should not emit user trigger decision if login is invalid (IAM)', () => {
        telemetryService = new TelemetryService(mockCredentialsProvider, 'iam', {} as Telemetry, {})
        const invokeSendTelemetryEventStub: sinon.SinonStub = sinon.stub(telemetryService, 'sendTelemetryEvent' as any)
        telemetryService.emitUserTriggerDecision(mockSession as CodeWhispererSession)
        sinon.assert.notCalled(invokeSendTelemetryEventStub)
        sinon.restore()
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
        sinon.restore()
    })

    it('should emit user trigger decision event correctly', () => {
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
        expect(invokeSendTelemetryEventStub.calledOnce).to.be.true
        const actualArguments = invokeSendTelemetryEventStub.firstCall.args[0]
        expect(actualArguments.telemetryEvent.userTriggerDecisionEvent).to.deep.include(
            expectedUserTriggerDecisionEvent.telemetryEvent.userTriggerDecisionEvent
        )
        sinon.restore()
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
            expect(invokeSendTelemetryEventStub.calledOnce).to.be.true
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
            expect(invokeSendTelemetryEventStub.firstCall.args[0]).to.deep.equal(expectedEvent)
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
            expect(invokeSendTelemetryEventStub.called).to.be.false
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
            expect(invokeSendTelemetryEventStub.called).to.be.false
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
            expect(invokeSendTelemetryEventStub.called).to.be.false
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
            })
            expect(invokeSendTelemetryEventStub.calledOnce).to.be.true
            const calledArg = invokeSendTelemetryEventStub.firstCall.args[0]
            expect(calledArg.telemetryEvent.chatInteractWithMessageEvent.acceptedLineCount).to.be.undefined
        })
    })

    it('should emit CodeCoverageEvent event', () => {
        const timestamp = new Date(Date.now())
        const expectedEvent = {
            codeCoverageEvent: {
                customizationArn: 'test-arn',
                programmingLanguage: { languageName: 'typescript' },
                acceptedCharacterCount: 123,
                totalCharacterCount: 456,
                // timestamp,
            },
        }
        mockCredentialsProvider.setConnectionMetadata({
            sso: {
                startUrl: 'idc-start-url',
            },
        })
        telemetryService = new TelemetryService(mockCredentialsProvider, 'bearer', {} as Telemetry, {})
        const invokeSendTelemetryEventSpy: sinon.SinonSpy = sinon.spy(
            telemetryService,
            'invokeSendTelemetryEvent' as any
        )
        telemetryService.updateOptOutPreference('OPTIN')

        telemetryService.emitCodeCoverageEvent({
            languageId: 'typescript',
            customizationArn: 'test-arn',
            acceptedCharacterCount: 123,
            totalCharacterCount: 456,
        })

        sinon.assert.calledOnce(invokeSendTelemetryEventSpy)
        sinon.assert.calledWith(invokeSendTelemetryEventSpy, sinon.match(expectedEvent))
        invokeSendTelemetryEventSpy.restore()
    })
})
