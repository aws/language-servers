/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert'
import * as sinon from 'sinon'
import { CursorTracker, DefaultTimeProvider } from '../tracker/cursorTracker'
import { Position } from '@aws/language-server-runtimes/server-interface'

describe('CursorTracker', function () {
    let cursorTracker: CursorTracker
    const testUri = 'file:///test.java'
    let clock: sinon.SinonFakeTimers
    let mockTimeProvider: sinon.SinonStubbedInstance<DefaultTimeProvider>

    beforeEach(function () {
        // Create a fake timer that also mocks Date.now()
        clock = sinon.useFakeTimers({
            now: 1000,
            toFake: ['setTimeout', 'clearTimeout', 'Date'],
        })

        // Create a mocked time provider that uses the fake timer
        mockTimeProvider = sinon.createStubInstance(DefaultTimeProvider)
        mockTimeProvider.now.callsFake(() => Date.now())
        mockTimeProvider.setTimeout.callsFake((callback, ms) => setTimeout(callback, ms))

        // Create the cursor tracker with the mocked time provider
        cursorTracker = new CursorTracker(mockTimeProvider)
    })

    afterEach(function () {
        clock.restore()
        sinon.restore()
    })

    it('trackPosition should store cursor position with timestamp', function () {
        // Arrange
        const position: Position = { line: 10, character: 5 }
        const now = Date.now()

        // Act
        const result = cursorTracker.trackPosition(testUri, position)

        // Assert
        assert.strictEqual(result.uri, testUri)
        assert.deepStrictEqual(result.position, position)
        assert.strictEqual(result.timestamp, now)
    })

    it('getLastPositionTimestamp should return undefined for unknown position', function () {
        // Arrange
        const position: Position = { line: 10, character: 5 }

        // Act
        const result = cursorTracker.getLastPositionTimestamp(testUri, position)

        // Assert
        assert.strictEqual(result, undefined)
    })

    it('getLastPositionTimestamp should return timestamp for tracked position', function () {
        // Arrange
        const position: Position = { line: 10, character: 5 }
        const tracked = cursorTracker.trackPosition(testUri, position)

        // Act
        const result = cursorTracker.getLastPositionTimestamp(testUri, position)

        // Assert
        assert.strictEqual(result, tracked.timestamp)
    })

    it('hasPositionChanged should return true for unknown position', function () {
        // Arrange
        const position: Position = { line: 10, character: 5 }

        // Act
        const result = cursorTracker.hasPositionChanged(testUri, position, 1000)

        // Assert
        assert.strictEqual(result, true)
    })

    it('hasPositionChanged should return false for position that has not changed within duration', function () {
        // Arrange
        const position: Position = { line: 10, character: 5 }
        cursorTracker.trackPosition(testUri, position)

        // Act - Check if position has changed within 1000ms (it hasn't)
        const result = cursorTracker.hasPositionChanged(testUri, position, 1000)

        // Assert
        assert.strictEqual(result, false)
    })

    it('hasPositionChanged should return true for position that has changed after duration', function () {
        // Arrange
        const position: Position = { line: 10, character: 5 }
        cursorTracker.trackPosition(testUri, position)

        // Advance time by more than the duration
        clock.tick(1500)

        // Act
        const result = cursorTracker.hasPositionChanged(testUri, position, 1000)

        // Assert
        assert.strictEqual(result, true)
    })

    it('clearHistory should remove all tracked positions for a document', function () {
        // Arrange
        const position1: Position = { line: 10, character: 5 }
        const position2: Position = { line: 20, character: 10 }
        cursorTracker.trackPosition(testUri, position1)
        cursorTracker.trackPosition(testUri, position2)

        // Act
        cursorTracker.clearHistory(testUri)

        // Assert
        assert.deepStrictEqual(cursorTracker.getHistory(testUri), [])
        assert.strictEqual(cursorTracker.getLastPositionTimestamp(testUri, position1), undefined)
        assert.strictEqual(cursorTracker.getLastPositionTimestamp(testUri, position2), undefined)
    })

    it('getTrackedDocuments should return all tracked document URIs', function () {
        // Arrange
        const uri1 = 'file:///test1.java'
        const uri2 = 'file:///test2.java'
        const position: Position = { line: 10, character: 5 }
        cursorTracker.trackPosition(uri1, position)
        cursorTracker.trackPosition(uri2, position)

        // Act
        const result = cursorTracker.getTrackedDocuments()

        // Assert
        assert(result.includes(uri1))
        assert(result.includes(uri2))
        assert.strictEqual(result.length, 2)
    })

    it('should limit history size to MAX_HISTORY_SIZE', function () {
        // Arrange
        const position: Position = { line: 10, character: 5 }
        const maxSize = 100 // This should match MAX_HISTORY_SIZE in cursorTracker.ts

        // Act - Track more positions than the max size
        for (let i = 0; i < maxSize + 10; i++) {
            cursorTracker.trackPosition(testUri, { line: i, character: 5 })
        }

        // Assert
        assert.strictEqual(cursorTracker.getHistory(testUri).length, maxSize)

        // The first 10 positions should have been removed
        for (let i = 0; i < 10; i++) {
            assert.strictEqual(cursorTracker.getLastPositionTimestamp(testUri, { line: i, character: 5 }), undefined)
        }

        // The last maxSize positions should still be there
        for (let i = 10; i < maxSize + 10; i++) {
            assert.notStrictEqual(cursorTracker.getLastPositionTimestamp(testUri, { line: i, character: 5 }), undefined)
        }
    })

    it('should remove cursor positions after they exceed the maximum age', function () {
        // Arrange
        const position: Position = { line: 10, character: 5 }
        const maxAgeMs = 1000 // 1 second

        // Override the private enforceTimeLimits method to use a shorter timeout for testing
        // @ts-ignore - accessing private method for testing
        const originalMethod = cursorTracker['enforceTimeLimits']
        // @ts-ignore - accessing private method for testing
        cursorTracker['enforceTimeLimits'] = function (cursorPosition, _maxAgeMs = maxAgeMs) {
            return originalMethod.call(this, cursorPosition, maxAgeMs)
        }

        // Act
        cursorTracker.trackPosition(testUri, position)

        // Verify position is tracked
        assert.notStrictEqual(cursorTracker.getLastPositionTimestamp(testUri, position), undefined)
        assert.strictEqual(cursorTracker.getHistory(testUri).length, 1)

        // Advance time by less than maxAge - position should still be there
        clock.tick(maxAgeMs / 2)
        assert.notStrictEqual(cursorTracker.getLastPositionTimestamp(testUri, position), undefined)
        assert.strictEqual(cursorTracker.getHistory(testUri).length, 1)

        // Advance time past maxAge - position should be removed
        clock.tick(maxAgeMs)
        assert.strictEqual(cursorTracker.getLastPositionTimestamp(testUri, position), undefined)
        assert.strictEqual(cursorTracker.getHistory(testUri).length, 0)
    })

    it('should remove document from tracking when all positions are aged out', function () {
        // Arrange
        const position1: Position = { line: 10, character: 5 }
        const position2: Position = { line: 20, character: 10 }
        const maxAgeMs = 1000 // 1 second

        // Override the private enforceTimeLimits method to use a shorter timeout for testing
        // @ts-ignore - accessing private method for testing
        const originalMethod = cursorTracker['enforceTimeLimits']
        // @ts-ignore - accessing private method for testing
        cursorTracker['enforceTimeLimits'] = function (cursorPosition, _maxAgeMs = maxAgeMs) {
            return originalMethod.call(this, cursorPosition, maxAgeMs)
        }

        // Act
        cursorTracker.trackPosition(testUri, position1)
        cursorTracker.trackPosition(testUri, position2)

        // Verify document is tracked
        assert.strictEqual(cursorTracker.getTrackedDocuments().includes(testUri), true)
        assert.strictEqual(cursorTracker.getHistory(testUri).length, 2)

        // Advance time past maxAge - positions should be removed
        clock.tick(maxAgeMs * 2)

        // Document should no longer be tracked
        assert.strictEqual(cursorTracker.getTrackedDocuments().includes(testUri), false)
        assert.strictEqual(cursorTracker.getHistory(testUri).length, 0)
    })
})
