import { TriggerType } from '@aws/chat-client-ui-types'
import {
    ChatTriggerType,
    UserIntent,
    RelevantTextDocument,
    EditorState,
} from '@amzn/codewhisperer-streaming'
import { BedrockTools, ChatParams, CursorState, InlineChatParams } from '@aws/language-server-runtimes/server-interface'
import { Features } from '../../types'
import { DocumentContext, DocumentContextExtractor } from './documentContext'
import { SendMessageCommandInput } from '../../../shared/streamingClientService'

export interface TriggerContext extends Partial<DocumentContext> {
    userIntent?: UserIntent
    triggerType?: TriggerType
}

export class QChatTriggerContext {
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

    // TODO: this function does not need to be a method!
    getChatParamsFromTrigger(
        params: ChatParams | InlineChatParams,
        triggerContext: TriggerContext,
        chatTriggerType: ChatTriggerType,
        customizationArn?: string,
        profileArn?: string,
        tools: BedrockTools = [],
        useRelevantDocuments?: boolean,
        relevantDocuments?: RelevantTextDocument[]
    ): SendMessageCommandInput {
        const { prompt } = params
        let editorState: EditorState | undefined = undefined
        if (triggerContext.cursorState && triggerContext.relativeFilePath) {
            editorState = Object.assign<EditorState, EditorState>(editorState ?? {}, {
                cursorState: triggerContext.cursorState,
                document: {
                    relativeFilePath: triggerContext.relativeFilePath,
                    text: triggerContext.text,
                    programmingLanguage: triggerContext.programmingLanguage,
                },
            })
        }
        if (useRelevantDocuments && relevantDocuments) {
            editorState = Object.assign<EditorState, EditorState>(editorState ?? {}, {
                useRelevantDocuments,
                relevantDocuments,
            })
        }
        const data: SendMessageCommandInput = {
            conversationState: {
                chatTriggerType: chatTriggerType,
                currentMessage: {
                    userInputMessage: {
                        content: prompt.escapedPrompt ?? prompt.prompt,
                        userInputMessageContext: {
                            editorState: editorState,
                            tools,
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
                cursorState?.[0] ?? QChatTriggerContext.DEFAULT_CURSOR_STATE
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
