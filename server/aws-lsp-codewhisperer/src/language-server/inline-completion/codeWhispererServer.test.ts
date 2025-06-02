import {
    Server,
    CancellationToken,
    InlineCompletionTriggerKind,
    TextDocument,
    MetricEvent,
    Position,
    InitializeParams,
    ResponseError,
} from '@aws/language-server-runtimes/server-interface'
import { TestFeatures } from '@aws/language-server-runtimes/testing'
import * as assert from 'assert'
import { AWSError } from 'aws-sdk'
import sinon, { StubbedInstance } from 'ts-sinon'
import { CONTEXT_CHARACTERS_LIMIT, CodewhispererServerFactory } from './codeWhispererServer'
import {
    CodeWhispererServiceBase,
    CodeWhispererServiceToken,
    ResponseContext,
    Suggestion,
} from '../../shared/codeWhispererService'
import { CodeWhispererSession, SessionData, SessionManager } from './session/sessionManager'
import {
    EMPTY_RESULT,
    EXPECTED_NEXT_TOKEN,
    EXPECTED_REFERENCE,
    EXPECTED_RESPONSE_CONTEXT,
    EXPECTED_RESULT,
    EXPECTED_RESULT_WITHOUT_IMPORTS,
    EXPECTED_RESULT_WITHOUT_REFERENCES,
    EXPECTED_RESULT_WITH_IMPORTS,
    EXPECTED_RESULT_WITH_REFERENCES,
    EXPECTED_SESSION_ID,
    EXPECTED_SUGGESTION,
    EXPECTED_SUGGESTION_LIST,
    EXPECTED_SUGGESTION_LIST_WITH_IMPORTS,
    HELLO_WORLD_IN_CSHARP,
    HELLO_WORLD_LINE,
    HELLO_WORLD_WITH_WINDOWS_ENDING,
    SAMPLE_SESSION_DATA,
    SINGLE_LINE_FILE_CUTOFF_INDEX,
    SOME_CLOSED_FILE,
    SOME_FILE,
    SOME_FILE_UNDER_WORKSPACE_FOLDER,
    SOME_FILE_WITH_ALT_CASED_LANGUAGE_ID,
    SOME_FILE_WITH_EXTENSION,
    SOME_SINGLE_LINE_FILE,
    SOME_UNSUPPORTED_FILE,
    SOME_WORKSPACE_FOLDER,
    SPECIAL_CHARACTER_HELLO_WORLD,
    stubCodeWhispererService,
} from '../../shared/testUtils'
import { CodeDiffTracker } from './codeDiffTracker'
import { TelemetryService } from '../../shared/telemetry/telemetryService'
import { initBaseTestServiceManager, TestAmazonQServiceManager } from '../../shared/amazonQServiceManager/testUtils'
import { LocalProjectContextController } from '../../shared/localProjectContextController'
import { URI } from 'vscode-uri'
import { INVALID_TOKEN } from '../../shared/constants'
import { AmazonQError, AmazonQServiceConnectionExpiredError } from '../../shared/amazonQServiceManager/errors'
import * as path from 'path'

const updateConfiguration = async (
    features: TestFeatures,
    getConfigurationReturns?: Promise<any>
): Promise<TestFeatures> => {
    features.lsp.workspace.getConfiguration.returns(getConfigurationReturns ?? Promise.resolve({}))

    // Mocked trigger of didChangeConfiguration in amazonQServer
    await TestAmazonQServiceManager.getInstance().handleDidChangeConfiguration()

    // Invoke event twice to ensure LSP Router propagates didChangeConfiguration notification and allows time for it to take effect in tests
    await features.openDocument(SOME_FILE).doChangeConfiguration()
    await features.openDocument(SOME_FILE).doChangeConfiguration()

    return features
}

const startServer = async (features: TestFeatures, server: Server): Promise<TestFeatures> => {
    await features.initialize(server)

    // Mocked trigger of didChangeConfiguration in amazonQServer
    await TestAmazonQServiceManager.getInstance().handleDidChangeConfiguration()

    return features
}

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
        sinon.restore()
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
            service = stubCodeWhispererService()
            service.generateSuggestions.returns(
                Promise.resolve({
                    suggestions: EXPECTED_SUGGESTION,
                    responseContext: EXPECTED_RESPONSE_CONTEXT,
                })
            )

            // Initialize the features, but don't start server yet
            features = new TestFeatures()
            //@ts-ignore
            features.logging = console

            TestAmazonQServiceManager.resetInstance()
            server = CodewhispererServerFactory(() => initBaseTestServiceManager(features, service))

            // Return no specific configuration for CodeWhisperer
            features.lsp.workspace.getConfiguration.returns(Promise.resolve({}))

            // Start the server and open a document
            await startServer(features, server)

            features
                .openDocument(SOME_FILE)
                .openDocument(SOME_FILE_WITH_ALT_CASED_LANGUAGE_ID)
                .openDocument(SOME_UNSUPPORTED_FILE)
                .openDocument(SOME_FILE_WITH_EXTENSION)
                .openDocument(SOME_SINGLE_LINE_FILE)
                .openDocument(SOME_FILE_UNDER_WORKSPACE_FOLDER)
        })

        afterEach(() => {
            features.dispose()
            TestAmazonQServiceManager.resetInstance()
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
                    fileUri: SOME_FILE.uri,
                    filename: URI.parse(SOME_FILE.uri).path.substring(1),
                    programmingLanguage: { languageName: 'csharp' },
                    leftFileContent: '',
                    rightFileContent: HELLO_WORLD_IN_CSHARP,
                    // workspaceFolder: undefined,
                },
                maxResults: 5,
                // workspaceId: undefined,
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
                    fileUri: SOME_FILE.uri,
                    filename: URI.parse(SOME_FILE.uri).path.substring(1),
                    programmingLanguage: { languageName: 'csharp' },
                    leftFileContent: firstTwoLines,
                    rightFileContent: remainingLines,
                    // workspaceFolder: undefined,
                },
                maxResults: 5,
                // workspaceId: undefined,
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

        it('should correctly get filename', async () => {
            features.workspace.getWorkspaceFolder
                .withArgs(SOME_FILE_UNDER_WORKSPACE_FOLDER.uri)
                .returns(SOME_WORKSPACE_FOLDER)
            const result = await features.doInlineCompletionWithReferences(
                {
                    textDocument: { uri: SOME_FILE_UNDER_WORKSPACE_FOLDER.uri },
                    position: { line: 0, character: 0 },
                    context: { triggerKind: InlineCompletionTriggerKind.Invoked },
                },
                CancellationToken.None
            )

            // Check the completion result
            assert.deepEqual(result, EXPECTED_RESULT)

            const expectedGenerateSuggestionsRequest = {
                fileContext: {
                    fileUri: SOME_FILE_UNDER_WORKSPACE_FOLDER.uri,
                    filename: path.relative(SOME_WORKSPACE_FOLDER.uri, SOME_FILE_UNDER_WORKSPACE_FOLDER.uri),
                    programmingLanguage: { languageName: 'csharp' },
                    leftFileContent: '',
                    rightFileContent: HELLO_WORLD_IN_CSHARP,
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
                    fileUri: SOME_FILE_WITH_ALT_CASED_LANGUAGE_ID.uri,
                    filename: URI.parse(SOME_FILE_WITH_ALT_CASED_LANGUAGE_ID.uri).path.substring(1),
                    programmingLanguage: { languageName: 'csharp' },
                    leftFileContent: '',
                    rightFileContent: HELLO_WORLD_IN_CSHARP,
                    // workspaceFolder: undefined,
                },
                maxResults: 5,
                // workspaceId: undefined,
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

        it('should include extra context in recommendation request when extraContext is configured', async () => {
            const extraContext = 'Additional context for test'

            await updateConfiguration(
                features,

                Promise.resolve({
                    inlineSuggestions: {
                        extraContext,
                    },
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

            assert.deepEqual(result, EXPECTED_RESULT)

            const expectedGenerateSuggestionsRequest = {
                fileContext: {
                    fileUri: SOME_FILE.uri,
                    filename: URI.parse(SOME_FILE.uri).path.substring(1),
                    programmingLanguage: { languageName: 'csharp' },
                    leftFileContent: extraContext + '\n',
                    rightFileContent: HELLO_WORLD_IN_CSHARP,
                    // workspaceFolder: undefined,
                },
                maxResults: 5,
                // workspaceId: undefined,
            }
            sinon.assert.calledOnceWithExactly(service.generateSuggestions, expectedGenerateSuggestionsRequest)
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
                    fileUri: SOME_FILE_WITH_EXTENSION.uri,
                    filename: URI.parse(SOME_FILE_WITH_EXTENSION.uri).path.substring(1),
                    programmingLanguage: { languageName: 'cpp' },
                    leftFileContent: '',
                    rightFileContent: HELLO_WORLD_IN_CSHARP,
                    // workspaceFolder: undefined,
                },
                maxResults: 5,
                // workspaceId: undefined,
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
                        mostRelevantMissingImports: undefined,
                    },
                ],
                partialResultToken: undefined,
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
                    fileUri: MY_FILE.uri,
                    filename: URI.parse(MY_FILE.uri).path.substring(1),
                    programmingLanguage: { languageName: 'csharp' },
                    leftFileContent: leftContext,
                    rightFileContent: rightContext,
                    // workspaceFolder: undefined,
                },
                maxResults: 5,
                // workspaceId: undefined,
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
                    fileUri: MY_WINDOWS_FILE.uri,
                    filename: URI.parse(MY_WINDOWS_FILE.uri).path.substring(1),
                    programmingLanguage: { languageName: 'csharp' },
                    leftFileContent: modifiedLeftContext,
                    rightFileContent: modifiedRightContext,
                    // workspaceFolder: undefined,
                },
                maxResults: 5,
                // workspaceId: undefined,
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
                        mostRelevantMissingImports: undefined,
                    },
                ],
                partialResultToken: undefined,
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
                        mostRelevantMissingImports: undefined,
                    },
                ],
                partialResultToken: undefined,
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

        // pagination
        it('returns next token from service', async () => {
            service.generateSuggestions.returns(
                Promise.resolve({
                    suggestions: EXPECTED_SUGGESTION,
                    responseContext: { ...EXPECTED_RESPONSE_CONTEXT, nextToken: EXPECTED_NEXT_TOKEN },
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

            assert.deepEqual(result, { ...EXPECTED_RESULT, partialResultToken: EXPECTED_NEXT_TOKEN })
        })

        it('handles partialResultToken in request', async () => {
            const manager = SessionManager.getInstance()
            manager.createSession(SAMPLE_SESSION_DATA)
            await features.doInlineCompletionWithReferences(
                {
                    textDocument: { uri: SOME_FILE.uri },
                    position: { line: 0, character: 0 },
                    context: { triggerKind: InlineCompletionTriggerKind.Invoked },
                    partialResultToken: EXPECTED_NEXT_TOKEN,
                },
                CancellationToken.None
            )

            const expectedGenerateSuggestionsRequest = {
                fileContext: {
                    filename: SOME_FILE.uri,
                    programmingLanguage: { languageName: 'csharp' },
                    leftFileContent: '',
                    rightFileContent: HELLO_WORLD_IN_CSHARP,
                },
                maxResults: 5,
                nextToken: EXPECTED_NEXT_TOKEN,
            }

            sinon.assert.calledOnceWithExactly(service.generateSuggestions, expectedGenerateSuggestionsRequest)
        })

        it('should truncate left and right context in paginated requests', async () => {
            // Reset the stub to handle multiple calls with different responses
            service.generateSuggestions.reset()

            // First request returns suggestions with a nextToken
            service.generateSuggestions.onFirstCall().returns(
                Promise.resolve({
                    suggestions: EXPECTED_SUGGESTION,
                    responseContext: { ...EXPECTED_RESPONSE_CONTEXT, nextToken: EXPECTED_NEXT_TOKEN },
                })
            )

            // Second request (pagination) returns suggestions without nextToken
            service.generateSuggestions.onSecondCall().returns(
                Promise.resolve({
                    suggestions: EXPECTED_SUGGESTION,
                    responseContext: EXPECTED_RESPONSE_CONTEXT,
                })
            )

            // Create a file with content that exceeds the context limit
            const BIG_FILE_CONTENT = '123456789\n'.repeat(5000)
            const BIG_FILE = TextDocument.create('file:///big_file.cs', 'csharp', 1, BIG_FILE_CONTENT)
            const cutOffLine = 2000
            features.openDocument(BIG_FILE)

            // Make initial request
            await features.doInlineCompletionWithReferences(
                {
                    textDocument: { uri: BIG_FILE.uri },
                    position: { line: cutOffLine, character: 1 },
                    context: { triggerKind: InlineCompletionTriggerKind.Invoked },
                },
                CancellationToken.None
            )

            // Make paginated request with the token from the first response
            await features.doInlineCompletionWithReferences(
                {
                    textDocument: { uri: BIG_FILE.uri },
                    position: { line: cutOffLine, character: 1 },
                    context: { triggerKind: InlineCompletionTriggerKind.Invoked },
                    partialResultToken: EXPECTED_NEXT_TOKEN,
                },
                CancellationToken.None
            )

            // Verify both calls were made
            assert.strictEqual(service.generateSuggestions.callCount, 2)

            // Get the actual arguments from both calls
            const firstCallArgs = service.generateSuggestions.firstCall.args[0]
            const secondCallArgs = service.generateSuggestions.secondCall.args[0]

            // Verify context truncation in first call
            assert.strictEqual(firstCallArgs.fileContext.leftFileContent.length, CONTEXT_CHARACTERS_LIMIT)
            assert.strictEqual(firstCallArgs.fileContext.rightFileContent.length, CONTEXT_CHARACTERS_LIMIT)

            // Verify context truncation in second call (pagination)
            assert.strictEqual(secondCallArgs.fileContext.leftFileContent.length, CONTEXT_CHARACTERS_LIMIT)
            assert.strictEqual(secondCallArgs.fileContext.rightFileContent.length, CONTEXT_CHARACTERS_LIMIT)

            // Verify second call included the nextToken
            assert.strictEqual(secondCallArgs.nextToken, EXPECTED_NEXT_TOKEN)
        })

        it('throws ResponseError with expected message if connection is expired', async () => {
            service.generateSuggestions.returns(Promise.reject(new Error(INVALID_TOKEN)))

            const promise = async () =>
                await features.doInlineCompletionWithReferences(
                    {
                        textDocument: { uri: SOME_FILE.uri },
                        position: { line: 0, character: 0 },
                        context: { triggerKind: InlineCompletionTriggerKind.Invoked },
                    },
                    CancellationToken.None
                )
            // Throws expected error
            assert.rejects(promise, ResponseError, 'E_AMAZON_Q_CONNECTION_EXPIRED')
        })

        it('throws ResponseError if error is AmazonQError', async () => {
            service.generateSuggestions.returns(Promise.reject(new AmazonQError('test', '500')))

            const promise = async () =>
                await features.doInlineCompletionWithReferences(
                    {
                        textDocument: { uri: SOME_FILE.uri },
                        position: { line: 0, character: 0 },
                        context: { triggerKind: InlineCompletionTriggerKind.Invoked },
                    },
                    CancellationToken.None
                )
            // Throws expected error
            assert.rejects(promise, ResponseError)
        })

        describe('Supplemental Context', () => {
            it('should send supplemental context when using token authentication', async () => {
                const test_service = sinon.createStubInstance(
                    CodeWhispererServiceToken
                ) as StubbedInstance<CodeWhispererServiceToken>

                test_service.generateSuggestions.returns(
                    Promise.resolve({
                        suggestions: EXPECTED_SUGGESTION,
                        responseContext: EXPECTED_RESPONSE_CONTEXT,
                    })
                )

                sandbox.stub(LocalProjectContextController, 'getInstance').resolves({
                    queryInlineProjectContext: sandbox.stub().resolves([]),
                } as unknown as LocalProjectContextController)

                // Initialize the features, but don't start server yet
                TestAmazonQServiceManager.resetInstance()
                const test_features = new TestFeatures()
                const test_server = CodewhispererServerFactory(() =>
                    initBaseTestServiceManager(test_features, test_service)
                )

                test_features.credentialsProvider.hasCredentials.returns(true)
                test_features.credentialsProvider.getConnectionType.returns('builderId')

                // Return no specific configuration for CodeWhisperer
                test_features.lsp.workspace.getConfiguration.returns(Promise.resolve({}))

                // Start the server and open a document
                await startServer(test_features, test_server)

                // Open files supporting cross-file context
                test_features
                    .openDocument(TextDocument.create('file:///SampleFile.java', 'java', 1, 'sample-content'))
                    .openDocument(TextDocument.create('file:///TargetFile.java', 'java', 1, ''))

                await test_features.doInlineCompletionWithReferences(
                    {
                        textDocument: { uri: 'file:///TargetFile.java' },
                        position: Position.create(0, 0),
                        context: { triggerKind: InlineCompletionTriggerKind.Invoked },
                    },
                    CancellationToken.None
                )

                const expectedGenerateSuggestionsRequest = {
                    fileContext: {
                        fileUri: 'file:///TargetFile.java',
                        filename: 'TargetFile.java',
                        programmingLanguage: { languageName: 'java' },
                        leftFileContent: '',
                        rightFileContent: '',
                        // workspaceFolder: undefined,
                    },
                    maxResults: 5,
                    supplementalContexts: [
                        { content: 'sample-content', filePath: '/SampleFile.java' },
                        { content: 'sample-content', filePath: '/SampleFile.java' },
                    ],
                    // workspaceId: undefined,
                }
                sinon.assert.calledOnceWithExactly(test_service.generateSuggestions, expectedGenerateSuggestionsRequest)

                test_features.dispose()
            })
        })

        // TODO: mock http request and verify the headers are passed
        // or spawn an http server and pass it as an endpoint to the sdk client,
        // mock responses and verify that correct headers are receieved on the server side.
        // Currently the suite just checks whether the boolean is passed to codeWhispererService
        describe('Opting out of sending data to CodeWhisperer', () => {
            it('should send opt-out header when the setting is disabled', async () => {
                await updateConfiguration(features, Promise.resolve({ shareCodeWhispererContentWithAWS: false }))

                assert(service.shareCodeWhispererContentWithAWS === false)
            })

            it('should not send opt-out header when the setting is enabled after startup', async () => {
                await updateConfiguration(features, Promise.resolve({ shareCodeWhispererContentWithAWS: true }))

                assert(service.shareCodeWhispererContentWithAWS === true)
            })

            it('should send opt-out header if no settings are specificed', async () => {
                await updateConfiguration(features, Promise.resolve({}))

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

        beforeEach(async () => {
            // Set up the server with a mock service, returning predefined recommendations
            service = stubCodeWhispererService()
            service.generateSuggestions.returns(
                Promise.resolve({
                    suggestions: EXPECTED_SUGGESTION_LIST,
                    responseContext: EXPECTED_RESPONSE_CONTEXT,
                })
            )

            // Initialize the features, but don't start server yet
            features = new TestFeatures()
            //@ts-ignore
            features.logging = console
            server = CodewhispererServerFactory(() => initBaseTestServiceManager(features, service))
        })

        afterEach(() => {
            features.dispose()
            TestAmazonQServiceManager.resetInstance()
        })

        it('should return all recommendations if no settings are specificed', async () => {
            features.lsp.workspace.getConfiguration.returns(Promise.resolve({}))
            await startServer(features, server)
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

        it('should not include import statements if no settings are specified', async () => {
            features.lsp.workspace.getConfiguration.returns(Promise.resolve({}))
            await startServer(features, server)

            service.generateSuggestions.returns(
                Promise.resolve({
                    suggestions: EXPECTED_SUGGESTION_LIST_WITH_IMPORTS,
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

            // Check the completion result
            assert.deepEqual(result, EXPECTED_RESULT_WITHOUT_IMPORTS)
        })

        it('should include import statements if enabled', async () => {
            features.lsp.workspace.getConfiguration.returns(Promise.resolve({ includeImportsWithSuggestions: true }))
            await startServer(features, server)

            service.generateSuggestions.returns(
                Promise.resolve({
                    suggestions: EXPECTED_SUGGESTION_LIST_WITH_IMPORTS,
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

            assert.deepEqual(result, EXPECTED_RESULT_WITH_IMPORTS)
        })

        it('should filter recommendations with references if GetConfiguration is not handled by the client', async () => {
            features.lsp.workspace.getConfiguration.returns(Promise.reject(new Error('GetConfiguration failed')))
            await startServer(features, server)
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
            await startServer(features, server)
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
            await startServer(features, server)
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
            await startServer(features, server)

            const afterConfigChange = await updateConfiguration(
                features,
                Promise.resolve({ includeSuggestionsWithCodeReferences: false })
            )

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
            await startServer(features, server)

            const afterConfigChange = await updateConfiguration(
                features,
                Promise.resolve({ includeSuggestionsWithCodeReferences: true })
            )

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
            await startServer(features, server)

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
            await startServer(features, server)

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
                        mostRelevantMissingImports: undefined,
                    },
                ],
                partialResultToken: undefined,
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
            await startServer(features, server)

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
                        mostRelevantMissingImports: undefined,
                    },
                ],
                partialResultToken: undefined,
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
                await startServer(features, server)

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
            service = stubCodeWhispererService()
            service.generateSuggestions.returns(
                Promise.resolve({
                    suggestions: EXPECTED_SUGGESTION,
                    responseContext: EXPECTED_RESPONSE_CONTEXT,
                })
            )

            // Initialize the features, but don't start server yet
            features = new TestFeatures()
            server = CodewhispererServerFactory(() => initBaseTestServiceManager(features, service))

            // Return no specific configuration for CodeWhisperer
            features.lsp.workspace.getConfiguration.returns(Promise.resolve({}))

            // Start the server and open a document
            await startServer(features, server)

            features.openDocument(SOME_FILE)
        })

        afterEach(() => {
            features.dispose()
            TestAmazonQServiceManager.resetInstance()
        })

        it('should return recommendations even on a below-threshold auto-trigger position when special characters are present', async () => {
            const SOME_FILE = TextDocument.create('file:///test.cs', 'csharp', 1, SPECIAL_CHARACTER_HELLO_WORLD)
            features.openDocument(SOME_FILE)

            const result = await features.doInlineCompletionWithReferences(
                {
                    textDocument: { uri: SOME_FILE.uri },
                    position: { line: 0, character: 1 },
                    context: { triggerKind: InlineCompletionTriggerKind.Automatic },
                },
                CancellationToken.None
            )

            assert.deepEqual(result, EXPECTED_RESULT)

            const expectedGenerateSuggestionsRequest = {
                fileContext: {
                    fileUri: SOME_FILE.uri,
                    filename: URI.parse(SOME_FILE.uri).path.substring(1),
                    programmingLanguage: { languageName: 'csharp' },
                    leftFileContent: SPECIAL_CHARACTER_HELLO_WORLD.substring(0, 1),
                    rightFileContent: SPECIAL_CHARACTER_HELLO_WORLD.substring(1, SPECIAL_CHARACTER_HELLO_WORLD.length),
                    // workspaceFolder: undefined,
                },
                maxResults: 1,
                // workspaceId: undefined,
            }
            sinon.assert.calledOnceWithExactly(service.generateSuggestions, expectedGenerateSuggestionsRequest)
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
                    fileUri: SOME_FILE.uri,
                    filename: URI.parse(SOME_FILE.uri).path.substring(1),
                    programmingLanguage: { languageName: 'csharp' },
                    leftFileContent: LEFT_FILE_CONTEXT,
                    rightFileContent: RIGHT_FILE_CONTEXT,
                    // workspaceFolder: undefined,
                },
                maxResults: 1,
                // workspaceId: undefined,
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
            document: TextDocument.create('file:///rightContext.cs', 'csharp', 1, HELLO_WORLD_IN_CSHARP),
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
            service = stubCodeWhispererService()
            // Initialize the features, but don't start server yet
            features = new TestFeatures()

            server = CodewhispererServerFactory(() => initBaseTestServiceManager(features, service))

            // Start the server and open a document
            await startServer(features, server)

            features.openDocument(SOME_FILE)
        })

        afterEach(() => {
            features.dispose()
            TestAmazonQServiceManager.resetInstance()
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
            service = stubCodeWhispererService()
            service.generateSuggestions.returns(
                Promise.resolve({
                    suggestions: EXPECTED_SUGGESTION,
                    responseContext: EXPECTED_RESPONSE_CONTEXT,
                })
            )
            // Initialize the features, but don't start server yet
            features = new TestFeatures()
            server = CodewhispererServerFactory(() => initBaseTestServiceManager(features, service))

            // Return no specific configuration for CodeWhisperer
            features.lsp.workspace.getConfiguration.returns(Promise.resolve({}))

            // Start the server and open a document
            await startServer(features, server)

            features.openDocument(SOME_FILE)
        })

        afterEach(async () => {
            clock.restore()
            features.dispose()
            TestAmazonQServiceManager.resetInstance()
        })

        it('should emit Success ServiceInvocation telemetry on successful response', async () => {
            await updateConfiguration(
                features,
                Promise.resolve({
                    includeImportsWithSuggestions: true,
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
                    codewhispererLastSuggestionIndex: 0,
                    codewhispererCompletionType: 'Line',
                    codewhispererTriggerType: 'OnDemand',
                    codewhispererAutomatedTriggerType: undefined,
                    duration: 0,
                    codewhispererLineNumber: 0,
                    codewhispererCursorOffset: 0,
                    codewhispererLanguage: 'csharp',
                    credentialStartUrl: undefined,
                    codewhispererSupplementalContextTimeout: undefined,
                    codewhispererSupplementalContextIsUtg: undefined,
                    codewhispererSupplementalContextLatency: undefined,
                    codewhispererSupplementalContextLength: undefined,
                    codewhispererCustomizationArn: undefined,
                    result: 'Succeeded',
                    codewhispererImportRecommendationEnabled: true,
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
                    codewhispererSupplementalContextTimeout: undefined,
                    codewhispererSupplementalContextIsUtg: undefined,
                    codewhispererSupplementalContextLatency: undefined,
                    codewhispererSupplementalContextLength: undefined,
                    codewhispererCustomizationArn: undefined,
                    result: 'Succeeded',
                    codewhispererImportRecommendationEnabled: false,
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
                    codewhispererSupplementalContextTimeout: undefined,
                    codewhispererSupplementalContextIsUtg: undefined,
                    codewhispererSupplementalContextLatency: undefined,
                    codewhispererSupplementalContextLength: undefined,
                    codewhispererCustomizationArn: undefined,
                    result: 'Failed',
                    codewhispererImportRecommendationEnabled: undefined,
                    traceId: 'notSet',
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
                    codewhispererSupplementalContextTimeout: undefined,
                    codewhispererSupplementalContextIsUtg: undefined,
                    codewhispererSupplementalContextLatency: undefined,
                    codewhispererSupplementalContextLength: undefined,
                    codewhispererCustomizationArn: undefined,
                    result: 'Failed',
                    codewhispererImportRecommendationEnabled: undefined,
                    traceId: 'notSet',
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
                    codewhispererSupplementalContextTimeout: undefined,
                    codewhispererSupplementalContextIsUtg: undefined,
                    codewhispererSupplementalContextLatency: undefined,
                    codewhispererSupplementalContextLength: undefined,
                    codewhispererCustomizationArn: undefined,
                    result: 'Failed',
                    codewhispererImportRecommendationEnabled: undefined,
                    traceId: 'notSet',
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
                    codewhispererCustomizationArn: undefined,
                    result: 'Succeeded',
                    passive: true,
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

        describe('Emit UserModification event with CodeDiffTracker', () => {
            let codeDiffTrackerSpy: sinon.SinonSpy
            let telemetryServiceSpy: sinon.SinonSpy

            afterEach(() => {
                sinon.restore()
            })

            it('should enqueue a code diff entry when session results are returned with accepted completion', async () => {
                const sessionResultData = {
                    sessionId: 'some-random-session-uuid-0',
                    completionSessionResult: {
                        'cwspr-item-id': {
                            seen: true,
                            accepted: true,
                            discarded: false,
                        },
                    },
                }
                codeDiffTrackerSpy = sinon.spy(CodeDiffTracker.prototype, 'enqueue')

                await features.doInlineCompletionWithReferences(
                    {
                        textDocument: { uri: SOME_FILE.uri },
                        position: { line: 0, character: 0 },
                        context: { triggerKind: InlineCompletionTriggerKind.Invoked },
                    },
                    CancellationToken.None
                )

                await features.doLogInlineCompletionSessionResults(sessionResultData)

                sinon.assert.calledOnceWithExactly(codeDiffTrackerSpy, {
                    sessionId: 'cwspr-session-id',
                    requestId: 'cwspr-request-id',
                    fileUrl: 'file:///test.cs',
                    languageId: 'csharp',
                    time: 1483228800000,
                    originalString: 'recommendation',
                    startPosition: { line: 0, character: 0 },
                    endPosition: { line: 0, character: 14 },
                    customizationArn: undefined,
                    completionType: 'Line',
                    triggerType: 'OnDemand',
                    credentialStartUrl: undefined,
                })
            })

            it('should emit telemetryService.emitUserModificationEvent on schedule by CodeDiffTracker', async () => {
                const startTime = new Date()
                const sessionResultData = {
                    sessionId: 'some-random-session-uuid-0',
                    completionSessionResult: {
                        'cwspr-item-id': {
                            seen: true,
                            accepted: true,
                            discarded: false,
                        },
                    },
                }
                telemetryServiceSpy = sinon.spy(TelemetryService.prototype, 'emitUserModificationEvent')

                await features.doInlineCompletionWithReferences(
                    {
                        textDocument: { uri: SOME_FILE.uri },
                        position: { line: 0, character: 0 },
                        context: { triggerKind: InlineCompletionTriggerKind.Invoked },
                    },
                    CancellationToken.None
                )

                await features.doLogInlineCompletionSessionResults(sessionResultData)

                await clock.tickAsync(5 * 60 * 1000 + 30)

                sinon.assert.calledOnceWithExactly(
                    telemetryServiceSpy,
                    {
                        sessionId: 'cwspr-session-id',
                        requestId: 'cwspr-request-id',
                        languageId: 'csharp',
                        customizationArn: undefined,
                        timestamp: new Date(startTime.getTime() + 5 * 60 * 1000),
                        acceptedCharacterCount: 14,
                        modificationPercentage: 0.9285714285714286,
                        unmodifiedAcceptedCharacterCount: 1,
                    },
                    {
                        completionType: 'Line',
                        triggerType: 'OnDemand',
                        credentialStartUrl: undefined,
                    }
                )
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
            service = stubCodeWhispererService()
            service.generateSuggestions.returns(
                Promise.resolve({
                    suggestions: EXPECTED_SUGGESTION,
                    responseContext: EXPECTED_RESPONSE_CONTEXT,
                })
            )

            // Initialize the features, but don't start server yet
            features = new TestFeatures()
            server = CodewhispererServerFactory(() => initBaseTestServiceManager(features, service))

            // Return no specific configuration for CodeWhisperer
            features.lsp.workspace.getConfiguration.returns(Promise.resolve({}))

            // Start the server and open a document
            await startServer(features, server)

            features.openDocument(SOME_FILE).openDocument(SOME_FILE_WITH_ALT_CASED_LANGUAGE_ID)
        })

        afterEach(() => {
            clock.restore()
            features.dispose()
            TestAmazonQServiceManager.resetInstance()
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
                suggestions: [{ itemId: 'cwspr-item-id', content: 'recommendation', insertText: 'recommendation' }],
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
                { sessionId: SESSION_IDS_LOG[2], items: EXPECTED_RESULT.items, partialResultToken: undefined }, // Last session wins
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
                suggestions: [{ itemId: 'cwspr-item-id', content: 'recommendation', insertText: 'recommendation' }],
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
