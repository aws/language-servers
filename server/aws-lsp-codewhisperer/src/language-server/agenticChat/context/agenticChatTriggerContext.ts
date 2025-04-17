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
} from '@amzn/codewhisperer-streaming'
import {
    BedrockTools,
    ChatParams,
    CursorState,
    InlineChatParams,
    QuickActionCommand,
    FileList,
} from '@aws/language-server-runtimes/server-interface'
import { Features } from '../../types'
import { DocumentContext, DocumentContextExtractor } from '../../chat/contexts/documentContext'

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
    #documentContextExtractor: DocumentContextExtractor

    constructor(workspace: Features['workspace'], logger: Features['logging']) {
        this.#workspace = workspace
        this.#documentContextExtractor = new DocumentContextExtractor({ logger, workspace })
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
        tools: BedrockTools = [],
        additionalContent?: AdditionalContentEntryAddition[]
    ): GenerateAssistantResponseCommandInput {
        const { prompt } = params

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
                                      },
                                      tools,
                                      additionalContext: additionalContent,
                                  }
                                : {
                                      tools,
                                      additionalContext: additionalContent,
                                  },
                        userIntent: triggerContext.userIntent,
                        origin: 'IDE',
                    },
                },
                customizationArn,
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

        const textDocument =
            textDocumentIdentifier?.uri && (await this.#workspace.getTextDocument(textDocumentIdentifier.uri))

        return textDocument
            ? this.#documentContextExtractor.extractDocumentContext(
                  textDocument,
                  // we want to include a default position if a text document is found so users can still ask questions about the opened file
                  // the range will be expanded up to the max characters downstream
                  cursorState?.[0] ?? AgenticChatTriggerContext.DEFAULT_CURSOR_STATE
              )
            : undefined
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
