import { Range, TextDocument } from 'vscode-languageserver-textdocument'

export const getFullRange = (textDocument: TextDocument): Range => {
    return {
        start: {
            line: 0,
            character: 0,
        },
        end: {
            line: textDocument.lineCount,
            character: 0,
        },
    }
}
