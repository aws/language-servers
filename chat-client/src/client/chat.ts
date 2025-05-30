/* eslint-disable prefer-const */
/**
 * @fileoverview
 * Core module for the Q Chat Client that initializes the chat interface and establishes
 * bidirectional communication between the UI and the host application.
 *
 * This module follows a layered architecture pattern:
 * - UI Layer: MynahUI component renders the chat interface
 * - Messaging Layer: Handles communication between UI and host application
 * - Event Handling Layer: Routes events to appropriate handlers
 */
import {
    AUTH_FOLLOW_UP_CLICKED,
    AuthFollowUpClickedParams,
    CHAT_OPTIONS,
    ChatOptionsMessage,
    COPY_TO_CLIPBOARD,
    CopyCodeToClipboardParams,
    ERROR_MESSAGE,
    ErrorMessage,
    FeatureContext,
    GENERIC_COMMAND,
    GenericCommandMessage,
    INSERT_TO_CURSOR_POSITION,
    InsertToCursorPositionParams,
    SEND_TO_PROMPT,
    SendToPromptMessage,
    UiMessage,
    DISCLAIMER_ACKNOWLEDGED,
    ErrorResult,
    UiResultMessage,
    CHAT_PROMPT_OPTION_ACKNOWLEDGED,
    STOP_CHAT_RESPONSE,
    OPEN_SETTINGS,
} from '@aws/chat-client-ui-types'
import {
    BUTTON_CLICK_REQUEST_METHOD,
    CHAT_OPTIONS_UPDATE_NOTIFICATION_METHOD,
    CHAT_REQUEST_METHOD,
    CHAT_UPDATE_NOTIFICATION_METHOD,
    CONTEXT_COMMAND_NOTIFICATION_METHOD,
    CONVERSATION_CLICK_REQUEST_METHOD,
    CREATE_PROMPT_NOTIFICATION_METHOD,
    ChatMessage,
    ChatOptionsUpdateParams,
    ChatParams,
    ChatUpdateParams,
    ContextCommandParams,
    ConversationClickParams,
    ConversationClickResult,
    CreatePromptParams,
    FEEDBACK_NOTIFICATION_METHOD,
    FILE_CLICK_NOTIFICATION_METHOD,
    FOLLOW_UP_CLICK_NOTIFICATION_METHOD,
    FeedbackParams,
    FileClickParams,
    FollowUpClickParams,
    GET_SERIALIZED_CHAT_REQUEST_METHOD,
    GetSerializedChatParams,
    GetSerializedChatResult,
    INFO_LINK_CLICK_NOTIFICATION_METHOD,
    InfoLinkClickParams,
    LINK_CLICK_NOTIFICATION_METHOD,
    LIST_CONVERSATIONS_REQUEST_METHOD,
    LinkClickParams,
    ListConversationsParams,
    ListConversationsResult,
    OPEN_TAB_REQUEST_METHOD,
    OpenTabParams,
    OpenTabResult,
    PROMPT_INPUT_OPTION_CHANGE_METHOD,
    PromptInputOptionChangeParams,
    QUICK_ACTION_REQUEST_METHOD,
    QuickActionParams,
    READY_NOTIFICATION_METHOD,
    SOURCE_LINK_CLICK_NOTIFICATION_METHOD,
    SourceLinkClickParams,
    TAB_ADD_NOTIFICATION_METHOD,
    TAB_BAR_ACTION_REQUEST_METHOD,
    TAB_CHANGE_NOTIFICATION_METHOD,
    TAB_REMOVE_NOTIFICATION_METHOD,
    TabAddParams,
    TabBarActionParams,
    TabChangeParams,
    TabRemoveParams,
} from '@aws/language-server-runtimes-types'
import { MynahUIDataModel, MynahUITabStoreModel } from '@aws/mynah-ui'
import { ServerMessage, TELEMETRY, TelemetryParams } from '../contracts/serverContracts'
import { Messager, OutboundChatApi } from './messager'
import { InboundChatApi, createMynahUi } from './mynahUi'
import { TabFactory } from './tabs/tabFactory'
import { ChatClientAdapter } from '../contracts/chatClientAdapter'
import { toMynahContextCommand, toMynahIcon } from './utils'

const getDefaultTabConfig = (agenticMode?: boolean) => {
    return {
        tabTitle: 'Chat',
        promptInputInfo:
            'Amazon Q Developer uses generative AI. You may need to verify responses. See the [AWS Responsible AI Policy](https://aws.amazon.com/machine-learning/responsible-ai/policy/).',
        promptInputPlaceholder: `Ask a question. Use${agenticMode ? ' @ to add context,' : ''} / for quick actions`,
    }
}

type ChatClientConfig = Pick<MynahUIDataModel, 'quickActionCommands'> & {
    disclaimerAcknowledged?: boolean
    pairProgrammingAcknowledged?: boolean
    agenticMode?: boolean
    modelSelectionEnabled?: boolean
}

export const createChat = (
    clientApi: { postMessage: (msg: UiMessage | UiResultMessage | ServerMessage) => void },
    config?: ChatClientConfig,
    chatClientAdapter?: ChatClientAdapter,
    featureConfigSerialized?: string
) => {
    let mynahApi: InboundChatApi

    const sendMessageToClient = (message: UiMessage | UiResultMessage | ServerMessage) => {
        clientApi.postMessage(message)
    }

    const parseFeatureConfig = (featureConfigSerialized?: string): Map<string, FeatureContext> => {
        try {
            const parsed = JSON.parse(featureConfigSerialized || '[]')
            return new Map<string, FeatureContext>(parsed)
        } catch (error) {
            console.error('Error parsing feature config:', featureConfigSerialized, error)
        }
        return new Map()
    }

    const featureConfig: Map<string, FeatureContext> = parseFeatureConfig(featureConfigSerialized)

    /**
     * Handles incoming messages from the IDE or other sources.
     * Routes messages to appropriate handlers based on command type.
     *
     * 1. Messages with a 'sender' property are routed to the external connector
     *    if one is configured. This supports legacy systems and extensions.
     *
     * 2. Messages without a 'sender' property are processed by the standard
     *    command-based router, which dispatches based on the 'command' field.
     *
     * @param event - The message event containing data from the IDE
     */
    const handleInboundMessage = (event: MessageEvent): void => {
        if (event.data === undefined) {
            return
        }
        const message = event.data

        // 'message.sender' field is used by IDE connector logic to route messages through Chat Client to injected Connector.
        // When detected, chat client will delegate message handling back to IDE connectors.
        if (message?.sender && chatClientAdapter) {
            const connectorEvent = new MessageEvent('message', { data: JSON.stringify(message) })
            chatClientAdapter.handleMessageReceive(connectorEvent)
            return
        }

        switch (message?.command) {
            case CHAT_REQUEST_METHOD:
                mynahApi.addChatResponse(message.params, message.tabId, message.isPartialResult)
                break
            case CHAT_UPDATE_NOTIFICATION_METHOD:
                mynahApi.updateChat(message.params as ChatUpdateParams)
                break
            case OPEN_TAB_REQUEST_METHOD:
                mynahApi.openTab(message.requestId, message.params as OpenTabParams)
                break
            case SEND_TO_PROMPT:
                mynahApi.sendToPrompt((message as SendToPromptMessage).params)
                break
            case GENERIC_COMMAND:
                mynahApi.sendGenericCommand((message as GenericCommandMessage).params)
                break
            case ERROR_MESSAGE:
                mynahApi.showError((message as ErrorMessage).params)
                break
            case CONTEXT_COMMAND_NOTIFICATION_METHOD:
                mynahApi.sendContextCommands(message.params as ContextCommandParams)
                break
            case LIST_CONVERSATIONS_REQUEST_METHOD:
                mynahApi.listConversations(message.params as ListConversationsResult)
                break
            case CONVERSATION_CLICK_REQUEST_METHOD:
                mynahApi.conversationClicked(message.params as ConversationClickResult)
                break
            case GET_SERIALIZED_CHAT_REQUEST_METHOD:
                mynahApi.getSerializedChat(message.requestId, message.params as GetSerializedChatParams)
                break
            case CHAT_OPTIONS_UPDATE_NOTIFICATION_METHOD:
                if (message.params.modelId !== undefined) {
                    const tabId = message.params.tabId
                    const options = mynahUi.getTabData(tabId).getStore()?.promptInputOptions
                    mynahUi.updateStore(tabId, {
                        promptInputOptions: options?.map(option =>
                            option.id === 'model-selection' ? { ...option, value: message.params.modelId } : option
                        ),
                    })
                } else {
                    tabFactory.setInfoMessages((message.params as ChatOptionsUpdateParams).chatNotifications)
                }
                break
            case CHAT_OPTIONS: {
                const params = (message as ChatOptionsMessage).params

                if (params?.chatNotifications) {
                    tabFactory.setInfoMessages((message.params as ChatOptionsUpdateParams).chatNotifications)
                }

                if (params?.quickActions?.quickActionsCommandGroups) {
                    const quickActionCommandGroups = params.quickActions.quickActionsCommandGroups.map(group => ({
                        ...group,
                        commands: group.commands.map(command => ({
                            ...command,
                            icon: toMynahIcon(command.icon),
                        })),
                    }))
                    tabFactory.updateQuickActionCommands(quickActionCommandGroups)
                }

                if (params?.history) {
                    tabFactory.enableHistory()
                }

                if (params?.export) {
                    tabFactory.enableExport()
                }

                const allExistingTabs: MynahUITabStoreModel = mynahUi.getAllTabs()
                const highlightCommand = featureConfig.get('highlightCommand')

                if (tabFactory.initialTabId && allExistingTabs[tabFactory.initialTabId] && params?.chatNotifications) {
                    // Edge case: push banner message to initial tab when ChatOptions are received
                    // Because initial tab is added to MynahUi store at initialisation,
                    // that tab does not have banner message, which arrives in ChatOptions above.
                    const store = mynahUi.getTabData(tabFactory.initialTabId)?.getStore() || {}
                    const chatItems = store.chatItems || []
                    const updatedInitialItems = tabFactory.getChatItems(false, false, chatItems as ChatMessage[])

                    // First clear the tab, so that messages are not appended https://github.com/aws/mynah-ui/blob/38608dff905b3790d85c73e2911ec7071c8a8cdf/docs/USAGE.md#using-updatestore-function
                    mynahUi.updateStore(tabFactory.initialTabId, {
                        chatItems: [],
                    })
                    mynahUi.updateStore(tabFactory.initialTabId, {
                        chatItems: updatedInitialItems,
                    })
                }

                for (const tabId in allExistingTabs) {
                    mynahUi.updateStore(tabId, {
                        ...tabFactory.getDefaultTabData(),
                        contextCommands: highlightCommand
                            ? [
                                  {
                                      groupName: 'Additional Commands',
                                      commands: [toMynahContextCommand(highlightCommand)],
                                  },
                              ]
                            : [],
                    })
                }
                break
            }
            default:
                // TODO: Report error?
                break
        }
    }

    const chatApi: OutboundChatApi = {
        sendChatPrompt: (params: ChatParams) => {
            sendMessageToClient({ command: CHAT_REQUEST_METHOD, params })
        },
        sendQuickActionCommand: (params: QuickActionParams) => {
            sendMessageToClient({ command: QUICK_ACTION_REQUEST_METHOD, params })
        },
        telemetry: (params: TelemetryParams) => {
            sendMessageToClient({ command: TELEMETRY, params })
        },
        tabAdded: (params: TabAddParams) => {
            sendMessageToClient({ command: TAB_ADD_NOTIFICATION_METHOD, params })
        },
        tabChanged: (params: TabChangeParams) => {
            sendMessageToClient({ command: TAB_CHANGE_NOTIFICATION_METHOD, params })
        },
        tabRemoved: (params: TabRemoveParams) => {
            sendMessageToClient({ command: TAB_REMOVE_NOTIFICATION_METHOD, params })
        },
        insertToCursorPosition: (params: InsertToCursorPositionParams) => {
            sendMessageToClient({ command: INSERT_TO_CURSOR_POSITION, params })
        },
        copyToClipboard: (params: CopyCodeToClipboardParams) => {
            sendMessageToClient({ command: COPY_TO_CLIPBOARD, params })
        },
        authFollowUpClicked: (params: AuthFollowUpClickedParams) => {
            sendMessageToClient({ command: AUTH_FOLLOW_UP_CLICKED, params })
        },
        followUpClicked: (params: FollowUpClickParams) => {
            sendMessageToClient({ command: FOLLOW_UP_CLICK_NOTIFICATION_METHOD, params })
        },
        sendFeedback: (params: FeedbackParams) => {
            sendMessageToClient({ command: FEEDBACK_NOTIFICATION_METHOD, params })
        },
        linkClick: (params: LinkClickParams) => {
            sendMessageToClient({ command: LINK_CLICK_NOTIFICATION_METHOD, params })
        },
        sourceLinkClick: (params: SourceLinkClickParams) => {
            sendMessageToClient({ command: SOURCE_LINK_CLICK_NOTIFICATION_METHOD, params })
        },
        infoLinkClick: (params: InfoLinkClickParams) => {
            sendMessageToClient({ command: INFO_LINK_CLICK_NOTIFICATION_METHOD, params })
        },
        uiReady: () => {
            sendMessageToClient({
                command: READY_NOTIFICATION_METHOD,
            })

            window.addEventListener('message', handleInboundMessage)
        },
        disclaimerAcknowledged: () => {
            sendMessageToClient({ command: DISCLAIMER_ACKNOWLEDGED })
        },
        chatPromptOptionAcknowledged: (messageId: string) => {
            sendMessageToClient({
                command: CHAT_PROMPT_OPTION_ACKNOWLEDGED,
                params: {
                    messageId,
                },
            })
        },
        onOpenTab: (requestId: string, params: OpenTabResult | ErrorResult) => {
            if ('tabId' in params) {
                sendMessageToClient({
                    requestId: requestId,
                    command: OPEN_TAB_REQUEST_METHOD,
                    params: {
                        success: true,
                        result: params as OpenTabResult,
                    },
                })
            } else {
                sendMessageToClient({
                    requestId: requestId,
                    command: OPEN_TAB_REQUEST_METHOD,
                    params: {
                        success: false,
                        error: params as ErrorResult,
                    },
                })
            }
        },
        createPrompt: (params: CreatePromptParams) => {
            sendMessageToClient({ command: CREATE_PROMPT_NOTIFICATION_METHOD, params })
        },
        fileClick: (params: FileClickParams) => {
            sendMessageToClient({ command: FILE_CLICK_NOTIFICATION_METHOD, params: params })
        },
        listConversations: (params: ListConversationsParams) => {
            sendMessageToClient({ command: LIST_CONVERSATIONS_REQUEST_METHOD, params })
        },
        conversationClick: (params: ConversationClickParams) => {
            sendMessageToClient({ command: CONVERSATION_CLICK_REQUEST_METHOD, params })
        },
        tabBarAction: (params: TabBarActionParams) => {
            sendMessageToClient({ command: TAB_BAR_ACTION_REQUEST_METHOD, params })
        },
        onGetSerializedChat: (requestId: string, params: GetSerializedChatResult | ErrorResult) => {
            if ('content' in params) {
                sendMessageToClient({
                    requestId: requestId,
                    command: GET_SERIALIZED_CHAT_REQUEST_METHOD,
                    params: {
                        success: true,
                        result: params as GetSerializedChatResult,
                    },
                })
            } else {
                sendMessageToClient({
                    requestId: requestId,
                    command: GET_SERIALIZED_CHAT_REQUEST_METHOD,
                    params: {
                        success: false,
                        error: params as ErrorResult,
                    },
                })
            }
        },
        promptInputOptionChange: (params: PromptInputOptionChangeParams) => {
            sendMessageToClient({ command: PROMPT_INPUT_OPTION_CHANGE_METHOD, params })
        },
        stopChatResponse: (tabId: string) => {
            sendMessageToClient({ command: STOP_CHAT_RESPONSE, params: { tabId } })
        },
        sendButtonClickEvent: params => {
            sendMessageToClient({ command: BUTTON_CLICK_REQUEST_METHOD, params: params })
        },
        onOpenSettings: (settingKey: string) => {
            sendMessageToClient({ command: OPEN_SETTINGS, params: { settingKey } })
        },
    }

    const messager = new Messager(chatApi)
    const tabFactory = new TabFactory(getDefaultTabConfig(config?.agenticMode), [
        ...(config?.quickActionCommands ? config.quickActionCommands : []),
    ])

    if (config?.agenticMode) {
        tabFactory.enableAgenticMode()
    }

    if (config?.modelSelectionEnabled) {
        tabFactory.enableModelSelection()
    }

    const [mynahUi, api] = createMynahUi(
        messager,
        tabFactory,
        config?.disclaimerAcknowledged ?? false,
        config?.pairProgrammingAcknowledged ?? false,
        chatClientAdapter,
        featureConfig,
        !!config?.agenticMode
    )

    mynahApi = api

    return mynahUi
}
