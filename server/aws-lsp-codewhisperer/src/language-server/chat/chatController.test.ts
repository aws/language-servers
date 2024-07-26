import {
    ChatResponseStream,
    CodeWhispererStreaming,
    GenerateAssistantResponseCommandInput,
} from '@amzn/codewhisperer-streaming'
import { ChatResult, LSPErrorCodes, ResponseError, TextDocument } from '@aws/language-server-runtimes/server-interface'
import { TestFeatures } from '@aws/language-server-runtimes/testing'
import * as assert from 'assert'
import sinon from 'ts-sinon'
import { createIterableResponse } from '../testUtils'
import { ChatController } from './chatController'
import { ChatSessionManagementService } from './chatSessionManagementService'
import { ChatSessionService } from './chatSessionService'
import { ChatTelemetryController } from './telemetry/chatTelemetryController'
import { TriggerContextExtractor } from './contexts/triggerContextExtractor'
import * as utils from './utils'
import { DEFAULT_HELP_FOLLOW_UP_PROMPT, HELP_MESSAGE } from './constants'

describe('ChatController', () => {
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
        canBeVoted: true,
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
    let activeTabSpy: {
        get: sinon.SinonSpy<[], string | undefined>
        set: sinon.SinonSpy<[string | undefined], void>
    }
    let removeConversationSpy: sinon.SinonSpy
    let emitConversationMetricStub: sinon.SinonStub

    let testFeatures: TestFeatures
    let chatSessionManagementService: ChatSessionManagementService
    let chatController: ChatController

    beforeEach(() => {
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
                    })
                )
            })

        testFeatures = new TestFeatures()

        activeTabSpy = sinon.spy(ChatTelemetryController.prototype, 'activeTabId', ['get', 'set'])
        removeConversationSpy = sinon.spy(ChatTelemetryController.prototype, 'removeConversation')
        emitConversationMetricStub = sinon.stub(ChatTelemetryController.prototype, 'emitConversationMetric')

        disposeStub = sinon.stub(ChatSessionService.prototype, 'dispose')

        chatSessionManagementService = ChatSessionManagementService.getInstance().withCredentialsProvider(
            testFeatures.credentialsProvider
        )

        chatController = new ChatController(chatSessionManagementService, testFeatures)
    })

    afterEach(() => {
        sinon.restore()
        ChatSessionManagementService.reset()
    })

    it('creates a session when a tab add notifcation is received', () => {
        chatController.onTabAdd({ tabId: mockTabId })

        const sessionResult = chatSessionManagementService.getSession(mockTabId)
        sinon.assert.match(sessionResult, {
            success: true,
            data: sinon.match.instanceOf(ChatSessionService),
        })
    })

    it('deletes a session by tab id when a tab remove notifcation is received', () => {
        chatController.onTabAdd({ tabId: mockTabId })

        assert.ok(chatSessionManagementService.getSession(mockTabId).data instanceof ChatSessionService)

        chatController.onTabRemove({ tabId: mockTabId })

        sinon.assert.calledOnce(disposeStub)

        const hasSession = chatSessionManagementService.hasSession(mockTabId)

        assert.ok(!hasSession)
    })

    it('deletes a session by tab id an end chat request is received', () => {
        chatController.onTabAdd({ tabId: mockTabId })

        chatController.onEndChat({ tabId: mockTabId }, mockCancellationToken)

        sinon.assert.calledOnce(disposeStub)

        const hasSession = chatSessionManagementService.hasSession(mockTabId)

        assert.ok(!hasSession)
    })

    it('onTabAdd sets active tab id in telemetryController', () => {
        chatController.onTabAdd({ tabId: mockTabId })

        sinon.assert.calledWithExactly(activeTabSpy.set, mockTabId)
    })

    it('onTabChange sets active tab id in telemetryController and emits metrics', () => {
        chatController.onTabChange({ tabId: mockTabId })

        sinon.assert.calledWithExactly(activeTabSpy.set, mockTabId)
        sinon.assert.calledTwice(emitConversationMetricStub)
    })

    it('onTabRemove unsets tab id if current tab is removed and emits metrics', () => {
        chatController.onTabAdd({ tabId: mockTabId })

        emitConversationMetricStub.resetHistory()
        activeTabSpy.set.resetHistory()

        chatController.onTabRemove({ tabId: mockTabId })

        sinon.assert.calledWithExactly(removeConversationSpy, mockTabId)
        sinon.assert.calledOnce(emitConversationMetricStub)
    })

    it('onTabRemove does not unset tabId if current tab is not being removed', () => {
        chatController.onTabAdd({ tabId: mockTabId })
        chatController.onTabAdd({ tabId: 'mockTabId-2' })

        testFeatures.telemetry.emitMetric.resetHistory()
        activeTabSpy.set.resetHistory()

        chatController.onTabRemove({ tabId: mockTabId })

        sinon.assert.notCalled(activeTabSpy.set)
        sinon.assert.calledWithExactly(removeConversationSpy, mockTabId)
        sinon.assert.notCalled(emitConversationMetricStub)
    })

    describe('onChatPrompt', () => {
        beforeEach(() => {
            chatController.onTabAdd({ tabId: mockTabId })
        })
        it("throws error if credentials provider doesn't exist", async () => {
            ChatSessionManagementService.getInstance().withCredentialsProvider(undefined as any)
            const result = await chatController.onChatPrompt(
                { tabId: 'XXXX', prompt: { prompt: 'Hello' } },
                mockCancellationToken
            )

            assert.ok(result instanceof ResponseError)
        })

        it('read all the response streams and return compiled results', async () => {
            const chatResultPromise = chatController.onChatPrompt(
                { tabId: mockTabId, prompt: { prompt: 'Hello' } },
                mockCancellationToken
            )

            const chatResult = await chatResultPromise

            sinon.assert.callCount(testFeatures.lsp.sendProgress, 0)
            assert.deepStrictEqual(chatResult, expectedCompleteChatResult)
        })

        it('returns help message if it is a help follow up action', async () => {
            const chatResultPromise = chatController.onChatPrompt(
                { tabId: mockTabId, prompt: { prompt: DEFAULT_HELP_FOLLOW_UP_PROMPT } },
                mockCancellationToken
            )

            const chatResult = await chatResultPromise

            sinon.assert.match(chatResult, {
                messageId: sinon.match.string,
                body: HELP_MESSAGE,
            })
        })

        it('read all the response streams and send progress as partial result is received', async () => {
            const chatResultPromise = chatController.onChatPrompt(
                { tabId: mockTabId, prompt: { prompt: 'Hello' }, partialResultToken: 1 },
                mockCancellationToken
            )

            const chatResult = await chatResultPromise

            sinon.assert.callCount(testFeatures.lsp.sendProgress, mockAssistantResponseList.length)
            assert.deepStrictEqual(chatResult, expectedCompleteChatResult)
        })

        it('can use 0 as progress token', async () => {
            const chatResultPromise = chatController.onChatPrompt(
                { tabId: mockTabId, prompt: { prompt: 'Hello' }, partialResultToken: 0 },
                mockCancellationToken
            )

            const chatResult = await chatResultPromise

            sinon.assert.callCount(testFeatures.lsp.sendProgress, mockAssistantResponseList.length)
            assert.deepStrictEqual(chatResult, expectedCompleteChatResult)
        })

        it('returns a ResponseError if generateAssistantResponse returns an error', async () => {
            generateAssistantResponseStub.callsFake(() => {
                throw new Error('Error')
            })

            const chatResult = await chatController.onChatPrompt(
                { tabId: mockTabId, prompt: { prompt: 'Hello' } },
                mockCancellationToken
            )

            assert.ok(chatResult instanceof ResponseError)
        })

        it('returns a auth follow up action if generateAssistantResponse returns an auth error', async () => {
            generateAssistantResponseStub.callsFake(() => {
                throw new Error('Error')
            })

            sinon.stub(utils, 'getAuthFollowUpType').returns('full-auth')
            const chatResultPromise = chatController.onChatPrompt(
                { tabId: mockTabId, prompt: { prompt: 'Hello' }, partialResultToken: 1 },
                mockCancellationToken
            )

            const chatResult = await chatResultPromise

            sinon.assert.callCount(testFeatures.lsp.sendProgress, 0)
            assert.deepStrictEqual(chatResult, utils.createAuthFollowUpResult('full-auth'))
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

            const chatResult = await chatController.onChatPrompt(
                { tabId: mockTabId, prompt: { prompt: 'Hello' } },
                mockCancellationToken
            )

            assert.deepStrictEqual(chatResult, new ResponseError(LSPErrorCodes.RequestFailed, 'some error'))
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

            const chatResult = await chatController.onChatPrompt(
                { tabId: mockTabId, prompt: { prompt: 'Hello' } },
                mockCancellationToken
            )

            assert.deepStrictEqual(chatResult, new ResponseError(LSPErrorCodes.RequestFailed, 'invalid state'))
        })

        describe('#extractDocumentContext', () => {
            const typescriptDocument = TextDocument.create('file:///test.ts', 'typescript', 1, 'test')
            let extractDocumentContextStub: sinon.SinonStub

            const mockCursorState = {
                range: {
                    start: {
                        line: 1,
                        character: 1,
                    },
                    end: {
                        line: 1,
                        character: 1,
                    },
                },
            }

            beforeEach(() => {
                extractDocumentContextStub = sinon.stub(TriggerContextExtractor.prototype, 'extractDocumentContext')
                testFeatures.openDocument(typescriptDocument)
            })

            afterEach(() => {
                extractDocumentContextStub.restore()
            })

            it('leaves editor state as undefined if cursorState is not passed', async () => {
                const documentContextObject = {
                    programmingLanguage: 'typescript',
                    cursorState: undefined,
                    relativeFilePath: 'file:///test.ts',
                }
                extractDocumentContextStub.resolves(documentContextObject)

                await chatController.onChatPrompt(
                    {
                        tabId: mockTabId,
                        prompt: { prompt: 'Hello' },
                        textDocument: { uri: 'file:///test.ts' },
                        cursorState: undefined,
                    },
                    mockCancellationToken
                )

                const calledRequestInput: GenerateAssistantResponseCommandInput =
                    generateAssistantResponseStub.firstCall.firstArg

                assert.strictEqual(
                    calledRequestInput.conversationState?.currentMessage?.userInputMessage?.userInputMessageContext
                        ?.editorState,
                    undefined
                )
            })

            it('leaves editor state as undefined if relative file path is undefined', async () => {
                const documentContextObject = {
                    programmingLanguage: 'typescript',
                    cursorState: [],
                    relativeFilePath: undefined,
                }
                extractDocumentContextStub.resolves(documentContextObject)

                await chatController.onChatPrompt(
                    {
                        tabId: mockTabId,
                        prompt: { prompt: 'Hello' },
                        cursorState: [mockCursorState],
                    },
                    mockCancellationToken
                )

                const calledRequestInput: GenerateAssistantResponseCommandInput =
                    generateAssistantResponseStub.firstCall.firstArg

                assert.strictEqual(
                    calledRequestInput.conversationState?.currentMessage?.userInputMessage?.userInputMessageContext
                        ?.editorState,
                    undefined
                )
            })

            it('parses editor state context and includes as requestInput if both cursor state and text document are found', async () => {
                const documentContextObject = {
                    programmingLanguage: 'typescript',
                    cursorState: [],
                    relativeFilePath: typescriptDocument.uri,
                }
                extractDocumentContextStub.resolves(documentContextObject)

                await chatController.onChatPrompt(
                    {
                        tabId: mockTabId,
                        prompt: { prompt: 'Hello' },
                        textDocument: { uri: 'file:///test.ts' },
                        cursorState: [mockCursorState],
                    },
                    mockCancellationToken
                )

                const calledRequestInput: GenerateAssistantResponseCommandInput =
                    generateAssistantResponseStub.firstCall.firstArg

                assert.deepStrictEqual(
                    calledRequestInput.conversationState?.currentMessage?.userInputMessage?.userInputMessageContext
                        ?.editorState,
                    {
                        cursorState: [],
                        document: {
                            documentSymbols: undefined,
                            programmingLanguage: 'typescript',
                            relativeFilePath: 'file:///test.ts',
                            text: undefined,
                        },
                    }
                )
            })
        })
    })
})
