import {
    ChatTriggerType,
    CodeWhispererStreaming,
    GenerateAssistantResponseRequest,
} from '@amzn/codewhisperer-streaming'
import { BearerCredentials, ChatParams, ChatResult, chatRequestType } from '@aws/language-server-runtimes/protocol'
import { CancellationToken, CredentialsProvider, Server } from '@aws/language-server-runtimes/server-interface'
import { CodeWhispererServiceBase, CodeWhispererServiceToken } from './codeWhispererService'

export const QChatServerFactory =
    (service: (credentials: CredentialsProvider) => CodeWhispererServiceBase): Server =>
    ({ credentialsProvider, lsp, workspace, telemetry, logging, chat }) => {
        const onChatPromptHandler = async (params: ChatParams, token: CancellationToken): Promise<ChatResult> => {
            logging.log(`Chat server received ${JSON.stringify(params)}`)

            const creds = credentialsProvider.getCredentials('bearer') as BearerCredentials
            if (!creds?.token) {
                throw new Error('Authorization failed, bearer token is not set')
            }

            const streamingClient = new CodeWhispererStreaming({
                region: 'us-east-1',
                endpoint: 'https://codewhisperer.us-east-1.amazonaws.com/',
                token: { token: creds.token },
            })

            const request: GenerateAssistantResponseRequest = {
                conversationState: {
                    chatTriggerType: ChatTriggerType.MANUAL,
                    currentMessage: { userInputMessage: { content: params.prompt.prompt } },
                },
            }
            const response = await streamingClient.generateAssistantResponse(request)

            if (response.generateAssistantResponseResponse === undefined) {
                throw new Error('No model response')
            }

            let chatResult: ChatResult = { body: '' }

            for await (const value of response.generateAssistantResponseResponse) {
                if (value?.assistantResponseEvent?.content) {
                    chatResult.body += value?.assistantResponseEvent?.content

                    // If request attached a partial result token, send partial progress response
                    if (params.partialResultToken) {
                        lsp.sendProgress(chatRequestType, params.partialResultToken, chatResult)
                    }
                }
            }

            return chatResult
        }
        chat.onChatPrompt(onChatPromptHandler)

        logging.log('Codewhisperer server has been initialised')

        return () => {
            // dispose function
            logging.log('Goodbye')
        }
    }

export const QChatServer = QChatServerFactory(
    credentialsProvider => new CodeWhispererServiceToken(credentialsProvider, {})
)
