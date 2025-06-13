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
    ContentType,
    ProgrammingLanguage,
    EnvState,
} from '@aws/codewhisperer-streaming-client'
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
import { RelevantTextDocument } from '@aws/codewhisperer-streaming-client'
import { languageByExtension } from '../../../shared/languageDetection'
import { AgenticChatResultStream } from '../agenticChatResultStream'
import { ContextInfo, mergeFileLists, mergeRelevantTextDocuments } from './contextUtils'
import { WorkspaceFolderManager } from '../../workspaceContext/workspaceFolderManager'

export interface TriggerContext extends Partial<DocumentContext> {
    userIntent?: UserIntent
    triggerType?: TriggerType
    contextInfo?: ContextInfo
    documentReference?: FileList
}
export type LineInfo = { startLine: number; endLine: number }

export type AdditionalContentEntryAddition = AdditionalContentEntry & {
    type: string
    relativePath: string
    path: string
} & LineInfo

export type RelevantTextDocumentAddition = RelevantTextDocument & LineInfo & { path: string }

// limit for each chunk of @workspace
export const workspaceChunkMaxSize = 40_960

// limit for the length of additionalContent
export const additionalContextMaxLength = 100

// maximum number of workspace folders allowed by the API
export const maxWorkspaceFolders = 100

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

    #mapPlatformToEnvState(platform: string): EnvState | undefined {
        switch (platform) {
            case 'darwin':
                return { operatingSystem: 'macos' }
            case 'linux':
                return { operatingSystem: 'linux' }
            case 'win32':
            case 'cygwin':
                return { operatingSystem: 'windows' }
            default:
                return undefined
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
        additionalContent?: AdditionalContentEntryAddition[],
        modelId?: string
    ): Promise<GenerateAssistantResponseCommandInput> {
        const { prompt } = params
        const workspaceFolders = workspaceUtils.getWorkspaceFolderPaths(this.#workspace).slice(0, maxWorkspaceFolders)
        const defaultEditorState = { workspaceFolders }
        const hasWorkspace = 'context' in params ? params.context?.some(c => c.command === '@workspace') : false

        // prompt.prompt is what user typed in the input, should be sent to backend
        // prompt.escapedPrompt is HTML serialized string, which should only be used for UI.
        let promptContent = prompt.prompt ?? prompt.escapedPrompt

        // When the user adds @sage context, ** gets prepended and appended to the prompt because of markdown.
        // This intereferes with routing logic thus we need to remove it
        if (promptContent && promptContent.includes('@sage')) {
            promptContent = promptContent.replace(/\*\*@sage\*\*/g, '@sage')
        }

        if (hasWorkspace) {
            promptContent = promptContent?.replace(/\*\*@workspace\*\*/, '')
        }

        // Append remote workspaceId if it exists
        // Only append workspaceId to GenerateCompletions when WebSocket client is connected
        const remoteWsFolderManager = WorkspaceFolderManager.getInstance()
        const workspaceId =
            (remoteWsFolderManager &&
                remoteWsFolderManager.getWorkspaceState().webSocketClient?.isConnected() &&
                remoteWsFolderManager.getWorkspaceState().workspaceId) ||
            undefined
        this.#logging.info(`remote workspaceId: ${workspaceId}`)

        // Get workspace documents if @workspace is used
        let relevantDocuments = hasWorkspace
            ? await this.#getRelevantDocuments(promptContent ?? '', chatResultStream)
            : []

        const workspaceFileList = mergeRelevantTextDocuments(relevantDocuments)
        triggerContext.documentReference = triggerContext.documentReference
            ? mergeFileLists(triggerContext.documentReference, workspaceFileList)
            : workspaceFileList
        // Process additionalContent items if present
        if (additionalContent) {
            for (const item of additionalContent) {
                // Determine programming language from file extension or type
                let programmingLanguage: ProgrammingLanguage | undefined = undefined

                if (item.relativePath) {
                    const ext = path.extname(item.relativePath).toLowerCase()
                    const language = languageByExtension[ext]

                    if (language) {
                        programmingLanguage = { languageName: language }
                    }
                }

                const filteredType =
                    item.type === 'file'
                        ? ContentType.FILE
                        : item.type === 'rule' || item.type === 'prompt'
                          ? ContentType.PROMPT
                          : item.type === 'code'
                            ? ContentType.CODE
                            : undefined
                // Create the relevant text document
                const relevantTextDocument: RelevantTextDocumentAddition = {
                    text: item.innerContext,
                    path: item.path,
                    relativeFilePath: item.relativePath,
                    programmingLanguage: programmingLanguage,
                    type: filteredType,
                    startLine: item.startLine ?? -1,
                    endLine: item.endLine ?? -1,
                }
                relevantDocuments.push(relevantTextDocument)
            }
        }
        const useRelevantDocuments = relevantDocuments.length !== 0

        const data: GenerateAssistantResponseCommandInput = {
            conversationState: {
                workspaceId: workspaceId,
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
                                          relevantDocuments: useRelevantDocuments ? relevantDocuments : undefined,
                                          useRelevantDocuments: useRelevantDocuments,
                                          ...defaultEditorState,
                                      },
                                      tools,
                                      envState: this.#mapPlatformToEnvState(process.platform),
                                  }
                                : {
                                      tools,
                                      editorState: {
                                          relevantDocuments: useRelevantDocuments ? relevantDocuments : undefined,
                                          useRelevantDocuments: useRelevantDocuments,
                                          ...defaultEditorState,
                                      },
                                      envState: this.#mapPlatformToEnvState(process.platform),
                                  },
                        userIntent: triggerContext.userIntent,
                        origin: 'IDE',
                        modelId,
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
        if (!localProjectContextController.isIndexingEnabled() && chatResultStream) {
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
                    path: chunk.filePath,
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
                        type: ContentType.WORKSPACE,
                    })
                } else {
                    relevantTextDocuments.push({
                        ...baseDocument,
                        type: ContentType.WORKSPACE,
                    })
                }
            }

            return relevantTextDocuments
        } catch (e) {
            this.#logging.error(`Error querying query vector index to get relevant documents: ${e}`)
            return []
        }
    }
}
