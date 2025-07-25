import { TestFeatures } from '@aws/language-server-runtimes/testing'
import { deepStrictEqual } from 'assert'
import sinon from 'ts-sinon'
import { AmazonQIAMServiceManager } from './AmazonQIAMServiceManager'
import { generateSingletonInitializationTests } from './testUtils'
import * as utils from '../utils'

describe('AmazonQIAMServiceManager', () => {
    describe('Initialization process', () => {
        generateSingletonInitializationTests(AmazonQIAMServiceManager)
    })

    describe('Service caching', () => {
        let serviceManager: AmazonQIAMServiceManager
        let features: TestFeatures
        let updateCachedServiceConfigSpy: sinon.SinonSpy

        beforeEach(() => {
            features = new TestFeatures()

            updateCachedServiceConfigSpy = sinon.spy(
                AmazonQIAMServiceManager.prototype,
                'updateCachedServiceConfig' as keyof AmazonQIAMServiceManager
            )

            AmazonQIAMServiceManager.resetInstance()
            serviceManager = AmazonQIAMServiceManager.initInstance(features)
        })

        afterEach(() => {
            AmazonQIAMServiceManager.resetInstance()
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
            // Mock the credentials provider to return credentials when requested
            features.credentialsProvider.hasCredentials.withArgs('iam').returns(true)
            features.credentialsProvider.getCredentials.withArgs('iam').returns({
                accessKeyId: 'dummy-access-key',
                secretAccessKey: 'dummy-secret-key',
                sessionToken: 'dummy-session-token',
            })

            const streamingClient = serviceManager.getStreamingClient()

            // Verify that getting the client again returns the same instance
            deepStrictEqual(serviceManager.getStreamingClient(), streamingClient)
        })
    })
})
