/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
import * as Loki from 'lokijs'
import {
    chatMessageToMessage,
    Conversation,
    DEFAULT_PINNED_CONTEXT,
    FileSystemAdapter,
    groupTabsByDate,
    Message,
    Rules,
    Settings,
    SettingsCollection,
    Tab,
    TabCollection,
    TabContext,
    TabType,
    calculateDatabaseSize,
    updateOrCreateConversation,
    getChatDbNameFromWorkspaceId,
    getSha256WorkspaceId,
    getMd5WorkspaceId,
    MessagesWithCharacterCount,
    estimateCharacterCountFromImageBlock,
} from './util'
import * as crypto from 'crypto'
import * as path from 'path'
import { Features } from '@aws/language-server-runtimes/server-interface/server'
import { ContextCommand, ConversationItemGroup } from '@aws/language-server-runtimes/protocol'
import { ChatMessage, ToolResultStatus } from '@amzn/codewhisperer-streaming'
import { ChatItemType } from '@aws/mynah-ui'
import { getUserHomeDir } from '@aws/lsp-core/out/util/path'
import { ChatHistoryMaintainer } from './chatHistoryMaintainer'
import { existsSync, renameSync } from 'fs'

export class ToolResultValidationError extends Error {
    constructor(message?: string) {
        super(message)
        this.name = 'ToolResultValidationError'
    }
}

export const EMPTY_CONVERSATION_LIST_ID = 'empty'
// Maximum number of characters to keep in request
// (200K tokens - 8K output tokens - 2k system prompt) * 3 = 570K characters, intentionally overestimating with 3:1 ratio
export const MaxOverallCharacters = 570_000
// Maximum number of history messages to include in each request to the LLM
const maxConversationHistoryMessages = 250

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
    #loadTimeMs?: number
    #dbFileSize?: number
    #historyMaintainer: ChatHistoryMaintainer

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
        const dbPath = path.join(this.#dbDirectory, dbName)

        this.#features.logging.log(`Initializing database at ${dbPath}`)

        calculateDatabaseSize(this.#features, dbPath)
            .then(size => {
                this.#dbFileSize = size
            })
            .catch(err => {
                this.#features.logging.warn(`Error getting db file size: ${err}`)
            })

        const startTime = Date.now()

        this.#db = new Loki(dbName, {
            adapter: new FileSystemAdapter(features.workspace, this.#dbDirectory),
            autosave: true,
            autoload: true,
            autoloadCallback: () => this.databaseInitialize(startTime),
            autosaveInterval: 1000,
            persistenceMethod: 'fs',
        })

        this.#historyMaintainer = new ChatHistoryMaintainer(features, this.#dbDirectory, dbName, this.#db)
        // Async process: Trimming history asynchronously if the size exceeds the max
        // This process will take several seconds
        this.#historyMaintainer.trimHistoryToMaxSize().catch(err => {
            this.#features.logging.error(`Error trimming history: ${err}`)
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

    /**
     * Returns whether the database has been initialized.
     */
    isInitialized(): boolean {
        return this.#initialized
    }

    setHistoryIdMapping(tabId: string, historyId: string) {
        this.#features.logging.log(`Setting historyIdMapping: tabId=${tabId}, historyId=${historyId}`)
        this.#historyIdMapping.set(tabId, historyId)
    }

    /**
     * Generates an identifier for the open workspace folder(s).
     */
    private getFolderBasedWorkspaceIdentifier() {
        let workspaceFolderPaths = this.#features.workspace
            .getAllWorkspaceFolders()
            ?.map(({ uri }) => new URL(uri).pathname)
        // Case 1: Multi-root workspace (unsaved)
        if (workspaceFolderPaths && workspaceFolderPaths.length > 1) {
            // Create hash from all folder paths combined
            const pathsString = workspaceFolderPaths
                .sort() // Sort to ensure consistent hash regardless of folder order
                .join('|')
            return getMd5WorkspaceId(pathsString)
        }

        // Case 2: Single folder workspace
        if (workspaceFolderPaths && workspaceFolderPaths[0]) {
            return getMd5WorkspaceId(workspaceFolderPaths[0])
        }

        // Case 3: No workspace open
        return 'no-workspace'
    }

    /**
     * Generates an identifier for the open workspace.
     */
    getWorkspaceIdentifier() {
        const workspaceFilePath =
            this.#features.lsp.getClientInitializeParams()?.initializationOptions?.aws?.awsClientCapabilities?.q
                ?.workspaceFilePath

        if (workspaceFilePath) {
            // Case 1: The latest plugins provide workspaceFilePath - should use workspace file-based SHA256 hash for workspace ID.
            // This distinguishes from older plugins that used MD5 of workspaceFilePath.
            const workspaceId = getSha256WorkspaceId(workspaceFilePath)
            const dbFilePath = path.join(this.#dbDirectory, getChatDbNameFromWorkspaceId(workspaceId))

            const dbFileExists = existsSync(dbFilePath)
            if (!dbFileExists) {
                // Migrate the history file from folder-based to workspace file-based.
                this.migrateHistoryFile(dbFilePath)
            }

            this.#features.logging.debug(`workspaceFilePath is set: ${workspaceFilePath}, workspaceId: ${workspaceId}`)
            return workspaceId
        } else {
            // Case 2: workspaceFilePath is not set, use folder-based workspaceId
            return this.getFolderBasedWorkspaceIdentifier()
        }
    }

    /**
     * Migrate the workspace folder based history file to workspaceFile based history file
     * @param newDbFilePath workspaceFile based history file path
     */
    private migrateHistoryFile(newDbFilePath: string) {
        // Check if old folder-based history file exists and migrate it to the new workspace file-based location.
        // If no old file exists, we'll simply use the new workspace ID for the history file.
        const oldWorkspaceIdentifier = this.getFolderBasedWorkspaceIdentifier()
        const oldDbFilePath = path.join(this.#dbDirectory, getChatDbNameFromWorkspaceId(oldWorkspaceIdentifier))
        const oldDbFileExists = existsSync(oldDbFilePath)
        if (oldDbFileExists) {
            this.#features.logging.log(`Migrating history file from ${oldDbFilePath} to ${newDbFilePath}`)
            renameSync(oldDbFilePath, newDbFilePath)
        }
    }

    /**
     * Gets the current size of the database file in bytes.
     * @returns Promise that resolves to the file size in bytes, or undefined if the file doesn't exist
     */
    getDatabaseFileSize(): number | undefined {
        return this.#dbFileSize
    }

    async databaseInitialize(startTime: number) {
        let entries = this.#db.getCollection(TabCollection)
        if (entries === null) {
            this.#features.logging.log(`Creating new collection`)
            entries = this.#db.addCollection(TabCollection, {
                unique: ['historyId'],
                indices: ['updatedAt', 'isOpen'],
            })
        }
        this.#db.addCollection(SettingsCollection)
        this.#initialized = true
        this.#loadTimeMs = Date.now() - startTime
    }

    getOpenTabs() {
        if (this.isInitialized()) {
            const collection = this.#db.getCollection<Tab>(TabCollection)
            return collection.find({ isOpen: true })
        }
    }

    addTabWithContext(collection: Collection<Tab>, historyId: string, tabContext: TabContext) {
        collection.insert({
            tabType: 'cwc',
            historyId,
            title: 'Amazon Q Chat',
            conversations: [],
            isOpen: true,
            updatedAt: new Date(),
            tabContext,
        })
    }

    getRules(tabId: string): Rules {
        if (this.#initialized) {
            const collection = this.#db.getCollection<Tab>(TabCollection)
            const historyId = this.#historyIdMapping.get(tabId)
            if (historyId) {
                const tab = collection.findOne({ historyId })
                return tab?.tabContext?.rules || { folders: {}, rules: {} }
            }
        }
        return { folders: {}, rules: {} }
    }

    getPinnedContext(tabId: string): ContextCommand[] {
        if (this.#initialized) {
            const collection = this.#db.getCollection<Tab>(TabCollection)
            const historyId = this.getOrCreateHistoryId(tabId)
            if (historyId) {
                const tab = collection.findOne({ historyId })
                return tab?.tabContext?.pinnedContext || DEFAULT_PINNED_CONTEXT
            }
        }
        return []
    }

    setRules(tabId: string, rules: Rules) {
        if (this.#initialized) {
            const collection = this.#db.getCollection<Tab>(TabCollection)
            const historyId = this.getOrCreateHistoryId(tabId)
            const tab = collection.findOne({ historyId })

            this.#features.logging.log(`Updating rules: rules=${JSON.stringify(rules)}`)

            if (!tab) {
                this.addTabWithContext(collection, historyId, { rules })
            } else {
                if (!tab.tabContext) {
                    tab.tabContext = {}
                }
                tab.tabContext.rules = rules
                collection.update(tab)
            }
        }
    }

    addPinnedContext(tabId: string, context: ContextCommand) {
        if (this.#initialized) {
            const collection = this.#db.getCollection<Tab>(TabCollection)
            const historyId = this.getOrCreateHistoryId(tabId)
            if (historyId) {
                this.#features.logging.log(
                    `Adding pinned context: historyId=${historyId}, context=${JSON.stringify(context)}`
                )
                const tab = collection.findOne({ historyId })
                if (!tab) {
                    this.addTabWithContext(collection, historyId, {
                        pinnedContext: DEFAULT_PINNED_CONTEXT.concat([context]),
                    })
                } else {
                    if (!tab.tabContext) {
                        tab.tabContext = {}
                    }
                    if (!tab.tabContext.pinnedContext) {
                        tab.tabContext.pinnedContext = DEFAULT_PINNED_CONTEXT
                    }
                    // Only add context item if its not already in this tab's pinned context
                    if (!tab.tabContext.pinnedContext.find(c => c.id === context.id)) {
                        // Active file pill should always be at the beginning of pinned context
                        if (DEFAULT_PINNED_CONTEXT.find(item => context.id === item.id)) {
                            tab.tabContext.pinnedContext.unshift(context)
                        } else {
                            tab.tabContext.pinnedContext.push(context)
                        }
                    }
                    collection.update(tab)
                }
            }
        }
    }

    removePinnedContext(tabId: string, context: ContextCommand) {
        if (this.#initialized) {
            const collection = this.#db.getCollection<Tab>(TabCollection)
            const historyId = this.getOrCreateHistoryId(tabId)
            if (historyId) {
                this.#features.logging.log(
                    `Removing pinned context: historyId=${historyId}, context=${JSON.stringify(context)}`
                )
                const tab = collection.findOne({ historyId })
                if (!tab) {
                    this.addTabWithContext(collection, historyId, { pinnedContext: [] })
                } else {
                    if (!tab.tabContext) {
                        tab.tabContext = {}
                    }
                    if (!tab.tabContext.pinnedContext) {
                        tab.tabContext.pinnedContext = []
                    }
                    tab.tabContext.pinnedContext = tab.tabContext.pinnedContext.filter(c => c.id !== context.id)
                    collection.update(tab)
                }
            }
        }
    }

    getLoadTime() {
        return this.#loadTimeMs
    }

    getTab(historyId: string) {
        if (this.isInitialized()) {
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
        if (this.isInitialized()) {
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
        if (this.isInitialized()) {
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
    searchMessages(filter: string): { results: ConversationItemGroup[]; searchTime: number } {
        let searchResults: ConversationItemGroup[] = []
        const startTime = Date.now()

        if (this.isInitialized()) {
            if (!filter) {
                this.#features.logging.log(`Empty search filter, returning all history`)
                return { results: this.getHistory(), searchTime: Date.now() - startTime }
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
        return { results: searchResults, searchTime: Date.now() - startTime }
    }

    /**
     * Get messages for specified tabId
     * @param tabId The ID of the tab to get messages from
     * @param numMessages Optional number of most recent messages to return. If not provided, returns all messages.
     */
    getMessages(tabId: string, numMessages?: number) {
        if (this.isInitialized()) {
            const tabCollection = this.#db.getCollection<Tab>(TabCollection)
            const historyId = this.#historyIdMapping.get(tabId)
            this.#features.logging.log(
                `Getting messages for tabId=${tabId}, historyId=${historyId}, numMessages=${numMessages}`
            )
            const tabData = historyId ? tabCollection.findOne({ historyId }) : undefined
            if (tabData) {
                const allMessages = tabData.conversations.flatMap((conversation: Conversation) => conversation.messages)
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
        if (this.isInitialized()) {
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
        if (this.isInitialized()) {
            const tabCollection = this.#db.getCollection<Tab>(TabCollection)
            tabCollection.findAndRemove({ historyId })
            this.#features.logging.log(`Removed conversation from history with historyId=${historyId}`)
            const tabId = this.getOpenTabId(historyId)
            if (tabId) {
                this.#historyIdMapping.delete(tabId)
            }
        }
    }

    getOrCreateHistoryId(tabId: string) {
        let historyId = this.#historyIdMapping.get(tabId)

        if (!historyId) {
            historyId = this.createHistoryId(tabId)
        }

        return historyId
    }

    createHistoryId(tabId: string) {
        const historyId = crypto.randomUUID()
        this.#features.logging.log(`Creating new historyId=${historyId} for tabId=${tabId}`)
        this.setHistoryIdMapping(tabId, historyId)

        return historyId
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
        if (this.isInitialized()) {
            const clientType = this.#features.lsp.getClientInitializeParams()?.clientInfo?.name || 'unknown'
            const tabCollection = this.#db.getCollection<Tab>(TabCollection)

            this.#features.logging.log(
                `Adding message to history: tabId=${tabId}, tabType=${tabType}, conversationId=${conversationId}`
            )

            let historyId = this.getOrCreateHistoryId(tabId)

            const tabData = historyId ? tabCollection.findOne({ historyId }) : undefined
            const tabTitle =
                (message.type === 'prompt' && message.shouldDisplayMessage !== false && message.body.trim().length > 0
                    ? message.body
                    : tabData?.title) || 'Amazon Q Chat Agent' // Show default message in place of IDE-to-LLM prompts for generating test/documentation/development content
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
                    conversations: [{ conversationId, clientType, updatedAt: new Date(), messages: [message] }],
                })
            }
        }
    }

    /**
     * Replace history with summary/dummyResponse pair within a specified tab.
     *
     * This method manages chat messages by creating a new history with compacted summary and dummy response pairs
     */
    replaceWithSummary(tabId: string, tabType: TabType, conversationId: string, message: Message) {
        if (this.isInitialized()) {
            const clientType = this.#features.lsp.getClientInitializeParams()?.clientInfo?.name || 'unknown'
            const tabCollection = this.#db.getCollection<Tab>(TabCollection)

            this.#features.logging.log(
                `Replace history with summary: tabId=${tabId}, tabType=${tabType}, conversationId=${conversationId}`
            )

            const oldHistoryId = this.getOrCreateHistoryId(tabId)
            // create a new historyId to start fresh
            const historyId = this.createHistoryId(tabId)

            const tabData = historyId ? tabCollection.findOne({ historyId }) : undefined
            const tabTitle =
                (message.type === 'prompt' && message.shouldDisplayMessage !== false && message.body.trim().length > 0
                    ? message.body
                    : tabData?.title) || 'Amazon Q Chat'
            message = this.formatChatHistoryMessage(message)
            this.#features.logging.log(`Overriding tab with new historyId=${historyId}`)
            tabCollection.insert({
                historyId,
                updatedAt: new Date(),
                isOpen: true,
                tabType: tabType,
                title: tabTitle,
                conversations: [
                    {
                        conversationId,
                        clientType,
                        updatedAt: new Date(),
                        messages: [
                            // summary
                            message,
                            // dummy response
                            {
                                body: 'Working...',
                                type: 'answer',
                                shouldDisplayMessage: false,
                                timestamp: new Date(),
                            },
                        ],
                    },
                ],
            })

            if (oldHistoryId) {
                tabCollection.findAndRemove({ historyId: oldHistoryId })
            }
        }
    }

    /**
     * Replace history with summary/dummyResponse pair within a specified tab.
     *
     * This method manages chat messages by creating a new history with compacted summary and dummy response pairs
     */
    replaceHistory(tabId: string, tabType: TabType, conversationId: string, messages: Message[]) {
        if (this.isInitialized()) {
            const clientType = this.#features.lsp.getClientInitializeParams()?.clientInfo?.name || 'unknown'
            const tabCollection = this.#db.getCollection<Tab>(TabCollection)

            this.#features.logging.log(
                `Update history with new messages: tabId=${tabId}, tabType=${tabType}, conversationId=${conversationId}`
            )

            const oldHistoryId = this.getOrCreateHistoryId(tabId)
            // create a new historyId to start fresh
            const historyId = this.createHistoryId(tabId)

            const tabData = historyId ? tabCollection.findOne({ historyId }) : undefined
            const tabTitle = tabData?.title || 'Amazon Q Chat'
            messages = messages.map(msg => this.formatChatHistoryMessage(msg))
            this.#features.logging.log(`Overriding tab with new historyId=${historyId}`)
            tabCollection.insert({
                historyId,
                updatedAt: new Date(),
                isOpen: true,
                tabType: tabType,
                title: tabTitle,
                conversations: [
                    {
                        conversationId,
                        clientType,
                        updatedAt: new Date(),
                        messages: messages,
                    },
                ],
            })

            if (oldHistoryId) {
                tabCollection.findAndRemove({ historyId: oldHistoryId })
            }
        }
    }

    formatChatHistoryMessage(message: Message): Message {
        if (message.type === ('prompt' as ChatItemType)) {
            let hasToolResults = false
            if (message.userInputMessageContext?.toolResults) {
                hasToolResults = message.userInputMessageContext?.toolResults.length > 0
            }
            return {
                ...message,
                userInputMessageContext: {
                    // keep falcon context when inputMessage is not a toolResult message
                    editorState: hasToolResults ? undefined : message.userInputMessageContext?.editorState,
                    // Only keep toolResults in history
                    toolResults: message.userInputMessageContext?.toolResults,
                },
            }
        }
        return message
    }

    /**
     * Prepare the history messages for service request and fix the persisted history in DB to maintain the following invariants:
     * 1. The history contains at most MaxConversationHistoryMessages messages. Oldest messages are dropped.
     * 2. The first message is from the user and without any tool usage results, and the last message is from the assistant.
     *    The history contains alternating sequene of userMessage followed by assistantMessages
     * 3. The toolUse and toolResult relationship is valid
     * 4. The history character length is <= MaxConversationHistoryCharacters - newUserMessageCharacterCount. Oldest messages are dropped.
     */
    fixAndGetHistory(
        tabId: string,
        conversationId: string,
        newUserMessage: ChatMessage,
        pinnedContextMessages: ChatMessage[]
    ): MessagesWithCharacterCount {
        let newUserInputCount = this.calculateNewMessageCharacterCount(newUserMessage, pinnedContextMessages)
        let messagesWithCount: MessagesWithCharacterCount = {
            history: [],
            historyCount: 0,
            currentCount: newUserInputCount,
        }
        if (!this.isInitialized()) {
            return messagesWithCount
        }

        this.#features.logging.info(`Fixing history: tabId=${tabId}`)

        // 1. Make sure the length of the history messages don't exceed MaxConversationHistoryMessages
        let allMessages = this.getMessages(tabId, maxConversationHistoryMessages)
        if (allMessages.length > 0) {
            // 2. Fix history: Ensure messages in history is valid for server side checks
            this.ensureValidMessageSequence(tabId, allMessages)

            // 3. Fix new user prompt: Ensure lastMessage in history toolUse and newMessage toolResult relationship is valid
            this.validateAndFixNewMessageToolResults(allMessages, newUserMessage)

            // 4. NOTE: Keep this trimming logic at the end of the preprocess.
            // Make sure max characters ≤ remaining Character Budget, must be put at the end of preprocessing
            messagesWithCount = this.trimMessagesToMaxLength(allMessages, newUserInputCount, tabId, conversationId)

            // Edge case: If the history is empty and the next message contains tool results, then we have to just abandon them.
            if (
                messagesWithCount.history.length === 0 &&
                newUserMessage.userInputMessage?.userInputMessageContext?.toolResults?.length &&
                newUserMessage.userInputMessage?.userInputMessageContext?.toolResults?.length > 0
            ) {
                this.#features.logging.warn('History overflow: abandoning dangling toolResults.')
                newUserMessage.userInputMessage.userInputMessageContext.toolResults = []
                newUserMessage.userInputMessage.content = 'The conversation history has overflowed, clearing state'
                // Update character count for current message
                this.#features.logging.debug(`Updating input character with pinnedContext`)
                messagesWithCount.currentCount = this.calculateNewMessageCharacterCount(
                    newUserMessage,
                    pinnedContextMessages
                )
            }
        }

        // Prepend pinned context fake message pair to beginning of history
        if (pinnedContextMessages.length === 2) {
            const pinnedMessages = pinnedContextMessages.map(msg => chatMessageToMessage(msg))
            messagesWithCount.history = [...pinnedMessages, ...messagesWithCount.history]
        }

        return messagesWithCount
    }

    /**
     * Finds a suitable "break point" index in the message sequence.
     *
     * It ensures that the "break point" is at a clean conversation boundary where:
     * 1. The message is from a user (type === 'prompt')
     * 2. The message doesn't contain tool results that would break tool use/result pairs
     * 3. The message has a non-empty body
     *
     * @param allMessages The array of conversation messages to search through
     * @returns The index to trim from, or undefined if no suitable trimming point is found
     */
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

    private trimMessagesToMaxLength(
        messages: Message[],
        newUserInputCount: number,
        tabId: string,
        conversationId: string
    ): MessagesWithCharacterCount {
        let historyCharacterCount = this.calculateMessagesCharacterCount(messages)
        const maxHistoryCharacterSize = Math.max(0, MaxOverallCharacters - newUserInputCount)
        let trimmedHistory = false
        this.#features.logging.debug(
            `Current history character count: ${historyCharacterCount}, remaining history character budget: ${maxHistoryCharacterSize}`
        )
        while (historyCharacterCount > maxHistoryCharacterSize && messages.length > 2) {
            trimmedHistory = true
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
                this.replaceHistory(tabId, 'cwc', conversationId, [])
                return { history: [], historyCount: 0, currentCount: newUserInputCount }
            }
            historyCharacterCount = this.calculateMessagesCharacterCount(messages)
            this.#features.logging.debug(`History character count post trimming: ${historyCharacterCount}`)
        }

        if (trimmedHistory) {
            this.replaceHistory(tabId, 'cwc', conversationId, messages)
        }
        return {
            history: messages,
            historyCount: historyCharacterCount,
            currentCount: newUserInputCount,
        }
    }

    private calculateToolSpecCharacterCount(currentMessage: ChatMessage): number {
        let count = 0
        if (currentMessage.userInputMessage?.userInputMessageContext?.tools) {
            try {
                for (const tool of currentMessage.userInputMessage?.userInputMessageContext?.tools) {
                    count += JSON.stringify(tool).length
                }
            } catch (e) {
                this.#features.logging.error(`Error counting tools: ${String(e)}`)
            }
        }
        return count
    }

    calculateNewMessageCharacterCount(newUserMessage: ChatMessage, pinnedContextMessages: ChatMessage[]): number {
        const currentUserInputCharacterCount = this.calculateMessagesCharacterCount([
            chatMessageToMessage(newUserMessage),
        ])
        const pinnedContextCount = this.calculateMessagesCharacterCount([
            ...pinnedContextMessages.map(msg => chatMessageToMessage(msg)),
        ])
        const currentInputToolSpecCount = this.calculateToolSpecCharacterCount(newUserMessage)
        const totalCount = currentUserInputCharacterCount + currentInputToolSpecCount + pinnedContextCount
        this.#features.logging.debug(
            `Current user message characters input: ${currentUserInputCharacterCount} + toolSpec: ${currentInputToolSpecCount} + pinnedContext: ${pinnedContextCount} = total: ${totalCount}`
        )
        return totalCount
    }

    calculateMessagesCharacterCount(allMessages: Message[]): number {
        let bodyCount = 0
        let toolUsesCount = 0
        let toolResultsCount = 0
        let editorStateCount = 0
        let imageCharCount = 0

        for (const message of allMessages) {
            // Count characters of all message text
            bodyCount += message.body.length

            // Count characters in tool uses
            if (message.toolUses) {
                try {
                    for (const toolUse of message.toolUses) {
                        toolUsesCount += JSON.stringify(toolUse).length
                    }
                } catch (e) {
                    this.#features.logging.error(`Error counting toolUses: ${String(e)}`)
                }
            }
            // Count characters in tool results
            if (message.userInputMessageContext?.toolResults) {
                try {
                    for (const toolResul of message.userInputMessageContext.toolResults) {
                        toolResultsCount += JSON.stringify(toolResul).length
                    }
                } catch (e) {
                    this.#features.logging.error(`Error counting toolResults: ${String(e)}`)
                }
            }
            if (message.userInputMessageContext?.editorState) {
                try {
                    editorStateCount += JSON.stringify(message.userInputMessageContext?.editorState).length
                } catch (e) {
                    this.#features.logging.error(`Error counting editorState: ${String(e)}`)
                }
            }

            if (message.images) {
                try {
                    for (const image of message.images) {
                        let imageTokenInCharacter = estimateCharacterCountFromImageBlock(image)
                        imageCharCount += imageTokenInCharacter
                    }
                } catch (e) {
                    this.#features.logging.error(`Error counting images: ${String(e)}`)
                }
            }
        }

        const totalCount = bodyCount + toolUsesCount + toolResultsCount + editorStateCount + imageCharCount
        this.#features.logging.debug(
            `Messages characters: body: ${bodyCount} + toolUses: ${toolUsesCount} + toolResults: ${toolResultsCount} + editorState: ${editorStateCount} + images: ${imageCharCount} = total: ${totalCount}`
        )
        return totalCount
    }

    /**
     * Gets the latest conversation ID for a given tab
     * @param tabId The ID of the tab to get the latest conversation ID from
     * @returns The latest conversation ID, or an empty string if none exists
     */
    private getLatestConversationId(tabId: string): string {
        const tabCollection = this.#db.getCollection<Tab>(TabCollection)
        const historyId = this.#historyIdMapping.get(tabId)
        const tabData = historyId ? tabCollection.findOne({ historyId }) : undefined
        const lastConversationLength = tabData?.conversations?.length || 0

        if (lastConversationLength > 0) {
            return tabData?.conversations[lastConversationLength - 1].conversationId || ''
        }

        return ''
    }

    /**
     * Ensures that the message sequence follows the required pattern for a valid conversation.
     *
     * This method enforces two key rules:
     * 1. The first message must be from the user (type === 'prompt')
     * 2. The last message must be from the assistant (type === 'answer')
     *
     * If the first rule is violated, leading assistant messages are removed.
     * If the second rule is violated, a dummy response is added to maintain the alternating user-assistant pattern.
     *
     * @param tabId - The current tabId.
     * @param messages - The message history to validate and potentially modify, this will be attached to the service request.
     */
    ensureValidMessageSequence(tabId: string, messages: Message[]): void {
        if (messages.length === 0) {
            return
        }

        // Make sure the first message sent to LLM is from the user (type === 'prompt'), else drop
        while (messages.length > 0 && messages[0].type === ('answer' as ChatItemType)) {
            messages.shift()
            this.#features.logging.debug('Dropped first message since it is not from user')
        }

        // Make sure the first user message doesn't have tool usage results.
        while (
            messages.length > 0 &&
            messages[0].type === ('prompt' as ChatItemType) &&
            !this.isValidUserMessageWithoutToolResults(messages[0])
        ) {
            // Remove first user-assistant pair - here we assume that the mid-sequence messages are always in the alternating user-assistant pattern
            messages.splice(0, 2)
            this.#features.logging.debug('Dropped the first message pair since the user message has tool usage results')
        }

        //  Make sure the last message is from the assistant (type === 'answer'), else add a dummy response
        if (messages.length > 0 && messages[messages.length - 1].type === ('prompt' as ChatItemType)) {
            // Add an assistant response to both request and DB to maintain a valid sequence
            const dummyResponse: Message = {
                body: 'Working...',
                type: 'answer',
                shouldDisplayMessage: false,
                timestamp: new Date(),
            }
            // Add to service request
            messages.push(dummyResponse)
            // Add to the last conversation in history DB
            const lastConversationId = this.getLatestConversationId(tabId)
            this.addMessage(tabId, 'cwc', lastConversationId, dummyResponse)
            this.#features.logging.debug('Added a dummy response for the trailing user message')
        }
    }

    /**
     * This method modifies the new user message and ensuring that tool results in a new user message
     * properly correspond to tool uses from the previous assistant message.
     *
     * This validation should be performed before sending requests and is critical for maintaining
     * a coherent conversation flow when tools are involved, ensuring the AI model has accurate context
     * about which tools were actually used and which were cancelled or failed.
     *
     * @param messages The conversation history messages
     * @param newUserMessage The new user message being added to the conversation
     * @throws ToolResultValidationError if the message is invalid and not able to be fixed
     */
    validateAndFixNewMessageToolResults(messages: Message[], newUserMessage: ChatMessage) {
        if (newUserMessage?.userInputMessage?.userInputMessageContext) {
            const newUserMessageContext = newUserMessage.userInputMessage.userInputMessageContext
            const toolResults = newUserMessageContext.toolResults || []
            if (messages.length === 0) {
                if (toolResults && toolResults.length > 0) {
                    throw new ToolResultValidationError(
                        'New message has tool results but last message has no tool uses'
                    )
                }
                return
            }
            const lastMsg = messages[messages.length - 1]
            const lastMsgToolUses = lastMsg?.toolUses || []

            // If last message has no tool uses but new message has tool results, this is invalid
            if (toolResults && toolResults.length > 0 && lastMsgToolUses.length === 0) {
                throw new ToolResultValidationError('New message has tool results but last message has no tool uses')
            }

            const toolUseIds = new Set(lastMsgToolUses.map(toolUse => toolUse.toolUseId))
            const validToolResults = toolResults.filter(toolResult => toolUseIds.has(toolResult.toolUseId))

            if (validToolResults.length < toolUseIds.size) {
                // Add cancelled tool results for missing IDs
                const missingToolUses = lastMsgToolUses.filter(
                    toolUses => !validToolResults.some(toolResults => toolResults.toolUseId === toolUses.toolUseId)
                )

                for (const toolUse of missingToolUses) {
                    this.#features.logging.warn(
                        `newUserMessage missing ToolResult for ${toolUse.toolUseId}. Inserting cancelled.`
                    )
                    validToolResults.push({
                        toolUseId: toolUse.toolUseId,
                        status: ToolResultStatus.ERROR,
                        content: [{ text: 'Tool use was cancelled by the user' }],
                    })
                }
            }
            newUserMessageContext.toolResults = validToolResults

            if (
                newUserMessageContext.toolResults.length === 0 &&
                (!newUserMessage.userInputMessage.content || newUserMessage.userInputMessage.content?.trim() == '')
            ) {
                throw new ToolResultValidationError('Empty message with no tool results')
            }
        }
    }

    getSettings(): Settings | undefined {
        if (this.#initialized) {
            const settingsCollection = this.#db.getCollection<Settings>(SettingsCollection)
            const settings = settingsCollection.findOne({})
            return settings || undefined
        }
        return undefined
    }

    updateSettings(settings: Settings): void {
        if (this.#initialized) {
            const settingsCollection = this.#db.getCollection<Settings>(SettingsCollection)
            const existingSettings = settingsCollection.findOne({})
            if (existingSettings) {
                this.#features.logging.log('Updating existing settings')
                settingsCollection.update({ ...existingSettings, ...settings })
            } else {
                this.#features.logging.log('Creating new settings')
                settingsCollection.insert(settings)
            }
        }
    }

    getModelId(): string | undefined {
        const settings = this.getSettings()
        return settings?.modelId === '' ? undefined : settings?.modelId
    }

    setModelId(modelId: string | undefined): void {
        this.updateSettings({ modelId: modelId === '' ? undefined : modelId })
    }

    getPairProgrammingMode(): boolean | undefined {
        const settings = this.getSettings()
        return settings?.pairProgrammingMode
    }

    setPairProgrammingMode(pairProgrammingMode: boolean | undefined): void {
        // Get existing settings to preserve other fields like modelId
        const settings = this.getSettings() || { modelId: undefined }
        this.updateSettings({ ...settings, pairProgrammingMode })
    }
}
