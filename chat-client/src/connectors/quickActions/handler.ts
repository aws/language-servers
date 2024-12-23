/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { ChatPrompt, MynahUI, NotificationType } from '@aws/mynah-ui'
import { TabDataGenerator } from '../tabs/generator'
import { Connector } from '../connector'
import { TabsStorage } from '../storages/tabsStorage'
import { uiComponentsTexts } from '../texts/constants'

export interface QuickActionsHandlerProps {
    mynahUI: MynahUI
    connector: Connector
    tabsStorage: TabsStorage
}

export class QuickActionHandler {
    private mynahUI: MynahUI
    private connector: Connector
    private tabsStorage: TabsStorage
    private tabDataGenerator: TabDataGenerator

    constructor(props: QuickActionsHandlerProps) {
        this.mynahUI = props.mynahUI
        this.connector = props.connector
        this.tabsStorage = props.tabsStorage
        this.tabDataGenerator = new TabDataGenerator()
    }

    public handle(chatPrompt: ChatPrompt, tabID: string, eventId?: string) {
        this.tabsStorage.resetTabTimer(tabID)
        switch (chatPrompt.command) {
            case '/transform':
                this.handleGumbyCommand(tabID, eventId)
                break
            case '/clear':
                this.handleClearCommand(tabID)
                break
        }
    }

    private handleClearCommand(tabID: string) {
        this.mynahUI.updateStore(tabID, {
            chatItems: [],
        })
        this.connector.clearChat(tabID)
    }

    private handleGumbyCommand(tabID: string, eventId: string | undefined) {
        let gumbyTabId: string | undefined = undefined

        this.tabsStorage.getTabs().forEach(tab => {
            if (tab.type === 'gumby') {
                gumbyTabId = tab.id
            }
        })

        if (gumbyTabId !== undefined) {
            this.mynahUI.selectTab(gumbyTabId, eventId || '')
            // NOTE: below creates dup events, probably in vscode too?
            // this.connector.onTabChange(gumbyTabId)
            return
        }

        let affectedTabId: string | undefined = tabID
        // if there is no gumby tab, open a new one
        if (this.tabsStorage.getTab(affectedTabId)?.type !== 'unknown') {
            // NOTE: Workaround to reuse 'welcome' tab for gumby
            // in vscode this logic is based on 'welcome' tab type
            const currTab = this.mynahUI.getAllTabs()[affectedTabId]
            const currTabWasUsed = (currTab.store?.chatItems?.filter(item => item.type === 'prompt').length ?? 0) > 0
            if (currTabWasUsed) {
                // open new tab
                affectedTabId = this.mynahUI.updateStore('', {
                    loadingChat: true,
                    cancelButtonWhenLoading: false,
                })
            }

            // NOTE: Adding tab to the storage here, rather than in MynahUIProps,
            // it ensures only "gumby" tabs in the legacy tabStorage
            if (affectedTabId) {
                this.tabsStorage.addTab({
                    id: affectedTabId,
                    type: 'unknown',
                    status: 'free',
                    isSelected: true,
                })
            }
        }

        if (affectedTabId === undefined) {
            this.mynahUI.notify({
                content: uiComponentsTexts.noMoreTabsTooltip,
                type: NotificationType.WARNING,
            })
            return
        } else {
            this.tabsStorage.updateTabTypeFromUnknown(affectedTabId, 'gumby')
            // this.connector.onKnownTabOpen(affectedTabId) // featuredev
            this.connector.onUpdateTabType(affectedTabId)

            // reset chat history
            this.mynahUI.updateStore(affectedTabId, {
                chatItems: [],
            })

            this.mynahUI.updateStore(affectedTabId, this.tabDataGenerator.getTabData('gumby', true, undefined))

            // disable chat prompt
            this.mynahUI.updateStore(affectedTabId, {
                loadingChat: true,
                cancelButtonWhenLoading: false,
            })

            this.connector.transform(affectedTabId)
        }
    }
}
