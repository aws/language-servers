import { getUserHomeDir } from '@aws/lsp-core/out/util/path'
import * as path from 'path'

export interface ContextInfo {
    contextCount: {
        fileContextCount: number
        folderContextCount: number
        promptContextCount: number
        ruleContextCount: number
    }
    contextLength: {
        fileContextLength: number
        ruleContextLength: number
        promptContextLength: number
    }
}

export const initialContextInfo: ContextInfo = {
    contextCount: {
        fileContextCount: 0,
        folderContextCount: 0,
        promptContextCount: 0,
        ruleContextCount: 0,
    },
    contextLength: {
        fileContextLength: 0,
        ruleContextLength: 0,
        promptContextLength: 0,
    },
}

export const promptFileExtension = '.prompt.md'
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
