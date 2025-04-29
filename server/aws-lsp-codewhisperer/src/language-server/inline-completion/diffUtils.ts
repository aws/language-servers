/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import * as diff from 'diff'
import { CodeWhispererSupplementalContext, CodeWhispererSupplementalContextItem } from '../../shared/models/model'

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
