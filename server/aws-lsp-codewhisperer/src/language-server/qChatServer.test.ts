import { ChatResponseStream, CodeWhispererStreaming } from '@amzn/codewhisperer-streaming'
import {
    ChatResult,
    CredentialsProvider,
    ErrorCodes,
    ResponseError,
    Server,
} from '@aws/language-server-runtimes/server-interface'
import { TestFeatures } from '@aws/language-server-runtimes/testing'
import * as assert from 'assert'
import sinon from 'ts-sinon'
import { ChatSessionManagementService } from './chat/chatSessionManagementService'
import { ChatSessionService } from './chat/chatSessionService'
import { QChatServer } from './qChatServer'
import { createIterableResponse } from './testUtils'

describe('QChatServer', () => {
    const mockTabId = 'tab-1'
    const mockConversationId = 'mock-conversation-id'
    const mockMessageId = 'mock-message-id'

    const mockAssistantResponseList: ChatResponseStream[] = [
        {
            assistantResponseEvent: {
                content: 'Hello ',
            },
        },
        {
            assistantResponseEvent: {
                content: 'World',
            },
        },
        {
            assistantResponseEvent: {
                content: '!',
            },
        },
    ]

    const expectedCompleteChatResult: ChatResult = {
        messageId: mockMessageId,
        body: 'Hello World!',
        canBeVoted: undefined,
        codeReference: undefined,
        followUp: undefined,
        relatedContent: undefined,
    }

    const mockCancellationToken = {
        isCancellationRequested: false,
        onCancellationRequested: () => ({ dispose: () => null }),
    }

    let generateAssistantResponseStub: sinon.SinonStub
    let disposeStub: sinon.SinonStub
    let clock: sinon.SinonFakeTimers

    let testFeatures: TestFeatures
    let chatSessionManagementService: ChatSessionManagementService
    let disposeServer: () => void

    beforeEach(() => {
        clock = sinon.useFakeTimers()
        generateAssistantResponseStub = sinon
            .stub(CodeWhispererStreaming.prototype, 'generateAssistantResponse')
            .callsFake(() => {
                return new Promise(resolve =>
                    setTimeout(() => {
                        resolve({
                            conversationId: mockConversationId,
                            $metadata: {
                                requestId: mockMessageId,
                            },
                            generateAssistantResponseResponse: createIterableResponse(mockAssistantResponseList),
                        })
                    }, 100)
                )
            })

        disposeStub = sinon.stub(ChatSessionService.prototype, 'dispose')

        chatSessionManagementService = ChatSessionManagementService.getInstance()

        const chatServerFactory: Server = QChatServer((credentialProvider: CredentialsProvider) => {
            return chatSessionManagementService.withCredentialsProvider(credentialProvider)
        })

        testFeatures = new TestFeatures()
        disposeServer = chatServerFactory(testFeatures)
    })

    afterEach(() => {
        generateAssistantResponseStub.restore()
        disposeStub.restore()
        ChatSessionManagementService.reset()
        clock.restore()
    })

    it('dispose should dispose all chat session services', () => {
        testFeatures.chat.onTabAdd.firstCall.firstArg({ tabId: mockTabId })
        testFeatures.chat.onTabAdd.firstCall.firstArg({ tabId: 'tab-2' })

        disposeServer()

        sinon.assert.calledTwice(disposeStub)
    })

    it('server creates a session when a tab add notifcation is received', () => {
        testFeatures.chat.onTabAdd.firstCall.firstArg({ tabId: mockTabId })

        assert.ok(chatSessionManagementService.getSession(mockTabId) instanceof ChatSessionService)
    })

    it('server deletes a session by tab id when a tab remove notifcation is received', () => {
        testFeatures.chat.onTabAdd.firstCall.firstArg({ tabId: mockTabId })

        assert.ok(chatSessionManagementService.getSession(mockTabId) instanceof ChatSessionService)

        testFeatures.chat.onTabRemove.firstCall.firstArg({ tabId: mockTabId })

        sinon.assert.calledOnce(disposeStub)
        assert.strictEqual(chatSessionManagementService.getSession(mockTabId), undefined)
    })

    it('server deletes a session by tab id a end chat request is received', () => {
        testFeatures.chat.onTabAdd.firstCall.firstArg({ tabId: mockTabId })

        assert.ok(chatSessionManagementService.getSession(mockTabId) instanceof ChatSessionService)

        testFeatures.chat.onEndChat.firstCall.firstArg({ tabId: mockTabId }, mockCancellationToken)

        sinon.assert.calledOnce(disposeStub)
        assert.strictEqual(chatSessionManagementService.getSession(mockTabId), undefined)
    })

    describe('onChatPrompt', () => {
        it('throw error if session is not found', async () => {
            const result = await testFeatures.chat.onChatPrompt.firstCall.firstArg(
                { tabId: 'XXXX', prompt: { prompt: 'Hello' } },
                mockCancellationToken
            )

            assert.ok(result instanceof ResponseError)
        })

        // TODO: partialResultToken is missing from the types so tests need to be added later
        it('read all the response streams and return compiled results', async () => {
            testFeatures.chat.onTabAdd.firstCall.firstArg({ tabId: mockTabId })

            const chatResultPromise = testFeatures.chat.onChatPrompt
                .getCall(0)
                .firstArg({ tabId: mockTabId, prompt: { prompt: 'Hello' } }, mockCancellationToken)

            clock.next()

            const chatResult = await chatResultPromise

            assert.deepStrictEqual(chatResult, expectedCompleteChatResult)
        })

        it('returns a ResponseError if request input is not valid', async () => {
            testFeatures.chat.onTabAdd.firstCall.firstArg({ tabId: mockTabId })

            const chatResultPromise = testFeatures.chat.onChatPrompt
                .getCall(0)
                .firstArg({ tabId: mockTabId, prompt: {} }, mockCancellationToken)

            clock.next()
            const chatResult = await chatResultPromise
            assert.ok(chatResult instanceof ResponseError)
        })

        it('returns a ResponseError if generateAssistantResponse returns an error', async () => {
            generateAssistantResponseStub.callsFake(() => {
                throw new Error('Error')
            })

            testFeatures.chat.onTabAdd.firstCall.firstArg({ tabId: mockTabId })

            const chatResult = await testFeatures.chat.onChatPrompt
                .getCall(0)
                .firstArg({ tabId: mockTabId, prompt: { prompt: 'Hello' } }, mockCancellationToken)

            assert.ok(chatResult instanceof ResponseError)
        })

        it('returns a ResponseError if response streams return an error event', async () => {
            generateAssistantResponseStub.callsFake(() => {
                return Promise.resolve({
                    conversationId: mockConversationId,
                    $metadata: {
                        requestId: mockMessageId,
                    },
                    generateAssistantResponseResponse: createIterableResponse([
                        // ["Hello ", "World"]
                        ...mockAssistantResponseList.slice(0, 2),
                        { error: { message: 'some error' } },
                        // ["!"]
                        ...mockAssistantResponseList.slice(2),
                    ]),
                })
            })

            testFeatures.chat.onTabAdd.firstCall.firstArg({ tabId: mockTabId })

            const chatResult = await testFeatures.chat.onChatPrompt
                .getCall(0)
                .firstArg({ tabId: mockTabId, prompt: { prompt: 'Hello' } }, mockCancellationToken)

            assert.deepStrictEqual(
                chatResult,
                new ResponseError(ErrorCodes.InternalError, 'some error', {
                    ...expectedCompleteChatResult,
                    body: 'Hello World',
                })
            )
        })

        it('returns a ResponseError if response streams return an invalid state event', async () => {
            generateAssistantResponseStub.callsFake(() => {
                return Promise.resolve({
                    conversationId: mockConversationId,
                    $metadata: {
                        requestId: mockMessageId,
                    },
                    generateAssistantResponseResponse: createIterableResponse([
                        // ["Hello ", "World"]
                        ...mockAssistantResponseList.slice(0, 2),
                        { invalidStateEvent: { message: 'invalid state' } },
                        // ["!"]
                        ...mockAssistantResponseList.slice(2),
                    ]),
                })
            })

            testFeatures.chat.onTabAdd.firstCall.firstArg({ tabId: mockTabId })

            const chatResult = await testFeatures.chat.onChatPrompt
                .getCall(0)
                .firstArg({ tabId: mockTabId, prompt: { prompt: 'Hello' } }, mockCancellationToken)

            assert.deepStrictEqual(
                chatResult,
                new ResponseError(ErrorCodes.InternalError, 'invalid state', {
                    ...expectedCompleteChatResult,
                    body: 'Hello World',
                })
            )
        })
    })
})
