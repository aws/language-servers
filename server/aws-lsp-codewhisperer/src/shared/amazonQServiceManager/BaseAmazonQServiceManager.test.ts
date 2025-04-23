import { TestFeatures } from '@aws/language-server-runtimes/testing'
import sinon, { StubbedInstance, stubInterface } from 'ts-sinon'
import { expect } from 'chai'
import { CodeWhispererServiceBase } from '../codeWhispererService'
import { stubCodeWhispererService } from '../testUtils'
import { initBaseTestServiceManager, TestAmazonQServiceManager } from './testUtils'
import {
    AmazonQBaseServiceManager,
    AmazonQServiceAPI,
    AmazonQServiceBase,
    BaseAmazonQServiceManager,
    CONFIGURATION_CHANGE_IN_PROGRESS_MSG,
} from './BaseAmazonQServiceManager'
import { CODE_WHISPERER_CONFIGURATION_SECTION, Q_CONFIGURATION_SECTION } from '../constants'
import { UpdateConfigurationParams } from '@aws/language-server-runtimes/protocol'
import { StreamingClientServiceBase } from '../streamingClientService'

describe('BaseAmazonQServiceManager', () => {
    let features: TestFeatures
    let serviceStub: StubbedInstance<CodeWhispererServiceBase>
    let serviceManager: AmazonQBaseServiceManager
    let handleDidChangeConfigurationSpy: sinon.SinonSpy
    beforeEach(() => {
        features = new TestFeatures()

        handleDidChangeConfigurationSpy = sinon.spy(
            BaseAmazonQServiceManager.prototype,
            'handleDidChangeConfiguration' as keyof AmazonQBaseServiceManager
        )

        serviceStub = stubCodeWhispererService()
        serviceManager = initBaseTestServiceManager(features, serviceStub)
    })

    afterEach(() => {
        sinon.restore()
        TestAmazonQServiceManager.resetInstance()
    })

    it('updates the cache and service when handleDidChangeConfiguration is called', async () => {
        const initialConfig = serviceManager.getConfiguration()

        expect(initialConfig.customizationArn).to.be.undefined
        expect(serviceStub.customizationArn).to.be.undefined

        features.lsp.workspace.getConfiguration.resolves({ customization: 'some-arn' })

        await serviceManager['handleDidChangeConfiguration']()

        const updatedConfig = serviceManager.getConfiguration()
        expect(updatedConfig).to.not.deep.equal(initialConfig)

        expect(updatedConfig.customizationArn).to.equal('some-arn')
        expect(serviceStub.customizationArn).to.equal('some-arn')
    })

    it('calls the attached listeners at attachment and when calling handleDidChangeConfiguration', async () => {
        const mockListeners = [sinon.stub(), sinon.stub()]

        await Promise.allSettled(
            mockListeners.map(mockListener => serviceManager.addDidChangeConfigurationListener(mockListener))
        )

        mockListeners.forEach(mockListener => {
            sinon.assert.calledOnceWithExactly(mockListener, serviceManager.getConfiguration())
        })

        await serviceManager['handleDidChangeConfiguration']()

        mockListeners.forEach(mockListener => {
            sinon.assert.calledTwice(mockListener)
            expect(mockListener.lastCall.args[0]).to.deep.equal(serviceManager.getConfiguration())
        })
    })

    it('hooks handleDidChangeConfiguration to didChangeConfiguration and onInitialized handlers when requested', async () => {
        sinon.assert.notCalled(features.lsp.onInitialized)
        sinon.assert.notCalled(features.lsp.didChangeConfiguration)
        sinon.assert.notCalled(handleDidChangeConfigurationSpy)

        serviceManager.setupCommonLspHandlers()
        sinon.assert.notCalled(handleDidChangeConfigurationSpy)

        sinon.assert.calledOnce(features.lsp.onInitialized)
        features.lsp.onInitialized.args[0]?.[0]({})
        sinon.assert.calledOnce(handleDidChangeConfigurationSpy)

        sinon.assert.calledOnce(features.lsp.didChangeConfiguration)
        await features.doChangeConfiguration()
        sinon.assert.calledTwice(handleDidChangeConfigurationSpy)
    })

    it('ignores calls to handleDidChangeConfiguration when a request is already inflight', async () => {
        const TOTAL_CALLS = 10

        expect(serviceManager['isConfigChangeInProgress']).to.be.false

        const firstCall = serviceManager['handleDidChangeConfiguration']()

        expect(serviceManager['isConfigChangeInProgress']).to.be.true

        let concurrentCalls = []
        for (let i = 0; i < TOTAL_CALLS - 1; i++) {
            concurrentCalls.push(serviceManager['handleDidChangeConfiguration']())
        }

        await Promise.allSettled([firstCall, ...concurrentCalls])

        expect(serviceManager['isConfigChangeInProgress']).to.be.false

        sinon.assert.calledOnce(features.lsp.workspace.getConfiguration.withArgs(Q_CONFIGURATION_SECTION))
        sinon.assert.calledOnce(features.lsp.workspace.getConfiguration.withArgs(CODE_WHISPERER_CONFIGURATION_SECTION))

        sinon.assert.callCount(features.logging.debug.withArgs(CONFIGURATION_CHANGE_IN_PROGRESS_MSG), TOTAL_CALLS - 1)
    })

    it('hooks onUpdateConfiguration handler to LSP server when requested and if defined', async () => {
        sinon.assert.notCalled(features.lsp.workspace.onUpdateConfiguration)

        serviceManager.setupConfigurableLspHandlers()
        sinon.assert.notCalled(features.lsp.workspace.onUpdateConfiguration)

        const mockedOnUpdateConfigurationHandler = sinon.spy()
        serviceManager['configurableLspHandlers'].onUpdateConfiguration = mockedOnUpdateConfigurationHandler

        serviceManager.setupConfigurableLspHandlers()
        sinon.assert.calledOnce(features.lsp.workspace.onUpdateConfiguration)

        await features.doUpdateConfiguration({} as UpdateConfigurationParams, {} as any)
        sinon.assert.calledOnce(mockedOnUpdateConfigurationHandler)
    })
})

describe('AmazonQServiceAPI', () => {
    let features: TestFeatures
    let serviceStub: StubbedInstance<CodeWhispererServiceBase>
    let streamingClientStub: StubbedInstance<StreamingClientServiceBase>
    let amazonQService: AmazonQServiceBase

    beforeEach(() => {
        features = new TestFeatures()

        serviceStub = stubCodeWhispererService()
        streamingClientStub = stubInterface<StreamingClientServiceBase>()
        amazonQService = new AmazonQServiceAPI(() =>
            initBaseTestServiceManager(features, serviceStub, streamingClientStub)
        )
    })

    afterEach(() => {
        sinon.restore()
        TestAmazonQServiceManager.resetInstance()
    })

    it('should delay initialization until a method invocation', () => {
        expect(amazonQService['cachedServiceManager']).to.be.undefined

        // trigger initialization
        amazonQService.getConfiguration()
        expect(amazonQService['cachedServiceManager']).to.deep.equal(TestAmazonQServiceManager.getInstance())
    })

    it('should route service methods to cached service manager', () => {
        expect(amazonQService.getCodewhispererService()).to.deep.equal(serviceStub)
        expect(amazonQService.getStreamingClient()).to.deep.equal(streamingClientStub)
    })
})
