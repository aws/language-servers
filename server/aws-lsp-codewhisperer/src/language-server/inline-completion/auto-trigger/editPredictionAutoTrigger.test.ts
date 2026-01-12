/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert'
import * as sinon from 'sinon'
import { EditClassifier, editPredictionAutoTrigger } from './editPredictionAutoTrigger'
import { EditPredictionConfigManager } from './editPredictionConfig'
import { ClientFileContextClss, FileContext, getFileContext } from '../../../shared/codeWhispererService'
import { Logging, Position } from '@aws/language-server-runtimes/server-interface'
import { TextDocument } from 'vscode-languageserver-textdocument'
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

describe('classifier', function () {
    const SAMPLE = `public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`

    const SAMPLE_FILE_CONTEXT = getFileContext({
        textDocument: TextDocument.create('file:///testfile.java', 'java', 1, SAMPLE),
        position: Position.create(2, 18),
        inferredLanguageId: 'java',
        workspaceFolder: undefined,
    })

    // Create stubs for all methods
    const loggingStub = {
        error: sinon.stub(),
        warn: sinon.stub(),
        info: sinon.stub(),
        log: sinon.stub(),
        debug: sinon.stub(),
    } satisfies Logging

    it('test sample', function () {
        assert.strictEqual(SAMPLE_FILE_CONTEXT.leftContextAtCurLine, '        System.out')
        assert.strictEqual(SAMPLE_FILE_CONTEXT.rightContextAtCurLine, '.println("Hello, World!");') // TODO: Not sure why it doesnt include \n
        assert.strictEqual(SAMPLE_FILE_CONTEXT.programmingLanguage.languageName, 'java')
        assert.strictEqual(
            SAMPLE_FILE_CONTEXT.leftFileContent,
            `public class HelloWorld {
    public static void main(String[] args) {
        System.out`
        )
        assert.strictEqual(
            SAMPLE_FILE_CONTEXT.rightFileContent,
            `.println("Hello, World!");
    }
}`
        )
    })

    describe('constant check', function () {
        it('intercept', function () {
            assert.strictEqual(EditClassifier.INTERCEPT, -0.2782)
        })

        it('threshold', function () {
            assert.strictEqual(EditClassifier.THRESHOLD, 0.53)
        })

        it('process edit history', function () {
            const r =
                EditClassifier.processEditHistory(`--- file:///Volumes/workplace/ide/sample_projects/Calculator-2/src/main/hello/MathUtil.java	1760647547772
+++ file:///Volumes/workplace/ide/sample_projects/Calculator-2/src/main/hello/MathUtil.java	1760647547851
@@ -4,5 +4,5 @@
         return a + b;
     }
 
-    public static int substract
+    public static int substract()
 }`)

            assert.strictEqual(r.addedLines, 1)
            assert.strictEqual(r.deletedLines, 1)
            assert.strictEqual(r.changedCharacters, 2)
        })

        it('process edit history 2', function () {
            const r = EditClassifier.processEditHistory(`--- file:///query.sql
+++ file:///query.sql
@@ -1,6 +1,4 @@
 SELECT u.name, u.email, p.title
 FROM users u
-LEFT JOIN profiles pr ON u.id = pr.user_id
 JOIN posts p ON u.id = p.user_id
 WHERE u.active = true
-AND p.published_at >= '2023-01-01'
+AND p.published_date >= '2023-01-01'`)

            assert.strictEqual(r.addedLines, 1)
            assert.strictEqual(r.deletedLines, 2)
            assert.strictEqual(r.changedCharacters, 45)
        })

        it('edit distance cal', function () {
            const r = EditClassifier.editDistance('public static int substract', 'public static int substract()')
            assert.strictEqual(r, 2)
        })
    })

    describe('test logistic formula', function () {
        function createMockFileContext(leftcontext: string, rightcontext: string) {}

        it('case 1 Python function with keyword', function () {
            const document = TextDocument.create(
                'test.py',
                'python',
                1,
                `def calculate_sum(a, b):
    return a + b

def main():
    result = calculate_sum(5, 3)
    try:
        print(f"Result: {result}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()`
            )
            const filecontext = new ClientFileContextClss({
                textDocument: document,
                position: Position.create(5, 7),
                inferredLanguageId: 'python',
                workspaceFolder: undefined,
            })

            // assert setup is correct
            assert.strictEqual(
                filecontext.leftFileContent,
                `def calculate_sum(a, b):
    return a + b

def main():
    result = calculate_sum(5, 3)
    try`
            )
            assert.strictEqual(
                filecontext.rightFileContent,
                `:
        print(f"Result: {result}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()`
            )
            assert.strictEqual(filecontext.programmingLanguage.languageName, 'python')

            // test classifier
            const sut = new EditClassifier(
                {
                    fileContext: filecontext,
                    triggerChar: 'y',
                    recentEdits: {
                        isUtg: false,
                        isProcessTimeout: false,
                        supplementalContextItems: [
                            {
                                filePath: '',
                                content: `--- file:///calculator.py
+++ file:///calculator.py
@@ -1,5 +1,7 @@
 def calculate_sum(a, b):
     return a + b
 
+def calculate_product(a, b):
+    return a * b
+
 def main():
     result = calculate_sum(5, 3)`,
                            },
                        ],
                        contentsLength: 0,
                        latency: 0,
                        strategy: 'recentEdits',
                    },
                    recentDecisions: ['Accept', 'Accept', 'Accept', 'Reject', 'Reject'], // AR = 0.6
                },
                loggingStub
            )

            const actual = sut.score().toPrecision(4)
            assert.strictEqual(actual, '0.6998')
        })

        it('case 2 Java method with keyword and deletions', function () {
            const document = TextDocument.create(
                'test.java',
                'java',
                1,
                `public class Calculator {
    private int value;
    
    public void setValue(int v) {
        this.value = v;
    }
    
    public int getValue() {
        if (this.value > 0) {
            return this.value;
        }
        return 0;
    }
}`
            )
            const filecontext = new ClientFileContextClss({
                textDocument: document,
                position: Position.create(8, 10),
                inferredLanguageId: 'java',
                workspaceFolder: undefined,
            })

            // assert setup is correct
            assert.strictEqual(
                filecontext.leftFileContent,
                `public class Calculator {
    private int value;
    
    public void setValue(int v) {
        this.value = v;
    }
    
    public int getValue() {
        if`
            )
            assert.strictEqual(
                filecontext.rightFileContent,
                ` (this.value > 0) {
            return this.value;
        }
        return 0;
    }
}`
            )
            assert.strictEqual(filecontext.programmingLanguage.languageName, 'java')

            // test classifier
            const sut = new EditClassifier(
                {
                    fileContext: filecontext,
                    triggerChar: 'f',
                    recentEdits: {
                        isUtg: false,
                        isProcessTimeout: false,
                        supplementalContextItems: [
                            {
                                filePath: '',
                                content: `--- file:///Calculator.java
+++ file:///Calculator.java
@@ -1,6 +1,4 @@
 public class Calculator {
     private int value;
-    private String name;
-    private boolean active;
     
     public void setValue(int v) {`,
                            },
                        ],
                        contentsLength: 0,
                        latency: 0,
                        strategy: 'recentEdits',
                    },
                    recentDecisions: [], // If recentDecision has length 0, will use 0.3 as AR
                },
                loggingStub
            )

            const actual = sut.score().toPrecision(4)
            assert.strictEqual(actual, '0.5374')
        })

        it('case 3 JavaScript without keyword, with deletions', function () {
            const document = TextDocument.create(
                'test.js',
                'javascript',
                1,
                `const users = [
    { name: 'Alice', age: 25 },
    { name: 'Bob', age: 30 }
];

const getNames = () => {
    return users.map(user => user.fullName);
};

console.log(getNames());`
            )
            const filecontext = new ClientFileContextClss({
                textDocument: document,
                position: Position.create(6, 42),
                inferredLanguageId: 'javascript',
                workspaceFolder: undefined,
            })

            // assert setup is correct
            assert.strictEqual(
                filecontext.leftFileContent,
                `const users = [
    { name: 'Alice', age: 25 },
    { name: 'Bob', age: 30 }
];

const getNames = () => {
    return users.map(user => user.fullName`
            )
            assert.strictEqual(
                filecontext.rightFileContent,
                `);
};

console.log(getNames());`
            )
            assert.strictEqual(filecontext.programmingLanguage.languageName, 'javascript')

            // test classifier
            const sut = new EditClassifier(
                {
                    fileContext: filecontext,
                    triggerChar: 'e',
                    recentEdits: {
                        isUtg: false,
                        isProcessTimeout: false,
                        supplementalContextItems: [
                            {
                                filePath: '',
                                content: `--- file:///users.js
+++ file:///users.js
@@ -1,6 +1,4 @@
 const users = [
     { name: 'Alice', age: 25 },
-    { name: 'Bob', age: 30 },
-    { name: 'Charlie', age: 35 }
+    { name: 'Bob', age: 30 }
 ];`,
                            },
                        ],
                        contentsLength: 0,
                        latency: 0,
                        strategy: 'recentEdits',
                    },
                    recentDecisions: ['Reject', 'Reject', 'Reject', 'Reject', 'Reject'], // AR 0
                },
                loggingStub
            )

            const actual = sut.score().toPrecision(4)
            assert.strictEqual(actual, '0.4085')
        })

        it('case 4 C++ without keyword, with similar line changes', function () {
            const document = TextDocument.create(
                'test.cpp',
                'cpp',
                1,
                `#include <iostream>
#include <vector>

template<typename T>
void printVector(const std::vector<T>& vec) {
    for (const auto& item : vec) {
        std::cout << item << " ";
    }
    std::cout << std::newline;
}

int main() {
    std::vector<int> numbers = {1, 2, 3, 4, 5};
    printVector(numbers);
    return 0;
}`
            )
            const filecontext = new ClientFileContextClss({
                textDocument: document,
                position: Position.create(8, 29),
                inferredLanguageId: 'cpp',
                workspaceFolder: undefined,
            })

            // assert setup is correct
            assert.strictEqual(
                filecontext.leftFileContent,
                `#include <iostream>
#include <vector>

template<typename T>
void printVector(const std::vector<T>& vec) {
    for (const auto& item : vec) {
        std::cout << item << " ";
    }
    std::cout << std::newline`
            )
            assert.strictEqual(
                filecontext.rightFileContent,
                `;
}

int main() {
    std::vector<int> numbers = {1, 2, 3, 4, 5};
    printVector(numbers);
    return 0;
}`
            )
            assert.strictEqual(filecontext.programmingLanguage.languageName, 'cpp')

            // test classifier
            const sut = new EditClassifier(
                {
                    fileContext: filecontext,
                    triggerChar: 'e',
                    recentEdits: {
                        isUtg: false,
                        isProcessTimeout: false,
                        supplementalContextItems: [
                            {
                                filePath: '',
                                content: `--- file:///vector_print.cpp
+++ file:///vector_print.cpp
@@ -5,7 +5,7 @@
     for (const auto& item : vec) {
         std::cout << item << " ";
     }
-    std::cout << std::endl;
+    std::cout << std::newline;
 }`,
                            },
                        ],
                        contentsLength: 0,
                        latency: 0,
                        strategy: 'recentEdits',
                    },
                    recentDecisions: ['Accept', 'Accept', 'Reject', 'Reject', 'Reject'], // AR 0.4
                },
                loggingStub
            )

            const actual = sut.score().toPrecision(4)
            assert.strictEqual(actual, '0.3954')
        })

        it('case 5 SQL without keyword, with similar line changes and deletions', function () {
            const document = TextDocument.create(
                'test.sql',
                'sql',
                1,
                `SELECT u.name, u.email, p.title
FROM users u
JOIN posts p ON u.id = p.user_id
WHERE u.active = true
AND p.published_date >= '2023-01-01'
ORDER BY p.published_date DESC
LIMIT 10;`
            )
            const filecontext = new ClientFileContextClss({
                textDocument: document,
                position: Position.create(4, 23),
                inferredLanguageId: 'sql',
                workspaceFolder: undefined,
            })

            // assert setup is correct
            assert.strictEqual(
                filecontext.leftFileContent,
                `SELECT u.name, u.email, p.title
FROM users u
JOIN posts p ON u.id = p.user_id
WHERE u.active = true
AND p.published_date >=`
            )
            assert.strictEqual(
                filecontext.rightFileContent,
                ` '2023-01-01'
ORDER BY p.published_date DESC
LIMIT 10;`
            )
            assert.strictEqual(filecontext.programmingLanguage.languageName, 'sql')

            // test classifier
            const sut = new EditClassifier(
                {
                    fileContext: filecontext,
                    triggerChar: '',
                    recentEdits: {
                        isUtg: false,
                        isProcessTimeout: false,
                        supplementalContextItems: [
                            {
                                filePath: '',
                                content: `--- file:///query.sql
+++ file:///query.sql
@@ -1,6 +1,4 @@
 SELECT u.name, u.email, p.title
 FROM users u
-LEFT JOIN profiles pr ON u.id = pr.user_id
 JOIN posts p ON u.id = p.user_id
 WHERE u.active = true
-AND p.published_at >= '2023-01-01'
+AND p.published_date >= '2023-01-01'`,
                            },
                        ],
                        contentsLength: 0,
                        latency: 0,
                        strategy: 'recentEdits',
                    },
                    recentDecisions: ['Accept', 'Reject', 'Reject', 'Reject', 'Reject'], // AR 0.2
                },
                loggingStub
            )

            const actual = sut.score().toPrecision(4)
            assert.strictEqual(actual, '0.4031')
        })
    })
})
