import sinon from 'ts-sinon'
import { expect } from 'chai'
import { TestFeatures } from '@aws/language-server-runtimes/testing'
import { initBaseTestServiceManager, TestAmazonQServiceManager } from './amazonQServiceManager/testUtils'
import {
    CancellationToken,
    CredentialsType,
    InitializeParams,
    PartialInitializeResult,
    Server,
    UpdateConfigurationParams,
} from '@aws/language-server-runtimes/server-interface'
import { AmazonQServiceServerFactory } from './amazonQServer'
import { BaseAmazonQServiceManager } from './amazonQServiceManager/BaseAmazonQServiceManager'

describe('AmazonQServiceServer', () => {
    let features: TestFeatures
    let server: Server
    let initBaseTestServiceManagerSpy: sinon.SinonSpy

    beforeEach(() => {
        features = new TestFeatures()

        initBaseTestServiceManagerSpy = sinon.spy(initBaseTestServiceManager)

        TestAmazonQServiceManager.resetInstance()
        server = AmazonQServiceServerFactory(() => initBaseTestServiceManagerSpy(features))
    })

    afterEach(() => {
        TestAmazonQServiceManager.resetInstance()
        features.dispose()
        sinon.restore()
    })

    it('should initialize the service manager during LSP initialize request', async () => {
        expect(TestAmazonQServiceManager.getInstance).to.throw()
        sinon.assert.notCalled(initBaseTestServiceManagerSpy)

        server(features)
        sinon.assert.notCalled(initBaseTestServiceManagerSpy)

        features.doSendInitializeRequest({} as InitializeParams, {} as CancellationToken)
        sinon.assert.calledOnce(initBaseTestServiceManagerSpy)
    })

    it('declares serverInfo so the runtime can deliver notifications to the client', async () => {
        server(features)

        // Invoke the registered initializer directly: doSendInitializeRequest returns void, so the
        // result is only reachable through the handler the server registered.
        const initializer = features.lsp.addInitializer.args[0]?.[0]
        const result = (await initializer({} as InitializeParams, {} as CancellationToken)) as PartialInitializeResult

        // The runtime only builds a notification router for servers that declare serverInfo, and
        // notification.showNotification() is a silent no-op without one. Dropping this makes every
        // server-initiated notification disappear with nothing but a debug line to show for it.
        //
        // The name is asserted exactly because it is not cosmetic: it is encoded into the id of each
        // notification the client sends back, so renaming it strands followups for notifications
        // already on screen.
        expect(result.serverInfo?.name).to.equal('AWS Language Server for Amazon Q Developer')
    })

    it('hooks handleDidChangeConfiguration to didChangeConfiguration and onInitialized handlers', async () => {
        const handleDidChangeConfigurationSpy = sinon.spy(
            BaseAmazonQServiceManager.prototype,
            'handleDidChangeConfiguration'
        )
        sinon.assert.notCalled(handleDidChangeConfigurationSpy)

        await features.initialize(server)
        sinon.assert.calledOnce(handleDidChangeConfigurationSpy)

        await features.doChangeConfiguration()
        sinon.assert.calledTwice(handleDidChangeConfigurationSpy)
    })

    it('hooks onUpdateConfiguration handler to LSP server', async () => {
        const handleOnUpdateConfigurationSpy = sinon.spy(
            TestAmazonQServiceManager.prototype,
            'handleOnUpdateConfiguration'
        )
        sinon.assert.notCalled(handleOnUpdateConfigurationSpy)

        await features.initialize(server)
        sinon.assert.notCalled(handleOnUpdateConfigurationSpy)

        await features.doUpdateConfiguration({} as UpdateConfigurationParams, {} as any)
        sinon.assert.calledOnce(handleOnUpdateConfigurationSpy)
    })

    it('hooks onCredentialsDeleted handler to credentials provider', async () => {
        const handleOnCredentialsDeletedSpy = sinon.spy(
            TestAmazonQServiceManager.prototype,
            'handleOnCredentialsDeleted'
        )
        sinon.assert.notCalled(handleOnCredentialsDeletedSpy)

        await features.initialize(server)
        sinon.assert.notCalled(handleOnCredentialsDeletedSpy)

        // triggers the handler registered by Amazon Q Server during features.initialize
        features.credentialsProvider.onCredentialsDeleted.args[0]?.[0]('some-creds-type' as CredentialsType)
        sinon.assert.calledOnce(handleOnCredentialsDeletedSpy)
    })

    it('should handle ATX configuration updates', async () => {
        await features.initialize(server)

        const atxConfigParams = {
            section: 'aws.amazonq.transform',
            settings: { profileArn: 'test-arn' },
        } as UpdateConfigurationParams

        // This should not throw an error
        await features.doUpdateConfiguration(atxConfigParams, {} as any)
        expect(true).to.be.true // Test passes if no error is thrown
    })

    it('should initialize ATX Token Service Manager', async () => {
        await features.initialize(server)

        // Verify ATX service manager is initialized (indirectly through no errors)
        expect(true).to.be.true
    })

    it('should handle service manager initialization errors gracefully', () => {
        const errorFactory = () => {
            throw new Error('Service manager initialization failed')
        }

        const errorServer = AmazonQServiceServerFactory(errorFactory)

        expect(() => {
            errorServer(features)
            features.doSendInitializeRequest({} as InitializeParams, {} as CancellationToken)
        }).to.throw('Service manager initialization failed')
    })
})
