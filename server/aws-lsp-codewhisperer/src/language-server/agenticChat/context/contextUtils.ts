import { getUserHomeDir } from '@aws/lsp-core/out/util/path'
import * as path from 'path'
import { sanitizeFilename } from '@aws/lsp-core/out/util/text'

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
