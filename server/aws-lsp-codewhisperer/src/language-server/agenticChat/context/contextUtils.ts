import { getUserHomeDir } from '@aws/lsp-core/out/util/path'
import * as path from 'path'

export const promptFileExtension = '.md'
export const additionalContentInnerContextLimit = 8192
export const additionalContentNameLimit = 1024

export const getUserPromptsDirectory = (): string => {
    return path.join(getUserHomeDir(), '.aws', 'amazonq', 'prompts')
}

export const getNewPromptFilePath = (promptName: string): string => {
    const userPromptsDirectory = getUserPromptsDirectory()
    return path.join(
        userPromptsDirectory,
        promptName ? `${promptName}${promptFileExtension}` : `default${promptFileExtension}`
    )
}
