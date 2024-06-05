import { CredentialsProvider, Server } from '@aws/language-server-runtimes/server-interface'
import { ChatController } from './chat/chatController'
import { ChatSessionManagementService } from './chat/chatSessionManagementService'
import { CLEAR_QUICK_ACTION, HELP_QUICK_ACTION } from './chat/quickActions'

export const QChatServer =
    (service: (credentialsProvider: CredentialsProvider) => ChatSessionManagementService): Server =>
    features => {
        const { chat, credentialsProvider, logging, lsp } = features

        const chatSessionManagementService: ChatSessionManagementService = service(credentialsProvider)

        const chatController = new ChatController(chatSessionManagementService, features)

        lsp.addInitializer(() => {
            return {
                capabilities: {},
                awsServerCapabilities: {
                    chatQuickActionsProvider: {
                        quickActionsCommandGroups: [
                            {
                                commands: [HELP_QUICK_ACTION, CLEAR_QUICK_ACTION],
                            },
                        ],
                    },
                },
            }
        })

        chat.onTabAdd(params => {
            logging.log(`Adding tab: ${params.tabId}`)

            return chatController.onTabAdd(params)
        })

        chat.onTabChange(params => {
            logging.log(`Changing to tab: ${params.tabId}`)

            return chatController.onTabChange(params)
        })

        chat.onTabRemove(params => {
            logging.log(`Removing tab: ${params.tabId}`)

            return chatController.onTabRemove(params)
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
