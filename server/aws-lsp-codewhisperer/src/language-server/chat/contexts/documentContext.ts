import { EditorState, TextDocument as CwsprTextDocument } from '@aws/codewhisperer-streaming-client'
import { CursorState, WorkspaceFolder } from '@aws/language-server-runtimes/server-interface'
import { Range, TextDocument } from 'vscode-languageserver-textdocument'
import { getLanguageId } from '../../../shared/languageDetection'
import { Features } from '../../types'
import { getExtendedCodeBlockRange, getSelectionWithinExtendedRange } from './utils'
import path = require('path')
import { URI } from 'vscode-uri'

export type DocumentContext = CwsprTextDocument & {
    cursorState?: EditorState['cursorState']
    hasCodeSnippet: boolean
    totalEditorCharacters: number
    workspaceFolder?: WorkspaceFolder | null
}

export interface DocumentContextExtractorConfig {
    logger?: Features['logging']
    workspace?: Features['workspace']
    characterLimits?: number
}

export class DocumentContextExtractor {
    private static readonly DEFAULT_CHARACTER_LIMIT = 9000

    #characterLimits: number
    #logger?: Features['logging']
    #workspace?: Features['workspace']

    constructor(config?: DocumentContextExtractorConfig) {
        this.#logger = config?.logger
        this.#workspace = config?.workspace
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

        const workspaceFolder = this.#workspace?.getWorkspaceFolder?.(document.uri)

        const relativePath = this.getRelativePath(document)

        const languageId = getLanguageId(document)

        return {
            cursorState: rangeWithinCodeBlock ? { range: rangeWithinCodeBlock } : undefined,
            text: document.getText(codeBlockRange),
            programmingLanguage: languageId ? { languageName: languageId } : undefined,
            relativeFilePath: relativePath,
            hasCodeSnippet: Boolean(rangeWithinCodeBlock),
            totalEditorCharacters: document.getText().length,
            workspaceFolder,
        }
    }

    private getRelativePath(document: TextDocument): string {
        const documentUri = URI.parse(document.uri)
        const workspaceFolder = this.#workspace?.getWorkspaceFolder?.(document.uri)
        const workspaceUri = workspaceFolder?.uri
        const workspaceRoot = workspaceUri ? URI.parse(workspaceUri).fsPath : process.cwd()
        const absolutePath = documentUri.fsPath
        return path.relative(workspaceRoot, absolutePath)
    }
}
