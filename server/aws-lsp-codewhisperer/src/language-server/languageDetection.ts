import { TextDocument } from '@aws/language-server-runtimes/server-interface'

export type CodewhispererLanguage =
    | 'c'
    | 'cpp'
    | 'csharp'
    | 'go'
    | 'java'
    | 'javascript'
    | 'jsx'
    | 'kotlin'
    | 'php'
    | 'plaintext'
    | 'python'
    | 'ruby'
    | 'rust'
    | 'scala'
    | 'shell'
    | 'sql'
    | 'tsx'
    | 'typescript'

    // These work as well
    | 'json'
    | 'tf'
    | 'vue'
    | 'yaml'

// This will be extended as more language features
// are integrated into the language server and clients.
// See: https://microsoft.github.io/language-server-protocol/specifications/lsp/3.18/specification/#textDocumentItem
const supportedFileTypes: CodewhispererLanguage[] = ['c', 'cpp', 'csharp', 'javascript', 'jsx', 'python', 'typescript']

export const supportedSecurityScanLanguages: CodewhispererLanguage[] = ['csharp']

export const languageByExtension: { [key: string]: CodewhispererLanguage } = {
    '.c': 'c',
    '.cpp': 'cpp',
    '.cs': 'csharp',
    '.h': 'c',
    '.hpp': 'cpp',
    '.go': 'go',
    '.kt': 'kotlin',
    '.kts': 'kotlin',
    '.java': 'java',
    '.js': 'javascript',
    '.json': 'json',
    '.jsx': 'jsx',
    '.php': 'php',
    '.py': 'python',
    '.rb': 'ruby',
    '.rs': 'rust',
    '.sc': 'scala',
    '.scala': 'scala',
    '.sh': 'shell',
    '.sql': 'sql',
    '.tf': 'tf',
    '.ts': 'typescript',
    '.tsx': 'tsx',
    '.vue': 'vue',
    '.yaml': 'yaml',
    '.yml': 'yaml',
}

export const additionalLanguageMapping: { [key: string]: CodewhispererLanguage } = {
    shellscript: 'shell',
    javascriptreact: 'jsx',
    typescriptreact: 'tsx',
}

export const getSupportedLanguageId = (
    textDocument: TextDocument | undefined,
    supportedLanguageIds: CodewhispererLanguage[] = supportedFileTypes
): CodewhispererLanguage | undefined => {
    if (!textDocument) {
        return
    }

    const languageId = getLanguageId(textDocument)

    return languageId && supportedLanguageIds.includes(languageId) ? languageId : undefined
}

export const getLanguageId = (textDocument: TextDocument | undefined): CodewhispererLanguage | undefined => {
    if (!textDocument) {
        return undefined
    }

    return (
        additionalLanguageMapping[textDocument.languageId] ||
        getCodeWhispererLanguageIdByTextDocumentLanguageId(textDocument.languageId) ||
        getCodeWhispererLanguageIdByExtension(textDocument)
    )
}

/**
 * Used to map different IDE values for TextDocument languageIds to CodeWhisperer languageIds.
 * Examples of the CodeWhisperer defined language ids can be found in service-2.json, near "ProgrammingLanguageLanguageNameString"
 * @param textDocumentLanguageId Value of the TextDocument's language id, provided by the IDE
 * @returns Corresponding CodeWhisperer language id
 */
function getCodeWhispererLanguageIdByTextDocumentLanguageId(
    textDocumentLanguageId: CodewhispererLanguage | string
): CodewhispererLanguage | undefined {
    if (textDocumentLanguageId === undefined) {
        return undefined
    }

    if (supportedFileTypes.includes(textDocumentLanguageId as CodewhispererLanguage)) {
        return textDocumentLanguageId as CodewhispererLanguage
    }

    // IDEs can identify a file's languageId using non-standardized values
    // Eg: 'CSHARP', 'CSharp' => 'csharp'
    // Try to map case-insensitive matches to increase the likelihood of supporting the file in an IDE.
    for (const supportedFileType of supportedFileTypes) {
        if (textDocumentLanguageId.toLowerCase() === supportedFileType.toLowerCase()) {
            return supportedFileType as CodewhispererLanguage
        }
    }

    return undefined
}

function getCodeWhispererLanguageIdByExtension(textDocument: TextDocument) {
    for (const [extension, languageId] of Object.entries(languageByExtension)) {
        if (textDocument.uri.endsWith(extension)) {
            return languageId
        }
    }

    return undefined
}
