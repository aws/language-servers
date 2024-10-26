import { CredentialsProvider, InitializeParams, Server } from '@aws/language-server-runtimes/server-interface'
import { ChatController } from './chat/chatController'
import { ChatSessionManagementService } from './chat/chatSessionManagementService'
import { CLEAR_QUICK_ACTION, HELP_QUICK_ACTION } from './chat/quickActions'
import { TelemetryService } from './telemetryService'
import { getUserAgent, makeUserContextObject } from './utilities/telemetryUtils'

export const QChatServer =
    (service: (credentialsProvider: CredentialsProvider) => ChatSessionManagementService): Server =>
    features => {
        const { chat, credentialsProvider, telemetry, logging, lsp, runtime } = features

        const chatSessionManagementService: ChatSessionManagementService = service(credentialsProvider)
        const telemetryService = new TelemetryService(credentialsProvider, 'bearer', telemetry, {})

        const chatController = new ChatController(chatSessionManagementService, features, telemetryService)

        lsp.addInitializer((params: InitializeParams) => {
            chatSessionManagementService.setCustomUserAgent(getUserAgent(params, runtime.serverInfo))
            telemetryService.updateClientConfig({
                customUserAgent: getUserAgent(params, runtime.serverInfo),
            })
            telemetryService.updateUserContext(makeUserContextObject(params, runtime.platform, 'CHAT'))
            return {
                capabilities: {},
                awsServerCapabilities: {
                    chatOptions: {
                        quickActions: {
                            quickActionsCommandGroups: [
                                {
                                    commands: [HELP_QUICK_ACTION, CLEAR_QUICK_ACTION],
                                },
                            ],
                        },
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

        chat.onSendFeedback(params => {
            return chatController.onSendFeedback(params)
        })

        chat.onCodeInsertToCursorPosition(params => {
            return chatController.onCodeInsertToCursorPosition(params)
        })

        lsp.onInitialized(chatController.updateConfiguration)
        lsp.didChangeConfiguration(chatController.updateConfiguration)

        logging.log('Q Chat server has been initialized')

        return () => {
            chatController.dispose()
        }
    }
