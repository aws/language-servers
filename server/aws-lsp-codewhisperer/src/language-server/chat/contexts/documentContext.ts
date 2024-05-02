import { EditorState } from '@amzn/codewhisperer-streaming'
import { Range, TextDocument } from 'vscode-languageserver-textdocument'
import { DocumentSymbols } from './documentSymbols'
import {
    CursorState,
    extractLanguageNameFromFile,
    getExtendedCodeBlockRange,
    getSelectionWithinExtendedRange,
} from './utils'

const DEFAULT_CHARACTER_LIMIT = 9000

/**
 * From the given the cursor state, we want to give Q context up to the characters limit
 * on both sides of the cursor.
 */
export async function extractEditorState(
    document: TextDocument,
    cursorState: CursorState,
    charactersLimit = DEFAULT_CHARACTER_LIMIT
): Promise<EditorState> {
    const targetRange: Range =
        'position' in cursorState
            ? {
                  start: cursorState.position,
                  end: cursorState.position,
              }
            : cursorState.range

    const codeBlockRange = getExtendedCodeBlockRange(document, targetRange, charactersLimit)
    const rangeWithinCodeBlock = getSelectionWithinExtendedRange(targetRange, codeBlockRange)

    return {
        document: await extractDocumentContext(document, codeBlockRange),
        cursorState: rangeWithinCodeBlock ? { range: rangeWithinCodeBlock } : undefined,
    }
}

/**
 * Extract document context from the given range inside a document
 */
export async function extractDocumentContext(
    document: TextDocument,
    codeBlockRange: Range
): Promise<EditorState['document']> {
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
