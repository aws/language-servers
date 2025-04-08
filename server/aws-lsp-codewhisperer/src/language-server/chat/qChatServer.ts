import { InitializeParams, Server } from '@aws/language-server-runtimes/server-interface'
import { ChatController } from './chatController'
import { ChatSessionManagementService } from './chatSessionManagementService'
import { CLEAR_QUICK_ACTION, HELP_QUICK_ACTION } from './quickActions'
import { TelemetryService } from '../../shared/telemetry/telemetryService'
import { makeUserContextObject } from '../../shared/telemetryUtils'
import { AmazonQTokenServiceManager } from '../../shared/amazonQServiceManager/AmazonQTokenServiceManager'
import { AmazonQServiceInitializationError } from '../../shared/amazonQServiceManager/errors'
import { safeGet } from '../../shared/utils'
import { AmazonQWorkspaceConfig } from '../../shared/amazonQServiceManager/configurationUtils'

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

        const updateConfigurationHandler = (updatedConfig: AmazonQWorkspaceConfig) => {
            logging.debug('Updating configuration of chat server')
            chatController.updateConfiguration(updatedConfig)
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

            chatController = new ChatController(chatSessionManagementService, features, telemetryService, amazonQServiceManager)

            /* 
                Calling handleDidChangeConfiguration once to ensure we get configuration atleast once at start up
                
                TODO: TODO: consider refactoring such responsibilities to common service manager config/initialisation server
            */
            await amazonQServiceManager.handleDidChangeConfiguration()
            await amazonQServiceManager.addDidChangeConfigurationListener(updateConfigurationHandler)
        })

        chat.onTabAdd(params => {
            logging.log(`Adding tab: ${params.tabId}`)

            chat.sendContextCommands({
                contextCommandGroups: [
                    {
                        commands: [{
                            command: 'Prompts',
                            children: [
                                {
                                    groupName: 'Prompts',
                                    commands: [
                                        {
                                            command: 'Create a new prompt',
                                            id: 'create-saved-prompt',
                                            icon: 'list-add',
                                        }
                                    ],
                                },
                            ],
                            description: 'Prompts',
                            icon: 'magic',
                        },
                        {
                            command: 'Prompts',
                            children: [
                                {
                                    groupName: 'Prompts',
                                    commands: [
                                        {
                                            command: 'Create a new prompt',
                                            id: 'create-saved-prompt',
                                            icon: 'list-add',
                                        }
                                    ],
                                },
                            ],
                            description: 'Prompts',
                            icon: 'magic',
                        },
                        {
                            command: 'Folders',
                            children: [
                                {
                                    groupName: 'Folders',
                                    commands: [
                                        {
                                            command: 'types',
                                            description: '/ws/types',
                                            route: ['ws', 'types'],
                                            label: 'folder',
                                            id: '1',
                                            icon: 'folder',
                                        },
                                        {
                                            command: 'README2.MD',
                                            description: '/ws/README2.MD',
                                            route: ['ws', 'README2.MD'],
                                            label: 'file',
                                            id: '1',
                                            icon: 'file',
                                        }
                                    ],
                                }
                            ]
                        }
                        ]
                    }
                ]
            })

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

        chat.onListConversations((...params) => {
            logging.log('Received list conversations')
            return chatController.onListConversations(...params)
        })

        logging.log('Q Chat server has been initialized')

        return () => {
            chatController?.dispose()
        }
    }
