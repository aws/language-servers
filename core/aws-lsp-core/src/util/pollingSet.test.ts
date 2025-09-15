import * as assert from 'assert'
import * as sinon from 'sinon'
import { PollingSet } from './pollingSet'

describe('pollingSet', function () {
    let pollingSet: PollingSet<string>
    let clock: ReturnType<typeof sinon.useFakeTimers>
    before(function () {
        clock = sinon.useFakeTimers()
    })

    after(function () {})

    beforeEach(function () {})

    afterEach(function () {
        if (pollingSet) {
            pollingSet.clear()
            pollingSet.clearTimer()
        }
    })

    after(function () {
        sinon.restore()
    })

    it('inherits basic set properties', function () {
        const pollingSet = new PollingSet(0, () => {})
        const item1 = { id: 1 }
        const item2 = { id: 2 }

        pollingSet.add(item1)
        assert.strictEqual(pollingSet.size, 1)
        assert(pollingSet.has(item1))
        assert.strictEqual(pollingSet.has(item2), false)

        pollingSet.delete(item1)
        assert.strictEqual(pollingSet.size, 0)
        assert.strictEqual(pollingSet.has(item1), false)
    })

    it('does not poll on initialization', async function () {
        const pollingSet = new PollingSet(0, () => {})
        assert.strictEqual(pollingSet.isActive(), false)
    })

    it('does not trigger prematurely', async function () {
        const action = sinon.spy()
        pollingSet = new PollingSet(10, action)
        sinon.assert.notCalled(action)
        pollingSet.add('item')

        await clock.tickAsync(9)
        sinon.assert.notCalled(action)
        await clock.tickAsync(1)
        sinon.assert.calledOnce(action)
    })

    it('stops timer once polling set is empty', async function () {
        const pollingSet = new PollingSet(10, () => {})
        pollingSet.add('1')
        pollingSet.add('2')

        const clearStub = sinon.stub(pollingSet, 'clearTimer')
        sinon.assert.notCalled(clearStub)
        assert.strictEqual(pollingSet.isActive(), true)

        pollingSet.delete('1')

        sinon.assert.notCalled(clearStub)
        assert.strictEqual(pollingSet.isActive(), true)

        pollingSet.delete('2')

        await clock.tickAsync(20)

        assert.strictEqual(pollingSet.isActive(), false)
        sinon.assert.callCount(clearStub, 2)
        clearStub.restore()
    })

    it('runs action once per interval', async function () {
        const action = sinon.spy()
        pollingSet = new PollingSet(10, action)
        pollingSet.add('1')
        pollingSet.add('2')

        sinon.assert.callCount(action, 0)
        await clock.tickAsync(11)
        sinon.assert.callCount(action, 1)
        await clock.tickAsync(22)
        sinon.assert.callCount(action, 3)
    })
})
