import { Server } from '@aws/language-server-runtimes/server-interface'
import { TestFeatures } from '@aws/language-server-runtimes/testing'
import sinon, { StubbedInstance, stubInterface } from 'ts-sinon'
import { CancellationToken, ExecuteCommandParams } from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { HelloWorldServerFactory } from './helloWorldServer'
import { HelloWorldService } from './helloWorldService'

describe('Hello World Server', () => {
    const sandbox = sinon.createSandbox()

    afterEach(() => {
        sandbox.restore()
    })

    describe('Custom Commands', () => {
        let features: TestFeatures
        let service: StubbedInstance<HelloWorldService>
        let server: Server

        beforeEach(async () => {
            service = stubInterface<HelloWorldService>()
            features = new TestFeatures()
            server = HelloWorldServerFactory(service)

            // Start the server and open a document
            const file = TextDocument.create('file:///test.ts', 'typescript', 1, '')
            await features.start(server)

            features.openDocument(file)
        })

        afterEach(() => {
            features.dispose()
        })

        it('should get executed when registered', async () => {
            const params: ExecuteCommandParams = {
                command: '/helloWorld/log',
            }
            await features.doExecuteCommand(params, CancellationToken.None)

            sinon.assert.calledOnce(service.logCommand)
        })

        it('should get not be executed when not registered', async () => {
            const params: ExecuteCommandParams = {
                command: '/helloWorld/notRegistered',
            }
            await features.doExecuteCommand(params, CancellationToken.None)

            sinon.assert.notCalled(service.logCommand)
        })
    })
})
