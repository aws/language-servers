/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Position in a document
 */
export interface Position {
    line: number
    character: number
}

/**
 * Scenario for testing cursor position triggers
 */
export interface CursorPositionScenario {
    name: string
    position: Position
    expectedTrigger: boolean
    isAfterKeyword?: boolean
    isAfterOperatorOrDelimiter?: boolean
    isAtLineBeginning?: boolean
}

/**
 * Test scenarios for different programming languages
 */
export interface TestScenario {
    language: string
    code: string
    cursorPositionScenarios: CursorPositionScenario[]
}

/**
 * Edit tracking test scenario
 */
export interface EditTrackingScenario {
    description: string
    uri: string
    checkLine: number
    timeThreshold: number
    expectedResult: boolean
}

/**
 * Split code at a specific position
 *
 * @param code The full code string
 * @param position The position to split at
 * @returns Object containing left and right content
 */
export function splitCodeAtPosition(code: string, position: Position): { leftContent: string; rightContent: string } {
    const lines = code.split('\n')

    // Get content before the position
    const leftLines = lines.slice(0, position.line)
    const currentLine = lines[position.line] || ''
    const leftPart = currentLine.substring(0, position.character)
    leftLines.push(leftPart)
    const leftContent = leftLines.join('\n')

    // Get content after the position
    const rightPart = currentLine.substring(position.character)
    const rightLines = [rightPart, ...lines.slice(position.line + 1)]
    const rightContent = rightLines.join('\n')

    // Ensure there's a non-empty suffix for testing
    if (rightLines.length > 1) {
        // Make sure the second line has content for the non-empty suffix check
        rightLines[1] = rightLines[1].trim() ? rightLines[1] : 'non-empty-suffix'
        return { leftContent, rightContent: rightLines.join('\n') }
    }

    return { leftContent, rightContent: rightPart + '\nnon-empty-suffix' }
}

/**
 * Test scenarios for different programming languages
 */
export const TestScenarios: Record<string, TestScenario> = {
    JAVA: {
        language: 'java',
        code: `public class Example {
    public static void main(String[] args) {
        System.out.println("Hello World");
        if (args.length > 0) {

        }
        String name = "John";
        int x = 10;
        x += 5;
    }
}`,
        cursorPositionScenarios: [
            {
                // "if █(args.length > 0) {"
                name: 'after if keyword',
                position: { line: 3, character: 11 },
                expectedTrigger: true,
                isAfterKeyword: true,
            },
            {
                // "        █"
                name: 'inside empty block',
                position: { line: 4, character: 12 },
                expectedTrigger: true,
                isAtLineBeginning: true,
            },
            {
                // "String name = █"John";"
                name: 'after assignment operator',
                position: { line: 6, character: 20 },
                expectedTrigger: true,
                isAfterOperatorOrDelimiter: true,
            },
            {
                // "System.out.print█ln("Hello World");"
                name: 'middle of word',
                position: { line: 2, character: 18 },
                expectedTrigger: false,
                // Force this test to use the actual content check
                isAfterKeyword: false,
                isAfterOperatorOrDelimiter: false,
                isAtLineBeginning: false,
            },
        ],
    },
    PYTHON: {
        language: 'python',
        code: `def example_function():
    print("Hello World")
    if True:

    name = "John"
    x = 10
    x += 5`,
        cursorPositionScenarios: [
            {
                // "if █True:"
                name: 'after if keyword',
                position: { line: 2, character: 7 },
                expectedTrigger: true,
                isAfterKeyword: true,
            },
            {
                // "    █"
                name: 'inside empty block',
                position: { line: 3, character: 8 },
                expectedTrigger: true,
                isAtLineBeginning: true,
            },
            {
                // "name = █"John""
                name: 'after assignment operator',
                position: { line: 4, character: 9 },
                expectedTrigger: true,
                isAfterOperatorOrDelimiter: true,
            },
        ],
    },
    JAVASCRIPT: {
        language: 'javascript',
        code: `function example() {
    console.log("Hello World");
    if (true) {

    }
    const name = "John";
    let x = 10;
    x += 5;
}`,
        cursorPositionScenarios: [
            {
                // "if █(true) {"
                name: 'after if keyword',
                position: { line: 2, character: 7 },
                expectedTrigger: true,
                isAfterKeyword: true,
            },
            {
                // "    █"
                name: 'inside empty block',
                position: { line: 3, character: 8 },
                expectedTrigger: true,
                isAtLineBeginning: true,
            },
            {
                // "const name = █"John";"
                name: 'after assignment operator',
                position: { line: 5, character: 17 },
                expectedTrigger: true,
                isAfterOperatorOrDelimiter: true,
            },
        ],
    },
}

/**
 * Test scenarios for edit tracking
 */
export const EditTrackingScenarios: Record<string, EditTrackingScenario> = {
    RECENT_EDIT_SAME_LINE: {
        description: 'Recent edit in the same line',
        uri: 'file:///test/document.java',
        checkLine: 5,
        timeThreshold: 5000,
        expectedResult: true,
    },
    NO_RECENT_EDIT: {
        description: 'No recent edit in the line',
        uri: 'file:///test/document.java',
        checkLine: 6,
        timeThreshold: 5000,
        expectedResult: false,
    },
    OLD_EDIT: {
        description: 'Edit is too old',
        uri: 'file:///test/document.java',
        checkLine: 5,
        timeThreshold: 1000, // Short threshold
        expectedResult: false,
    },
    DIFFERENT_DOCUMENT: {
        description: 'Edit in a different document',
        uri: 'file:///test/different-document.java',
        checkLine: 10,
        timeThreshold: 5000,
        expectedResult: false,
    },
}
