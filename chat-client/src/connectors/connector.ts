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
export class Connector {
    private readonly gumbyChatConnector: GumbyChatConnector
    private readonly tabsStorage: TabsStorage

    constructor(tabsStorage: TabsStorage, props: BaseConnectorProps & GumbyConnectorProps) {
        this.gumbyChatConnector = new GumbyChatConnector(props)
        this.tabsStorage = tabsStorage
    }

    tryHandleMessageReceive = async (message: MessageEvent): Promise<boolean> => {
        if (message.data === undefined) {
            return false
        }

        // TODO: potential json parsing error exists. Need to determine the failing case.
        const messageData = JSON.parse(message.data)

        if (messageData === undefined) {
            return false
        }

        if (messageData.sender === 'gumbyChat') {
            await this.gumbyChatConnector.handleMessageReceive(messageData)
        }

        // Reset lastCommand after message is rendered.
        this.tabsStorage.updateTabLastCommand(messageData.tabID, '')

        return true
    }
}
