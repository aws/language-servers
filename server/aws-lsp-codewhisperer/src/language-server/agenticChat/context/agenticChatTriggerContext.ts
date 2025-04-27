/**
 * Copied from chat/contexts/triggerContext.ts for the purpose of developing a divergent implementation.
 * Will be deleted or merged.
 */

import { TriggerType } from '@aws/chat-client-ui-types'
import {
    ChatTriggerType,
    UserIntent,
    AdditionalContentEntry,
    GenerateAssistantResponseCommandInput,
    ChatMessage,
} from '@amzn/codewhisperer-streaming'
import {
    BedrockTools,
    ChatParams,
    CursorState,
    InlineChatParams,
    FileList,
    TextDocument,
    OPEN_WORKSPACE_INDEX_SETTINGS_BUTTON_ID,
} from '@aws/language-server-runtimes/server-interface'
import { Features } from '../../types'
import { DocumentContext, DocumentContextExtractor } from '../../chat/contexts/documentContext'
import { workspaceUtils } from '@aws/lsp-core'
import { URI } from 'vscode-uri'
import { LocalProjectContextController } from '../../../shared/localProjectContextController'
import * as path from 'path'
import { RelevantTextDocument } from '@amzn/codewhisperer-streaming'
import { AgenticChatResultStream } from '../agenticChatResultStream'

export interface TriggerContext extends Partial<DocumentContext> {
    userIntent?: UserIntent
    triggerType?: TriggerType
    workspaceRulesCount?: number
    documentReference?: FileList
}
export type LineInfo = { startLine: number; endLine: number }

export type AdditionalContentEntryAddition = AdditionalContentEntry & {
    type: string
    relativePath: string
    path: string
} & LineInfo

export type RelevantTextDocumentAddition = RelevantTextDocument & LineInfo

// limit for each chunk of @workspace
export const workspaceChunkMaxSize = 40_960

export interface DocumentReference {
    readonly relativeFilePath: string
    readonly lineRanges: Array<{ first: number; second: number }>
}

export class AgenticChatTriggerContext {
    private static readonly DEFAULT_CURSOR_STATE: CursorState = { position: { line: 0, character: 0 } }

    #workspace: Features['workspace']
    #lsp: Features['lsp']
    #logging: Features['logging']
    #documentContextExtractor: DocumentContextExtractor

    constructor({ workspace, lsp, logging }: Pick<Features, 'workspace' | 'lsp' | 'logging'> & Partial<Features>) {
        this.#workspace = workspace
        this.#lsp = lsp
        this.#logging = logging
        this.#documentContextExtractor = new DocumentContextExtractor({ logger: logging, workspace })
    }

    async getNewTriggerContext(params: ChatParams | InlineChatParams): Promise<TriggerContext> {
        const documentContext: DocumentContext | undefined = await this.extractDocumentContext(params)

        return {
            ...documentContext,
            userIntent: undefined,
        }
    }

    async getChatParamsFromTrigger(
        params: ChatParams | InlineChatParams,
        triggerContext: TriggerContext,
        chatTriggerType: ChatTriggerType,
        customizationArn?: string,
        chatResultStream?: AgenticChatResultStream,
        profileArn?: string,
        history: ChatMessage[] = [],
        tools: BedrockTools = [],
        additionalContent?: AdditionalContentEntryAddition[]
    ): Promise<GenerateAssistantResponseCommandInput> {
        const { prompt } = params
        const defaultEditorState = { workspaceFolders: workspaceUtils.getWorkspaceFolderPaths(this.#lsp) }

        const useRelevantDocuments = 'context' in params ? params.context?.some(c => c.command === '@workspace') : false

        let promptContent = prompt.escapedPrompt ?? prompt.prompt

        // When the user adds @sage context, ** gets prepended and appended to the prompt because of markdown.
        // This intereferes with routing logic thus we need to remove it
        if (promptContent && promptContent.includes('@sage')) {
            promptContent = promptContent.replace(/\*\*@sage\*\*/g, '@sage')
        }

        if (useRelevantDocuments) {
            promptContent = promptContent?.replace(/^@workspace\/?/, '')
        }

        const relevantDocuments = useRelevantDocuments
            ? await this.#getRelevantDocuments(promptContent ?? '', chatResultStream)
            : undefined

        const data: GenerateAssistantResponseCommandInput = {
            conversationState: {
                chatTriggerType: chatTriggerType,
                currentMessage: {
                    userInputMessage: {
                        content: promptContent,
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
                                          relevantDocuments: relevantDocuments,
                                          useRelevantDocuments: useRelevantDocuments,
                                          ...defaultEditorState,
                                      },
                                      tools,
                                      additionalContext: additionalContent,
                                  }
                                : {
                                      tools,
                                      additionalContext: additionalContent,
                                      editorState: {
                                          relevantDocuments: relevantDocuments,
                                          useRelevantDocuments: useRelevantDocuments,
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

    async #getRelevantDocuments(
        prompt: string,
        chatResultStream?: AgenticChatResultStream
    ): Promise<RelevantTextDocumentAddition[]> {
        const localProjectContextController = await LocalProjectContextController.getInstance()
        if (!localProjectContextController.isEnabled && chatResultStream) {
            await chatResultStream.writeResultBlock({
                body: `To add your workspace as context, enable local indexing in your IDE settings. After enabling, add @workspace to your question, and I'll generate a response using your workspace as context.`,
                buttons: [
                    {
                        id: OPEN_WORKSPACE_INDEX_SETTINGS_BUTTON_ID,
                        text: 'Open settings',
                        icon: 'external',
                        keepCardAfterClick: false,
                        status: 'info',
                    },
                ],
            })
            return []
        }

        let relevantTextDocuments = await this.#queryRelevantDocuments(prompt, localProjectContextController)
        relevantTextDocuments = relevantTextDocuments.filter(doc => doc.text && doc.text.length > 0)
        for (const relevantDocument of relevantTextDocuments) {
            if (relevantDocument.text && relevantDocument.text.length > workspaceChunkMaxSize) {
                relevantDocument.text = relevantDocument.text.substring(0, workspaceChunkMaxSize)
                this.#logging.debug(`Truncating @workspace chunk: ${relevantDocument.relativeFilePath} `)
            }
        }

        return relevantTextDocuments
    }

    async #queryRelevantDocuments(
        prompt: string,
        localProjectContextController: LocalProjectContextController
    ): Promise<RelevantTextDocumentAddition[]> {
        try {
            const chunks = await localProjectContextController.queryVectorIndex({ query: prompt })
            const relevantTextDocuments: RelevantTextDocumentAddition[] = []
            if (!chunks) {
                return relevantTextDocuments
            }

            for (const chunk of chunks) {
                const text = chunk.context ?? chunk.content
                const baseDocument = {
                    text,
                    relativeFilePath: chunk.relativePath ?? path.basename(chunk.filePath),
                    startLine: chunk.startLine ?? -1,
                    endLine: chunk.endLine ?? -1,
                }

                if (chunk.programmingLanguage && chunk.programmingLanguage !== 'unknown') {
                    relevantTextDocuments.push({
                        ...baseDocument,
                        programmingLanguage: {
                            languageName: chunk.programmingLanguage,
                        },
                    })
                } else {
                    relevantTextDocuments.push(baseDocument)
                }
            }

            return relevantTextDocuments
        } catch (e) {
            this.#logging.error(`Error querying query vector index to get relevant documents: ${e}`)
            return []
        }
    }
}
