/**
 * Copied from chat/contexts/triggerContext.ts for the purpose of developing a divergent implementation.
 * Will be deleted or merged.
 */

import { TriggerType } from '@aws/chat-client-ui-types'
import {
    ChatTriggerType,
    UserIntent,
    Tool,
    ToolResult,
    AdditionalContentEntry,
    GenerateAssistantResponseCommandInput,
    ChatMessage,
} from '@amzn/codewhisperer-streaming'
import {
    BedrockTools,
    ChatParams,
    CursorState,
    InlineChatParams,
    QuickActionCommand,
    FileList,
    TextDocument,
} from '@aws/language-server-runtimes/server-interface'
import { Features } from '../../types'
import { DocumentContext, DocumentContextExtractor } from '../../chat/contexts/documentContext'
import { workspaceUtils } from '@aws/lsp-core'
import { URI } from 'vscode-uri'

export interface TriggerContext extends Partial<DocumentContext> {
    userIntent?: UserIntent
    triggerType?: TriggerType
    workspaceRulesCount?: number
    documentReference?: FileList
}
export type LineInfo = { startLine: number; endLine: number }

export type AdditionalContentEntryAddition = AdditionalContentEntry & { type: string; relativePath: string } & LineInfo

export class AgenticChatTriggerContext {
    private static readonly DEFAULT_CURSOR_STATE: CursorState = { position: { line: 0, character: 0 } }

    #workspace: Features['workspace']
    #lsp: Features['lsp']
    #documentContextExtractor: DocumentContextExtractor

    constructor({ workspace, lsp, logging }: Pick<Features, 'workspace' | 'lsp' | 'logging'> & Partial<Features>) {
        this.#workspace = workspace
        this.#lsp = lsp
        this.#documentContextExtractor = new DocumentContextExtractor({ logger: logging, workspace })
    }

    async getNewTriggerContext(params: ChatParams | InlineChatParams): Promise<TriggerContext> {
        const documentContext: DocumentContext | undefined = await this.extractDocumentContext(params)

        return {
            ...documentContext,
            userIntent: this.#guessIntentFromPrompt(params.prompt.prompt),
        }
    }

    getChatParamsFromTrigger(
        params: ChatParams | InlineChatParams,
        triggerContext: TriggerContext,
        chatTriggerType: ChatTriggerType,
        customizationArn?: string,
        profileArn?: string,
        history: ChatMessage[] = [],
        tools: BedrockTools = [],
        additionalContent?: AdditionalContentEntryAddition[]
    ): GenerateAssistantResponseCommandInput {
        const { prompt } = params
        const defaultEditorState = { workspaceFolders: workspaceUtils.getWorkspaceFolderPaths(this.#lsp) }
        const data: GenerateAssistantResponseCommandInput = {
            conversationState: {
                chatTriggerType: chatTriggerType,
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
                                          },
                                          ...defaultEditorState,
                                      },
                                      tools,
                                      additionalContext: additionalContent,
                                  }
                                : {
                                      tools,
                                      additionalContext: additionalContent,
                                      editorState: {
                                          ...defaultEditorState,
                                      },
                                  },
                        userIntent: triggerContext.userIntent,
                        origin: 'IDE',
                    },
                },
                customizationArn,
                history,
            },
            profileArn,
        }

        return data
    }

    // public for testing
    async extractDocumentContext(
        input: Pick<ChatParams | InlineChatParams, 'cursorState' | 'textDocument'>
    ): Promise<DocumentContext | undefined> {
        const { textDocument: textDocumentIdentifier, cursorState } = input

        if (textDocumentIdentifier?.uri === undefined) {
            return
        }
        const textDocument = await this.getTextDocument(textDocumentIdentifier.uri)

        return textDocument
            ? this.#documentContextExtractor.extractDocumentContext(
                  textDocument,
                  // we want to include a default position if a text document is found so users can still ask questions about the opened file
                  // the range will be expanded up to the max characters downstream
                  cursorState?.[0] ?? AgenticChatTriggerContext.DEFAULT_CURSOR_STATE
              )
            : undefined
    }

    /**
     * Fetch the current textDocument such that:
     * 1. If the document is synced with LSP, return the synced textDocument
     * 2. If the document is not synced with LSP, read the file from the file system
     * 3. If the file cannot be read, return undefined
     * @param uri
     * @returns
     */
    async getTextDocument(uri: string) {
        // Note: version is unused, and languageId can be determined from file extension.
        const syncedTextDocument = await this.#workspace.getTextDocument(uri)
        if (syncedTextDocument) {
            return syncedTextDocument
        }
        try {
            const content = await this.#workspace.fs.readFile(URI.parse(uri).fsPath)
            return TextDocument.create(uri, '', 0, content)
        } catch {
            return
        }
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
