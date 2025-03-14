import {
    Server,
    InlineCompletionListWithReferences,
    CancellationToken,
    InlineCompletionTriggerKind,
} from '@aws/language-server-runtimes/server-interface'
import { TestFeatures } from '@aws/language-server-runtimes/testing'
import * as assert from 'assert'
import sinon, { StubbedInstance, stubInterface } from 'ts-sinon'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { CodewhispererServerFactory } from '../codeWhispererServer'
import { CodeWhispererServiceBase, ResponseContext, Suggestion } from '../codeWhispererService'
import { CodeWhispererSession, SessionManager } from '../session/sessionManager'
import { TelemetryService } from '../telemetryService'

describe('Telemetry', () => {
    const sandbox = sinon.createSandbox()
    let SESSION_IDS_LOG: string[] = []
    let sessionManager: SessionManager
    let sessionManagerSpy: sinon.SinonSpiedInstance<SessionManager>
    let generateSessionIdStub: sinon.SinonStub
    let clock: sinon.SinonFakeTimers
    let telemetryServiceSpy: sinon.SinonSpy

    beforeEach(() => {
        const StubSessionIdGenerator = () => {
            let id = 'some-random-session-uuid-' + SESSION_IDS_LOG.length
            SESSION_IDS_LOG.push(id)

            return id
        }
        generateSessionIdStub = sinon
            .stub(CodeWhispererSession.prototype, 'generateSessionId')
            .callsFake(StubSessionIdGenerator)
        SessionManager.reset()
        sessionManager = SessionManager.getInstance()
        sessionManagerSpy = sandbox.spy(sessionManager)
        SESSION_IDS_LOG = []

        clock = sinon.useFakeTimers({
            now: 1483228800000,
        })
        telemetryServiceSpy = sinon.spy(TelemetryService.prototype, 'emitUserTriggerDecision')
    })

    afterEach(() => {
        generateSessionIdStub.restore()
        clock.restore()
        sandbox.restore()
        telemetryServiceSpy.restore()
    })
})
