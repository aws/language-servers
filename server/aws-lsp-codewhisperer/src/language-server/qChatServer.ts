import { InitializeParams, Server } from '@aws/language-server-runtimes/server-interface'
import { ChatController } from './chat/chatController'
import { ChatSessionManagementService } from './chat/chatSessionManagementService'
import { CLEAR_QUICK_ACTION, HELP_QUICK_ACTION } from './chat/quickActions'
import { TelemetryService } from './telemetryService'
import { getUserAgent, makeUserContextObject } from './utilities/telemetryUtils'
import { DEFAULT_AWS_Q_REGION, DEFAULT_AWS_Q_ENDPOINT_URL } from '../constants'
import { AmazonQTokenServiceManager } from './amazonQServiceManager/AmazonQTokenServiceManager'

export const QChatServer =
    // prettier-ignore
    (): Server => features => {
        const { chat, credentialsProvider, telemetry, logging, lsp, runtime, workspace, sdkInitializator } = features

        let amazonQServiceManager: AmazonQTokenServiceManager
        let chatController: ChatController
        let chatSessionManagementService: ChatSessionManagementService

        const awsQRegion = runtime.getConfiguration('AWS_Q_REGION') ?? DEFAULT_AWS_Q_REGION
        const awsQEndpointUrl = runtime.getConfiguration('AWS_Q_ENDPOINT_URL') ?? DEFAULT_AWS_Q_ENDPOINT_URL

        const telemetryService = new TelemetryService(
            credentialsProvider,
            'bearer',
            telemetry,
            logging,
            workspace,
            awsQRegion,
            awsQEndpointUrl,
            sdkInitializator
        )

        lsp.addInitializer((params: InitializeParams) => {
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

        logging.log('Q Chat server has been initialized')

        return () => {
            chatController?.dispose()
        }
    }
