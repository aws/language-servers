/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import * as diff from 'diff'
import { CodeWhispererSupplementalContext, CodeWhispererSupplementalContextItem } from '../../shared/models/model'
import { Position } from 'vscode-languageserver-textdocument'

const supplementalContextMaxTotalLength: number = 8192
const charactersLimit: number = 10000

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
            console.error(`Failed to generate diff: ${err}`)
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

/**
 * Trims the supplementalContexts array to ensure it doesn't exceed the max number
 * of contexts or total character length limit
 *
 * @param supplementalContextItems - Array of CodeWhispererSupplementalContextItem objects (already sorted with newest first)
 * @param maxContexts - Maximum number of supplemental contexts allowed
 * @returns Trimmed array of CodeWhispererSupplementalContextItem objects
 */
function trimSupplementalContexts(
    supplementalContextItems: CodeWhispererSupplementalContextItem[],
    maxContexts: number
): CodeWhispererSupplementalContextItem[] {
    if (supplementalContextItems.length === 0) {
        return supplementalContextItems
    }

    // First filter out any individual context that exceeds the character limit
    let result = supplementalContextItems.filter(context => {
        return context.content.length <= charactersLimit
    })

    // Then limit by max number of contexts
    if (result.length > maxContexts) {
        result = result.slice(0, maxContexts)
    }

    // Lastly enforce total character limit
    let totalLength = 0
    let i = 0

    while (i < result.length) {
        totalLength += result[i].content.length
        if (totalLength > supplementalContextMaxTotalLength) {
            break
        }
        i++
    }

    if (i === result.length) {
        return result
    }

    const trimmedContexts = result.slice(0, i)
    return trimmedContexts
}

/** src: https://github.com/aws/aws-toolkit-vscode/blob/3921457b0a2094b831beea0d66cc2cbd2a833890/packages/amazonq/src/app/inline/EditRendering/diffUtils.ts#L18
 * Apply a unified diff to original code to generate modified code
 * @param originalCode The original code as a string
 * @param unifiedDiff The unified diff content
 * @returns The modified code after applying the diff
 */
export function applyUnifiedDiff(
    docText: string,
    unifiedDiff: string
): { newCode: string; addedCharacterCount: number; deletedCharacterCount: number } {
    try {
        const { addedCharacterCount, deletedCharacterCount } = getAddedAndDeletedCharCount(unifiedDiff)
        // First try the standard diff package
        try {
            const result = diff.applyPatch(docText, unifiedDiff)
            if (result !== false) {
                return {
                    newCode: result,
                    addedCharacterCount: addedCharacterCount,
                    deletedCharacterCount: deletedCharacterCount,
                }
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
        return {
            newCode: result,
            addedCharacterCount: addedCharacterCount,
            deletedCharacterCount: deletedCharacterCount,
        }
    } catch (error) {
        return {
            newCode: docText, // Return original text if all methods fail
            addedCharacterCount: 0,
            deletedCharacterCount: 0,
        }
    }
}

// src https://github.com/aws/aws-toolkit-vscode/blob/3921457b0a2094b831beea0d66cc2cbd2a833890/packages/amazonq/src/app/inline/EditRendering/diffUtils.ts#L147
export function getAddedAndDeletedCharCount(diff: string): {
    addedCharacterCount: number
    deletedCharacterCount: number
} {
    let addedCharacterCount = 0
    let deletedCharacterCount = 0
    let i = 0
    const lines = diff.split('\n')
    while (i < lines.length) {
        const line = lines[i]
        if (line.startsWith('+') && !line.startsWith('+++')) {
            addedCharacterCount += line.length - 1
        } else if (line.startsWith('-') && !line.startsWith('---')) {
            const removedLine = line.substring(1)
            deletedCharacterCount += removedLine.length

            // Check if this is a modified line rather than a pure deletion
            const nextLine = lines[i + 1]
            if (nextLine && nextLine.startsWith('+') && !nextLine.startsWith('+++') && nextLine.includes(removedLine)) {
                // This is a modified line, not a pure deletion
                // We've already counted the deletion, so we'll just increment i to skip the next line
                // since we'll process the addition on the next iteration
                i += 1
            }
        }
        i += 1
    }
    return {
        addedCharacterCount,
        deletedCharacterCount,
    }
}

/**
 * Calculates the end position of the actual edited content by finding the last changed part
 */
export function getEndOfEditPosition(originalCode: string, newCode: string): Position {
    const changes = diff.diffLines(originalCode, newCode)
    let lineOffset = 0

    // Track the end position of the last added chunk
    let lastChangeEndLine = 0
    let lastChangeEndColumn = 0
    let foundAddedContent = false

    for (const part of changes) {
        if (part.added) {
            foundAddedContent = true

            // Calculate lines in this added part
            const lines = part.value.split('\n')
            const linesCount = lines.length

            // Update position to the end of this added chunk
            lastChangeEndLine = lineOffset + linesCount - 1

            // Get the length of the last line in this added chunk
            lastChangeEndColumn = lines[linesCount - 1].length
        }

        // Update line offset (skip removed parts)
        if (!part.removed) {
            // Safely calculate line count from the part's value
            const partLineCount = part.value.split('\n').length
            lineOffset += partLineCount - 1
        }
    }

    // If we found added content, return position at the end of the last addition
    if (foundAddedContent) {
        return {
            line: lastChangeEndLine,
            character: lastChangeEndColumn, // ?????????????????? is this correct?????????????
        }
        // return new vscode.Position(lastChangeEndLine, lastChangeEndColumn)
    }

    // Fallback to current cursor position if no changes were found
    // const editor = vscode.window.activeTextEditor
    // return editor ? editor.selection.active : new Position(0, 0)
    return {
        line: 0,
        character: 0,
    }
}
