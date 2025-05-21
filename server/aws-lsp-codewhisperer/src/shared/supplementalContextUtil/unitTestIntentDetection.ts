/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { TextDocument } from '@aws/language-server-runtimes/server-interface'

const testFileNameRegex: Record<string, RegExp[]> = {
    python: [/^test_.*\.py$/, /.*_test\.py$/],
    java: [/^test.*\.java$/, /.*Test\.java$/],
    typescript: [/.*\.(test|spec)\.js$/],
    javascript: [/.*\.(test|spec)\.js$/],
}

const testKeywordsRegex: Record<string, RegExp[]> = {
    python: [/^import unittest/m, /^from unittest/m, /^def test_/m],
    java: [/@Test/m],
    typescript: [/describe\(/m, /(it|test)\(/m],
    javascript: [/describe\(/m, /(it|test)\(/m],
}

export class TestIntentDetector {
    constructor() {}

    detectUnitTestIntent(doc: TextDocument): boolean {
        const lang = doc.languageId
        const isTestFile = this.isTestFile(doc.uri, doc.getText(), lang)
        if (!isTestFile) {
            return false
        }

        switch (lang) {
            case 'python':
                return this.pyTestIntent(doc.getText())

            case 'java':
                return this.javaTestIntent(doc.getText())

            case 'typescript':
            case 'javascript':
                return this.jsTsTestIntent(doc.getText())

            default:
                return false
        }
    }

    isTestFile(filePath: string, fileContent: string, language: string): boolean {
        if (!testFileNameRegex[language]) {
            throw new Error('lang not supported by utg completion')
        }

        const isTestFileByName = testFileNameRegex[language].some(regex => regex.test(filePath))
        // Return early and no need to inspect further
        if (!isTestFileByName) {
            return false
        }

        return testKeywordsRegex[language].some(regex => regex.test(fileContent))
    }

    javaTestIntent(content: string): boolean {
        const signaturePattern = new RegExp(
            '@Test(?:\\s*@\\w+(?:\\(.*?\\))?\\s*)*' +
                '(?:\\s*(?:public|protected|private)\\s+)?' +
                '(?:static\\s+)?' +
                '\\s*void\\s+\\w+\\s*\\([^)]*\\)' +
                '(?:\\s*throws\\s+\\w+(?:,\\s*\\w+)*)?' +
                '\\s*\\{',
            'm'
        )

        return this.curlyBracesSyntaxUtil(signaturePattern, content)
    }

    jsTsTestIntent(content: string): boolean {
        const signaturePattern = new RegExp(/(it|test)\s*\(\s*["\'].*?["\']\s*,\s*(async\s+)?\(\s*\)\s*=>\s*\{/, 'm')

        return this.curlyBracesSyntaxUtil(signaturePattern, content)
    }

    pyTestIntent(content: string): boolean {
        const pattern = new RegExp(
            'def\\s+test_\\w+\\s*\\(.*\\):',
            'gms' // g: global, m: multiline, s: dotall
        )

        // Find all matches
        const matches = [...content.matchAll(pattern)]

        if (matches.length === 0) {
            return false
        }

        // Get content after the last test
        const lastMatch = matches[matches.length - 1]
        const lastMatchPos = lastMatch.index! + lastMatch[0].length
        const tailFromLastTest = content.slice(lastMatchPos)
        const lines = tailFromLastTest.split('\n')

        if (lines.length === 0) {
            return true
        }

        // Find first non-empty line
        const firstIndentedLine = lines.find(line => line.trim())
        if (!firstIndentedLine) {
            return true
        }

        // Calculate base indentation
        const baseIndent = firstIndentedLine.length - firstIndentedLine.trimLeft().length

        // Check if all non-empty lines maintain or exceed base indentation
        for (const line of lines) {
            if (line.trim() && line.length - line.trimLeft().length < baseIndent) {
                return false
            }
        }

        return true
    }

    private curlyBracesSyntaxUtil(regex: RegExp, content: string) {
        // Get all matches
        const matches: RegExpExecArray[] = [...content.matchAll(regex)]

        if (matches.length === 0) {
            return false
        }

        // Get the last match position
        const lastMatch = matches[matches.length - 1]
        const lastMatchPos = lastMatch.index + lastMatch[0].length

        // Get content after the last test
        const tailFromLastTest = content.slice(lastMatchPos)

        // Count braces
        const openBraces = (tailFromLastTest.match(/\{/g) || []).length
        const closeBraces = (tailFromLastTest.match(/\}/g) || []).length

        return openBraces >= closeBraces
    }
}
