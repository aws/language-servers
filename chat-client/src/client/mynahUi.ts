/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
import { MynahUI, NotificationType } from '@aws/mynah-ui'
import { SendToPromptParams } from '../contracts/uiContracts'
import { Messager } from './messager'
import { TabFactory } from './tabs/tabFactory'
import { TabStorage } from './tabs/tabStorage'

export interface InboundChatApi {
    sendToPrompt(params: SendToPromptParams): void
}

export const createMynahUI = (messager: Messager, tabFactory: TabFactory, tabStorage: TabStorage): InboundChatApi => {
    const mynahUI = new MynahUI({
        onReady: messager.onUiReady,
        onTabAdd: (tabId: string) => {
            mynahUI.updateStore(tabId, {})
            tabStorage.addTab({
                id: tabId,
                isSelected: true,
            })
            messager.onTabAdd(tabId)
        },
        onTabRemove: (tabId: string) => {
            tabStorage.deleteTab(tabId)
            messager.onTabRemove(tabId)
        },
        onTabChange: (tabId: string) => {
            const prevTabId = tabStorage.setSelectedTab(tabId)
            messager.onTabChange(tabId, prevTabId)
        },
        onResetStore: () => {},
        tabs: {
            'tab-1': {
                isSelected: true,
                store: tabFactory.createTab(true),
            },
        },
        defaults: {
            store: tabFactory.createTab(true),
        },
        config: {
            maxTabs: 10,
            texts: uiComponentsTexts,
        },
    })

    // Adding the first default tab
    tabStorage.addTab({
        id: 'tab-1',
        isSelected: true,
    })

    const sendToPrompt = (params: SendToPromptParams) => {
        const selectedTab = tabStorage.getSelectedTab()
        let tabId = selectedTab?.id
        if (!tabId) {
            tabId = mynahUI.updateStore('', tabFactory.createTab(false))
            if (tabId === undefined) {
                mynahUI.notify({
                    content: uiComponentsTexts.noMoreTabsTooltip,
                    type: NotificationType.WARNING,
                })
                return undefined
            }
            tabStorage.addTab({
                id: tabId,
                isSelected: true,
            })
        }

        mynahUI.addToUserPrompt(tabId, params.prompt)

        messager.onSendToPrompt(params, tabId)
    }

    return {
        sendToPrompt: sendToPrompt,
    }
}

const uiComponentsTexts = {
    mainTitle: 'Amazon Q (Preview)',
    copy: 'Copy',
    insertAtCursorLabel: 'Insert at cursor',
    feedbackFormTitle: 'Report an issue',
    feedbackFormOptionsLabel: 'What type of issue would you like to report?',
    feedbackFormCommentLabel: 'Description of issue (optional):',
    feedbackThanks: 'Thanks for your feedback!',
    feedbackReportButtonLabel: 'Report an issue',
    codeSuggestions: 'Code suggestions',
    files: 'file(s)',
    clickFileToViewDiff: 'Click on a file to view diff.',
    showMore: 'Show more',
    save: 'Save',
    cancel: 'Cancel',
    submit: 'Submit',
    stopGenerating: 'Stop generating',
    copyToClipboard: 'Copied to clipboard',
    noMoreTabsTooltip: 'You can only open ten conversation tabs at a time.',
    codeSuggestionWithReferenceTitle: 'Some suggestions contain code with references.',
    spinnerText: 'Generating your answer...',
}
