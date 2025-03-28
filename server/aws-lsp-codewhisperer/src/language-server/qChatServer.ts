import { InitializeParams, Server } from '@aws/language-server-runtimes/server-interface'
import { ChatController } from './chat/chatController'
import { ChatSessionManagementService } from './chat/chatSessionManagementService'
import { CLEAR_QUICK_ACTION, HELP_QUICK_ACTION } from './chat/quickActions'
import { TelemetryService } from './telemetryService'
import { makeUserContextObject } from './utilities/telemetryUtils'
import { AmazonQTokenServiceManager } from './amazonQServiceManager/AmazonQTokenServiceManager'
import { AmazonQServiceInitializationError } from './amazonQServiceManager/errors'
import { safeGet } from './utils'

export const QChatServer =
    // prettier-ignore
    (): Server => features => {
        const { chat, credentialsProvider, telemetry, logging, lsp, runtime } = features

        let amazonQServiceManager: AmazonQTokenServiceManager
        let chatController: ChatController
        let chatSessionManagementService: ChatSessionManagementService
        let telemetryService: TelemetryService;

        lsp.addInitializer((params: InitializeParams) => {
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

        const updateConfigurationHandler = async () => {
            await amazonQServiceManager.handleDidChangeConfiguration()
            await chatController.updateConfiguration()
        }

        lsp.onInitialized(async () => {
            // Initialize service manager and inject it to chatSessionManagementService to pass it down
            amazonQServiceManager = AmazonQTokenServiceManager.getInstance(features)
            chatSessionManagementService = ChatSessionManagementService
                .getInstance()
                .withAmazonQServiceManager(amazonQServiceManager)

            telemetryService = new TelemetryService(
                amazonQServiceManager,
                credentialsProvider,
                telemetry,
                logging,
            )

            const clientParams = safeGet(lsp.getClientInitializeParams(), new AmazonQServiceInitializationError(
                'TelemetryService initialized before LSP connection was initialized.'))

            telemetryService.updateUserContext(makeUserContextObject(clientParams, runtime.platform, 'CHAT'))

            chatController = new ChatController(chatSessionManagementService, features, telemetryService)

            await updateConfigurationHandler()
        })
        lsp.didChangeConfiguration(updateConfigurationHandler)

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

        chat.onReady(_ => {
            logging.log('Q Chat Client is ready')
            chat.openTab({})
                .then(result => {
                    logging.log(`Opened tab: ${result.tabId}`)
                })
                .catch(err => {
                    logging.log(`Error opening tab: ${err}`)
                })
        })

        logging.log('Q Chat server has been initialized')

        return () => {
            chatController?.dispose()
        }
    }
