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
    isEmptyAssistantMessage,
    Message,
    messageToStreamingMessage,
    Settings,
    SettingsCollection,
    Tab,
    TabCollection,
    TabType,
    updateOrCreateConversation,
    initializeHistoryPriorityQueue,
    getOldestMessageTimestamp,
} from './util'
import * as crypto from 'crypto'
import * as path from 'path'
import { Features } from '@aws/language-server-runtimes/server-interface/server'
import { ConversationItemGroup } from '@aws/language-server-runtimes/protocol'
import { ChatMessage, ToolResultStatus } from '@aws/codewhisperer-streaming-client'
import { ChatItemType } from '@aws/mynah-ui'
import { getUserHomeDir } from '@aws/lsp-core/out/util/path'

export const EMPTY_CONVERSATION_LIST_ID = 'empty'
// Maximum number of characters to send in request
const maxConversationHistoryCharacters = 600_000
// Maximum number of messages to send in request
const maxConversationHistoryMessages = 250
// Maximum history file size across all workspace, 200MB
const maxHistorySizeInBytes = 200 * 1024 * 1024
// 75% of the max size, 150MB
const maxAfterTrimHistorySizeInBytes = 150 * 1024 * 1024
/**
 * The combination of messageBatchDeleteIterationBeforeRecalculateDBSize and messageBatchDeleteSizeForSingleTab can heavily impact the
 * latency of trimming history since calculating the history file size is slow. We can tune these numbers according to the average message size
 */
// Batch deletion iteration count when trimming history before re-calculating total history size
const messageBatchDeleteIterationBeforeRecalculateDBSize = 200
// Batch deletion message size when trimming history for a specific tab before re-checking the oldest message among all workspace history
const messageBatchDeleteSizeForSingleTab = 10
// In each iteration, we calculate the total history size and try to delete [messageBatchDeleteSizeForSingleTab * messageBatchDeleteIterationBeforeRecalculateDBSize] messages
const maxTrimHistoryLoopIteration = 100

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
    #dbName: string
    #features: Features
    #initialized: boolean = false
    #loadTimeMs?: number
    #dbFileSize?: number

    constructor(features: Features) {
        this.#features = features
        this.#dbDirectory = path.join(
            features.runtime.platform === 'browser'
                ? features.workspace.fs.getServerDataDirPath('amazonq-chat')
                : getUserHomeDir(),
            '.aws/amazonq/history'
        )
        const workspaceId = this.getWorkspaceIdentifier()
        this.#dbName = `chat-history-${workspaceId}.json`
        const dbPath = path.join(this.#dbDirectory, this.#dbName)

        this.#features.logging.log(`Initializing database at ${dbPath}`)

        this.calculateDatabaseSize(dbPath)
            .then(size => {
                this.#dbFileSize = size
            })
            .catch(err => {
                this.#features.logging.log(`Error getting db file size: ${err}`)
            })

        const startTime = Date.now()

        this.#db = new Loki(this.#dbName, {
            adapter: new FileSystemAdapter(features.workspace, this.#dbDirectory),
            autosave: true,
            autoload: true,
            autoloadCallback: () => this.databaseInitialize(startTime),
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
        let workspaceFolderPaths = this.#features.workspace
            .getAllWorkspaceFolders()
            ?.map(({ uri }) => new URL(uri).pathname)
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
        if (this.#initialized) {
            const collection = this.#db.getCollection<Tab>(TabCollection)
            return collection.find({ isOpen: true })
        }
    }

    getLoadTime() {
        return this.#loadTimeMs
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
    searchMessages(filter: string): { results: ConversationItemGroup[]; searchTime: number } {
        let searchResults: ConversationItemGroup[] = []
        const startTime = Date.now()

        if (this.#initialized) {
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
        if (this.#initialized) {
            const tabCollection = this.#db.getCollection<Tab>(TabCollection)
            const historyId = this.#historyIdMapping.get(tabId)
            this.#features.logging.log(
                `Getting messages for tabId=${tabId}, historyId=${historyId}, numMessages=${numMessages}`
            )
            const tabData = historyId ? tabCollection.findOne({ historyId }) : undefined
            if (tabData) {
                const allMessages = tabData.conversations.flatMap(
                    (conversation: Conversation) => conversation.messages
                    // .map(msg => messageToStreamingMessage(msg))
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
     * - Drops the message and the previous user prompt if it's an empty assistant response
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

            // Skip adding to history DB if it's an empty assistant response
            if (isEmptyAssistantMessage(message)) {
                this.#features.logging.debug(
                    'The message is empty partial assistant. Skipped adding this message and removed last user prompt from the history DB'
                )
                if (tabData) {
                    // Remove the last user prompt as well
                    this.removeLastPromptFromConversation(tabData.conversations, conversationId)
                }
                return
            }

            const tabTitle =
                (message.type === 'prompt' && message.shouldDisplayMessage !== false && message.body.trim().length > 0
                    ? message.body
                    : tabData?.title) || 'Amazon Q Chat'
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
            let hasToolResults = false
            if (message.userInputMessageContext?.toolResults) {
                hasToolResults = message.userInputMessageContext?.toolResults.length > 0
            }
            return {
                ...message,
                userInputMessageContext: {
                    // keep falcon context when inputMessage is not a toolResult message
                    editorState: hasToolResults ? undefined : message.userInputMessageContext?.editorState,
                    additionalContext: hasToolResults ? undefined : message.userInputMessageContext?.additionalContext,
                    // Only keep toolResults in history
                    toolResults: message.userInputMessageContext?.toolResults,
                },
            }
        }
        return message
    }

    /**
     * Prepare the history messages for service request `GenerateAssistantResponseCommandInput` to maintain the following invariants:
     * 1. The history contains at most MaxConversationHistoryMessages messages. Oldest messages are dropped.
     * 2. The last assistant message is not empty
     * 3. The first message is from the user and the last message is from the assistant.
     *    The history contains alternating sequene of userMessage followed by assistantMessages
     * 4. The history character length is <= MaxConversationHistoryCharacters - newUserMessageCharacterCount. Oldest messages are dropped.
     */
    getPreprocessedRequestHistory(tabId: string, newUserMessage: ChatMessage, remainingCharacterBudget: number) {
        if (!this.#initialized) {
            return []
        }

        this.#features.logging.info(`Preprocessing request history: tabId=${tabId}`)

        // 1. Make sure the length of the history messages don't exceed MaxConversationHistoryMessages
        let allMessages = this.getMessages(tabId, maxConversationHistoryMessages)
        if (allMessages.length === 0) {
            return []
        }

        // 2. Drop empty assistant partial if it’s the last message
        this.removeEmptyAssistantMessage(allMessages)

        // 3. Ensure messages in history a valid for server side checks
        this.ensureValidMessageSequence(allMessages, newUserMessage)

        // 4. Make sure max characters ≤ remaining Character Budget
        allMessages = this.trimMessagesToMaxLength(allMessages, remainingCharacterBudget)

        // Edge case: If the history is empty and the next message contains tool results, then we have to just abandon them.
        if (
            allMessages.length === 0 &&
            newUserMessage.userInputMessage?.userInputMessageContext?.toolResults?.length &&
            newUserMessage.userInputMessage?.userInputMessageContext?.toolResults?.length > 0
        ) {
            this.#features.logging.warn('History overflow: abandoning dangling toolResults.')
            newUserMessage.userInputMessage.userInputMessageContext.toolResults = []
            newUserMessage.userInputMessage.content = 'The conversation history has overflowed, clearing state'
        }

        return allMessages
    }

    /**
     * Calculates the size of a database file
     * @param dbPath Path to the database file
     * @returns Promise that resolves to the file size in bytes, or 0 if there's an error
     */
    private async calculateDatabaseSize(dbPath: string): Promise<number> {
        const result = await this.#features.workspace.fs.getFileSize(dbPath)
        return result.size
    }

    /**
     * Calculates the total size of all history database files in the directory
     * @returns The total size of all database files in bytes
     */
    private async calculateAllHistorySize(dbFiles?: string[]): Promise<number> {
        if (!dbFiles) {
            dbFiles = (await this.listDatabaseFiles()).map(file => file.name)
        }

        // Calculate the total size of all database files
        let totalSize = 0
        for (const file of dbFiles) {
            const filePath = path.join(this.#dbDirectory, file)
            let fileSize
            try {
                fileSize = await this.calculateDatabaseSize(filePath)
            } catch (err) {
                this.#features.logging.error(`Error getting db file size: ${err}`)
                fileSize = 0
            }
            totalSize += fileSize
        }

        return totalSize
    }

    /**
     * Lists all database files in the history directory
     * @returns Promise that resolves to an array of database file entries
     */
    private async listDatabaseFiles() {
        try {
            // List all files in the directory using readdir
            const dirEntries = await this.#features.workspace.fs.readdir(this.#dbDirectory)

            // Filter for database files (they should follow the pattern chat-history-*.json)
            return dirEntries.filter(
                entry => entry.isFile() && entry.name.startsWith('chat-history-') && entry.name.endsWith('.json')
            )
        } catch (err) {
            this.#features.logging.error(`Error listing database files: ${err}`)
            return []
        }
    }

    /**
     * If the sum of all history file size exceeds the limit, start trimming the oldest conversation
     * across all the workspace until the folder size is below maxAfterTrimHistoryFolderSizeInBytes.
     */
    async trimHistoryToMaxSize() {
        // Get the size of all history DB files
        const historyTotalSizeInBytes = await this.calculateAllHistorySize()
        this.#features.logging.info(
            `Current history total size: ${historyTotalSizeInBytes} Bytes, max allowed: ${maxHistorySizeInBytes} Bytes`
        )

        // If we're under the limit, no need to trim
        if (historyTotalSizeInBytes <= maxHistorySizeInBytes) {
            return
        }
        this.#features.logging.info(
            `History total size (${historyTotalSizeInBytes} Bytes) exceeds limit (${maxHistorySizeInBytes} Bytes), trimming history`
        )

        const trimStart = performance.now()
        await this.trimHistoryForAllWorkspace()
        const trimEnd = performance.now()
        this.#features.logging.info(`Trimming history took ${trimEnd - trimStart} ms`)
    }

    private async trimHistoryForAllWorkspace() {
        // Load all databases
        const allDbFiles = (await this.listDatabaseFiles()).map(file => file.name)
        // DB name to {collection, db} Map
        const allDbsMap = await this.loadAllDbFiles(allDbFiles)
        this.#features.logging.info(`Loaded ${allDbsMap.size} databases in ${this.#dbDirectory}`)
        if (allDbsMap.size < allDbFiles.length) {
            this.#features.logging.warn(
                `Found ${allDbFiles.length - allDbsMap.size} bad DB files, will skip them when calculating history size`
            )
        }

        const tabQueue = initializeHistoryPriorityQueue()

        // Add tabs to the queue
        for (const [dbName, dbRef] of allDbsMap.entries()) {
            const tabCollection = dbRef.collection
            if (!tabCollection) continue

            const tabs = tabCollection.find()
            for (const tab of tabs) {
                // Use the first message under the first conversation to get the oldestMessageDate, if no timestamp under the message, use 0.
                const oldestMessageDate = getOldestMessageTimestamp(tab)
                tabQueue.add({
                    tab: tab,
                    collection: tabCollection,
                    dbName: dbName,
                    oldestMessageDate: oldestMessageDate,
                })
            }
        }

        // Keep trimming until we're under the target size
        let iterationCount = 0
        while (!tabQueue.isEmpty()) {
            // Check current total size
            const totalSize = await this.calculateAllHistorySize(Array.from(allDbsMap.keys()))

            // If we're under the target size, we're done
            if (totalSize <= maxAfterTrimHistorySizeInBytes) {
                this.#features.logging.info(`Successfully trimmed history to ${totalSize} bytes`)
                break
            }
            // Infinite loop protection
            if (++iterationCount > maxTrimHistoryLoopIteration) {
                this.#features.logging.warn(
                    `Exceeded max iteration count (${maxTrimHistoryLoopIteration}) when trimming history, current total size: ${totalSize}`
                )
                break
            }

            // Do a batch deletion so that we don't re-calculate the size for every deletion,
            // messages should be deleted in pairs(prompt, answer)
            let updatedDbs = new Set<string>()
            for (let i = 0; i < messageBatchDeleteIterationBeforeRecalculateDBSize / 2; i++) {
                const queueItem = tabQueue.dequeue()
                const tab = queueItem?.tab
                const collection = queueItem?.collection
                const dbName = queueItem?.dbName
                if (!tab || !collection || !dbName) break

                updatedDbs.add(dbName)
                if (!tab.conversations) {
                    collection.remove(tab)
                    continue
                }

                // Remove messages under a tab
                let pairsRemoved = 0
                while (
                    pairsRemoved < messageBatchDeleteSizeForSingleTab / 2 &&
                    this.removeOldestMessagePairFromHistory(tab)
                ) {
                    pairsRemoved++
                }

                if (!tab.conversations || tab.conversations.length === 0) {
                    // If the tab has no conversations left, remove it
                    collection.remove(tab)
                } else {
                    collection.update(tab)
                    // Re-add the tab to the queue with updated oldest date
                    const newOldestDate = getOldestMessageTimestamp(tab)
                    tabQueue.enqueue({ tab: tab, collection, dbName: dbName, oldestMessageDate: newOldestDate })
                }
            }

            // Save the updated database if it's not the current one, the current db should have autosave enabled
            for (const [dbName, dbRef] of allDbsMap.entries()) {
                if (updatedDbs.has(dbName)) {
                    this.#features.logging.debug(
                        `Removed old messages from ${dbName}, historyId: ${dbRef.collection.findOne()?.historyId}, saving changes`
                    )
                    await new Promise<void>(resolve => {
                        dbRef.db.saveDatabase(() => resolve())
                    })
                }
            }
        }

        // Close the databases except the current workspace DB
        for (const [dbName, dbRef] of allDbsMap.entries()) {
            if (dbName !== this.#dbName) {
                dbRef.db.close()
            }
        }
    }

    private async loadAllDbFiles(allDbFiles: string[]) {
        const allDbsMap = new Map<string, { collection: Collection<Tab>; db: Loki }>()
        for (const dbFile of allDbFiles) {
            try {
                if (dbFile === this.#dbName) {
                    // Current workspace DB
                    const collection = this.#db.getCollection<Tab>(TabCollection)
                    allDbsMap.set(dbFile, { collection: collection, db: this.#db })
                    continue
                }

                const db = new Loki(dbFile, {
                    adapter: new FileSystemAdapter(this.#features.workspace, this.#dbDirectory),
                    persistenceMethod: 'fs',
                })
                await new Promise<void>(resolve => {
                    db.loadDatabase({}, () => resolve())
                })
                const collection = db.getCollection<Tab>(TabCollection)

                if (collection) {
                    allDbsMap.set(dbFile, { collection: collection, db: db })
                } else {
                    this.#features.logging.warn(`No ${TabCollection} collection found in database ${dbFile}`)
                }
            } catch (err) {
                this.#features.logging.error(`Error loading DB file ${dbFile}: ${err}`)
            }
        }
        return allDbsMap
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

    /**
     * If the last answer is empty, remove the last answer and user prompt.
     * @param messages
     * @returns
     */
    private removeEmptyAssistantMessage(messages: Message[]): void {
        if (messages.length < 2) {
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

    /**
     * Remove the last user prompt from the conversation
     */
    private removeLastPromptFromConversation(conversations: Conversation[], conversationId: string) {
        const conversation = conversations.find(conv => conv.conversationId === conversationId)
        if (!conversation) {
            return
        }

        const messages = conversation.messages
        if (!messages.length) {
            return
        }

        if (messages[messages.length - 1].type === ('prompt' as ChatItemType)) {
            this.#features.logging.debug('Removing the last prompt message from the history DB')
            messages.pop()
        }
    }

    /**
     * Remove the oldest message pair, based on assumptions:
     * 1. The messages are always stored in pair(prompt, answer)
     * 2. The messages are always stored in chronological order(new messages are added to the tail of the list)
     * @returns True if successfully trimmed the history.
     */
    private removeOldestMessagePairFromHistory(tabData: Tab): boolean {
        if (!tabData.conversations || tabData.conversations.length === 0) {
            this.#features.logging.debug(`No conversations found in tab ${tabData.historyId}`)
            return false
        }

        const conversation = tabData.conversations[0]

        // Remove messages in pairs from the beginning
        if (conversation.messages?.length > 2) {
            conversation.messages.splice(0, 2)
        } else {
            // Remove the entire conversation if it has few messages
            tabData.conversations.splice(0, 1)
        }
        return true
    }

    private trimMessagesToMaxLength(messages: Message[], remainingCharacterBudget: number): Message[] {
        let totalCharacters = this.calculateHistoryCharacterCount(messages)
        this.#features.logging.debug(`Current history characters: ${totalCharacters}`)
        this.#features.logging.debug(`Current remaining character budget: ${remainingCharacterBudget}`)
        const maxHistoryCharacterSize = Math.max(0, remainingCharacterBudget)
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
            if (message.userInputMessageContext?.editorState) {
                try {
                    count += JSON.stringify(message.userInputMessageContext?.editorState).length
                } catch (e) {
                    this.#features.logging.error(`Error counting editorState: ${String(e)}`)
                }
            }

            if (message.userInputMessageContext?.additionalContext) {
                try {
                    count += JSON.stringify(message.userInputMessageContext?.additionalContext).length
                } catch (e) {
                    this.#features.logging.error(`Error counting additionalContext: ${String(e)}`)
                }
            }
        }
        return count
    }

    ensureValidMessageSequence(messages: Message[], newUserMessage: ChatMessage): void {
        if (messages.length === 0) {
            return
        }

        //  Make sure the first message is from the user (type === 'prompt'), else drop
        while (messages.length > 0 && messages[0].type === ('answer' as ChatItemType)) {
            messages.shift()
            this.#features.logging.debug('Dropped first message since it is not from user')
        }

        //  Make sure the last message is from the assistant (type === 'answer'), else drop
        if (messages.length > 0 && messages[messages.length - 1].type === ('prompt' as ChatItemType)) {
            // When user aborts some in-progress tooluse event, we should still send the previous toolResult back
            if (messages[messages.length - 1].userInputMessageContext?.toolResults) {
                if (newUserMessage.userInputMessage?.userInputMessageContext) {
                    newUserMessage.userInputMessage.userInputMessageContext.toolResults =
                        messages[messages.length - 1].userInputMessageContext?.toolResults
                }
            }
            messages.pop()
            this.#features.logging.debug('Dropped trailing user message')
        }

        if (messages.length === 0) {
            return
        }

        //  Make sure there are alternating user and assistant messages
        const currentMessageType = chatMessageToMessage(newUserMessage).type
        const lastMessageType = messages[messages.length - 1].type

        if (currentMessageType === lastMessageType) {
            this.#features.logging.warn(
                `Invalid alternation: last message is ${lastMessageType}, dropping it before inserting new ${currentMessageType}`
            )
            messages.splice(messages.length - 1, 1)
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
     * @returns true if the message is valid or was successfully fixed, false if invalid
     */
    validateAndFixNewMessageToolResults(messages: Message[], newUserMessage: ChatMessage): boolean {
        if (newUserMessage?.userInputMessage?.userInputMessageContext) {
            const newUserMessageContext = newUserMessage.userInputMessage.userInputMessageContext
            const toolResults = newUserMessageContext.toolResults || []
            if (messages.length === 0) {
                if (toolResults && toolResults.length > 0) {
                    this.#features.logging.warn('New message has tool results but last message has no tool uses')
                    return false
                }
                return true
            }
            const lastMsg = messages[messages.length - 1]
            const lastMsgToolUses = lastMsg?.toolUses || []

            // If last message has no tool uses but new message has tool results, this is invalid
            if (toolResults && toolResults.length > 0 && lastMsgToolUses.length === 0) {
                this.#features.logging.warn('New message has tool results but last message has no tool uses')
                return false
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
                return false
            }
        }
        return true
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
}
