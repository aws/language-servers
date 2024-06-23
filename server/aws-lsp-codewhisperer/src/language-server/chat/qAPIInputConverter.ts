import {
    ChatTriggerType,
    EditorState,
    GenerateAssistantResponseCommandInput,
    UserIntent,
} from '@amzn/codewhisperer-streaming'
import { ChatParams } from '@aws/language-server-runtimes/server-interface'
import { Features, Result } from '../types'
import { DocumentContextExtractor } from './contexts/documentContext'
import { StartConversationEvent } from '../telemetry/types'
import { Metric } from '../telemetry/metric'

export class QAPIInputConverter {
    #workspace: Features['workspace']
    #documentContextExtractor: DocumentContextExtractor
    #logger: Features['logging']

    constructor(workspace: Features['workspace'], logger: Features['logging']) {
        this.#workspace = workspace
        this.#logger = logger
        this.#documentContextExtractor = new DocumentContextExtractor({ logger })
    }

    async convertChatParamsToInput(
        params: ChatParams,
        metric?: Metric<StartConversationEvent>
    ): Promise<Result<GenerateAssistantResponseCommandInput, string>> {
        const { prompt } = params

        let editorState: EditorState | undefined

        try {
            // best effort to extract state
            editorState = await this.#extractEditorStateFromParams(params)
        } catch (e) {
            this.#logger.log(
                `Error extracting editorState but continuing on. ${e instanceof Error ? e.message : 'Unknown error'}`
            )
        }

        if (prompt.prompt || prompt.escapedPrompt) {
            const data: GenerateAssistantResponseCommandInput = {
                conversationState: {
                    chatTriggerType: ChatTriggerType.MANUAL,
                    currentMessage: {
                        userInputMessage: {
                            content: prompt.escapedPrompt ?? prompt.prompt,
                            userInputMessageContext: editorState
                                ? {
                                      editorState,
                                  }
                                : undefined,
                            userIntent: this.#guessIntentFromPrompt(prompt.prompt),
                        },
                    },
                },
            }

            if (metric) {
                const maybeConversationState = data.conversationState
                const maybeUserInputMessage = maybeConversationState?.currentMessage?.userInputMessage
                const maybeDocument = maybeUserInputMessage?.userInputMessageContext?.editorState?.document

                metric.merge({
                    cwsprChatUserIntent: maybeUserInputMessage?.userIntent,
                    // this one is incorrect
                    cwsprChatHasCodeSnippet: Boolean(maybeDocument?.text),
                    cwsprChatProgrammingLanguage: maybeDocument?.programmingLanguage?.languageName,
                })
            }

            return {
                success: true,
                data,
            }
        }

        return {
            success: false,
            error: 'Invalid request input',
        }
    }

    public dispose() {
        this.#documentContextExtractor.dispose()
    }

    async #extractEditorStateFromParams(
        input: Pick<ChatParams, 'cursorState' | 'textDocument'>
    ): Promise<EditorState | undefined> {
        const { textDocument: textDocumentIdentifier, cursorState = [] } = input

        if (!textDocumentIdentifier?.uri || cursorState.length === 0) {
            return undefined
        }

        const textDocument = await this.#workspace.getTextDocument(textDocumentIdentifier.uri)

        return textDocument && (await this.#documentContextExtractor.extractEditorState(textDocument, cursorState[0]))
    }

    #guessIntentFromPrompt(prompt?: string): UserIntent | undefined {
        if (prompt === undefined) {
            return undefined
        }

        if (prompt.startsWith('Explain')) {
            return UserIntent.EXPLAIN_CODE_SELECTION
        } else if (prompt.startsWith('Refactor')) {
            return UserIntent.SUGGEST_ALTERNATE_IMPLEMENTATION
        } else if (prompt.startsWith('Fix')) {
            return UserIntent.APPLY_COMMON_BEST_PRACTICES
        } else if (prompt.startsWith('Optimize')) {
            return UserIntent.IMPROVE_CODE
        }

        return undefined
    }
}
