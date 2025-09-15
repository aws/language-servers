/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert'
import * as sinon from 'sinon'
import { LanguageDetectorFactory } from './languageDetector'

describe('LanguageDetector', function () {
    afterEach(function () {
        sinon.restore()
    })

    describe('LanguageDetectorFactory', function () {
        it('should return a Java detector for Java language', function () {
            // Act
            const detector = LanguageDetectorFactory.getDetector('java')

            // Assert
            assert.ok(detector)
            assert.ok(detector.getKeywords().includes('public'))
            assert.ok(detector.getKeywords().includes('class'))
            assert.ok(detector.getOperatorsAndDelimiters().includes('{'))
        })

        it('should return a Python detector for Python language', function () {
            // Act
            const detector = LanguageDetectorFactory.getDetector('python')

            // Assert
            assert.ok(detector)
            assert.ok(detector.getKeywords().includes('def'))
            assert.ok(detector.getKeywords().includes('import'))
            assert.ok(detector.getOperatorsAndDelimiters().includes(':'))
        })

        it('should return a JavaScript detector for JavaScript language', function () {
            // Act
            const detector = LanguageDetectorFactory.getDetector('javascript')

            // Assert
            assert.ok(detector)
            assert.ok(detector.getKeywords().includes('function'))
            assert.ok(detector.getKeywords().includes('const'))
            assert.ok(detector.getOperatorsAndDelimiters().includes('=>'))
        })

        it('should return a JavaScript detector for TypeScript language', function () {
            // Act
            const detector = LanguageDetectorFactory.getDetector('typescript')

            // Assert
            assert.ok(detector)
            assert.ok(detector.getKeywords().includes('interface'))
            assert.ok(detector.getOperatorsAndDelimiters().includes('=>'))
        })

        it('should return a generic detector for unsupported languages', function () {
            // Act
            const detector = LanguageDetectorFactory.getDetector('unsupported')

            // Assert
            assert.ok(detector)
            assert.strictEqual(detector.getKeywords().length, 0)
            assert.ok(detector.getOperatorsAndDelimiters().includes(';'))
        })

        it('should cache detectors for repeated calls with the same language', function () {
            // Act
            const detector1 = LanguageDetectorFactory.getDetector('java')
            const detector2 = LanguageDetectorFactory.getDetector('java')

            // Assert
            assert.strictEqual(detector1, detector2)
        })

        it('should be case-insensitive for language names', function () {
            // Act
            const detector1 = LanguageDetectorFactory.getDetector('Java')
            const detector2 = LanguageDetectorFactory.getDetector('java')

            // Assert
            assert.strictEqual(detector1, detector2)
        })
    })

    describe('BaseLanguageDetector', function () {
        it('should detect keywords correctly', function () {
            // Arrange
            const detector = LanguageDetectorFactory.getDetector('java')

            // Act & Assert
            assert.strictEqual(detector.isAfterKeyword('public '), true)
            assert.strictEqual(detector.isAfterKeyword('class '), true)
            assert.strictEqual(detector.isAfterKeyword('notakeyword '), false)
        })

        it('should detect operators and delimiters correctly', function () {
            // Arrange
            const detector = LanguageDetectorFactory.getDetector('java')

            // Act & Assert
            assert.strictEqual(detector.isAfterOperatorOrDelimiter('{'), true)
            assert.strictEqual(detector.isAfterOperatorOrDelimiter(';'), true)
            assert.strictEqual(detector.isAfterOperatorOrDelimiter('a'), false)
        })

        it('should detect line beginning correctly', function () {
            // Arrange
            const detector = LanguageDetectorFactory.getDetector('java')

            // Act & Assert
            assert.strictEqual(detector.isAtLineBeginning(''), true)
            assert.strictEqual(detector.isAtLineBeginning('   '), true)
            assert.strictEqual(detector.isAtLineBeginning('code'), false)
        })
    })

    describe('JavaLanguageDetector', function () {
        it('should have all Java keywords', function () {
            // Arrange
            const detector = LanguageDetectorFactory.getDetector('java')

            // Act
            const keywords = detector.getKeywords()

            // Assert
            assert.ok(keywords.includes('public'))
            assert.ok(keywords.includes('class'))
            assert.ok(keywords.includes('interface'))
            assert.ok(keywords.includes('extends'))
            assert.ok(keywords.includes('implements'))
        })

        it('should have all Java operators and delimiters', function () {
            // Arrange
            const detector = LanguageDetectorFactory.getDetector('java')

            // Act
            const operators = detector.getOperatorsAndDelimiters()

            // Assert
            assert.ok(operators.includes('='))
            assert.ok(operators.includes('=='))
            assert.ok(operators.includes('{'))
            assert.ok(operators.includes('}'))
            assert.ok(operators.includes(';'))
        })
    })

    describe('PythonLanguageDetector', function () {
        it('should have all Python keywords', function () {
            // Arrange
            const detector = LanguageDetectorFactory.getDetector('python')

            // Act
            const keywords = detector.getKeywords()

            // Assert
            assert.ok(keywords.includes('def'))
            assert.ok(keywords.includes('class'))
            assert.ok(keywords.includes('import'))
            assert.ok(keywords.includes('from'))
            assert.ok(keywords.includes('if'))
        })

        it('should have all Python operators and delimiters', function () {
            // Arrange
            const detector = LanguageDetectorFactory.getDetector('python')

            // Act
            const operators = detector.getOperatorsAndDelimiters()

            // Assert
            assert.ok(operators.includes('='))
            assert.ok(operators.includes(':'))
            assert.ok(operators.includes('('))
            assert.ok(operators.includes(')'))
            assert.ok(operators.includes('**'))
            assert.ok(operators.includes('}'))
        })
    })

    describe('JavaScriptLanguageDetector', function () {
        it('should have all JavaScript keywords', function () {
            // Arrange
            const detector = LanguageDetectorFactory.getDetector('javascript')

            // Act
            const keywords = detector.getKeywords()

            // Assert
            assert.ok(keywords.includes('function'))
            assert.ok(keywords.includes('class'))
            assert.ok(keywords.includes('const'))
            assert.ok(keywords.includes('let'))
            assert.ok(keywords.includes('import'))
        })

        it('should have all JavaScript operators and delimiters', function () {
            // Arrange
            const detector = LanguageDetectorFactory.getDetector('javascript')

            // Act
            const operators = detector.getOperatorsAndDelimiters()

            // Assert
            assert.ok(operators.includes('='))
            assert.ok(operators.includes('==='))
            assert.ok(operators.includes('=>'))
            assert.ok(operators.includes('{'))
            assert.ok(operators.includes('}'))
        })
    })
})
