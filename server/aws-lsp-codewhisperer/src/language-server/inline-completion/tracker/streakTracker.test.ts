/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert'
import { StreakTracker } from './streakTracker'

describe('StreakTracker', function () {
    let tracker: StreakTracker

    beforeEach(function () {
        StreakTracker.reset()
        tracker = StreakTracker.getInstance()
    })

    afterEach(function () {
        StreakTracker.reset()
    })

    describe('getInstance', function () {
        it('should return the same instance (singleton)', function () {
            const instance1 = StreakTracker.getInstance()
            const instance2 = StreakTracker.getInstance()
            assert.strictEqual(instance1, instance2)
        })

        it('should create new instance after reset', function () {
            const instance1 = StreakTracker.getInstance()
            StreakTracker.reset()
            const instance2 = StreakTracker.getInstance()
            assert.notStrictEqual(instance1, instance2)
        })
    })

    describe('getAndUpdateStreakLength', function () {
        it('should return -1 for undefined input', function () {
            const result = tracker.getAndUpdateStreakLength(undefined)
            assert.strictEqual(result, -1)
        })

        it('should return -1 and increment streak on acceptance', function () {
            const result = tracker.getAndUpdateStreakLength(true)
            assert.strictEqual(result, -1)
        })

        it('should return -1 for rejection with zero streak', function () {
            const result = tracker.getAndUpdateStreakLength(false)
            assert.strictEqual(result, -1)
        })

        it('should return previous streak on rejection after acceptances', function () {
            tracker.getAndUpdateStreakLength(true)
            tracker.getAndUpdateStreakLength(true)
            tracker.getAndUpdateStreakLength(true)

            const result = tracker.getAndUpdateStreakLength(false)
            assert.strictEqual(result, 3)
        })

        it('should handle acceptance after rejection', function () {
            tracker.getAndUpdateStreakLength(true)
            tracker.getAndUpdateStreakLength(true)

            const resetResult = tracker.getAndUpdateStreakLength(false)
            assert.strictEqual(resetResult, 2)

            tracker.getAndUpdateStreakLength(true)
            const newResult = tracker.getAndUpdateStreakLength(true)
            assert.strictEqual(newResult, -1)
        })
    })

    describe('cross-instance consistency', function () {
        it('should maintain state across getInstance calls', function () {
            const tracker1 = StreakTracker.getInstance()
            tracker1.getAndUpdateStreakLength(true)
            tracker1.getAndUpdateStreakLength(true)

            const tracker2 = StreakTracker.getInstance()
            const result = tracker2.getAndUpdateStreakLength(false)
            assert.strictEqual(result, 2)
        })
    })
})
