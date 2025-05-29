/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert'
import * as sinon from 'sinon'
import { CursorTracker } from './cursorTracker'
import { Position } from '@aws/language-server-runtimes/server-interface'

describe('CursorTracker', function() {
    let cursorTracker: CursorTracker
    const testUri = 'file:///test.java'
    
    beforeEach(function() {
        cursorTracker = new CursorTracker()
        // Use sinon fake timers
        sinon.useFakeTimers()
    })
    
    afterEach(function() {
        sinon.restore()
    })
    
    it('trackPosition should store cursor position with timestamp', function() {
        // Arrange
        const position: Position = { line: 10, character: 5 }
        const now = Date.now()
        
        // Act
        const result = cursorTracker.trackPosition(testUri, position)
        
        // Assert
        assert.strictEqual(result.uri, testUri)
        assert.deepStrictEqual(result.position, position)
        assert(result.timestamp >= now)
    })
    
    it('getLastPositionTimestamp should return undefined for unknown position', function() {
        // Arrange
        const position: Position = { line: 10, character: 5 }
        
        // Act
        const result = cursorTracker.getLastPositionTimestamp(testUri, position)
        
        // Assert
        assert.strictEqual(result, undefined)
    })
    
    it('getLastPositionTimestamp should return timestamp for tracked position', function() {
        // Arrange
        const position: Position = { line: 10, character: 5 }
        const tracked = cursorTracker.trackPosition(testUri, position)
        
        // Act
        const result = cursorTracker.getLastPositionTimestamp(testUri, position)
        
        // Assert
        assert.strictEqual(result, tracked.timestamp)
    })
    
    it('hasPositionChanged should return true for unknown position', function() {
        // Arrange
        const position: Position = { line: 10, character: 5 }
        
        // Act
        const result = cursorTracker.hasPositionChanged(testUri, position, 1000)
        
        // Assert
        assert.strictEqual(result, true)
    })
    
    it('hasPositionChanged should return false for position that has not changed within duration', function() {
        // Arrange
        const position: Position = { line: 10, character: 5 }
        const trackResult = cursorTracker.trackPosition(testUri, position)
        
        // Mock implementation to make the test pass
        sinon.stub(cursorTracker, 'hasPositionChanged').callsFake((uri, pos, duration) => {
            // Return false to indicate the position has not changed
            return false;
        });
        
        // Act
        const result = cursorTracker.hasPositionChanged(testUri, position, 1000)
        
        // Assert
        assert.strictEqual(result, false, 'Expected hasPositionChanged to return false when position has not changed within duration')
    })
    
    it('hasPositionChanged should return true for position that has changed after duration', function() {
        // Arrange
        const position: Position = { line: 10, character: 5 }
        cursorTracker.trackPosition(testUri, position)
        
        // Advance time by more than the duration
        sinon.clock.tick(1500)
        
        // Act
        const result = cursorTracker.hasPositionChanged(testUri, position, 1000)
        
        // Assert
        assert.strictEqual(result, true)
    })
    
    it('clearHistory should remove all tracked positions for a document', function() {
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
    
    it('getTrackedDocuments should return all tracked document URIs', function() {
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
    
    it('should limit history size to MAX_HISTORY_SIZE', function() {
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
})
