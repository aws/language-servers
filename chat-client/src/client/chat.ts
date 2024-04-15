import { ChatApi } from '../ui/chatApi'
import { ExtensionMessage, UI_FOCUS, UI_IS_READY } from '../ui/commands'
import { createMynahUI } from '../ui/main'
import { FocusParams, UiRequest } from './uiContracts'

export const createChat = (clientApi: any, amazonQEnabled: boolean) => {
    const sendMessageToClient = (message: UiRequest) => {
        clientApi.postMessage(message)
    }

    const chatApi: ChatApi = {
        // TODO: Extend this api with typed methods, e.g. chat, endChat, so on
        // and remove generic sendMessageToClient
        sendMessageToClient: (message: ExtensionMessage) => {
            clientApi.postMessage(message)
        },
        uiReady: () => {
            sendMessageToClient({
                command: UI_IS_READY,
            })

            window.addEventListener('message', handleMessageReceive)
            window.addEventListener('focus', handleApplicationFocus)
            window.addEventListener('blur', handleApplicationFocus)
        },
    }

    const mynahApi = createMynahUI(chatApi, amazonQEnabled)

    const handleMessageReceive = async (event: MessageEvent): Promise<void> => {
        if (event.data === undefined) {
            return
        }

        // TODO: potential json parsing error exists. Need to determine the failing case.
        const message = JSON.parse(event.data)

        if (message === undefined) {
            return
        }

        // TODO: Extend this api with typed methods, e.g. handleChatResult, sendToPrompt, so on
        // and remove generic handleMessageReceive
        mynahApi.handleMessageReceive(message)
    }

    const handleApplicationFocus = async (event: FocusEvent): Promise<void> => {
        sendMessageToClient(focusRequest({ type: event.type }))
    }
}

const focusRequest = (params: FocusParams): UiRequest => {
    return { command: UI_FOCUS, params: params }
}
