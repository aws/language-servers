import * as assert from 'assert'
import * as sinon from 'sinon'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { InlineCompletionHandler } from './inlineCompletionHandler'
import { SessionManager } from '../session/sessionManager'
import { CodePercentageTracker } from '../tracker/codePercentageTracker'
import { RecentEditTracker } from '../tracker/codeEditTracker'
import { CursorTracker } from '../tracker/cursorTracker'
import { StreakTracker } from '../tracker/streakTracker'
import { TelemetryService } from '../../../shared/telemetry/telemetryService'
import { UserWrittenCodeTracker } from '../../../shared/userWrittenCodeTracker'
import { InlineCompletionTriggerKind, CancellationToken } from '@aws/language-server-runtimes/server-interface'
import { EMPTY_RESULT } from '../contants/constants'
import * as IdleWorkspaceManagerModule from '../../workspaceContext/IdleWorkspaceManager'
import * as telemetryModule from '../telemetry/telemetry'
import * as textDocumentUtils from '../utils/textDocumentUtils'

describe('InlineCompletionHandler', () => {
    const testDocument = TextDocument.create('file:///test.cs', 'csharp', 1, 'test content')

    const completionParams = {
        textDocument: { uri: testDocument.uri },
        position: { line: 0, character: 0 },
        context: { triggerKind: InlineCompletionTriggerKind.Invoked },
    }

    let handler: InlineCompletionHandler
    let completionSessionManager: SessionManager
    let amazonQServiceManager: any
    let codePercentageTracker: sinon.SinonStubbedInstance<CodePercentageTracker>
    let userWrittenCodeTracker: sinon.SinonStubbedInstance<UserWrittenCodeTracker>
    let recentEditTracker: sinon.SinonStubbedInstance<RecentEditTracker>
    let cursorTracker: sinon.SinonStubbedInstance<CursorTracker>
    let streakTracker: sinon.SinonStubbedInstance<StreakTracker>
    let telemetryService: sinon.SinonStubbedInstance<TelemetryService>
    let lsp: any
    let telemetry: any
    let credentialsProvider: any
    let workspace: any
    let logging: any
    let getTextDocumentStub: sinon.SinonStub

    beforeEach(() => {
        SessionManager.reset()
        completionSessionManager = SessionManager.getInstance('COMPLETIONS')

        amazonQServiceManager = {
            getCodewhispererService: sinon.stub(),
            getConfiguration: sinon.stub().returns({ inlineSuggestions: {} }),
        }
        codePercentageTracker = sinon.createStubInstance(CodePercentageTracker)
        userWrittenCodeTracker = sinon.createStubInstance(UserWrittenCodeTracker)
        recentEditTracker = sinon.createStubInstance(RecentEditTracker)
        cursorTracker = sinon.createStubInstance(CursorTracker)
        streakTracker = sinon.createStubInstance(StreakTracker)
        telemetryService = sinon.createStubInstance(TelemetryService)

        workspace = { getWorkspaceFolder: sinon.stub() }
        logging = { log: sinon.stub(), debug: sinon.stub() }
        lsp = { getClientInitializeParams: sinon.stub() } as any
        telemetry = { emitMetric: sinon.stub() } as any
        credentialsProvider = { getConnectionMetadata: sinon.stub() } as any

        // Stub IdleWorkspaceManager, telemetry functions, and textDocumentUtils
        sinon.stub(IdleWorkspaceManagerModule.IdleWorkspaceManager, 'recordActivityTimestamp')
        sinon.stub(telemetryModule, 'emitServiceInvocationTelemetry')
        sinon.stub(telemetryModule, 'emitServiceInvocationFailure')
        sinon.stub(telemetryModule, 'emitUserTriggerDecisionTelemetry')
        getTextDocumentStub = sinon.stub(textDocumentUtils, 'getTextDocument')

        handler = new InlineCompletionHandler(
            logging,
            workspace,
            amazonQServiceManager,
            completionSessionManager,
            codePercentageTracker,
            userWrittenCodeTracker,
            recentEditTracker,
            cursorTracker,
            streakTracker,
            telemetry,
            telemetryService,
            credentialsProvider,
            () => false,
            () => 1000,
            lsp
        )
    })

    afterEach(() => {
        sinon.restore()
    })

    it('should return empty result when concurrent request is in progress', async () => {
        // Make handler busy
        handler['isOnInlineCompletionHandlerInProgress'] = true

        const result = await handler.onInlineCompletion(completionParams, CancellationToken.None)

        assert.deepEqual(result, EMPTY_RESULT)
        sinon.assert.calledWith(logging.log, 'Skip concurrent inline completion')
    })

    it('should return empty result when service manager not initialized', async () => {
        handler = new InlineCompletionHandler(
            logging,
            workspace,
            null as any,
            completionSessionManager,
            codePercentageTracker,
            userWrittenCodeTracker,
            recentEditTracker,
            cursorTracker,
            streakTracker,
            { emitMetric: sinon.stub() } as any,
            telemetryService,
            { getConnectionMetadata: sinon.stub() } as any,
            () => false,
            () => 1000,
            { getClientInitializeParams: sinon.stub() } as any
        )

        const result = await handler.onInlineCompletion(completionParams, CancellationToken.None)

        assert.deepEqual(result, EMPTY_RESULT)
        sinon.assert.calledWith(logging.log, 'Amazon Q Service Manager not initialized yet')
    })

    it('should return empty result when text document not found', async () => {
        getTextDocumentStub.resolves(null)

        const result = await handler.onInlineCompletion(completionParams, CancellationToken.None)

        assert.deepEqual(result, EMPTY_RESULT)
        sinon.assert.calledWith(logging.log, `textDocument [${testDocument.uri}] not found`)
    })

    it('should track cursor position when cursor tracker available', async () => {
        getTextDocumentStub.resolves(null) // Will return early

        await handler.onInlineCompletion(completionParams, CancellationToken.None)

        sinon.assert.calledWith(cursorTracker.trackPosition, testDocument.uri, completionParams.position)
    })
})
