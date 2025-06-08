/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert'
import sinon from 'ts-sinon'
import { ChatDatabase } from './chatDb'
import { Features } from '@aws/language-server-runtimes/server-interface/server'
import { Message } from './util'
import { ChatMessage, ToolResultStatus } from '@aws/codewhisperer-streaming-client'
import * as fs from 'fs'

describe('ChatDatabase', () => {
    let mockFeatures: Features
    let chatDb: ChatDatabase
    let logDebugStub: sinon.SinonStub
    let logWarnStub: sinon.SinonStub
    let writeFileStub: sinon.SinonStub

    beforeEach(() => {
        logDebugStub = sinon.stub()
        logWarnStub = sinon.stub()
        writeFileStub = sinon.stub(fs, 'writeFile').callsArgWith(3, null)

        mockFeatures = {
            logging: {
                debug: logDebugStub,
                warn: logWarnStub,
                log: sinon.stub(),
                info: sinon.stub(),
                error: sinon.stub(),
            },
            runtime: {
                platform: 'node',
            },
            workspace: {
                fs: {
                    getServerDataDirPath: sinon.stub().returns('/tmp'),
                    getFileSize: sinon.stub().resolves({ size: 0 }),
                    mkdir: sinon.stub().resolves(undefined),
                    writeFile: sinon.stub().resolves(undefined),
                },
                getAllWorkspaceFolders: sinon.stub().returns([
                    {
                        uri: 'file:///workspace',
                        name: 'workspace',
                    },
                ]) as any,
            },
        } as unknown as Features

        chatDb = new ChatDatabase(mockFeatures)
    })

    afterEach(() => {
        chatDb.close()
        sinon.restore()
    })

    describe('ensureValidMessageSequence', () => {
        it('should preserve valid alternating sequence', () => {
            const messages: Message[] = [
                { type: 'prompt', body: 'User first message' },
                { type: 'answer', body: 'Assistant first response' },
                { type: 'prompt', body: 'User second message' },
                { type: 'answer', body: 'Assistant second response' },
            ]

            const originalMessages = [...messages]

            chatDb.ensureValidMessageSequence(messages, {
                userInputMessage: { content: 'New message', userInputMessageContext: {} },
            } as ChatMessage)

            assert.strictEqual(messages.length, 4, 'Should not modify valid sequence')
            assert.deepStrictEqual(messages, originalMessages, 'Messages should remain unchanged')
        })

        it('should remove assistant messages from the beginning and end', () => {
            const messages: Message[] = [
                { type: 'answer', body: 'Assistant first message' },
                { type: 'answer', body: 'Assistant second message' },
                { type: 'prompt', body: 'User message' },
                { type: 'answer', body: 'Assistant response' },
            ]

            //  Should not be possible
            chatDb.ensureValidMessageSequence(messages, {
                assistantResponseMessage: { content: 'New assisstant message' },
            } as ChatMessage)

            assert.strictEqual(messages.length, 1, 'Should have removed assistant messages from the beginning and end')
            assert.strictEqual(messages[0].type, 'prompt', 'First message should be from user')
        })

        it('should remove user message from the end', () => {
            const messages: Message[] = [
                { type: 'prompt', body: 'User first message' },
                { type: 'answer', body: 'Assistant response' },
                { type: 'prompt', body: 'User trailing message' },
            ]

            chatDb.ensureValidMessageSequence(messages, {
                userInputMessage: { content: 'New message', userInputMessageContext: {} },
            } as ChatMessage)

            assert.strictEqual(messages.length, 2, 'Should have removed user message from the end')
            assert.strictEqual(messages[0].type, 'prompt', 'First message should be from user')
            assert.strictEqual(messages[1].type, 'answer', 'Last message should be from assistant')
        })

        it('should handle empty message array', () => {
            const messages: Message[] = []

            chatDb.ensureValidMessageSequence(messages, {
                userInputMessage: { content: 'New message', userInputMessageContext: {} },
            } as ChatMessage)

            assert.strictEqual(messages.length, 0, 'Empty array should remain empty')
        })
    })

    describe('validateNewMessageToolResults', () => {
        it('should handle empty history message array', () => {
            const messages: Message[] = []

            const newUserMessage = {
                userInputMessage: {
                    content: '',
                    userInputMessageContext: {
                        toolResults: [
                            {
                                toolUseId: 'tool-1',
                                status: ToolResultStatus.SUCCESS,
                                content: [{ text: 'Valid result' }],
                            },
                        ],
                    },
                },
            } as ChatMessage

            const isValid = chatDb.validateNewMessageToolResults(messages, newUserMessage)
            assert.strictEqual(isValid, false)
        })

        it('should handle new user message with valid tool results', () => {
            const messages: Message[] = [
                {
                    type: 'prompt',
                    body: 'User first message',
                },
                {
                    type: 'answer',
                    body: 'Assistant message with tool use',
                    toolUses: [{ toolUseId: 'tool-1', name: 'testTool', input: { key: 'value' } }],
                },
            ]

            const newUserMessage = {
                userInputMessage: {
                    content: '',
                    userInputMessageContext: {
                        toolResults: [
                            {
                                toolUseId: 'tool-1',
                                status: ToolResultStatus.SUCCESS,
                                content: [{ text: 'Valid result' }],
                            },
                        ],
                    },
                },
            } as ChatMessage

            const isValid = chatDb.validateNewMessageToolResults(messages, newUserMessage)
            assert.strictEqual(isValid, true)

            const toolResults = newUserMessage.userInputMessage!.userInputMessageContext?.toolResults || []
            assert.strictEqual(toolResults.length, 1, 'Should keep valid tool results')
            assert.strictEqual(toolResults[0].toolUseId, 'tool-1', 'Should have correct tool ID')
            assert.strictEqual(toolResults[0].status, ToolResultStatus.SUCCESS, 'Should keep success status')
            assert.strictEqual(toolResults[0].content?.[0]?.text, 'Valid result', 'Should keep original content')
        })

        it('should handle new user message with missing tool results', () => {
            const messages: Message[] = [
                {
                    type: 'prompt',
                    body: 'User first message',
                },
                {
                    type: 'answer',
                    body: 'Assistant message with tool use',
                    toolUses: [{ toolUseId: 'tool-1', name: 'testTool', input: { key: 'value' } }],
                },
            ]

            const newUserMessage = {
                userInputMessage: {
                    content: 'New message',
                    userInputMessageContext: {},
                },
            } as ChatMessage

            const isValid = chatDb.validateNewMessageToolResults(messages, newUserMessage)
            assert.strictEqual(isValid, true)

            const toolResults = newUserMessage.userInputMessage!.userInputMessageContext?.toolResults || []
            assert.strictEqual(toolResults.length, 1, 'Should have added tool results')

            // Check missing tool result was added
            assert.strictEqual(toolResults[0].toolUseId, 'tool-1', 'Should add missing tool ID')
            assert.strictEqual(toolResults[0].status, ToolResultStatus.ERROR, 'Should mark as error')
        })

        it('should handle new user message with tool results after assistant message without tool uses', () => {
            const messages: Message[] = [
                {
                    type: 'answer',
                    body: 'Assistant message with tool use',
                    toolUses: [],
                },
            ]

            const newUserMessage = {
                userInputMessage: {
                    content: '',
                    userInputMessageContext: {
                        toolResults: [
                            {
                                toolUseId: 'tool-1',
                                status: ToolResultStatus.SUCCESS,
                                content: [{ text: 'Valid result' }],
                            },
                        ],
                    },
                },
            } as ChatMessage

            const isValid = chatDb.validateNewMessageToolResults(messages, newUserMessage)
            assert.strictEqual(isValid, false)
        })

        it('should handle new user message with invalid tool results ID', () => {
            const messages: Message[] = [
                {
                    type: 'answer',
                    body: 'Assistant message with tool use',
                    toolUses: [{ toolUseId: 'tool-2', name: 'testTool', input: { key: 'value' } }],
                },
            ]

            const newUserMessage = {
                userInputMessage: {
                    content: '',
                    userInputMessageContext: {
                        toolResults: [
                            {
                                toolUseId: 'tool-1',
                                status: ToolResultStatus.SUCCESS,
                                content: [{ text: 'Valid result' }],
                            },
                        ],
                    },
                },
            } as ChatMessage

            const isValid = chatDb.validateNewMessageToolResults(messages, newUserMessage)
            assert.strictEqual(isValid, true)

            const toolResults = newUserMessage.userInputMessage!.userInputMessageContext?.toolResults || []
            assert.strictEqual(toolResults.length, 1, 'Should have only one tool results')
            assert.strictEqual(toolResults[0].toolUseId, 'tool-2', 'Tool ID should match previous message')
        })

        it('should handle multiple tool uses and results correctly', () => {
            const messages: Message[] = [
                {
                    type: 'prompt',
                    body: 'User first message',
                },
                {
                    type: 'answer',
                    body: 'Assistant first response',
                    toolUses: [{ toolUseId: 'tool-1', name: 'testTool', input: { key: 'value1' } }],
                },
                {
                    type: 'prompt',
                    body: 'User second message',
                    userInputMessageContext: {
                        toolResults: [
                            { toolUseId: 'tool-1', status: ToolResultStatus.SUCCESS, content: [{ text: 'Result 1' }] },
                        ],
                    },
                },
                {
                    type: 'answer',
                    body: 'Assistant second response',
                    toolUses: [
                        { toolUseId: 'tool-2', name: 'testTool', input: { key: 'value2' } },
                        { toolUseId: 'tool-3', name: 'testTool', input: { key: 'value3' } },
                    ],
                },
            ]

            const newUserMessage = {
                userInputMessage: {
                    content: 'New message',
                    userInputMessageContext: {
                        toolResults: [
                            { toolUseId: 'tool-2', status: ToolResultStatus.SUCCESS, content: [{ text: 'Result 2' }] },
                        ],
                    },
                },
            } as ChatMessage

            const isValid = chatDb.validateNewMessageToolResults(messages, newUserMessage)

            const toolResults = newUserMessage.userInputMessage!.userInputMessageContext?.toolResults || []
            assert.strictEqual(toolResults.length, 2, 'Should have correct number of tool results')

            // Check valid result is preserved
            assert.strictEqual(toolResults[0].toolUseId, 'tool-2', 'Should preserve valid tool ID')
            assert.strictEqual(toolResults[0].status, ToolResultStatus.SUCCESS, 'Should keep success status')

            // Check missing tool result was added
            assert.strictEqual(toolResults[1].toolUseId, 'tool-3', 'Should add missing tool ID')
            assert.strictEqual(toolResults[1].status, ToolResultStatus.ERROR, 'Should mark as error')
        })

        it('should handle new user message with no tool results and blank content', () => {
            const messages: Message[] = [
                {
                    type: 'prompt',
                    body: 'User first message',
                },
                {
                    type: 'answer',
                    body: 'Assistant message with tool use',
                },
            ]

            const newUserMessage = {
                userInputMessage: {
                    content: '',
                    userInputMessageContext: {
                        toolResults: [],
                    },
                },
            } as ChatMessage

            const isValid = chatDb.validateNewMessageToolResults(messages, newUserMessage)
            assert.strictEqual(isValid, false)
        })
    })
})
