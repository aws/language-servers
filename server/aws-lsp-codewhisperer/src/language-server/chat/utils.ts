import { ChatTriggerType, GenerateAssistantResponseCommandInput } from '@amzn/codewhisperer-streaming'
import { ChatParams } from '@aws/language-server-runtimes-types'

export function convertChatParamsToRequestInput(params: ChatParams): GenerateAssistantResponseCommandInput {
    const { prompt } = params

    console.log('prompt', prompt)

    if (prompt.prompt) {
        // TODO: implement userInputMessageContext state when that is available, and diagnostic trigger type
        return {
            conversationState: {
                chatTriggerType: ChatTriggerType.MANUAL,
                currentMessage: {
                    userInputMessage: {
                        content: prompt.prompt,
                    },
                },
            },
        }
    }

    console.log('invalid prompt...')
    throw new Error('Invalid prompt')
}
