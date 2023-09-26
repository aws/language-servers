import { InlineCompletionTriggerKind } from '@aws-placeholder/aws-language-server-runtimes/out/features/lsp/inline-completions/futureTypes'
import { Server } from '@aws-placeholder/aws-language-server-runtimes/out/runtimes'
import sinon, { StubbedInstance, stubInterface } from "ts-sinon"
import { CancellationToken } from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { TestFeatures } from './TestFeatures'
import { CodewhispererServerFactory } from './codeWhispererServer'
import { CodeWhispererServiceBase } from './codeWhispererService'
import assert = require('assert')

describe("CodeWhisperer Server", () => {
    describe("Recommendations", () => {
        const SOME_CODE = `
def hello_world():
    print("hello world")

hello_world()`

        const SOME_FILE = TextDocument.create('file:///test.py', 'python', 1, SOME_CODE)
        const SOME_CLOSED_FILE = TextDocument.create('file:///closed.py', 'python', 1, SOME_CODE)
        const EXPECTED_RESULT = { items: [{ insertText: "recommendation" }] }
        const EMPTY_RESULT = { items: [] }

        let features: TestFeatures
        let server: Server
        // TODO move more of the service code out of the stub and into the testable realm
        // See: https://aws.amazon.com/blogs/developer/mocking-modular-aws-sdk-for-javascript-v3-in-unit-tests/
        // for examples on how to mock just the SDK client
        let service: StubbedInstance<CodeWhispererServiceBase>

        beforeEach(() => {
            // Set up the server with a mock service, returning predefined recommendations
            service = stubInterface<CodeWhispererServiceBase>()
            service.doInlineCompletion.returns(Promise.resolve(EXPECTED_RESULT))
            server = CodewhispererServerFactory(_auth => service)

            // Start the server and open a document
            features = new TestFeatures()
                .start(server)
                .openDocument(SOME_FILE)
        })

        it("should return recommendations", async () => {
            const result = await features
                .doInlineCompletion({
                    textDocument: { uri: SOME_FILE.uri },
                    position: { line: 0, character: 0 },
                    context: { triggerKind: InlineCompletionTriggerKind.Automatic }
                }, CancellationToken.None)

            // Check the completion result
            assert.deepEqual(result, EXPECTED_RESULT)

            // Check the service was called with the right parameters
            sinon.assert.calledOnceWithExactly(service.doInlineCompletion,
                sinon.match.has('textDocument', sinon.match.has('uri', SOME_FILE.uri))
                    .and(sinon.match.has('textDocument', sinon.match.has('languageId', 'python')))
                    .and(sinon.match.has('context', sinon.match.has('triggerKind', InlineCompletionTriggerKind.Automatic))))
        })

        it("should not return recommendations for a closed file", async () => {
            const result = await features
                .doInlineCompletion({
                    textDocument: { uri: SOME_CLOSED_FILE.uri },
                    position: { line: 0, character: 0 },
                    context: { triggerKind: InlineCompletionTriggerKind.Automatic }
                }, CancellationToken.None)

            // Check the completion result
            assert.deepEqual(result, EMPTY_RESULT)

            // Check the service was not called
            sinon.assert.notCalled(service.doInlineCompletion)
        })
    })
})
