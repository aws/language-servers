/* eslint-disable prefer-const */
import { TabAddParams, TabChangeParams, TabRemoveParams } from '@aws/language-server-runtimes-types'
import { CHAT_PROMPT, NEW_TAB_CREATED, ServerMessage, TAB_CHANGED, TAB_REMOVED } from '../contracts/serverContracts'
import {
    AUTH_NEEDED_EXCEPTION,
    ERROR_MESSAGE,
    SEND_TO_PROMPT,
    SendToPromptMessage,
    TAB_ID_RECEIVED,
    TabIdReceivedParams,
    UI_FOCUS,
    UI_IS_READY,
    UiMessage,
} from '../contracts/uiContracts'
import { Messager, OutboundChatApi } from './messager'
import { InboundChatApi, createMynahUi } from './mynahUi'
import { TabFactory } from './tabs/tabFactory'

export const createChat = (clientApi: { postMessage: (msg: UiMessage | ServerMessage) => void }) => {
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
                break
            case SEND_TO_PROMPT:
                mynahApi.sendToPrompt((message as SendToPromptMessage).params)
                break
            case AUTH_NEEDED_EXCEPTION:
                break
            case ERROR_MESSAGE:
                break
            default:
                // TODO: Report error?
                break
        }
    }

    const handleApplicationFocus = (event: FocusEvent): void => {
        sendMessageToClient({ command: UI_FOCUS, params: { type: event.type } })
    }

    const chatApi: OutboundChatApi = {
        // TODO: Change to telemetry event & package name
        tabIdReceived: (params: TabIdReceivedParams) => {
            sendMessageToClient({ command: TAB_ID_RECEIVED, params })
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
    const tabFactory = new TabFactory()
    const [mynahUi, api] = createMynahUi(messager, tabFactory)

    mynahApi = api

    return mynahUi
}
