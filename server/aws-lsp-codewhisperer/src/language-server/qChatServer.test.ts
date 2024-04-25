import { ChatResponseStream, CodeWhispererStreaming } from '@amzn/codewhisperer-streaming'
import { CredentialsProvider, ResponseError, Server } from '@aws/language-server-runtimes/server-interface'
import * as assert from 'assert'
import sinon from 'ts-sinon'
import { ChatSessionManagementService } from './chat/chatSessionManagementService'
import { ChatSessionService } from './chat/chatSessionService'
import { QChatServer } from './qChatServer'
import { createIterableResponse } from './testUtils'
import { TestFeaturesWithChat } from './testing/TestFeaturesWithChat'

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

describe('QChatServer', () => {
    const mockTabId = 'tab-1'
    const mockConversationId = 'mock-conversation-id'
    const mockMessageId = 'mock-message-id'

    const mockCancellationToken = {
        isCancellationRequested: false,
        onCancellationRequested: () => ({ dispose: () => null }),
    }

    let generateAssistantResponseStub: sinon.SinonStub
    let disposeStub: sinon.SinonStub
    let abortStub: sinon.SinonStub
    let clock: sinon.SinonFakeTimers

    let testFeatures: TestFeaturesWithChat
    let chatSessionManagementService: ChatSessionManagementService

    beforeEach(() => {
        clock = sinon.useFakeTimers()
        generateAssistantResponseStub = sinon
            .stub(CodeWhispererStreaming.prototype, 'generateAssistantResponse')
            .callsFake(() => {
                // adding a timeout here helps testing other behaviors
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
        abortStub = sinon.stub(AbortController.prototype, 'abort')

        chatSessionManagementService = ChatSessionManagementService.getInstance()

        const chatServerFactory: Server = QChatServer((credentialProvider: CredentialsProvider) => {
            return chatSessionManagementService.withCredentialsProvider(credentialProvider)
        })

        testFeatures = new TestFeaturesWithChat()
        chatServerFactory(testFeatures)
    })

    afterEach(() => {
        generateAssistantResponseStub.restore()
        disposeStub.restore()
        abortStub.restore()
        ChatSessionManagementService.reset()
    })

    // TODO handle what happens if a session is already created for a tabId

    it('server creates a session when a tab add notifcation is received', () => {
        testFeatures.doTabAdd({ tabId: mockTabId })

        assert.ok(chatSessionManagementService.getSession(mockTabId) instanceof ChatSessionService)
    })

    it('server deletes a session by tab id when a tab remove notifcation is received', () => {
        testFeatures.doTabAdd({ tabId: mockTabId })

        assert.ok(chatSessionManagementService.getSession(mockTabId) instanceof ChatSessionService)

        testFeatures.doTabRemove({ tabId: mockTabId })

        sinon.assert.calledOnce(disposeStub)
        assert.strictEqual(chatSessionManagementService.getSession(mockTabId), undefined)
    })

    it('server deletes a session by tab id a tab remove notifcation is received', () => {
        testFeatures.doTabAdd({ tabId: mockTabId })

        assert.ok(chatSessionManagementService.getSession(mockTabId) instanceof ChatSessionService)

        testFeatures.doEndChat({ tabId: mockTabId }, mockCancellationToken)

        sinon.assert.calledOnce(disposeStub)
        assert.strictEqual(chatSessionManagementService.getSession(mockTabId), undefined)
    })

    describe('onChatPrompt', () => {
        it('throw error if session is not found', async () => {
            const result = await testFeatures.doChatPrompt(
                { tabId: 'XXXX', prompt: { prompt: 'Hello' } },
                mockCancellationToken
            )

            assert.deepStrictEqual(result, new ResponseError(404, 'Session not found'))
        })

        // Why doesn't this work!?
        it.skip('onEndChat should abort the request if one is being made', async () => {
            testFeatures.doTabAdd({ tabId: mockTabId })

            const chatResultPromise = testFeatures.doChatPrompt(
                { tabId: mockTabId, prompt: { prompt: 'Hello' } },
                mockCancellationToken
            )

            testFeatures.doEndChat({ tabId: mockTabId }, mockCancellationToken)

            clock.next()
            await chatResultPromise

            sinon.assert.calledOnce(abortStub)
        })

        // TODO: partialResultToken is missing from the types so tests need to be added later
        it('read all the response streams and return compiled results', async () => {
            testFeatures.doTabAdd({ tabId: mockTabId })

            const chatResultPromise = testFeatures.doChatPrompt(
                { tabId: mockTabId, prompt: { prompt: 'Hello' } },
                mockCancellationToken
            )

            clock.next()

            const chatResult = await chatResultPromise

            assert.deepStrictEqual(chatResult, {
                messageId: mockMessageId,
                body: 'Hello World!',
                canBeVoted: undefined,
                codeReference: undefined,
                followUp: undefined,
                relatedContent: undefined,
            })
        })
    })
})
