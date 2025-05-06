import { getUserHomeDir } from '@aws/lsp-core/out/util/path'
import * as path from 'path'
import { sanitizeFilename } from '@aws/lsp-core/out/util/text'
import { RelevantTextDocumentAddition } from './agenticChatTriggerContext'
import { FileDetails, FileList } from '@aws/language-server-runtimes/server-interface'
export interface ContextInfo {
    contextCount: {
        fileContextCount: number
        folderContextCount: number
        promptContextCount: number
        ruleContextCount: number
        codeContextCount: number
    }
    contextLength: {
        fileContextLength: number
        ruleContextLength: number
        promptContextLength: number
        codeContextLength: number
    }
}

export const initialContextInfo: ContextInfo = {
    contextCount: {
        fileContextCount: 0,
        folderContextCount: 0,
        promptContextCount: 0,
        ruleContextCount: 0,
        codeContextCount: 0,
    },
    contextLength: {
        fileContextLength: 0,
        ruleContextLength: 0,
        promptContextLength: 0,
        codeContextLength: 0,
    },
}

export const promptFileExtension = '.md'
export const additionalContentInnerContextLimit = 8192
export const additionalContentNameLimit = 1024

export const getUserPromptsDirectory = (): string => {
    return path.join(getUserHomeDir(), '.aws', 'amazonq', 'prompts')
}

/**
 * Creates a secure file path for a new prompt file.
 *
 * @param promptName - The user-provided name for the prompt
 * @returns A sanitized file path within the user prompts directory
 */
export const getNewPromptFilePath = (promptName: string): string => {
    const userPromptsDirectory = getUserPromptsDirectory()

    const trimmedName = promptName?.trim() || ''

    const truncatedName = trimmedName.slice(0, 100)

    const safePromptName = truncatedName ? sanitizeFilename(path.basename(truncatedName)) : 'default'

    const finalPath = path.join(userPromptsDirectory, `${safePromptName}${promptFileExtension}`)

    return finalPath
}

/**
 * Merges a RelevantTextDocumentAddition array into a FileList, which is used to display list of context files.
 * This function combines document fragments from the same file, merging overlapping
 * or consecutive line ranges to create a more compact representation.
 *
 * @param documents - Array of RelevantTextDocumentAddition objects containing file paths and line ranges
 * @returns A FileList object with merged file paths and consolidated line ranges
 *
 * Ported from https://github.com/aws/aws-toolkit-vscode/blob/master/packages/core/src/codewhispererChat/controllers/chat/controller.ts#L1239
 */
export function mergeRelevantTextDocuments(documents: RelevantTextDocumentAddition[]): FileList {
    if (documents.length === 0) {
        return { filePaths: [], details: {} }
    }

    const details: Record<string, FileDetails> = {}

    Object.entries(
        documents.reduce<Record<string, { first: number; second: number }[]>>((acc, doc) => {
            if (!doc.relativeFilePath || doc.startLine === undefined || doc.endLine === undefined) {
                return acc // Skip invalid documents
            }

            if (!acc[doc.relativeFilePath]) {
                acc[doc.relativeFilePath] = []
            }
            acc[doc.relativeFilePath].push({ first: doc.startLine, second: doc.endLine })
            return acc
        }, {})
    ).forEach(([relativeFilePath, ranges]) => {
        // Sort by startLine
        const sortedRanges = ranges.sort((a, b) => a.first - b.first)

        const mergedRanges: { first: number; second: number }[] = []
        for (const { first, second } of sortedRanges) {
            if (mergedRanges.length === 0 || mergedRanges[mergedRanges.length - 1].second < first - 1) {
                // If no overlap, add new range
                mergedRanges.push({ first, second })
            } else {
                // Merge overlapping or consecutive ranges
                mergedRanges[mergedRanges.length - 1].second = Math.max(
                    mergedRanges[mergedRanges.length - 1].second,
                    second
                )
            }
        }

        const fullPath = documents.find(doc => doc.relativeFilePath === relativeFilePath)?.path
        details[relativeFilePath] = {
            fullPath: fullPath,
            description: fullPath,
            lineRanges: mergedRanges,
        }
    })

    return {
        filePaths: Object.keys(details),
        details: details,
    }
}

/**
 * Merges two FileList objects into a single FileList
 * @param fileList1 The first FileList
 * @param fileList2 The second FileList
 * @returns A merged FileList
 */
export function mergeFileLists(fileList1: FileList, fileList2: FileList): FileList {
    // Handle empty lists
    if (!fileList1.filePaths?.length) {
        return fileList2
    }
    if (!fileList2.filePaths?.length) {
        return fileList1
    }

    // Initialize the result
    const mergedFilePaths: string[] = []
    const mergedDetails: Record<string, FileDetails> = {}

    // Process all files from fileList1
    fileList1.filePaths?.forEach(filePath => {
        mergedFilePaths.push(filePath)
        mergedDetails[filePath] = { ...fileList1.details?.[filePath] }
    })

    // Process all files from fileList2
    fileList2.filePaths?.forEach(filePath => {
        // If the file already exists in the merged result, merge the line ranges
        if (mergedDetails[filePath]) {
            const existingRanges = mergedDetails[filePath].lineRanges || []
            const newRanges = fileList2.details?.[filePath].lineRanges || []

            // Combine and sort all ranges
            const combinedRanges = [...existingRanges, ...newRanges].sort((a, b) => a.first - b.first)

            // Merge overlapping ranges
            const mergedRanges: Array<{ first: number; second: number }> = []
            for (const range of combinedRanges) {
                if (mergedRanges.length === 0 || mergedRanges[mergedRanges.length - 1].second < range.first - 1) {
                    // No overlap, add new range
                    mergedRanges.push({ ...range })
                } else {
                    // Merge overlapping or consecutive ranges
                    mergedRanges[mergedRanges.length - 1].second = Math.max(
                        mergedRanges[mergedRanges.length - 1].second,
                        range.second
                    )
                }
            }

            mergedDetails[filePath].lineRanges = mergedRanges
        } else {
            // If the file doesn't exist in the merged result, add it
            mergedFilePaths.push(filePath)
            mergedDetails[filePath] = { ...fileList2.details?.[filePath] }
        }
    })

    return {
        filePaths: mergedFilePaths,
        details: mergedDetails,
    }
}
