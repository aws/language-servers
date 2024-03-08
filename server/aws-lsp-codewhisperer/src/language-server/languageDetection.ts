import { TextDocument } from 'vscode-languageserver-textdocument'

export type CodewhispererLanguage =
    | 'java'
    | 'python'
    | 'jsx'
    | 'javascript'
    | 'typescript'
    | 'tsx'
    | 'csharp'
    | 'c'
    | 'cpp'
    | 'cpp'
    | 'go'
    | 'kotlin'
    | 'php'
    | 'ruby'
    | 'rust'
    | 'scala'
    | 'shell'
    | 'shell'
    | 'sql'
    | 'plaintext'

// This will be extended as more language features
// are integrated into the language server and clients.
// See: https://microsoft.github.io/language-server-protocol/specifications/lsp/3.18/specification/#textDocumentItem
const supportedFileTypes: CodewhispererLanguage[] = ['c', 'cpp', 'csharp', 'javascript', 'python', 'typescript']
export const supportedSecurityScanLanguages: CodewhispererLanguage[] = ['csharp']
const supportedExtensions: { [key: string]: CodewhispererLanguage } = {
    '.c': 'c',
    '.h': 'c',
    '.cpp': 'cpp',
    '.hpp': 'cpp',
    '.cs': 'csharp',
    '.js': 'javascript',
    '.py': 'python',
    '.ts': 'typescript',
}

export const getSupportedLanguageId = (textDocument: TextDocument | undefined): CodewhispererLanguage | undefined => {
    if (!textDocument) {
        return
    }

    const languageId = getCodeWhispererLanguageIdByTextDocumentLanguageId(textDocument.languageId)
    if (languageId !== undefined) {
        return languageId
    }

    for (const extension in supportedExtensions) {
        if (textDocument.uri.endsWith(extension)) {
            return supportedExtensions[extension]
        }
    }
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
