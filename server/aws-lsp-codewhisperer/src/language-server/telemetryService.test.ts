import { expect } from 'chai'
import { TelemetryService } from './telemetryService'
import { CredentialsProvider, Telemetry } from '@aws/language-server-runtimes/server-interface'
import { UserContext, OptOutPreference } from '../client/token/codewhispererbearertokenclient'
import { CodeWhispererSession, SessionData } from './session/sessionManager'

describe('TelemetryService', () => {
    let telemetryService: TelemetryService
    let mockCredentialsProvider: CredentialsProvider

    beforeEach(() => {
        mockCredentialsProvider = {} as CredentialsProvider
        telemetryService = new TelemetryService(mockCredentialsProvider)
    })

    it('setToolkitTelemetry sets the toolkitTelemetry property', () => {
        const mockTelemetry = {} as Telemetry
        telemetryService.setToolkitTelemetry(mockTelemetry)
        expect((telemetryService as any).toolkitTelemetry).to.equal(mockTelemetry)
    })

    it('updateUserContext updates the userContext property', () => {
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
        const mockOptOutPreference: OptOutPreference = 'OPTIN'
        telemetryService.updateOptOutPreference(mockOptOutPreference)
        expect((telemetryService as any).optOutPreference).to.equal(mockOptOutPreference)
    })

    it('updateEnableTelemetryEventsToDestination updates the enableTelemetryEventsToDestination property', () => {
        telemetryService.updateEnableTelemetryEventsToDestination(true)
        expect((telemetryService as any).enableTelemetryEventsToDestination).to.be.true
    })

    it('getSuggestionState fetches the suggestion state from CodeWhispererSession', () => {
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
        expect(suggestionState).to.equal('')
    })
})
