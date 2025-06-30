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
import { CursorTracker } from '../tracker/cursorTracker'
import { RecentEditTracker } from '../tracker/codeEditTracker'
import { TestScenarios, EditTrackingScenarios, splitCodeAtPosition } from './EditPredictionAutoTriggerTestConstants'

// Debug logger for tests
const DEBUG_TEST = true
function logTest(...args: any[]): void {
    if (DEBUG_TEST) {
        console.log('[EditPredictionAutoTriggerTest]', ...args)
    }
}

// Mock the language detector factory
const mockLanguageDetector = {
    isAfterKeyword: sinon.stub().returns(false),
    isAfterOperatorOrDelimiter: sinon.stub().returns(false),
    isAtLineBeginning: sinon.stub().returns(false),
}

// Mock the language detector factory
sinon.stub(require('./languageDetector'), 'LanguageDetectorFactory').returns({
    getDetector: sinon.stub().returns(mockLanguageDetector),
})

describe('editPredictionAutoTrigger', function () {
    let mockCursorTracker: Partial<CursorTracker>
    let mockRecentEdits: Partial<RecentEditTracker>

    beforeEach(function () {
        logTest('Setting up test environment')
        sinon.restore()

        mockCursorTracker = {
            hasPositionChanged: sinon.stub().returns(false),
        }

        mockRecentEdits = {
            hasRecentEditInLine: sinon.stub().returns(true),
        }

        // Reset the config manager
        // @ts-ignore - accessing private static property for testing
        EditPredictionConfigManager.instance = undefined
        logTest('Test environment setup complete')
    })

    afterEach(function () {
        sinon.restore()
    })

    function createMockFileContext(leftContent = '', rightContent = 'suffix\nnon-empty-suffix'): FileContext {
        return {
            leftFileContent: leftContent,
            rightFileContent: rightContent,
            programmingLanguage: {
                languageName: 'java',
            },
        } as FileContext
    }

    it('should not trigger when there is no recent edit', function () {
        // Arrange
        logTest('Testing no recent edit scenario')
        ;(mockRecentEdits.hasRecentEditInLine as sinon.SinonStub).returns(false)

        // Act
        const result = editPredictionAutoTrigger({
            fileContext: createMockFileContext(),
            lineNum: 0,
            char: '',
            previousDecision: '',
            cursorHistory: mockCursorTracker as CursorTracker,
            recentEdits: mockRecentEdits as RecentEditTracker,
        })

        // Assert
        logTest('Result:', result)
        assert.strictEqual(result.shouldTrigger, false)
        sinon.assert.called(mockRecentEdits.hasRecentEditInLine as sinon.SinonStub)
    })

    // TODO: As this rule is temporarily disabled, remove this test case or reenable it once we bring back the rule
    it.skip('should not trigger when cursor is in middle of word', function () {
        // Arrange
        const fileContext = createMockFileContext('someWord', 'moreWord\nnon-empty-suffix')

        // Act
        const result = editPredictionAutoTrigger({
            fileContext,
            lineNum: 0,
            char: '',
            previousDecision: '',
            cursorHistory: mockCursorTracker as CursorTracker,
            recentEdits: mockRecentEdits as RecentEditTracker,
        })

        // Assert
        assert.strictEqual(result.shouldTrigger, false)
    })

    it('should not trigger when previous decision was Reject', function () {
        // Arrange
        const fileContext = createMockFileContext('word ', ' \nnon-empty-suffix')

        // Act
        const result = editPredictionAutoTrigger({
            fileContext,
            lineNum: 0,
            char: '',
            previousDecision: 'Reject',
            cursorHistory: mockCursorTracker as CursorTracker,
            recentEdits: mockRecentEdits as RecentEditTracker,
        })

        // Assert
        assert.strictEqual(result.shouldTrigger, false)
    })

    it('should not trigger when there is no non-empty suffix', function () {
        // Arrange
        const fileContext = createMockFileContext('word ', ' \n')

        // Act
        const result = editPredictionAutoTrigger({
            fileContext,
            lineNum: 0,
            char: '',
            previousDecision: '',
            cursorHistory: mockCursorTracker as CursorTracker,
            recentEdits: mockRecentEdits as RecentEditTracker,
        })

        // Assert
        assert.strictEqual(result.shouldTrigger, false)
    })

    it('should trigger when cursor is after keyword', function () {
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
            recentEdits: mockRecentEdits as RecentEditTracker,
        })

        // Assert
        assert.strictEqual(result.shouldTrigger, true)
    })

    describe('using test scenarios from constants', function () {
        // Test each programming language scenario
        Object.keys(TestScenarios).forEach(key => {
            const scenario = TestScenarios[key]

            describe(`${scenario.language} language scenarios`, function () {
                // Test each cursor position scenario for this language
                scenario.cursorPositionScenarios.forEach(cursorScenario => {
                    it(`should ${cursorScenario.expectedTrigger ? 'trigger' : 'not trigger'} when ${cursorScenario.name}`, function () {
                        // Arrange
                        const { leftContent, rightContent } = splitCodeAtPosition(
                            scenario.code,
                            cursorScenario.position
                        )

                        const fileContext = {
                            leftFileContent: leftContent,
                            rightFileContent: rightContent,
                            programmingLanguage: {
                                languageName: scenario.language,
                            },
                        } as FileContext

                        // Reset all stubs to default values
                        mockLanguageDetector.isAfterKeyword.returns(false)
                        mockLanguageDetector.isAfterOperatorOrDelimiter.returns(false)
                        mockLanguageDetector.isAtLineBeginning.returns(false)

                        // Set up the specific scenario conditions
                        if (cursorScenario.isAfterKeyword) {
                            mockLanguageDetector.isAfterKeyword.returns(true)
                        }

                        if (cursorScenario.isAfterOperatorOrDelimiter) {
                            mockLanguageDetector.isAfterOperatorOrDelimiter.returns(true)
                        }

                        if (cursorScenario.isAtLineBeginning) {
                            mockLanguageDetector.isAtLineBeginning.returns(true)
                        }

                        // For the middle of word test, we need to override the cursor position check
                        if (cursorScenario.name === 'middle of word') {
                            // Create a special file context that will force the middle of word check to fail
                            const specialFileContext = createMockFileContext('someWord', 'moreWord\nnon-empty-suffix')

                            // Act with the special file context
                            const result = editPredictionAutoTrigger({
                                fileContext: specialFileContext,
                                lineNum: 0,
                                char: '',
                                previousDecision: '',
                                cursorHistory: mockCursorTracker as CursorTracker,
                                recentEdits: mockRecentEdits as RecentEditTracker,
                            })

                            // Assert
                            assert.strictEqual(result.shouldTrigger, cursorScenario.expectedTrigger)
                            return // Skip the normal test flow
                        }

                        // Act
                        const result = editPredictionAutoTrigger({
                            fileContext,
                            lineNum: cursorScenario.position.line,
                            char: '',
                            previousDecision: '',
                            cursorHistory: mockCursorTracker as CursorTracker,
                            recentEdits: mockRecentEdits as RecentEditTracker,
                        })

                        // Assert
                        assert.strictEqual(result.shouldTrigger, cursorScenario.expectedTrigger)
                    })
                })
            })
        })
    })

    describe('edit tracking scenarios', function () {
        Object.keys(EditTrackingScenarios).forEach(key => {
            const scenario = EditTrackingScenarios[key]

            it(`should ${scenario.expectedResult ? 'detect' : 'not detect'} edit: ${scenario.description}`, function () {
                // Arrange
                ;(mockRecentEdits.hasRecentEditInLine as sinon.SinonStub).returns(scenario.expectedResult)

                const fileContext = createMockFileContext('content ', ' \nnon-empty-suffix')

                // Act
                const result = editPredictionAutoTrigger({
                    fileContext,
                    lineNum: scenario.checkLine,
                    char: '',
                    previousDecision: '',
                    cursorHistory: mockCursorTracker as CursorTracker,
                    recentEdits: mockRecentEdits as RecentEditTracker,
                })

                // Assert
                sinon.assert.calledWith(
                    mockRecentEdits.hasRecentEditInLine as sinon.SinonStub,
                    sinon.match.any,
                    scenario.checkLine,
                    sinon.match.any
                )

                // If no recent edit, it should never trigger
                if (!scenario.expectedResult) {
                    assert.strictEqual(result.shouldTrigger, false)
                }
            })
        })

        it('should correctly detect edits with the simplified implementation', function () {
            // Arrange
            const mockRecentEditTracker = {
                snapshots: new Map(),
                shadowCopies: new Map(),
                log: { debug: sinon.stub() },
                getShadowCopy: sinon.stub(),
            }

            // Create a test document URI
            const testUri = 'file:///test/document.ts'

            // Set up the shadow copy (current content)
            const currentContent = 'line 1\nline 2\nline 3 modified\nline 4\nline 5'
            mockRecentEditTracker.getShadowCopy.withArgs(testUri).returns(currentContent)

            // Create a snapshot with original content (line 3 is different)
            const originalContent = 'line 1\nline 2\nline 3 original\nline 4\nline 5'
            const now = Date.now()
            const recentTime = now - 5000 // 5 seconds ago

            // Set up snapshots map
            mockRecentEditTracker.snapshots.set(testUri, [
                {
                    filePath: testUri,
                    content: originalContent,
                    timestamp: recentTime,
                    size: originalContent.length,
                },
            ])

            // Create a spy for the hasRecentEditInLine method
            const hasRecentEditInLineSpy = sinon.spy(RecentEditTracker.prototype, 'hasRecentEditInLine')

            // Create a real instance with the mocked data
            const recentEditTracker = new RecentEditTracker(
                { debug: sinon.stub(), error: sinon.stub() } as any, // mock logger
                {
                    maxFiles: 10,
                    maxStorageSizeKb: 1000,
                    debounceIntervalMs: 1000,
                    maxAgeMs: 10000,
                    maxSupplementalContext: 5,
                }
            )

            // Replace the instance's methods and properties with our mocked ones
            Object.assign(recentEditTracker, {
                snapshots: mockRecentEditTracker.snapshots,
                shadowCopies: mockRecentEditTracker.shadowCopies,
                getShadowCopy: mockRecentEditTracker.getShadowCopy,
            })

            // Act - Check for edits in line 3 (where we know there's a change)
            const hasEditInChangedLine = recentEditTracker.hasRecentEditInLine(testUri, 2, 10000, 0)

            // Check for edits in line 1 (where there's no change)
            const hasEditInUnchangedLine = recentEditTracker.hasRecentEditInLine(testUri, 0, 10000, 0)

            // Check with adjacent lines (line 2 is adjacent to line 3 which has changes)
            const hasEditInAdjacentLine = recentEditTracker.hasRecentEditInLine(testUri, 1, 10000, 1)

            // Assert
            assert.strictEqual(hasEditInChangedLine, true, 'Should detect edit in the changed line')
            assert.strictEqual(hasEditInUnchangedLine, false, 'Should not detect edit in unchanged line')
            assert.strictEqual(hasEditInAdjacentLine, true, 'Should detect edit when checking adjacent lines')

            // Restore the spy
            hasRecentEditInLineSpy.restore()
        })
    })

    describe('user pause detection', function () {
        it('should trigger when user has paused at a valid position', function () {
            // Arrange
            const fileContext = {
                leftFileContent: 'word ',
                rightFileContent: ' \nnon-empty-suffix',
                programmingLanguage: {
                    languageName: 'java',
                },
            } as FileContext

            // Configure cursor tracker to indicate user has paused (not changed position)
            ;(mockCursorTracker.hasPositionChanged as sinon.SinonStub).returns(false)

            // Act
            const result = editPredictionAutoTrigger({
                fileContext,
                lineNum: 0,
                char: '',
                previousDecision: '',
                cursorHistory: mockCursorTracker as CursorTracker,
                recentEdits: mockRecentEdits as RecentEditTracker,
            })

            // Assert
            sinon.assert.called(mockCursorTracker.hasPositionChanged as sinon.SinonStub)
            assert.strictEqual(result.shouldTrigger, true)
        })

        // TODO: As this rule is temporarily disabled, remove this test case or reenable it once we bring back the rule
        it.skip('should not trigger when user has not paused long enough', function () {
            // Arrange
            const fileContext = {
                leftFileContent: 'word ',
                rightFileContent: ' \nnon-empty-suffix',
                programmingLanguage: {
                    languageName: 'java',
                },
            } as FileContext

            // Configure cursor tracker to indicate user has not paused (position changed)
            ;(mockCursorTracker.hasPositionChanged as sinon.SinonStub).returns(true)

            // Reset other trigger conditions
            mockLanguageDetector.isAfterKeyword.returns(false)
            mockLanguageDetector.isAfterOperatorOrDelimiter.returns(false)
            mockLanguageDetector.isAtLineBeginning.returns(false)

            // Act
            const result = editPredictionAutoTrigger({
                fileContext,
                lineNum: 0,
                char: '',
                previousDecision: '',
                cursorHistory: mockCursorTracker as CursorTracker,
                recentEdits: mockRecentEdits as RecentEditTracker,
            })

            // Assert
            sinon.assert.called(mockCursorTracker.hasPositionChanged as sinon.SinonStub)
            assert.strictEqual(result.shouldTrigger, false)
        })
    })

    describe('combined trigger conditions', function () {
        it('should trigger when multiple conditions are true', function () {
            // Arrange
            const fileContext = createMockFileContext('if ', ' \nnon-empty-suffix')

            // Set up multiple trigger conditions
            mockLanguageDetector.isAfterKeyword.returns(true)
            mockLanguageDetector.isAtLineBeginning.returns(true)

            // Act
            const result = editPredictionAutoTrigger({
                fileContext,
                lineNum: 0,
                char: '',
                previousDecision: '',
                cursorHistory: mockCursorTracker as CursorTracker,
                recentEdits: mockRecentEdits as RecentEditTracker,
            })

            // Assert
            assert.strictEqual(result.shouldTrigger, true)
        })
    })
})
