import * as assert from 'assert'
import { EditCompletionHandler } from './editCompletionHandler'
import { InlineCompletionTriggerKind, TextDocument, CancellationToken } from '@aws/language-server-runtimes/protocol'
import { EMPTY_RESULT } from '../contants/constants'
import * as sinon from 'sinon'
import { CodeWhispererSession, SessionData, SessionManager } from '../session/sessionManager'
import { HELLO_WORLD_IN_CSHARP } from '../../../shared/testUtils'
import { CodeWhispererServiceToken } from '../../../shared/codeWhispererService'
import * as EditAutotrigger from '../auto-trigger/editPredictionAutoTrigger'

describe('EditCompletionHandler', () => {
    let handler: EditCompletionHandler
    let sessionManager: SessionManager
    let logging: any
    let workspace: any
    let amazonQServiceManager: any
    let cursorTracker: any
    let recentEditsTracker: any
    let rejectedEditTracker: any
    let telemetry: any
    let telemetryService: any
    let credentialsProvider: any
    let codeWhispererService: any
    let documentChangedListener: any

    const requestContext = {
        maxResults: 5,
        fileContext: {
            filename: 'SomeFile',
            programmingLanguage: { languageName: 'csharp' },
            leftFileContent: 'LeftFileContent',
            rightFileContent: 'RightFileContent',
        },
    }

    const data: SessionData = {
        document: TextDocument.create('file:///rightContext.cs', 'csharp', 1, HELLO_WORLD_IN_CSHARP),
        startPreprocessTimestamp: 0,
        startPosition: { line: 0, character: 0 },
        triggerType: 'OnDemand',
        language: 'csharp',
        requestContext: requestContext,
        autoTriggerType: 'Enter',
    }

    beforeEach(() => {
        SessionManager.reset()
        sessionManager = SessionManager.getInstance('EDITS')
        logging = { info: sinon.stub(), warn: sinon.stub(), log: sinon.stub(), debug: sinon.stub() }
        workspace = { getTextDocument: sinon.stub(), getWorkspaceFolder: sinon.stub() }
        codeWhispererService = {
            generateSuggestions: sinon.stub(),
            constructSupplementalContext: sinon.stub(),
            customizationArn: undefined,
        }
        amazonQServiceManager = { getCodewhispererService: sinon.stub().returns(codeWhispererService) }
        cursorTracker = { trackPosition: sinon.stub() }
        recentEditsTracker = { generateEditBasedContext: sinon.stub() }
        rejectedEditTracker = { isSimilarToRejected: sinon.stub().returns(false) }
        telemetry = { emitMetric: sinon.stub() }
        telemetryService = { emitUserTriggerDecision: sinon.stub() }
        credentialsProvider = { getConnectionMetadata: sinon.stub() }
        documentChangedListener = { documentChanged: sinon.stub(), timeSinceLastUserModification: 1000 }

        const clientMetadata = {
            processId: 123,
            rootUri: null,
            capabilities: {},
            initializationOptions: {
                aws: {
                    awsClientCapabilities: {
                        textDocument: {
                            inlineCompletionWithReferences: {
                                inlineEditSupport: true,
                            },
                        },
                    },
                },
            },
        }

        handler = new EditCompletionHandler(
            logging,
            clientMetadata,
            workspace,
            amazonQServiceManager,
            sessionManager,
            cursorTracker,
            recentEditsTracker,
            rejectedEditTracker,
            documentChangedListener,
            telemetry,
            telemetryService,
            credentialsProvider
        )

        // Make service a token service by default
        Object.setPrototypeOf(codeWhispererService, CodeWhispererServiceToken.prototype)
    })

    afterEach(() => {
        sinon.restore()
        SessionManager.reset()
    })

    describe('onEditCompletion', () => {
        it('should return empty result when in progress', async () => {
            handler['isInProgress'] = true
            const params = {
                textDocument: { uri: 'test.ts' },
                position: { line: 0, character: 0 },
                context: { triggerKind: InlineCompletionTriggerKind.Automatic },
            }

            const result = await handler.onEditCompletion(params as any, {} as any)

            assert.deepEqual(result, EMPTY_RESULT)
            sinon.assert.calledWith(logging.info, 'editCompletionHandler is WIP, skip the request')
        })

        it('should return empty result when text document not found', async () => {
            workspace.getTextDocument.resolves(null)
            const params = {
                textDocument: { uri: 'test.ts' },
                position: { line: 0, character: 0 },
                context: { triggerKind: InlineCompletionTriggerKind.Automatic },
            }

            const result = await handler.onEditCompletion(params as any, {} as any)

            assert.deepEqual(result, EMPTY_RESULT)
            sinon.assert.calledWith(logging.warn, 'textDocument [test.ts] not found')
        })

        it('should return empty result when service is not token service', async () => {
            const textDocument = { languageId: 'typescript' }
            workspace.getTextDocument.resolves(textDocument)
            amazonQServiceManager.getCodewhispererService.returns({})

            const params = {
                textDocument: { uri: 'test.ts' },
                position: { line: 0, character: 0 },
                context: { triggerKind: InlineCompletionTriggerKind.Automatic },
            }

            const result = await handler.onEditCompletion(params as any, CancellationToken.None)

            assert.deepEqual(result, EMPTY_RESULT)
        })

        it('should return empty result when language not supported', async () => {
            const textDocument = { languageId: 'unsupported', uri: 'test.xyz' }
            workspace.getTextDocument.resolves(textDocument)

            const params = {
                textDocument: { uri: 'test.xyz' },
                position: { line: 0, character: 0 },
                context: { triggerKind: InlineCompletionTriggerKind.Automatic },
            }

            const result = await handler.onEditCompletion(params as any, CancellationToken.None)

            assert.deepEqual(result, EMPTY_RESULT)
            sinon.assert.calledWith(logging.log, sinon.match('not supported'))
        })

        it('should handle partial result token with existing session', async () => {
            const textDocument = { languageId: 'typescript', uri: 'test.ts' }
            workspace.getTextDocument.resolves(textDocument)
            sessionManager.createSession(data)
            const currentSession = sessionManager.getCurrentSession()
            if (currentSession) {
                sessionManager.activateSession(currentSession)
            }

            codeWhispererService.generateSuggestions.resolves({
                suggestions: [{ itemId: 'item-1', content: 'test' }],
                responseContext: { requestId: 'req-1', nextToken: null },
            })

            const params = {
                textDocument: { uri: 'test.ts' },
                position: { line: 0, character: 0 },
                context: { triggerKind: InlineCompletionTriggerKind.Automatic },
                partialResultToken: 'token123',
            }

            const result = await handler.onEditCompletion(params as any, CancellationToken.None)

            assert.strictEqual(result.items.length, 1)
            assert.strictEqual(currentSession?.state, 'DISCARD')
        })

        it('should handle error in partial result token request', async () => {
            const textDocument = { languageId: 'typescript', uri: 'test.ts' }
            workspace.getTextDocument.resolves(textDocument)

            sessionManager.createSession(data)

            codeWhispererService.generateSuggestions.rejects(new Error('API Error'))

            const params = {
                textDocument: { uri: 'test.ts' },
                position: { line: 0, character: 0 },
                context: { triggerKind: InlineCompletionTriggerKind.Automatic },
                partialResultToken: 'token123',
            }

            const result = await handler.onEditCompletion(params as any, CancellationToken.None)

            assert.deepEqual(result, EMPTY_RESULT)
        })

        it('should track cursor position when available', async () => {
            workspace.getTextDocument.resolves(null)

            const params = {
                textDocument: { uri: 'test.ts' },
                position: { line: 5, character: 10 },
                context: { triggerKind: InlineCompletionTriggerKind.Automatic },
            }

            await handler.onEditCompletion(params as any, CancellationToken.None)

            sinon.assert.calledWith(cursorTracker.trackPosition, 'test.ts', { line: 5, character: 10 })
        })
    })

    describe.skip('documentChanged', () => {
        it('should set hasDocumentChangedSinceInvocation when waiting', () => {
            handler['debounceTimeout'] = setTimeout(() => {}, 1000) as any
            handler['isWaiting'] = true

            handler.documentChanged()

            assert.strictEqual(handler['hasDocumentChangedSinceInvocation'], true)
        })

        it('should refresh timeout when not waiting', () => {
            const timeout = { refresh: sinon.stub() }
            handler['debounceTimeout'] = timeout as any
            handler['isWaiting'] = false

            handler.documentChanged()

            sinon.assert.called(timeout.refresh)
        })

        it('should do nothing when no timeout exists', () => {
            handler['debounceTimeout'] = undefined

            assert.doesNotThrow(() => handler.documentChanged())
        })
    })

    describe('processSuggestionResponse', () => {
        it('should filter out similar rejected suggestions', async () => {
            rejectedEditTracker.isSimilarToRejected.returns(true)
            const session = new CodeWhispererSession(data)
            const suggestionResponse = {
                suggestions: [{ itemId: 'item-1', content: 'test content' }],
                responseContext: { requestId: 'req-1', nextToken: null },
            }

            const result = await handler.processSuggestionResponse(suggestionResponse as any, session as any, true)

            assert.strictEqual(result.items.length, 0)
            assert.strictEqual(session.getSuggestionState('item-1'), 'Reject')
        })

        it('should return suggestions when not rejected', async () => {
            const session = new CodeWhispererSession(data)
            const suggestionResponse = {
                suggestions: [{ itemId: 'item-1', content: 'test content' }],
                responseContext: { requestId: 'req-1', nextToken: null },
            }

            const result = await handler.processSuggestionResponse(suggestionResponse as any, session as any, true)

            assert.strictEqual(result.items.length, 1)
            assert.strictEqual(result.items[0].insertText, 'test content')
            assert.strictEqual(result.items[0].isInlineEdit, true)
        })

        it('should handle empty suggestions response', async () => {
            telemetryService.emitUserTriggerDecision.resolves()
            const session = new CodeWhispererSession(data)
            const suggestionResponse = {
                suggestions: [],
                responseContext: { requestId: 'req-1', nextToken: null },
            }

            const result = await handler.processSuggestionResponse(suggestionResponse as any, session, true)

            assert.deepEqual(result, EMPTY_RESULT)
        })

        it('should handle session with discardInflightSessionOnNewInvocation flag', async () => {
            const session = new CodeWhispererSession(data)
            session.discardInflightSessionOnNewInvocation = true

            const suggestionResponse = {
                suggestions: [{ itemId: 'item-1', content: 'test content' }],
                responseContext: { requestId: 'req-1', nextToken: null },
            }

            await handler.processSuggestionResponse(suggestionResponse as any, session, true)

            assert.strictEqual(session.state, 'DISCARD')
            assert.strictEqual(session.discardInflightSessionOnNewInvocation, false)
        })

        it('should append suggestions for non-new session', async () => {
            const session = new CodeWhispererSession(data)
            session.suggestions = [{ itemId: 'existing', content: 'existing' }]

            const suggestionResponse = {
                suggestions: [{ itemId: 'item-1', content: 'test content' }],
                responseContext: { requestId: 'req-1', nextToken: null },
            }

            await handler.processSuggestionResponse(suggestionResponse as any, session, false)

            assert.strictEqual(session.suggestions.length, 2)
            assert.strictEqual(session.suggestions[1].itemId, 'item-1')
        })
    })

    describe('_invoke', () => {
        const textDocument = {
            languageId: 'typescript',
            uri: 'test.ts',
            getText: () => 'content',
            positionAt: sinon.stub(),
        }
        const params = {
            textDocument: textDocument,
            position: { line: 0, character: 0 },
            context: { triggerKind: InlineCompletionTriggerKind.Automatic },
        }

        afterEach('teardown', function () {
            sinon.restore()
        })

        function aTriggerStub(flag: boolean): EditAutotrigger.EditClassifier {
            return {
                shouldTriggerNep: sinon
                    .stub()
                    .returns({ score: 0, threshold: EditAutotrigger.EditClassifier.THRESHOLD, shouldTrigger: flag }),
            } as any as EditAutotrigger.EditClassifier
        }

        it('should return empty result when shouldTriggerEdits returns false', async () => {
            workspace.getWorkspaceFolder.returns(undefined)

            sinon.stub(EditAutotrigger, 'EditClassifier').returns(aTriggerStub(false))

            const result = await handler._invoke(
                params as any,
                Date.now(),
                CancellationToken.None,
                textDocument as any,
                'typescript',
                undefined
            )

            assert.deepEqual(result, EMPTY_RESULT)
        })

        it('should create session and call generateSuggestions when trigger is valid', async () => {
            workspace.getWorkspaceFolder.returns(undefined)

            sinon.stub(EditAutotrigger, 'EditClassifier').returns(aTriggerStub(true))
            codeWhispererService.constructSupplementalContext.resolves(null)
            codeWhispererService.generateSuggestions.resolves({
                suggestions: [{ itemId: 'item-1', content: 'test content' }],
                responseContext: { requestId: 'req-1', nextToken: null },
            })

            const result = await handler._invoke(
                params as any,
                Date.now(),
                CancellationToken.None,
                textDocument as any,
                'typescript',
                undefined
            )

            assert.strictEqual(result.items.length, 1)
            sinon.assert.called(codeWhispererService.generateSuggestions)
        })

        it('should handle active session and emit telemetry', async () => {
            workspace.getWorkspaceFolder.returns(undefined)

            sessionManager.createSession(data)
            const currentSession = sessionManager.getCurrentSession()
            if (currentSession) {
                sessionManager.activateSession(currentSession)
            }
            sinon.stub(EditAutotrigger, 'EditClassifier').returns(aTriggerStub(true))
            codeWhispererService.constructSupplementalContext.resolves(null)
            codeWhispererService.generateSuggestions.resolves({
                suggestions: [{ itemId: 'item-1', content: 'test content' }],
                responseContext: { requestId: 'req-1', nextToken: null },
            })

            await handler._invoke(
                params as any,
                Date.now(),
                CancellationToken.None,
                textDocument as any,
                'typescript',
                currentSession
            )

            assert.strictEqual(currentSession?.state, 'DISCARD')
        })

        it('should handle supplemental context when available', async () => {
            workspace.getWorkspaceFolder.returns(undefined)

            sinon.stub(EditAutotrigger, 'EditClassifier').returns(aTriggerStub(true))
            codeWhispererService.constructSupplementalContext.resolves({
                items: [{ content: 'context', filePath: 'file.ts' }],
                supContextData: { isUtg: false },
            })
            codeWhispererService.generateSuggestions.resolves({
                suggestions: [{ itemId: 'item-1', content: 'test content' }],
                responseContext: { requestId: 'req-1', nextToken: null },
            })

            await handler._invoke(
                params as any,
                Date.now(),
                CancellationToken.None,
                textDocument as any,
                'typescript',
                undefined
            )

            sinon.assert.calledWith(codeWhispererService.generateSuggestions, sinon.match.has('supplementalContexts'))
        })
    })

    describe('handleSuggestionsErrors', () => {
        it('should handle generic error and return empty result', () => {
            const session = new CodeWhispererSession(data)
            const error = new Error('Generic error')
            const emitServiceInvocationFailureStub = sinon.stub(
                require('../telemetry/telemetry'),
                'emitServiceInvocationFailure'
            )

            const result = handler.handleSuggestionsErrors(error, session)

            assert.deepEqual(result, EMPTY_RESULT)
            assert.strictEqual(session.state, 'CLOSED')
            sinon.assert.calledWith(logging.log, sinon.match('Recommendation failure'))
            sinon.assert.calledWith(emitServiceInvocationFailureStub, telemetry, session, error)
            emitServiceInvocationFailureStub.restore()
        })

        it('should handle connection expired error and return empty result', () => {
            const session = new CodeWhispererSession(data)
            const error = new Error('ExpiredTokenException')

            const result = handler.handleSuggestionsErrors(error, session)

            assert.strictEqual(session.state, 'CLOSED')
        })

        it('should handle AmazonQError and throw ResponseError with error code', () => {
            const session = new CodeWhispererSession(data)
            const { AmazonQError } = require('../../../shared/amazonQServiceManager/errors')
            const error = new AmazonQError('Service error', '500')

            assert.throws(() => {
                handler.handleSuggestionsErrors(error, session)
            })

            assert.strictEqual(session.state, 'CLOSED')
        })

        it('should handle error without message', () => {
            const session = new CodeWhispererSession(data)
            const error = new Error()
            error.message = ''

            const result = handler.handleSuggestionsErrors(error, session)

            assert.deepEqual(result, EMPTY_RESULT)
            assert.strictEqual(session.state, 'CLOSED')
        })
    })
})
