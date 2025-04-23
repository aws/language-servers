import sinon from 'ts-sinon'
import { throws, doesNotThrow } from 'assert'
import { TestFeatures } from '@aws/language-server-runtimes/testing'
import { initBaseTestServiceManager, TestAmazonQServiceManager } from './amazonQServiceManager/testUtils'
import { CancellationToken, InitializeParams, Server } from '@aws/language-server-runtimes/server-interface'
import { AmazonQServiceServerFactory } from './amazonQServer'
import { BaseAmazonQServiceManager } from './amazonQServiceManager/BaseAmazonQServiceManager'

describe('AmazonQServiceServer', () => {
    let features: TestFeatures
    let server: Server
    let setupCommonLspHandlersSpy: sinon.SinonSpy
    let setupConfigurableLspHandlersSpy: sinon.SinonSpy

    beforeEach(() => {
        features = new TestFeatures()

        setupCommonLspHandlersSpy = sinon.spy(BaseAmazonQServiceManager.prototype, 'setupCommonLspHandlers' as any)
        setupConfigurableLspHandlersSpy = sinon.spy(
            BaseAmazonQServiceManager.prototype,
            'setupConfigurableLspHandlers' as any
        )

        TestAmazonQServiceManager.resetInstance()
        server = AmazonQServiceServerFactory(() => initBaseTestServiceManager(features))
    })

    afterEach(() => {
        TestAmazonQServiceManager.resetInstance()
        features.dispose()
    })

    it('should initialize the service manager during LSP handshake and configure handlers', async () => {
        sinon.assert.notCalled(setupCommonLspHandlersSpy)
        sinon.assert.notCalled(setupConfigurableLspHandlersSpy)

        throws(() => TestAmazonQServiceManager.getInstance())

        await features.start(server)
        // trigger client initialize request
        features.lsp.addInitializer.args[0]?.[0]({} as InitializeParams, {} as CancellationToken)

        sinon.assert.calledOnce(setupCommonLspHandlersSpy)
        sinon.assert.calledOnce(setupConfigurableLspHandlersSpy)
        doesNotThrow(() => TestAmazonQServiceManager.getInstance())
    })
})
