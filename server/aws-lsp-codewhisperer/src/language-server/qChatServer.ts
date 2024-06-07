import { CredentialsProvider, Server, TextDocument } from '@aws/language-server-runtimes/server-interface'
import { ChatController } from './chat/chatController'
import { ChatSessionManagementService } from './chat/chatSessionManagementService'
import { CLEAR_QUICK_ACTION, HELP_QUICK_ACTION } from './chat/quickActions'

export const QChatServer =
    (service: (credentialsProvider: CredentialsProvider) => ChatSessionManagementService): Server =>
    features => {
        const { chat, credentialsProvider, logging, lsp, telemetry } = features

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

        telemetry.onClientTelemetry(params => {
            switch (params.name) {
                case 'addMessage':
                    // store the trigger interaction that added the message
                    break
                case 'sendToPrompt':
                    break
                case 'tabAdd':
                    // store the trigger that started the conversation in given tab
                    break
                case 'copyToClipboard':
                case 'vote':
                case 'linkClick':
                case 'infoLinkClick':
                case 'sourceLinkClick':
                    // record interactWithMessage metric
                    break
                default:
                    break
            }
        })

        chat.onFollowUpClicked(params => {
            // report interactWithMessage metric
        })

        chat.onCodeInsertToCursorPosition(params => {
            // report interactWithMessage metric
            // Track for 5 minutes to track user modifications to suggested code
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
            // todo, track the RunCommand metric
            return chatController.onQuickAction(...params)
        })

        logging.log('Q Chat server has been initialized')

        return () => {
            chatController.dispose()
        }
    }
