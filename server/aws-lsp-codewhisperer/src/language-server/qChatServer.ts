import { CredentialsProvider, Server } from '@aws/language-server-runtimes/server-interface'
import { ChatController } from './chat/chatController'
import { ChatSessionManagementService } from './chat/chatSessionManagementService'

export const QChatServer =
    (service: (credentialsProvider: CredentialsProvider) => ChatSessionManagementService): Server =>
    features => {
        const { chat, credentialsProvider, logging } = features

        const chatSessionManagementService: ChatSessionManagementService = service(credentialsProvider)

        const chatController = new ChatController(chatSessionManagementService, features)

        chat.onTabAdd((...params) => {
            logging.log(`Adding tab: ${params[0].tabId}`)

            return chatController.onTabAdd(...params)
        })

        chat.onTabChange((...params) => {
            logging.log(`Changing to tab: ${params[0].tabId}`)

            return chatController.onTabChange(...params)
        })

        chat.onTabRemove((...params) => {
            logging.log(`Removing tab: ${params[0].tabId}`)

            return chatController.onTabRemove(...params)
        })

        chat.onEndChat((...params) => {
            logging.log('Received end chat request')
            return chatController.onEndChat(...params)
        })

        chat.onChatPrompt((...params) => {
            logging.log('Received chat prompt')
            return chatController.onChatPrompt(...params)
        })

        chat.onQuickAction((...params) => {
            return chatController.onQuickAction(...params)
        })

        logging.log('Q Chat server has been initialized')

        return () => {
            chatController.dispose()
        }
    }
