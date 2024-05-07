import {
    ChatResponseStream,
    CodeWhispererStreaming,
    GenerateAssistantResponseCommandInput,
} from '@amzn/codewhisperer-streaming'
import { ChatResult, ErrorCodes, ResponseError, TextDocument } from '@aws/language-server-runtimes/server-interface'
import { TestFeatures } from '@aws/language-server-runtimes/testing'
import * as assert from 'assert'
import sinon from 'ts-sinon'
import { createIterableResponse } from '../testUtils'
import { ChatController } from './chatController'
import { ChatSessionManagementService } from './chatSessionManagementService'
import { ChatSessionService } from './chatSessionService'
import { DocumentContextExtractor } from './contexts/documentContext'

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

        disposeStub = sinon.stub(ChatSessionService.prototype, 'dispose')

        chatSessionManagementService = ChatSessionManagementService.getInstance().withCredentialsProvider(
            testFeatures.credentialsProvider
        )

        chatController = new ChatController(chatSessionManagementService, testFeatures)
    })

    afterEach(() => {
        generateAssistantResponseStub.restore()
        disposeStub.restore()
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

        const sessionResult = chatSessionManagementService.getSession(mockTabId)

        sinon.assert.match(sessionResult, {
            success: false,
            error: sinon.match.string,
        })
    })

    it('deletes a session by tab id a end chat request is received', () => {
        chatController.onTabAdd({ tabId: mockTabId })

        chatController.onEndChat({ tabId: mockTabId }, mockCancellationToken)

        sinon.assert.calledOnce(disposeStub)

        const sessionResult = chatSessionManagementService.getSession(mockTabId)

        sinon.assert.match(sessionResult, {
            success: false,
            error: sinon.match.string,
        })
    })

    describe('onChatPrompt', () => {
        beforeEach(() => {
            chatController.onTabAdd({ tabId: mockTabId })
        })
        it('throw error if session is not found', async () => {
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

        it('read all the response streams and send progress as partial result is received', async () => {
            const chatResultPromise = chatController.onChatPrompt(
                { tabId: mockTabId, prompt: { prompt: 'Hello' }, partialResultToken: 1 },
                mockCancellationToken
            )

            const chatResult = await chatResultPromise

            sinon.assert.callCount(testFeatures.lsp.sendProgress, mockAssistantResponseList.length)
            assert.deepStrictEqual(chatResult, expectedCompleteChatResult)
        })

        it('returns a ResponseError if request input is not valid', async () => {
            const chatResultPromise = chatController.onChatPrompt(
                { tabId: mockTabId, prompt: {} },
                mockCancellationToken
            )

            const chatResult = await chatResultPromise
            assert.ok(chatResult instanceof ResponseError)
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

            const chatResult = await chatController.onChatPrompt(
                { tabId: mockTabId, prompt: { prompt: 'Hello' } },
                mockCancellationToken
            )

            assert.deepStrictEqual(
                chatResult,
                new ResponseError(ErrorCodes.InternalError, 'invalid state', {
                    ...expectedCompleteChatResult,
                    body: 'Hello World',
                })
            )
        })

        describe('#extractEditorState', () => {
            const typescriptDocument = TextDocument.create('file:///test.ts', 'typescript', 1, 'test')
            let extractEditorStateStub: sinon.SinonStub
            const editorStateObject = {}
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
                extractEditorStateStub = sinon.stub(DocumentContextExtractor.prototype, 'extractEditorState')
                testFeatures.workspace.getTextDocument.resolves(typescriptDocument)
                extractEditorStateStub.resolves(editorStateObject)
            })

            afterEach(() => {
                extractEditorStateStub.restore()
            })

            it('leaves editor state as undefined if cursorState is not passed', async () => {
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

            it('leaves editor state as undefined if document identified is not passed', async () => {
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

                // asserting object reference equality
                assert.strictEqual(
                    calledRequestInput.conversationState?.currentMessage?.userInputMessage?.userInputMessageContext
                        ?.editorState,
                    editorStateObject
                )
            })
        })
    })
})
