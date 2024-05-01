/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { TabAddParams, TabChangeParams, TabRemoveParams } from '@aws/language-server-runtimes-types'
import { TelemetryParams } from '../contracts/serverContracts'
import { InsertToCursorPositionParams, SendToPromptParams, TabIdReceivedParams } from '../contracts/uiContracts'

export interface OutboundChatApi {
    tabAdded(params: TabAddParams): void
    tabChanged(params: TabChangeParams): void
    tabRemoved(params: TabRemoveParams): void
    tabIdReceived(params: TabIdReceivedParams): void
    telemetry(params: TelemetryParams): void
    insertToCursorPosition(params: InsertToCursorPositionParams): void
    uiReady(): void
}

export class Messager {
    constructor(private readonly chatApi: OutboundChatApi) {}

    onTabAdd = (tabId: string): void => {
        this.chatApi.tabAdded({ tabId })
    }

    onTabChange = (tabId: string): void => {
        this.chatApi.tabChanged({ tabId })
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

    onInsertToCursorPosition = (params: InsertToCursorPositionParams): void => {
        this.chatApi.insertToCursorPosition(params)
    }
}
