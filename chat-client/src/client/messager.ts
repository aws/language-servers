/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import {
    AuthFollowUpClickedParams,
    CopyCodeToClipboardParams,
    ErrorParams,
    InsertToCursorPositionParams,
    SendToPromptParams,
    TriggerType,
} from '@aws/chat-client-ui-types'
import {
    ChatParams,
    FeedbackParams,
    FollowUpClickParams,
    InfoLinkClickParams,
    LinkClickParams,
    QuickActionParams,
    SourceLinkClickParams,
    TabAddParams,
    TabChangeParams,
    TabRemoveParams,
} from '@aws/language-server-runtimes-types'
import { TelemetryParams } from '../contracts/serverContracts'
import {
    ADD_MESSAGE_TELEMETRY_EVENT,
    AUTH_FOLLOW_UP_CLICKED_TELEMETRY_EVENT,
    COPY_TO_CLIPBOARD_TELEMETRY_EVENT,
    ENTER_FOCUS,
    ERROR_MESSAGE_TELEMETRY_EVENT,
    EXIT_FOCUS,
    INFO_LINK_CLICK_TELEMETRY_EVENT,
    INSERT_TO_CURSOR_POSITION_TELEMETRY_EVENT,
    LINK_CLICK_TELEMETRY_EVENT,
    SEND_TO_PROMPT_TELEMETRY_EVENT,
    SOURCE_LINK_CLICK_TELEMETRY_EVENT,
    TAB_ADD_TELEMETRY_EVENT,
    VOTE_TELEMETRY_EVENT,
    VoteParams,
} from '../contracts/telemetry'

export interface OutboundChatApi {
    sendChatPrompt(params: ChatParams): void
    sendQuickActionCommand(params: QuickActionParams): void
    tabAdded(params: TabAddParams): void
    tabChanged(params: TabChangeParams): void
    tabRemoved(params: TabRemoveParams): void
    telemetry(params: TelemetryParams): void
    insertToCursorPosition(params: InsertToCursorPositionParams): void
    copyToClipboard(params: CopyCodeToClipboardParams): void
    authFollowUpClicked(params: AuthFollowUpClickedParams): void
    followUpClicked(params: FollowUpClickParams): void
    sendFeedback(params: FeedbackParams): void
    linkClick(params: LinkClickParams): void
    sourceLinkClick(params: SourceLinkClickParams): void
    infoLinkClick(params: InfoLinkClickParams): void
    uiReady(): void
}

export class Messager {
    constructor(private readonly chatApi: OutboundChatApi) {}

    onTabAdd = (tabId: string, triggerType?: TriggerType): void => {
        this.chatApi.tabAdded({ tabId })
        this.chatApi.telemetry({ triggerType: triggerType ?? 'click', tabId, name: TAB_ADD_TELEMETRY_EVENT })
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

    onFocusStateChanged = (focusState: boolean): void => {
        this.chatApi.telemetry({ name: focusState ? ENTER_FOCUS : EXIT_FOCUS })
    }

    onSendToPrompt = (params: SendToPromptParams, tabId: string): void => {
        this.chatApi.telemetry({ ...params, tabId, name: SEND_TO_PROMPT_TELEMETRY_EVENT })
    }

    onChatPrompt = (params: ChatParams, triggerType?: string): void => {
        this.chatApi.sendChatPrompt(params)

        // Let the server know about the latest trigger interaction on the tabId
        this.chatApi.telemetry({
            triggerType: triggerType ?? 'click',
            tabId: params.tabId,
            name: ADD_MESSAGE_TELEMETRY_EVENT,
        })
    }

    onQuickActionCommand = (params: QuickActionParams): void => {
        this.chatApi.sendQuickActionCommand(params)
    }

    onInsertToCursorPosition = (params: InsertToCursorPositionParams): void => {
        this.chatApi.insertToCursorPosition(params)
        this.chatApi.telemetry({ ...params, name: INSERT_TO_CURSOR_POSITION_TELEMETRY_EVENT })
    }

    onAuthFollowUpClicked = (params: AuthFollowUpClickedParams): void => {
        this.chatApi.authFollowUpClicked(params)
        this.chatApi.telemetry({ ...params, name: AUTH_FOLLOW_UP_CLICKED_TELEMETRY_EVENT })
    }

    onFollowUpClicked = (params: FollowUpClickParams): void => {
        this.chatApi.followUpClicked(params)
    }

    onCopyCodeToClipboard = (params: CopyCodeToClipboardParams): void => {
        this.chatApi.copyToClipboard(params)
        this.chatApi.telemetry({ ...params, name: COPY_TO_CLIPBOARD_TELEMETRY_EVENT })
    }

    onVote = (params: VoteParams): void => {
        this.chatApi.telemetry({ ...params, name: VOTE_TELEMETRY_EVENT })
    }

    onSendFeedback = (params: FeedbackParams): void => {
        this.chatApi.sendFeedback(params)
    }

    onLinkClick = (params: LinkClickParams): void => {
        this.chatApi.linkClick(params)
        this.chatApi.telemetry({ ...params, name: LINK_CLICK_TELEMETRY_EVENT })
    }

    onSourceLinkClick = (params: SourceLinkClickParams): void => {
        this.chatApi.sourceLinkClick(params)
        this.chatApi.telemetry({ ...params, name: SOURCE_LINK_CLICK_TELEMETRY_EVENT })
    }

    onInfoLinkClick = (params: InfoLinkClickParams): void => {
        this.chatApi.infoLinkClick(params)
        this.chatApi.telemetry({ ...params, name: INFO_LINK_CLICK_TELEMETRY_EVENT })
    }

    onError = (params: ErrorParams): void => {
        this.chatApi.telemetry({ ...params, name: ERROR_MESSAGE_TELEMETRY_EVENT })
    }
}
