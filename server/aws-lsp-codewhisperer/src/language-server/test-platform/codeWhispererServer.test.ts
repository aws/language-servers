import * as assert from 'assert'
import * as sinon from 'sinon'
import { StubbedInstance, stubInterface } from 'ts-sinon'
import { CodewhispererServerFactory } from '../codeWhispererServer'
import { CodeWhispererServiceBase } from '../codeWhispererService'
import { TestFeatures } from './TestFeatures'

import { Server } from '@aws/language-server-runtimes'
import { CancellationToken, InlineCompletionTriggerKind } from 'vscode-languageserver'
import { CodeWhispererSession, SessionManager } from '../session/sessionManager'
import {
    EMPTY_RESULT,
    EXPECTED_RESPONSE_CONTEXT,
    EXPECTED_RESULT,
    EXPECTED_SUGGESTION,
    HELLO_WORLD_IN_CSHARP,
    SOME_CLOSED_FILE,
    SOME_FILE,
    SOME_FILE_WITH_ALT_CASED_LANGUAGE_ID,
    SOME_UNSUPPORTED_FILE,
} from '../testUtils'

describe('New Test Platform', async function () {
    let service: StubbedInstance<CodeWhispererServiceBase>
    let server: Server
    let features: TestFeatures

    const sandbox = sinon.createSandbox()
    let SESSION_IDS_LOG: string[] = []
    let sessionManager: SessionManager
    let sessionManagerSpy: sinon.SinonSpiedInstance<SessionManager>
    let generateSessionIdStub: sinon.SinonStub

    beforeEach(function () {
        const StubSessionIdGenerator = () => {
            const id = 'some-random-session-uuid-' + SESSION_IDS_LOG.length
            SESSION_IDS_LOG.push(id)

            return id
        }
        generateSessionIdStub = sinon
            .stub(CodeWhispererSession.prototype, 'generateSessionId')
            .callsFake(StubSessionIdGenerator)
        sessionManager = SessionManager.getInstance()
        sessionManagerSpy = sandbox.spy(sessionManager)
    })

    afterEach(() => {
        generateSessionIdStub.restore()
        SessionManager.reset()
        sandbox.restore()
        SESSION_IDS_LOG = []
    })

    this.beforeEach(function () {
        // Initialize the features, but don't start server yet
        features = new TestFeatures()
    })

    afterEach(async function () {
        console.log(features.events.map(o => JSON.stringify(o)))
        features.dispose()
    })

    describe('Completion Requests', function () {
        beforeEach(async function () {
            // Set up the server with a mock service, returning predefined recommendations
            service = stubInterface<CodeWhispererServiceBase>()
            service.generateSuggestions.returns(
                Promise.resolve({
                    suggestions: EXPECTED_SUGGESTION,
                    responseContext: EXPECTED_RESPONSE_CONTEXT,
                })
            )

            server = CodewhispererServerFactory(_auth => service)

            // Return no specific configuration for CodeWhisperer
            features.onGetConfiguration({})

            // Start the server and open a document
            await features.start(server)

            features
                .openDocument(SOME_FILE)
                .openDocument(SOME_FILE_WITH_ALT_CASED_LANGUAGE_ID)
                .openDocument(SOME_UNSUPPORTED_FILE)
        })

        it('should return recommendations', async function () {
            const result = await features.doInlineCompletionWithReferences(
                {
                    textDocument: { uri: SOME_FILE.uri },
                    position: { line: 0, character: 0 },
                    context: { triggerKind: InlineCompletionTriggerKind.Invoked },
                },
                CancellationToken.None
            )

            // Check the completion result
            assert.deepEqual(result, EXPECTED_RESULT)

            const expectedGenerateSuggestionsRequest = {
                fileContext: {
                    filename: SOME_FILE.uri,
                    programmingLanguage: { languageName: 'csharp' },
                    leftFileContent: '',
                    rightFileContent: HELLO_WORLD_IN_CSHARP,
                },
                maxResults: 5,
            }
            sinon.assert.calledOnceWithExactly(service.generateSuggestions, expectedGenerateSuggestionsRequest)
        })

        it('should correctly get left and right context', async () => {
            const cutOffLine = 2
            const lines = HELLO_WORLD_IN_CSHARP.split('\n')
            const firstTwoLines = lines.slice(0, cutOffLine).join('\n') + '\n'
            const remainingLines = lines.slice(cutOffLine).join('\n')

            const result = await features.doInlineCompletionWithReferences(
                {
                    textDocument: { uri: SOME_FILE.uri },
                    position: { line: cutOffLine, character: 0 },
                    context: { triggerKind: InlineCompletionTriggerKind.Invoked },
                },
                CancellationToken.None
            )

            // Check the completion result
            assert.deepEqual(result, EXPECTED_RESULT)

            const expectedGenerateSuggestionsRequest = {
                fileContext: {
                    filename: SOME_FILE.uri,
                    programmingLanguage: { languageName: 'csharp' },
                    leftFileContent: firstTwoLines,
                    rightFileContent: remainingLines,
                },
                maxResults: 5,
            }
            sinon.assert.calledOnceWithExactly(service.generateSuggestions, expectedGenerateSuggestionsRequest)
        })

        it('should return recommendations when using a different languageId casing', async () => {
            const result = await features.doInlineCompletionWithReferences(
                {
                    textDocument: { uri: SOME_FILE_WITH_ALT_CASED_LANGUAGE_ID.uri },
                    position: { line: 0, character: 0 },
                    context: { triggerKind: InlineCompletionTriggerKind.Invoked },
                },
                CancellationToken.None
            )

            // Check the completion result
            assert.deepEqual(result, EXPECTED_RESULT)

            const expectedGenerateSuggestionsRequest = {
                fileContext: {
                    filename: SOME_FILE_WITH_ALT_CASED_LANGUAGE_ID.uri,
                    programmingLanguage: { languageName: 'csharp' },
                    leftFileContent: '',
                    rightFileContent: HELLO_WORLD_IN_CSHARP,
                },
                maxResults: 5,
            }
            sinon.assert.calledOnceWithExactly(service.generateSuggestions, expectedGenerateSuggestionsRequest)
        })

        it('should not return recommendations for a closed file', async () => {
            const result = await features.doInlineCompletionWithReferences(
                {
                    textDocument: { uri: SOME_CLOSED_FILE.uri },
                    position: { line: 0, character: 0 },
                    context: { triggerKind: InlineCompletionTriggerKind.Invoked },
                },
                CancellationToken.None
            )
            // Check the completion result
            assert.deepEqual(result, EMPTY_RESULT)

            // Check the service was not called
            sinon.assert.notCalled(service.generateSuggestions)
        })

        it('should not return recommendations for an unsupported file type', async () => {
            const result = await features.doInlineCompletionWithReferences(
                {
                    textDocument: { uri: SOME_UNSUPPORTED_FILE.uri },
                    position: { line: 0, character: 0 },
                    context: { triggerKind: InlineCompletionTriggerKind.Invoked },
                },
                CancellationToken.None
            )
            // Check the completion result
            assert.deepEqual(result, EMPTY_RESULT)

            // Check the service was not called
            sinon.assert.notCalled(service.generateSuggestions)
        })
    })

    describe('Opting out of sending data to CodeWhisperer', () => {
        it('should send opt-out header when the setting is disabled', async () => {
            features.onGetConfiguration({ shareCodeWhispererContentWithAWS: false })

            await features.start(server)

            assert(service.shareCodeWhispererContentWithAWS === false)
        })

        it('should not send opt-out header when the setting is enabled after startup', async () => {
            features.onGetConfiguration({ shareCodeWhispererContentWithAWS: false })

            await features.start(server)

            features.onGetConfiguration({ shareCodeWhispererContentWithAWS: true })

            await features.openDocument(SOME_FILE).doChangeConfiguration()

            assert(service.shareCodeWhispererContentWithAWS === true)
        })

        it('should send opt-out header if no settings are specificed', async () => {
            features.onGetConfiguration({})
            await features.start(server)

            assert(service.shareCodeWhispererContentWithAWS === false)
        })
    })
})
