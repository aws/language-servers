/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { TestFeatures } from '@aws/language-server-runtimes/testing'
import sinon from 'ts-sinon'
import * as assert from 'assert'
import { TabBarController } from './tabBarController'
import { ChatDatabase, EMPTY_CONVERSATION_LIST_ID } from './tools/chatDb/chatDb'
import { Tab } from './tools/chatDb/util'
import { ConversationItemGroup, OpenTabParams, OpenTabResult } from '@aws/language-server-runtimes-types'
import { InitializeParams } from '@aws/language-server-runtimes/protocol'

describe('TabBarController', () => {
    let testFeatures: TestFeatures
    let chatHistoryDb: ChatDatabase
    let tabBarController: TabBarController
    let clock: sinon.SinonFakeTimers

    beforeEach(() => {
        testFeatures = new TestFeatures()
        chatHistoryDb = {
            getHistory: sinon.stub().returns([]),
            searchMessages: sinon.stub().returns([]),
            getOpenTabId: sinon.stub(),
            getTab: sinon.stub(),
            deleteHistory: sinon.stub(),
            setHistoryIdMapping: sinon.stub(),
            getOpenTabs: sinon.stub().returns([]),
            updateTabOpenState: sinon.stub(),
        } as unknown as ChatDatabase

        tabBarController = new TabBarController(testFeatures, chatHistoryDb)
        clock = sinon.useFakeTimers()
    })

    afterEach(() => {
        sinon.restore()
        clock.restore()
        testFeatures.dispose()
    })

    describe('onListConversations', () => {
        it('should return full conversation history when no search filter is provided', async () => {
            const mockHistory = [{ id: 'history1' }, { id: 'history2' }]
            ;(chatHistoryDb.getHistory as sinon.SinonStub).returns(mockHistory)

            const result = await tabBarController.onListConversations({})

            assert.strictEqual(result.header?.title, 'Chat history')
            assert.ok(result.filterOptions)
            assert.deepStrictEqual(result.list, mockHistory)
            sinon.assert.calledOnce(chatHistoryDb.getHistory as sinon.SinonStub)
        })

        it('should perform debounced search when search filter is provided', async () => {
            const mockSearchResults = [{ id: 'result1' }]
            ;(chatHistoryDb.searchMessages as sinon.SinonStub).returns(mockSearchResults)

            const promise = tabBarController.onListConversations({ filter: { search: 'test query' } })

            // Fast-forward the debounce timer
            clock.tick(300)

            const result = await promise

            assert.deepStrictEqual(result.list, mockSearchResults)
            sinon.assert.calledWith(chatHistoryDb.searchMessages as sinon.SinonStub, 'test query')
        })

        it('should clear previous timeout when multiple search requests are made', async () => {
            const clearTimeoutSpy = sinon.spy(global, 'clearTimeout')

            // First search request
            const promise1 = tabBarController.onListConversations({ filter: { search: 'first query' } })

            // Second search request before debounce time
            const promise2 = tabBarController.onListConversations({ filter: { search: 'second query' } })

            // Fast-forward the debounce timer
            clock.tick(300)

            await promise2

            sinon.assert.calledOnce(clearTimeoutSpy)
            sinon.assert.calledWith(chatHistoryDb.searchMessages as sinon.SinonStub, 'second query')
        })

        it('should attach Delete action to each conversation item in history', async () => {
            const mockHistory: ConversationItemGroup[] = [
                {
                    items: [{ id: 'history1' }, { id: 'history2' }],
                },
            ]
            ;(chatHistoryDb.getHistory as sinon.SinonStub).returns(mockHistory)

            const result = await tabBarController.onListConversations({})

            sinon.assert.calledOnce(chatHistoryDb.getHistory as sinon.SinonStub)
            assert.deepStrictEqual(result.list, [
                {
                    items: [
                        { id: 'history1', actions: [{ text: 'Delete', icon: 'trash', id: 'history1' }] },
                        { id: 'history2', actions: [{ text: 'Delete', icon: 'trash', id: 'history2' }] },
                    ],
                },
            ])
        })

        it('should attach Export action if client supports window.showSaveFileDialog protocol', async () => {
            testFeatures.setClientParams({
                initializationOptions: {
                    aws: {
                        awsClientCapabilities: {
                            window: {
                                showSaveFileDialog: true,
                            },
                        },
                    },
                },
            } as InitializeParams)
            const mockHistory: ConversationItemGroup[] = [
                {
                    items: [{ id: 'history1' }, { id: 'history2' }],
                },
            ]
            ;(chatHistoryDb.getHistory as sinon.SinonStub).returns(mockHistory)

            const result = await tabBarController.onListConversations({})

            sinon.assert.calledOnce(chatHistoryDb.getHistory as sinon.SinonStub)
            assert.deepStrictEqual(result.list, [
                {
                    items: [
                        {
                            id: 'history1',
                            actions: [
                                { text: 'Export', icon: 'external', id: 'history1' },
                                { text: 'Delete', icon: 'trash', id: 'history1' },
                            ],
                        },
                        {
                            id: 'history2',
                            actions: [
                                { text: 'Export', icon: 'external', id: 'history2' },
                                { text: 'Delete', icon: 'trash', id: 'history2' },
                            ],
                        },
                    ],
                },
            ])
        })

        it('should attach actions to each conversation item in history when search filter is applied', async () => {
            const mockSearchResults: ConversationItemGroup[] = [
                {
                    items: [{ id: 'history1' }, { id: 'history2' }],
                },
            ]
            ;(chatHistoryDb.searchMessages as sinon.SinonStub).returns(mockSearchResults)

            const promise = tabBarController.onListConversations({
                filter: {
                    search: 'testsearch',
                },
            })

            // Fast-forward the debounce timer
            clock.tick(300)

            const result = await promise

            sinon.assert.calledOnce(chatHistoryDb.searchMessages as sinon.SinonStub)
            assert.deepStrictEqual(result.list, [
                {
                    items: [
                        { id: 'history1', actions: [{ text: 'Delete', icon: 'trash', id: 'history1' }] },
                        { id: 'history2', actions: [{ text: 'Delete', icon: 'trash', id: 'history2' }] },
                    ],
                },
            ])
        })

        it('does not attach actions to empty conversation list result', async () => {
            const mockSearchResults: ConversationItemGroup[] = [
                { items: [{ id: 'empty', description: 'No matches found' }] },
            ]
            ;(chatHistoryDb.searchMessages as sinon.SinonStub).returns(mockSearchResults)

            const promise = tabBarController.onListConversations({
                filter: {
                    search: 'testsearch',
                },
            })

            // Fast-forward the debounce timer
            clock.tick(300)

            const result = await promise

            sinon.assert.calledOnce(chatHistoryDb.searchMessages as sinon.SinonStub)
            assert.deepStrictEqual(result.list, [{ items: [{ id: 'empty', description: 'No matches found' }] }])
            // @ts-ignore
            assert.strictEqual(result.list[0].items[0].actions!, undefined)
        })
    })

    describe('onConversationClick', () => {
        it('should focus existing tab when conversation is already open', async () => {
            const historyId = 'history1'
            const openTabId = 'tab1'
            ;(chatHistoryDb.getOpenTabId as sinon.SinonStub).withArgs(historyId).returns(openTabId)

            const openTabStub = sinon.stub<[OpenTabParams], Promise<OpenTabResult>>()
            testFeatures.chat.openTab = openTabStub

            await tabBarController.onConversationClick({ id: historyId })

            sinon.assert.calledWith(openTabStub, { tabId: openTabId })
        })

        it('should restore tab when conversation is not already open', async () => {
            const historyId = 'history1'
            const mockTab = { historyId, conversations: [{ messages: [] }] } as unknown as Tab

            ;(chatHistoryDb.getOpenTabId as sinon.SinonStub).withArgs(historyId).returns(null)
            ;(chatHistoryDb.getTab as sinon.SinonStub).withArgs(historyId).returns(mockTab)

            const openTabStub = sinon.stub<[OpenTabParams], Promise<OpenTabResult>>().resolves({ tabId: 'newTabId' })
            testFeatures.chat.openTab = openTabStub

            await tabBarController.onConversationClick({ id: historyId })

            sinon.assert.calledOnce(openTabStub)
            sinon.assert.calledWith(chatHistoryDb.setHistoryIdMapping as sinon.SinonStub, 'newTabId', historyId)
        })

        it('should delete conversation when delete action is specified', async () => {
            const historyId = 'history1'

            const result = await tabBarController.onConversationClick({ id: historyId, action: 'delete' })

            sinon.assert.calledWith(chatHistoryDb.deleteHistory as sinon.SinonStub, historyId)
            assert.strictEqual(result.success, true)
        })

        it('should not perform actions when item with `empty` historyId is clicked', async () => {
            const historyId = EMPTY_CONVERSATION_LIST_ID
            const openTabId = 'tab1'
            ;(chatHistoryDb.getOpenTabId as sinon.SinonStub).withArgs(historyId).returns(openTabId)

            const openTabStub = sinon.stub<[OpenTabParams], Promise<OpenTabResult>>()
            testFeatures.chat.openTab = openTabStub

            const result = await tabBarController.onConversationClick({ id: historyId })

            sinon.assert.notCalled(openTabStub)
            assert.deepStrictEqual(result, {
                id: EMPTY_CONVERSATION_LIST_ID,
                success: true,
            })
        })
    })

    describe('export conversation', () => {
        let showSaveFileDialogStub: sinon.SinonStub
        let fsWriteFileStub: sinon.SinonStub

        beforeEach(() => {
            testFeatures.setClientParams({
                workspaceFolders: [
                    {
                        uri: 'file:///testworkspace',
                        name: 'workspace',
                    },
                ],
            } as InitializeParams)

            showSaveFileDialogStub = sinon.stub().returns({
                targetUri: 'file:///testworkspace/test.md',
            })
            testFeatures.lsp.window.showSaveFileDialog = showSaveFileDialogStub
            fsWriteFileStub = sinon.stub()
            testFeatures.workspace.fs.writeFile = fsWriteFileStub

            testFeatures.chat.getSerializedChat.resolves({
                content: 'Test Serialized Content',
            })
        })

        it('should write serialized chat content to the location selected by user', async () => {
            const historyId = 'history1'
            const openTabId = 'tab1'
            ;(chatHistoryDb.getOpenTabId as sinon.SinonStub).withArgs(historyId).returns(openTabId)

            const result = await tabBarController.onConversationClick({ id: historyId, action: 'export' })

            // Show SaveFile dialog to user with default filename
            sinon.assert.calledWith(showSaveFileDialogStub, {
                supportedFormats: ['markdown', 'html'],
                defaultUri: 'file:///testworkspace/q-dev-chat-1970-01-01.md',
            })

            // Get serialized Chat content from Chat Client library
            assert(
                testFeatures.chat.getSerializedChat.calledWith({
                    tabId: 'tab1',
                    format: 'markdown',
                })
            )

            // Write serialized content to file
            sinon.assert.calledWith(fsWriteFileStub, '/testworkspace/test.md', 'Test Serialized Content')

            assert.strictEqual(result.success, true)
        })

        it('should restore conversation tab and export conversation if tab was not opened', async () => {
            const historyId = 'history1'
            const mockTab = { historyId, conversations: [{ messages: [] }] } as unknown as Tab
            const openTabId = 'tab1'
            ;(chatHistoryDb.getOpenTabId as sinon.SinonStub)
                .withArgs(historyId)
                .onFirstCall()
                .returns(null)
                .onSecondCall()
                .returns(openTabId)
            ;(chatHistoryDb.getTab as sinon.SinonStub).withArgs(historyId).returns(mockTab)

            const openTabStub = sinon.stub<[OpenTabParams], Promise<OpenTabResult>>().resolves({ tabId: 'newTabId' })
            testFeatures.chat.openTab = openTabStub

            const result = await tabBarController.onConversationClick({ id: historyId, action: 'export' })

            sinon.assert.calledOnceWithExactly(chatHistoryDb.getTab as sinon.SinonStub, 'history1')

            assert.strictEqual(result.success, true)
        })

        it('should fail if tab was not restored during export', async () => {
            const historyId = 'history1'
            const mockTab = { historyId, conversations: [{ messages: [] }] } as unknown as Tab
            ;(chatHistoryDb.getOpenTabId as sinon.SinonStub)
                .withArgs(historyId)
                .onFirstCall()
                .returns(null)
                .onSecondCall()
                .returns(null) // failed to restore tab
            ;(chatHistoryDb.getTab as sinon.SinonStub).withArgs(historyId).returns(mockTab)

            const openTabStub = sinon.stub<[OpenTabParams], Promise<OpenTabResult>>().resolves({ tabId: 'newTabId' })
            testFeatures.chat.openTab = openTabStub

            const result = await tabBarController.onConversationClick({ id: historyId, action: 'export' })

            sinon.assert.calledOnceWithExactly(chatHistoryDb.getTab as sinon.SinonStub, 'history1')
            sinon.assert.notCalled(showSaveFileDialogStub)
            sinon.assert.notCalled(fsWriteFileStub)

            assert.strictEqual(result.success, false)
        })

        it('should export conversation on tabBarAction call', async () => {
            const result = await tabBarController.onTabBarAction({ tabId: 'tab1', action: 'export' })

            // Show SaveFile dialog to user with default filename
            sinon.assert.calledWith(showSaveFileDialogStub, {
                supportedFormats: ['markdown', 'html'],
                defaultUri: 'file:///testworkspace/q-dev-chat-1970-01-01.md',
            })

            // Get serialized Chat content from Chat Client library
            assert(
                testFeatures.chat.getSerializedChat.calledWith({
                    tabId: 'tab1',
                    format: 'markdown',
                })
            )

            // Write serialized content to file
            sinon.assert.calledWith(fsWriteFileStub, '/testworkspace/test.md', 'Test Serialized Content')

            assert.strictEqual(result.success, true)
        })
    })

    describe('restoreTab', () => {
        it('should open new tab with conversation messages', async () => {
            const historyId = 'history1'
            const mockTab = {
                historyId,
                conversations: [
                    {
                        messages: [
                            { role: 'user', content: 'Hello' },
                            { role: 'assistant', content: 'Hi there' },
                        ],
                    },
                ],
            } as unknown as Tab

            const openTabStub = sinon.stub<[OpenTabParams], Promise<OpenTabResult>>().resolves({ tabId: 'newTabId' })
            testFeatures.chat.openTab = openTabStub

            await tabBarController.restoreTab(mockTab)

            sinon.assert.calledOnce(openTabStub)
            sinon.assert.calledWith(chatHistoryDb.setHistoryIdMapping as sinon.SinonStub, 'newTabId', historyId)
        })

        it('should do nothing when tab is null or undefined', async () => {
            const openTabStub = sinon.stub<[OpenTabParams], Promise<OpenTabResult>>()
            testFeatures.chat.openTab = openTabStub

            await tabBarController.restoreTab(null)

            sinon.assert.notCalled(openTabStub)
            sinon.assert.notCalled(chatHistoryDb.setHistoryIdMapping as sinon.SinonStub)
        })
    })

    describe('loadChats', () => {
        it('should restore all open tabs from history', async () => {
            const mockTabs = [
                { historyId: 'history1', conversations: [{ messages: [] }] },
                { historyId: 'history2', conversations: [{ messages: [] }] },
            ] as unknown as Tab[]

            ;(chatHistoryDb.getOpenTabs as sinon.SinonStub).returns(mockTabs)

            const restoreTabStub = sinon.stub(tabBarController, 'restoreTab')

            await tabBarController.loadChats()

            sinon.assert.calledTwice(restoreTabStub)
            sinon.assert.calledWith(restoreTabStub.firstCall, mockTabs[0])
            sinon.assert.calledWith(restoreTabStub.secondCall, mockTabs[1])
        })

        it('should only load chats once', async () => {
            const mockTabs = [{ historyId: 'history1', conversations: [{ messages: [] }] }] as unknown as Tab[]
            ;(chatHistoryDb.getOpenTabs as sinon.SinonStub).returns(mockTabs)

            const restoreTabStub = sinon.stub(tabBarController, 'restoreTab')

            await tabBarController.loadChats()
            await tabBarController.loadChats() // Second call should be ignored

            sinon.assert.calledOnce(restoreTabStub)
        })

        it('should not restore tabs with empty conversations', async () => {
            const mockTabs = [
                { historyId: 'history1', conversations: [] },
                { historyId: 'history2', conversations: [{ messages: [] }] },
            ] as unknown as Tab[]

            ;(chatHistoryDb.getOpenTabs as sinon.SinonStub).returns(mockTabs)

            const restoreTabStub = sinon.stub(tabBarController, 'restoreTab')

            await tabBarController.loadChats()

            sinon.assert.calledOnce(restoreTabStub)
            sinon.assert.calledWith(restoreTabStub, mockTabs[1])
        })
    })
})
