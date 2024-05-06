/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
import { MynahUI, NotificationType } from '@aws/mynah-ui'
import {
    AuthFollowUpClickedParams,
    InsertToCursorPositionParams,
    SendToPromptParams,
    isValidAuthFollowUpType,
} from '../contracts/uiContracts'
import { Messager } from './messager'
import { TabFactory } from './tabs/tabFactory'

export interface InboundChatApi {
    sendToPrompt(params: SendToPromptParams): void
}

export const createMynahUi = (messager: Messager, tabFactory: TabFactory): [MynahUI, InboundChatApi] => {
    const mynahUi = new MynahUI({
        onCodeInsertToCursorPosition(
            tabId,
            messageId,
            code,
            type,
            referenceTrackerInformation,
            eventId,
            codeBlockIndex,
            totalCodeBlocks
        ) {
            const payload: InsertToCursorPositionParams = {
                tabId,
                messageId,
                code,
                type,
                referenceTrackerInformation,
                eventId,
                codeBlockIndex,
                totalCodeBlocks,
            }
            messager.onInsertToCursorPosition(payload)
        },
        onFollowUpClicked(tabId, messageId, followUp, eventId) {
            if (followUp.type !== undefined && isValidAuthFollowUpType(followUp.type)) {
                const payload: AuthFollowUpClickedParams = {
                    tabId,
                    messageId,
                    eventId,
                    authFollowupType: followUp.type,
                }
                messager.onAuthFollowUpClicked(payload)
            }
            //  messager.onFollowUpClicked
        },
        onReady: messager.onUiReady,
        onTabAdd: (tabId: string) => {
            messager.onTabAdd(tabId)
        },
        onTabRemove: (tabId: string) => {
            messager.onTabRemove(tabId)
        },
        onTabChange: (tabId: string) => {
            messager.onTabChange(tabId)
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

    const sendToPrompt = (params: SendToPromptParams) => {
        let tabId = mynahUi.getSelectedTabId()
        if (!tabId) {
            tabId = mynahUi.updateStore('', tabFactory.createTab(false))
            if (tabId === undefined) {
                mynahUi.notify({
                    content: uiComponentsTexts.noMoreTabsTooltip,
                    type: NotificationType.WARNING,
                })
                return undefined
            }
        }

        mynahUi.addToUserPrompt(tabId, params.prompt)

        messager.onSendToPrompt(params, tabId)
    }

    const api = {
        sendToPrompt: sendToPrompt,
    }

    return [mynahUi, api]
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
