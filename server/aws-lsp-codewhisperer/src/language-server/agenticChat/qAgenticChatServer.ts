/**
 * Copied from ../qChatServer.ts for the purpose of developing a divergent implementation.
 * Will be deleted or merged.
 */

import { InitializeParams, Server } from '@aws/language-server-runtimes/server-interface'
import { AgenticChatController } from './agenticChatController'
import { ChatSessionManagementService } from '../chat/chatSessionManagementService'
import { CLEAR_QUICK_ACTION, HELP_QUICK_ACTION } from '../chat/quickActions'
import { TelemetryService } from '../../shared/telemetry/telemetryService'
import { makeUserContextObject } from '../../shared/telemetryUtils'
import { AmazonQTokenServiceManager } from '../../shared/amazonQServiceManager/AmazonQTokenServiceManager'
import { AmazonQWorkspaceConfig } from '../../shared/amazonQServiceManager/configurationUtils'
import { TabBarController } from './tabBarController'
import { AmazonQServiceInitializationError } from '../../shared/amazonQServiceManager/errors'
import { safeGet } from '../../shared/utils'

export const QAgenticChatServer =
    // prettier-ignore
    (): Server => features => {
        const { chat, credentialsProvider, telemetry, logging, lsp, runtime, agent } = features

        // AmazonQTokenServiceManager and TelemetryService are initialized in `onInitialized` handler to make sure Language Server connection is started
        let amazonQServiceManager: AmazonQTokenServiceManager
        let telemetryService: TelemetryService

        let chatController: AgenticChatController
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
                        history: true,
                        export: TabBarController.enableChatExport(params)
                    },
                },
            }
        })

        const updateConfigurationHandler = (updatedConfig: AmazonQWorkspaceConfig) => {
            logging.debug('Updating configuration of agentic chat server')
            chatController.updateConfiguration(updatedConfig)
        }

        lsp.onInitialized(async () => {
            // Get initialized service manager and inject it to chatSessionManagementService to pass it down
            amazonQServiceManager = AmazonQTokenServiceManager.getInstance()
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

            chatController = new AgenticChatController(
                chatSessionManagementService,
                features,
                telemetryService,
                amazonQServiceManager
            )

            await amazonQServiceManager.addDidChangeConfigurationListener(updateConfigurationHandler)
        })

        chat.onTabAdd(params => {
            logging.log(`Adding tab: ${params.tabId}`)

            return chatController.onTabAdd(params)
        })
        chat.onReady(() => {
            logging.log(`Received ready notification`)
            return chatController.onReady()
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

        chat.onChatPrompt((params, token) => {
            logging.log('Received chat prompt')
            return chatController.onChatPrompt(params, token)
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

        chat.onListConversations(params => {
            return chatController.onListConversations(params)
        })

        chat.onConversationClick(params => {
            return chatController.onConversationClick(params)
        })

        chat.onCreatePrompt((params) => {
            return chatController.onCreatePrompt(params)
        })

        chat.onFileClicked((params) => {
            return chatController.onFileClicked(params)
        })

        chat.onTabBarAction(params => {
            return chatController.onTabBarAction(params)
        })

        chat.onPromptInputOptionChange(params => {
            return chatController.onPromptInputOptionChange(params)
        })

        chat.onButtonClick(params => {
            return chatController.onButtonClick(params)
        })

        chat.onInlineChatResult(params => {
            return chatController.onInlineChatResult(params)
        })

        logging.log('Q Chat server has been initialized')

        return () => {
            chatController?.dispose()
        }
    }
