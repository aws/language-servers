import {
    EditorState,
    TextDocument as CwsprTextDocument,
    DocumentSymbol,
    UserIntent,
    GenerateAssistantResponseCommandInput,
    ChatTriggerType,
} from '@amzn/codewhisperer-streaming'
import { TriggerType } from '@aws/chat-client-ui-types'
import { ChatParams, CursorState } from '@aws/language-server-runtimes/server-interface'
import { Range, TextDocument } from 'vscode-languageserver-textdocument'
import { getLanguageId } from '../../languageDetection'
import { Cancel, Features } from '../../types'
import { DocumentFqnExtractor, DocumentFqnExtractorConfig } from './documentFqnExtractor'
import { getExtendedCodeBlockRange, getSelectionWithinExtendedRange } from './utils'

export type TriggerContext = Partial<DocumentContext> & {
    userIntent?: string
    triggerType?: TriggerType
}

export type DocumentContext = CwsprTextDocument & {
    cursorState?: EditorState['cursorState']
    hasCodeSnippet: boolean
    totalEditorCharacters: number
}

export interface TriggerContextExtractorConfig extends DocumentFqnExtractorConfig {
    config?: DocumentFqnExtractorConfig
    logger?: Features['logging']
    characterLimits?: number
}

export class TriggerContextExtractor {
    private static readonly DEFAULT_CHARACTER_LIMIT = 9000

    #characterLimits: number
    #logger?: Features['logging']
    #documentSymbolExtractor: DocumentFqnExtractor
    #workspace: Features['workspace']
    #cancellableByTabId: { [tabId: string]: Cancel }

    public static getChatParamsFromTrigger(
        params: ChatParams,
        triggerContext: TriggerContext
    ): GenerateAssistantResponseCommandInput {
        const { prompt } = params

        const data: GenerateAssistantResponseCommandInput = {
            conversationState: {
                chatTriggerType: ChatTriggerType.MANUAL,
                currentMessage: {
                    userInputMessage: {
                        content: prompt.escapedPrompt ?? prompt.prompt,
                        userInputMessageContext:
                            triggerContext.cursorState && triggerContext.relativeFilePath
                                ? {
                                      editorState: {
                                          cursorState: triggerContext.cursorState,
                                          document: {
                                              text: triggerContext.text,
                                              programmingLanguage: triggerContext.programmingLanguage,
                                              relativeFilePath: triggerContext.relativeFilePath,
                                              documentSymbols: triggerContext.documentSymbols,
                                          },
                                      },
                                  }
                                : undefined,
                        userIntent: triggerContext.userIntent,
                    },
                },
            },
        }

        return data
    }

    constructor(workspace: Features['workspace'], config?: TriggerContextExtractorConfig) {
        const { characterLimits, ...fqnConfig } = config ?? {}

        this.#logger = config?.logger
        this.#characterLimits = characterLimits ?? TriggerContextExtractor.DEFAULT_CHARACTER_LIMIT
        this.#documentSymbolExtractor = new DocumentFqnExtractor(fqnConfig)
        this.#workspace = workspace
        this.#cancellableByTabId = {}
    }

    public async getTriggerContext(params: ChatParams): Promise<TriggerContext> {
        const { textDocument: textDocumentIdentifier, cursorState = [] } = params

        const textDocument =
            textDocumentIdentifier?.uri && (await this.#workspace.getTextDocument(textDocumentIdentifier.uri))

        const documentContext =
            textDocument && (await this.extractDocumentContext(params.tabId, textDocument, cursorState[0]))

        return {
            ...documentContext,
            userIntent: this.#guessIntentFromPrompt(params.prompt.prompt),
        }
    }

    /**
     * From the given the cursor state, we want to give Q context up to the characters limit
     * on both sides of the cursor.
     */
    public async extractDocumentContext(
        tabId: string,
        document: TextDocument,
        cursorState: CursorState
    ): Promise<DocumentContext> {
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

        let documentSymbols: DocumentSymbol[] | undefined
        const [extractPromise, cancel] = this.#documentSymbolExtractor.extractDocumentSymbols(
            document,
            codeBlockRange,
            languageId
        )

        this.#cancellableByTabId[tabId] = cancel

        try {
            documentSymbols = await extractPromise
            // register job here
        } catch (error: unknown) {
            this.#logger?.log(
                `Error extracting document symbols but continuing on. ${error instanceof Error ? error.message : 'Unknown error'}`
            )
        }

        delete this.#cancellableByTabId[tabId]

        return {
            cursorState: rangeWithinCodeBlock ? { range: rangeWithinCodeBlock } : undefined,
            documentSymbols,
            text: document.getText(codeBlockRange),
            programmingLanguage: languageId ? { languageName: languageId } : undefined,
            relativeFilePath: document.uri,
            hasCodeSnippet: Boolean(rangeWithinCodeBlock),
            totalEditorCharacters: document.getText().length,
        }
    }

    public cancel(tabId: string) {
        this.#cancellableByTabId[tabId]?.()
    }

    public dispose() {
        this.#documentSymbolExtractor.dispose()
    }

    #guessIntentFromPrompt(prompt?: string): UserIntent | undefined {
        if (prompt === undefined) {
            return undefined
        } else if (/^explain/i.test(prompt)) {
            return UserIntent.EXPLAIN_CODE_SELECTION
        } else if (/^refactor/i.test(prompt)) {
            return UserIntent.SUGGEST_ALTERNATE_IMPLEMENTATION
        } else if (/^fix/i.test(prompt)) {
            return UserIntent.APPLY_COMMON_BEST_PRACTICES
        } else if (/^optimize/i.test(prompt)) {
            return UserIntent.IMPROVE_CODE
        }

        return undefined
    }
}
