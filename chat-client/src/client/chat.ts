/* eslint-disable prefer-const */
import {
    AUTH_FOLLOW_UP_CLICKED,
    AuthFollowUpClickedParams,
    ERROR_MESSAGE,
    ErrorMessage,
    GENERIC_COMMAND,
    GenericCommandMessage,
    INSERT_TO_CURSOR_POSITION,
    InsertToCursorPositionParams,
    SEND_TO_PROMPT,
    SendToPromptMessage,
    UiMessage,
} from '@aws/chat-client-ui-types'
import {
    CHAT_REQUEST_METHOD,
    ChatParams,
    FEEDBACK_NOTIFICATION_METHOD,
    FOLLOW_UP_CLICK_NOTIFICATION_METHOD,
    FeedbackParams,
    FollowUpClickParams,
    INFO_LINK_CLICK_NOTIFICATION_METHOD,
    InfoLinkClickParams,
    LINK_CLICK_NOTIFICATION_METHOD,
    LinkClickParams,
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
import { MynahUIDataModel } from '@aws/mynah-ui'
import { ServerMessage, TELEMETRY, TelemetryParams } from '../contracts/serverContracts'
import { ENTER_FOCUS, EXIT_FOCUS } from '../contracts/telemetry'
import { Messager, OutboundChatApi } from './messager'
import { InboundChatApi, createMynahUi } from './mynahUi'
import { TabFactory } from './tabs/tabFactory'

const DEFAULT_TAB_DATA = {
    tabTitle: 'Chat',
    promptInputInfo:
        'Use of Amazon Q is subject to the [AWS Responsible AI Policy](https://aws.amazon.com/machine-learning/responsible-ai/policy/).',
    promptInputPlaceholder: 'Ask a question or enter "/" for quick actions',
}

type ChatClientConfig = Pick<MynahUIDataModel, 'quickActionCommands'>

export const createChat = (
    clientApi: { postMessage: (msg: UiMessage | ServerMessage) => void },
    config?: ChatClientConfig
) => {
    // eslint-disable-next-line semi
    let mynahApi: InboundChatApi

    const sendMessageToClient = (message: UiMessage | ServerMessage) => {
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
            case SEND_TO_PROMPT:
                mynahApi.sendToPrompt((message as SendToPromptMessage).params)
                break
            case GENERIC_COMMAND:
                mynahApi.sendGenericCommand((message as GenericCommandMessage).params)
                break
            case ERROR_MESSAGE:
                mynahApi.showError((message as ErrorMessage).params)
                break
            default:
                // TODO: Report error?
                break
        }
    }

    const handleApplicationFocus = (event: FocusEvent): void => {
        const params = { name: event.type === 'focus' ? ENTER_FOCUS : EXIT_FOCUS }
        sendMessageToClient({ command: TELEMETRY, params })
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
            window.addEventListener('focus', handleApplicationFocus)
            window.addEventListener('blur', handleApplicationFocus)
        },
    }

    const messager = new Messager(chatApi)
    const tabFactory = new TabFactory({
        ...DEFAULT_TAB_DATA,
        quickActionCommands: config?.quickActionCommands,
    })
    const [mynahUi, api] = createMynahUi(messager, tabFactory)

    mynahApi = api

    return mynahUi
}
