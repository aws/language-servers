/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import * as path from 'path'
import {
    ChatMessage,
    ContextCommand,
    ConversationItem,
    ConversationItemGroup,
    IconType,
    ReferenceTrackerInformation,
} from '@aws/language-server-runtimes/server-interface'
import {
    ChatMessage as StreamingMessage,
    Origin,
    UserInputMessageContext,
    UserIntent,
    ToolUse,
    UserInputMessage,
    AssistantResponseMessage,
    ImageBlock,
} from '@amzn/codewhisperer-streaming'
import { Workspace } from '@aws/language-server-runtimes/server-interface'
import { activeFileCmd } from '../../context/additionalContextProvider'
import { PriorityQueue } from 'typescript-collections'
import { Features } from '@aws/language-server-runtimes/server-interface/server'
import * as crypto from 'crypto'

// Ported from https://github.com/aws/aws-toolkit-vscode/blob/master/packages/core/src/shared/db/chatDb/util.ts

export const TabCollection = 'tabs'
export const SettingsCollection = 'settings'

export const historyPath = path.join('.aws', 'amazonq', 'history')

const TabTypes = [
    'cwc',
    'featuredev',
    'gumby',
    'review',
    'testgen',
    'doc',
    'agentWalkthrough',
    'welcome',
    'unknown',
] as const
export type TabType = (typeof TabTypes)[number]

/**
 * Represents one entry in chat history list.
 */
export type Tab = {
    historyId: string
    isOpen: boolean
    updatedAt: Date
    tabType: TabType
    title: string
    conversations: Conversation[]
    tabContext?: TabContext
}

export const DEFAULT_PINNED_CONTEXT: ContextCommand[] = [activeFileCmd]

/**
 * Stores context scoped to a conversation, such as pinned context and rules.
 */
export type TabContext = {
    pinnedContext?: ContextCommand[]
    rules?: Rules
}

/**
 * Stores active/inactive state of workspace rules.
 */
export type Rules = {
    // Track folder states by folder name
    folders: Record<string, boolean>
    // Track individual rule states by rule ID
    rules: Record<string, boolean>
}

export type Settings = {
    modelId: string | undefined
    pairProgrammingMode?: boolean
}

export type Conversation = {
    conversationId: string
    clientType: string
    updatedAt?: Date
    messages: Message[]
}

export type Message = {
    body: string
    type: ChatMessage['type']
    codeReference?: ReferenceTrackerInformation[]
    relatedContent?: ChatMessage['relatedContent']
    messageId?: string
    userIntent?: UserIntent
    origin?: Origin
    userInputMessageContext?: UserInputMessageContext
    toolUses?: ToolUse[]
    timestamp?: Date
    shouldDisplayMessage?: boolean
    images?: ImageBlock[]
}

/**
 * Represents a tab with its database metadata, including collection reference, database name, and timestamp information
 * for use in history trimming operations.
 */
export type TabWithDbMetadata = {
    tab: Tab
    collection: Collection<Tab> // The reference of chat DB collection
    dbName: string // The chat DB name
    oldestMessageDate: Date // The timestamp of the oldest message in the tab
}

/**
 * Represents a chat DB reference, including the tab collection reference and the DB reference
 * for use in history trimming operations.
 */
export type DbReference = { collection: Collection<Tab>; db: Loki }

export type MessagesWithCharacterCount = {
    history: Message[]
    historyCount: number
    currentCount: number
}

/**
 * Converts Message to codewhisperer-streaming ChatMessage
 */
export function messageToStreamingMessage(msg: Message): StreamingMessage {
    return msg.type === 'answer'
        ? {
              assistantResponseMessage: {
                  messageId: msg.messageId,
                  content: msg.body,
                  toolUses: msg.toolUses || [],
              },
          }
        : {
              userInputMessage: {
                  content: msg.body,
                  userIntent: msg.userIntent,
                  origin: msg.origin || 'IDE',
                  userInputMessageContext: msg.userInputMessageContext || {},
                  images: msg.images || [],
              },
          }
}

/**
 * Converts Message to LSP Protocol ChatMessage
 */
export function messageToChatMessage(msg: Message): ChatMessage[] {
    const chatMessages: ChatMessage[] = [
        {
            body: msg.body,
            type: msg.type,
            codeReference: msg.codeReference,
            relatedContent:
                msg.relatedContent && msg.relatedContent?.content.length > 0 ? msg.relatedContent : undefined,
        },
    ]

    // Check if there are any toolUses with explanations that should be displayed as directive messages
    if (msg.toolUses && msg.toolUses.length > 0) {
        for (const toolUse of msg.toolUses) {
            if (toolUse.input && typeof toolUse.input === 'object') {
                const input = toolUse.input as any
                if (input.explanation) {
                    chatMessages.push({
                        body: input.explanation,
                        type: 'directive',
                    })
                }
            }
        }
    }
    return chatMessages
}

/**
 * Converts codewhisperer-streaming ChatMessage to Message
 */
export function chatMessageToMessage(chatMessage: StreamingMessage): Message {
    if ('userInputMessage' in chatMessage) {
        const userInputMessage = chatMessage.userInputMessage as UserInputMessage
        return {
            body: userInputMessage.content || '',
            type: 'prompt',
            userIntent: userInputMessage.userIntent,
            origin: userInputMessage.origin || 'IDE',
            userInputMessageContext: userInputMessage.userInputMessageContext || {},
        }
    } else if ('assistantResponseMessage' in chatMessage) {
        const assistantResponseMessage = chatMessage.assistantResponseMessage as AssistantResponseMessage
        return {
            body: assistantResponseMessage.content || '',
            type: 'answer',
            messageId: assistantResponseMessage.messageId,
            toolUses: assistantResponseMessage.toolUses || [],
        }
    } else {
        // Default fallback for unexpected message format
        return {
            body: '',
            type: 'prompt',
        }
    }
}

/**
 *
 * This adapter implements the LokiPersistenceAdapter interface for file system operations using web-compatible shared fs utils.
 * It provides methods for loading, saving, and deleting databases, as well as ensuring
 * the existence of the directory.
 *
 * Error Handling:
 * - All methods use try-catch blocks to to prevent breaking the application
 * - In case of errors, the callback functions are used to communicate the error state
 *   without throwing exceptions.
 *
 */
export class FileSystemAdapter implements LokiPersistenceAdapter {
    #directory
    #workspace
    constructor(workspace: Workspace, directory: string) {
        this.#directory = directory
        this.#workspace = workspace
    }

    async ensureDirectory() {
        await this.#workspace.fs.mkdir(this.#directory, { recursive: true })
    }

    async loadDatabase(dbname: string, callback: (data: string | undefined | Error) => void) {
        try {
            await this.ensureDirectory()
            const filename = path.join(this.#directory, dbname)

            try {
                const data = await this.#workspace.fs.readFile(filename, { encoding: 'utf8' })
                callback(data)
            } catch (err) {
                // File doesn't exist
                callback(undefined)
            }
        } catch (err: any) {
            callback(err)
        }
    }

    async saveDatabase(dbname: string, dbstring: string, callback: (err: Error | undefined) => void) {
        try {
            await this.ensureDirectory()
            const filename = path.join(this.#directory, dbname)

            await this.#workspace.fs.writeFile(filename, dbstring, { mode: 0o600 })
            callback(undefined)
        } catch (err: any) {
            callback(err)
        }
    }

    async deleteDatabase(dbname: string, callback: (err: Error | undefined) => void) {
        const filename = path.join(this.#directory, dbname)
        try {
            await this.#workspace.fs.rm(filename)
            callback(undefined)
        } catch (err: any) {
            callback(err)
        }
    }
}

export function updateOrCreateConversation(
    conversations: Conversation[],
    conversationId: string,
    newMessage: Message,
    clientType: string
): Conversation[] {
    const existingConversation = conversations.find(conv => conv.conversationId === conversationId)

    if (existingConversation) {
        return conversations.map(conv =>
            conv.conversationId === conversationId
                ? { ...conv, updatedAt: new Date(), messages: [...conv.messages, newMessage] }
                : conv
        )
    } else {
        return [
            ...conversations,
            {
                conversationId,
                clientType,
                updatedAt: new Date(),
                messages: [newMessage],
            },
        ]
    }
}

export function groupTabsByDate(tabs: Tab[]): ConversationItemGroup[] {
    const now = new Date()
    const today = new Date(now.setHours(0, 0, 0, 0))
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const lastWeek = new Date(today)
    lastWeek.setDate(lastWeek.getDate() - 7)
    const lastMonth = new Date(today)
    lastMonth.setMonth(lastMonth.getMonth() - 1)

    // Sort tabs by updatedAt in descending order
    const sortedTabs = [...tabs]
        .map(tab => ({ ...tab, updatedAt: new Date(tab.updatedAt) }))
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())

    // Helper function to convert Tab to DetailedListItem
    const tabToDetailedListItem = (tab: Tab): ConversationItem => ({
        icon: getTabTypeIcon(tab.tabType),
        // Show open tabs as bold (in markdown)
        description: tab.isOpen ? `**${tab.title}**` : tab.title,
        id: tab.historyId,
    })

    const tabGroups = [
        {
            name: 'Today',
            tabs: sortedTabs.filter(tab => tab.updatedAt >= today),
        },
        {
            name: 'Yesterday',
            tabs: sortedTabs.filter(tab => tab.updatedAt >= yesterday && tab.updatedAt < today),
        },
        {
            name: 'Last Week',
            tabs: sortedTabs.filter(tab => tab.updatedAt >= lastWeek && tab.updatedAt < yesterday),
        },
        {
            name: 'Last Month',
            tabs: sortedTabs.filter(tab => tab.updatedAt >= lastMonth && tab.updatedAt < lastWeek),
        },
        {
            name: 'Older',
            tabs: sortedTabs.filter(tab => tab.updatedAt < lastMonth),
        },
    ]

    // Convert to DetailedListItemGroup[] and filter out empty groups
    return tabGroups
        .filter(group => group.tabs.length > 0)
        .map(group => ({
            groupName: group.name,
            icon: 'calendar',
            items: group.tabs.map(tabToDetailedListItem),
        }))
}

/**
 * Initialize a priority queue to store all workspace tab history, the tab contains the oldest message first.
 * If the messages don't have a timestamp, oldest tab first.
 */
export function initializeHistoryPriorityQueue() {
    // Create a comparator function for dates (oldest first)
    // The PriorityQueue implementation uses maxHeap: greater value fist.
    // So we need to return bTimestamp - aTimestamp if a is older than b.
    function tabDateComparator(
        a: { tab: Tab; oldestMessageDate: Date },
        b: { tab: Tab; oldestMessageDate: Date }
    ): number {
        if (a.oldestMessageDate.getTime() === 0 && b.oldestMessageDate.getTime() === 0) {
            // Legacy message data without timestamp, use the updatedAt timestamp of the tab to compare
            const aUpdatedAt = a.tab.updatedAt
            const bUpdatedAt = b.tab.updatedAt
            // LokiJS automatically convert the indexed updatedAt into number for better performance, we have an index on Tab.updatedAt
            if (typeof aUpdatedAt === 'number' && typeof bUpdatedAt === 'number') {
                return bUpdatedAt - aUpdatedAt
            }
            // For robustness, adding Date type comparator as well
            if (aUpdatedAt instanceof Date && bUpdatedAt instanceof Date) {
                return bUpdatedAt.getTime() - aUpdatedAt.getTime()
            }
        }
        return b.oldestMessageDate.getTime() - a.oldestMessageDate.getTime()
    }

    // Create a priority queue with tabs and the collection it belongs to, and sorted by oldest message date
    return new PriorityQueue<TabWithDbMetadata>(tabDateComparator)
}

/**
 * Gets the timestamp of the oldest message in a tab
 * @param tabData The tab to check
 * @returns The Date of the oldest message, or 0 if no messages under the tab or it's a legacy message that doesn't have a timestamp
 */
export function getOldestMessageTimestamp(tabData: Tab): Date {
    if (!tabData.conversations) {
        return new Date(0)
    }

    // The conversations and messages under the same tab should always be in chronological order
    for (const conversation of tabData.conversations) {
        // Skip empty conversations
        if (!conversation.messages || conversation.messages.length === 0) {
            continue
        }
        // Just need to check the first message which is the oldest one
        if (conversation.messages[0].timestamp) {
            return new Date(conversation.messages[0].timestamp)
        } else {
            return new Date(0)
        }
    }

    // Legacy data doesn't have a timestamp, so just treating it as 0 since they are older than any data that has a timestamp
    return new Date(0)
}

function getTabTypeIcon(tabType: TabType): IconType {
    switch (tabType) {
        case 'cwc':
            return 'chat'
        case 'doc':
            return 'file'
        case 'review':
            return 'bug'
        case 'gumby':
            return 'transform'
        case 'testgen':
            return 'check-list'
        case 'featuredev':
            return 'code-block'
        default:
            return 'chat'
    }
}

/**
 * Calculates the size of a database file
 * @param features Features object containing workspace filesystem access
 * @param dbPath Path to the database file
 * @returns Promise that resolves to the file size in bytes, or 0 if there's an error
 */
export async function calculateDatabaseSize(features: Features, dbPath: string): Promise<number> {
    const result = await features.workspace.fs.getFileSize(dbPath)
    return result.size
}

export function getChatDbNameFromWorkspaceId(workspaceId: string): string {
    return `chat-history-${workspaceId}.json`
}

export function getMd5WorkspaceId(filePath: string): string {
    return crypto.createHash('md5').update(filePath).digest('hex')
}

export function getSha256WorkspaceId(filePath: string): string {
    return crypto.createHash('sha256').update(filePath).digest('hex')
}

/**
 * Estimates the number of characters that an image binary would represent in a text context.
 * The estimation is based on the image's byte size, converting bytes to megabytes, then estimating tokens (using 1100 tokens per MB),
 * and finally converting tokens to characters (assuming 1 token ≈ 3 characters).
 *
 * @param image The ImageBlock object containing the image data (expects image.source.bytes to be a Buffer or Uint8Array).
 * @returns The estimated number of characters that the image would represent.
 */
export function estimateCharacterCountFromImageBlock(image: ImageBlock): number {
    let imagesBytesLen = image.source?.bytes?.byteLength ?? 0
    // Convert bytes to MB and estimate tokens (using 1100 tokens per MB as middle ground)
    const imageTokens = (imagesBytesLen / 1000000) * 1100
    // Each token is 3 characters
    return imageTokens * 3
}
