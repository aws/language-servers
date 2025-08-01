/**
 * Copied from ../qChatServer.ts for the purpose of developing a divergent implementation.
 * Will be deleted or merged.
 */

import { InitializeParams, Server } from '@aws/language-server-runtimes/server-interface'
import { AgenticChatController } from './agenticChatController'
import { ChatSessionManagementService } from '../chat/chatSessionManagementService'
import { CLEAR_QUICK_ACTION, COMPACT_QUICK_ACTION, HELP_QUICK_ACTION } from '../chat/quickActions'
import { TelemetryService } from '../../shared/telemetry/telemetryService'
import { makeUserContextObject } from '../../shared/telemetryUtils'
import { AmazonQBaseServiceManager } from '../../shared/amazonQServiceManager/BaseAmazonQServiceManager'
import { getOrThrowBaseTokenServiceManager } from '../../shared/amazonQServiceManager/AmazonQTokenServiceManager'
import { getOrThrowBaseIAMServiceManager } from '../../shared/amazonQServiceManager/AmazonQIAMServiceManager'
import { AmazonQWorkspaceConfig } from '../../shared/amazonQServiceManager/configurationUtils'
import { TabBarController } from './tabBarController'
import { AmazonQServiceInitializationError } from '../../shared/amazonQServiceManager/errors'
import { isUsingIAMAuth, safeGet } from '../../shared/utils'
import { enabledMCP } from './tools/mcp/mcpUtils'
import { QClientCapabilities } from '../configuration/qConfigurationServer'

export function enabledReroute(params: InitializeParams | undefined): boolean {
    const qCapabilities = params?.initializationOptions?.aws?.awsClientCapabilities?.q as
        | QClientCapabilities
        | undefined
    return qCapabilities?.reroute || false
}

export function enabledCodeReviewInChat(params: InitializeParams | undefined): boolean {
    const qCapabilities = params?.initializationOptions?.aws?.awsClientCapabilities?.q as
        | QClientCapabilities
        | undefined
    return qCapabilities?.codeReviewInChat || false
}

export function enableShortcut(params: InitializeParams | undefined): boolean {
    const qCapabilities = params?.initializationOptions?.aws?.awsClientCapabilities?.q as
        | QClientCapabilities
        | undefined
    return qCapabilities?.shortcut || false
}

export const QAgenticChatServer =
    // prettier-ignore
    (): Server => features => {
        const { chat, credentialsProvider, telemetry, logging, lsp, runtime, agent } = features

        // AmazonQTokenServiceManager and TelemetryService are initialized in `onInitialized` handler to make sure Language Server connection is started
        let amazonQServiceManager: AmazonQBaseServiceManager
        let telemetryService: TelemetryService

        let chatController: AgenticChatController
        let chatSessionManagementService: ChatSessionManagementService

        lsp.addInitializer((params: InitializeParams) => {
            const rerouteEnabled = enabledReroute(params)
            const codeReviewInChatEnabled = enabledCodeReviewInChat(params)
            const quickActions = [HELP_QUICK_ACTION, CLEAR_QUICK_ACTION, COMPACT_QUICK_ACTION]
            const shortcutEnabled = enableShortcut(params)

            return {
                capabilities: {
                    executeCommandProvider: {
                        commands: [
                            'aws/chat/manageSubscription',
                        ],
                    }
                },
                awsServerCapabilities: {
                    chatOptions: {
                        quickActions: {
                            quickActionsCommandGroups: [
                                {
                                    commands: quickActions,
                                },
                            ],
                        },
                        mcpServers: enabledMCP(params),
                        // we should set it as true for current VSC and VS clients
                        modelSelection: true,
                        history: true,
                        export: TabBarController.enableChatExport(params),
                        shortcut: shortcutEnabled,
                        showLogs: TabBarController.enableShowLogs(params),
                        reroute: rerouteEnabled,
                        codeReviewInChat: codeReviewInChatEnabled
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
            logging.info(`In IAM Auth mode: ${isUsingIAMAuth()}`)
            amazonQServiceManager = isUsingIAMAuth() ? getOrThrowBaseIAMServiceManager() : getOrThrowBaseTokenServiceManager()
            chatSessionManagementService =
                ChatSessionManagementService.getInstance().withAmazonQServiceManager(amazonQServiceManager, features.lsp)

            telemetryService = new TelemetryService(amazonQServiceManager, credentialsProvider, telemetry, logging)

            const clientParams = safeGet(
                lsp.getClientInitializeParams(),
                new AmazonQServiceInitializationError(
                    'TelemetryService initialized before LSP connection was initialized.'
                )
            )

            const userContext = makeUserContextObject(clientParams, runtime.platform, 'CHAT')
            telemetryService.updateUserContext(userContext)

            chatController = new AgenticChatController(
                chatSessionManagementService,
                features,
                telemetryService,
                amazonQServiceManager
            )

            if (!isUsingIAMAuth()) {
                chatController.scheduleABTestingFetching(userContext)
            }

            await amazonQServiceManager.addDidChangeConfigurationListener(updateConfigurationHandler)
        })

        lsp.onExecuteCommand((params, token) => {
            return chatController.onExecuteCommand(params, token)
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

        chat.onOpenFileDialog((params, token) => {
            logging.log("Open File System")
            return chatController.onOpenFileDialog(params, token)
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

        chat.onListRules(params => {
            return chatController.onListRules(params)
        })

        chat.onConversationClick(params => {
            return chatController.onConversationClick(params)
        })

        chat.onRuleClick(params => {
            return chatController.onRuleClick(params)
        })

        chat.onListMcpServers(params => {
            return chatController.onListMcpServers(params)
        })

        chat.onMcpServerClick(params => {
            return chatController.onMcpServerClick(params)
        })

        chat.onCreatePrompt((params) => {
            return chatController.onCreatePrompt(params)
        })

        chat.onFileClicked((params) => {
            return chatController.onFileClicked(params)
        })

        chat.onFollowUpClicked((params) => {
            return chatController.onFollowUpClicked(params)
        })

        chat.onTabBarAction(params => {
            return chatController.onTabBarAction(params)
        })

        chat.onPromptInputOptionChange(params => {
            return chatController.onPromptInputOptionChange(params)
        })

        // ;(chat as any).onPromptInputButtonClick((params: any) => {
        //     chatController.setPaidTierMode(params.tabId, 'paidtier')
        // })

        chat.onButtonClick(params => {
            return chatController.onButtonClick(params)
        })

        chat.onInlineChatResult(params => {
            return chatController.onInlineChatResult(params)
        })

        chat.onActiveEditorChanged(params => {
            return chatController.onActiveEditorChanged(params)
        })

        chat.onPinnedContextAdd(params => {
            return chatController.onPinnedContextAdd(params)
        })

        chat.onPinnedContextRemove(params => {
            return chatController.onPinnedContextRemove(params)
        })

        chat.onListAvailableModels(params => {
            return chatController.onListAvailableModels(params)
        })

        logging.log('Q Chat server has been initialized')

        return () => {
            chatController?.dispose()
        }
    }
