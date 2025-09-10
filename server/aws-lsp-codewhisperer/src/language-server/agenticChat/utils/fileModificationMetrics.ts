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
        let linesAdded = 0
        let linesRemoved = 0

        for (const diff of input.diffs || []) {
            const oldStr = diff.oldStr ?? ''
            const newStr = diff.newStr ?? ''

            const changes = diffLines(oldStr, newStr)

            for (const change of changes) {
                if (change.added) {
                    linesAdded += countLines(change.value)
                } else if (change.removed) {
                    linesRemoved += countLines(change.value)
                }
            }
        }

        return linesAdded + linesRemoved
    }
    return 0
}
