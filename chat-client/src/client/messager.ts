/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { TabEventParams } from '@aws/language-server-runtimes/protocol' // TODO: Use types
import { SendToPromptParams, TabIdReceivedParams } from '../contracts/uiContracts'

export interface OutboundChatApi {
    tabAdded(params: TabEventParams): void
    tabChanged(params: TabEventParams): void
    tabRemoved(params: TabEventParams): void
    tabIdReceived(params: TabIdReceivedParams): void
    uiReady(): void
}

export class Messager {
    constructor(private readonly chatApi: OutboundChatApi) {}

    onTabAdd = (tabId: string): void => {
        this.chatApi.tabAdded({ tabId })
    }

    onTabChange = (tabId: string, prevTabId?: string): void => {
        this.chatApi.tabChanged({ tabId }) // TODO: Extend server contract for prevTabId?
    }

    onTabRemove = (tabId: string): void => {
        this.chatApi.tabRemoved({ tabId })
    }

    onUiReady = (): void => {
        this.chatApi.uiReady()
    }

    onSendToPrompt = (params: SendToPromptParams, tabId: string): void => {
        this.chatApi.tabIdReceived({
            triggerId: params.triggerId,
            tabId: tabId,
        })
    }
}
