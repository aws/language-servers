import { ChatTriggerType, GenerateAssistantResponseCommandInput } from '@amzn/codewhisperer-streaming'
import { ChatParams } from '@aws/language-server-runtimes-types'

export function convertChatParamsToRequestInput(params: ChatParams): GenerateAssistantResponseCommandInput {
    const { prompt } = params

    if (prompt.prompt || prompt.escapedPrompt) {
        // TODO: implement userInputMessageContext state when that is available, and diagnostic trigger type
        return {
            conversationState: {
                chatTriggerType: ChatTriggerType.MANUAL,
                currentMessage: {
                    userInputMessage: {
                        content: prompt.escapedPrompt ?? prompt.prompt,
                    },
                },
            },
        }
    }

    throw new Error('Invalid prompt')
}
