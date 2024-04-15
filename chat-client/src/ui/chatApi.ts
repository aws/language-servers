import { ExtensionMessage } from './commands'

export interface ChatApi {
    // TODO: Extend this api with typed methods, e.g. chat, endChat, so on
    // and remove generic sendMessageToClient
    sendMessageToClient(message: ExtensionMessage): void
    uiReady(): void
}
