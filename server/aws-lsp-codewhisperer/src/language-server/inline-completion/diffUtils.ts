/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import * as diff from 'diff'
import { CodeWhispererSupplementalContext, CodeWhispererSupplementalContextItem } from '../../shared/models/model'
import { trimSupplementalContexts } from '../../shared/supplementalContextUtil/supplementalContextUtil'
import { getPrefixSuffixOverlap } from './mergeRightUtils'
import { SuggestionType } from '../../shared/codeWhispererService'
import { Position, Range, TextDocument } from '@aws/language-server-runtimes/protocol'

/**
 * Generates a unified diff format between old and new file contents
 *
 * @param oldFilePath - Path to the old version of the file
 * @param newFilePath - Path to the new version of the file
 * @param oldContent - Content of the old version
 * @param newContent - Content of the new version
 * @param oldTimestamp - Timestamp of the old version
 * @param newTimestamp - Timestamp of the new version
 * @param contextSize - Number of context lines to include in the diff
 * @returns Unified diff string
 */
export function generateUnifiedDiffWithTimestamps(
    oldFilePath: string,
    newFilePath: string,
    oldContent: string,
    newContent: string,
    oldTimestamp: number,
    newTimestamp: number,
    contextSize: number = 3
): string {
    const patchResult = diff.createTwoFilesPatch(
        oldFilePath,
        newFilePath,
        oldContent,
        newContent,
        String(oldTimestamp),
        String(newTimestamp),
        { context: contextSize }
    )

    // Remove unused headers
    const lines = patchResult.split('\n')
    if (lines.length >= 2 && lines[0].startsWith('Index:')) {
        lines.splice(0, 2)
        return lines.join('\n')
    }

    return patchResult
}

/**
 * Represents a snapshot content of a file at a specific point in time
 */
export interface FileSnapshotContent {
    /** URI of the file */
    readonly filePath: string
    /** Content of the file */
    readonly content: string
    /** Timestamp when the snapshot was taken */
    readonly timestamp: number
}

/**
 * Generates supplemental contexts from snapshot contents and current content
 *
 * @param filePath - Path to the file
 * @param currentContent - Current content of the file
 * @param snapshotContents - List of snapshot contents sorted by timestamp (oldest first)
 * @param maxContexts - Maximum number of supplemental contexts to return
 * @returns CodeWhispererSupplementalContext object containing diffs between snapshots and current content
 */
export function generateDiffContexts(
    filePath: string,
    currentContent: string,
    snapshotContents: FileSnapshotContent[],
    maxContexts: number
): CodeWhispererSupplementalContext {
    if (snapshotContents.length === 0) {
        return {
            isUtg: false,
            isProcessTimeout: false,
            supplementalContextItems: [],
            contentsLength: 0,
            latency: 0,
            strategy: 'recentEdits',
        }
    }

    const startTime = Date.now()
    const supplementalContextItems: CodeWhispererSupplementalContextItem[] = []
    const currentTimestamp = Date.now()

    // Process snapshots from newest to oldest
    for (let i = snapshotContents.length - 1; i >= 0; i--) {
        const snapshot = snapshotContents[i]
        try {
            const unifiedDiff = generateUnifiedDiffWithTimestamps(
                snapshot.filePath,
                filePath,
                snapshot.content,
                currentContent,
                snapshot.timestamp,
                currentTimestamp
            )

            // Only add non-empty diffs
            if (unifiedDiff.trim().length > 0) {
                supplementalContextItems.push({
                    filePath: snapshot.filePath,
                    content: unifiedDiff,
                    score: 1.0, // Default score for recent edits
                })
            }
        } catch (err) {
            // TODO: logging
            // console.error(`Failed to generate diff: ${err}`)
        }
    }

    const trimmedContextItems = trimSupplementalContexts(supplementalContextItems, maxContexts)
    const contentsLength = trimmedContextItems.reduce((sum, ctx) => sum + ctx.content.length, 0)
    const latency = Date.now() - startTime

    return {
        isUtg: false,
        isProcessTimeout: false,
        supplementalContextItems: trimmedContextItems,
        contentsLength,
        latency,
        strategy: 'recentEdits',
    }
}

/** src: https://github.com/aws/aws-toolkit-vscode/blob/3921457b0a2094b831beea0d66cc2cbd2a833890/packages/amazonq/src/app/inline/EditRendering/diffUtils.ts#L18
 * Apply a unified diff to original code to generate modified code
 * @param originalCode The original code as a string
 * @param unifiedDiff The unified diff content
 * @returns The modified code after applying the diff
 */
export function applyUnifiedDiff(docText: string, unifiedDiff: string): string {
    try {
        // First try the standard diff package
        try {
            const result = diff.applyPatch(docText, unifiedDiff)
            if (result !== false) {
                return result
            }
        } catch (error) {}

        // Parse the unified diff to extract the changes
        const diffLines = unifiedDiff.split('\n')
        let result = docText

        // Find all hunks in the diff
        const hunkStarts = diffLines
            .map((line, index) => (line.startsWith('@@ ') ? index : -1))
            .filter(index => index !== -1)

        // Process each hunk
        for (const hunkStart of hunkStarts) {
            // Parse the hunk header
            const hunkHeader = diffLines[hunkStart]
            const match = hunkHeader.match(/@@ -(\d+),(\d+) \+(\d+),(\d+) @@/)

            if (!match) {
                continue
            }

            const oldStart = parseInt(match[1])
            const oldLines = parseInt(match[2])

            // Extract the content lines for this hunk
            let i = hunkStart + 1
            const contentLines = []
            while (i < diffLines.length && !diffLines[i].startsWith('@@')) {
                contentLines.push(diffLines[i])
                i++
            }

            // Build the old and new text
            let oldText = ''
            let newText = ''

            for (const line of contentLines) {
                if (line.startsWith('-')) {
                    oldText += line.substring(1) + '\n'
                } else if (line.startsWith('+')) {
                    newText += line.substring(1) + '\n'
                } else if (line.startsWith(' ')) {
                    oldText += line.substring(1) + '\n'
                    newText += line.substring(1) + '\n'
                }
            }

            // Remove trailing newline if it was added
            oldText = oldText.replace(/\n$/, '')
            newText = newText.replace(/\n$/, '')

            // Find the text to replace in the document
            const docLines = docText.split('\n')
            const startLine = oldStart - 1 // Convert to 0-based
            const endLine = startLine + oldLines

            // Extract the text that should be replaced
            const textToReplace = docLines.slice(startLine, endLine).join('\n')

            // Replace the text
            result = result.replace(textToReplace, newText)
        }
        return result
    } catch (error) {
        return docText // Return original text if all methods fail
    }
}

export function getAddedAndDeletedLines(unifiedDiff: string): { addedLines: string[]; deletedLines: string[] } {
    const lines = unifiedDiff.split('\n')
    const addedLines = lines.filter(line => line.startsWith('+') && !line.startsWith('+++')).map(line => line.slice(1))
    const deletedLines = lines
        .filter(line => line.startsWith('-') && !line.startsWith('---'))
        .map(line => line.slice(1))
    return {
        addedLines,
        deletedLines,
    }
}

// src https://github.com/aws/aws-toolkit-vscode/blob/3921457b0a2094b831beea0d66cc2cbd2a833890/packages/amazonq/src/app/inline/EditRendering/diffUtils.ts#L147
export function getAddedAndDeletedChars(unifiedDiff: string): {
    addedCharacters: string
    deletedCharacters: string
} {
    let addedCharacters = ''
    let deletedCharacters = ''
    const lines = unifiedDiff.split('\n')
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        if (line.startsWith('+') && !line.startsWith('+++')) {
            addedCharacters += line.slice(1)
        } else if (line.startsWith('-') && !line.startsWith('---')) {
            const removedLine = line.slice(1)

            // Check if this is a modified line rather than a pure deletion
            const nextLine = lines[i + 1]
            if (nextLine && nextLine.startsWith('+') && !nextLine.startsWith('+++')) {
                // This is a modified line, not a pure deletion
                // We've already counted the deletion, so we'll just increment i to skip the next line
                // since we'll process the addition on the next iteration
                const addedLine = nextLine.slice(1)
                const changes = diff.diffChars(removedLine, addedLine)
                for (const part of changes) {
                    if (part.removed) {
                        deletedCharacters += part.value
                    } else if (part.added) {
                        addedCharacters += part.value
                    }
                }
                i += 1
            } else {
                deletedCharacters += removedLine
            }
        }
    }
    return {
        addedCharacters,
        deletedCharacters,
    }
}

/**
 * Calculate character differences between added and deleted text blocks using LCS
 */
export interface CharDiffResult {
    charactersAdded: number
    charactersRemoved: number
}

/**
 * Find longest common subsequence length between two strings
 */
function lcsLength(str1: string, str2: string): number[][] {
    const m = str1.length
    const n = str2.length
    const dp = Array(m + 1)
        .fill(null)
        .map(() => Array(n + 1).fill(0))

    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (str1[i - 1] === str2[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1] + 1
            } else {
                dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
            }
        }
    }

    return dp
}

/**
 * Calculate character differences between added and deleted blocks
 */
export function getCharacterDifferences(addedLines: string[], deletedLines: string[]): CharDiffResult {
    const addedText = addedLines.join('\n')
    const deletedText = deletedLines.join('\n')

    if (addedText.length === 0) {
        return { charactersAdded: 0, charactersRemoved: deletedText.length }
    }

    if (deletedText.length === 0) {
        return { charactersAdded: addedText.length, charactersRemoved: 0 }
    }

    const lcsTable = lcsLength(deletedText, addedText)
    const lcsLen = lcsTable[deletedText.length][addedText.length]

    return {
        charactersAdded: addedText.length - lcsLen,
        charactersRemoved: deletedText.length - lcsLen,
    }
}

export function processEditSuggestion(
    unifiedDiff: string,
    triggerPosition: Position,
    document: TextDocument
): { suggestionContent: string; type: SuggestionType } {
    const diffCategory = categorizeUnifieddiff(unifiedDiff)
    if (diffCategory === 'addOnly') {
        const udiff = readUdiff(unifiedDiff)
        const preprocessAdd = extractAdditions(unifiedDiff)
        const leftContextAtTriggerLine = document.getText(
            Range.create(Position.create(triggerPosition.line, 0), triggerPosition)
        )
        /**
         * SHOULD NOT remove the entire overlapping string, the way inline suggestion prefix matching work depends on where it triggers
         * For example (^ note where user triggers)
         * console.lo
         *        ^
         * if LSP returns `g('foo')` instead of `.log()` the suggestion will be discarded because prefix doesnt match
         */
        const processedAdd = removeOverlapCodeFromSuggestion(leftContextAtTriggerLine, preprocessAdd)
        return {
            suggestionContent: processedAdd,
            type: SuggestionType.COMPLETION,
        }
    } else {
        return {
            suggestionContent: unifiedDiff,
            type: SuggestionType.EDIT,
        }
    }
}

// TODO: MAKE it a class and abstract all the business parsing logic within the classsssss so we dont need to redo the same thing again and again
interface UnifiedDiff {
    linesWithoutHeaders: string[]
    firstMinusIndex: number
    firstPlusIndex: number
}

export function readUdiff(unifiedDiff: string): UnifiedDiff {
    const lines = unifiedDiff.split('\n')
    const headerEndIndex = lines.findIndex(l => l.startsWith('@@'))
    if (headerEndIndex === -1) {
        throw new Error('not able to parse')
    }
    const relevantLines = lines.slice(headerEndIndex + 1)
    if (relevantLines.length === 0) {
        throw new Error('not able to parse')
    }
    const firstMinusIndex = relevantLines.findIndex(s => s.startsWith('-'))
    const firstPlusIndex = relevantLines.findIndex(s => s.startsWith('+'))

    return {
        linesWithoutHeaders: relevantLines,
        firstMinusIndex: firstMinusIndex,
        firstPlusIndex: firstPlusIndex,
    }
}

export function categorizeUnifieddiff(unifiedDiff: string): 'addOnly' | 'deleteOnly' | 'edit' {
    try {
        const d = readUdiff(unifiedDiff)
        const firstMinusIndex = d.firstMinusIndex
        const firstPlusIndex = d.firstPlusIndex
        const relevantLines = d.linesWithoutHeaders

        if (firstMinusIndex === -1 && firstPlusIndex === -1) {
            return 'edit'
        }

        if (firstMinusIndex === -1 && firstPlusIndex !== -1) {
            return 'addOnly'
        }

        if (firstMinusIndex !== -1 && firstPlusIndex === -1) {
            return 'deleteOnly'
        }

        // Usually it's an edit but there is a special case where empty line is deleted and replaced with suggestion.
        /**
         *
         *
         *  --- file:///Volumes/workplace/ide/sample_projects/Calculator-2/src/main/hello/MathUtil.java
         *  +++ file:///Volumes/workplace/ide/sample_projects/Calculator-2/src/main/hello/MathUtil.java
         *  @@ -3,7 +3,9 @@
         *      public static int add(int a, int b) {
         *          return a + b;
         *      }
         *
         *      // write a function to subtract 2 numbers
         * -
         * +    public static int subtract(int a, int b) {
         * +        return a - b;
         * +    }
         *  }
         *
         *
         **/
        // TODO: should refine the logic here more, possibly find the first non-empty minus/plus if possible
        if (firstMinusIndex + 1 === firstPlusIndex) {
            const minus = relevantLines[firstMinusIndex].substring(1)
            const plus = relevantLines[firstPlusIndex].substring(1)
            const overlap = getPrefixSuffixOverlap(minus, plus)
            if (overlap.length || (minus.trim().length === 0 && plus.trim().length === 0)) {
                return 'addOnly'
            }
        }

        return 'edit'
    } catch (e) {
        return 'edit'
    }
}

// TODO: current implementation here assumes service only return 1 chunk of edits (consecutive lines) and hacky
export function extractAdditions(unifiedDiff: string): string {
    const lines = unifiedDiff.split('\n')
    let completionSuggestion = ''
    let isInAdditionBlock = false

    for (const line of lines) {
        // Skip diff headers (files)
        if (line.startsWith('+++') || line.startsWith('---')) {
            continue
        }

        // Skip hunk headers (@@ lines)
        if (line.startsWith('@@')) {
            continue
        }

        // Handle additions
        if (line.startsWith('+')) {
            completionSuggestion += line.substring(1) + '\n'
            isInAdditionBlock = true
        } else if (isInAdditionBlock && line.startsWith(' ')) {
            // End of addition block
            isInAdditionBlock = false
        }
    }

    // Remove trailing newline
    return completionSuggestion.trimEnd()
}

/**
 *
 * example
 * code = 'return'
 * suggestion = 'return a + b;'
 * output = ' a + b;'
 */
export function removeOverlapCodeFromSuggestion(code: string, suggestion: string): string {
    const suggestionLines = suggestion.split('\n')
    const firstLineSuggestion = suggestionLines[0]

    // Find the common string in code surfix and prefix of suggestion
    const s = getPrefixSuffixOverlap(code, firstLineSuggestion)

    // Remove overlap s from suggestion
    return suggestion.substring(s.length)
}
