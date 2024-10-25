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
import { UserContext, OptOutPreference, UserTriggerDecisionEvent } from '../client/token/codewhispererbearertokenclient'
import { CodeWhispererSession } from './session/sessionManager'
import sinon from 'ts-sinon'

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

    setIamCredentials(credentials: IamCredentials | undefined) {
        this.mockIamCredentials = credentials
    }

    setConnectionMetadata(metadata: ConnectionMetadata | undefined) {
        console.log('coming here?')
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
        language: 'typescript',
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
        firstCompletionDisplayLatency: 100,
        timeToFirstRecommendation: 200,
    }
    mockSession['getAggregatedUserTriggerDecision'] = () => 'Accept'

    beforeEach(() => {
        mockCredentialsProvider = new MockCredentialsProvider()
    })

    it('updateUserContext updates the userContext property', () => {
        telemetryService = new TelemetryService(mockCredentialsProvider, {}, {} as Telemetry)
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
        telemetryService = new TelemetryService(mockCredentialsProvider, {}, {} as Telemetry)
        const mockOptOutPreference: OptOutPreference = 'OPTIN'
        telemetryService.updateOptOutPreference(mockOptOutPreference)
        expect((telemetryService as any).optOutPreference).to.equal(mockOptOutPreference)
    })

    it('updateEnableTelemetryEventsToDestination updates the enableTelemetryEventsToDestination property', () => {
        telemetryService = new TelemetryService(mockCredentialsProvider, {}, {} as Telemetry)
        telemetryService.updateEnableTelemetryEventsToDestination(true)
        expect((telemetryService as any).enableTelemetryEventsToDestination).to.be.true
    })

    it('getSuggestionState fetches the suggestion state from CodeWhispererSession', () => {
        telemetryService = new TelemetryService(mockCredentialsProvider, {}, {} as Telemetry)
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
        mockCredentialsProvider.setIamCredentials({
            accessKeyId: 'accessKey',
            secretAccessKey: 'secretKey',
        })
        telemetryService = new TelemetryService(mockCredentialsProvider, {}, {} as Telemetry)
        telemetryService.emitUserTriggerDecision(mockSession as CodeWhispererSession)
        const invokeSendTelemetryEventSpy: sinon.SinonSpy = sinon.spy(
            telemetryService,
            'invokeSendTelemetryEvent' as any
        )
        sinon.assert.notCalled(invokeSendTelemetryEventSpy)
    })

    it('should not emit user trigger decision if login is invalid (idc but OPTOUT)', () => {
        mockCredentialsProvider.setConnectionMetadata({
            sso: {
                startUrl: 'idc-start-url',
            },
        })
        telemetryService = new TelemetryService(mockCredentialsProvider, {}, {} as Telemetry)
        telemetryService.updateOptOutPreference('OPTOUT')
        telemetryService.emitUserTriggerDecision(mockSession as CodeWhispererSession)
        const invokeSendTelemetryEventSpy: sinon.SinonSpy = sinon.spy(
            telemetryService,
            'invokeSendTelemetryEvent' as any
        )
        sinon.assert.notCalled(invokeSendTelemetryEventSpy)
    })

    it('should emit user trigger decision event correctly', () => {
        const expectedEvent: Partial<UserTriggerDecisionEvent> = {
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
        }
        mockCredentialsProvider.setIamCredentials(undefined)
        mockCredentialsProvider.setConnectionMetadata({
            sso: {
                startUrl: 'idc-start-url',
            },
        })
        telemetryService = new TelemetryService(mockCredentialsProvider, {}, {} as Telemetry)
        const invokeSendTelemetryEventSpy: sinon.SinonSpy = sinon.spy(
            telemetryService,
            'invokeSendTelemetryEvent' as any
        )
        telemetryService.updateOptOutPreference('OPTIN')
        telemetryService.emitUserTriggerDecision(mockSession as CodeWhispererSession)
        sinon.assert.calledOnce(invokeSendTelemetryEventSpy)
        sinon.assert.calledWith(invokeSendTelemetryEventSpy, sinon.match(expectedEvent))
        invokeSendTelemetryEventSpy.restore()
    })
})
