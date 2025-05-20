/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
import * as Loki from 'lokijs'
import * as path from 'path'
import { Features } from '@aws/language-server-runtimes/server-interface/server'
import {
    FileSystemAdapter,
    Tab,
    TabCollection,
    initializeHistoryPriorityQueue,
    getOldestMessageTimestamp,
} from './util'

// Maximum history file size across all workspace, 200MB
export const maxHistorySizeInBytes = 200 * 1024 * 1024
// 75% of the max size, 150MB
export const maxAfterTrimHistorySizeInBytes = 150 * 1024 * 1024
/**
 * The combination of messageBatchDeleteIterationBeforeRecalculateDBSize and messageBatchDeleteSizeForSingleTab can heavily impact the
 * latency of trimming history since calculating the history file size is slow. We can tune these numbers according to the average message size
 */
// Batch deletion iteration count when trimming history before re-calculating total history size
export const messageBatchDeleteIterationBeforeRecalculateDBSize = 200
// Batch deletion message size when trimming history for a specific tab before re-checking the oldest message among all workspace history
export const messageBatchDeleteSizeForSingleTab = 10
// In each iteration, we calculate the total history size and try to delete [messageBatchDeleteSizeForSingleTab * messageBatchDeleteIterationBeforeRecalculateDBSize] messages
export const maxTrimHistoryLoopIteration = 100

/**
 * ChatHistoryMaintainer is responsible for maintaining the chat history database,
 * including trimming history when it exceeds size limits.
 */
export class ChatHistoryMaintainer {
    #features: Features
    #dbDirectory: string
    #dbName: string
    #db: Loki

    constructor(features: Features, dbDirectory: string, dbName: string, db: Loki) {
        this.#features = features
        this.#dbDirectory = dbDirectory
        this.#dbName = dbName
        this.#db = db
    }

    /**
     * If the sum of all history file size exceeds the limit, start trimming the oldest conversation
     * across all the workspace until the folder size is below maxAfterTrimHistorySizeInBytes.
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
        await this.trimHistoryForAllWorkspaces()
        const trimEnd = performance.now()
        this.#features.logging.info(`Trimming history took ${trimEnd - trimStart} ms`)
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

    private async trimHistoryForAllWorkspaces() {
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
                    this.removeOldestMessagePairFromTab(tab)
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
                    this.#features.logging.debug(`Removed old messages from ${dbName}, saving changes`)
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

    /**
     * Remove the oldest message pair, based on assumptions:
     * 1. The messages are always stored in pair(prompt, answer)
     * 2. The messages are always stored in chronological order(new messages are added to the tail of the list)
     * @returns True if successfully trimmed the history.
     */
    private removeOldestMessagePairFromTab(tabData: Tab): boolean {
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
}
