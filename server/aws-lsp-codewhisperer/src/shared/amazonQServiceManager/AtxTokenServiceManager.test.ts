import * as assert from 'assert'
import * as sinon from 'sinon'
import { AtxTokenServiceManager } from './AtxTokenServiceManager'
import { TestFeatures } from '@aws/language-server-runtimes/testing'
import { CredentialsType } from '@aws/language-server-runtimes/server-interface'

describe('AtxTokenServiceManager', () => {
    let features: TestFeatures
    let manager: AtxTokenServiceManager

    beforeEach(() => {
        features = new TestFeatures()
        AtxTokenServiceManager.resetInstance()
        manager = AtxTokenServiceManager.initInstance(features)
    })

    afterEach(() => {
        sinon.restore()
        AtxTokenServiceManager.resetInstance()
    })

    describe('initInstance', () => {
        it('creates new instance when none exists', () => {
            AtxTokenServiceManager.resetInstance()
            const instance = AtxTokenServiceManager.initInstance(features)
            assert(instance instanceof AtxTokenServiceManager)
        })

        it('throws error when instance already exists', () => {
            assert.throws(() => AtxTokenServiceManager.initInstance(features), /already initialized/)
        })
    })

    describe('getInstance', () => {
        it('returns existing instance', () => {
            const instance = AtxTokenServiceManager.getInstance()
            assert.strictEqual(instance, manager)
        })

        it('throws error when no instance exists', () => {
            AtxTokenServiceManager.resetInstance()
            assert.throws(() => AtxTokenServiceManager.getInstance(), /not initialized/)
        })
    })

    describe('hasValidCredentials', () => {
        it('returns true when bearer-alternate credentials exist', () => {
            features.credentialsProvider.hasCredentials.withArgs('bearer-alternate' as any).returns(true)
            assert.strictEqual(manager.hasValidCredentials(), true)
        })

        it('returns false when no bearer-alternate credentials', () => {
            features.credentialsProvider.hasCredentials.withArgs('bearer-alternate' as any).returns(false)
            assert.strictEqual(manager.hasValidCredentials(), false)
        })
    })

    describe('getBearerToken', () => {
        it('returns token when valid credentials exist', async () => {
            const mockToken = 'test-token'
            features.credentialsProvider.hasCredentials.withArgs('bearer-alternate' as any).returns(true)
            features.credentialsProvider.getCredentials
                .withArgs('bearer-alternate' as any)
                .returns({ token: mockToken })

            const token = await manager.getBearerToken()
            assert.strictEqual(token, mockToken)
        })

        it('throws error when no credentials available', async () => {
            features.credentialsProvider.hasCredentials.withArgs('bearer-alternate' as any).returns(false)

            await assert.rejects(manager.getBearerToken(), /No bearer credentials available/)
        })

        it('throws error when token is null', async () => {
            features.credentialsProvider.hasCredentials.withArgs('bearer-alternate' as any).returns(true)
            features.credentialsProvider.getCredentials
                .withArgs('bearer-alternate' as any)
                .returns({ token: null as any })

            await assert.rejects(manager.getBearerToken(), /Bearer token is null or empty/)
        })
    })

    describe('handleOnCredentialsDeleted', () => {
        it('clears all caches when credentials deleted', () => {
            const callback = sinon.stub()
            manager.registerCacheCallback(callback)

            manager.handleOnCredentialsDeleted('bearer' as CredentialsType)

            assert(callback.calledOnce)
        })
    })

    describe('registerCacheCallback', () => {
        it('registers callback and calls it on cache clear', () => {
            const callback = sinon.stub()
            manager.registerCacheCallback(callback)

            manager['clearAllCaches']()

            assert(callback.calledOnce)
        })
    })

    describe('isReady', () => {
        it('returns true when has valid credentials', () => {
            features.credentialsProvider.hasCredentials.withArgs('bearer-alternate' as any).returns(true)
            assert.strictEqual(manager.isReady(), true)
        })

        it('returns false when no valid credentials', () => {
            features.credentialsProvider.hasCredentials.withArgs('bearer-alternate' as any).returns(false)
            assert.strictEqual(manager.isReady(), false)
        })
    })
})
