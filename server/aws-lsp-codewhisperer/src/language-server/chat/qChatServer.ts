import { InitializeParams, Server } from '@aws/language-server-runtimes/server-interface'
import { ChatController } from './chatController'
import { ChatSessionManagementService } from './chatSessionManagementService'
import { CLEAR_QUICK_ACTION, HELP_QUICK_ACTION } from './quickActions'
import { TelemetryService } from '../../shared/telemetry/telemetryService'
import { makeUserContextObject } from '../../shared/telemetryUtils'
import {
    AmazonQBaseServiceManager,
    AmazonQServiceAPI,
} from '../../shared/amazonQServiceManager/BaseAmazonQServiceManager'
import { getOrThrowBaseTokenServiceManager } from '../../shared/amazonQServiceManager/AmazonQTokenServiceManager'
import { getOrThrowBaseIAMServiceManager } from '../../shared/amazonQServiceManager/AmazonQIAMServiceManager'

import { AmazonQWorkspaceConfig } from '../../shared/amazonQServiceManager/configurationUtils'

export const QChatServerFactory =
    (getServiceManager: () => AmazonQBaseServiceManager): Server =>
    features => {
        const { chat, credentialsProvider, lsp, telemetry, logging, runtime } = features

        const amazonQService = new AmazonQServiceAPI(getServiceManager)
        const telemetryService = new TelemetryService(amazonQService, credentialsProvider, telemetry, logging)

        const chatSessionManagementService =
            ChatSessionManagementService.getInstance().withAmazonQService(amazonQService)
        const chatController = new ChatController(
            chatSessionManagementService,
            features,
            telemetryService,
            amazonQService
        )

        lsp.addInitializer((params: InitializeParams) => {
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

        const updateConfigurationHandler = (updatedConfig: AmazonQWorkspaceConfig) => {
            logging.debug('Updating configuration of chat server')
            chatController.updateConfiguration(updatedConfig)
        }

        lsp.onInitialized(async () => {
            await amazonQService.addDidChangeConfigurationListener(updateConfigurationHandler)
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

        logging.log('Q Chat server has been initialized')

        return () => {
            chatController?.dispose()
        }
    }

export const QChatServerIAM = QChatServerFactory(getOrThrowBaseIAMServiceManager)
export const QChatServerToken = QChatServerFactory(getOrThrowBaseTokenServiceManager)
