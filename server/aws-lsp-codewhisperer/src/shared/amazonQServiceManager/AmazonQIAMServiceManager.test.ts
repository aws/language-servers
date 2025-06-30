import { TestFeatures } from '@aws/language-server-runtimes/testing'
import { deepStrictEqual } from 'assert'
import sinon from 'ts-sinon'
import { AmazonQServiceManager } from './AmazonQServiceManager'
import { generateSingletonInitializationTests } from './testUtils'
import * as utils from '../utils'

describe('AmazonQServiceManager', () => {
    describe('Initialization process', () => {
        generateSingletonInitializationTests(AmazonQServiceManager)
    })

    describe('Service caching', () => {
        let serviceManager: AmazonQServiceManager
        let features: TestFeatures
        let updateCachedServiceConfigSpy: sinon.SinonSpy

        beforeEach(() => {
            features = new TestFeatures()

            updateCachedServiceConfigSpy = sinon.spy(
                AmazonQServiceManager.prototype,
                'updateCachedServiceConfig' as keyof AmazonQServiceManager
            )

            AmazonQServiceManager.resetInstance()
            serviceManager = AmazonQServiceManager.initInstance(features)
        })

        afterEach(() => {
            AmazonQServiceManager.resetInstance()
            features.dispose()
            sinon.restore()
        })

        it('should initialize the CodeWhisperer service only once', () => {
            const service = serviceManager.getCodewhispererService()
            sinon.assert.calledOnce(updateCachedServiceConfigSpy)

            deepStrictEqual(serviceManager.getCodewhispererService(), service)
            sinon.assert.calledOnce(updateCachedServiceConfigSpy)
        })

        it('should initialize the streaming client only once', () => {
            // Mock getIAMCredentialsFromProvider to return dummy credentials
            const getIAMCredentialsStub = sinon.stub(utils, 'getIAMCredentialsFromProvider').returns({
                accessKeyId: 'dummy-access-key',
                secretAccessKey: 'dummy-secret-key',
                sessionToken: 'dummy-session-token',
            })

            const streamingClient = serviceManager.getStreamingClient()

            deepStrictEqual(serviceManager.getStreamingClient(), streamingClient)

            getIAMCredentialsStub.restore()
        })
    })
})
