import * as assert from 'assert'
import * as sinon from 'sinon'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { SessionResultsHandler } from './sessionResultsHandler'
import { SessionManager, SessionData } from '../session/sessionManager'
import { CodePercentageTracker } from '../tracker/codePercentageTracker'
import { RejectedEditTracker } from '../tracker/rejectedEditTracker'
import { StreakTracker } from '../tracker/streakTracker'
import { TelemetryService } from '../../../shared/telemetry/telemetryService'
import { AcceptedInlineSuggestionEntry, CodeDiffTracker } from '../tracker/codeDiffTracker'
import { SuggestionType } from '../../../shared/codeWhispererService'

describe('SessionResultsHandler', () => {
    const sessionData: SessionData = {
        document: TextDocument.create('file:///test.cs', 'csharp', 1, 'test content'),
        startPreprocessTimestamp: 0,
        startPosition: { line: 0, character: 0 },
        triggerType: 'OnDemand',
        language: 'csharp',
        requestContext: {
            maxResults: 5,
            fileContext: {
                filename: 'test.cs',
                programmingLanguage: { languageName: 'csharp' },
                leftFileContent: 'left',
                rightFileContent: 'right',
            },
        },
    }

    const sessionResultData = {
        sessionId: 'test-session-id',
        completionSessionResult: {
            'item-1': { seen: true, accepted: false, discarded: false },
        },
        firstCompletionDisplayLatency: 50,
        totalSessionDisplayTime: 1000,
        typeaheadLength: 10,
        isInlineEdit: false,
        addedDiagnostics: [],
        removedDiagnostics: [],
    }

    let handler: SessionResultsHandler
    let completionSessionManager: SessionManager
    let editSessionManager: SessionManager
    let codePercentageTracker: sinon.SinonStubbedInstance<CodePercentageTracker>
    let codeDiffTracker: sinon.SinonStubbedInstance<CodeDiffTracker<AcceptedInlineSuggestionEntry>>
    let rejectedEditTracker: sinon.SinonStubbedInstance<RejectedEditTracker>
    let streakTracker: sinon.SinonStubbedInstance<StreakTracker>
    let telemetryService: sinon.SinonStubbedInstance<TelemetryService>
    let telemetry: { emitMetric: sinon.SinonStub; onClientTelemetry: sinon.SinonStub }
    let logging: {
        log: sinon.SinonStub
        debug: sinon.SinonStub
        error: sinon.SinonStub
        warn: sinon.SinonStub
        info: sinon.SinonStub
    }

    beforeEach(() => {
        SessionManager.reset()
        completionSessionManager = SessionManager.getInstance('COMPLETIONS')
        editSessionManager = SessionManager.getInstance('EDITS')

        codePercentageTracker = sinon.createStubInstance(CodePercentageTracker)
        codeDiffTracker = sinon.createStubInstance(CodeDiffTracker)
        rejectedEditTracker = sinon.createStubInstance(RejectedEditTracker)
        streakTracker = sinon.createStubInstance(StreakTracker)
        telemetryService = sinon.createStubInstance(TelemetryService)

        telemetry = { emitMetric: sinon.stub(), onClientTelemetry: sinon.stub() }
        logging = {
            log: sinon.stub(),
            debug: sinon.stub(),
            error: sinon.stub(),
            warn: sinon.stub(),
            info: sinon.stub(),
        }

        handler = new SessionResultsHandler(
            logging,
            telemetry,
            telemetryService,
            completionSessionManager,
            editSessionManager,
            codePercentageTracker,
            codeDiffTracker,
            rejectedEditTracker,
            streakTracker,
            () => false,
            () => 1000
        )
    })

    it('should close session when results are processed', async () => {
        const session = completionSessionManager.createSession(sessionData)
        completionSessionManager.activateSession(session)
        session.id = 'test-session-id'

        await handler.handleSessionResults(sessionResultData)

        assert.equal(session.state, 'CLOSED')
    })

    it('should log error when session not found', async () => {
        await handler.handleSessionResults(sessionResultData)

        sinon.assert.calledWith(logging.log, 'ERROR: Session ID test-session-id was not found')
    })

    it('should log error when session not active', async () => {
        const session = completionSessionManager.createSession(sessionData)
        session.id = 'test-session-id'
        session.close()

        await handler.handleSessionResults(sessionResultData)

        sinon.assert.calledWith(
            logging.log,
            'ERROR: Trying to record trigger decision for not-active session test-session-id with wrong state CLOSED'
        )
    })

    it('should handle accepted completions suggestion', async () => {
        const session = completionSessionManager.createSession(sessionData)
        completionSessionManager.activateSession(session)
        session.id = 'test-session-id'
        session.suggestions = [{ itemId: 'item-1', content: 'test', insertText: 'test' }]

        const acceptedData = {
            ...sessionResultData,
            completionSessionResult: { 'item-1': { seen: true, accepted: true, discarded: false } },
        }

        await handler.handleSessionResults(acceptedData)

        sinon.assert.calledWith(codePercentageTracker.countSuccess, 'csharp')
        sinon.assert.calledWith(codePercentageTracker.countAcceptedTokens, 'csharp', 'test')
        sinon.assert.calledWith(codePercentageTracker.countTotalTokens, 'csharp', 'test', true)
        sinon.assert.called(codeDiffTracker.enqueue)
        assert.equal(session.state, 'CLOSED')
    })

    it('should handle accepted edits suggestions', async () => {
        const session = completionSessionManager.createSession(sessionData)
        completionSessionManager.activateSession(session)
        session.id = 'test-session-id'
        session.predictionType = SuggestionType.EDIT
        session.suggestions = [{ itemId: 'item-1', content: '-int\n+int = 5' }]

        const acceptedData = {
            ...sessionResultData,
            completionSessionResult: { 'item-1': { seen: true, accepted: true, discarded: false } },
        }

        await handler.handleSessionResults(acceptedData)

        sinon.assert.calledWith(codePercentageTracker.countSuccess, 'csharp')
        sinon.assert.calledWith(codePercentageTracker.countAcceptedTokensUsingCount, 'csharp', 4)
        sinon.assert.calledWith(codePercentageTracker.addTotalTokensForEdits, 'csharp', 4)
        sinon.assert.called(codeDiffTracker.enqueue)
        assert.equal(session.state, 'CLOSED')
    })

    it('should handle rejected edits suggestions', async () => {
        const session = editSessionManager.createSession(sessionData)
        editSessionManager.activateSession(session)
        session.id = 'test-session-id'
        session.suggestions = [{ itemId: 'item-1', content: 'rejected' }]

        const rejectedData = {
            ...sessionResultData,
            isInlineEdit: true,
        }

        await handler.handleSessionResults(rejectedData)

        sinon.assert.called(rejectedEditTracker.recordRejectedEdit)
        assert.equal(session.state, 'CLOSED')
    })

    describe('userDecisionReason', () => {
        it('should set ImplicitReject when reason is IMPLICIT_REJECT and suggestion was seen', async () => {
            const session = completionSessionManager.createSession(sessionData)
            completionSessionManager.activateSession(session)
            session.id = 'test-session-id'
            session.suggestions = [{ itemId: 'item-1', content: 'test' }]

            const implicitRejectData = {
                ...sessionResultData,
                completionSessionResult: { 'item-1': { seen: true, accepted: false, discarded: false } },
                reason: 'IMPLICIT_REJECT',
            }

            await handler.handleSessionResults(implicitRejectData)

            sinon.assert.calledOnce(telemetryService.emitUserTriggerDecision)
            const call = telemetryService.emitUserTriggerDecision.getCall(0)
            assert.equal(call.args[8], 'IMPLICIT_REJECT')
        })

        it('should set ExplicitReject when reason is not IMPLICIT_REJECT and suggestion was seen', async () => {
            const session = completionSessionManager.createSession(sessionData)
            completionSessionManager.activateSession(session)
            session.id = 'test-session-id'
            session.suggestions = [{ itemId: 'item-1', content: 'test' }]

            const explicitRejectData = {
                ...sessionResultData,
                completionSessionResult: { 'item-1': { seen: true, accepted: false, discarded: false } },
                reason: undefined,
            }

            await handler.handleSessionResults(explicitRejectData)

            sinon.assert.calledOnce(telemetryService.emitUserTriggerDecision)
            const call = telemetryService.emitUserTriggerDecision.getCall(0)
            assert.equal(call.args[8], 'EXPLICIT_REJECT')
        })

        it('should not set userDecisionReason when suggestion was not seen (discard)', async () => {
            const session = completionSessionManager.createSession(sessionData)
            completionSessionManager.activateSession(session)
            session.id = 'test-session-id'
            session.suggestions = [{ itemId: 'item-1', content: 'test' }]

            const discardData = {
                ...sessionResultData,
                completionSessionResult: { 'item-1': { seen: false, accepted: false, discarded: true } },
                reason: 'IMPLICIT_REJECT',
            }

            await handler.handleSessionResults(discardData)

            sinon.assert.calledOnce(telemetryService.emitUserTriggerDecision)
            const call = telemetryService.emitUserTriggerDecision.getCall(0)
            assert.equal(call.args[8], undefined)
        })

        it('should not set userDecisionReason when suggestion was accepted', async () => {
            const session = completionSessionManager.createSession(sessionData)
            completionSessionManager.activateSession(session)
            session.id = 'test-session-id'
            session.suggestions = [{ itemId: 'item-1', content: 'test', insertText: 'test' }]

            const acceptedData = {
                ...sessionResultData,
                completionSessionResult: { 'item-1': { seen: true, accepted: true, discarded: false } },
                reason: undefined,
            }

            await handler.handleSessionResults(acceptedData)

            sinon.assert.calledOnce(telemetryService.emitUserTriggerDecision)
            const call = telemetryService.emitUserTriggerDecision.getCall(0)
            assert.equal(call.args[8], undefined)
        })
    })
})
