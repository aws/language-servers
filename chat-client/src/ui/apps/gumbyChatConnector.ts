/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This class is responsible for listening to and processing events
 * from the webview and translating them into events to be handled by the extension,
 * and events from the extension and translating them into events to be handled by the webview.
 */

import { ChatItem, ChatItemType } from '@aws/mynah-ui'
import { ExtensionMessage } from '../commands'
import { ChatPayload } from '../connector'
import { TabOpenType, TabsStorage } from '../storages/tabsStorage'
import { GumbyMessageType } from './gumbyMessage'

export interface ConnectorProps {
    sendMessageToClient: (message: ExtensionMessage) => void
    onAsyncEventProgress: (tabID: string, inProgress: boolean, message: string, messageId: string) => void
    onChatAnswerReceived?: (tabID: string, message: ChatItem) => void
    onChatAnswerUpdated?: (tabID: string, message: ChatItem) => void
    onQuickHandlerCommand: (tabID: string, command: string, eventId?: string) => void
    onError: (tabID: string, message: string, title: string) => void
    onWarning: (tabID: string, message: string, title: string) => void
    onUpdateAuthentication: (gumbyEnabled: boolean, authenticatingTabIDs: string[]) => void
    onChatInputEnabled: (tabID: string, enabled: boolean) => void
    onUpdatePlaceholder: (tabID: string, newPlaceholder: string) => void
    tabsStorage: TabsStorage
}

export interface MessageData {
    tabID: string
    type: GumbyMessageType
}

export class Connector {
    private readonly onAuthenticationUpdate
    private readonly sendMessageToClient
    private readonly onError
    private readonly onChatAnswerReceived
    private readonly onChatAnswerUpdated
    private readonly chatInputEnabled
    private readonly onAsyncEventProgress
    private readonly onQuickHandlerCommand
    private readonly updatePlaceholder
    private readonly tabStorage

    constructor(props: ConnectorProps) {
        this.sendMessageToClient = props.sendMessageToClient
        this.onChatAnswerReceived = props.onChatAnswerReceived
        this.onChatAnswerUpdated = props.onChatAnswerUpdated
        this.onError = props.onError
        this.chatInputEnabled = props.onChatInputEnabled
        this.onAsyncEventProgress = props.onAsyncEventProgress
        this.updatePlaceholder = props.onUpdatePlaceholder
        this.onQuickHandlerCommand = props.onQuickHandlerCommand
        this.onAuthenticationUpdate = props.onUpdateAuthentication
        this.tabStorage = props.tabsStorage
    }

    onTabAdd = (tabID: string, tabOpenInteractionType?: TabOpenType): void => {
        this.sendMessageToClient({
            tabID: tabID,
            command: 'new-tab-was-created',
            tabType: 'gumby',
            tabOpenInteractionType,
        })
    }

    onTabRemove(tabID: string) {
        this.sendMessageToClient({
            tabID: tabID,
            command: 'tab-was-removed',
            tabType: 'gumby',
        })
    }

    private processChatPrompt = async (messageData: any, tabID: string): Promise<void> => {
        if (this.onChatAnswerReceived === undefined) {
            return
        }

        const answer: ChatItem = {
            type: ChatItemType.AI_PROMPT,
            body: messageData.message,
            formItems: messageData.formItems,
            buttons: messageData.formButtons,
            followUp: undefined,
            status: 'info',
            canBeVoted: false,
        }

        this.onChatAnswerReceived(tabID, answer)

        return
    }

    private processChatMessage = async (messageData: any): Promise<void> => {
        if (this.onChatAnswerReceived === undefined || this.onChatAnswerUpdated === undefined) {
            return
        }

        if (messageData.message !== undefined) {
            const answer: ChatItem = {
                type: messageData.messageType,
                messageId: messageData.messageId ?? messageData.triggerID,
                body: messageData.message,
                buttons: messageData.buttons ?? [],
                canBeVoted: false,
            }

            if (messageData.messageId !== undefined) {
                this.onChatAnswerUpdated(messageData.tabID, answer)
                return
            }

            this.onChatAnswerReceived(messageData.tabID, answer)
        }
    }

    transform = (tabID: string): void => {
        this.sendMessageToClient({
            tabID: tabID,
            command: 'transform',
            chatMessage: 'transform',
            tabType: 'gumby',
        })
    }

    requestAnswer = (tabID: string, payload: ChatPayload) => {
        this.tabStorage.updateTabStatus(tabID, 'busy')
        this.sendMessageToClient({
            tabID: tabID,
            command: 'chat-prompt',
            chatMessage: payload.chatMessage,
            chatCommand: payload.chatCommand,
            tabType: 'gumby',
        })
    }

    private processAuthNeededException = async (messageData: any): Promise<void> => {
        if (this.onChatAnswerReceived === undefined) {
            return
        }

        this.onChatAnswerReceived(messageData.tabID, {
            type: ChatItemType.SYSTEM_PROMPT,
            body: messageData.message,
        })
    }

    onCustomFormAction(
        tabId: string,
        action: {
            id: string
            text?: string | undefined
            formItemValues?: Record<string, string> | undefined
        }
    ) {
        if (action === undefined) {
            return
        }

        this.sendMessageToClient({
            command: 'form-action-click',
            action: action.id,
            formSelectedValues: action.formItemValues,
            tabType: 'gumby',
            tabId: tabId,
        })
    }

    onResponseBodyLinkClick = (tabID: string, messageId: string, link: string): void => {
        this.sendMessageToClient({
            command: 'response-body-link-click',
            tabID,
            messageId,
            link,
            tabType: 'gumby',
        })
    }

    private processExecuteCommand = async (messageData: any): Promise<void> => {
        this.onQuickHandlerCommand(messageData.tabID, messageData.command, messageData.eventId)
    }

    // This handles messages received from the extension, to be forwarded to the webview
    handleMessageReceive = async (messageData: { type: GumbyMessageType } & Record<string, any>) => {
        switch (messageData.type) {
            case 'asyncEventProgressMessage':
                this.onAsyncEventProgress(
                    messageData.tabID,
                    messageData.inProgress,
                    messageData.message,
                    messageData.messageId
                )
                break
            case 'authNeededException':
                await this.processAuthNeededException(messageData)
                break
            case 'authenticationUpdateMessage':
                this.onAuthenticationUpdate(messageData.gumbyEnabled, messageData.authenticatingTabIDs)
                break
            case 'chatInputEnabledMessage':
                this.chatInputEnabled(messageData.tabID, messageData.enabled)
                break
            case 'chatMessage':
                await this.processChatMessage(messageData)
                break
            case 'chatPrompt':
                await this.processChatPrompt(messageData, messageData.tabID)
                break
            case 'errorMessage':
                this.onError(messageData.tabID, messageData.message, messageData.title)
                break
            case 'sendCommandMessage':
                await this.processExecuteCommand(messageData)
                break
            case 'updatePlaceholderMessage':
                this.updatePlaceholder(messageData.tabID, messageData.newPlaceholder)
                break
        }
    }
}
