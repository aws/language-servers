import sinon, { StubbedInstance, stubInterface } from 'ts-sinon'
import { deepStrictEqual, notDeepStrictEqual } from 'assert'
import { AmazonQTokenServiceManager } from './AmazonQTokenServiceManager'
import { initBaseTokenServiceManager, initFallbackServiceManager } from './factories'
import { CodeWhispererServiceBase } from '../codeWhispererService'
import { BaseAmazonQServiceManager } from './BaseAmazonQServiceManager'
import { TestFeatures } from '@aws/language-server-runtimes/testing'

describe('initBaseServiceManager', () => {
    let features: TestFeatures

    beforeEach(() => {
        features = new TestFeatures()
    })

    describe('initBaseTokenServiceManager', () => {
        it('initializes token manager for bearer credentials type', () => {
            const tokenManagerGetInstanceStub = sinon.stub(AmazonQTokenServiceManager, 'getInstance')

            initBaseTokenServiceManager(features)

            sinon.assert.calledOnce(tokenManagerGetInstanceStub)
        })
    })

    describe('initFallbackServiceManager', () => {
        let serviceStub: StubbedInstance<CodeWhispererServiceBase>
        let serviceManager: BaseAmazonQServiceManager

        beforeEach(() => {
            serviceStub = stubInterface<CodeWhispererServiceBase>()
            serviceStub.customizationArn = undefined

            serviceManager = initFallbackServiceManager(features, serviceStub)
        })

        it('returns instantiated service', () => {
            deepStrictEqual(serviceManager.getCodewhispererService(), serviceStub)
        })

        it('updates the cache and service when handleDidChangeConfiguration is called', async () => {
            const initialConfig = serviceManager.getConfiguration()

            deepStrictEqual(initialConfig.customizationArn, undefined)
            deepStrictEqual(serviceStub.customizationArn, undefined)

            features.lsp.workspace.getConfiguration.resolves({ customization: 'some-arn' })

            await serviceManager.handleDidChangeConfiguration()

            const updatedConfig = serviceManager.getConfiguration()
            notDeepStrictEqual(updatedConfig, initialConfig)

            deepStrictEqual(updatedConfig.customizationArn, 'some-arn')
            deepStrictEqual(serviceStub.customizationArn, 'some-arn')
        })
    })
})
