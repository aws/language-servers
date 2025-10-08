import * as assert from 'assert'
import * as sinon from 'sinon'
import { shouldTriggerEdits, NepTrigger } from './triggerUtils'
import { SessionManager } from '../session/sessionManager'
import { CursorTracker } from '../tracker/cursorTracker'
import { RecentEditTracker } from '../tracker/codeEditTracker'
import {
    CodeWhispererServiceToken,
    CodeWhispererServiceIAM,
    ClientFileContext,
} from '../../../shared/codeWhispererService'
import * as editPredictionAutoTrigger from '../auto-trigger/editPredictionAutoTrigger'
import { InlineCompletionWithReferencesParams } from '@aws/language-server-runtimes/server-interface'

describe('triggerUtils', () => {
    let service: sinon.SinonStubbedInstance<CodeWhispererServiceToken>
    let iamService: sinon.SinonStubbedInstance<CodeWhispererServiceIAM>
    let cursorTracker: sinon.SinonStubbedInstance<CursorTracker>
    let recentEditsTracker: sinon.SinonStubbedInstance<RecentEditTracker>
    let sessionManager: sinon.SinonStubbedInstance<SessionManager>
    let editPredictionAutoTriggerStub: sinon.SinonStub

    const fileContext = {
        leftFileContent: 'const x = 1;',
        rightFileContent: '',
        filename: 'test.ts',
        programmingLanguage: { languageName: 'typescript' },
    } as ClientFileContext

    const inlineParams = {
        textDocument: { uri: 'file:///test.ts' },
        position: { line: 0, character: 12 },
        context: { triggerKind: 1 },
        documentChangeParams: {
            contentChanges: [{ text: ';' }],
        },
    } as InlineCompletionWithReferencesParams

    beforeEach(() => {
        service = sinon.createStubInstance(CodeWhispererServiceToken)
        iamService = sinon.createStubInstance(CodeWhispererServiceIAM)
        cursorTracker = sinon.createStubInstance(CursorTracker)
        recentEditsTracker = sinon.createStubInstance(RecentEditTracker)
        sessionManager = sinon.createStubInstance(SessionManager)
        editPredictionAutoTriggerStub = sinon.stub(editPredictionAutoTrigger, 'editPredictionAutoTrigger')
    })

    afterEach(() => {
        sinon.restore()
    })

    describe('shouldTriggerEdits', () => {
        it('should return undefined when edits not enabled', () => {
            const result = shouldTriggerEdits(
                service,
                fileContext,
                inlineParams,
                cursorTracker,
                recentEditsTracker,
                sessionManager,
                false
            )

            assert.equal(result, undefined)
        })

        it('should return undefined when service is not token-based', () => {
            const result = shouldTriggerEdits(
                iamService,
                fileContext,
                inlineParams,
                cursorTracker,
                recentEditsTracker,
                sessionManager,
                true
            )

            assert.equal(result, undefined)
        })

        it('should return NepTrigger when auto trigger returns shouldTrigger true', () => {
            editPredictionAutoTriggerStub.returns({ shouldTrigger: true })
            sessionManager.getPreviousSession.returns(undefined)

            const result = shouldTriggerEdits(
                service,
                fileContext,
                inlineParams,
                cursorTracker,
                recentEditsTracker,
                sessionManager,
                true
            )

            assert.ok(result instanceof NepTrigger)
            sinon.assert.calledWith(editPredictionAutoTriggerStub, {
                fileContext,
                lineNum: 0,
                char: ';',
                previousDecision: '',
                cursorHistory: cursorTracker,
                recentEdits: recentEditsTracker,
            })
        })

        it('should return undefined when auto trigger returns shouldTrigger false', () => {
            editPredictionAutoTriggerStub.returns({ shouldTrigger: false })
            sessionManager.getPreviousSession.returns(undefined)

            const result = shouldTriggerEdits(
                service,
                fileContext,
                inlineParams,
                cursorTracker,
                recentEditsTracker,
                sessionManager,
                true
            )

            assert.equal(result, undefined)
        })

        it('should use last character from file content when no document change', () => {
            const paramsWithoutDocChange = {
                ...inlineParams,
                documentChangeParams: undefined,
            }
            editPredictionAutoTriggerStub.returns({ shouldTrigger: true })
            sessionManager.getPreviousSession.returns(undefined)

            shouldTriggerEdits(
                service,
                fileContext,
                paramsWithoutDocChange,
                cursorTracker,
                recentEditsTracker,
                sessionManager,
                true
            )

            sinon.assert.calledWith(editPredictionAutoTriggerStub, {
                fileContext,
                lineNum: 0,
                char: ';',
                previousDecision: '',
                cursorHistory: cursorTracker,
                recentEdits: recentEditsTracker,
            })
        })

        it('should use previous session decision when available', () => {
            const mockSession = {
                getAggregatedUserTriggerDecision: sinon.stub().returns('Accept'),
            }
            sessionManager.getPreviousSession.returns(mockSession as any)
            editPredictionAutoTriggerStub.returns({ shouldTrigger: true })

            shouldTriggerEdits(
                service,
                fileContext,
                inlineParams,
                cursorTracker,
                recentEditsTracker,
                sessionManager,
                true
            )

            sinon.assert.calledWith(editPredictionAutoTriggerStub, {
                fileContext,
                lineNum: 0,
                char: ';',
                previousDecision: 'Accept',
                cursorHistory: cursorTracker,
                recentEdits: recentEditsTracker,
            })
        })
    })
})
