import { TelemetryService } from './telemetryService'
import {
    BearerCredentials,
    ConnectionMetadata,
    CredentialsProvider,
    CredentialsType,
    IamCredentials,
    Logging,
    Telemetry,
    Workspace,
    SDKInitializator,
    SDKClientConstructorV2,
    SDKClientConstructorV3,
    SsoConnectionType,
} from '@aws/language-server-runtimes/server-interface'
import { UserContext, OptOutPreference } from '../client/token/codewhispererbearertokenclient'
import { CodeWhispererSession } from './session/sessionManager'
import sinon from 'ts-sinon'
import { BUILDER_ID_START_URL } from './constants'
import { ChatInteractionType } from './telemetry/types'
import { Service } from 'aws-sdk'
import { ServiceConfigurationOptions } from 'aws-sdk/lib/service'

class MockCredentialsProvider implements CredentialsProvider {
    private mockIamCredentials: IamCredentials | undefined
    private mockBearerCredentials: BearerCredentials | undefined
    private mockConnectionMetadata: ConnectionMetadata | undefined
    private mockConnectionType: SsoConnectionType | undefined

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

    getConnectionType(): SsoConnectionType {
        return this.mockConnectionType ?? 'none'
    }

    setConnectionMetadata(metadata: ConnectionMetadata | undefined) {
        this.mockConnectionMetadata = metadata
    }

    setConnectionType(connectionType: SsoConnectionType | undefined) {
        this.mockConnectionType = connectionType
    }
}

describe('TelemetryService', () => {
    let telemetry: Telemetry
    let clock: sinon.SinonFakeTimers
    let telemetryService: TelemetryService
    let mockCredentialsProvider: MockCredentialsProvider
    const mockAwsQRegion: string = 'mock-aws-q-region'
    const mockAwsQEndpointUrl: string = 'mock-aws-q-endpoint-url'

    const logging: Logging = {
        log: (message: string) => {
            console.log(message)
        },
    } as Logging
    const mockWorkspace = {} as unknown as Workspace
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
        startPosition: {
            line: 12,
            character: 23,
        },
    }

    const mockSdkRuntimeConfigurator: SDKInitializator = Object.assign(
        // Default callable function for v3 clients
        <T, P>(Ctor: SDKClientConstructorV3<T, P>, current_config: P): T => new Ctor({ ...current_config }),
        // Property for v2 clients
        {
            v2: <T extends Service, P extends ServiceConfigurationOptions>(
                Ctor: SDKClientConstructorV2<T, P>,
                current_config: P
            ): T => new Ctor({ ...current_config }),
        }
    )

    beforeEach(() => {
        clock = sinon.useFakeTimers({
            now: 1483228800000,
        })
        mockCredentialsProvider = new MockCredentialsProvider()
        telemetry = {
            emitMetric: sinon.stub(),
            onClientTelemetry: sinon.stub(),
        }
    })

    afterEach(() => {
        clock.restore()
        sinon.restore()
    })

    it('updateUserContext updates the userContext property', () => {
        telemetryService = new TelemetryService(
            mockCredentialsProvider,
            'bearer',
            {} as Telemetry,
            logging,
            mockWorkspace,
            mockAwsQRegion,
            mockAwsQEndpointUrl,
            mockSdkRuntimeConfigurator
        )
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
        telemetryService = new TelemetryService(
            mockCredentialsProvider,
            'bearer',
            {} as Telemetry,
            logging,
            mockWorkspace,
            mockAwsQRegion,
            mockAwsQEndpointUrl,
            mockSdkRuntimeConfigurator
        )
        const mockOptOutPreference: OptOutPreference = 'OPTIN'
        telemetryService.updateOptOutPreference(mockOptOutPreference)

        sinon.assert.match((telemetryService as any).optOutPreference, mockOptOutPreference)
    })

    it('updateEnableTelemetryEventsToDestination updates the enableTelemetryEventsToDestination property', () => {
        telemetryService = new TelemetryService(
            mockCredentialsProvider,
            'bearer',
            {} as Telemetry,
            logging,
            mockWorkspace,
            mockAwsQRegion,
            mockAwsQEndpointUrl,
            mockSdkRuntimeConfigurator
        )
        telemetryService.updateEnableTelemetryEventsToDestination(true)

        sinon.assert.match((telemetryService as any).enableTelemetryEventsToDestination, true)
    })

    it('getSuggestionState fetches the suggestion state from CodeWhispererSession', () => {
        telemetryService = new TelemetryService(
            mockCredentialsProvider,
            'bearer',
            {} as Telemetry,
            logging,
            mockWorkspace,
            mockAwsQRegion,
            mockAwsQEndpointUrl,
            mockSdkRuntimeConfigurator
        )
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
        telemetryService = new TelemetryService(
            mockCredentialsProvider,
            'iam',
            telemetry,
            logging,
            mockWorkspace,
            mockAwsQRegion,
            mockAwsQEndpointUrl,
            mockSdkRuntimeConfigurator
        )
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
        telemetryService = new TelemetryService(
            mockCredentialsProvider,
            'bearer',
            telemetry,
            logging,
            mockWorkspace,
            mockAwsQRegion,
            mockAwsQEndpointUrl,
            mockSdkRuntimeConfigurator
        )
        const invokeSendTelemetryEventStub: sinon.SinonStub = sinon.stub(telemetryService, 'sendTelemetryEvent' as any)
        telemetryService.updateOptOutPreference('OPTOUT')

        telemetryService.emitUserTriggerDecision(mockSession as CodeWhispererSession)

        sinon.assert.notCalled(invokeSendTelemetryEventStub)
    })

    it('should handle SSO connection type change at runtime', () => {
        telemetryService = new TelemetryService(
            mockCredentialsProvider,
            'bearer',
            telemetry,
            logging,
            mockWorkspace,
            mockAwsQRegion,
            mockAwsQEndpointUrl,
            mockSdkRuntimeConfigurator
        )
        const sendTelemetryEventStub: sinon.SinonStub = sinon
            .stub(telemetryService, 'sendTelemetryEvent' as any)
            .returns(Promise.resolve())
        telemetryService.updateOptOutPreference('OPTOUT') // Disables telemetry for builderId startUrl
        mockCredentialsProvider.setConnectionMetadata({
            sso: {
                startUrl: 'https://some-random-test-idc-directory.awsapps.com',
            },
        })

        // Emitting event with IdC connection
        telemetryService.emitUserTriggerDecision(mockSession as CodeWhispererSession)

        sinon.assert.calledOnce(sendTelemetryEventStub)

        // Switch to BuilderId connection
        mockCredentialsProvider.setConnectionMetadata({
            sso: {
                startUrl: BUILDER_ID_START_URL,
            },
        })
        sendTelemetryEventStub.resetHistory()

        // Should not emit event anymore with BuilderId
        telemetryService.emitUserTriggerDecision(mockSession as CodeWhispererSession)
        sinon.assert.notCalled(sendTelemetryEventStub)
    })

    it('should emit userTriggerDecision event to STE and to the destination', () => {
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
                    acceptedCharacterCount: 17,
                },
            },
            optOutPreference: 'OPTIN',
        }
        mockCredentialsProvider.setConnectionMetadata({
            sso: {
                startUrl: 'idc-start-url',
            },
        })
        telemetryService = new TelemetryService(
            mockCredentialsProvider,
            'bearer',
            telemetry,
            logging,
            mockWorkspace,
            mockAwsQRegion,
            mockAwsQEndpointUrl,
            mockSdkRuntimeConfigurator
        )
        telemetryService.updateEnableTelemetryEventsToDestination(true)
        const invokeSendTelemetryEventStub: sinon.SinonStub = sinon
            .stub(telemetryService, 'sendTelemetryEvent' as any)
            .returns(Promise.resolve())
        telemetryService.updateOptOutPreference('OPTIN')

        telemetryService.emitUserTriggerDecision(mockSession as CodeWhispererSession)

        sinon.assert.calledOnceWithExactly(invokeSendTelemetryEventStub, expectedUserTriggerDecisionEvent)
        sinon.assert.calledOnceWithExactly(telemetry.emitMetric as sinon.SinonStub, {
            name: 'codewhisperer_userTriggerDecision',
            data: {
                codewhispererSessionId: 'test-session-id',
                codewhispererFirstRequestId: 'test-request-id',
                credentialStartUrl: undefined,
                codewhispererSuggestionState: 'Accept',
                codewhispererCompletionType: 'Block',
                codewhispererLanguage: 'tsx',
                codewhispererTriggerType: undefined,
                codewhispererAutomatedTriggerType: undefined,
                codewhispererTriggerCharacter: undefined,
                codewhispererLineNumber: 12,
                codewhispererCursorOffset: 23,
                codewhispererSuggestionCount: 1,
                codewhispererClassifierResult: undefined,
                codewhispererClassifierThreshold: undefined,
                codewhispererTotalShownTime: 0,
                codewhispererTypeaheadLength: 0,
                codewhispererTimeSinceLastDocumentChange: undefined,
                codewhispererTimeSinceLastUserDecision: undefined,
                codewhispererTimeToFirstRecommendation: 200,
                codewhispererPreviousSuggestionState: undefined,
                codewhispererSupplementalContextTimeout: undefined,
                codewhispererSupplementalContextIsUtg: undefined,
                codewhispererSupplementalContextLength: undefined,
                codewhispererCustomizationArn: 'test-arn',
            },
        })
    })

    it('should not emit userTriggerDecision event to destination when enableTelemetryEventsToDestination is disabled', () => {
        mockCredentialsProvider.setConnectionMetadata({
            sso: {
                startUrl: BUILDER_ID_START_URL,
            },
        })
        telemetryService = new TelemetryService(
            mockCredentialsProvider,
            'bearer',
            telemetry,
            logging,
            mockWorkspace,
            mockAwsQRegion,
            mockAwsQEndpointUrl,
            mockSdkRuntimeConfigurator
        )
        telemetryService.updateEnableTelemetryEventsToDestination(false)
        telemetryService.updateOptOutPreference('OPTOUT')
        telemetryService.emitUserTriggerDecision(mockSession as CodeWhispererSession)
        sinon.assert.neverCalledWithMatch(telemetry.emitMetric as sinon.SinonStub, {
            name: 'codewhisperer_userTriggerDecision',
        })
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
            telemetryService = new TelemetryService(
                mockCredentialsProvider,
                'bearer',
                telemetry,
                logging,
                mockWorkspace,
                mockAwsQRegion,
                mockAwsQEndpointUrl,
                mockSdkRuntimeConfigurator
            )
            invokeSendTelemetryEventStub = sinon
                .stub(telemetryService, 'sendTelemetryEvent' as any)
                .returns(Promise.resolve())
        })

        afterEach(() => {
            sinon.restore()
        })

        it('should send InteractWithMessage event with correct parameters and emit metric to destination', () => {
            const metric = {
                cwsprChatMessageId: 'message123',
                codewhispererCustomizationArn: 'arn:123',
                cwsprChatInteractionType: ChatInteractionType.InsertAtCursor,
                cwsprChatInteractionTarget: 'CODE',
                cwsprChatAcceptedCharactersLength: 100,
            }
            const conversationId = 'conv123'
            const acceptedLineCount = 5
            telemetryService.updateEnableTelemetryEventsToDestination(true)
            telemetryService.emitChatInteractWithMessage(metric, {
                conversationId,
                acceptedLineCount,
            })

            const expectedEvent = {
                telemetryEvent: {
                    chatInteractWithMessageEvent: {
                        conversationId: conversationId,
                        messageId: metric.cwsprChatMessageId,
                        customizationArn: 'arn:123',
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
            sinon.assert.calledOnceWithExactly(telemetry.emitMetric as sinon.SinonStub, {
                name: 'amazonq_interactWithMessage',
                data: {
                    cwsprChatMessageId: 'message123',
                    codewhispererCustomizationArn: 'arn:123',
                    cwsprChatInteractionType: 'insertAtCursor',
                    cwsprChatInteractionTarget: 'CODE',
                    cwsprChatAcceptedCharactersLength: 100,
                    cwsprChatConversationId: 'conv123',
                    credentialStartUrl: 'idc-start-url',
                },
            })
        })

        it('should not send InteractWithMessage event to destination when enableTelemetryEventsToDestination flag is disabled', () => {
            const metric = {
                cwsprChatMessageId: 'message123',
                codewhispererCustomizationArn: 'arn:123',
                cwsprChatInteractionType: ChatInteractionType.InsertAtCursor,
                cwsprChatInteractionTarget: 'CODE',
                cwsprChatAcceptedCharactersLength: 100,
            }
            const conversationId = 'conv123'
            const acceptedLineCount = 5
            mockCredentialsProvider.setConnectionMetadata({
                sso: {
                    startUrl: BUILDER_ID_START_URL,
                },
            })
            telemetryService = new TelemetryService(
                mockCredentialsProvider,
                'bearer',
                {} as Telemetry,
                logging,
                mockWorkspace,
                mockAwsQRegion,
                mockAwsQEndpointUrl,
                mockSdkRuntimeConfigurator
            )
            telemetryService.updateEnableTelemetryEventsToDestination(false)
            telemetryService.updateOptOutPreference('OPTOUT')
            telemetryService.emitChatInteractWithMessage(metric, {
                conversationId,
                acceptedLineCount,
            })
            sinon.assert.neverCalledWithMatch(telemetry.emitMetric as sinon.SinonStub, {
                name: 'amazonq_interactWithMessage',
            })
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
            telemetryService = new TelemetryService(
                mockCredentialsProvider,
                'iam',
                telemetry,
                logging,
                mockWorkspace,
                mockAwsQRegion,
                mockAwsQEndpointUrl,
                mockSdkRuntimeConfigurator
            )
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
            telemetryService = new TelemetryService(
                mockCredentialsProvider,
                'bearer',
                telemetry,
                logging,
                mockWorkspace,
                mockAwsQRegion,
                mockAwsQEndpointUrl,
                mockSdkRuntimeConfigurator
            )
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

    it('should emit CodeCoverageEvent event to STE and to the destination', () => {
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
        telemetryService = new TelemetryService(
            mockCredentialsProvider,
            'bearer',
            telemetry,
            logging,
            mockWorkspace,
            mockAwsQRegion,
            mockAwsQEndpointUrl,
            mockSdkRuntimeConfigurator
        )
        const invokeSendTelemetryEventStub: sinon.SinonStub = sinon
            .stub(telemetryService, 'sendTelemetryEvent' as any)
            .returns(Promise.resolve())
        telemetryService.updateOptOutPreference('OPTIN')
        telemetryService.updateEnableTelemetryEventsToDestination(true)

        telemetryService.emitCodeCoverageEvent(
            {
                languageId: 'typescript',
                customizationArn: 'test-arn',
                acceptedCharacterCount: 123,
                totalCharacterCount: 456,
            },
            {
                percentage: 50,
                successCount: 1,
            }
        )

        sinon.assert.calledOnceWithExactly(invokeSendTelemetryEventStub, expectedEvent)
        sinon.assert.calledOnceWithExactly(telemetry.emitMetric as sinon.SinonStub, {
            name: 'codewhisperer_codePercentage',
            data: {
                codewhispererTotalTokens: 456,
                codewhispererLanguage: 'typescript',
                codewhispererSuggestedTokens: 123,
                codewhispererPercentage: 50,
                successCount: 1,
            },
        })
    })

    it('should not emit CodeCoverageEvent event to destination when enableTelemetryEventsToDestination flag is disabled', () => {
        mockCredentialsProvider.setConnectionMetadata({
            sso: {
                startUrl: BUILDER_ID_START_URL,
            },
        })
        telemetryService = new TelemetryService(
            mockCredentialsProvider,
            'bearer',
            telemetry,
            logging,
            mockWorkspace,
            mockAwsQRegion,
            mockAwsQEndpointUrl,
            mockSdkRuntimeConfigurator
        )
        telemetryService.updateOptOutPreference('OPTOUT')
        telemetryService.updateEnableTelemetryEventsToDestination(false)

        telemetryService.emitCodeCoverageEvent(
            {
                languageId: 'typescript',
                customizationArn: 'test-arn',
                acceptedCharacterCount: 123,
                totalCharacterCount: 456,
            },
            {
                percentage: 50,
                successCount: 1,
            }
        )
        sinon.assert.neverCalledWithMatch(telemetry.emitMetric as sinon.SinonStub, {
            name: 'codewhisperer_codePercentage',
        })
    })

    it('should emit userModificationEvent event', () => {
        mockCredentialsProvider.setConnectionMetadata({
            sso: {
                startUrl: 'idc-start-url',
            },
        })
        telemetryService = new TelemetryService(
            mockCredentialsProvider,
            'bearer',
            {} as Telemetry,
            logging,
            mockWorkspace,
            mockAwsQRegion,
            mockAwsQEndpointUrl,
            mockSdkRuntimeConfigurator
        )
        const invokeSendTelemetryEventStub: sinon.SinonStub = sinon
            .stub(telemetryService, 'sendTelemetryEvent' as any)
            .returns(Promise.resolve())
        telemetryService.updateOptOutPreference('OPTIN')

        telemetryService.emitUserModificationEvent({
            sessionId: 'test-session-id',
            requestId: 'test-request-id',
            languageId: 'typescript',
            customizationArn: 'test-arn',
            timestamp: new Date(),
            modificationPercentage: 0.2,
            acceptedCharacterCount: 100,
            unmodifiedAcceptedCharacterCount: 80,
        })

        const expectedEvent = {
            telemetryEvent: {
                userModificationEvent: {
                    sessionId: 'test-session-id',
                    requestId: 'test-request-id',
                    programmingLanguage: {
                        languageName: 'typescript',
                    },
                    modificationPercentage: 0.2,
                    customizationArn: 'test-arn',
                    timestamp: new Date(),
                    acceptedCharacterCount: 100,
                    unmodifiedAcceptedCharacterCount: 80,
                },
            },
            optOutPreference: 'OPTIN',
        }
        sinon.assert.calledOnceWithExactly(invokeSendTelemetryEventStub, expectedEvent)
    })

    it('should emit chatUserModificationEvent event including emitting event to destination', () => {
        mockCredentialsProvider.setConnectionMetadata({
            sso: {
                startUrl: 'idc-start-url',
            },
        })
        telemetryService = new TelemetryService(
            mockCredentialsProvider,
            'bearer',
            telemetry,
            logging,
            mockWorkspace,
            mockAwsQRegion,
            mockAwsQEndpointUrl,
            mockSdkRuntimeConfigurator
        )
        telemetryService.updateEnableTelemetryEventsToDestination(true)
        const invokeSendTelemetryEventStub: sinon.SinonStub = sinon
            .stub(telemetryService, 'sendTelemetryEvent' as any)
            .returns(Promise.resolve())
        telemetryService.updateOptOutPreference('OPTIN')

        telemetryService.emitChatUserModificationEvent({
            conversationId: 'test-conversation-id',
            messageId: 'test-message-id',
            customizationArn: 'test-arn',
            modificationPercentage: 0.2,
        })

        const expectedEvent = {
            telemetryEvent: {
                chatUserModificationEvent: {
                    conversationId: 'test-conversation-id',
                    messageId: 'test-message-id',
                    customizationArn: 'test-arn',
                    modificationPercentage: 0.2,
                },
            },
            optOutPreference: 'OPTIN',
        }
        sinon.assert.calledOnceWithExactly(invokeSendTelemetryEventStub, expectedEvent)
        sinon.assert.calledOnceWithExactly(telemetry.emitMetric as sinon.SinonStub, {
            name: 'amazonq_modifyCode',
            data: {
                cwsprChatConversationId: 'test-conversation-id',
                cwsprChatMessageId: 'test-message-id',
                cwsprChatModificationPercentage: 0.2,
                codewhispererCustomizationArn: 'test-arn',
                credentialStartUrl: 'idc-start-url',
            },
        })
    })

    it('should not emit chatUserModificationEvent event to destination when enableTelemetryEventsToDestination flag is disabled', () => {
        mockCredentialsProvider.setConnectionMetadata({
            sso: {
                startUrl: BUILDER_ID_START_URL,
            },
        })
        telemetryService = new TelemetryService(
            mockCredentialsProvider,
            'bearer',
            telemetry,
            logging,
            mockWorkspace,
            mockAwsQRegion,
            mockAwsQEndpointUrl,
            mockSdkRuntimeConfigurator
        )
        telemetryService.updateEnableTelemetryEventsToDestination(false)
        telemetryService.updateOptOutPreference('OPTOUT')
        telemetryService.emitChatUserModificationEvent({
            conversationId: 'test-conversation-id',
            messageId: 'test-message-id',
            customizationArn: 'test-arn',
            modificationPercentage: 0.2,
        })
        sinon.assert.neverCalledWithMatch(telemetry.emitMetric as sinon.SinonStub, {
            name: 'amazonq_modifyCode',
        })
    })

    describe('Chat add message', () => {
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
            telemetryService = new TelemetryService(
                mockCredentialsProvider,
                'bearer',
                telemetry,
                logging,
                mockWorkspace,
                mockAwsQRegion,
                mockAwsQEndpointUrl,
                mockSdkRuntimeConfigurator
            )
            invokeSendTelemetryEventStub = sinon
                .stub(telemetryService, 'sendTelemetryEvent' as any)
                .returns(Promise.resolve())
        })

        afterEach(() => {
            sinon.restore()
        })

        it('should send ChatAddMessage event with correct parameters and emit metric to destination', () => {
            telemetryService.updateEnableTelemetryEventsToDestination(true)
            telemetryService.emitChatAddMessage(
                {
                    conversationId: 'conv123',
                    messageId: 'message123',
                    customizationArn: 'cust-123',
                    programmingLanguage: 'jsx',
                    userIntent: 'SUGGEST_ALTERNATE_IMPLEMENTATION',
                    hasCodeSnippet: false,
                    timeToFirstChunkMilliseconds: 100,
                    activeEditorTotalCharacters: 250,
                    fullResponselatency: 400,
                    requestLength: 100,
                    responseLength: 3000,
                    numberOfCodeBlocks: 0,
                },
                {}
            )

            const expectedEvent = {
                telemetryEvent: {
                    chatAddMessageEvent: {
                        conversationId: 'conv123',
                        messageId: 'message123',
                        customizationArn: 'cust-123',
                        userIntent: 'SUGGEST_ALTERNATE_IMPLEMENTATION',
                        hasCodeSnippet: false,
                        programmingLanguage: {
                            languageName: 'javascript',
                        },
                        activeEditorTotalCharacters: 250,
                        timeToFirstChunkMilliseconds: 100,
                        timeBetweenChunks: undefined,
                        fullResponselatency: 400,
                        requestLength: 100,
                        responseLength: 3000,
                        numberOfCodeBlocks: 0,
                        hasProjectLevelContext: false,
                    },
                },
            }

            sinon.assert.calledOnceWithExactly(invokeSendTelemetryEventStub, expectedEvent)
            sinon.assert.calledOnceWithExactly(telemetry.emitMetric as sinon.SinonStub, {
                name: 'amazonq_addMessage',
                data: {
                    credentialStartUrl: 'idc-start-url',
                    cwsprChatConversationId: 'conv123',
                    cwsprChatHasCodeSnippet: false,
                    cwsprChatTriggerInteraction: undefined,
                    cwsprChatMessageId: 'message123',
                    cwsprChatUserIntent: 'SUGGEST_ALTERNATE_IMPLEMENTATION',
                    cwsprChatProgrammingLanguage: 'jsx',
                    cwsprChatResponseCodeSnippetCount: 0,
                    cwsprChatResponseCode: undefined,
                    cwsprChatSourceLinkCount: undefined,
                    cwsprChatReferencesCount: undefined,
                    cwsprChatFollowUpCount: undefined,
                    cwsprTimeToFirstChunk: 100,
                    cwsprChatFullResponseLatency: 400,
                    cwsprChatTimeBetweenChunks: undefined,
                    cwsprChatRequestLength: 100,
                    cwsprChatResponseLength: 3000,
                    cwsprChatConversationType: undefined,
                    cwsprChatActiveEditorTotalCharacters: 250,
                    cwsprChatActiveEditorImportCount: undefined,
                    codewhispererCustomizationArn: 'cust-123',
                },
            })
        })

        it('should not send ChatAddMessage event to destination when enableTelemetryEventsToDestination flag is disabled', () => {
            mockCredentialsProvider.setConnectionMetadata({
                sso: {
                    startUrl: BUILDER_ID_START_URL,
                },
            })
            telemetryService = new TelemetryService(
                mockCredentialsProvider,
                'bearer',
                {} as Telemetry,
                logging,
                mockWorkspace,
                mockAwsQRegion,
                mockAwsQEndpointUrl,
                mockSdkRuntimeConfigurator
            )
            telemetryService.updateOptOutPreference('OPTOUT')
            telemetryService.updateEnableTelemetryEventsToDestination(false)
            telemetryService.emitChatAddMessage(
                {
                    conversationId: 'conv123',
                    messageId: 'message123',
                    customizationArn: 'cust-123',
                    programmingLanguage: 'jsx',
                    userIntent: 'SUGGEST_ALTERNATE_IMPLEMENTATION',
                    hasCodeSnippet: false,
                    timeToFirstChunkMilliseconds: 100,
                    activeEditorTotalCharacters: 250,
                    fullResponselatency: 400,
                    requestLength: 100,
                    responseLength: 3000,
                    numberOfCodeBlocks: 0,
                },
                {}
            )
            sinon.assert.neverCalledWithMatch(telemetry.emitMetric as sinon.SinonStub, {
                name: 'amazonq_addMessage',
            })
        })

        it('should not send ChatAddMessage when conversationId is undefined', () => {
            telemetryService.emitChatAddMessage(
                {
                    messageId: 'message123',
                    customizationArn: 'cust-123',
                },
                {}
            )
            sinon.assert.notCalled(invokeSendTelemetryEventStub)
        })

        it('should not send ChatAddMessage when messageId is undefined', () => {
            telemetryService.emitChatAddMessage(
                {
                    conversationId: 'conv123',
                    customizationArn: 'cust-123',
                },
                {}
            )
            sinon.assert.notCalled(invokeSendTelemetryEventStub)
        })

        it('should not send ChatAddMessage when credentialsType is IAM', () => {
            telemetryService = new TelemetryService(
                mockCredentialsProvider,
                'iam',
                telemetry,
                logging,
                mockWorkspace,
                mockAwsQRegion,
                mockAwsQEndpointUrl,
                mockSdkRuntimeConfigurator
            )
            invokeSendTelemetryEventStub = sinon.stub(telemetryService, 'sendTelemetryEvent' as any)
            telemetryService.emitChatAddMessage(
                {
                    conversationId: 'conv123',
                    messageId: 'message123',
                    customizationArn: 'cust-123',
                },
                {}
            )
            sinon.assert.notCalled(invokeSendTelemetryEventStub)
        })

        it('should not send ChatAddMessage when login is BuilderID, but user chose OPTOUT option', () => {
            mockCredentialsProvider.setConnectionMetadata({
                sso: {
                    startUrl: BUILDER_ID_START_URL,
                },
            })
            telemetryService = new TelemetryService(
                mockCredentialsProvider,
                'bearer',
                telemetry,
                logging,
                mockWorkspace,
                mockAwsQRegion,
                mockAwsQEndpointUrl,
                mockSdkRuntimeConfigurator
            )
            invokeSendTelemetryEventStub = sinon.stub(telemetryService, 'sendTelemetryEvent' as any)
            telemetryService.updateOptOutPreference('OPTOUT')
            telemetryService.emitChatAddMessage(
                {
                    conversationId: 'conv123',
                    messageId: 'message123',
                    customizationArn: 'cust-123',
                },
                {}
            )
            sinon.assert.notCalled(invokeSendTelemetryEventStub)
        })
    })
})
