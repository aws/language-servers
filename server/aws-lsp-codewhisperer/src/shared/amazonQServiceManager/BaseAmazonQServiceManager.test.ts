import { TestFeatures } from '@aws/language-server-runtimes/testing'
import sinon, { StubbedInstance } from 'ts-sinon'
import { expect } from 'chai'
import { CodeWhispererServiceBase } from '../codeWhispererService'
import { stubCodeWhispererService } from '../testUtils'
import { initBaseTestServiceManager, TestAmazonQServiceManager } from './testUtils'
import { AmazonQBaseServiceManager } from './BaseAmazonQServiceManager'

describe('BaseAmazonQServiceManager', () => {
    let features: TestFeatures
    let serviceStub: StubbedInstance<CodeWhispererServiceBase>
    let serviceManager: AmazonQBaseServiceManager

    beforeEach(() => {
        features = new TestFeatures()

        serviceStub = stubCodeWhispererService()
        serviceManager = initBaseTestServiceManager(features, serviceStub)
    })

    afterEach(() => {
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

    it('calls the attached listener at attachment and when calling handleDidChangeConfiguration', async () => {
        const mockListener = sinon.stub()

        serviceManager.addDidChangeConfigurationListener(mockListener)

        sinon.assert.calledOnceWithExactly(mockListener, serviceManager.getConfiguration())

        await serviceManager.handleDidChangeConfiguration()

        sinon.assert.calledTwice(mockListener)
        expect(mockListener.lastCall.args[0]).to.deep.equal(serviceManager.getConfiguration())
    })
})
