/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert'
import sinon from 'ts-sinon'
import * as path from 'path'
import {
    FileSystemAdapter,
    Message,
    TabType,
    chatMessageToMessage,
    groupTabsByDate,
    messageToChatMessage,
    messageToStreamingMessage,
    updateOrCreateConversation,
} from './util'
import { ChatMessage } from '@aws/language-server-runtimes/protocol'
import { Workspace } from '@aws/language-server-runtimes/server-interface'
import { ChatMessage as StreamingMessage } from '@aws/codewhisperer-streaming-client'

describe('ChatDb Utilities', () => {
    describe('messageToStreamingMessage', () => {
        it('should convert prompt message to userInputMessage', () => {
            const message: Message = {
                body: 'Hello',
                type: 'prompt',
            }

            const result = messageToStreamingMessage(message)

            assert.deepStrictEqual(result, {
                userInputMessage: {
                    content: 'Hello',
                    userInputMessageContext: {},
                    userIntent: undefined,
                    origin: 'IDE',
                },
            })
        })

        it('should convert answer message to assistantResponseMessage', () => {
            const message: Message = {
                body: 'Response',
                type: 'answer',
                messageId: 'msg-1',
                codeReference: [{ url: 'test.js', recommendationContentSpan: { start: 10, end: 15 }, information: '' }],
            }

            const result = messageToStreamingMessage(message)

            assert.deepStrictEqual(result, {
                assistantResponseMessage: {
                    messageId: 'msg-1',
                    content: 'Response',
                    toolUses: [],
                },
            })
        })
    })

    describe('messageToChatMessage', () => {
        it('should convert Message to ChatMessage', () => {
            const message: Message = {
                body: 'Hello',
                type: 'prompt',
                codeReference: [{ url: 'test.js', recommendationContentSpan: { start: 10, end: 15 }, information: '' }],
                relatedContent: { content: [{ title: 'Sources', url: 'google.com' }] },
            }

            const result = messageToChatMessage(message)

            assert.deepStrictEqual(result, [
                {
                    body: 'Hello',
                    type: 'prompt',
                    codeReference: [
                        { url: 'test.js', recommendationContentSpan: { start: 10, end: 15 }, information: '' },
                    ],
                    relatedContent: { content: [{ title: 'Sources', url: 'google.com' }] },
                },
            ])
        })

        it('should omit relatedContent when content array is empty', () => {
            const message: Message = {
                body: 'Hello',
                type: 'prompt',
                relatedContent: { content: [] },
            }

            const result = messageToChatMessage(message)

            assert.deepStrictEqual(result, [
                {
                    body: 'Hello',
                    type: 'prompt',
                    relatedContent: undefined,
                    codeReference: undefined,
                },
            ])
        })
    })

    describe('chatMessageToMessage', () => {
        it('should convert userInputMessage to prompt Message', () => {
            const chatMessage: StreamingMessage = {
                userInputMessage: {
                    content: 'Hello',
                    userInputMessageContext: {
                        toolResults: [],
                    },
                },
            }

            const result = chatMessageToMessage(chatMessage)

            assert.deepStrictEqual(result, {
                body: 'Hello',
                origin: 'IDE',
                type: 'prompt',
                userInputMessageContext: {
                    toolResults: [],
                },
                userIntent: undefined,
            })
        })

        it('should convert assistantResponseMessage to answer Message', () => {
            const chatMessage: StreamingMessage = {
                assistantResponseMessage: {
                    messageId: 'msg-123',
                    content: 'Response content',
                    toolUses: [
                        {
                            toolUseId: 'tool-1',
                            name: 'testTool',
                            input: { key: 'value' },
                        },
                    ],
                },
            }

            const result = chatMessageToMessage(chatMessage)

            assert.deepStrictEqual(result, {
                body: 'Response content',
                type: 'answer',
                messageId: 'msg-123',
                toolUses: [
                    {
                        toolUseId: 'tool-1',
                        name: 'testTool',
                        input: { key: 'value' },
                    },
                ],
            })
        })
    })

    describe('updateOrCreateConversation', () => {
        it('should add message to existing conversation', () => {
            const conversations = [
                {
                    conversationId: 'conv-1',
                    clientType: 'vscode',
                    messages: [{ body: 'Message 1', type: 'prompt' as ChatMessage['type'] }],
                },
            ]

            const newMessage = { body: 'Message 2', type: 'answer' as ChatMessage['type'] }

            const result = updateOrCreateConversation(conversations, 'conv-1', newMessage, 'vscode')

            assert.strictEqual(result.length, 1)
            assert.strictEqual(result[0].messages.length, 2)
            assert.deepStrictEqual(result[0].messages[1], newMessage)
        })

        it('should create new conversation when conversationId does not exist', () => {
            const conversations = [
                {
                    conversationId: 'conv-1',
                    clientType: 'vscode',
                    messages: [{ body: 'Message 1', type: 'prompt' as ChatMessage['type'] }],
                },
            ]

            const newMessage = { body: 'Message 2', type: 'prompt' as ChatMessage['type'] }

            const result = updateOrCreateConversation(conversations, 'conv-2', newMessage, 'vscode')

            assert.strictEqual(result.length, 2)
            assert.strictEqual(result[1].conversationId, 'conv-2')
            assert.strictEqual(result[1].clientType, 'vscode')
            assert.deepStrictEqual(result[1].messages, [newMessage])
        })
    })

    describe('groupTabsByDate', () => {
        it('should group tabs by date ranges', () => {
            const now = new Date()
            const today = new Date(now)
            const yesterday = new Date(now)
            yesterday.setDate(yesterday.getDate() - 1)
            const lastWeek = new Date(now)
            lastWeek.setDate(lastWeek.getDate() - 6)
            const lastMonth = new Date(now)
            lastMonth.setDate(lastMonth.getDate() - 20)
            const older = new Date(now)
            older.setDate(older.getDate() - 40)

            const tabs = [
                {
                    historyId: 'today',
                    updatedAt: today,
                    isOpen: true,
                    tabType: 'cwc' as TabType,
                    title: 'Today Tab',
                    conversations: [],
                },
                {
                    historyId: 'yesterday',
                    updatedAt: yesterday,
                    isOpen: false,
                    tabType: 'doc' as TabType,
                    title: 'Yesterday Tab',
                    conversations: [],
                },
                {
                    historyId: 'lastWeek',
                    updatedAt: lastWeek,
                    isOpen: false,
                    tabType: 'review' as TabType,
                    title: 'Last Week Tab',
                    conversations: [],
                },
                {
                    historyId: 'lastMonth',
                    updatedAt: lastMonth,
                    isOpen: false,
                    tabType: 'gumby' as TabType,
                    title: 'Last Month Tab',
                    conversations: [],
                },
                {
                    historyId: 'older',
                    updatedAt: older,
                    isOpen: false,
                    tabType: 'testgen' as TabType,
                    title: 'Older Tab',
                    conversations: [],
                },
            ]

            const result = groupTabsByDate(tabs)

            assert.strictEqual(result.length, 5) // 5 groups: Today, Yesterday, Last Week, Last Month, Older

            // Check group names
            assert.strictEqual(result[0].groupName, 'Today')
            assert.strictEqual(result[1].groupName, 'Yesterday')
            assert.strictEqual(result[2].groupName, 'Last Week')
            assert.strictEqual(result[3].groupName, 'Last Month')
            assert.strictEqual(result[4].groupName, 'Older')

            // Check items in each group
            assert.strictEqual(result[0].items?.length, 1)
            assert.strictEqual(result[1].items?.length, 1)
            assert.strictEqual(result[2].items?.length, 1)
            assert.strictEqual(result[3].items?.length, 1)
            assert.strictEqual(result[4].items?.length, 1)

            // Check that open tabs are marked as bold
            assert.strictEqual(result[0].items[0].description, '**Today Tab**')
            assert.strictEqual(result[1].items[0].description, 'Yesterday Tab')
        })

        it('should filter out empty groups', () => {
            const now = new Date()
            const today = new Date(now)

            const tabs = [
                {
                    historyId: 'today',
                    updatedAt: today,
                    isOpen: true,
                    tabType: 'cwc' as TabType,
                    title: 'Today Tab',
                    conversations: [],
                },
            ]

            const result = groupTabsByDate(tabs)

            assert.strictEqual(result.length, 1) // Only Today group should be present
            assert.strictEqual(result[0].groupName, 'Today')
        })

        it('should sort tabs by updatedAt in descending order within groups', () => {
            const now = new Date()

            const endOfDay = new Date(now)
            endOfDay.setHours(23, 59, 59, 999)

            const today1 = new Date(endOfDay)
            const today2 = new Date(endOfDay)
            today2.setHours(endOfDay.getHours() - 1)
            const today3 = new Date(endOfDay)
            today3.setHours(endOfDay.getHours() - 2)

            const tabs = [
                {
                    historyId: 'today3',
                    updatedAt: today3,
                    isOpen: false,
                    tabType: 'cwc' as TabType,
                    title: 'Today 3',
                    conversations: [],
                },
                {
                    historyId: 'today1',
                    updatedAt: today1,
                    isOpen: false,
                    tabType: 'cwc' as TabType,
                    title: 'Today 1',
                    conversations: [],
                },
                {
                    historyId: 'today2',
                    updatedAt: today2,
                    isOpen: false,
                    tabType: 'cwc' as TabType,
                    title: 'Today 2',
                    conversations: [],
                },
            ]

            const result = groupTabsByDate(tabs)

            assert.strictEqual(result[0].items?.[0].id, 'today1')
            assert.strictEqual(result[0].items?.[1].id, 'today2')
            assert.strictEqual(result[0].items?.[2].id, 'today3')
        })
    })

    describe('FileSystemAdapter', () => {
        let adapter: FileSystemAdapter
        const testDir = '/tmp/test-chat-db'
        let mockWorkspace: Workspace

        beforeEach(() => {
            mockWorkspace = {
                fs: {
                    mkdir: sinon.stub().resolves(),
                    readFile: sinon.stub().resolves(),
                    writeFile: sinon.stub().resolves(),
                    rm: sinon.stub().resolves(),
                },
            } as unknown as Workspace

            adapter = new FileSystemAdapter(mockWorkspace, testDir)
        })

        afterEach(() => {
            sinon.restore()
        })

        describe('ensureDirectory', () => {
            it('should create directory with recursive option', async () => {
                await adapter.ensureDirectory()

                sinon.assert.calledWith(mockWorkspace.fs.mkdir as sinon.SinonStub, testDir, { recursive: true })
            })
        })

        describe('loadDatabase', () => {
            it('should load database file when it exists', async () => {
                ;(mockWorkspace.fs.readFile as sinon.SinonStub).resolves('{"test": "data"}')

                const callback = sinon.stub()
                await adapter.loadDatabase('test.json', callback)

                sinon.assert.calledWith(callback, '{"test": "data"}')
            })

            it('should return undefined when file does not exist', async () => {
                ;(mockWorkspace.fs.readFile as sinon.SinonStub).rejects(new Error('File not found'))

                const callback = sinon.stub()
                await adapter.loadDatabase('test.json', callback)

                sinon.assert.calledWith(callback, undefined)
            })

            it('should handle errors during directory creation', async () => {
                ;(mockWorkspace.fs.mkdir as sinon.SinonStub).rejects(new Error('Permission denied'))

                const callback = sinon.stub()
                await adapter.loadDatabase('test.json', callback)

                sinon.assert.calledOnce(callback)
                assert(callback.firstCall.args[0] instanceof Error)
            })
        })

        describe('saveDatabase', () => {
            it('should save database file', async () => {
                const callback = sinon.stub()
                await adapter.saveDatabase('test.json', '{"test": "data"}', callback)

                sinon.assert.calledWith(
                    mockWorkspace.fs.writeFile as sinon.SinonStub,
                    path.join(testDir, 'test.json'),
                    '{"test": "data"}'
                )
                sinon.assert.calledWith(callback, undefined)
            })

            it('should handle errors during save', async () => {
                ;(mockWorkspace.fs.writeFile as sinon.SinonStub).rejects(new Error('Write error'))

                const callback = sinon.stub()
                await adapter.saveDatabase('test.json', '{"test": "data"}', callback)

                sinon.assert.calledOnce(callback)
                assert(callback.firstCall.args[0] instanceof Error)
            })
        })

        describe('deleteDatabase', () => {
            it('should delete database file', async () => {
                const callback = sinon.stub()
                await adapter.deleteDatabase('test.json', callback)

                sinon.assert.calledWith(mockWorkspace.fs.rm as sinon.SinonStub, path.join(testDir, 'test.json'))
                sinon.assert.calledWith(callback, undefined)
            })

            it('should handle errors during delete', async () => {
                ;(mockWorkspace.fs.rm as sinon.SinonStub).rejects(new Error('Delete error'))

                const callback = sinon.stub()
                await adapter.deleteDatabase('test.json', callback)

                sinon.assert.calledOnce(callback)
                assert(callback.firstCall.args[0] instanceof Error)
            })
        })
    })
})
