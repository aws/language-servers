import * as assert from 'assert'
import * as sinon from 'sinon'
import { AtxTokenServiceManager } from '../../../shared/amazonQServiceManager/AtxTokenServiceManager'
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
})
