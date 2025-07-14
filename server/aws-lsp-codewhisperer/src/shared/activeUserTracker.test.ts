import { ActiveUserTracker, DEFAULT_ACTIVE_USER_WINDOW_MINUTES } from './activeUserTracker'
import * as sinon from 'sinon'
import * as assert from 'assert'

describe('ActiveUserTracker', function () {
    let clock: sinon.SinonFakeTimers

    beforeEach(function () {
        // Ensure singleton is completely reset
        if ((ActiveUserTracker as any).instance) {
            ;(ActiveUserTracker as any).instance.dispose()
        }
        ;(ActiveUserTracker as any).instance = undefined

        // Use fake timers starting at timestamp 0
        clock = sinon.useFakeTimers(0)
    })

    afterEach(function () {
        // Restore real timers
        clock.restore()

        // Ensure singleton is disposed
        if ((ActiveUserTracker as any).instance) {
            ;(ActiveUserTracker as any).instance.dispose()
        }
    })

    it('should return true for first call', function () {
        const tracker = ActiveUserTracker.getInstance()
        const result = tracker.isNewActiveUser()
        assert.strictEqual(result, true)
    })

    it('should return false for calls within window', function () {
        const tracker = ActiveUserTracker.getInstance()

        // First call returns true and starts a window
        assert.strictEqual(tracker.isNewActiveUser(), true)

        // Advance time within window by 100 ms
        clock.tick(100)

        // Second call within window should return false
        assert.strictEqual(tracker.isNewActiveUser(), false)
    })

    it('should return true for calls after window expires', function () {
        const tracker = ActiveUserTracker.getInstance()

        // First call returns true
        assert.strictEqual(tracker.isNewActiveUser(), true)

        // Advance time past the window (convert minutes to milliseconds)
        clock.tick((DEFAULT_ACTIVE_USER_WINDOW_MINUTES + 1) * 60 * 1000)

        // Call after window expires returns true
        assert.strictEqual(tracker.isNewActiveUser(), true)
    })

    it('should reset tracker on dispose', function () {
        const tracker = ActiveUserTracker.getInstance()
        tracker.isNewActiveUser()

        tracker.dispose()

        // After dispose, next call should return true
        assert.strictEqual(tracker.isNewActiveUser(), true)
    })

    it('should respect custom window size', function () {
        const customWindowMinutes = 5
        // Ensure we start fresh for this test
        ;(ActiveUserTracker as any).instance = undefined
        const tracker = ActiveUserTracker.getInstance(customWindowMinutes)

        // First call returns true
        assert.strictEqual(tracker.isNewActiveUser(), true)

        // Advance time within custom window
        clock.tick((customWindowMinutes - 1) * 60 * 1000)
        assert.strictEqual(tracker.isNewActiveUser(), false)

        // Advance time past custom window
        clock.tick(2 * 60 * 1000)
        assert.strictEqual(tracker.isNewActiveUser(), true)
    })
})
