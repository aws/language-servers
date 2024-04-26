import {
    GenerateAssistantResponseCommandInput,
    GenerateAssistantResponseCommandOutput,
} from '@amzn/codewhisperer-streaming'
import { ChatParams, ErrorCodes, ResponseError } from '@aws/language-server-runtimes/protocol'
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
    ({ chat, credentialsProvider, logging }) => {
        const chatSessionManagementService: ChatSessionManagementService = service(credentialsProvider)

        chat.onTabAdd((params: TabAddParams) => {
            logging.log('Received tab add request')

            // while createSession should throw an error when we are trying to
            // create a duplicate session, but this handler doesn't need to care
            if (chatSessionManagementService.getSession(params.tabId)) {
                logging.log('Session already exists')
            } else {
                chatSessionManagementService.createSession(params.tabId)
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

        chat.onChatPrompt(async (params: ChatParams, token: CancellationToken) => {
            logging.log('Received chat prompt')

            const session = chatSessionManagementService.getSession(params.tabId)

            if (!session) {
                logging.log(`Session not found for tabId: ${params.tabId}`)
                return new ResponseError(ErrorCodes.InvalidParams, 'Session not found')
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

                return new ResponseError(ErrorCodes.InvalidParams, 'Invalid request input')
            }

            try {
                response = await session.generateAssistantResponse(requestInput)
            } catch (err) {
                logging.log('Q api request error')

                return new ResponseError(
                    ErrorCodes.InternalError,
                    err instanceof Error ? err.message : 'Internal Server Error'
                )
            }

            const chatEventParser = new ChatEventParser(response.$metadata.requestId!)

            for await (const chatEvent of response.generateAssistantResponseResponse!) {
                logging.log('Streaming partial chat event')

                const chatResult = chatEventParser.processPartialEvent(chatEvent)

                if (chatEventParser.error) {
                    return new ResponseError(ErrorCodes.InternalError, chatEventParser.error, chatResult)
                }

                // TODO: partialResultToken is missing from the type
                // if (params.partialResultToken) {
                //     lsp.sendProgress(chatRequestType, params.partialResultToken, chatResult)
                // }
            }

            return chatEventParser.getChatResult()
        })

        logging.log('Q Chat server has been initialized')

        return () => {
            chatSessionManagementService.dispose()
        }
    }
