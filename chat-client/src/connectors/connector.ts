import { ChatItem } from '@aws/mynah-ui'
import { BaseConnectorProps } from './apps/baseConnector'
import { ConnectorProps as GumbyConnectorProps, Connector as GumbyChatConnector } from './apps/gumbyChatConnector'
import { TabsStorage } from './storages/tabsStorage'
import { UserIntent } from '@amzn/codewhisperer-streaming'

export interface ChatPayload {
    chatMessage: string
    chatCommand?: string
}

export interface CWCChatItem extends ChatItem {
    traceId?: string
    userIntent?: UserIntent
    codeBlockLanguage?: string
}

export interface CodeReference {
    licenseName?: string
    repository?: string
    url?: string
    recommendationContentSpan?: {
        start?: number
        end?: number
    }
}

// NOTE: This class would NOT be an exact copy, e.g.:
// - it will be adapted to the fact that it needs to pick only feature-specific incoming messages
// (handleMessageReceive -> tryHandleMessageReceive)
// - case with onTabChange and `prevTabID` below
export class Connector {
    private readonly gumbyChatConnector: GumbyChatConnector
    private readonly tabsStorage: TabsStorage

    constructor(tabsStorage: TabsStorage, props: BaseConnectorProps & GumbyConnectorProps) {
        this.gumbyChatConnector = new GumbyChatConnector(props)
        this.tabsStorage = tabsStorage
    }

    tryHandleMessageReceive = async (message: MessageEvent): Promise<boolean> => {
        const messageData = message.data
        if (!messageData?.sender) {
            return false
        }

        if (messageData.sender === 'gumbyChat') {
            await this.gumbyChatConnector.handleMessageReceive(messageData)
        }

        // Reset lastCommand after message is rendered.
        this.tabsStorage.updateTabLastCommand(messageData.tabID, '')

        return true
    }

    requestAnswer = (tabID: string, payload: ChatPayload) => {
        switch (this.tabsStorage.getTab(tabID)?.type) {
            case 'gumby':
                return this.gumbyChatConnector.requestAnswer(tabID, payload)
        }
    }

    transform = (tabID: string): void => {
        this.gumbyChatConnector.transform(tabID)
    }

    clearChat = (tabID: string): void => {
        switch (this.tabsStorage.getTab(tabID)?.type) {
            case 'gumby':
                this.gumbyChatConnector.clearChat(tabID)
                break
        }
    }

    onCustomFormAction = (tabId: string, action: any): void | undefined => {
        switch (this.tabsStorage.getTab(tabId)?.type) {
            case 'gumby':
                this.gumbyChatConnector.onCustomFormAction(tabId, action)
                break
            // NOTE: below code would need to migrate to base chat to reach feature parity
            // case 'cwc':
            //     if (action.id === `open-settings`) {
            //         this.sendMessageToExtension({
            //             command: 'open-settings',
            //             type: '',
            //             tabType: 'cwc',
            //         })
            //     }
        }
    }

    onUpdateTabType = (tabID: string) => {
        const tab = this.tabsStorage.getTab(tabID)
        switch (tab?.type) {
            case 'gumby':
                this.gumbyChatConnector.onTabAdd(tabID)
                break
        }
    }

    onTabRemove = (tabID: string): void => {
        const tab = this.tabsStorage.getTab(tabID)
        this.tabsStorage.deleteTab(tabID)
        switch (tab?.type) {
            case 'gumby':
                this.gumbyChatConnector.onTabRemove(tabID)
                break
        }
    }

    onTabChange = (tabId: string): void => {
        // NOTE: 'prevTabID' for transform is always undefined
        // const prevTabID = this.tabsStorage.setSelectedTab(tabId)
        this.gumbyChatConnector.onTabChange(tabId, undefined)
    }

    onResponseBodyLinkClick = (tabID: string, messageId: string, link: string): void => {
        switch (this.tabsStorage.getTab(tabID)?.type) {
            case 'gumby':
                this.gumbyChatConnector.onResponseBodyLinkClick(tabID, messageId, link)
        }
    }
}
