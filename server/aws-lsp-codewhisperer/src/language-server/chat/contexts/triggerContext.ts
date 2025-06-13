import { TriggerType } from '@aws/chat-client-ui-types'
import {
    ChatTriggerType,
    UserIntent,
    Tool,
    ToolResult,
    RelevantTextDocument,
} from '@aws/codewhisperer-streaming-client'
import { BedrockTools, ChatParams, CursorState, InlineChatParams } from '@aws/language-server-runtimes/server-interface'
import { Features } from '../../types'
import { DocumentContext, DocumentContextExtractor } from './documentContext'
import { SendMessageCommandInput } from '../../../shared/streamingClientService'
import { LocalProjectContextController } from '../../../shared/localProjectContextController'
import { convertChunksToRelevantTextDocuments } from '../tools/relevantTextDocuments'
import { AmazonQBaseServiceManager as AmazonQServiceManager } from '../../../shared/amazonQServiceManager/BaseAmazonQServiceManager'

export interface TriggerContext extends Partial<DocumentContext> {
    userIntent?: UserIntent
    triggerType?: TriggerType
    useRelevantDocuments?: boolean
    relevantDocuments?: RelevantTextDocument[]
}

export class QChatTriggerContext {
    private static readonly DEFAULT_CURSOR_STATE: CursorState = { position: { line: 0, character: 0 } }

    #workspace: Features['workspace']
    #documentContextExtractor: DocumentContextExtractor
    #logger: Features['logging']

    constructor(
        workspace: Features['workspace'],
        logger: Features['logging'],
        private amazonQServiceManager?: AmazonQServiceManager
    ) {
        this.#workspace = workspace
        this.#documentContextExtractor = new DocumentContextExtractor({ logger, workspace })
        this.#logger = logger
    }

    async getNewTriggerContext(params: ChatParams | InlineChatParams): Promise<TriggerContext> {
        const documentContext: DocumentContext | undefined = await this.extractDocumentContext(params)

        const useRelevantDocuments =
            'context' in params
                ? params.context?.some(context => typeof context !== 'string' && context.command === '@workspace')
                : false
        const relevantDocuments = useRelevantDocuments ? await this.extractProjectContext(params.prompt.prompt) : []

        return {
            ...documentContext,
            userIntent: this.#guessIntentFromPrompt(params.prompt.prompt),
            useRelevantDocuments,
            relevantDocuments,
        }
    }

    getChatParamsFromTrigger(
        params: ChatParams | InlineChatParams,
        triggerContext: TriggerContext,
        chatTriggerType: ChatTriggerType,
        customizationArn?: string,
        profileArn?: string,
        tools: BedrockTools = []
    ): SendMessageCommandInput {
        const { prompt } = params

        const data: SendMessageCommandInput = {
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
                                          ...(triggerContext.useRelevantDocuments && {
                                              useRelevantDocuments: triggerContext.useRelevantDocuments,
                                              relevantDocuments: triggerContext.relevantDocuments,
                                          }),
                                      },
                                      tools,
                                  }
                                : {
                                      tools,
                                      ...(triggerContext.useRelevantDocuments && {
                                          editorState: {
                                              useRelevantDocuments: triggerContext.useRelevantDocuments,
                                              relevantDocuments: triggerContext.relevantDocuments,
                                          },
                                      }),
                                  },
                        userIntent: triggerContext.userIntent,
                        origin: 'IDE',
                    },
                },
                customizationArn,
            },
            profileArn,
            source: 'IDE',
        }

        return data
    }

    // public for testing
    async extractDocumentContext(
        input: Pick<ChatParams | InlineChatParams, 'cursorState' | 'textDocument'>
    ): Promise<DocumentContext | undefined> {
        const { textDocument: textDocumentIdentifier, cursorState } = input

        const textDocument =
            textDocumentIdentifier?.uri && (await this.#workspace.getTextDocument(textDocumentIdentifier.uri))

        return textDocument
            ? this.#documentContextExtractor.extractDocumentContext(
                  textDocument,
                  // we want to include a default position if a text document is found so users can still ask questions about the opened file
                  // the range will be expanded up to the max characters downstream
                  cursorState?.[0] ?? QChatTriggerContext.DEFAULT_CURSOR_STATE
              )
            : undefined
    }

    async extractProjectContext(query?: string): Promise<RelevantTextDocument[]> {
        if (query) {
            try {
                let enableWorkspaceContext = true

                if (this.amazonQServiceManager) {
                    const config = this.amazonQServiceManager.getConfiguration()
                    if (config.projectContext?.enableLocalIndexing === false) {
                        enableWorkspaceContext = false
                    }
                }

                if (!enableWorkspaceContext) {
                    this.#logger.debug('Workspace context is disabled, skipping project context extraction')
                    return []
                }
                const contextController = await LocalProjectContextController.getInstance()
                const resp = await contextController.queryVectorIndex({ query })
                return convertChunksToRelevantTextDocuments(resp)
            } catch (e) {
                this.#logger.error(`Failed to extract project context for chat trigger: ${e}`)
            }
        }
        return []
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
