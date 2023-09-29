import { TextDocument } from 'vscode-languageserver-textdocument'

// One language supported as of today, but this will be extended as more language features
// are integrated into the language server and clients.
const supportedFileTypes = ['csharp']
const supportedExtensions: { [key: string]: string } = {
    '.cs': 'csharp'
}

export const getSupportedLanguageId = (textDocument: TextDocument | undefined): string | undefined => {
    if (!textDocument) {
        return
    }

    if (textDocument.languageId && supportedFileTypes.includes(textDocument.languageId)) {
        return textDocument.languageId
    }

    for (const extension in supportedExtensions) {
        if (textDocument.uri.endsWith(extension)) {
            return supportedExtensions[extension]
        }
    }
}