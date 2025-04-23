import { getUserHomeDir } from '@aws/lsp-core/out/util/path'
// eslint-disable-next-line import/no-nodejs-modules
import { join } from 'path' // supported by https://www.npmjs.com/package/path-browserify

export const promptFileExtension = '.md'
export const additionalContentInnerContextLimit = 8192
export const additionalContentNameLimit = 1024

export const getUserPromptsDirectory = (): string => {
    return join(getUserHomeDir(), '.aws', 'amazonq', 'prompts')
}

export const getNewPromptFilePath = (promptName: string): string => {
    const userPromptsDirectory = getUserPromptsDirectory()
    return join(
        userPromptsDirectory,
        promptName ? `${promptName}${promptFileExtension}` : `default${promptFileExtension}`
    )
}
