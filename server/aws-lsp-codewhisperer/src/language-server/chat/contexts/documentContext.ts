import { EditorState, TextDocument as CwsprTextDocument, DocumentSymbol } from '@amzn/codewhisperer-streaming'
import { CursorState } from '@aws/language-server-runtimes/server-interface'
import { Range, TextDocument } from 'vscode-languageserver-textdocument'
import { getLanguageId } from '../../languageDetection'
import { Features } from '../../types'
import { DocumentFqnExtractor, DocumentFqnExtractorConfig } from './documentFqnExtractor'
import { getExtendedCodeBlockRange, getSelectionWithinExtendedRange } from './utils'

export type DocumentContext = CwsprTextDocument & {
    cursorState?: EditorState['cursorState']
    hasCodeSnippet: boolean
    totalEditorCharacters: number
}

export interface DocumentContextExtractorConfig extends DocumentFqnExtractorConfig {
    config?: DocumentFqnExtractorConfig
    logger?: Features['logging']
    characterLimits?: number
}

export class DocumentContextExtractor {
    private static readonly DEFAULT_CHARACTER_LIMIT = 9000

    #characterLimits: number
    #logger?: Features['logging']
    #documentSymbolExtractor: DocumentFqnExtractor

    constructor(config?: DocumentContextExtractorConfig) {
        const { characterLimits, ...fqnConfig } = config ?? {}

        this.#logger = config?.logger
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

        let documentSymbols: DocumentSymbol[] = []

        try {
            // best effort to extract symbols
            documentSymbols = await this.#documentSymbolExtractor.extractDocumentSymbols(
                document,
                codeBlockRange,
                languageId
            )
        } catch (e) {
            this.#logger?.log(
                `Error extracting document symbols but continuing on. ${e instanceof Error ? e.message : 'Unknown error'}`
            )
        }

        return {
            cursorState: rangeWithinCodeBlock ? { range: rangeWithinCodeBlock } : undefined,
            text: document.getText(codeBlockRange),
            programmingLanguage: languageId ? { languageName: languageId } : undefined,
            relativeFilePath: document.uri,
            documentSymbols,
            hasCodeSnippet: Boolean(rangeWithinCodeBlock),
            totalEditorCharacters: document.getText().length,
        }
    }
}
