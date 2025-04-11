/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { ChatDatabase } from './tools/chatDb/chatDb'
import { Conversation, messageToChatMessage, Tab } from './tools/chatDb/util'
import { Features } from '@aws/language-server-runtimes/server-interface/server'
import {
    ConversationClickParams,
    ConversationClickResult,
    ListConversationsParams,
    ListConversationsResult,
} from '@aws/language-server-runtimes-types'

/**
 * Controller for managing chat history and export functionality.
 *
 * Handles chat conversation management including:
 * - Loading and restoring conversations from chat history
 * - Handling chat history operations (list, search, delete)
 * - TODO: Export chat
 *
 * Ported from https://github.com/aws/aws-toolkit-vscode/blob/master/packages/core/src/codewhispererChat/controllers/chat/tabBarController.ts
 *
 */
export class TabBarController {
    #loadedChats: boolean = false
    #searchTimeout: NodeJS.Timeout | undefined = undefined
    readonly #DebounceTime = 300 // milliseconds
    #features: Features
    #chatHistoryDb: ChatDatabase

    constructor(features: Features, chatHistoryDb: ChatDatabase) {
        this.#features = features
        this.#chatHistoryDb = chatHistoryDb
    }

    /**
     * Retrieves a list of conversations to display in chat history.
     * If a search filter is provided, performs a debounced search on messages.
     * Otherwise, returns the full conversation history with filter options.
     */
    async onListConversations(params: ListConversationsParams): Promise<ListConversationsResult> {
        const searchFilter = params.filter?.['search']

        if (this.#searchTimeout) {
            clearTimeout(this.#searchTimeout)
        }

        if (searchFilter) {
            const list = await new Promise<any[]>(resolve => {
                this.#searchTimeout = setTimeout(() => {
                    const results = this.#chatHistoryDb.searchMessages(searchFilter)
                    resolve(results)
                }, this.#DebounceTime)
            })

            return { list }
        }

        return {
            header: { title: 'Chat history' },
            filterOptions: [
                {
                    type: 'textinput',
                    icon: 'search',
                    id: 'search',
                    placeholder: 'Search...',
                },
            ],
            list: this.#chatHistoryDb.getHistory(),
        }
    }

    /**
     * Handles a click event on a conversation in the chat history.
     *
     * This method performs different actions based on the click parameters:
     * - If no action is specified, it attempts to open or focus the conversation tab.
     * - If the action is 'delete', it removes the conversation from the chat history.
     *
     */
    async onConversationClick(params: ConversationClickParams): Promise<ConversationClickResult> {
        const historyID = params.id

        // Handle user click on conversation in history
        if (!params.action) {
            const openTabID = this.#chatHistoryDb.getOpenTabId(historyID)
            // If conversation is already open, focus its tab. Otherwise, open new tab with conversation.
            if (openTabID) {
                await this.#features.chat.openTab({ tabId: openTabID })
            } else {
                const selectedTab = this.#chatHistoryDb.getTab(historyID)
                await this.restoreTab(selectedTab)
            }
            // Handle delete action
        } else if (params.action === 'delete') {
            this.#chatHistoryDb.deleteHistory(historyID)
        } // TODO: Handle Export action clicked
        else {
            this.#features.logging.error(`Unsupported action: ${params.action}`)
            return { ...params, success: false }
        }

        return { ...params, success: true }
    }

    /**
     * Opens new tab with a conversation from history.
     */
    async restoreTab(selectedTab?: Tab | null) {
        if (selectedTab) {
            const messages = selectedTab.conversations.flatMap((conv: Conversation) =>
                conv.messages.map(msg => messageToChatMessage(msg))
            )

            const { tabId } = await this.#features.chat.openTab({ newTabOptions: { data: { messages } } })
            this.#chatHistoryDb.setHistoryIdMapping(tabId, selectedTab.historyId)
            this.#chatHistoryDb.updateTabOpenState(tabId, true)
        }
    }

    /**
     * When IDE is opened, restore chats that were previously open in IDE for the current workspace.
     */
    async loadChats() {
        if (this.#loadedChats) {
            return
        }
        this.#loadedChats = true
        const openConversations = this.#chatHistoryDb.getOpenTabs()
        if (openConversations) {
            for (const conversation of openConversations) {
                if (conversation.conversations && conversation.conversations.length > 0) {
                    await this.restoreTab(conversation)
                }
            }
        }
    }
}
