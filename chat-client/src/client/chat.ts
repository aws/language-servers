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
    TAB_ID_RECEIVED,
    TabIdReceivedParams,
    UiMessage,
} from '@aws/chat-client-ui-types'
import {
    ChatParams,
    FeedbackParams,
    FollowUpClickParams,
    InfoLinkClickParams,
    LinkClickParams,
    QuickActionParams,
    SourceLinkClickParams,
    TabAddParams,
    TabChangeParams,
    TabRemoveParams,
} from '@aws/language-server-runtimes-types'
import { MynahUIDataModel } from '@aws/mynah-ui'
import {
    CHAT_PROMPT,
    FEEDBACK,
    FOLLOW_UP_CLICKED,
    INFO_LINK_CLICK,
    LINK_CLICK,
    NEW_TAB_CREATED,
    QUICK_ACTION_COMMAND,
    SOURCE_LINK_CLICK,
    ServerMessage,
    TAB_CHANGED,
    TAB_REMOVED,
    TELEMETRY,
    TelemetryParams,
    UI_IS_READY,
} from '../contracts/serverContracts'
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

type chatClientConfig = Pick<MynahUIDataModel, 'quickActionCommands'>

export const createChat = (
    clientApi: { postMessage: (msg: UiMessage | ServerMessage) => void },
    config?: chatClientConfig
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
            case CHAT_PROMPT:
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
            sendMessageToClient({ command: CHAT_PROMPT, params })
        },
        sendQuickActionCommand: (params: QuickActionParams) => {
            sendMessageToClient({ command: QUICK_ACTION_COMMAND, params })
        },
        tabIdReceived: (params: TabIdReceivedParams) => {
            sendMessageToClient({ command: TAB_ID_RECEIVED, params })
        },
        telemetry: (params: TelemetryParams) => {
            sendMessageToClient({ command: TELEMETRY, params })
        },
        tabAdded: (params: TabAddParams) => {
            sendMessageToClient({ command: NEW_TAB_CREATED, params })
        },
        tabChanged: (params: TabChangeParams) => {
            sendMessageToClient({ command: TAB_CHANGED, params })
        },
        tabRemoved: (params: TabRemoveParams) => {
            sendMessageToClient({ command: TAB_REMOVED, params })
        },
        insertToCursorPosition: (params: InsertToCursorPositionParams) => {
            sendMessageToClient({ command: INSERT_TO_CURSOR_POSITION, params })
        },
        authFollowUpClicked: (params: AuthFollowUpClickedParams) => {
            sendMessageToClient({ command: AUTH_FOLLOW_UP_CLICKED, params })
        },
        followUpClicked: (params: FollowUpClickParams) => {
            sendMessageToClient({ command: FOLLOW_UP_CLICKED, params })
        },
        sendFeedback: (params: FeedbackParams) => {
            sendMessageToClient({ command: FEEDBACK, params })
        },
        linkClick: (params: LinkClickParams) => {
            sendMessageToClient({ command: LINK_CLICK, params })
        },
        sourceLinkClick: (params: SourceLinkClickParams) => {
            sendMessageToClient({ command: SOURCE_LINK_CLICK, params })
        },
        infoLinkClick: (params: InfoLinkClickParams) => {
            sendMessageToClient({ command: INFO_LINK_CLICK, params })
        },
        uiReady: () => {
            sendMessageToClient({
                command: UI_IS_READY,
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
