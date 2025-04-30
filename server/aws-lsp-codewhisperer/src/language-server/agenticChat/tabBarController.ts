/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { ChatDatabase, EMPTY_CONVERSATION_LIST_ID } from './tools/chatDb/chatDb'
import { Conversation, messageToChatMessage, Tab } from './tools/chatDb/util'
import { Features } from '@aws/language-server-runtimes/server-interface/server'
import {
    Action as ConversationItemAction,
    ConversationClickParams,
    ConversationClickResult,
    ListConversationsParams,
    ListConversationsResult,
    TabBarActionParams,
    ConversationItemGroup,
} from '@aws/language-server-runtimes-types'
import { URI, Utils } from 'vscode-uri'
import { InitializeParams } from '@aws/language-server-runtimes/server-interface'

/**
 * Controller for managing chat history and export functionality.
 *
 * Handles chat conversation management including:
 * - Loading and restoring conversations from chat history
 * - Handling chat history operations (list, search, delete)
 * - Export chat
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

        const attachActionsToConversationList = (list: ConversationItemGroup[]) => {
            return list.map(group => {
                const items =
                    group.items?.map(item => ({
                        ...item,
                        ...(item.id !== EMPTY_CONVERSATION_LIST_ID
                            ? { actions: this.getConversationActions(item.id) }
                            : {}),
                    })) || []

                return {
                    ...group,
                    ...(items.length > 0 ? { items } : {}),
                }
            })
        }

        if (searchFilter) {
            let list: ConversationItemGroup[] = await new Promise<any[]>(resolve => {
                this.#searchTimeout = setTimeout(() => {
                    const results = this.#chatHistoryDb.searchMessages(searchFilter)
                    resolve(results)
                }, this.#DebounceTime)
            })
            list = attachActionsToConversationList(list)

            return { list }
        }

        let list = this.#chatHistoryDb.getHistory()
        list = attachActionsToConversationList(list)

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
            list,
        }
    }

    private getConversationActions(historyId: string): ConversationItemAction[] {
        const actions = []

        if (TabBarController.enableChatExport(this.#features.lsp.getClientInitializeParams())) {
            actions.push({
                text: 'Export',
                icon: 'external',
                id: historyId,
            })
        }

        actions.push({
            text: 'Delete',
            icon: 'trash',
            id: historyId,
        })

        return actions
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

        if (historyID === EMPTY_CONVERSATION_LIST_ID) {
            this.#features.logging.debug('Empty conversation history list item clicked')
            return { ...params, success: true }
        }

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
        } else if (params.action === 'delete') {
            this.#chatHistoryDb.deleteHistory(historyID)
        } else if (params.action === 'export') {
            let openTabID = this.#chatHistoryDb.getOpenTabId(historyID)

            // Restore tab if it is not open in Chat Client, this is needed to request serialized content from Chat Client later on.
            if (!openTabID) {
                const selectedTab = this.#chatHistoryDb.getTab(historyID)
                await this.restoreTab(selectedTab)

                openTabID = this.#chatHistoryDb.getOpenTabId(historyID)
            }

            if (!openTabID) {
                // If still not tab id - return error
                this.#features.logging.error('Failed to restore Chat Client Tab from history')
                return { ...params, success: false }
            }

            await this.onExportTab(openTabID)
        } else {
            this.#features.logging.error(`Unsupported action: ${params.action}`)
            return { ...params, success: false }
        }

        return { ...params, success: true }
    }

    async onTabBarAction(params: TabBarActionParams) {
        if (params.action === 'export' && params.tabId) {
            await this.onExportTab(params.tabId)

            return { ...params, success: true }
        }

        this.#features.logging.error(`Unsupported action ${params.action}`)
        return { ...params, success: false }
    }

    async onExportTab(tabId: string) {
        const defaultFileName = `q-dev-chat-${new Date().toISOString().split('T')[0]}.md`

        let defaultUri
        const clientParams = this.#features.lsp.getClientInitializeParams()
        let workspaceFolders = clientParams?.workspaceFolders
        if (workspaceFolders && workspaceFolders.length > 0) {
            const workspaceUri = URI.parse(workspaceFolders[0].uri)
            defaultUri = Utils.joinPath(workspaceUri, defaultFileName)
        } else {
            defaultUri = URI.file(defaultFileName)
        }

        const { targetUri } = await this.#features.lsp.window.showSaveFileDialog({
            supportedFormats: ['markdown', 'html'],
            defaultUri: defaultUri.toString(),
        })

        const targetPath = URI.parse(targetUri)
        const format = targetPath.fsPath.endsWith('.md') ? 'markdown' : 'html'
        const { content } = await this.#features.chat.getSerializedChat({
            tabId,
            format,
        })

        await this.#features.workspace.fs.writeFile(targetPath.path, content)
    }

    /**
     * Opens new tab with a conversation from history.
     */
    async restoreTab(selectedTab?: Tab | null) {
        if (selectedTab) {
            const messages = selectedTab.conversations.flatMap((conv: Conversation) =>
                conv.messages.flatMap(msg => messageToChatMessage(msg))
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

    public static enableChatExport(params?: InitializeParams) {
        if (params?.initializationOptions?.aws?.awsClientCapabilities?.window?.showSaveFileDialog) {
            // Export Chat UX flow relies on show Save File dialog protocol supported by client
            return true
        }

        return false
    }
}
