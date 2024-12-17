import { EditorState, TextDocument as CwsprTextDocument } from '@amzn/codewhisperer-streaming'
import { CursorState } from '@aws/language-server-runtimes/server-interface'
import { Range, TextDocument } from 'vscode-languageserver-textdocument'
import { getLanguageId } from '../../languageDetection'
import { Features } from '../../types'
import { getExtendedCodeBlockRange, getSelectionWithinExtendedRange } from './utils'

export type DocumentContext = CwsprTextDocument & {
    cursorState?: EditorState['cursorState']
    hasCodeSnippet: boolean
    totalEditorCharacters: number
}

export interface DocumentContextExtractorConfig {
    logger?: Features['logging']
    characterLimits?: number
}

export class DocumentContextExtractor {
    private static readonly DEFAULT_CHARACTER_LIMIT = 40000

    #characterLimits: number
    #logger?: Features['logging']

    constructor(config?: DocumentContextExtractorConfig) {
        this.#logger = config?.logger
        this.#characterLimits = config?.characterLimits ?? DocumentContextExtractor.DEFAULT_CHARACTER_LIMIT
    }

    /**
     * From the given the cursor state, we want to give Q context up to the characters limit
     * on both sides of the cursor.
     */
    public async extractDocumentContext(document: TextDocument, cursorState: CursorState): Promise<DocumentContext> {
        const targetRange: Range =
            'position' in cursorState
                ? {
                      start: cursorState.position,
                      end: cursorState.position,
                  }
                : cursorState.range

        const codeBlockRange = getExtendedCodeBlockRange(document, targetRange, this.#characterLimits)

        const rangeWithinCodeBlock = getSelectionWithinExtendedRange(targetRange, codeBlockRange)

        const languageId = getLanguageId(document)

        return {
            cursorState: rangeWithinCodeBlock ? { range: rangeWithinCodeBlock } : undefined,
            text: document.getText(codeBlockRange),
            programmingLanguage: languageId ? { languageName: languageId } : undefined,
            relativeFilePath: document.uri,
            hasCodeSnippet: Boolean(rangeWithinCodeBlock),
            totalEditorCharacters: document.getText().length,
        }
    }
}
