import { EditorState } from '@amzn/codewhisperer-streaming'
import { TriggerType } from '@aws/chat-client-ui-types'
import { ChatTriggerType, GenerateAssistantResponseCommandInput, UserIntent } from '@amzn/codewhisperer-streaming'
import { ChatParams } from '@aws/language-server-runtimes/server-interface'
import { Features } from '../../types'
import { DocumentContext, DocumentContextExtractor } from './documentContext'

export interface TriggerContext extends Partial<DocumentContext> {
    userIntent?: string
    triggerType?: TriggerType
}

export class QChatTriggerContext {
    #workspace: Features['workspace']
    #documentContextExtractor: DocumentContextExtractor
    #logger: Features['logging']

    constructor(workspace: Features['workspace'], logger: Features['logging']) {
        this.#workspace = workspace
        this.#logger = logger
        this.#documentContextExtractor = new DocumentContextExtractor({ logger })
    }

    async getNewTriggerContext(params: ChatParams): Promise<TriggerContext> {
        let documentContext: DocumentContext | undefined

        try {
            // best effort to extract state
            documentContext = await this.#extractDocumentContext(params)

            return {
                ...documentContext,
                userIntent: this.#guessIntentFromPrompt(params.prompt.prompt),
            }
        } catch (e) {
            this.#logger.log(
                `Error extracting editorState but continuing on. ${e instanceof Error ? e.message : 'Unknown error'}`
            )
        }

        return {
            userIntent: this.#guessIntentFromPrompt(params.prompt.prompt),
        }
    }

    getChatParamsFromTrigger(
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

    public dispose() {
        this.#documentContextExtractor.dispose()
    }

    async #extractDocumentContext(
        input: Pick<ChatParams, 'cursorState' | 'textDocument'>
    ): Promise<DocumentContext | undefined> {
        const { textDocument: textDocumentIdentifier, cursorState = [] } = input

        if (!textDocumentIdentifier?.uri || cursorState.length === 0) {
            return undefined
        }

        const textDocument = await this.#workspace.getTextDocument(textDocumentIdentifier.uri)

        return (
            textDocument && (await this.#documentContextExtractor.extractDocumentContext(textDocument, cursorState[0]))
        )
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
