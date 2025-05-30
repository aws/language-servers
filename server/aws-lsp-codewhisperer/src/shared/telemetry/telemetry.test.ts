import {
    Server,
    InlineCompletionListWithReferences,
    CancellationToken,
    InlineCompletionTriggerKind,
    InitializeParams,
} from '@aws/language-server-runtimes/server-interface'
import { TestFeatures } from '@aws/language-server-runtimes/testing'
import sinon, { StubbedInstance, stubInterface } from 'ts-sinon'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { CodewhispererServerFactory } from '../../language-server/inline-completion/codeWhispererServer'
import { CodeWhispererServiceBase, ResponseContext, Suggestion } from '../codeWhispererService'
import { TelemetryService } from './telemetryService'
import { initBaseTestServiceManager, TestAmazonQServiceManager } from '../amazonQServiceManager/testUtils'

describe('CodeWhisperer Server', () => {
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
    const SOME_TYPING = '// this is the end of the file\n'
    const EXPECTED_SUGGESTION: Suggestion[] = [{ itemId: 'cwspr-item-id', content: '// a recommendation' }]
    const EXPECTED_RESPONSE_CONTEXT: ResponseContext = {
        requestId: 'cwspr-request-id',
        codewhispererSessionId: 'cwspr-session-id',
    }

    describe('Telemetry', () => {
        let features: TestFeatures
        let server: Server
        // TODO move more of the service code out of the stub and into the testable realm
        // See: https://aws.amazon.com/blogs/developer/mocking-modular-aws-sdk-for-javascript-v3-in-unit-tests/
        // for examples on how to mock just the SDK client
        let service: StubbedInstance<CodeWhispererServiceBase>
        let clock: sinon.SinonFakeTimers
        let telemetryServiceSpy: sinon.SinonSpy

        beforeEach(async () => {
            clock = sinon.useFakeTimers()

            // Set up the server with a mock service, returning predefined recommendations
            service = stubInterface<CodeWhispererServiceBase>()
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
            await features.initialize(server)
            await TestAmazonQServiceManager.getInstance().handleDidChangeConfiguration()

            features.openDocument(SOME_FILE)
        })

        afterEach(() => {
            clock.restore()
            features.dispose()
            TestAmazonQServiceManager.resetInstance()
        })

        it('should emit Code Percentage telemetry event every 5 minutes', async () => {
            telemetryServiceSpy = sinon.spy(TelemetryService.prototype, 'emitCodeCoverageEvent')
            await features.simulateTyping(SOME_FILE.uri, SOME_TYPING)

            const updatedDocument = features.documents[SOME_FILE.uri]
            const endPosition = updatedDocument.positionAt(updatedDocument.getText().length)

            const result = (await features.doInlineCompletionWithReferences(
                {
                    textDocument: { uri: SOME_FILE.uri },
                    position: { line: 0, character: 0 },
                    context: { triggerKind: InlineCompletionTriggerKind.Invoked },
                },
                CancellationToken.None
            )) as InlineCompletionListWithReferences

            await features.doChangeTextDocument({
                textDocument: { uri: SOME_FILE.uri, version: updatedDocument.version },
                contentChanges: [
                    { range: { start: endPosition, end: endPosition }, text: EXPECTED_SUGGESTION[0].content },
                ],
            })

            await features.doLogInlineCompletionSessionResults({
                sessionId: result?.sessionId,
                completionSessionResult: {
                    [result.items[0].itemId]: {
                        accepted: true,
                        seen: true,
                        discarded: false,
                    },
                },
            })

            const totalInsertCharacters = SOME_TYPING.length + EXPECTED_SUGGESTION[0].content.length
            const codeWhispererCharacters = EXPECTED_SUGGESTION[0].content.length
            const codePercentage = Math.round((codeWhispererCharacters / totalInsertCharacters) * 10000) / 100

            clock.tick(5000 * 60)

            sinon.assert.calledWithExactly(
                telemetryServiceSpy,
                {
                    languageId: 'csharp',
                    customizationArn: undefined,
                    totalCharacterCount: totalInsertCharacters,
                    acceptedCharacterCount: codeWhispererCharacters,
                },
                {
                    percentage: codePercentage,
                    successCount: 1,
                    credentialStartUrl: undefined,
                }
            )
        })
    })
})
