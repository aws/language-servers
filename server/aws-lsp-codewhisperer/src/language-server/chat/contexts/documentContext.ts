import { TextDocument as QTextDocument } from '@amzn/codewhisperer-streaming'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { DocumentSymbols } from './documentSymbols'
import { extractLanguageNameFromFile } from './languages'
import { CursorState, getExtendedCodeBlockRange } from './utils'

const DEFAULT_CHARACTER_LIMIT = 9000

export async function extractDocumentContext(
    document: TextDocument,
    cursorState: CursorState,
    characterLimit = DEFAULT_CHARACTER_LIMIT
): Promise<QTextDocument> {
    const codeBlockRange = getExtendedCodeBlockRange(document, cursorState, characterLimit)
    const text = document.getText(codeBlockRange)
    const programmingLanguage = extractLanguageNameFromFile(document)
    const relativeFilePath = document.uri

    const documentSymbols = await DocumentSymbols.getDocumentSymbols(document, codeBlockRange)

    return {
        text,
        programmingLanguage,
        relativeFilePath,
        documentSymbols,
    }
}
