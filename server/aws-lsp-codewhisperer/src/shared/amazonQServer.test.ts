import sinon from 'ts-sinon'
import { expect } from 'chai'
import { TestFeatures } from '@aws/language-server-runtimes/testing'
import { initBaseTestServiceManager, TestAmazonQServiceManager } from './amazonQServiceManager/testUtils'
import {
    CancellationToken,
    CredentialsType,
    InitializeParams,
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
})
