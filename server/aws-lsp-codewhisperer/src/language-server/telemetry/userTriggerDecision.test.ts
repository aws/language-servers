import { Server } from '@aws-placeholder/aws-language-server-runtimes'
import * as assert from 'assert'
import sinon, { StubbedInstance, stubInterface } from 'ts-sinon'
import { CancellationToken, InlineCompletionTriggerKind } from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { TestFeatures } from '../TestFeatures'
import { CodewhispererServerFactory } from '../codeWhispererServer'
import { CodeWhispererServiceBase, ResponseContext, Suggestion } from '../codeWhispererService'
import { CodeWhispererSession, SessionManager } from '../session/sessionManager'

describe('Telemetry', () => {
    const sandbox = sinon.createSandbox()
    let SESSION_IDS_LOG: string[] = []
    let sessionManager: SessionManager
    let sessionManagerSpy: sinon.SinonSpiedInstance<SessionManager>
    let generateSessionIdStub: sinon.SinonStub
    let clock: sinon.SinonFakeTimers

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
    })

    afterEach(() => {
        generateSessionIdStub.restore()
        clock.restore()
        sandbox.restore()
    })

    describe('User Trigger Decision telemetry', () => {
        const HELLO_WORLD_IN_CSHARP = `class HelloWorld
{
    static void Main()
    {
        Console.WriteLine("Hello World!");
    }
}
`
        const AUTO_TRIGGER_POSITION = { line: 2, character: 21 }
        const SOME_FILE = TextDocument.create('file:///test.cs', 'csharp', 1, HELLO_WORLD_IN_CSHARP)
        const SOME_FILE_WITH_ALT_CASED_LANGUAGE_ID = TextDocument.create(
            // Use unsupported extension, so that we can test that we get a match based on the LanguageId
            'file:///test.seesharp',
            'CSharp',
            1,
            HELLO_WORLD_IN_CSHARP
        )
        const EXPECTED_REFERENCE = {
            licenseName: 'test license',
            repository: 'test repository',
            url: 'test url',
            recommendationContentSpan: { start: 0, end: 1 },
        }
        const DEFAULT_SUGGESTIONS: Suggestion[] = [
            { itemId: 'cwspr-item-id-1', content: 'recommendation' },
            { itemId: 'cwspr-item-id-2', content: 'recommendation' },
            { itemId: 'cwspr-item-id-3', content: 'recommendation' },
        ]
        const EXPECTED_RESPONSE_CONTEXT: ResponseContext = {
            requestId: 'cwspr-request-id',
            codewhispererSessionId: 'cwspr-session-id',
        }
        const DEFAULT_SESSION_RESULT_DATA = {
            sessionId: 'some-random-session-uuid-0',
            completionSessionResult: {
                'cwspr-item-id-1': {
                    seen: true,
                    accepted: false,
                    discarded: false,
                },
                'cwspr-item-id-2': {
                    seen: true,
                    accepted: false,
                    discarded: false,
                },
                'cwspr-item-id-3': {
                    seen: true,
                    accepted: false,
                    discarded: false,
                },
            },
        }

        let features: TestFeatures
        let server: Server
        // TODO move more of the service code out of the stub and into the testable realm
        // See: https://aws.amazon.com/blogs/developer/mocking-modular-aws-sdk-for-javascript-v3-in-unit-tests/
        // for examples on how to mock just the SDK client
        let service: StubbedInstance<CodeWhispererServiceBase>
        const setServiceResponse = (
            suggestions: Suggestion[],
            responseContext: ResponseContext,
            time: number = 2000
        ) => {
            service.generateSuggestions.callsFake(_request => {
                clock.tick(time)

                return Promise.resolve({
                    suggestions,
                    responseContext,
                })
            })
        }

        const autoTriggerInlineCompletionWithReferences = async () =>
            await features.doInlineCompletionWithReferences(
                {
                    textDocument: { uri: SOME_FILE.uri },
                    position: AUTO_TRIGGER_POSITION,
                    context: { triggerKind: InlineCompletionTriggerKind.Automatic },
                },
                CancellationToken.None
            )

        const manualTriggerInlineCompletionWithReferences = async () =>
            await features.doInlineCompletionWithReferences(
                {
                    textDocument: { uri: SOME_FILE.uri },
                    position: { line: 0, character: 0 },
                    context: { triggerKind: InlineCompletionTriggerKind.Invoked },
                },
                CancellationToken.None
            )

        beforeEach(async () => {
            // Set up the server with a mock service, returning predefined recommendations
            service = stubInterface<CodeWhispererServiceBase>()
            setServiceResponse(DEFAULT_SUGGESTIONS, EXPECTED_RESPONSE_CONTEXT)

            server = CodewhispererServerFactory(_auth => service)

            // Initialize the features, but don't start server yet
            features = new TestFeatures()

            // Return no specific configuration for CodeWhisperer
            features.lsp.workspace.getConfiguration.returns(Promise.resolve({}))

            // Return credentialsStartUrl value
            features.credentialsProvider.getConnectionMetadata.returns({
                sso: {
                    startUrl: 'teststarturl',
                },
            })

            // Start the server and open a document
            await features.start(server)

            features.openDocument(SOME_FILE).openDocument(SOME_FILE_WITH_ALT_CASED_LANGUAGE_ID)
        })

        const aUserTriggerDecision = (override: object = {}) => {
            return {
                name: 'codewhisperer_userTriggerDecision',
                data: {
                    codewhispererSessionId: 'cwspr-session-id',
                    codewhispererFirstRequestId: 'cwspr-request-id',
                    credentialStartUrl: 'teststarturl',
                    codewhispererSuggestionState: 'Discard',
                    codewhispererCompletionType: 'Line',
                    codewhispererLanguage: 'csharp',
                    codewhispererTriggerType: 'AutoTrigger',
                    codewhispererAutomatedTriggerType: 'SpecialCharacters',
                    codewhispererTriggerCharacter: '(',
                    codewhispererLineNumber: 2,
                    codewhispererCursorOffset: 21,
                    codewhispererSuggestionCount: 3,
                    // codewhispererClassifierResult: undefined,
                    // codewhispererClassifierThreshold: undefined,
                    codewhispererTotalShownTime: 0,
                    codewhispererTypeaheadLength: 0,
                    codewhispererTimeSinceLastDocumentChange: 0,
                    codewhispererTimeSinceLastUserDecision: undefined,
                    codewhispererTimeToFirstRecommendation: 2000,
                    codewhispererPreviousSuggestionState: undefined,
                    ...override,
                },
            }
        }

        describe('Case 1. Session is processed by server without sending results', () => {
            it('should send Empty user desicion when Codewhisperer returned list of empty suggestions and close session', async () => {
                const SUGGESTIONS = [
                    { itemId: 'cwspr-item-id-1', content: '' },
                    { itemId: 'cwspr-item-id-2', content: '' },
                    { itemId: 'cwspr-item-id-3', content: '' },
                ]
                setServiceResponse(SUGGESTIONS, EXPECTED_RESPONSE_CONTEXT)

                await autoTriggerInlineCompletionWithReferences()

                const currentSession = sessionManager.getCurrentSession()
                assert(currentSession)
                assert.equal(currentSession.state, 'CLOSED')
                sinon.assert.calledOnceWithExactly(sessionManagerSpy.closeSession, currentSession)

                const expectedUserTriggerDecisionMetric = aUserTriggerDecision({
                    codewhispererSuggestionState: 'Empty',
                })
                sinon.assert.calledWithMatch(features.telemetry.emitMetric, expectedUserTriggerDecisionMetric)
            })

            it('should send Empty User Decision when Codewhisperer returned empty list of suggestions', async () => {
                const SUGGESTIONS: Suggestion[] = []
                setServiceResponse(SUGGESTIONS, EXPECTED_RESPONSE_CONTEXT)

                await autoTriggerInlineCompletionWithReferences()

                const currentSession = sessionManager.getCurrentSession()
                assert(currentSession)
                assert.equal(currentSession.state, 'CLOSED')
                sinon.assert.calledOnceWithExactly(sessionManagerSpy.closeSession, currentSession)

                const expectedUserTriggerDecisionMetric = aUserTriggerDecision({
                    codewhispererSuggestionState: 'Empty',
                    codewhispererCompletionType: undefined,
                    codewhispererSuggestionCount: 0,
                })
                sinon.assert.calledWithMatch(features.telemetry.emitMetric, expectedUserTriggerDecisionMetric)
            })

            it('should send Discard User Decision when all suggestions are filtered out by includeSuggestionsWithCodeReferences setting filter', async () => {
                features.lsp.workspace.getConfiguration.returns(
                    Promise.resolve({ includeSuggestionsWithCodeReferences: false })
                )
                const SUGGESTIONS: Suggestion[] = [
                    {
                        itemId: 'cwspr-item-id-1',
                        content: 'recommendation with reference',
                        references: [EXPECTED_REFERENCE],
                    },
                    {
                        itemId: 'cwspr-item-id-2',
                        content: 'recommendation with reference',
                        references: [EXPECTED_REFERENCE],
                    },
                    {
                        itemId: 'cwspr-item-id-3',
                        content: 'recommendation with reference',
                        references: [EXPECTED_REFERENCE],
                    },
                ]
                setServiceResponse(SUGGESTIONS, EXPECTED_RESPONSE_CONTEXT)

                await autoTriggerInlineCompletionWithReferences()

                const currentSession = sessionManager.getCurrentSession()
                assert(currentSession)
                assert.equal(currentSession.state, 'CLOSED')
                sinon.assert.calledOnceWithExactly(sessionManagerSpy.closeSession, currentSession)

                const expectedUserTriggerDecisionMetric = aUserTriggerDecision({
                    codewhispererSuggestionState: 'Discard',
                })
                sinon.assert.calledWithMatch(features.telemetry.emitMetric, expectedUserTriggerDecisionMetric)
            })

            it('should send Discard User Decision when all suggestions are discarded after right context merge', async () => {
                const SUGGESTIONS: Suggestion[] = [
                    { itemId: 'cwspr-item-id-1', content: HELLO_WORLD_IN_CSHARP },
                    { itemId: 'cwspr-item-id-2', content: HELLO_WORLD_IN_CSHARP },
                    { itemId: 'cwspr-item-id-3', content: HELLO_WORLD_IN_CSHARP },
                ]
                setServiceResponse(SUGGESTIONS, EXPECTED_RESPONSE_CONTEXT)

                await manualTriggerInlineCompletionWithReferences()

                const currentSession = sessionManager.getCurrentSession()
                assert(currentSession)
                assert.equal(currentSession?.state, 'CLOSED')
                sinon.assert.calledOnceWithExactly(sessionManagerSpy.closeSession, currentSession)

                const expectedUserTriggerDecisionMetric = aUserTriggerDecision({
                    codewhispererSuggestionState: 'Discard',
                    codewhispererCompletionType: 'Block',
                    codewhispererTriggerType: 'OnDemand',
                    codewhispererAutomatedTriggerType: undefined,
                    codewhispererTriggerCharacter: undefined,
                    codewhispererLineNumber: 0,
                    codewhispererCursorOffset: 0,
                })
                sinon.assert.calledWithMatch(features.telemetry.emitMetric, expectedUserTriggerDecisionMetric)
            })
        })

        describe('Case 2. Session returns recommendation to client and is closed by LogInlineCompletionSessionResults notification', () => {
            it('should emit User Decision event for active completion session when session results are received', async () => {
                setServiceResponse(DEFAULT_SUGGESTIONS, EXPECTED_RESPONSE_CONTEXT)

                await autoTriggerInlineCompletionWithReferences()

                const currentSession = sessionManager.getCurrentSession()
                assert(currentSession)
                assert.equal(currentSession?.state, 'ACTIVE')
                sinon.assert.notCalled(sessionManagerSpy.closeSession)
                sinon.assert.neverCalledWithMatch(features.telemetry.emitMetric, {
                    name: 'codewhisperer_userTriggerDecision',
                })

                await features.doLogInlineCompletionSessionResults(DEFAULT_SESSION_RESULT_DATA)

                sinon.assert.calledWithMatch(features.telemetry.emitMetric, {
                    name: 'codewhisperer_userTriggerDecision',
                })
            })

            it('should not emit User Decision event when session results are received after session was closed', async () => {
                setServiceResponse(DEFAULT_SUGGESTIONS, {
                    ...EXPECTED_RESPONSE_CONTEXT,
                    codewhispererSessionId: 'cwspr-session-id-1',
                })

                await autoTriggerInlineCompletionWithReferences()

                const firstSession = sessionManager.getCurrentSession()
                assert(firstSession)
                assert.equal(firstSession.state, 'ACTIVE')
                sinon.assert.notCalled(sessionManagerSpy.closeSession)
                sinon.assert.neverCalledWithMatch(features.telemetry.emitMetric, {
                    name: 'codewhisperer_userTriggerDecision',
                })

                // Send second completion request to close first one
                setServiceResponse(DEFAULT_SUGGESTIONS, {
                    ...EXPECTED_RESPONSE_CONTEXT,
                    codewhispererSessionId: 'cwspr-session-id-2',
                })
                await autoTriggerInlineCompletionWithReferences()

                assert.equal(firstSession.state, 'CLOSED')
                assert.notEqual(firstSession, sessionManager.getCurrentSession())
                sinon.assert.calledWithExactly(sessionManagerSpy.closeSession, firstSession)
                // Test that session reports it's status when second request is received
                sinon.assert.calledWithMatch(features.telemetry.emitMetric, {
                    name: 'codewhisperer_userTriggerDecision',
                    data: {
                        codewhispererSessionId: 'cwspr-session-id-1',
                        codewhispererSuggestionState: 'Discard',
                    },
                })

                features.telemetry.emitMetric.resetHistory()

                // Send session results for closed first session
                await features.doLogInlineCompletionSessionResults({
                    ...DEFAULT_SESSION_RESULT_DATA,
                    sessionId: firstSession.id,
                })

                sinon.assert.neverCalledWithMatch(features.telemetry.emitMetric, {
                    name: 'codewhisperer_userTriggerDecision',
                })
            })

            it('should not emit User Decision event when session results received for session that does not exist', async () => {
                // Send session results for closed first session
                await features.doLogInlineCompletionSessionResults({
                    ...DEFAULT_SESSION_RESULT_DATA,
                    sessionId: 'cwspr-session-id-never-created',
                })

                sinon.assert.neverCalledWithMatch(features.telemetry.emitMetric, {
                    name: 'codewhisperer_userTriggerDecision',
                    data: {
                        codewhispererSessionId: 'cwspr-session-id-never-created',
                    },
                })
            })

            it('should emit Accept User Decision event for current active completion session when session results are received with accepted suggestion', async () => {
                setServiceResponse(DEFAULT_SUGGESTIONS, EXPECTED_RESPONSE_CONTEXT)
                const SESSION_RESULT_DATA = {
                    sessionId: 'some-random-session-uuid-0',
                    completionSessionResult: {
                        'cwspr-item-id-1': {
                            seen: true,
                            accepted: false,
                            discarded: false,
                        },
                        'cwspr-item-id-2': {
                            seen: true,
                            accepted: true, // Second suggestion was accepted
                            discarded: false,
                        },
                        'cwspr-item-id-3': {
                            seen: true,
                            accepted: false,
                            discarded: false,
                        },
                    },
                }

                await autoTriggerInlineCompletionWithReferences()
                sinon.assert.neverCalledWithMatch(features.telemetry.emitMetric, {
                    name: 'codewhisperer_userTriggerDecision',
                })

                // Send session results for closed first session
                await features.doLogInlineCompletionSessionResults(SESSION_RESULT_DATA)

                const expectedUserTriggerDecisionMetric = aUserTriggerDecision({
                    codewhispererSuggestionState: 'Accept',
                })
                sinon.assert.calledWithMatch(features.telemetry.emitMetric, expectedUserTriggerDecisionMetric)
            })

            it('should emit Reject User Decision event for current active completion session when session results are received without accepted suggestion', async () => {
                setServiceResponse(DEFAULT_SUGGESTIONS, EXPECTED_RESPONSE_CONTEXT)
                const SESSION_RESULT_DATA = {
                    sessionId: 'some-random-session-uuid-0',
                    completionSessionResult: {
                        'cwspr-item-id-1': {
                            seen: true, // Reject
                            accepted: false,
                            discarded: false,
                        },
                        'cwspr-item-id-2': {
                            seen: false, // Unseen
                            accepted: false,
                            discarded: true,
                        },
                        'cwspr-item-id-3': {
                            seen: false, // Discard
                            accepted: false,
                            discarded: true,
                        },
                    },
                }

                await autoTriggerInlineCompletionWithReferences()
                sinon.assert.neverCalledWithMatch(features.telemetry.emitMetric, {
                    name: 'codewhisperer_userTriggerDecision',
                })

                // Send session results for closed first session
                await features.doLogInlineCompletionSessionResults(SESSION_RESULT_DATA)

                const expectedUserTriggerDecisionMetric = aUserTriggerDecision({
                    codewhispererSuggestionState: 'Reject',
                })
                sinon.assert.calledWithMatch(features.telemetry.emitMetric, expectedUserTriggerDecisionMetric)
            })

            it('should send Discard User Decision when all suggestions have Discard state', async () => {
                setServiceResponse(DEFAULT_SUGGESTIONS, EXPECTED_RESPONSE_CONTEXT)
                const SESSION_RESULT_DATA = {
                    sessionId: 'some-random-session-uuid-0',
                    completionSessionResult: {
                        'cwspr-item-id-1': {
                            seen: false, // Discard
                            accepted: false,
                            discarded: true,
                        },
                        'cwspr-item-id-2': {
                            seen: false, // Discard
                            accepted: false,
                            discarded: true,
                        },
                        'cwspr-item-id-3': {
                            seen: false, // Discard
                            accepted: false,
                            discarded: true,
                        },
                    },
                }

                await autoTriggerInlineCompletionWithReferences()
                sinon.assert.neverCalledWithMatch(features.telemetry.emitMetric, {
                    name: 'codewhisperer_userTriggerDecision',
                })

                // Send session results for closed first session
                await features.doLogInlineCompletionSessionResults(SESSION_RESULT_DATA)

                const expectedUserTriggerDecisionMetric = aUserTriggerDecision({
                    codewhispererSuggestionState: 'Discard',
                })
                sinon.assert.calledWithMatch(features.telemetry.emitMetric, expectedUserTriggerDecisionMetric)
            })
        })

        describe('Case 3. Active session is closed by subsequent trigger', function () {
            it('should close ACTIVE session and emit Discard user trigger decision event on Manual trigger', async () => {
                setServiceResponse(DEFAULT_SUGGESTIONS, {
                    ...EXPECTED_RESPONSE_CONTEXT,
                    codewhispererSessionId: 'cwspr-session-id-1',
                })
                await autoTriggerInlineCompletionWithReferences()

                setServiceResponse(DEFAULT_SUGGESTIONS, {
                    ...EXPECTED_RESPONSE_CONTEXT,
                    codewhispererSessionId: 'cwspr-session-id-2',
                })
                await manualTriggerInlineCompletionWithReferences()

                const expectedUserTriggerDecisionMetric = aUserTriggerDecision({
                    codewhispererSessionId: 'cwspr-session-id-1',
                    codewhispererSuggestionState: 'Discard',
                })
                sinon.assert.calledWithMatch(features.telemetry.emitMetric, expectedUserTriggerDecisionMetric)
                sinon.assert.neverCalledWithMatch(features.telemetry.emitMetric, {
                    name: 'codewhisperer_userTriggerDecision',
                    data: {
                        codewhispererSessionId: 'cwspr-session-id-2',
                    },
                })
            })

            it('should close ACTIVE session and emit Discard user trigger decision event on Auto trigger', async () => {
                setServiceResponse(DEFAULT_SUGGESTIONS, {
                    ...EXPECTED_RESPONSE_CONTEXT,
                    codewhispererSessionId: 'cwspr-session-id-1',
                })
                await autoTriggerInlineCompletionWithReferences()

                setServiceResponse(DEFAULT_SUGGESTIONS, {
                    ...EXPECTED_RESPONSE_CONTEXT,
                    codewhispererSessionId: 'cwspr-session-id-2',
                })
                await autoTriggerInlineCompletionWithReferences()

                const expectedUserTriggerDecisionMetric = aUserTriggerDecision({
                    codewhispererSessionId: 'cwspr-session-id-1',
                    codewhispererSuggestionState: 'Discard',
                })
                sinon.assert.calledWithMatch(features.telemetry.emitMetric, expectedUserTriggerDecisionMetric)
                sinon.assert.neverCalledWithMatch(features.telemetry.emitMetric, {
                    name: 'codewhisperer_userTriggerDecision',
                    data: {
                        codewhispererSessionId: 'cwspr-session-id-2',
                    },
                })
            })

            it('should attach previous session trigger decision', async () => {
                setServiceResponse(DEFAULT_SUGGESTIONS, {
                    ...EXPECTED_RESPONSE_CONTEXT,
                    codewhispererSessionId: 'cwspr-session-id-1',
                })
                await autoTriggerInlineCompletionWithReferences()
                const firstSession = sessionManager.getCurrentSession()

                setServiceResponse(DEFAULT_SUGGESTIONS, {
                    ...EXPECTED_RESPONSE_CONTEXT,
                    codewhispererSessionId: 'cwspr-session-id-2',
                })
                await autoTriggerInlineCompletionWithReferences()

                setServiceResponse(DEFAULT_SUGGESTIONS, {
                    ...EXPECTED_RESPONSE_CONTEXT,
                    codewhispererSessionId: 'cwspr-session-id-3',
                })
                await autoTriggerInlineCompletionWithReferences()

                sinon.assert.calledWithMatch(
                    features.telemetry.emitMetric,
                    aUserTriggerDecision({
                        codewhispererSessionId: 'cwspr-session-id-1',
                        codewhispererSuggestionState: 'Discard',
                    })
                )
                sinon.assert.calledWithMatch(
                    features.telemetry.emitMetric,
                    aUserTriggerDecision({
                        codewhispererSessionId: 'cwspr-session-id-2',
                        codewhispererSuggestionState: 'Discard',
                        codewhispererPreviousSuggestionState: firstSession?.getAggregatedUserTriggerDecision(), // 'Discard'
                        codewhispererTimeSinceLastUserDecision: 0,
                    })
                )
                sinon.assert.neverCalledWithMatch(features.telemetry.emitMetric, {
                    name: 'codewhisperer_userTriggerDecision',
                    data: {
                        codewhispererSessionId: 'cwspr-session-id-3',
                    },
                })
            })

            it('should set correct values for past trigger result fields', async () => {
                setServiceResponse(DEFAULT_SUGGESTIONS, {
                    ...EXPECTED_RESPONSE_CONTEXT,
                    codewhispererSessionId: 'cwspr-session-id-1',
                })
                await autoTriggerInlineCompletionWithReferences()
                const firstSession = sessionManager.getCurrentSession()

                await features.doLogInlineCompletionSessionResults(DEFAULT_SESSION_RESULT_DATA)

                clock.tick(1234)

                setServiceResponse(DEFAULT_SUGGESTIONS, {
                    ...EXPECTED_RESPONSE_CONTEXT,
                    codewhispererSessionId: 'cwspr-session-id-2',
                })
                await autoTriggerInlineCompletionWithReferences()

                // Trigger 3rd session to close second one
                await autoTriggerInlineCompletionWithReferences()

                // For first session previous data does not exist
                sinon.assert.calledWithMatch(
                    features.telemetry.emitMetric,
                    aUserTriggerDecision({
                        codewhispererSessionId: 'cwspr-session-id-1',
                        codewhispererSuggestionState: 'Reject',
                        codewhispererTimeSinceLastUserDecision: undefined,
                        codewhispererPreviousSuggestionState: undefined,
                    })
                )

                // For second session previous data matches
                sinon.assert.calledWithMatch(
                    features.telemetry.emitMetric,
                    aUserTriggerDecision({
                        codewhispererSessionId: 'cwspr-session-id-2',
                        codewhispererSuggestionState: 'Discard',
                        codewhispererPreviousSuggestionState: firstSession?.getAggregatedUserTriggerDecision(), // 'Reject'
                        codewhispererTimeSinceLastUserDecision: 1234,
                    })
                )
            })
        })

        describe('Case 4. Inflight session is closed by subsequent completion request', function () {
            it('should not emit user trigger decision event when REQUESTING session is closed before becoming ACTIVE', async () => {
                await Promise.all([
                    autoTriggerInlineCompletionWithReferences(),
                    autoTriggerInlineCompletionWithReferences(),
                    autoTriggerInlineCompletionWithReferences(),
                ])

                // 3 sessions were created, each one closes previous one in REQUESTING state
                assert.equal(SESSION_IDS_LOG.length, 3)

                sinon.assert.neverCalledWithMatch(features.telemetry.emitMetric, {
                    name: 'codewhisperer_userTriggerDecision',
                })

                const activeSession = sessionManager.getActiveSession()
                assert.equal(activeSession?.id, SESSION_IDS_LOG[2])
            })

            it('should not attach discarded REQUESTING session data in previous user trigger decision values', async () => {
                await Promise.all([
                    autoTriggerInlineCompletionWithReferences(),
                    autoTriggerInlineCompletionWithReferences(),
                    autoTriggerInlineCompletionWithReferences(),
                ])

                // 3 sessions were created
                assert.equal(SESSION_IDS_LOG.length, 3)

                sinon.assert.neverCalledWithMatch(features.telemetry.emitMetric, {
                    name: 'codewhisperer_userTriggerDecision',
                })

                const activeSession = sessionManager.getActiveSession()
                assert.equal(activeSession?.id, SESSION_IDS_LOG[2])

                // Report session results to close last session
                await features.doLogInlineCompletionSessionResults({
                    ...DEFAULT_SESSION_RESULT_DATA,
                    sessionId: SESSION_IDS_LOG[2],
                })

                assert.equal(activeSession?.previousTriggerDecision, undefined)
                assert.equal(activeSession?.previousTriggerDecisionTime, undefined)

                sinon.assert.calledWithMatch(
                    features.telemetry.emitMetric,
                    aUserTriggerDecision({
                        codewhispererSuggestionState: 'Reject',
                        codewhispererTimeSinceLastUserDecision: undefined,
                        codewhispererPreviousSuggestionState: undefined,
                    })
                )
            })
        })

        it('should report user trigger decision only once for a session', async () => {
            setServiceResponse(DEFAULT_SUGGESTIONS, {
                ...EXPECTED_RESPONSE_CONTEXT,
                codewhispererSessionId: 'cwspr-session-id-1',
            })
            await autoTriggerInlineCompletionWithReferences()
            const firstSession = sessionManager.getCurrentSession()

            sinon.assert.neverCalledWithMatch(features.telemetry.emitMetric, {
                name: 'codewhisperer_userTriggerDecision',
            })

            // Record session results and close the session
            await features.doLogInlineCompletionSessionResults(DEFAULT_SESSION_RESULT_DATA)

            sinon.assert.calledWithMatch(features.telemetry.emitMetric, {
                name: 'codewhisperer_userTriggerDecision',
                data: {
                    codewhispererSessionId: 'cwspr-session-id-1',
                },
            })
            assert.equal(firstSession?.state, 'CLOSED')

            features.telemetry.emitMetric.resetHistory()

            // Triggering new completion request creates new session
            // and should not emit telemetry for previous session, which was closed earlier
            setServiceResponse(DEFAULT_SUGGESTIONS, {
                ...EXPECTED_RESPONSE_CONTEXT,
                codewhispererSessionId: 'cwspr-session-id-2',
            })
            await autoTriggerInlineCompletionWithReferences()

            // Or attempt to record data
            await features.doLogInlineCompletionSessionResults(DEFAULT_SESSION_RESULT_DATA)

            assert.equal(sessionManager.getPreviousSession(), firstSession)
            sinon.assert.neverCalledWithMatch(features.telemetry.emitMetric, {
                name: 'codewhisperer_userTriggerDecision',
                data: {
                    codewhispererSessionId: 'cwspr-session-id-1',
                },
            })
        })
    })
})
