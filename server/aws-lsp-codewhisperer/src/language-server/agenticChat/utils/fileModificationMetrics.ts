import { ToolUse } from '@amzn/codewhisperer-streaming'
import { diffLines } from 'diff'
import { FsWriteParams } from '../tools/fsWrite'
import { FsReplaceParams } from '../tools/fsReplace'
import { FS_WRITE, FS_REPLACE } from '../constants/toolConstants'

/**
 * Counts the number of lines in text, handling different line endings
 * @param text The text to count lines in
 * @returns The number of lines
 */
function countLines(text?: string): number {
    if (!text) return 0
    const parts = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
    return parts.length && parts[parts.length - 1] === '' ? parts.length - 1 : parts.length
}

/**
 * Calculates the actual lines modified by analyzing file modification tools.
 * @param toolUse The tool use object
 * @param afterContent The content after the tool execution (for FS_WRITE create operations)
 * @returns The total number of lines modified (added + removed)
 */
export function calculateModifiedLines(toolUse: ToolUse, afterContent?: string): number {
    if (toolUse.name === FS_WRITE) {
        const input = toolUse.input as unknown as FsWriteParams

        if (input.command === 'create') {
            return countLines(afterContent ?? '')
        } else if (input.command === 'append') {
            return countLines(input.fileText)
        }
    }

    if (toolUse.name === FS_REPLACE) {
        const input = toolUse.input as unknown as FsReplaceParams
        let totalTouchedLines = 0

        for (const diff of input.diffs || []) {
            const oldStr = diff.oldStr ?? ''
            const newStr = diff.newStr ?? ''

            const changes = diffLines(oldStr, newStr)

            for (let i = 0; i < changes.length; i++) {
                const change = changes[i]

                if (change.removed) {
                    const nextChange = changes[i + 1]
                    if (nextChange && nextChange.added) {
                        // Replace: remove followed by add
                        totalTouchedLines += Math.max(countLines(change.value), countLines(nextChange.value))
                        i++ // Skip the next change since we processed it
                    } else {
                        // Pure delete
                        totalTouchedLines += countLines(change.value)
                    }
                } else if (change.added) {
                    // Pure insert (not paired with a preceding remove)
                    totalTouchedLines += countLines(change.value)
                }
                // Ignore equal chunks
            }
        }

        return totalTouchedLines
    }

    return 0
}
