// Partial port of implementation in AWS Toolkit for VSCode
// https://github.com/aws/aws-toolkit-vscode/blob/9d8ddbd85f4533e539a58e76f7c46883d8e50a79/packages/core/src/codewhisperer/util/supplementalContext/codeParsingUtil.ts

import * as path from 'path'
import { pathUtils } from '@aws/lsp-core'
import { TextDocument } from '@aws/language-server-runtimes/server-interface'
import { Regex } from 'aws-sdk/clients/iot'

export interface utgLanguageConfig {
    extension: string
    testFilenamePattern: RegExp
    functionExtractionPattern: RegExp
    classExtractionPattern: RegExp
    importStatementRegExp: RegExp
}

export const utgLanguageConfigs: Record<string, utgLanguageConfig> = {
    // Java regexes are not working efficiently for class or function extraction
    java: {
        extension: '.java',
        testFilenamePattern: /(?:Test([^/\\]+)\.java|([^/\\]+)Test\.java|([^/\\]+)Tests\.java)$/,
        functionExtractionPattern:
            /(?:(?:public|private|protected)\s+)(?:static\s+)?(?:[\w<>]+\s+)?(\w+)\s*\([^)]*\)\s*(?:(?:throws\s+\w+)?\s*)[{;]/gm, // TODO: Doesn't work for generice <T> T functions.
        classExtractionPattern: /(?<=^|\n)\s*public\s+class\s+(\w+)/gm, // TODO: Verify these.
        importStatementRegExp: /import .*\.([a-zA-Z0-9]+);/,
    },
    python: {
        extension: '.py',
        testFilenamePattern: /(?:test_([^/\\]+)\.py|([^/\\]+)_test\.py)$/,
        functionExtractionPattern: /def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g, // Worked fine
        classExtractionPattern: /^class\s+(\w+)\s*:/gm,
        importStatementRegExp: /from (.*) import.*/,
    },
}

export function isTestFile(
    filePath: string,
    languageConfig: {
        languageId: TextDocument['languageId']
        fileContent?: string
    }
): boolean {
    const normalizedFilePath = pathUtils.normalize(filePath)
    const pathContainsTest =
        normalizedFilePath.includes('tests/') ||
        normalizedFilePath.includes('test/') ||
        normalizedFilePath.includes('tst/')
    const fileNameMatchTestPatterns = isTestFileByName(normalizedFilePath, languageConfig.languageId)

    if (pathContainsTest || fileNameMatchTestPatterns) {
        return true
    }

    return false
}

function isTestFileByName(filePath: string, language: TextDocument['languageId']): boolean {
    const languageConfig = utgLanguageConfigs[language]
    if (!languageConfig) {
        // We have enabled the support only for python and Java for this check
        // as we depend on Regex for this validation.
        return false
    }
    const testFilenamePattern = languageConfig.testFilenamePattern

    const filename = path.basename(filePath)

    return testFilenamePattern.test(filename)
}

//
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
