import { EditorState } from '@amzn/codewhisperer-streaming'
import { CursorState } from '@aws/language-server-runtimes/server-interface'
import { Range, TextDocument } from 'vscode-languageserver-textdocument'
import { getLanguageId } from '../../languageDetection'
import { Features } from '../../types'
import { DocumentFqnExtractor, DocumentFqnExtractorConfig } from './documentFqnExtractor'
import { getExtendedCodeBlockRange, getSelectionWithinExtendedRange } from './utils'

export interface DocumentContextExtractorConfig extends DocumentFqnExtractorConfig {
    config?: DocumentFqnExtractorConfig
    logger?: Features['logging']
    characterLimits?: number
}

export class DocumentContextExtractor {
    private static readonly DEFAULT_CHARACTER_LIMIT = 9000

    #characterLimits: number
    #documentSymbolExtractor: DocumentFqnExtractor

    constructor(config?: DocumentContextExtractorConfig) {
        const { characterLimits, ...fqnConfig } = config ?? {}

        this.#characterLimits = characterLimits ?? DocumentContextExtractor.DEFAULT_CHARACTER_LIMIT
        this.#documentSymbolExtractor = new DocumentFqnExtractor(fqnConfig)
    }

    public dispose() {
        this.#documentSymbolExtractor.dispose()
    }

    /**
     * From the given the cursor state, we want to give Q context up to the characters limit
     * on both sides of the cursor.
     */
    public async extractEditorState(document: TextDocument, cursorState: CursorState): Promise<EditorState> {
        const targetRange: Range =
            'position' in cursorState
                ? {
                      start: cursorState.position,
                      end: cursorState.position,
                  }
                : cursorState.range

        const codeBlockRange = getExtendedCodeBlockRange(document, targetRange, this.#characterLimits)

        const rangeWithinCodeBlock = getSelectionWithinExtendedRange(targetRange, codeBlockRange)

        return {
            document: await this.extractDocumentContext(document, codeBlockRange),
            cursorState: rangeWithinCodeBlock ? { range: rangeWithinCodeBlock } : undefined,
        }
    }

    /**
     * Extract document context from the given range inside a document
     */
    public async extractDocumentContext(
        document: TextDocument,
        codeBlockRange: Range
    ): Promise<EditorState['document']> {
        const text = document.getText(codeBlockRange)
        const languageId = getLanguageId(document)
        const relativeFilePath = document.uri

        return {
            text,
            programmingLanguage: languageId ? { languageName: languageId } : undefined,
            relativeFilePath,
            documentSymbols: await this.#documentSymbolExtractor.extractDocumentSymbols(
                document,
                codeBlockRange,
                languageId
            ),
        }
    }
}
