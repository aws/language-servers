import {
    CodeWhispererStreamingServiceException,
    GenerateAssistantResponseCommandInput,
    GenerateAssistantResponseCommandOutput,
} from '@amzn/codewhisperer-streaming'
import { ChatRequest, ResponseError, chatRequestType } from '@aws/language-server-runtimes/protocol'
import {
    CancellationToken,
    CredentialsProvider,
    EndChatParams,
    Server,
    TabAddParams,
    TabRemoveParams,
} from '@aws/language-server-runtimes/server-interface'
import { ChatEventParser } from './chat/chatEventParser'
import { ChatSessionManagementService } from './chat/chatSessionManagementService'
import { convertChatParamsToRequestInput } from './chat/utils'

export const QChatServer =
    (service: (credentialsProvider: CredentialsProvider) => ChatSessionManagementService): Server =>
    ({ chat, credentialsProvider, logging, lsp }) => {
        const chatSessionManagementService: ChatSessionManagementService = service(credentialsProvider)

        chat.onTabAdd((params: TabAddParams) => {
            logging.log('Received tab add request')

            try {
                chatSessionManagementService.createSession(params.tabId)
            } catch (e) {
                logging.log(`Create session error ${e}`)
                throw e
            }
        })

        chat.onTabRemove((params: TabRemoveParams) => {
            logging.log('Received tab remove request')
            chatSessionManagementService.deleteSession(params.tabId)
        })

        chat.onEndChat((params: EndChatParams, _token: CancellationToken) => {
            logging.log('Received end chat request')

            chatSessionManagementService.deleteSession(params.tabId)

            return true
        })

        chat.onChatPrompt(async (_params, token: CancellationToken) => {
            logging.log('Received chat prompt')

            const params = _params as ChatRequest
            const session = chatSessionManagementService.getSession(params.tabId)

            if (!session) {
                logging.log(`Session not found for tabId: ${params.tabId}`)
                return new ResponseError(404, 'Session not found')
            }

            token.onCancellationRequested(() => {
                logging.log('cancellation requested')
                session.abortRequest()
            })

            let requestInput: GenerateAssistantResponseCommandInput
            let response: GenerateAssistantResponseCommandOutput

            try {
                requestInput = convertChatParamsToRequestInput(params)
            } catch (err) {
                logging.log('Invalid request input')

                return new ResponseError(422, 'Invalid request input')
            }

            try {
                response = await session.generateAssistantResponse(requestInput)
            } catch (err) {
                logging.log('Q api request error')

                return err instanceof CodeWhispererStreamingServiceException
                    ? new ResponseError(err.$metadata.httpStatusCode ?? 400, err.message)
                    : new ResponseError(500, err instanceof Error ? err.message : 'Internal Server Error')
            }

            const chatEventParser = new ChatEventParser(response.$metadata.requestId!)

            for await (const chatEvent of response.generateAssistantResponseResponse!) {
                if (chatEvent.error) {
                    logging.log('Streaming error')

                    return new ResponseError(
                        chatEvent.error.$metadata.httpStatusCode ?? 400,
                        chatEvent.error.message,
                        chatEventParser.getChatResult()
                    )
                }

                logging.log('Streaming partial chat event')

                const chatResult = chatEventParser.processPartialEvent(chatEvent)

                if (params.partialResultToken) {
                    lsp.sendProgress(chatRequestType, params.partialResultToken, chatResult)
                }
            }

            return chatEventParser.getChatResult()
        })

        logging.log('Q Chat server has been initialized')

        return () => {
            chatSessionManagementService.dispose()
        }
    }
