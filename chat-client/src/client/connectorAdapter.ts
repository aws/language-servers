import { MynahUI, MynahUIProps } from '@aws/mynah-ui'
import { Connector } from './connector'

export const connectorAdapter = (
    mynahUiProps: MynahUIProps,
    mynahUIRef: { mynahUI: MynahUI | undefined },
    ideApiPostMessage: (msg: any) => void,
    connector: Connector
): MynahUIProps => {
    const ideConnector = connector.createIdeConnector(mynahUIRef, ideApiPostMessage)

    const connectorMynahUiProps: MynahUIProps = {
        ...mynahUiProps,
        onChatPrompt(tabId, prompt, eventId) {
            if (connector.isSupportedTab(tabId)) {
                ideConnector.requestAnswer(tabId, {
                    chatMessage: prompt.prompt ?? '',
                })
                return
            }

            if (prompt.command?.trim() === '/transform') {
                // NOTE: Just an example, needs to be extended
                // getQuickActionHandler().handle(prompt, tabId, eventId)
                connector.handleQuickAction(prompt, tabId, eventId)
                return
            }

            mynahUiProps.onChatPrompt?.(tabId, prompt, eventId)
        },
        onInBodyButtonClicked(tabId, messageId, action, eventId) {
            if (connector.isSupportedTab(tabId)) {
                ideConnector.onCustomFormAction(tabId, messageId, action, eventId)
                return
            }

            mynahUiProps.onInBodyButtonClicked?.(tabId, messageId, action, eventId)
        },
        onCustomFormAction(tabId, action, eventId) {
            if (connector.isSupportedTab(tabId)) {
                ideConnector.onCustomFormAction(tabId, undefined, action)
                return
            }

            mynahUiProps.onCustomFormAction?.(tabId, action, eventId)
        },
        onTabRemove(tabId) {
            if (connector.isSupportedTab(tabId)) {
                ideConnector.onTabRemove(tabId)
                return
            }

            mynahUiProps.onTabRemove?.(tabId)
        },
        onTabChange(tabId) {
            if (connector.isSupportedTab(tabId)) {
                ideConnector.onTabChange(tabId)
                return
            }

            mynahUiProps.onTabChange?.(tabId)
        },
        onLinkClick(tabId, messageId, link, mouseEvent) {
            if (connector.isSupportedTab(tabId)) {
                mouseEvent?.preventDefault()
                mouseEvent?.stopPropagation()
                mouseEvent?.stopImmediatePropagation()
                ideConnector.onResponseBodyLinkClick(tabId, messageId, link)
                return
            }

            mynahUiProps.onLinkClick?.(tabId, messageId, link, mouseEvent)
        },
    }

    return connectorMynahUiProps
}
