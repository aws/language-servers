/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import * as path from 'path'
import {
    ChatMessage,
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
} from '@aws/codewhisperer-streaming-client'
import { Workspace } from '@aws/language-server-runtimes/server-interface'

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
}

export type Settings = {
    modelId: string | undefined
}

export type Conversation = {
    conversationId: string
    clientType: string
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
    shouldDisplayMessage?: boolean
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
            conv.conversationId === conversationId ? { ...conv, messages: [...conv.messages, newMessage] } : conv
        )
    } else {
        return [
            ...conversations,
            {
                conversationId,
                clientType,
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
