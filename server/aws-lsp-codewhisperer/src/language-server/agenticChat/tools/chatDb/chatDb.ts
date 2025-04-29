/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
import * as Loki from 'lokijs'
import {
    chatMessageToMessage,
    Conversation,
    FileSystemAdapter,
    groupTabsByDate,
    Message,
    messageToStreamingMessage,
    Tab,
    TabCollection,
    TabType,
    updateOrCreateConversation,
} from './util'
import * as crypto from 'crypto'
import * as path from 'path'
import { Features } from '@aws/language-server-runtimes/server-interface/server'
import { ConversationItemGroup } from '@aws/language-server-runtimes/protocol'
import { ChatMessage, ToolResultStatus } from '@amzn/codewhisperer-streaming'
import { ChatItemType } from '@aws/mynah-ui'
import { getUserHomeDir } from '@aws/lsp-core/out/util/path'

export const EMPTY_CONVERSATION_LIST_ID = 'empty'
// Maximum number of characters to keep in history
const MaxConversationHistoryCharacters = 600_000
// Maximum number of messages to keep in history
const MaxConversationHistoryMessages = 250

/**
 * A singleton database class that manages chat history persistence using LokiJS.
 * This class handles storage and retrieval of chat conversations, messages, and tab states
 * for the Amazon Q VS Code extension.
 *
 * The database is stored in the user's home directory under .aws/amazonq/history
 * with a unique filename based on the workspace identifier.
 *
 * Ported from https://github.com/aws/aws-toolkit-vscode/blob/master/packages/core/src/shared/db/chatDb/chatDb.ts
 */

export class ChatDatabase {
    static #instance: ChatDatabase | undefined = undefined
    #db: Loki
    /**
     * Keep track of which open tabs have a corresponding history entry. Maps tabIds to historyIds
     */
    #historyIdMapping: Map<string, string> = new Map()
    #dbDirectory: string
    #features: Features
    #initialized: boolean = false

    constructor(features: Features) {
        this.#features = features
        this.#dbDirectory = path.join(
            features.runtime.platform === 'browser'
                ? features.workspace.fs.getServerDataDirPath('amazonq-chat')
                : getUserHomeDir(),
            '.aws/amazonq/history'
        )
        const workspaceId = this.getWorkspaceIdentifier()
        const dbName = `chat-history-${workspaceId}.json`

        this.#features.logging.log(`Initializing database at ${this.#dbDirectory}/${dbName}`)

        this.#db = new Loki(dbName, {
            adapter: new FileSystemAdapter(features.workspace, this.#dbDirectory),
            autosave: true,
            autoload: true,
            autoloadCallback: () => this.databaseInitialize(),
            autosaveInterval: 1000,
            persistenceMethod: 'fs',
        })
    }

    public static getInstance(features: Features): ChatDatabase {
        if (!ChatDatabase.#instance) {
            ChatDatabase.#instance = new ChatDatabase(features)
        }
        return ChatDatabase.#instance
    }

    public close() {
        this.#db.close()
        ChatDatabase.#instance = undefined
    }

    setHistoryIdMapping(tabId: string, historyId: string) {
        this.#features.logging.log(`Setting historyIdMapping: tabId=${tabId}, historyId=${historyId}`)
        this.#historyIdMapping.set(tabId, historyId)
    }

    /**
     * Generates an identifier for the open workspace folder(s).
     */
    getWorkspaceIdentifier() {
        let clientParams = this.#features.lsp.getClientInitializeParams()
        let workspaceFolderPaths = clientParams?.workspaceFolders?.map(({ uri }) => new URL(uri).pathname)
        // Case 1: Multi-root workspace (unsaved)
        if (workspaceFolderPaths && workspaceFolderPaths.length > 1) {
            // Create hash from all folder paths combined
            const pathsString = workspaceFolderPaths
                .sort() // Sort to ensure consistent hash regardless of folder order
                .join('|')
            return crypto.createHash('md5').update(pathsString).digest('hex')
        }

        // Case 2: Single folder workspace
        if (workspaceFolderPaths && workspaceFolderPaths[0]) {
            return crypto.createHash('md5').update(workspaceFolderPaths[0]).digest('hex')
        }

        // Case 3: No workspace open
        return 'no-workspace'
    }

    async databaseInitialize() {
        let entries = this.#db.getCollection(TabCollection)
        if (entries === null) {
            this.#features.logging.log(`Creating new collection`)
            entries = this.#db.addCollection(TabCollection, {
                unique: ['historyId'],
                indices: ['updatedAt', 'isOpen'],
            })
        }
        this.#initialized = true
    }

    getOpenTabs() {
        if (this.#initialized) {
            const collection = this.#db.getCollection<Tab>(TabCollection)
            return collection.find({ isOpen: true })
        }
    }

    getTab(historyId: string) {
        if (this.#initialized) {
            const collection = this.#db.getCollection<Tab>(TabCollection)
            return collection.findOne({ historyId })
        }
    }

    // If conversation is open, return its tabId, else return undefined
    getOpenTabId(historyId: string) {
        const selectedTab = this.getTab(historyId)
        if (selectedTab?.isOpen) {
            for (const [tabId, id] of this.#historyIdMapping) {
                if (id === historyId) {
                    return tabId
                }
            }
        }
        return undefined
    }

    /**
     * Delete a conversation from history when /clear command is sent on an open tab
     */
    clearTab(tabId: string) {
        if (this.#initialized) {
            const tabCollection = this.#db.getCollection<Tab>(TabCollection)
            const historyId = this.#historyIdMapping.get(tabId)
            if (historyId) {
                this.#features.logging.log(
                    `Removed conversation from history with tabId=${tabId}, historyId=${historyId}`
                )
                tabCollection.findAndRemove({ historyId })
            }
            this.#historyIdMapping.delete(tabId)
        }
    }

    updateTabOpenState(tabId: string, isOpen: boolean) {
        if (this.#initialized) {
            const tabCollection = this.#db.getCollection<Tab>(TabCollection)
            const historyId = this.#historyIdMapping.get(tabId)
            if (historyId) {
                this.#features.logging.log(`Updating tab open state: historyId=${historyId}, isOpen=${isOpen}`)
                tabCollection.findAndUpdate({ historyId }, (tab: Tab) => {
                    tab.isOpen = isOpen
                    return tab
                })
                if (!isOpen) {
                    this.#historyIdMapping.delete(tabId)
                }
            }
        }
    }

    /**
     * Searches messages across all conversations and tabs based on a given filter.
     * This function performs the following operations:
     * - If no filter is provided, it returns the entire conversation history
     * - Searches for the filter term (case-insensitive) in all message bodies
     * - Filters tabs that contain matching messages
     * - Groups the filtered results by date
     * - If no results are found, returns a single group with a "No matches found" message
     **/
    searchMessages(filter: string): ConversationItemGroup[] {
        let searchResults: ConversationItemGroup[] = []
        if (this.#initialized) {
            if (!filter) {
                this.#features.logging.log(`Empty search filter, returning all history`)
                return this.getHistory()
            }

            this.#features.logging.log(`Searching for ${filter}`)
            const searchTermLower = filter.toLowerCase()
            const tabCollection = this.#db.getCollection<Tab>(TabCollection)
            const tabs = tabCollection.find()
            const filteredTabs = tabs.filter((tab: Tab) => {
                return tab.conversations.some((conversation: Conversation) => {
                    return conversation.messages.some((message: Message) => {
                        return message.body?.toLowerCase().includes(searchTermLower)
                    })
                })
            })
            this.#features.logging.log(`Found ${filteredTabs.length} tabs with matching messages`)
            searchResults = groupTabsByDate(filteredTabs)
        }
        if (searchResults.length === 0) {
            this.#features.logging.log(`No matches found`)
            searchResults = [{ items: [{ id: EMPTY_CONVERSATION_LIST_ID, description: 'No matches found' }] }]
        }
        return searchResults
    }

    /**
     * Get messages for specified tabId
     * @param tabId The ID of the tab to get messages from
     * @param numMessages Optional number of most recent messages to return. If not provided, returns all messages.
     */
    getMessages(tabId: string, numMessages?: number) {
        if (this.#initialized) {
            const tabCollection = this.#db.getCollection<Tab>(TabCollection)
            const historyId = this.#historyIdMapping.get(tabId)
            this.#features.logging.log(
                `Getting messages for tabId=${tabId}, historyId=${historyId}, numMessages=${numMessages}`
            )
            const tabData = historyId ? tabCollection.findOne({ historyId }) : undefined
            if (tabData) {
                const allMessages = tabData.conversations.flatMap((conversation: Conversation) =>
                    conversation.messages.map(msg => messageToStreamingMessage(msg))
                )
                if (numMessages !== undefined) {
                    return allMessages.slice(-numMessages)
                }
                return allMessages
            }
        }
        return []
    }

    /**
     * Get all conversations for the current workspace, grouped by last updated time
     */
    getHistory(): ConversationItemGroup[] {
        if (this.#initialized) {
            const tabCollection = this.#db.getCollection<Tab>(TabCollection)
            const tabs = tabCollection.find()
            let groupedTabs = groupTabsByDate(tabs)
            this.#features.logging.log(`Found ${tabs.length} conversations from history`)
            if (groupedTabs.length === 0) {
                return [{ items: [{ id: EMPTY_CONVERSATION_LIST_ID, description: 'No chat history found' }] }]
            } else {
                return groupedTabs
            }
        }
        return []
    }

    /**
     * Deletes a conversation from history
     */
    deleteHistory(historyId: string) {
        if (this.#initialized) {
            const tabCollection = this.#db.getCollection<Tab>(TabCollection)
            tabCollection.findAndRemove({ historyId })
            this.#features.logging.log(`Removed conversation from history with historyId=${historyId}`)
            const tabId = this.getOpenTabId(historyId)
            if (tabId) {
                this.#historyIdMapping.delete(tabId)
            }
        }
    }

    /**
     * Adds a message to a conversation within a specified tab.
     *
     * This method manages chat messages in the following way:
     * - Creates a new history ID if none exists for the tab
     * - Updates existing conversation or creates new one
     * - Updates tab title with last user prompt added to conversation
     * - Updates tab's last updated time
     */
    addMessage(tabId: string, tabType: TabType, conversationId: string, message: Message) {
        if (this.#initialized) {
            const clientType = this.#features.lsp.getClientInitializeParams()?.clientInfo?.name || 'unknown'
            const tabCollection = this.#db.getCollection<Tab>(TabCollection)

            this.#features.logging.log(
                `Adding message to history: tabId=${tabId}, tabType=${tabType}, conversationId=${conversationId}`
            )

            let historyId = this.#historyIdMapping.get(tabId)

            if (!historyId) {
                historyId = crypto.randomUUID()
                this.#features.logging.log(`Creating new historyId=${historyId} for tabId=${tabId}`)
                this.setHistoryIdMapping(tabId, historyId)
            }

            const tabData = historyId ? tabCollection.findOne({ historyId }) : undefined
            const tabTitle =
                (message.type === 'prompt' && message.body.trim().length > 0 ? message.body : tabData?.title) ||
                'Amazon Q Chat'
            message = this.formatChatHistoryMessage(message)
            if (tabData) {
                this.#features.logging.log(`Updating existing tab with historyId=${historyId}`)
                tabData.conversations = updateOrCreateConversation(
                    tabData.conversations,
                    conversationId,
                    message,
                    clientType
                )
                tabData.updatedAt = new Date()
                tabData.title = tabTitle
                tabCollection.update(tabData)
            } else {
                this.#features.logging.log(`Creating new tab with historyId=${historyId}`)
                tabCollection.insert({
                    historyId,
                    updatedAt: new Date(),
                    isOpen: true,
                    tabType: tabType,
                    title: tabTitle,
                    conversations: [{ conversationId, clientType, messages: [message] }],
                })
            }
        }
    }

    formatChatHistoryMessage(message: Message): Message {
        if (message.type === ('prompt' as ChatItemType)) {
            return {
                ...message,
                userInputMessageContext: {
                    // Only keep toolResults in history
                    toolResults: message.userInputMessageContext?.toolResults,
                },
            }
        }
        return message
    }

    /**
     * Fixes the history to maintain the following invariants:
     * 1. The history contains at most MaxConversationHistoryMessages messages. Oldest messages are dropped.
     * 2. The history character length is <= MaxConversationHistoryCharacters - newUserMessageCharacterCount. Oldest messages are dropped.
     * 3. The first message is from the user. Oldest messages are dropped if needed.
     * 4. The last message is from the assistant. The last message is dropped if it is from the user.
     * 5. If the last message is from the assistant and it contains tool uses, and a next user
     *    message is set without tool results, then the user message will have cancelled tool results.
     */
    fixHistory(tabId: string, newUserMessage: ChatMessage, conversationId: string): void {
        if (!this.#initialized) {
            return
        }
        const historyId = this.#historyIdMapping.get(tabId)
        this.#features.logging.info(`Fixing history: tabId=${tabId}, historyId=${historyId || 'undefined'}`)

        if (!historyId) {
            return
        }

        const tabCollection = this.#db.getCollection<Tab>(TabCollection)
        const tabData = tabCollection.findOne({ historyId })
        if (!tabData) {
            return
        }

        let allMessages = tabData.conversations.flatMap((conversation: Conversation) => conversation.messages)
        this.#features.logging.info(`Found ${allMessages.length} messages in conversation`)

        //  Make sure we don't exceed MaxConversationHistoryMessages
        allMessages = this.trimHistoryToMaxLength(allMessages)

        //  Drop empty assistant partial if it’s the last message
        this.handleEmptyAssistantMessage(allMessages)

        //  Make sure max characters ≤ MaxConversationHistoryCharacters - newUserMessageCharacterCount
        allMessages = this.trimMessagesToMaxLength(allMessages, newUserMessage)

        //  Ensure messages in history a valid for server side checks
        this.ensureValidMessageSequence(allMessages)

        //  If the last message is from the assistant and it contains tool uses, and a next user message is set without tool results, then the user message will have cancelled tool results.
        this.handleToolUses(allMessages, newUserMessage)
        const clientType = this.#features.lsp.getClientInitializeParams()?.clientInfo?.name || 'unknown'

        tabData.conversations = [
            {
                conversationId: conversationId,
                clientType: clientType,
                messages: allMessages,
            },
        ]
        tabData.updatedAt = new Date()
        tabCollection.update(tabData)
        this.#features.logging.info(`Updated tab data in collection`)
    }

    private trimHistoryToMaxLength(messages: Message[]): Message[] {
        while (messages.length > MaxConversationHistoryMessages) {
            // Find the next valid user message to start from
            const indexToTrim = this.findIndexToTrim(messages)
            if (indexToTrim !== undefined && indexToTrim > 0) {
                this.#features.logging.debug(
                    `Removing the first ${indexToTrim} elements to maintain valid history length`
                )
                messages.splice(0, indexToTrim)
            } else {
                this.#features.logging.debug(
                    'Could not find a valid point to trim, reset history to reduce history size'
                )
                return []
            }
        }
        return messages
    }

    private findIndexToTrim(allMessages: Message[]): number | undefined {
        for (let i = 2; i < allMessages.length; i++) {
            const message = allMessages[i]
            if (message.type === ('prompt' as ChatItemType) && this.isValidUserMessageWithoutToolResults(message)) {
                return i
            }
        }
        return undefined
    }

    private isValidUserMessageWithoutToolResults(message: Message): boolean {
        const ctx = message.userInputMessageContext
        return !!ctx && (!ctx.toolResults || ctx.toolResults.length === 0) && message.body !== ''
    }

    private handleEmptyAssistantMessage(messages: Message[]): void {
        if (messages.length === 0) {
            return
        }

        const lastMsg = messages[messages.length - 1]
        if (
            lastMsg.type === ('answer' as ChatItemType) &&
            (!lastMsg.body || lastMsg.body.trim().length === 0) &&
            (!lastMsg.toolUses || lastMsg.toolUses.length === 0)
        ) {
            this.#features.logging.debug(
                'Last message is empty partial assistant. Removed last assistant message and user message'
            )
            messages.splice(-2)
        }
    }

    private trimMessagesToMaxLength(messages: Message[], newUserMessage: ChatMessage): Message[] {
        let totalCharacters = this.calculateHistoryCharacterCount(messages)
        this.#features.logging.debug(`Current history characters: ${totalCharacters}`)
        const currentUserInputCharacterCount = this.calculateCurrentMessageCharacterCount(
            chatMessageToMessage(newUserMessage)
        )
        this.#features.logging.debug(`Current user message characters: ${currentUserInputCharacterCount}`)
        const maxHistoryCharacterSize = Math.max(0, MaxConversationHistoryCharacters - currentUserInputCharacterCount)
        while (totalCharacters > maxHistoryCharacterSize && messages.length > 2) {
            // Find the next valid user message to start from
            const indexToTrim = this.findIndexToTrim(messages)
            if (indexToTrim !== undefined && indexToTrim > 0) {
                this.#features.logging.debug(
                    `Removing the first ${indexToTrim} elements in the history due to character count limit`
                )
                messages.splice(0, indexToTrim)
            } else {
                this.#features.logging.debug(
                    'Could not find a valid point to trim, reset history to reduce character count'
                )
                return []
            }
            totalCharacters = this.calculateHistoryCharacterCount(messages)
            this.#features.logging.debug(`Current history characters: ${totalCharacters}`)
        }
        return messages
    }

    private calculateHistoryCharacterCount(allMessages: Message[]): number {
        let count = 0
        for (const message of allMessages) {
            // Count characters of all message text
            count += message.body.length

            // Count characters in tool uses
            if (message.toolUses) {
                try {
                    for (const toolUse of message.toolUses) {
                        count += JSON.stringify(toolUse).length
                    }
                } catch (e) {
                    this.#features.logging.error(`Error counting toolUses: ${String(e)}`)
                }
            }
            // Count characters in tool results
            if (message.userInputMessageContext?.toolResults) {
                try {
                    for (const toolResul of message.userInputMessageContext.toolResults) {
                        count += JSON.stringify(toolResul).length
                    }
                } catch (e) {
                    this.#features.logging.error(`Error counting toolResults: ${String(e)}`)
                }
            }
        }
        return count
    }

    private calculateCurrentMessageCharacterCount(message: Message): number {
        let count = 0
        // Count characters of message text
        count += message.body.length

        // Count characters in tool uses
        if (message.toolUses) {
            try {
                for (const toolUse of message.toolUses) {
                    count += JSON.stringify(toolUse).length
                }
            } catch (e) {
                this.#features.logging.error(`Error counting toolUses: ${String(e)}`)
            }
        }
        // Count characters in tool results
        if (message.userInputMessageContext?.toolResults) {
            try {
                for (const toolResul of message.userInputMessageContext.toolResults) {
                    count += JSON.stringify(toolResul).length
                }
            } catch (e) {
                this.#features.logging.error(`Error counting toolResults: ${String(e)}`)
            }
        }
        // Count characters in tool spec for the current user message
        if (message.userInputMessageContext?.tools) {
            try {
                for (const toolSpec of message.userInputMessageContext.tools) {
                    count += JSON.stringify(toolSpec).length
                }
            } catch (e) {
                this.#features.logging.error(`Error counting tool spec length: ${String(e)}`)
            }
        }

        if (message.userInputMessageContext?.additionalContext) {
            try {
                for (const addtionalContext of message.userInputMessageContext.additionalContext) {
                    count += JSON.stringify(addtionalContext).length
                }
            } catch (e) {
                this.#features.logging.error(`Error counting addtionalContext length: ${String(e)}`)
            }
        }

        if (message.userInputMessageContext?.editorState) {
            try {
                count += JSON.stringify(message.userInputMessageContext?.editorState).length
            } catch (e) {
                this.#features.logging.error(`Error counting editorState length: ${String(e)}`)
            }
        }
        return count
    }

    private ensureValidMessageSequence(messages: Message[]): void {
        //  Make sure the first stored message is from the user (type === 'prompt'), else drop
        while (messages.length > 0 && messages[0].type === ('answer' as ChatItemType)) {
            messages.shift()
            this.#features.logging.debug('Dropped first message since it is not from user')
        }

        //  Make sure the last stored message is from the assistant (type === 'answer'), else drop
        if (messages.length > 0 && messages[messages.length - 1].type === ('prompt' as ChatItemType)) {
            messages.pop()
            this.#features.logging.debug('Dropped trailing user message')
        }
    }

    private handleToolUses(messages: Message[], newUserMessage: ChatMessage): void {
        if (messages.length === 0) {
            if (newUserMessage.userInputMessage?.userInputMessageContext?.toolResults) {
                this.#features.logging.debug('No history message found, but new user message has tool results.')
                newUserMessage.userInputMessage.userInputMessageContext.toolResults = undefined
                // tool results are empty, so content must not be empty
                newUserMessage.userInputMessage.content = 'Conversation history was too large, so it was cleared.'
            }
            return
        }

        const lastMsg = messages[messages.length - 1]
        if (lastMsg.toolUses && lastMsg.toolUses.length > 0) {
            const toolResults = newUserMessage.userInputMessage?.userInputMessageContext?.toolResults
            if (!toolResults || toolResults.length === 0) {
                this.#features.logging.debug(
                    `No tools results in last user message following a tool use message from assisstant, marking as canceled`
                )
                if (newUserMessage.userInputMessage?.userInputMessageContext) {
                    newUserMessage.userInputMessage.userInputMessageContext.toolResults = lastMsg.toolUses.map(
                        toolUse => ({
                            toolUseId: toolUse.toolUseId,
                            content: [
                                {
                                    type: 'Text',
                                    text: 'Tool use was cancelled by the user',
                                },
                            ],
                            status: ToolResultStatus.ERROR,
                        })
                    )
                }
            }
        }
    }
}
