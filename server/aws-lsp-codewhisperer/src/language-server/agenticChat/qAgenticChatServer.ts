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
import { safeGet } from '../../shared/utils'
import { AmazonQServiceInitializationError } from '../../shared/amazonQServiceManager/errors'
import { AmazonQWorkspaceConfig } from '../../shared/amazonQServiceManager/configurationUtils'
import { TabBarController } from './tabBarController'

export const QAgenticChatServer =
    // prettier-ignore
    (): Server => features => {
        const { chat, credentialsProvider, telemetry, logging, lsp, runtime, agent } = features

        let amazonQServiceManager: AmazonQTokenServiceManager
        let chatController: AgenticChatController
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

            chatController = new AgenticChatController(chatSessionManagementService, features, telemetryService, amazonQServiceManager)

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

        agent.addTool({
            name: 'count_input',
            description: 'Count the length of the prompt',
            inputSchema: {
                type: 'object',
                properties: {
                    prompt: {
                        type: 'string',
                    },
                },
                required: ['prompt'],
            },
        } as const, async input => {
            return input.prompt?.length
        })

        agent.addTool({
            name: 'get_open_workspace_files',
            description: 'Use the LSP document synchronization to read a list of all open documents in the current workspace',
            inputSchema: {
                type: 'object',
                properties: {
                    filter: {
                        type: 'string',
                        description: 'An optional case-insensitive string to filter on. Does not support wildcards, so only exact substrings match.'
                    }
                }
            }
        } as const, async (input) => 
            (await features.workspace.getAllTextDocuments()).map(td => td.uri).filter(uri => input.filter === undefined || uri.includes(input.filter))
        )

        agent.addTool({
            name: 'get_workspace_file_contents',
            description: `Use the LSP document synchronization to read the contents of one or more files in the workspace. Use \`get_open_workspace_files\` first to get a list of available document URIs.
If a file is not open, use the \`fsRead\` tool to read from disk. Use this tool if the user might have local edits that are not yet saved on disk.`,
            inputSchema: {
                type: 'object',
                properties: {
                    paths: {
                        type: 'array',
                        description: 'A list of URIs to read.',
                        items: {
                            type: 'string',
                            description: 'The URI of a document to read'
                        }
                    }
                },
                required: ['paths']
            }
        } as const, async (input) => 
            input.paths.reduce(async (acc, path) => {
                const doc = await features.workspace.getTextDocument(path)
                if (doc) {
                    (await acc)[path] = doc.getText()
                }
                return acc
            }, Promise.resolve<Record<string, string>>({}))
        )

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

        chat.onListConversations(params => {
            return chatController.onListConversations(params)
        })

        chat.onConversationClick(params => {
            return chatController.onConversationClick(params)
        })

        chat.onTabBarAction(params => {
            return chatController.onTabBarAction(params)
        })

        logging.log('Q Chat server has been initialized')

        return () => {
            chatController?.dispose()
        }
    }
