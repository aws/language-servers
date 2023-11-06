import { Server } from '@aws-placeholder/aws-language-server-runtimes'
import * as assert from 'assert'
import { AWSError } from 'aws-sdk'
import sinon, { StubbedInstance, stubInterface } from 'ts-sinon'
import { CancellationToken, InlineCompletionTriggerKind } from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { TestFeatures } from './TestFeatures'
import { CodewhispererServerFactory } from './codeWhispererServer'
import { CodeWhispererServiceBase, ResponseContext, Suggestion } from './codeWhispererService'

describe('CodeWhisperer Server', () => {
    describe('Recommendations', () => {
        const HELLO_WORLD_IN_CSHARP = `
class HelloWorld
{
    static void Main()
    {
        Console.WriteLine("Hello World!");
    }
}
`
        const SOME_FILE = TextDocument.create('file:///test.cs', 'csharp', 1, HELLO_WORLD_IN_CSHARP)
        const SOME_FILE_WITH_ALT_CASED_LANGUAGE_ID = TextDocument.create(
            // Use unsupported extension, so that we can test that we get a match based on the LanguageId
            'file:///test.seesharp',
            'CSharp',
            1,
            HELLO_WORLD_IN_CSHARP
        )
        const SOME_CLOSED_FILE = TextDocument.create('file:///closed.cs', 'csharp', 1, HELLO_WORLD_IN_CSHARP)
        const SOME_UNSUPPORTED_FILE = TextDocument.create(
            'file:///hopper.fm',
            'flow-matic',
            1,
            'INPUT HELLO ; OUTPUT WORLD'
        )
        const SOME_FILE_WITH_EXTENSION = TextDocument.create('file:///missing.cs', '', 1, HELLO_WORLD_IN_CSHARP)

        const HELLO_WORLD_LINE = `Console.WriteLine("Hello World!");`
        // Single line file will not have the full line contents
        const SINGLE_LINE_FILE_CUTOFF_INDEX = 2
        const SOME_SINGLE_LINE_FILE = TextDocument.create(
            'file:///single.cs',
            'csharp',
            1,
            HELLO_WORLD_LINE.substring(SINGLE_LINE_FILE_CUTOFF_INDEX)
        )

        const EXPECTED_SUGGESTION: Suggestion[] = [{ content: 'recommendation' }]
        const EXPECTED_RESPONSE_CONTEXT: ResponseContext = {
            requestId: 'cwspr-request-id',
            codewhispererSessionId: 'cwspr-session-id',
        }
        const EXPECTED_RESULT = {
            items: [{ insertText: EXPECTED_SUGGESTION[0].content, range: undefined, references: undefined }],
        }

        const EMPTY_RESULT = { items: [] }

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
                    programmingLanguage: { languageName: 'csharp' },
                    leftFileContent: '',
                    rightFileContent: HELLO_WORLD_IN_CSHARP,
                },
                maxResults: 5,
            }

            // Check the service was called with the right parameters
            sinon.assert.calledOnceWithExactly(service.generateSuggestions, expectedGenerateSuggestionsRequest)
        })

        // Merge right tests
        it('should not show recommendation when the recommendation is equal to right context ', async () => {
            // The suggestion returned by generateSuggestions will be equal to the contents of the file
            const EXPECTED_SUGGESTION: Suggestion[] = [{ content: HELLO_WORLD_IN_CSHARP }]
            service.generateSuggestions.returns(
                Promise.resolve({
                    suggestions: EXPECTED_SUGGESTION,
                    responseContext: EXPECTED_RESPONSE_CONTEXT,
                })
            )
            const EXPECTED_RESULT = { items: [{ insertText: '', range: undefined, references: undefined }] }

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

        it('should only show the part of the recommendation that does not overlap with the right context in multiline', async () => {
            const cutOffLine = 3
            const lines = HELLO_WORLD_IN_CSHARP.split('\n')
            // The recommendation will be the contents of hello world starting from line 3 (static void Main)
            const recommendation = lines.slice(cutOffLine).join('\n')
            // We delete the static void Main line from Hello World but keep the rest in the file
            const deletedLine = lines.splice(cutOffLine, 1)[0]

            const finalFileContent = lines.join('\n')
            const MY_FILE = TextDocument.create('file:///rightContext.cs', 'csharp', 1, finalFileContent)
            features.openDocument(MY_FILE)

            const EXPECTED_SUGGESTION: Suggestion[] = [{ content: recommendation }]
            service.generateSuggestions.returns(
                Promise.resolve({
                    suggestions: EXPECTED_SUGGESTION,
                    responseContext: EXPECTED_RESPONSE_CONTEXT,
                })
            )
            // Expected result is the deleted line + new line + 4 spaces
            // Newline and the 4 spaces get lost when we do the `split` so we add them back to expected result
            const EXPECTED_RESULT = {
                items: [{ insertText: deletedLine.concat('\n    '), range: undefined, references: undefined }],
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

        it('should only show the part of the recommendation that does not overlap with the right context', async () => {
            const EXPECTED_SUGGESTION: Suggestion[] = [{ content: HELLO_WORLD_LINE }]
            service.generateSuggestions.returns(
                Promise.resolve({
                    suggestions: EXPECTED_SUGGESTION,
                    responseContext: EXPECTED_RESPONSE_CONTEXT,
                })
            )
            const EXPECTED_RESULT = {
                items: [
                    {
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
            const EXPECTED_SUGGESTION: Suggestion[] = [{ content: 'Something something' }]
            service.generateSuggestions.returns(
                Promise.resolve({
                    suggestions: EXPECTED_SUGGESTION,
                    responseContext: EXPECTED_RESPONSE_CONTEXT,
                })
            )
            const EXPECTED_RESULT = {
                items: [{ insertText: EXPECTED_SUGGESTION[0].content, range: undefined, references: undefined }],
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
            assert.deepEqual(result, {
                items: [],
            })
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
        })
    })

    describe('Recommendations With References', () => {
        const HELLO_WORLD_IN_CSHARP = `
class HelloWorld
{
    static void Main()
    {
        Console.WriteLine("Hello World!");
    }
}
`
        const SOME_FILE = TextDocument.create('file:///test.cs', 'csharp', 1, HELLO_WORLD_IN_CSHARP)
        const EXPECTED_REFERENCE = {
            licenseName: 'test license',
            repository: 'test repository',
            url: 'test url',
            recommendationContentSpan: { start: 0, end: 1 },
        }
        const EXPECTED_SUGGESTION: Suggestion[] = [
            { content: 'recommendation without reference' },
            { content: 'recommendation with reference', references: [EXPECTED_REFERENCE] },
        ]
        const EXPECTED_RESPONSE_CONTEXT: ResponseContext = {
            requestId: 'cwspr-request-id',
            codewhispererSessionId: 'cwspr-session-id',
        }
        const EXPECTED_RESULT_WITH_REFERENCES = {
            items: [
                {
                    insertText: EXPECTED_SUGGESTION[0].content,
                    range: undefined,
                    references: undefined,
                },
                {
                    insertText: EXPECTED_SUGGESTION[1].content,
                    range: undefined,
                    references: [
                        {
                            licenseName: EXPECTED_REFERENCE.licenseName,
                            referenceName: EXPECTED_REFERENCE.repository,
                            referenceUrl: EXPECTED_REFERENCE.url,
                            position: {
                                startCharacter: EXPECTED_REFERENCE.recommendationContentSpan?.start,
                                endCharacter: EXPECTED_REFERENCE.recommendationContentSpan?.end,
                            },
                        },
                    ],
                },
            ],
        }
        const EXPECTED_RESULT_WITHOUT_REFERENCES = {
            items: [
                {
                    insertText: EXPECTED_SUGGESTION[0].content,
                    range: undefined,
                    references: undefined,
                },
            ],
        }

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
                    suggestions: EXPECTED_SUGGESTION,
                    responseContext: EXPECTED_RESPONSE_CONTEXT,
                })
            )
            server = CodewhispererServerFactory(_auth => service)

            // Initialize the features, but don't start server yet
            features = new TestFeatures()
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
            assert.deepEqual(result, EXPECTED_RESULT_WITH_REFERENCES)
        })

        it('should return all recommendations if GetConfiguration is not handled by the client', async () => {
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
            assert.deepEqual(result, EXPECTED_RESULT_WITH_REFERENCES)
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
            features.lsp.workspace.getConfiguration.returns(Promise.resolve({}))
            await features.start(server)

            const EXPECTED_SUGGESTION: Suggestion[] = [{ content: HELLO_WORLD_IN_CSHARP }]
            const EXPECTED_RESULT_WITH_REMOVED_REFERENCES = {
                items: [{ insertText: '', range: undefined, references: undefined }],
            }
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

            assert.deepEqual(result, EXPECTED_RESULT_WITH_REMOVED_REFERENCES)
        })

        it('should show references and update range when there is partial overlap on right context', async () => {
            // TODO, this test should fail once we implement logic for updating the reference range
            features.lsp.workspace.getConfiguration.returns(Promise.resolve({}))
            await features.start(server)

            const cutOffLine = 3
            const lines = HELLO_WORLD_IN_CSHARP.split('\n')
            // The recommendation will be the contents of hello world starting from line 3 (static void Main)
            const recommendation = lines.slice(cutOffLine).join('\n')
            // We delete the static void Main line from Hello World but keep the rest in the file
            const deletedLine = lines.splice(cutOffLine, 1)[0]

            const finalFileContent = lines.join('\n')
            const MY_FILE = TextDocument.create('file:///rightContext.cs', 'csharp', 1, finalFileContent)
            features.openDocument(MY_FILE)

            const EXPECTED_SUGGESTION: Suggestion[] = [{ content: recommendation, references: [EXPECTED_REFERENCE] }]
            const EXPECTED_RESULT = {
                items: [
                    {
                        insertText: deletedLine.concat('\n    '),
                        range: undefined,
                        references: [
                            {
                                licenseName: EXPECTED_REFERENCE.licenseName,
                                referenceName: EXPECTED_REFERENCE.repository,
                                referenceUrl: EXPECTED_REFERENCE.url,
                                position: {
                                    //The position indices will change after we implement logic for partial overlap in references
                                    startCharacter: EXPECTED_REFERENCE.recommendationContentSpan?.start,
                                    endCharacter: EXPECTED_REFERENCE.recommendationContentSpan?.end,
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
    })

    describe('With auto-triggers', async () => {
        const HELLO_WORLD_IN_CSHARP = `class HelloWorld
{
    static void Main()
    {
        Console.WriteLine("Hello World!");
    }
}
`
        const AUTO_TRIGGER_POSITION = { line: 2, character: 21 }
        const LEFT_FILE_CONTEXT = HELLO_WORLD_IN_CSHARP.substring(0, 40)
        const RIGHT_FILE_CONTEXT = HELLO_WORLD_IN_CSHARP.substring(40)

        const SOME_FILE = TextDocument.create('file:///test.cs', 'csharp', 1, HELLO_WORLD_IN_CSHARP)
        const EXPECTED_SUGGESTION: Suggestion[] = [{ content: 'recommendation' }]
        const EXPECTED_RESPONSE_CONTEXT: ResponseContext = {
            requestId: 'cwspr-request-id',
            codewhispererSessionId: 'cwspr-session-id',
        }
        const EXPECTED_RESULT = {
            items: [{ insertText: EXPECTED_SUGGESTION[0].content, range: undefined, references: undefined }],
        }

        const EMPTY_RESULT = { items: [] }

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

        it('should return recommendations on an above-threshold auto-trigger position', async () => {
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

    describe('Telemetry', () => {
        const HELLO_WORLD_IN_CSHARP = `
class HelloWorld
{
    static void Main()
    {
        Console.WriteLine("Hello World!");
    }
}
`
        const SOME_FILE = TextDocument.create('file:///test.cs', 'csharp', 1, HELLO_WORLD_IN_CSHARP)
        const EXPECTED_SUGGESTION: Suggestion[] = [{ content: 'recommendation' }]
        const EXPECTED_RESPONSE_CONTEXT: ResponseContext = {
            requestId: 'cwspr-request-id',
            codewhispererSessionId: 'cwspr-session-id',
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

            const expectedServiceInvocationMetric = {
                name: 'ServiceInvocation',
                data: {
                    codewhispererRequestId: 'cwspr-request-id',
                    codewhispererSessionId: 'cwspr-session-id',
                    codewhispererLastSuggestionIndex: 0,
                    codewhispererCompletionType: 'Line',
                    codewhispererTriggerType: 'OnDemand',
                    codewhispererAutomatedTriggerType: undefined,
                    result: 'Succeeded',
                    duration: 0,
                    codewhispererLineNumber: 0,
                    codewhispererCursorOffset: 0,
                    codewhispererLanguage: 'csharp',
                    credentialStartUrl: '',
                },
            }
            sinon.assert.calledOnceWithExactly(features.telemetry.emitMetric, expectedServiceInvocationMetric)
        })

        it('should emit Success ServiceInvocation telemetry on successful response with completionType block when first suggestion has new lines', async () => {
            // The recommendation will be the contents of hello world starting from line 3 (static void Main)
            const recommendation = ['multi', 'line', ' suggestion'].join('\n')
            const EXPECTED_SUGGESTIONS = [
                { content: recommendation },
                { content: recommendation },
                { content: recommendation },
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

            const expectedServiceInvocationMetric = {
                name: 'ServiceInvocation',
                data: {
                    codewhispererRequestId: 'cwspr-request-id',
                    codewhispererSessionId: 'cwspr-session-id',
                    codewhispererLastSuggestionIndex: 2,
                    codewhispererCompletionType: 'Block',
                    codewhispererTriggerType: 'OnDemand',
                    codewhispererAutomatedTriggerType: undefined,
                    result: 'Succeeded',
                    duration: 0,
                    codewhispererLineNumber: 0,
                    codewhispererCursorOffset: 0,
                    codewhispererLanguage: 'csharp',
                    credentialStartUrl: '',
                },
            }
            sinon.assert.calledOnceWithExactly(features.telemetry.emitMetric, expectedServiceInvocationMetric)
        })

        it('should emit Failure ServiceInvocation telemetry on failed response', async () => {
            service.generateSuggestions.returns(Promise.reject('UNEXPECTED EXCEPTION'))

            await features.doInlineCompletionWithReferences(
                {
                    textDocument: { uri: SOME_FILE.uri },
                    position: { line: 0, character: 0 },
                    context: { triggerKind: InlineCompletionTriggerKind.Invoked },
                },
                CancellationToken.None
            )

            const expectedServiceInvocationMetric = {
                name: 'ServiceInvocation',
                data: {
                    codewhispererRequestId: undefined,
                    codewhispererSessionId: undefined,
                    codewhispererLastSuggestionIndex: -1,
                    codewhispererTriggerType: 'OnDemand',
                    codewhispererAutomatedTriggerType: undefined,
                    result: 'Failed',
                    reason: 'CodeWhisperer Invocation Exception: UNEXPECTED EXCEPTION',
                    duration: 0,
                    codewhispererLineNumber: 0,
                    codewhispererCursorOffset: 0,
                    codewhispererLanguage: 'csharp',
                    credentialStartUrl: '',
                },
            }
            sinon.assert.calledOnceWithExactly(features.telemetry.emitMetric, expectedServiceInvocationMetric)
        })

        it('should emit Failure ServiceInvocation telemetry with request metadata on failed response with AWSError error type', async () => {
            // @ts-ignore
            const error: AWSError = new Error('Fake Error')
            error.name = 'AWSError'
            error.code = '500'
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

            const expectedServiceInvocationMetric = {
                name: 'ServiceInvocation',
                data: {
                    codewhispererRequestId: 'failed-request-id',
                    codewhispererSessionId: undefined,
                    codewhispererLastSuggestionIndex: -1,
                    codewhispererTriggerType: 'OnDemand',
                    codewhispererAutomatedTriggerType: undefined,
                    result: 'Failed',
                    reason: 'CodeWhisperer Invocation Exception: AWSError: Fake Error',
                    duration: 1000,
                    codewhispererLineNumber: 0,
                    codewhispererCursorOffset: 0,
                    codewhispererLanguage: 'csharp',
                    credentialStartUrl: '',
                },
            }
            sinon.assert.calledOnceWithExactly(features.telemetry.emitMetric, expectedServiceInvocationMetric)
        })
    })
})
