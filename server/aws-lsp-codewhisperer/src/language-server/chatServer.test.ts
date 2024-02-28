import { Server } from '@aws/language-server-runtimes'
import { TestFeatures } from '@aws/language-server-runtimes/out/testing'
import * as assert from 'assert'
import sinon, { StubbedInstance, stubInterface } from 'ts-sinon'
import { CancellationToken } from 'vscode-languageserver'
import { ChatServerFactory } from './chatServer'
import { CodeWhispererServiceBase } from './codeWhispererService'

describe('Chat Server', () => {
    let features: TestFeatures
    let server: Server
    // Stubbing nested objects is a bit clunky if you want to access the stubbed versions
    // of the methods through `service.client.method`.
    let service: StubbedInstance<
        CodeWhispererServiceBase & { client: StubbedInstance<CodeWhispererServiceBase['client']> }
    >

    const CHAT_COMMAND = 'ChatCommand'
    const CHAT_OPERATION = 'ChatOperation'
    const SOME_CHAT_MESSAGE = 'hello, world'
    const SOME_API_VERSION = '1.0'
    const EXPECTED_RESULT = 'ChatResult, versions: 1.0'

    beforeEach(async () => {
        // Again, clunky.
        service = stubInterface<
            CodeWhispererServiceBase & { client: StubbedInstance<CodeWhispererServiceBase['client']> }
        >()
        service.client = stubInterface<typeof service.client>()
        service.client.apiVersions = [SOME_API_VERSION]
        server = ChatServerFactory(_auth => service)

        // Initialize the features, but don't start server yet
        features = new TestFeatures()

        // Start the server
        await features.start(server)
    })

    afterEach(() => {
        features.dispose()
    })

    it('Handles chat commands', async () => {
        const result = await features.doExecuteCommand(
            { command: CHAT_COMMAND, arguments: [{ message: SOME_CHAT_MESSAGE }] },
            CancellationToken.None
        )

        sinon.assert.calledOnceWithExactly(service.client.makeRequest, CHAT_OPERATION, { message: SOME_CHAT_MESSAGE })
        assert.equal(result.result, EXPECTED_RESULT)
    })
})
