import {
    CancellationToken,
    ChatParams,
    CredentialsProvider,
    EndChatParams,
    Server,
} from '@aws/language-server-runtimes/server-interface'
import { ChatSessionManagementService } from './chat/chatSessionManagementService'

export const QChatServerToken =
    (service: (credentialsProvider: CredentialsProvider) => ChatSessionManagementService): Server =>
    ({ chat, credentialsProvider, logging }) => {
        const codewhispererclient: ChatSessionManagementService = service(credentialsProvider)

        chat.onEndChat((params: EndChatParams, _token: CancellationToken) => {
            logging.log('received end chat request')
            codewhispererclient.deleteSession(params.tabId)

            return true
        })

        chat.onChatPrompt(async (params: ChatParams, token: CancellationToken) => {
            logging.log('received chat prompt')

            const session = codewhispererclient.getSession(params.tabId)

            token.onCancellationRequested(() => {
                session.abortRequest()
            })

            return {}
        })

        logging.log('Chat server has been initialized')

        return () => {
            codewhispererclient.dispose()
        }
    }
