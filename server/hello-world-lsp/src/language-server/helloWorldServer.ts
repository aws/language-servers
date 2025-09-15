import {
    Chat,
    ChatParams,
    CredentialsProvider,
    Logging,
    Lsp,
    QuickActionParams,
    QuickActionResult,
    Server,
    Telemetry,
    Workspace,
} from '@aws/language-server-runtimes/server-interface'
import {
    CancellationToken,
    CompletionItem,
    CompletionItemKind,
    CompletionList,
    CompletionParams,
    ExecuteCommandParams,
} from 'vscode-languageserver/node'
import { HelloWorldService } from './helloWorldService'

const HELLO_LOG_COMMAND = '/helloWorld/log'

export const HelloWorldServerFactory =
    (service: HelloWorldService): Server =>
    (features: {
        credentialsProvider: CredentialsProvider
        chat: Chat
        lsp: Lsp
        workspace: Workspace
        logging: Logging
        telemetry: Telemetry
    }) => {
        const { chat, lsp, logging } = features

        const onInitializedHandler = async () => {}

        const onCompletionHandler = async (
            _params: CompletionParams,
            _token: CancellationToken
        ): Promise<CompletionList> => {
            // For the example, we will always return these completion items
            const items: CompletionItem[] = [
                {
                    label: 'Hello World!!!',
                    kind: CompletionItemKind.Text,
                },
                {
                    label: 'Hello Developers!!!',
                    kind: CompletionItemKind.Text,
                },
            ]

            const completions: CompletionList = {
                isIncomplete: false,
                items,
            }

            return completions
        }

        const onExecuteCommandHandler = async (
            params: ExecuteCommandParams,
            _token: CancellationToken
        ): Promise<any> => {
            switch (params.command) {
                case HELLO_LOG_COMMAND:
                    service.logCommand()
                    break
            }
            return
        }

        lsp.addInitializer(() => {
            logging.log('The Hello World Capability has been initialised')

            return {
                capabilities: {
                    executeCommandProvider: {
                        commands: [HELLO_LOG_COMMAND],
                    },
                },
                awsServerCapabilities: {
                    chatOptions: {
                        quickActions: {
                            quickActionsCommandGroups: [
                                {
                                    groupName: 'Hello World Actions',
                                    commands: [
                                        {
                                            command: 'hello',
                                            description: 'Say Hello',
                                        },
                                        {
                                            command: 'world',
                                            description: 'World of Actions',
                                        },
                                    ],
                                },
                                {
                                    commands: [
                                        {
                                            command: 'help',
                                            description: 'Learn more about Amazon Q',
                                        },
                                        {
                                            command: 'clear',
                                            description: 'Clear this session',
                                        },
                                    ],
                                },
                            ],
                        },
                    },
                },
            }
        })
        lsp.onInitialized(onInitializedHandler)
        lsp.onCompletion(onCompletionHandler)
        lsp.onExecuteCommand(onExecuteCommandHandler)

        chat.onChatPrompt((params: ChatParams) => {
            return {
                body: `User said: "${params.prompt.prompt}"`,
            }
        })

        const onQuickAction = (params: QuickActionParams): QuickActionResult => {
            switch (params.quickAction) {
                case 'hello':
                    return {
                        body: 'Hello Quick Action response',
                    }
                case 'world':
                    return {
                        body: 'World Quick Action response',
                    }
                case 'clear':
                    return {
                        body: 'Clear Quick Action response',
                    }
                case 'help':
                    return {
                        body: 'Help Quick Action response',
                    }
                default:
                    logging.log(`[Hello world server] Unhandled quick action: ${params.quickAction}`)
                    return {
                        body: "I'm sorry, Dave. I'm afraid I can't do that",
                    }
            }
        }
        chat.onQuickAction(onQuickAction)

        logging.log('The Hello World Capability has been initialised')

        // disposable
        return () => {
            // Do nothing
        }
    }

const service = new HelloWorldService()
export const HelloWorldServer = HelloWorldServerFactory(service)
