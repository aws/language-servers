import {
    Server,
    CancellationToken,
    InlineCompletionTriggerKind,
    TextDocument,
    MetricEvent,
} from '@aws/language-server-runtimes/server-interface'
import { TestFeatures } from '@aws/language-server-runtimes/testing'
import * as assert from 'assert'
import { AWSError } from 'aws-sdk'
import sinon, { StubbedInstance, stubInterface } from 'ts-sinon'
import { CONTEXT_CHARACTERS_LIMIT, CodewhispererServerFactory } from './codeWhispererServer'
import { CodeWhispererServiceBase, ResponseContext, Suggestion } from './codeWhispererService'
import { CodeWhispererSession, SessionData, SessionManager } from './session/sessionManager'
import {
    EMPTY_RESULT,
    EXPECTED_REFERENCE,
    EXPECTED_RESPONSE_CONTEXT,
    EXPECTED_RESULT,
    EXPECTED_RESULT_WITHOUT_REFERENCES,
    EXPECTED_RESULT_WITH_REFERENCES,
    EXPECTED_SESSION_ID,
    EXPECTED_SUGGESTION,
    EXPECTED_SUGGESTION_LIST,
    HELLO_WORLD_IN_CSHARP,
    HELLO_WORLD_LINE,
    HELLO_WORLD_WITH_WINDOWS_ENDING,
    SINGLE_LINE_FILE_CUTOFF_INDEX,
    SOME_CLOSED_FILE,
    SOME_FILE,
    SOME_FILE_WITH_ALT_CASED_LANGUAGE_ID,
    SOME_FILE_WITH_EXTENSION,
    SOME_SINGLE_LINE_FILE,
    SOME_UNSUPPORTED_FILE,
} from './testUtils'

describe('CodeWhisperer Server', () => {
    const sandbox = sinon.createSandbox()
    let SESSION_IDS_LOG: string[] = []
    let sessionManager: SessionManager
    let sessionManagerSpy: sinon.SinonSpiedInstance<SessionManager>
    let generateSessionIdStub: sinon.SinonStub

    beforeEach(() => {
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

    describe('Recommendations', () => {
        let features: TestFeatures
        let server: Server
        // TODO move more of the service code out of the stub and into the testable realm
        // See: https://aws.amazon.com/blogs/developer/mocking-modular-aws-sdk-for-javascript-v3-in-unit-tests/
        // for examples on how to mock just the SDK client
        let service: StubbedInstance<CodeWhispererServiceBase>

        beforeEach(async () => {
            // Set up the server with a mock service, returning predefined recommendations
            service = stubInterface<CodeWhispererServiceBase>()
            service.generateSuggestions.returns(
                Promise.resolve({
                    suggestions: EXPECTED_SUGGESTION,
                    responseContext: EXPECTED_RESPONSE_CONTEXT,
                })
            )

            server = CodewhispererServerFactory(_auth => service)

            // Initialize the features, but don't start server yet
            features = new TestFeatures()

            // Return no specific configuration for CodeWhisperer
            features.lsp.workspace.getConfiguration.returns(Promise.resolve({}))

            // Start the server and open a document
            await features.start(server)

            features
                .openDocument(SOME_FILE)
                .openDocument(SOME_FILE_WITH_ALT_CASED_LANGUAGE_ID)
                .openDocument(SOME_UNSUPPORTED_FILE)
                .openDocument(SOME_FILE_WITH_EXTENSION)
                .openDocument(SOME_SINGLE_LINE_FILE)
        })

        afterEach(() => {
            features.dispose()
        })

        it('should return recommendations', async () => {
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

        it('should truncate left and right context', async () => {
            const BIG_FILE_CONTENT = '123456789\n'.repeat(5000)
            const BIG_FILE = TextDocument.create('file:///big_file.cs', 'csharp', 1, BIG_FILE_CONTENT)
            const cutOffLine = 2000
            features.openDocument(BIG_FILE)

            await features.doInlineCompletionWithReferences(
                {
                    textDocument: { uri: BIG_FILE.uri },
                    position: { line: cutOffLine, character: 1 },
                    context: { triggerKind: InlineCompletionTriggerKind.Invoked },
                },
                CancellationToken.None
            )
            const leftContentChecker = (leftContent: string) =>
                leftContent.length == CONTEXT_CHARACTERS_LIMIT && leftContent.endsWith('\n1')
            const rightContentChecker = (rightContent: string) =>
                rightContent.length == CONTEXT_CHARACTERS_LIMIT && rightContent.startsWith('234')

            sinon.assert.calledWith(
                service.generateSuggestions,
                sinon.match.hasNested('fileContext.leftFileContent', sinon.match(leftContentChecker))
            )
            sinon.assert.calledWith(
                service.generateSuggestions,
                sinon.match.hasNested('fileContext.rightFileContent', sinon.match(rightContentChecker))
            )
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

        it('should return recommendations based on known extension', async () => {
            const result = await features.doInlineCompletionWithReferences(
                {
                    textDocument: { uri: SOME_FILE_WITH_EXTENSION.uri },
                    position: { line: 0, character: 0 },
                    context: { triggerKind: InlineCompletionTriggerKind.Invoked },
                },
                CancellationToken.None
            )

            // Check the completion result
            assert.deepEqual(result, EXPECTED_RESULT)

            const expectedGenerateSuggestionsRequest = {
                fileContext: {
                    filename: SOME_FILE_WITH_EXTENSION.uri,
                    programmingLanguage: { languageName: 'cpp' },
                    leftFileContent: '',
                    rightFileContent: HELLO_WORLD_IN_CSHARP,
                },
                maxResults: 5,
            }

            // Check the service was called with the right parameters
            sinon.assert.calledOnceWithExactly(service.generateSuggestions, expectedGenerateSuggestionsRequest)
        })

        // Merge right tests
        it('should not show recommendation when the recommendation is equal to right context', async () => {
            // The suggestion returned by generateSuggestions will be equal to the contents of the file
            const EXPECTED_SUGGESTION: Suggestion[] = [{ itemId: 'cwspr-item-id', content: HELLO_WORLD_IN_CSHARP }]
            service.generateSuggestions.returns(
                Promise.resolve({
                    suggestions: EXPECTED_SUGGESTION,
                    responseContext: EXPECTED_RESPONSE_CONTEXT,
                })
            )

            const result = await features.doInlineCompletionWithReferences(
                {
                    textDocument: { uri: SOME_FILE.uri },
                    position: { line: 0, character: 0 },
                    context: { triggerKind: InlineCompletionTriggerKind.Invoked },
                },
                CancellationToken.None
            )

            assert.deepEqual(result, EMPTY_RESULT)
        })

        it('should only show the part of the recommendation that does not overlap with the right context in multiline', async () => {
            const cutOffLine = 2
            const lines = HELLO_WORLD_IN_CSHARP.split('\n')
            // The recommendation will be the contents of hello world starting from line 3 (static void Main)
            const recommendation = lines.slice(cutOffLine).join('\n')
            // We delete the static void Main line from Hello World but keep the rest in the file
            const deletedLine = lines.splice(cutOffLine, 1)[0]

            const finalFileContent = lines.join('\n')
            const MY_FILE = TextDocument.create('file:///rightContext.cs', 'csharp', 1, finalFileContent)
            features.openDocument(MY_FILE)

            const EXPECTED_SUGGESTION: Suggestion[] = [{ itemId: 'cwspr-item-id', content: recommendation }]
            service.generateSuggestions.returns(
                Promise.resolve({
                    suggestions: EXPECTED_SUGGESTION,
                    responseContext: EXPECTED_RESPONSE_CONTEXT,
                })
            )
            // Expected result is the deleted line + new line + 4 spaces
            // Newline and the 4 spaces get lost when we do the `split` so we add them back to expected result
            const EXPECTED_RESULT = {
                sessionId: EXPECTED_SESSION_ID,
                items: [
                    {
                        itemId: EXPECTED_SUGGESTION[0].itemId,
                        insertText: deletedLine.concat('\n    '),
                        range: undefined,
                        references: undefined,
                    },
                ],
            }

            const result = await features.doInlineCompletionWithReferences(
                {
                    textDocument: { uri: MY_FILE.uri },
                    position: { line: cutOffLine, character: 0 },
                    context: { triggerKind: InlineCompletionTriggerKind.Invoked },
                },
                CancellationToken.None
            )

            assert.deepEqual(result, EXPECTED_RESULT)

            const leftContext = lines.slice(0, cutOffLine).join('\n') + '\n'
            const rightContext = lines.slice(cutOffLine).join('\n')
            const expectedGenerateSuggestionsRequest = {
                fileContext: {
                    filename: MY_FILE.uri,
                    programmingLanguage: { languageName: 'csharp' },
                    leftFileContent: leftContext,
                    rightFileContent: rightContext,
                },
                maxResults: 5,
            }
            sinon.assert.calledOnceWithExactly(service.generateSuggestions, expectedGenerateSuggestionsRequest)
        })

        it('should convert windows newlines to UNIX newlines in request file contents', async () => {
            const cutOffLine = 2
            const lines = HELLO_WORLD_WITH_WINDOWS_ENDING.split('\r\n')

            const MY_WINDOWS_FILE = TextDocument.create(
                'file:///rightContext.cs',
                'csharp',
                1,
                HELLO_WORLD_WITH_WINDOWS_ENDING
            )
            features.openDocument(MY_WINDOWS_FILE)

            await features.doInlineCompletionWithReferences(
                {
                    textDocument: { uri: MY_WINDOWS_FILE.uri },
                    position: { line: cutOffLine, character: 0 },
                    context: { triggerKind: InlineCompletionTriggerKind.Invoked },
                },
                CancellationToken.None
            )

            const modifiedLeftContext = lines.slice(0, cutOffLine).join('\n') + '\n'
            const modifiedRightContext = lines.slice(cutOffLine).join('\n')
            const expectedGenerateSuggestionsRequest = {
                fileContext: {
                    filename: MY_WINDOWS_FILE.uri,
                    programmingLanguage: { languageName: 'csharp' },
                    leftFileContent: modifiedLeftContext,
                    rightFileContent: modifiedRightContext,
                },
                maxResults: 5,
            }
            sinon.assert.calledOnceWithExactly(service.generateSuggestions, expectedGenerateSuggestionsRequest)
        })

        it('should only show the part of the recommendation that does not overlap with the right context', async () => {
            const EXPECTED_SUGGESTION: Suggestion[] = [{ itemId: 'cwspr-item-id', content: HELLO_WORLD_LINE }]
            service.generateSuggestions.returns(
                Promise.resolve({
                    suggestions: EXPECTED_SUGGESTION,
                    responseContext: EXPECTED_RESPONSE_CONTEXT,
                })
            )
            const EXPECTED_RESULT = {
                sessionId: EXPECTED_SESSION_ID,
                items: [
                    {
                        itemId: EXPECTED_SUGGESTION[0].itemId,
                        insertText: HELLO_WORLD_LINE.substring(0, SINGLE_LINE_FILE_CUTOFF_INDEX),
                        range: undefined,
                        references: undefined,
                    },
                ],
            }

            const result = await features.doInlineCompletionWithReferences(
                {
                    textDocument: { uri: SOME_SINGLE_LINE_FILE.uri },
                    position: { line: 0, character: 0 },
                    context: { triggerKind: InlineCompletionTriggerKind.Invoked },
                },
                CancellationToken.None
            )

            assert.deepEqual(result, EXPECTED_RESULT)
        })

        it('should show full recommendation when the right context does not match recommendation ', async () => {
            const EXPECTED_SUGGESTION: Suggestion[] = [{ itemId: 'cwspr-item-id', content: 'Something something' }]
            service.generateSuggestions.returns(
                Promise.resolve({
                    suggestions: EXPECTED_SUGGESTION,
                    responseContext: EXPECTED_RESPONSE_CONTEXT,
                })
            )
            const EXPECTED_RESULT = {
                sessionId: EXPECTED_SESSION_ID,
                items: [
                    {
                        itemId: EXPECTED_SUGGESTION[0].itemId,
                        insertText: EXPECTED_SUGGESTION[0].content,
                        range: undefined,
                        references: undefined,
                    },
                ],
            }

            const result = await features.doInlineCompletionWithReferences(
                {
                    textDocument: { uri: SOME_FILE.uri },
                    position: { line: 0, character: 0 },
                    context: { triggerKind: InlineCompletionTriggerKind.Invoked },
                },
                CancellationToken.None
            )

            assert.deepEqual(result, EXPECTED_RESULT)
        })

        it('should return empty recommendations list on failed request', async () => {
            // Plant exception
            service.generateSuggestions.returns(Promise.reject('UNEXPECTED EXCEPTION'))

            const result = await features.doInlineCompletionWithReferences(
                {
                    textDocument: { uri: SOME_FILE.uri },
                    position: { line: 0, character: 0 },
                    context: { triggerKind: InlineCompletionTriggerKind.Invoked },
                },
                CancellationToken.None
            )
            // Check the completion result
            assert.deepEqual(result, EMPTY_RESULT)
        })

        // TODO: mock http request and verify the headers are passed
        // or spawn an http server and pass it as an endpoint to the sdk client,
        // mock responses and verify that correct headers are receieved on the server side.
        // Currently the suite just checks whether the boolean is passed to codeWhispererService
        describe('Opting out of sending data to CodeWhisperer', () => {
            it('should send opt-out header when the setting is disabled', async () => {
                features.lsp.workspace.getConfiguration.returns(
                    Promise.resolve({ shareCodeWhispererContentWithAWS: false })
                )
                await features.start(server)

                assert(service.shareCodeWhispererContentWithAWS === false)
            })

            it('should not send opt-out header when the setting is enabled after startup', async () => {
                features.lsp.workspace.getConfiguration.returns(
                    Promise.resolve({ shareCodeWhispererContentWithAWS: false })
                )
                await features.start(server)
                features.lsp.workspace.getConfiguration.returns(
                    Promise.resolve({ shareCodeWhispererContentWithAWS: true })
                )
                await features.openDocument(SOME_FILE).doChangeConfiguration()

                assert(service.shareCodeWhispererContentWithAWS === true)
            })

            it('should send opt-out header if no settings are specificed', async () => {
                features.lsp.workspace.getConfiguration.returns(Promise.resolve({}))
                await features.start(server)

                assert(service.shareCodeWhispererContentWithAWS === false)
            })
        })
    })

    describe('Recommendations With References', () => {
        let features: TestFeatures
        let server: Server
        // TODO move more of the service code out of the stub and into the testable realm
        // See: https://aws.amazon.com/blogs/developer/mocking-modular-aws-sdk-for-javascript-v3-in-unit-tests/
        // for examples on how to mock just the SDK client
        let service: StubbedInstance<CodeWhispererServiceBase>

        beforeEach(() => {
            // Set up the server with a mock service, returning predefined recommendations
            service = stubInterface<CodeWhispererServiceBase>()
            service.generateSuggestions.returns(
                Promise.resolve({
                    suggestions: EXPECTED_SUGGESTION_LIST,
                    responseContext: EXPECTED_RESPONSE_CONTEXT,
                })
            )
            server = CodewhispererServerFactory(_auth => service)

            // Initialize the features, but don't start server yet
            features = new TestFeatures()
        })

        afterEach(() => {
            features.dispose()
        })

        it('should return all recommendations if no settings are specificed', async () => {
            features.lsp.workspace.getConfiguration.returns(Promise.resolve({}))
            await features.start(server)
            const result = await features.openDocument(SOME_FILE).doInlineCompletionWithReferences(
                {
                    textDocument: { uri: SOME_FILE.uri },
                    position: { line: 0, character: 0 },
                    context: { triggerKind: InlineCompletionTriggerKind.Invoked },
                },
                CancellationToken.None
            )

            // Check the completion result
            assert.deepEqual(result, EXPECTED_RESULT_WITHOUT_REFERENCES)
        })

        it('should filter recommendations with references if GetConfiguration is not handled by the client', async () => {
            features.lsp.workspace.getConfiguration.returns(Promise.reject(new Error('GetConfiguration failed')))
            await features.start(server)
            const result = await features.openDocument(SOME_FILE).doInlineCompletionWithReferences(
                {
                    textDocument: { uri: SOME_FILE.uri },
                    position: { line: 0, character: 0 },
                    context: { triggerKind: InlineCompletionTriggerKind.Invoked },
                },
                CancellationToken.None
            )

            // Check the completion result
            assert.deepEqual(result, EXPECTED_RESULT_WITHOUT_REFERENCES)
        })

        it('should return all recommendations if settings are true', async () => {
            features.lsp.workspace.getConfiguration.returns(
                Promise.resolve({ includeSuggestionsWithCodeReferences: true })
            )
            await features.start(server)
            const result = await features.openDocument(SOME_FILE).doInlineCompletionWithReferences(
                {
                    textDocument: { uri: SOME_FILE.uri },
                    position: { line: 0, character: 0 },
                    context: { triggerKind: InlineCompletionTriggerKind.Invoked },
                },
                CancellationToken.None
            )

            // Check the completion result
            assert.deepEqual(result, EXPECTED_RESULT_WITH_REFERENCES)
        })

        it('should filter recommendations with references if no code references are allowed by settings', async () => {
            features.lsp.workspace.getConfiguration.returns(
                Promise.resolve({ includeSuggestionsWithCodeReferences: false })
            )
            await features.start(server)
            const result = await features.openDocument(SOME_FILE).doInlineCompletionWithReferences(
                {
                    textDocument: { uri: SOME_FILE.uri },
                    position: { line: 0, character: 0 },
                    context: { triggerKind: InlineCompletionTriggerKind.Invoked },
                },
                CancellationToken.None
            )

            // Check the completion result
            assert.deepEqual(result, EXPECTED_RESULT_WITHOUT_REFERENCES)
        })

        it('should filter recommendations with references if code references are disabled after startup', async () => {
            features.lsp.workspace.getConfiguration.returns(
                Promise.resolve({ includeSuggestionsWithCodeReferences: true })
            )
            await features.start(server)

            features.lsp.workspace.getConfiguration.returns(
                Promise.resolve({ includeSuggestionsWithCodeReferences: false })
            )
            const afterConfigChange = await features.openDocument(SOME_FILE).doChangeConfiguration()

            const result = await afterConfigChange.doInlineCompletionWithReferences(
                {
                    textDocument: { uri: SOME_FILE.uri },
                    position: { line: 0, character: 0 },
                    context: { triggerKind: InlineCompletionTriggerKind.Invoked },
                },
                CancellationToken.None
            )

            // Check the completion result
            assert.deepEqual(result, EXPECTED_RESULT_WITHOUT_REFERENCES)
        })

        it('should filter recommendations with references if code references are enabled after startup', async () => {
            features.lsp.workspace.getConfiguration.returns(
                Promise.resolve({ includeSuggestionsWithCodeReferences: false })
            )
            await features.start(server)
            features.lsp.workspace.getConfiguration.returns(
                Promise.resolve({ includeSuggestionsWithCodeReferences: true })
            )
            const afterConfigChange = await features.openDocument(SOME_FILE).doChangeConfiguration()

            const result = await afterConfigChange.doInlineCompletionWithReferences(
                {
                    textDocument: { uri: SOME_FILE.uri },
                    position: { line: 0, character: 0 },
                    context: { triggerKind: InlineCompletionTriggerKind.Invoked },
                },
                CancellationToken.None
            )

            // Check the completion result
            assert.deepEqual(result, EXPECTED_RESULT_WITH_REFERENCES)
        })

        it('should not show references when the right context is equal to suggestion', async () => {
            features.lsp.workspace.getConfiguration.returns(
                Promise.resolve({ includeSuggestionsWithCodeReferences: true })
            )
            await features.start(server)

            const EXPECTED_SUGGESTION: Suggestion[] = [{ itemId: 'cwspr-item-id', content: HELLO_WORLD_IN_CSHARP }]
            service.generateSuggestions.returns(
                Promise.resolve({
                    suggestions: EXPECTED_SUGGESTION,
                    responseContext: EXPECTED_RESPONSE_CONTEXT,
                })
            )

            const result = await features.openDocument(SOME_FILE).doInlineCompletionWithReferences(
                {
                    textDocument: { uri: SOME_FILE.uri },
                    position: { line: 0, character: 0 },
                    context: { triggerKind: InlineCompletionTriggerKind.Invoked },
                },
                CancellationToken.None
            )

            assert.deepEqual(result, EMPTY_RESULT)
        })

        it('should show references and update range when there is partial overlap on right context', async () => {
            features.lsp.workspace.getConfiguration.returns(
                Promise.resolve({ includeSuggestionsWithCodeReferences: true })
            )
            await features.start(server)

            const cutOffLine = 2
            const lines = HELLO_WORLD_IN_CSHARP.split('\n')
            // The recommendation will be the contents of hello world starting from line 3 (static void Main)
            const recommendation = lines.slice(cutOffLine).join('\n')
            // We delete the static void Main line from Hello World but keep the rest in the file
            const deletedLine = lines.splice(cutOffLine, 1)[0]

            const finalFileContent = lines.join('\n')
            const MY_FILE = TextDocument.create('file:///rightContext.cs', 'csharp', 1, finalFileContent)
            features.openDocument(MY_FILE)

            const EXPECTED_REFERENCE_WITH_LONG_RANGE = {
                ...EXPECTED_REFERENCE,
                recommendationContentSpan: { start: 0, end: HELLO_WORLD_IN_CSHARP.length },
            }

            const EXPECTED_SUGGESTION: Suggestion[] = [
                { itemId: 'cwspr-item-id', content: recommendation, references: [EXPECTED_REFERENCE_WITH_LONG_RANGE] },
            ]
            const insertText = deletedLine.concat('\n    ')
            const EXPECTED_RESULT = {
                sessionId: EXPECTED_SESSION_ID,
                items: [
                    {
                        itemId: EXPECTED_SUGGESTION[0].itemId,
                        insertText: insertText,
                        range: undefined,
                        references: [
                            {
                                licenseName: EXPECTED_REFERENCE_WITH_LONG_RANGE.licenseName,
                                referenceName: EXPECTED_REFERENCE_WITH_LONG_RANGE.repository,
                                referenceUrl: EXPECTED_REFERENCE_WITH_LONG_RANGE.url,
                                position: {
                                    startCharacter: EXPECTED_REFERENCE_WITH_LONG_RANGE.recommendationContentSpan?.start,
                                    endCharacter: insertText.length - 1,
                                },
                            },
                        ],
                    },
                ],
            }
            service.generateSuggestions.returns(
                Promise.resolve({
                    suggestions: EXPECTED_SUGGESTION,
                    responseContext: EXPECTED_RESPONSE_CONTEXT,
                })
            )

            const result = await features.openDocument(MY_FILE).doInlineCompletionWithReferences(
                {
                    textDocument: { uri: MY_FILE.uri },
                    position: { line: cutOffLine, character: 0 },
                    context: { triggerKind: InlineCompletionTriggerKind.Invoked },
                },
                CancellationToken.None
            )

            assert.deepEqual(result, EXPECTED_RESULT)
        })

        it('should discard reference if it references trimmed content after right-context merge', async () => {
            features.lsp.workspace.getConfiguration.returns(
                Promise.resolve({ includeSuggestionsWithCodeReferences: true })
            )
            await features.start(server)

            const cutOffLine = 2
            const lines = HELLO_WORLD_IN_CSHARP.split('\n')
            // The recommendation will be the contents of hello world starting from line 3 (static void Main)
            const recommendation = lines.slice(cutOffLine).join('\n')
            // We delete the static void Main line from Hello World but keep the rest in the file
            const deletedLine = lines.splice(cutOffLine, 1)[0]

            const finalFileContent = lines.join('\n')
            const MY_FILE = TextDocument.create('file:///rightContext.cs', 'csharp', 1, finalFileContent)
            features.openDocument(MY_FILE)

            const insertText = deletedLine.concat('\n    ')

            // reference range covers portion of string that will be removed
            const EXPECTED_REFERENCE_WITH_OUTER_RANGE = {
                ...EXPECTED_REFERENCE,
                recommendationContentSpan: { start: insertText.length, end: recommendation.length },
            }

            const EXPECTED_SUGGESTION: Suggestion[] = [
                { itemId: 'cwspr-item-id', content: recommendation, references: [EXPECTED_REFERENCE_WITH_OUTER_RANGE] },
            ]

            const EXPECTED_RESULT = {
                sessionId: EXPECTED_SESSION_ID,
                items: [
                    {
                        itemId: EXPECTED_SUGGESTION[0].itemId,
                        insertText: insertText,
                        range: undefined,
                        references: undefined,
                    },
                ],
            }
            service.generateSuggestions.returns(
                Promise.resolve({
                    suggestions: EXPECTED_SUGGESTION,
                    responseContext: EXPECTED_RESPONSE_CONTEXT,
                })
            )

            const result = await features.openDocument(MY_FILE).doInlineCompletionWithReferences(
                {
                    textDocument: { uri: MY_FILE.uri },
                    position: { line: cutOffLine, character: 0 },
                    context: { triggerKind: InlineCompletionTriggerKind.Invoked },
                },
                CancellationToken.None
            )

            assert.deepEqual(result, EXPECTED_RESULT)
        })

        describe('With session management', () => {
            it('should close session if code references are disabled and all suggestions had references', async () => {
                const EXPECTED_SUGGESTION_WITH_REFERENCES: Suggestion[] = [
                    {
                        itemId: 'cwspr-item-id-1',
                        content: 'recommendation with reference',
                        references: [EXPECTED_REFERENCE],
                    },
                ]
                service.generateSuggestions.returns(
                    Promise.resolve({
                        suggestions: EXPECTED_SUGGESTION_WITH_REFERENCES,
                        responseContext: EXPECTED_RESPONSE_CONTEXT,
                    })
                )
                features.lsp.workspace.getConfiguration.returns(
                    Promise.resolve({ includeSuggestionsWithCodeReferences: false })
                )
                await features.start(server)

                const result = await features.openDocument(SOME_FILE).doInlineCompletionWithReferences(
                    {
                        textDocument: { uri: SOME_FILE.uri },
                        position: { line: 0, character: 0 },
                        context: { triggerKind: InlineCompletionTriggerKind.Invoked },
                    },
                    CancellationToken.None
                )

                // Check the completion result
                assert.deepEqual(result, EMPTY_RESULT)

                // There is no active session
                assert.equal(sessionManager.getActiveSession(), undefined)
                assert.equal(sessionManagerSpy.createSession.callCount, 1)
                assert.equal(sessionManagerSpy.closeSession.callCount, 1)
            })
        })
    })

    describe('With auto-triggers', async () => {
        const AUTO_TRIGGER_POSITION = { line: 2, character: 21 }
        const LEFT_FILE_CONTEXT = HELLO_WORLD_IN_CSHARP.substring(0, 40)
        const RIGHT_FILE_CONTEXT = HELLO_WORLD_IN_CSHARP.substring(40)

        let features: TestFeatures
        let server: Server
        // TODO move more of the service code out of the stub and into the testable realm
        // See: https://aws.amazon.com/blogs/developer/mocking-modular-aws-sdk-for-javascript-v3-in-unit-tests/
        // for examples on how to mock just the SDK client
        let service: StubbedInstance<CodeWhispererServiceBase>

        beforeEach(async () => {
            // Set up the server with a mock service, returning predefined recommendations
            service = stubInterface<CodeWhispererServiceBase>()
            service.generateSuggestions.returns(
                Promise.resolve({
                    suggestions: EXPECTED_SUGGESTION,
                    responseContext: EXPECTED_RESPONSE_CONTEXT,
                })
            )

            server = CodewhispererServerFactory(_auth => service)

            // Initialize the features, but don't start server yet
            features = new TestFeatures()

            // Return no specific configuration for CodeWhisperer
            features.lsp.workspace.getConfiguration.returns(Promise.resolve({}))

            // Start the server and open a document
            await features.start(server)

            features.openDocument(SOME_FILE)
        })

        afterEach(() => {
            features.dispose()
        })

        it('should return recommendations on an above-threshold auto-trigger position', async () => {
            // Similar to test from above, this test case also depends on file contents not starting with a new line
            const HELLO_WORLD_IN_CSHARP_WITHOUT_NEWLINE = HELLO_WORLD_IN_CSHARP.trimStart()
            const SOME_FILE = TextDocument.create('file:///test.cs', 'csharp', 1, HELLO_WORLD_IN_CSHARP_WITHOUT_NEWLINE)
            features.openDocument(SOME_FILE)
            const LEFT_FILE_CONTEXT = HELLO_WORLD_IN_CSHARP_WITHOUT_NEWLINE.substring(0, 40)
            const RIGHT_FILE_CONTEXT = HELLO_WORLD_IN_CSHARP_WITHOUT_NEWLINE.substring(40)

            const result = await features.doInlineCompletionWithReferences(
                {
                    textDocument: { uri: SOME_FILE.uri },
                    position: AUTO_TRIGGER_POSITION,
                    context: { triggerKind: InlineCompletionTriggerKind.Automatic },
                },
                CancellationToken.None
            )

            // Check the completion result
            assert.deepEqual(result, EXPECTED_RESULT)

            const expectedGenerateSuggestionsRequest = {
                fileContext: {
                    filename: SOME_FILE.uri,
                    programmingLanguage: { languageName: 'csharp' },
                    leftFileContent: LEFT_FILE_CONTEXT,
                    rightFileContent: RIGHT_FILE_CONTEXT,
                },
                maxResults: 1,
            }
            sinon.assert.calledOnceWithExactly(service.generateSuggestions, expectedGenerateSuggestionsRequest)
        })

        it('shoud not return recommendations on a below-threshold auto-trigger position', async () => {
            const result = await features.doInlineCompletionWithReferences(
                {
                    textDocument: { uri: SOME_FILE.uri },
                    position: { line: 0, character: 0 },
                    context: { triggerKind: InlineCompletionTriggerKind.Automatic },
                },
                CancellationToken.None
            )

            // Check the completion result
            assert.deepEqual(result, EMPTY_RESULT)
        })
    })

    describe('Log Inline Completion Session Results', () => {
        const requestContext = {
            maxResults: 5,
            fileContext: {
                filename: 'SomeFile',
                programmingLanguage: { languageName: 'csharp' },
                leftFileContent: 'LeftFileContent',
                rightFileContent: 'RightFileContent',
            },
        }

        const sessionData: SessionData = {
            startPosition: { line: 0, character: 0 },
            triggerType: 'OnDemand',
            language: 'csharp',
            requestContext: requestContext,
        }

        const sessionResultData = {
            sessionId: 'some-random-session-uuid-0',
            completionSessionResult: {
                'cwspr-item-id': {
                    seen: true,
                    accepted: false,
                    discarded: false,
                },
            },
            firstCompletionDisplayLatency: 50,
            totalSessionDisplayTime: 1000,
        }

        let features: TestFeatures
        let server: Server
        // TODO move more of the service code out of the stub and into the testable realm
        // See: https://aws.amazon.com/blogs/developer/mocking-modular-aws-sdk-for-javascript-v3-in-unit-tests/
        // for examples on how to mock just the SDK client
        let service: StubbedInstance<CodeWhispererServiceBase>

        beforeEach(async () => {
            // Set up the server with a mock service, returning predefined recommendations
            service = stubInterface<CodeWhispererServiceBase>()

            server = CodewhispererServerFactory(_auth => service)

            // Initialize the features, but don't start server yet
            features = new TestFeatures()

            // Start the server and open a document
            await features.start(server)

            features.openDocument(SOME_FILE)
        })

        afterEach(() => {
            features.dispose()
        })

        it('should deactivate current session when session result for current session is sent', async () => {
            const manager = SessionManager.getInstance()
            const session = manager.createSession(sessionData)
            manager.activateSession(session)
            assert.equal(session.state, 'ACTIVE')

            await features.doLogInlineCompletionSessionResults(sessionResultData)
            assert.equal(session.state, 'CLOSED')
        })

        it('should not close current session when session result for different session is sent', async () => {
            const manager = SessionManager.getInstance()
            const session = manager.createSession(sessionData)
            manager.activateSession(session)
            const session2 = manager.createSession(sessionData)
            manager.activateSession(session2)
            assert.equal(session.state, 'CLOSED')
            assert.equal(session2.state, 'ACTIVE')

            await features.doLogInlineCompletionSessionResults(sessionResultData)
            assert.equal(session2.state, 'ACTIVE')
        })

        it('should store session result data', async () => {
            const manager = SessionManager.getInstance()
            const session = manager.createSession(sessionData)
            manager.activateSession(session)
            await features.doLogInlineCompletionSessionResults(sessionResultData)

            assert.equal(session.completionSessionResult, sessionResultData.completionSessionResult)
            assert.equal(session.firstCompletionDisplayLatency, sessionResultData.firstCompletionDisplayLatency)
            assert.equal(session.totalSessionDisplayTime, sessionResultData.totalSessionDisplayTime)
        })

        it('should store session result data with only completion state provided', async () => {
            const sessionResultData = {
                sessionId: 'some-random-session-uuid-0',
                completionSessionResult: {
                    'cwspr-item-id': {
                        seen: true,
                        accepted: false,
                        discarded: false,
                    },
                },
            }
            const manager = SessionManager.getInstance()
            const session = manager.createSession(sessionData)
            manager.activateSession(session)
            await features.doLogInlineCompletionSessionResults(sessionResultData)

            assert.equal(session.completionSessionResult, sessionResultData.completionSessionResult)
            assert.equal(session.firstCompletionDisplayLatency, undefined)
            assert.equal(session.totalSessionDisplayTime, undefined)
        })
    })

    describe('Telemetry', () => {
        const EXPECTED_RESPONSE_CONTEXT: ResponseContext = {
            requestId: 'cwspr-request-id',
            codewhispererSessionId: 'cwspr-session-id',
        }
        const sessionResultData = {
            sessionId: 'some-random-session-uuid-0',
            completionSessionResult: {
                'cwspr-item-id': {
                    seen: true,
                    accepted: false,
                    discarded: false,
                },
            },
            firstCompletionDisplayLatency: 50,
            totalSessionDisplayTime: 1000,
        }

        let features: TestFeatures
        let server: Server
        // TODO move more of the service code out of the stub and into the testable realm
        // See: https://aws.amazon.com/blogs/developer/mocking-modular-aws-sdk-for-javascript-v3-in-unit-tests/
        // for examples on how to mock just the SDK client
        let service: StubbedInstance<CodeWhispererServiceBase>
        let clock: sinon.SinonFakeTimers

        beforeEach(async () => {
            clock = sinon.useFakeTimers({
                now: 1483228800000,
            })

            // Set up the server with a mock service, returning predefined recommendations
            service = stubInterface<CodeWhispererServiceBase>()
            service.generateSuggestions.returns(
                Promise.resolve({
                    suggestions: EXPECTED_SUGGESTION,
                    responseContext: EXPECTED_RESPONSE_CONTEXT,
                })
            )

            server = CodewhispererServerFactory(_auth => service)

            // Initialize the features, but don't start server yet
            features = new TestFeatures()

            // Return no specific configuration for CodeWhisperer
            features.lsp.workspace.getConfiguration.returns(Promise.resolve({}))

            // Start the server and open a document
            await features.start(server)

            features.openDocument(SOME_FILE)
        })

        afterEach(async () => {
            clock.restore()
            features.dispose()
        })

        it('should emit Success ServiceInvocation telemetry on successful response', async () => {
            await features.doInlineCompletionWithReferences(
                {
                    textDocument: { uri: SOME_FILE.uri },
                    position: { line: 0, character: 0 },
                    context: { triggerKind: InlineCompletionTriggerKind.Invoked },
                },
                CancellationToken.None
            )

            const expectedServiceInvocationMetric: MetricEvent = {
                name: 'codewhisperer_serviceInvocation',
                result: 'Succeeded',
                data: {
                    codewhispererRequestId: 'cwspr-request-id',
                    codewhispererSessionId: 'cwspr-session-id',
                    codewhispererLastSuggestionIndex: 0,
                    codewhispererCompletionType: 'Line',
                    codewhispererTriggerType: 'OnDemand',
                    codewhispererAutomatedTriggerType: undefined,
                    duration: 0,
                    codewhispererLineNumber: 0,
                    codewhispererCursorOffset: 0,
                    codewhispererLanguage: 'csharp',
                    credentialStartUrl: undefined,
                },
            }
            sinon.assert.calledOnceWithExactly(features.telemetry.emitMetric, expectedServiceInvocationMetric)
        })

        it('should emit Success ServiceInvocation telemetry on successful response with completionType block when first suggestion has new lines', async () => {
            const recommendation = ['multi', 'line', ' suggestion'].join('\n')
            const EXPECTED_SUGGESTIONS = [
                { itemId: 'cwspr-item-id-1', content: recommendation },
                { itemId: 'cwspr-item-id-2', content: recommendation },
                { itemId: 'cwspr-item-id-3', content: recommendation },
            ]
            service.generateSuggestions.returns(
                Promise.resolve({
                    suggestions: EXPECTED_SUGGESTIONS,
                    responseContext: EXPECTED_RESPONSE_CONTEXT,
                })
            )

            await features.doInlineCompletionWithReferences(
                {
                    textDocument: { uri: SOME_FILE.uri },
                    position: { line: 0, character: 0 },
                    context: { triggerKind: InlineCompletionTriggerKind.Invoked },
                },
                CancellationToken.None
            )

            const expectedServiceInvocationMetric: MetricEvent = {
                name: 'codewhisperer_serviceInvocation',
                result: 'Succeeded',
                data: {
                    codewhispererRequestId: 'cwspr-request-id',
                    codewhispererSessionId: 'cwspr-session-id',
                    codewhispererLastSuggestionIndex: 2,
                    codewhispererCompletionType: 'Block',
                    codewhispererTriggerType: 'OnDemand',
                    codewhispererAutomatedTriggerType: undefined,
                    duration: 0,
                    codewhispererLineNumber: 0,
                    codewhispererCursorOffset: 0,
                    codewhispererLanguage: 'csharp',
                    credentialStartUrl: undefined,
                },
            }
            sinon.assert.calledOnceWithExactly(features.telemetry.emitMetric, expectedServiceInvocationMetric)
        })

        it('should emit Failure ServiceInvocation telemetry on failed response', async () => {
            const error = new Error('UNEXPECTED EXCEPTION')
            error.name = 'TestError'
            service.generateSuggestions.returns(Promise.reject(error))

            await features.doInlineCompletionWithReferences(
                {
                    textDocument: { uri: SOME_FILE.uri },
                    position: { line: 0, character: 0 },
                    context: { triggerKind: InlineCompletionTriggerKind.Invoked },
                },
                CancellationToken.None
            )

            const expectedServiceInvocationMetric: MetricEvent = {
                name: 'codewhisperer_serviceInvocation',
                result: 'Failed',
                data: {
                    codewhispererRequestId: undefined,
                    codewhispererSessionId: undefined,
                    codewhispererLastSuggestionIndex: -1,
                    codewhispererTriggerType: 'OnDemand',
                    codewhispererAutomatedTriggerType: undefined,
                    reason: 'CodeWhisperer Invocation Exception: TestError',
                    duration: 0,
                    codewhispererLineNumber: 0,
                    codewhispererCursorOffset: 0,
                    codewhispererLanguage: 'csharp',
                    credentialStartUrl: undefined,
                },
                errorData: {
                    reason: 'TestError',
                    errorCode: undefined,
                    httpStatusCode: undefined,
                },
            }
            sinon.assert.calledOnceWithExactly(features.telemetry.emitMetric, expectedServiceInvocationMetric)
        })

        it('should emit error with UnknownError reason if error name is not present', async () => {
            service.generateSuggestions.returns(Promise.reject('UNEXPECTED EXCEPTION'))

            await features.doInlineCompletionWithReferences(
                {
                    textDocument: { uri: SOME_FILE.uri },
                    position: { line: 0, character: 0 },
                    context: { triggerKind: InlineCompletionTriggerKind.Invoked },
                },
                CancellationToken.None
            )

            const expectedServiceInvocationMetric: MetricEvent = {
                name: 'codewhisperer_serviceInvocation',
                result: 'Failed',
                data: {
                    codewhispererRequestId: undefined,
                    codewhispererSessionId: undefined,
                    codewhispererLastSuggestionIndex: -1,
                    codewhispererTriggerType: 'OnDemand',
                    codewhispererAutomatedTriggerType: undefined,
                    reason: 'CodeWhisperer Invocation Exception: UnknownError',
                    duration: 0,
                    codewhispererLineNumber: 0,
                    codewhispererCursorOffset: 0,
                    codewhispererLanguage: 'csharp',
                    credentialStartUrl: undefined,
                },
                errorData: {
                    reason: 'UnknownError',
                    errorCode: undefined,
                    httpStatusCode: undefined,
                },
            }
            sinon.assert.calledOnceWithExactly(features.telemetry.emitMetric, expectedServiceInvocationMetric)
        })

        it('should emit Failure ServiceInvocation telemetry with request metadata on failed response with AWSError error type', async () => {
            const error: AWSError = new Error('Fake Error') as AWSError
            error.name = 'TestAWSError'
            error.code = 'TestErrorStatusCode'
            error.statusCode = 500
            error.time = new Date()
            error.requestId = 'failed-request-id'

            service.generateSuggestions.callsFake(_request => {
                clock.tick(1000)

                return Promise.reject(error)
            })

            const getCompletionsPromise = features.doInlineCompletionWithReferences(
                {
                    textDocument: { uri: SOME_FILE.uri },
                    position: { line: 0, character: 0 },
                    context: { triggerKind: InlineCompletionTriggerKind.Invoked },
                },
                CancellationToken.None
            )
            await getCompletionsPromise

            const expectedServiceInvocationMetric: MetricEvent = {
                name: 'codewhisperer_serviceInvocation',
                result: 'Failed',
                data: {
                    codewhispererRequestId: 'failed-request-id',
                    codewhispererSessionId: undefined,
                    codewhispererLastSuggestionIndex: -1,
                    codewhispererTriggerType: 'OnDemand',
                    codewhispererAutomatedTriggerType: undefined,
                    reason: 'CodeWhisperer Invocation Exception: TestAWSError',
                    duration: 1000,
                    codewhispererLineNumber: 0,
                    codewhispererCursorOffset: 0,
                    codewhispererLanguage: 'csharp',
                    credentialStartUrl: undefined,
                },
                errorData: {
                    reason: 'TestAWSError',
                    errorCode: 'TestErrorStatusCode',
                    httpStatusCode: 500,
                },
            }
            sinon.assert.calledOnceWithExactly(features.telemetry.emitMetric, expectedServiceInvocationMetric)
        })

        it('should emit Perceived Latency metric when session result is received', async () => {
            await features.doInlineCompletionWithReferences(
                {
                    textDocument: { uri: SOME_FILE.uri },
                    position: { line: 0, character: 0 },
                    context: { triggerKind: InlineCompletionTriggerKind.Invoked },
                },
                CancellationToken.None
            )

            await features.doLogInlineCompletionSessionResults(sessionResultData)

            const expectedPerceivedLatencyMetric: MetricEvent = {
                name: 'codewhisperer_perceivedLatency',
                data: {
                    codewhispererRequestId: EXPECTED_RESPONSE_CONTEXT.requestId,
                    codewhispererSessionId: EXPECTED_RESPONSE_CONTEXT.codewhispererSessionId,
                    codewhispererCompletionType: 'Line',
                    codewhispererTriggerType: 'OnDemand',
                    duration: 50,
                    codewhispererLanguage: 'csharp',
                    credentialStartUrl: undefined,
                },
            }
            sinon.assert.calledWithExactly(features.telemetry.emitMetric, expectedPerceivedLatencyMetric)
        })

        it('should not emit Perceived Latency metric when firstCompletionDisplayLatency is absent', async () => {
            const sessionResultDataWithoutLatency = {
                ...sessionResultData,
                firstCompletionDisplayLatency: undefined,
            }
            await features.doInlineCompletionWithReferences(
                {
                    textDocument: { uri: SOME_FILE.uri },
                    position: { line: 0, character: 0 },
                    context: { triggerKind: InlineCompletionTriggerKind.Invoked },
                },
                CancellationToken.None
            )

            await features.doLogInlineCompletionSessionResults(sessionResultDataWithoutLatency)

            sinon.assert.neverCalledWith(
                features.telemetry.emitMetric,
                sinon.match.has('name', 'codewhisperer_perceivedLatency')
            )
        })

        describe('Connection metadata credentialStartUrl field', () => {
            it('should attach credentialStartUrl field if available in credentialsProvider', async () => {
                features.credentialsProvider.getConnectionMetadata.returns({
                    sso: {
                        startUrl: 'http://teststarturl',
                    },
                })

                await features.doInlineCompletionWithReferences(
                    {
                        textDocument: { uri: SOME_FILE.uri },
                        position: { line: 0, character: 0 },
                        context: { triggerKind: InlineCompletionTriggerKind.Invoked },
                    },
                    CancellationToken.None
                )

                assert.equal(
                    features.telemetry.emitMetric.getCall(0).args[0].data.credentialStartUrl,
                    'http://teststarturl'
                )
            })

            it('should send empty credentialStartUrl field if not available in credentialsProvider', async () => {
                features.credentialsProvider.getConnectionMetadata.returns(undefined)

                await features.doInlineCompletionWithReferences(
                    {
                        textDocument: { uri: SOME_FILE.uri },
                        position: { line: 0, character: 0 },
                        context: { triggerKind: InlineCompletionTriggerKind.Invoked },
                    },
                    CancellationToken.None
                )

                assert.equal(features.telemetry.emitMetric.getCall(0).args[0].data.credentialStartUrl, undefined)
            })
        })
    })

    describe('Recommendations session management', () => {
        const AUTO_TRIGGER_POSITION = { line: 2, character: 21 }

        let features: TestFeatures
        let server: Server
        // TODO move more of the service code out of the stub and into the testable realm
        // See: https://aws.amazon.com/blogs/developer/mocking-modular-aws-sdk-for-javascript-v3-in-unit-tests/
        // for examples on how to mock just the SDK client
        let service: StubbedInstance<CodeWhispererServiceBase>
        let clock: sinon.SinonFakeTimers

        beforeEach(async () => {
            clock = sinon.useFakeTimers({
                now: 1483228800000,
            })
            // Set up the server with a mock service, returning predefined recommendations
            service = stubInterface<CodeWhispererServiceBase>()
            service.generateSuggestions.returns(
                Promise.resolve({
                    suggestions: EXPECTED_SUGGESTION,
                    responseContext: EXPECTED_RESPONSE_CONTEXT,
                })
            )

            server = CodewhispererServerFactory(_auth => service)

            // Initialize the features, but don't start server yet
            features = new TestFeatures()

            // Return no specific configuration for CodeWhisperer
            features.lsp.workspace.getConfiguration.returns(Promise.resolve({}))

            // Start the server and open a document
            await features.start(server)

            features.openDocument(SOME_FILE).openDocument(SOME_FILE_WITH_ALT_CASED_LANGUAGE_ID)
        })

        afterEach(() => {
            clock.restore()
            features.dispose()
        })

        it('should cache new session on new request when no session exists', async () => {
            let activeSession = sessionManager.getCurrentSession()
            assert.equal(activeSession, undefined)

            await features.doInlineCompletionWithReferences(
                {
                    textDocument: { uri: SOME_FILE.uri },
                    position: AUTO_TRIGGER_POSITION,
                    context: { triggerKind: InlineCompletionTriggerKind.Automatic },
                },
                CancellationToken.None
            )

            // Get session after call is done
            activeSession = sessionManager.getCurrentSession()

            const expectedSessionData = {
                id: SESSION_IDS_LOG[0],
                state: 'ACTIVE',
                suggestions: [{ itemId: 'cwspr-item-id', content: 'recommendation' }],
                responseContext: EXPECTED_RESPONSE_CONTEXT,
                codewhispererSessionId: EXPECTED_RESPONSE_CONTEXT.codewhispererSessionId,
                timeToFirstRecommendation: 0,
            }
            assert(activeSession)
            sinon.assert.match(
                {
                    id: activeSession.id,
                    state: activeSession.state,
                    suggestions: activeSession.suggestions,
                    responseContext: activeSession.responseContext,
                    codewhispererSessionId: activeSession.codewhispererSessionId,
                    timeToFirstRecommendation: activeSession.timeToFirstRecommendation,
                },
                expectedSessionData
            )
        })

        it('should discard inflight session on new request when cached session is in REQUESTING state on subsequent requests', async () => {
            const getCompletionsResponses = await Promise.all([
                features.doInlineCompletionWithReferences(
                    {
                        textDocument: { uri: SOME_FILE.uri },
                        position: AUTO_TRIGGER_POSITION,
                        context: { triggerKind: InlineCompletionTriggerKind.Automatic },
                    },
                    CancellationToken.None
                ),
                features.doInlineCompletionWithReferences(
                    {
                        textDocument: { uri: SOME_FILE.uri },
                        position: AUTO_TRIGGER_POSITION,
                        context: { triggerKind: InlineCompletionTriggerKind.Automatic },
                    },
                    CancellationToken.None
                ),
                features.doInlineCompletionWithReferences(
                    {
                        textDocument: { uri: SOME_FILE.uri },
                        position: AUTO_TRIGGER_POSITION,
                        context: { triggerKind: InlineCompletionTriggerKind.Automatic },
                    },
                    CancellationToken.None
                ),
            ])

            // 3 requests were processed by server, but only first should return results
            const EXPECTED_COMPLETION_RESPONSES = [
                { sessionId: '', items: [] },
                { sessionId: '', items: [] },
                { sessionId: SESSION_IDS_LOG[2], items: EXPECTED_RESULT.items }, // Last session wins
            ]
            // Only last request must return completion items
            assert.deepEqual(getCompletionsResponses, EXPECTED_COMPLETION_RESPONSES)

            assert.equal(sessionManagerSpy.createSession.callCount, 3)

            // Get session after call is done
            const activeSession = sessionManager.getCurrentSession()

            // 3 sessions were created
            assert.equal(SESSION_IDS_LOG.length, 3)

            // Last session is ACTIVE stored in manager correctly
            const expectedSessionData = {
                id: SESSION_IDS_LOG[2],
                state: 'ACTIVE',
                suggestions: [{ itemId: 'cwspr-item-id', content: 'recommendation' }],
            }
            assert(activeSession)
            sinon.assert.match(
                {
                    id: activeSession.id,
                    state: activeSession.state,
                    suggestions: activeSession.suggestions,
                },
                expectedSessionData
            )
        })

        it('should record all sessions that were created in session log', async () => {
            // Start 3 session, 2 will be cancelled inflight
            await Promise.all([
                features.doInlineCompletionWithReferences(
                    {
                        textDocument: { uri: SOME_FILE.uri },
                        position: AUTO_TRIGGER_POSITION,
                        context: { triggerKind: InlineCompletionTriggerKind.Automatic },
                    },
                    CancellationToken.None
                ),
                features.doInlineCompletionWithReferences(
                    {
                        textDocument: { uri: SOME_FILE.uri },
                        position: AUTO_TRIGGER_POSITION,
                        context: { triggerKind: InlineCompletionTriggerKind.Automatic },
                    },
                    CancellationToken.None
                ),
                features.doInlineCompletionWithReferences(
                    {
                        textDocument: { uri: SOME_FILE.uri },
                        position: AUTO_TRIGGER_POSITION,
                        context: { triggerKind: InlineCompletionTriggerKind.Automatic },
                    },
                    CancellationToken.None
                ),
            ])

            // Get session after call is done
            const firstActiveSession = sessionManager.getCurrentSession()

            // Do another request, which will close last ACTIVE session
            await features.doInlineCompletionWithReferences(
                {
                    textDocument: { uri: SOME_FILE.uri },
                    position: AUTO_TRIGGER_POSITION,
                    context: { triggerKind: InlineCompletionTriggerKind.Automatic },
                },
                CancellationToken.None
            )

            assert.equal(sessionManagerSpy.createSession.callCount, 4)
            assert.equal(sessionManager.getSessionsLog().length, 4)

            const latestSession = sessionManager.getCurrentSession()

            assert.equal(latestSession, sessionManager.getActiveSession())
            assert.equal(latestSession, sessionManager.getCurrentSession())

            // All sessions
            assert.equal(firstActiveSession?.id, 'some-random-session-uuid-2')
        })

        it('should close new session on new request when service returns empty list', async () => {
            service.generateSuggestions.returns(
                Promise.resolve({
                    suggestions: [],
                    responseContext: EXPECTED_RESPONSE_CONTEXT,
                })
            )

            const activeSession = sessionManager.getCurrentSession()
            assert.equal(activeSession, undefined)

            await features.doInlineCompletionWithReferences(
                {
                    textDocument: { uri: SOME_FILE.uri },
                    position: AUTO_TRIGGER_POSITION,
                    context: { triggerKind: InlineCompletionTriggerKind.Automatic },
                },
                CancellationToken.None
            )

            // Get session after call is done
            const currentSession = sessionManager.getCurrentSession()
            assert(currentSession)
            assert.equal(currentSession?.state, 'CLOSED')
            sinon.assert.calledOnceWithExactly(sessionManagerSpy.closeSession, currentSession)
        })

        it('Manual completion invocation should close previous session', async () => {
            const TRIGGER_KIND = InlineCompletionTriggerKind.Invoked

            const result = await features.doInlineCompletionWithReferences(
                {
                    textDocument: { uri: SOME_FILE.uri },
                    position: { line: 0, character: 0 },
                    // Manual trigger kind
                    context: { triggerKind: TRIGGER_KIND },
                },
                CancellationToken.None
            )

            assert.deepEqual(result, EXPECTED_RESULT)
            const firstSession = sessionManager.getActiveSession()

            // There is ACTIVE session
            assert(firstSession)
            assert.equal(sessionManager.getCurrentSession(), firstSession)
            assert.equal(firstSession.state, 'ACTIVE')

            const secondResult = await features.doInlineCompletionWithReferences(
                {
                    textDocument: { uri: SOME_FILE.uri },
                    position: { line: 0, character: 0 },
                    context: { triggerKind: TRIGGER_KIND },
                },
                CancellationToken.None
            )
            assert.deepEqual(secondResult, { ...EXPECTED_RESULT, sessionId: SESSION_IDS_LOG[1] })
            sinon.assert.called(sessionManagerSpy.closeCurrentSession)
        })

        it('should discard inflight session if merge right recommendations resulted in list of empty strings', async () => {
            // The suggestion returned by generateSuggestions will be equal to the contents of the file
            // This test fails when the file starts with a new line, probably due to the way we handle right context merge
            // So let's use hello world without the newline in the beginning
            const HELLO_WORLD_IN_CSHARP_WITHOUT_NEWLINE = HELLO_WORLD_IN_CSHARP.trimStart()
            const SOME_FILE = TextDocument.create('file:///test.cs', 'csharp', 1, HELLO_WORLD_IN_CSHARP_WITHOUT_NEWLINE)
            features.openDocument(SOME_FILE)
            const EXPECTED_SUGGESTION: Suggestion[] = [
                { itemId: 'cwspr-item-id', content: HELLO_WORLD_IN_CSHARP_WITHOUT_NEWLINE },
            ]
            service.generateSuggestions.returns(
                Promise.resolve({
                    suggestions: EXPECTED_SUGGESTION,
                    responseContext: EXPECTED_RESPONSE_CONTEXT,
                })
            )

            const result = await features.doInlineCompletionWithReferences(
                {
                    textDocument: { uri: SOME_FILE.uri },
                    position: { line: 0, character: 0 },
                    context: { triggerKind: InlineCompletionTriggerKind.Invoked },
                },
                CancellationToken.None
            )
            assert.deepEqual(result, EMPTY_RESULT)

            const session = sessionManager.getCurrentSession()

            assert(session)
            assert(session.state, 'CLOSED')
            sinon.assert.calledOnce(sessionManagerSpy.closeSession)
        })
    })
})
