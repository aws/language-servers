import { ChatTriggerType, GenerateAssistantResponseCommandInput } from '@amzn/codewhisperer-streaming'
import { ChatParams } from '@aws/language-server-runtimes-types'
import { Result } from '../types'

export function convertChatParamsToRequestInput(
    params: ChatParams
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
