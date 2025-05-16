/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert'
import * as sinon from 'sinon'
import { ResourceManager } from './resourceManager'
import { CursorTracker } from './cursorTracker'
import { RecentEditTracker } from './recentEditTracker'

describe('ResourceManager', function() {
    let resourceManager: ResourceManager
    let cursorTracker: Partial<CursorTracker>
    let recentEditTracker: Partial<RecentEditTracker>
    const testUri = 'file:///test.java'
    
    beforeEach(function() {
        // Create mock trackers
        cursorTracker = {
            clearHistory: sinon.stub(),
            getTrackedDocuments: sinon.stub().returns([testUri])
        }
        
        recentEditTracker = {
            clearHistory: sinon.stub(),
            getTrackedDocuments: sinon.stub().returns([testUri])
        }
        
        // Reset the singleton instance before each test
        // @ts-ignore - accessing private static property for testing
        ResourceManager.instance = undefined
        
        // Create resource manager
        resourceManager = ResourceManager.getInstance(cursorTracker as CursorTracker, recentEditTracker as RecentEditTracker)
        
        // Mock console.log to avoid cluttering test output
        sinon.stub(console, 'log')
    })
    
    afterEach(function() {
        sinon.restore()
    })
    
    it('getInstance should return the same instance', function() {
        // Arrange & Act
        const instance1 = ResourceManager.getInstance(cursorTracker as CursorTracker, recentEditTracker as RecentEditTracker)
        const instance2 = ResourceManager.getInstance(cursorTracker as CursorTracker, recentEditTracker as RecentEditTracker)
        
        // Assert
        assert.strictEqual(instance1, instance2)
    })
    
    it('handleDocumentClose should clear history for both trackers', function() {
        // Arrange
        
        // Act
        resourceManager.handleDocumentClose(testUri)
        
        // Assert
        sinon.assert.calledWith(cursorTracker.clearHistory as sinon.SinonStub, testUri)
        sinon.assert.calledWith(recentEditTracker.clearHistory as sinon.SinonStub, testUri)
    })
    
    it('performPeriodicCleanup should check all tracked documents', function() {
        // Arrange
        const isDocumentOpenStub = sinon.stub(resourceManager as any, 'isDocumentOpen').returns(true)
        
        // Act
        resourceManager.performPeriodicCleanup()
        
        // Assert
        sinon.assert.called(cursorTracker.getTrackedDocuments as sinon.SinonStub)
        sinon.assert.called(recentEditTracker.getTrackedDocuments as sinon.SinonStub)
        sinon.assert.calledWith(isDocumentOpenStub, testUri)
    })
    
    it('performPeriodicCleanup should close documents that are no longer open', function() {
        // Arrange
        sinon.stub(resourceManager as any, 'isDocumentOpen').returns(false)
        const handleDocumentCloseSpy = sinon.spy(resourceManager, 'handleDocumentClose')
        
        // Act
        resourceManager.performPeriodicCleanup()
        
        // Assert
        sinon.assert.calledWith(handleDocumentCloseSpy, testUri)
    })
    
    it('performPeriodicCleanup should not close documents that are still open', function() {
        // Arrange
        sinon.stub(resourceManager as any, 'isDocumentOpen').returns(true)
        const handleDocumentCloseSpy = sinon.spy(resourceManager, 'handleDocumentClose')
        
        // Act
        resourceManager.performPeriodicCleanup()
        
        // Assert
        sinon.assert.notCalled(handleDocumentCloseSpy)
    })
})
