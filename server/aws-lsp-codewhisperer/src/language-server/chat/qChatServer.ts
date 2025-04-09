import { InitializeParams, Server } from '@aws/language-server-runtimes/server-interface'
import { ChatController } from './chatController'
import { ChatSessionManagementService } from './chatSessionManagementService'
import { CLEAR_QUICK_ACTION, HELP_QUICK_ACTION } from './quickActions'
import { TelemetryService } from '../../shared/telemetry/telemetryService'
import { makeUserContextObject } from '../../shared/telemetryUtils'
import {
    AmazonQBaseServiceManager,
    QServiceManagerFeatures,
} from '../../shared/amazonQServiceManager/BaseAmazonQServiceManager'
import { initBaseTokenServiceManager } from '../../shared/amazonQServiceManager/AmazonQTokenServiceManager'
import { initBaseIAMServiceManager } from '../../shared/amazonQServiceManager/AmazonQIAMServiceManager'
import { AmazonQServiceInitializationError } from '../../shared/amazonQServiceManager/errors'
import { safeGet } from '../../shared/utils'
import { AmazonQWorkspaceConfig } from '../../shared/amazonQServiceManager/configurationUtils'
import { Features } from '../types'

export const QChatServerFactory =
    (serviceManager: (features: QServiceManagerFeatures) => AmazonQBaseServiceManager): Server =>
    ({
        chat,
        credentialsProvider,
        lsp,
        workspace,
        telemetry,
        logging,
        runtime,
        sdkInitializator,
        identityManagement,
        notification,
        agent,
    }) => {
        const features: Features = {
            chat,
            credentialsProvider,
            lsp,
            workspace,
            telemetry,
            logging,
            runtime,
            sdkInitializator,
            identityManagement,
            notification,
            agent,
        }
        // AmazonQTokenServiceManager and TelemetryService are initialized in `onInitialized` handler to make sure Language Server connection is started
        let amazonQServiceManager: AmazonQBaseServiceManager
        let telemetryService: TelemetryService

        let chatController: ChatController
        let chatSessionManagementService: ChatSessionManagementService

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

        const updateConfigurationHandler = (updatedConfig: AmazonQWorkspaceConfig) => {
            logging.debug('Updating configuration of chat server')
            chatController.updateConfiguration(updatedConfig)
        }

        lsp.onInitialized(async () => {
            // Initialize service manager and inject it to chatSessionManagementService to pass it down
            amazonQServiceManager = serviceManager(features)
            chatSessionManagementService =
                ChatSessionManagementService.getInstance().withAmazonQServiceManager(amazonQServiceManager)

            telemetryService = new TelemetryService(amazonQServiceManager, credentialsProvider, telemetry, logging)

            const clientParams = safeGet(
                lsp.getClientInitializeParams(),
                new AmazonQServiceInitializationError(
                    'TelemetryService initialized before LSP connection was initialized.'
                )
            )

            telemetryService.updateUserContext(makeUserContextObject(clientParams, runtime.platform, 'CHAT'))

            chatController = new ChatController(
                chatSessionManagementService,
                features,
                telemetryService,
                amazonQServiceManager
            )

            /* 
                                Calling handleDidChangeConfiguration once to ensure we get configuration atleast once at start up
                                
                                TODO: TODO: consider refactoring such responsibilities to common service manager config/initialisation server
                            */
            await amazonQServiceManager.handleDidChangeConfiguration()
            await amazonQServiceManager.addDidChangeConfigurationListener(updateConfigurationHandler)
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

        chat.onInlineChatPrompt((...params) => {
            logging.log('Received inline chat prompt')
            return chatController.onInlineChatPrompt(...params)
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

        chat.onLogInlineChatResult(params => {
            return chatController.onLogInlineChatResult(params)
        })

        logging.log('Q Chat server has been initialized')

        return () => {
            chatController?.dispose()
        }
    }

export const QChatServerIAM = QChatServerFactory(initBaseIAMServiceManager)
export const QChatServerToken = QChatServerFactory(initBaseTokenServiceManager)
