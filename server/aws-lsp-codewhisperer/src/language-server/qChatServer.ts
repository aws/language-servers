import { GenerateAssistantResponseCommandOutput } from '@amzn/codewhisperer-streaming'
import { ChatRequest, chatRequestType } from '@aws/language-server-runtimes/protocol'
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
        const codewhispererclient: ChatSessionManagementService = service(credentialsProvider)

        chat.onTabAdd((params: TabAddParams) => {
            logging.log('received tab add request')

            try {
                codewhispererclient.createSession(params.tabId)
            } catch (e) {
                logging.log('create session error')
                throw e
            }
        })

        chat.onTabRemove((params: TabRemoveParams) => {
            logging.log('received tab remove request')
            codewhispererclient.deleteSession(params.tabId)
        })

        chat.onEndChat((params: EndChatParams, _token: CancellationToken) => {
            logging.log('received end chat request')
            codewhispererclient.deleteSession(params.tabId)

            return true
        })

        chat.onChatPrompt(async (_params, token: CancellationToken) => {
            logging.log('received chat prompt')

            const params = _params as ChatRequest
            const session = codewhispererclient.getSession(params.tabId)

            if (!session) {
                logging.log('session not found')
                throw new Error('Session not found')
            }

            token.onCancellationRequested(() => {
                logging.log('cancellation requested')
                session.abortRequest()
            })

            let response: GenerateAssistantResponseCommandOutput
            const requestInput = convertChatParamsToRequestInput(params)

            try {
                response = await session.generateAssistantResponse(requestInput)
            } catch (e) {
                logging.log('generate assistant response error')

                throw e
            }

            const chatEventParser = new ChatEventParser(response.$metadata.requestId!)

            for await (const chatEvent of response.generateAssistantResponseResponse!) {
                logging.log('recevied partial chat event')

                const chatResult = chatEventParser.processPartialEvent(chatEvent)

                if (params.partialResultToken) {
                    lsp.sendProgress(chatRequestType, params.partialResultToken, chatResult)
                }
            }

            return chatEventParser.getChatResult()
        })

        logging.log('Q Chat server has been initialized')

        return () => {
            codewhispererclient.dispose()
        }
    }
