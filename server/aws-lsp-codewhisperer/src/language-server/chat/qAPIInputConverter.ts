import { ChatTriggerType, EditorState, GenerateAssistantResponseCommandInput } from '@amzn/codewhisperer-streaming'
import { ChatParams } from '@aws/language-server-runtimes/server-interface'
import { Features, Result } from '../types'
import { DocumentContextExtractor } from './contexts/documentContext'

export class QAPIInputConverter {
    #workspace: Features['workspace']
    #documentContextExtractor: DocumentContextExtractor
    #logger: Features['logging']

    constructor(workspace: Features['workspace'], logger: Features['logging']) {
        this.#workspace = workspace
        this.#logger = logger
        this.#documentContextExtractor = new DocumentContextExtractor({ logger })
    }

    async convertChatParamsToInput(params: ChatParams): Promise<Result<GenerateAssistantResponseCommandInput, string>> {
        const { prompt } = params

        let editorState: EditorState | undefined

        try {
            // best effort to extract state
            editorState = await this.#extractEditorStateFromInput(params)
        } catch (e) {
            this.#logger.log('Error extracting editorState. Skipping editorState')
        }

        if (prompt.prompt || prompt.escapedPrompt) {
            // TODO: implement userInputMessageContext state when that is available, and diagnostic trigger type
            return {
                success: true,
                data: {
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
                            },
                        },
                    },
                },
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

    async #extractEditorStateFromInput(
        input: Pick<ChatParams, 'cursorState' | 'textDocument'>
    ): Promise<EditorState | undefined> {
        const { textDocument: textDocumentIdentifier, cursorState = [] } = input

        if (!textDocumentIdentifier?.uri || cursorState.length === 0) {
            return undefined
        }

        const textDocument = await this.#workspace.getTextDocument(textDocumentIdentifier.uri)

        return textDocument && (await this.#documentContextExtractor.extractEditorState(textDocument, cursorState[0]))
    }
}
