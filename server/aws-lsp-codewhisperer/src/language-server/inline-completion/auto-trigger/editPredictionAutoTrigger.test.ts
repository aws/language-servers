/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert'
import * as sinon from 'sinon'
import { editPredictionAutoTrigger } from './editPredictionAutoTrigger'
import { EditPredictionConfigManager } from './editPredictionConfig'
import { FileContext } from '../../../shared/codeWhispererService'
import { Position } from '@aws/language-server-runtimes/server-interface'
import { CursorTracker } from './cursorTracker'
import { RecentEditTracker } from './recentEditTracker'

// Mock the language detector factory
const mockLanguageDetector = {
    isAfterKeyword: sinon.stub().returns(false),
    isAfterOperatorOrDelimiter: sinon.stub().returns(false),
    isAtLineBeginning: sinon.stub().returns(false)
}

// Mock the language detector factory
sinon.stub(require('./languageDetector'), 'LanguageDetectorFactory').returns({
    getDetector: sinon.stub().returns(mockLanguageDetector)
})

describe('editPredictionAutoTrigger', function() {
    let mockCursorTracker: Partial<CursorTracker>
    let mockRecentEdits: Partial<RecentEditTracker>
    
    beforeEach(function() {
        sinon.restore()
        
        mockCursorTracker = {
            hasPositionChanged: sinon.stub().returns(false)
        }
        
        mockRecentEdits = {
            hasRecentEditInLine: sinon.stub().returns(true)
        }
        
        // Reset the config manager
        // @ts-ignore - accessing private static property for testing
        EditPredictionConfigManager.instance = undefined
    })
    
    afterEach(function() {
        sinon.restore()
    })
    
    function createMockFileContext(leftContent = '', rightContent = 'suffix\nnon-empty-suffix'): FileContext {
        return {
            leftFileContent: leftContent,
            rightFileContent: rightContent,
            programmingLanguage: {
                languageName: 'java'
            }
        } as FileContext
    }
    
    it('should not trigger when there is no recent edit', function() {
        // Arrange
        (mockRecentEdits.hasRecentEditInLine as sinon.SinonStub).returns(false)
        
        // Act
        const result = editPredictionAutoTrigger({
            fileContext: createMockFileContext(),
            lineNum: 0,
            char: '',
            previousDecision: '',
            cursorHistory: mockCursorTracker as CursorTracker,
            recentEdits: mockRecentEdits as RecentEditTracker
        })
        
        // Assert
        assert.strictEqual(result.shouldTrigger, false)
        sinon.assert.called(mockRecentEdits.hasRecentEditInLine as sinon.SinonStub)
    })
    
    it('should not trigger when cursor is in middle of word', function() {
        // Arrange
        const fileContext = createMockFileContext('someWord', 'moreWord\nnon-empty-suffix')
        
        // Act
        const result = editPredictionAutoTrigger({
            fileContext,
            lineNum: 0,
            char: '',
            previousDecision: '',
            cursorHistory: mockCursorTracker as CursorTracker,
            recentEdits: mockRecentEdits as RecentEditTracker
        })
        
        // Assert
        assert.strictEqual(result.shouldTrigger, false)
    })
    
    it('should not trigger when previous decision was Reject', function() {
        // Arrange
        const fileContext = createMockFileContext('word ', ' \nnon-empty-suffix')
        
        // Act
        const result = editPredictionAutoTrigger({
            fileContext,
            lineNum: 0,
            char: '',
            previousDecision: 'Reject',
            cursorHistory: mockCursorTracker as CursorTracker,
            recentEdits: mockRecentEdits as RecentEditTracker
        })
        
        // Assert
        assert.strictEqual(result.shouldTrigger, false)
    })
    
    it('should not trigger when there is no non-empty suffix', function() {
        // Arrange
        const fileContext = createMockFileContext('word ', ' \n')
        
        // Act
        const result = editPredictionAutoTrigger({
            fileContext,
            lineNum: 0,
            char: '',
            previousDecision: '',
            cursorHistory: mockCursorTracker as CursorTracker,
            recentEdits: mockRecentEdits as RecentEditTracker
        })
        
        // Assert
        assert.strictEqual(result.shouldTrigger, false)
    })
    
    it('should trigger when cursor is after keyword', function() {
        // Arrange
        const fileContext = createMockFileContext('word ', ' \nnon-empty-suffix')
        mockLanguageDetector.isAfterKeyword.returns(true)
        
        // Act
        const result = editPredictionAutoTrigger({
            fileContext,
            lineNum: 0,
            char: '',
            previousDecision: '',
            cursorHistory: mockCursorTracker as CursorTracker,
            recentEdits: mockRecentEdits as RecentEditTracker
        })
        
        // Assert
        assert.strictEqual(result.shouldTrigger, true)
    })
})
