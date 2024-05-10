import { ChatTriggerType, EditorState, GenerateAssistantResponseCommandInput } from '@amzn/codewhisperer-streaming'
import { ChatParams } from '@aws/language-server-runtimes/server-interface'
import { Result } from '../types'

export function convertChatParamsToRequestInput(
    params: ChatParams,
    editorState?: EditorState
): Result<GenerateAssistantResponseCommandInput, string> {
    const { prompt } = params

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
