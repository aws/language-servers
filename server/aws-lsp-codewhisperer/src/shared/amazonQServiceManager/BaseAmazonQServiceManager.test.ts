import { TestFeatures } from '@aws/language-server-runtimes/testing'
import sinon, { StubbedInstance } from 'ts-sinon'
import { expect } from 'chai'
import { CodeWhispererServiceBase } from '../codeWhispererService'
import { stubCodeWhispererService } from '../testUtils'
import { initBaseTestServiceManager, TestAmazonQServiceManager } from './testUtils'
import {
    AmazonQBaseServiceManager,
    BaseAmazonQServiceManager,
    CONFIGURATION_CHANGE_IN_PROGRESS_MSG,
} from './BaseAmazonQServiceManager'
import { CODE_WHISPERER_CONFIGURATION_SECTION, Q_CONFIGURATION_SECTION } from '../constants'

describe('BaseAmazonQServiceManager', () => {
    let features: TestFeatures
    let serviceStub: StubbedInstance<CodeWhispererServiceBase>
    let serviceManager: AmazonQBaseServiceManager
    let handleDidChangeConfigurationSpy: sinon.SinonSpy
    beforeEach(() => {
        features = new TestFeatures()

        handleDidChangeConfigurationSpy = sinon.spy(BaseAmazonQServiceManager.prototype, 'handleDidChangeConfiguration')

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

        await serviceManager.handleDidChangeConfiguration()

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

        await serviceManager.handleDidChangeConfiguration()

        mockListeners.forEach(mockListener => {
            sinon.assert.calledTwice(mockListener)
            expect(mockListener.lastCall.args[0]).to.deep.equal(serviceManager.getConfiguration())
        })
    })

    it('ignores calls to handleDidChangeConfiguration when a request is already inflight', async () => {
        const TOTAL_CALLS = 10

        expect(serviceManager['isConfigChangeInProgress']).to.be.false

        const firstCall = serviceManager.handleDidChangeConfiguration()

        expect(serviceManager['isConfigChangeInProgress']).to.be.true

        let concurrentCalls = []
        for (let i = 0; i < TOTAL_CALLS - 1; i++) {
            concurrentCalls.push(serviceManager.handleDidChangeConfiguration())
        }

        await Promise.allSettled([firstCall, ...concurrentCalls])

        expect(serviceManager['isConfigChangeInProgress']).to.be.false

        sinon.assert.calledOnce(features.lsp.workspace.getConfiguration.withArgs(Q_CONFIGURATION_SECTION))
        sinon.assert.calledOnce(features.lsp.workspace.getConfiguration.withArgs(CODE_WHISPERER_CONFIGURATION_SECTION))

        sinon.assert.callCount(features.logging.debug.withArgs(CONFIGURATION_CHANGE_IN_PROGRESS_MSG), TOTAL_CALLS - 1)
    })
})
