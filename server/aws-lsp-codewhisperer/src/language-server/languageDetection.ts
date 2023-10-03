import { TextDocument } from 'vscode-languageserver-textdocument'

// This will be extended as more language features
// are integrated into the language server and clients.
const supportedFileTypes = ['csharp', 'javascript', 'python', 'typescript']
const supportedExtensions: { [key: string]: string } = {
    '.cs': 'csharp',
    '.js': 'javascript',
    '.py': 'python',
    '.ts': 'typescript',
}

export const getSupportedLanguageId = (textDocument: TextDocument | undefined): string | undefined => {
    if (!textDocument) {
        return
    }

    const langaugeId = getCodeWhispererLanguageIdByTextDocumentLanguageId(textDocument.languageId)
    if (langaugeId !== undefined) {
        return langaugeId
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
function getCodeWhispererLanguageIdByTextDocumentLanguageId(textDocumentLanguageId: string): string | undefined {
    if (textDocumentLanguageId === undefined) {
        return undefined
    }

    if (supportedFileTypes.includes(textDocumentLanguageId)) {
        return textDocumentLanguageId
    }

    // IDEs can identify a file's languageId using non-standardized values
    // Eg: 'CSHARP', 'CSharp' => 'csharp'
    // Try to map case-insensitive matches to increase the likelihood of supporting the file in an IDE.
    for (const supportedFileType of supportedFileTypes) {
        if (textDocumentLanguageId.toLowerCase() === supportedFileType.toLowerCase()) {
            return supportedFileType
        }
    }

    return undefined
}
