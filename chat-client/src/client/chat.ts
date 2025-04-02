/* eslint-disable prefer-const */
import {
    AUTH_FOLLOW_UP_CLICKED,
    AuthFollowUpClickedParams,
    CHAT_OPTIONS,
    ChatOptionsMessage,
    COPY_TO_CLIPBOARD,
    CopyCodeToClipboardParams,
    ERROR_MESSAGE,
    ErrorMessage,
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
} from '@aws/chat-client-ui-types'
import {
    CHAT_REQUEST_METHOD,
    CONTEXT_COMMAND_NOTIFICATION_METHOD,
    ChatParams,
    ContextCommandParams,
    FEEDBACK_NOTIFICATION_METHOD,
    FOLLOW_UP_CLICK_NOTIFICATION_METHOD,
    FeedbackParams,
    FollowUpClickParams,
    INFO_LINK_CLICK_NOTIFICATION_METHOD,
    InfoLinkClickParams,
    LINK_CLICK_NOTIFICATION_METHOD,
    LinkClickParams,
    OPEN_TAB_REQUEST_METHOD,
    OpenTabParams,
    OpenTabResult,
    QUICK_ACTION_REQUEST_METHOD,
    QuickActionParams,
    READY_NOTIFICATION_METHOD,
    SOURCE_LINK_CLICK_NOTIFICATION_METHOD,
    SourceLinkClickParams,
    TAB_ADD_NOTIFICATION_METHOD,
    TAB_CHANGE_NOTIFICATION_METHOD,
    TAB_REMOVE_NOTIFICATION_METHOD,
    TabAddParams,
    TabChangeParams,
    TabRemoveParams,
} from '@aws/language-server-runtimes-types'
import { MynahUIDataModel, MynahUITabStoreModel } from '@aws/mynah-ui'
import { ServerMessage, TELEMETRY, TelemetryParams } from '../contracts/serverContracts'
import { Messager, OutboundChatApi } from './messager'
import { InboundChatApi, createMynahUi } from './mynahUi'
import { TabFactory } from './tabs/tabFactory'

const DEFAULT_TAB_DATA = {
    tabTitle: 'Chat',
    promptInputInfo:
        'Amazon Q Developer uses generative AI. You may need to verify responses. See the [AWS Responsible AI Policy](https://aws.amazon.com/machine-learning/responsible-ai/policy/).',
    promptInputPlaceholder: 'Ask a question or enter "/" for quick actions',
}

type ChatClientConfig = Pick<MynahUIDataModel, 'quickActionCommands'> & { disclaimerAcknowledged?: boolean }

export const createChat = (
    clientApi: { postMessage: (msg: UiMessage | UiResultMessage | ServerMessage) => void },
    config?: ChatClientConfig
) => {
    // eslint-disable-next-line semi
    let mynahApi: InboundChatApi

    const sendMessageToClient = (message: UiMessage | UiResultMessage | ServerMessage) => {
        clientApi.postMessage(message)
    }

    const handleMessage = (event: MessageEvent): void => {
        if (event.data === undefined) {
            return
        }
        const message = event.data

        switch (message?.command) {
            case CHAT_REQUEST_METHOD:
                mynahApi.addChatResponse(message.params, message.tabId, message.isPartialResult)
                break
            case OPEN_TAB_REQUEST_METHOD:
                mynahApi.openTab(message.params as OpenTabParams)
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
            case CHAT_OPTIONS: {
                const params = (message as ChatOptionsMessage).params
                const chatConfig: ChatClientConfig = params?.quickActions?.quickActionsCommandGroups
                    ? {
                          quickActionCommands: params.quickActions.quickActionsCommandGroups,
                      }
                    : {}

                tabFactory.updateDefaultTabData(chatConfig)

                const allExistingTabs: MynahUITabStoreModel = mynahUi.getAllTabs()
                for (const tabId in allExistingTabs) {
                    mynahUi.updateStore(tabId, chatConfig)
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

            window.addEventListener('message', handleMessage)
        },
        disclaimerAcknowledged: () => {
            sendMessageToClient({ command: DISCLAIMER_ACKNOWLEDGED })
        },
        onOpenTab: (params: OpenTabResult | ErrorResult) => {
            if ('tabId' in params) {
                sendMessageToClient({
                    command: OPEN_TAB_REQUEST_METHOD,
                    params: {
                        success: true,
                        result: params as OpenTabResult,
                    },
                })
            } else {
                sendMessageToClient({
                    command: OPEN_TAB_REQUEST_METHOD,
                    params: {
                        success: false,
                        error: params as ErrorResult,
                    },
                })
            }
        },
    }

    const messager = new Messager(chatApi)
    const tabFactory = new TabFactory({
        ...DEFAULT_TAB_DATA,
        ...(config?.quickActionCommands ? { quickActionCommands: config.quickActionCommands } : {}),
    })

    const [mynahUi, api] = createMynahUi(messager, tabFactory, config?.disclaimerAcknowledged ?? false)

    mynahApi = api

    return mynahUi
}
