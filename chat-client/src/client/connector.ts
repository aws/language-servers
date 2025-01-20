import { ChatPrompt, MynahUI } from '@aws/mynah-ui'

export interface Connector {
    createIdeConnector(mynahUIRef: { mynahUI: MynahUI | undefined }, ideApiPostMessage: (msg: any) => void): any // TODO: return type
    isSupportedTab(tabId: string): boolean
    handleMessageReceive(message: MessageEvent): void
    handleQuickAction(prompt: ChatPrompt, tabId: string, eventId: string | undefined): void
}
