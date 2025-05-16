/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert'
import * as sinon from 'sinon'
import { RecentEditTracker } from './recentEditTracker'
import { Range, TextDocumentContentChangeEvent } from '@aws/language-server-runtimes/server-interface'

describe('RecentEditTracker', function() {
    let recentEditTracker: RecentEditTracker
    const testUri = 'file:///test.java'
    
    beforeEach(function() {
        recentEditTracker = new RecentEditTracker()
        sinon.useFakeTimers()
    })
    
    afterEach(function() {
        sinon.restore()
    })
    
    it('trackEdit should handle changes with range', function() {
        // Arrange
        const range: Range = {
            start: { line: 10, character: 5 },
            end: { line: 10, character: 10 }
        }
        const change: TextDocumentContentChangeEvent = {
            range,
            text: 'test',
            rangeLength: 5
        }
        
        // Act
        recentEditTracker.trackEdit(testUri, change)
        
        // Assert
        const edits = recentEditTracker.getRecentEdits(testUri)
        assert.strictEqual(edits.length, 1)
        assert.strictEqual(edits[0].uri, testUri)
        assert.deepStrictEqual(edits[0].range, range)
        assert.strictEqual(edits[0].text, 'test')
    })
    
    it('trackEdit should ignore changes without range', function() {
        // Arrange
        const change: TextDocumentContentChangeEvent = {
            text: 'full document update'
        }
        
        // Act
        recentEditTracker.trackEdit(testUri, change)
        
        // Assert
        const edits = recentEditTracker.getRecentEdits(testUri)
        assert.strictEqual(edits.length, 0)
    })
    
    it('hasRecentEditInLine should return false for unknown document', function() {
        // Act
        const result = recentEditTracker.hasRecentEditInLine('unknown-uri', 10, 1000)
        
        // Assert
        assert.strictEqual(result, false)
    })
    
    it('hasRecentEditInLine should return false for line with no edits', function() {
        // Arrange
        const range: Range = {
            start: { line: 5, character: 0 },
            end: { line: 5, character: 10 }
        }
        const change: TextDocumentContentChangeEvent = {
            range,
            text: 'test',
            rangeLength: 10
        }
        recentEditTracker.trackEdit(testUri, change)
        
        // Act
        const result = recentEditTracker.hasRecentEditInLine(testUri, 10, 1000)
        
        // Assert
        assert.strictEqual(result, false)
    })
    
    it('hasRecentEditInLine should return true for line with recent edits', function() {
        // Arrange
        const range: Range = {
            start: { line: 10, character: 0 },
            end: { line: 10, character: 10 }
        }
        const change: TextDocumentContentChangeEvent = {
            range,
            text: 'test',
            rangeLength: 10
        }
        recentEditTracker.trackEdit(testUri, change)
        
        // Act
        const result = recentEditTracker.hasRecentEditInLine(testUri, 10, 1000)
        
        // Assert
        assert.strictEqual(result, true)
    })
    
    it('hasRecentEditInLine should return false for old edits', function() {
        // Arrange
        const range: Range = {
            start: { line: 10, character: 0 },
            end: { line: 10, character: 10 }
        }
        const change: TextDocumentContentChangeEvent = {
            range,
            text: 'test',
            rangeLength: 10
        }
        recentEditTracker.trackEdit(testUri, change)
        
        // Advance time beyond the threshold
        sinon.clock.tick(2000)
        
        // Act
        const result = recentEditTracker.hasRecentEditInLine(testUri, 10, 1000)
        
        // Assert
        assert.strictEqual(result, false)
    })
    
    it('clearHistory should remove all tracked edits for a document', function() {
        // Arrange
        const range: Range = {
            start: { line: 10, character: 0 },
            end: { line: 10, character: 10 }
        }
        const change: TextDocumentContentChangeEvent = {
            range,
            text: 'test',
            rangeLength: 10
        }
        recentEditTracker.trackEdit(testUri, change)
        
        // Act
        recentEditTracker.clearHistory(testUri)
        
        // Assert
        assert.deepStrictEqual(recentEditTracker.getRecentEdits(testUri), [])
        assert.strictEqual(recentEditTracker.hasRecentEditInLine(testUri, 10, 1000), false)
    })
    
    it('getTrackedDocuments should return all tracked document URIs', function() {
        // Arrange
        const uri1 = 'file:///test1.java'
        const uri2 = 'file:///test2.java'
        const range: Range = {
            start: { line: 10, character: 0 },
            end: { line: 10, character: 10 }
        }
        const change: TextDocumentContentChangeEvent = {
            range,
            text: 'test',
            rangeLength: 10
        }
        recentEditTracker.trackEdit(uri1, change)
        recentEditTracker.trackEdit(uri2, change)
        
        // Act
        const result = recentEditTracker.getTrackedDocuments()
        
        // Assert
        assert(result.includes(uri1))
        assert(result.includes(uri2))
        assert.strictEqual(result.length, 2)
    })
    
    it('should automatically clean up old edits', function() {
        // Arrange
        const range: Range = {
            start: { line: 10, character: 0 },
            end: { line: 10, character: 10 }
        }
        const change: TextDocumentContentChangeEvent = {
            range,
            text: 'test',
            rangeLength: 10
        }
        recentEditTracker.trackEdit(testUri, change)
        
        // Advance time beyond the history duration (5 minutes = 300000ms)
        sinon.clock.tick(300001)
        
        // Act - Add another edit to trigger cleanup
        recentEditTracker.trackEdit(testUri, {
            range: {
                start: { line: 20, character: 0 },
                end: { line: 20, character: 10 }
            },
            text: 'another test',
            rangeLength: 10
        })
        
        // Assert
        const edits = recentEditTracker.getRecentEdits(testUri)
        assert.strictEqual(edits.length, 1)
        assert.strictEqual(edits[0].text, 'another test')
    })
})
