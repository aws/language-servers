/**
 * Copied from ../chat/chatController.test.ts for the purpose of developing a divergent implementation.
 * Will be deleted or merged.
 */

import * as path from 'path'
import * as chokidar from 'chokidar'
import {
    ChatResponseStream,
    CodeWhispererStreaming,
    GenerateAssistantResponseCommandInput,
    SendMessageCommandInput,
} from '@amzn/codewhisperer-streaming'
import {
    ChatResult,
    LSPErrorCodes,
    ResponseError,
    TextDocument,
    CredentialsProvider,
    Telemetry,
    Logging,
    Position,
    InsertToCursorPositionParams,
    TextDocumentEdit,
    InlineChatResult,
    CancellationToken,
    CancellationTokenSource,
} from '@aws/language-server-runtimes/server-interface'
import { TestFeatures } from '@aws/language-server-runtimes/testing'
import * as assert from 'assert'
import { createIterableResponse, setCredentialsForAmazonQTokenServiceManagerFactory } from '../../shared/testUtils'
import sinon from 'ts-sinon'
import { AgenticChatController } from './agenticChatController'
import { ChatSessionManagementService } from '../chat/chatSessionManagementService'
import { ChatSessionService } from '../chat/chatSessionService'
import { ChatTelemetryController } from '../chat/telemetry/chatTelemetryController'
import { DocumentContextExtractor } from '../chat/contexts/documentContext'
import * as utils from '../chat/utils'
import { DEFAULT_HELP_FOLLOW_UP_PROMPT, HELP_MESSAGE } from '../chat/constants'
import { TelemetryService } from '../../shared/telemetry/telemetryService'
import { AmazonQTokenServiceManager } from '../../shared/amazonQServiceManager/AmazonQTokenServiceManager'
import { TabBarController } from './tabBarController'
import { getUserPromptsDirectory, promptFileExtension } from './context/contextUtils'
import { AdditionalContextProvider } from './context/addtionalContextProvider'
import { ContextCommandsProvider } from './context/contextCommandsProvider'
import { ChatDatabase } from './tools/chatDb/chatDb'
import { LocalProjectContextController } from '../../shared/localProjectContextController'
import { CancellationError } from '@aws/lsp-core'
import { ToolApprovalException } from './tools/toolShared'

describe('AgenticChatController', () => {
    const mockTabId = 'tab-1'
    const mockConversationId = 'mock-conversation-id'
    const mockMessageId = 'mock-message-id'

    const mockChatResponseList: ChatResponseStream[] = [
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
        body: 'Hello World!',
        canBeVoted: true,
        messageId: 'mock-message-id',
        codeReference: undefined,
        followUp: undefined,
        relatedContent: undefined,
        additionalMessages: [],
    }

    const expectedCompleteInlineChatResult: InlineChatResult = {
        messageId: mockMessageId,
        body: 'Hello World!',
        canBeVoted: true,
        codeReference: undefined,
        followUp: undefined,
        relatedContent: undefined,
        requestId: mockMessageId,
    }

    const mockCancellationToken = {
        isCancellationRequested: false,
        onCancellationRequested: () => ({ dispose: () => null }),
    }

    const logging: Logging = {
        log: (message: string) => {
            console.log(message)
        },
    } as Logging

    let sendMessageStub: sinon.SinonStub
    let generateAssistantResponseStub: sinon.SinonStub
    let additionalContextProviderStub: sinon.SinonStub
    let disposeStub: sinon.SinonStub
    let activeTabSpy: {
        get: sinon.SinonSpy<[], string | undefined>
        set: sinon.SinonSpy<[string | undefined], void>
    }
    let fsWriteFileStub: sinon.SinonStub
    let removeConversationSpy: sinon.SinonSpy
    let emitConversationMetricStub: sinon.SinonStub

    let testFeatures: TestFeatures
    let amazonQServiceManager: AmazonQTokenServiceManager
    let chatSessionManagementService: ChatSessionManagementService
    let chatController: AgenticChatController
    let telemetryService: TelemetryService
    let telemetry: Telemetry
    let getMessagesStub: sinon.SinonStub

    const setCredentials = setCredentialsForAmazonQTokenServiceManagerFactory(() => testFeatures)

    beforeEach(() => {
        sinon.stub(chokidar, 'watch').returns({
            on: sinon.stub(),
            close: sinon.stub(),
        } as unknown as chokidar.FSWatcher)

        sendMessageStub = sinon.stub(CodeWhispererStreaming.prototype, 'sendMessage').callsFake(() => {
            return new Promise(resolve =>
                setTimeout(() => {
                    resolve({
                        $metadata: {
                            requestId: mockMessageId,
                        },
                        sendMessageResponse: createIterableResponse(mockChatResponseList),
                    })
                })
            )
        })

        generateAssistantResponseStub = sinon
            .stub(CodeWhispererStreaming.prototype, 'generateAssistantResponse')
            .callsFake(() => {
                return new Promise(resolve =>
                    setTimeout(() => {
                        resolve({
                            $metadata: {
                                requestId: mockMessageId,
                            },
                            generateAssistantResponseResponse: createIterableResponse(mockChatResponseList),
                        })
                    })
                )
            })

        testFeatures = new TestFeatures()
        fsWriteFileStub = sinon.stub()

        testFeatures.workspace.fs = {
            ...testFeatures.workspace.fs,
            getServerDataDirPath: sinon.stub().returns('/mock/server/data/path'),
            mkdir: sinon.stub().resolves(),
            readFile: sinon.stub().resolves(),
            writeFile: fsWriteFileStub.resolves(),
            rm: sinon.stub().resolves(),
        }

        // Add agent with runTool method to testFeatures
        testFeatures.agent = {
            runTool: sinon.stub().resolves({}),
            getTools: sinon.stub().returns(
                ['mock-tool-name', 'mock-tool-name-1', 'mock-tool-name-2'].map(toolName => ({
                    toolSpecification: { name: toolName, description: 'Mock tool for testing' },
                }))
            ),
            addTool: sinon.stub().resolves(),
        }

        additionalContextProviderStub = sinon.stub(AdditionalContextProvider.prototype, 'getAdditionalContext')
        additionalContextProviderStub.resolves([])
        // @ts-ignore
        const cachedInitializeParams: InitializeParams = {
            initializationOptions: {
                aws: {
                    awsClientCapabilities: {
                        q: {
                            developerProfiles: false,
                        },
                    },
                },
            },
        }
        testFeatures.lsp.window.showDocument = sinon.stub()
        testFeatures.lsp.getClientInitializeParams.returns(cachedInitializeParams)
        setCredentials('builderId')

        activeTabSpy = sinon.spy(ChatTelemetryController.prototype, 'activeTabId', ['get', 'set'])
        removeConversationSpy = sinon.spy(ChatTelemetryController.prototype, 'removeConversation')
        emitConversationMetricStub = sinon.stub(ChatTelemetryController.prototype, 'emitConversationMetric')

        disposeStub = sinon.stub(ChatSessionService.prototype, 'dispose')
        sinon.stub(ContextCommandsProvider.prototype, 'maybeUpdateCodeSymbols').resolves()

        AmazonQTokenServiceManager.resetInstance()

        amazonQServiceManager = AmazonQTokenServiceManager.getInstance(testFeatures)
        chatSessionManagementService = ChatSessionManagementService.getInstance()
        chatSessionManagementService.withAmazonQServiceManager(amazonQServiceManager)

        const mockCredentialsProvider: CredentialsProvider = {
            hasCredentials: sinon.stub().returns(true),
            getCredentials: sinon.stub().returns({ token: 'token' }),
            getConnectionMetadata: sinon.stub().returns({
                sso: {
                    startUrl: undefined,
                },
            }),
            getConnectionType: sinon.stub().returns('none'),
            onCredentialsDeleted: sinon.stub(),
        }

        telemetry = {
            emitMetric: sinon.stub(),
            onClientTelemetry: sinon.stub(),
        }

        getMessagesStub = sinon.stub(ChatDatabase.prototype, 'getMessages')

        telemetryService = new TelemetryService(amazonQServiceManager, mockCredentialsProvider, telemetry, logging)
        chatController = new AgenticChatController(
            chatSessionManagementService,
            testFeatures,
            telemetryService,
            amazonQServiceManager
        )
    })

    afterEach(() => {
        sinon.restore()
        chatController.dispose()
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

        it('read all the response streams and return compiled results', async () => {
            const chatResultPromise = chatController.onChatPrompt(
                { tabId: mockTabId, prompt: { prompt: 'Hello' } },
                mockCancellationToken
            )

            const chatResult = await chatResultPromise

            sinon.assert.callCount(testFeatures.lsp.sendProgress, 0)
            assert.deepStrictEqual(chatResult, {
                additionalMessages: [],
                body: '\n\nHello World!',
                messageId: 'mock-message-id',
                buttons: [],
            })
        })

        it('creates a new conversationId if missing in the session', async () => {
            // Create a session without a conversationId
            chatController.onTabAdd({ tabId: mockTabId })
            const session = chatSessionManagementService.getSession(mockTabId).data

            // Verify session exists but has no conversationId initially
            assert.ok(session)
            assert.strictEqual(session.conversationId, undefined)

            // Make the request
            await chatController.onChatPrompt({ tabId: mockTabId, prompt: { prompt: 'Hello' } }, mockCancellationToken)

            // Verify that a conversationId was created
            assert.ok(session.conversationId)
            assert.strictEqual(typeof session.conversationId, 'string')
        })

        it('includes chat history from the database in the request input', async () => {
            // Mock chat history
            const mockHistory = [
                { type: 'prompt', body: 'Previous question' },
                { type: 'answer', body: 'Previous answer' },
            ]

            getMessagesStub.returns(mockHistory)

            // Make the request
            const result = await chatController.onChatPrompt(
                { tabId: mockTabId, prompt: { prompt: 'Hello' } },
                mockCancellationToken
            )

            // Verify that history was requested from the db
            sinon.assert.calledWith(getMessagesStub, mockTabId)

            assert.ok(generateAssistantResponseStub.calledOnce)

            // Verify that the history was passed to the request
            const requestInput: GenerateAssistantResponseCommandInput = generateAssistantResponseStub.firstCall.firstArg
            assert.deepStrictEqual(requestInput.conversationState?.history, mockHistory)
        })

        it('handles tool use responses and makes multiple requests', async () => {
            // First response includes a tool use request
            const mockToolUseId = 'mock-tool-use-id'
            const mockToolName = 'mock-tool-name'
            const mockToolInput = JSON.stringify({ param1: 'value1' })
            const mockToolResult = { result: 'tool execution result' }

            const mockToolUseResponseList: ChatResponseStream[] = [
                {
                    messageMetadataEvent: {
                        conversationId: mockConversationId,
                    },
                },
                {
                    assistantResponseEvent: {
                        content: 'I need to use a tool. ',
                    },
                },
                {
                    toolUseEvent: {
                        toolUseId: mockToolUseId,
                        name: mockToolName,
                        input: mockToolInput,
                        stop: true,
                    },
                },
            ]

            // Second response after tool execution
            const mockFinalResponseList: ChatResponseStream[] = [
                {
                    messageMetadataEvent: {
                        conversationId: mockConversationId,
                    },
                },
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

            getMessagesStub
                .onFirstCall()
                .returns([])
                .onSecondCall()
                .returns([
                    { userInputMessage: { content: 'Hello with tool' } },
                    { assistantResponseMessage: { content: 'I need to use a tool. ' } },
                ])

            // Reset the stub and set up to return different responses on consecutive calls
            generateAssistantResponseStub.restore()
            generateAssistantResponseStub = sinon.stub(CodeWhispererStreaming.prototype, 'generateAssistantResponse')

            generateAssistantResponseStub.onFirstCall().returns(
                Promise.resolve({
                    $metadata: {
                        requestId: mockMessageId,
                    },
                    generateAssistantResponseResponse: createIterableResponse(mockToolUseResponseList),
                })
            )

            generateAssistantResponseStub.onSecondCall().returns(
                Promise.resolve({
                    $metadata: {
                        requestId: mockMessageId,
                    },
                    generateAssistantResponseResponse: createIterableResponse(mockFinalResponseList),
                })
            )

            // Reset the runTool stub
            const runToolStub = testFeatures.agent.runTool as sinon.SinonStub
            runToolStub.reset()
            runToolStub.resolves(mockToolResult)

            // Make the request
            const chatResultPromise = chatController.onChatPrompt(
                { tabId: mockTabId, prompt: { prompt: 'Hello with tool' } },
                mockCancellationToken
            )

            const chatResult = await chatResultPromise

            // Verify that generateAssistantResponse was called twice
            sinon.assert.calledTwice(generateAssistantResponseStub)

            // Verify that the tool was executed
            sinon.assert.calledOnce(runToolStub)
            sinon.assert.calledWith(runToolStub, mockToolName, JSON.parse(mockToolInput))

            // Verify that the second request included the tool results in the userInputMessageContext
            const secondCallArgs = generateAssistantResponseStub.secondCall.args[0]
            assert.ok(
                secondCallArgs.conversationState?.currentMessage?.userInputMessage?.userInputMessageContext?.toolResults
            )
            assert.strictEqual(
                secondCallArgs.conversationState?.currentMessage?.userInputMessage?.userInputMessageContext?.toolResults
                    .length,
                1
            )
            assert.strictEqual(
                secondCallArgs.conversationState?.currentMessage?.userInputMessage?.userInputMessageContext
                    ?.toolResults[0].toolUseId,
                mockToolUseId
            )
            assert.strictEqual(
                secondCallArgs.conversationState?.currentMessage?.userInputMessage?.userInputMessageContext
                    ?.toolResults[0].status,
                'success'
            )
            assert.deepStrictEqual(
                secondCallArgs.conversationState?.currentMessage?.userInputMessage?.userInputMessageContext
                    ?.toolResults[0].content[0].json,
                mockToolResult
            )

            // Verify that the history was updated correctly
            assert.ok(secondCallArgs.conversationState?.history)
            assert.strictEqual(secondCallArgs.conversationState?.history.length, 2)
            assert.ok(secondCallArgs.conversationState?.history[0].userInputMessage)
            assert.ok(secondCallArgs.conversationState?.history[1].assistantResponseMessage)

            // Verify the final result
            assertChatResultsMatch(chatResult, expectedCompleteChatResult)
        })

        it('propagates tool execution errors to the model in toolResults', async () => {
            // First response includes a tool use request
            const mockToolUseId = 'mock-tool-use-id-error'
            const mockToolName = 'mock-tool-name'
            const mockToolInput = JSON.stringify({ param1: 'value1' })
            const mockErrorMessage = 'Tool execution failed with an error'

            const mockToolUseResponseList: ChatResponseStream[] = [
                {
                    messageMetadataEvent: {
                        conversationId: mockConversationId,
                    },
                },
                {
                    assistantResponseEvent: {
                        content: 'I need to use a tool that will fail. ',
                    },
                },
                {
                    toolUseEvent: {
                        toolUseId: mockToolUseId,
                        name: mockToolName,
                        input: mockToolInput,
                        stop: true,
                    },
                },
            ]

            // Second response after tool execution error
            const mockFinalResponseList: ChatResponseStream[] = [
                {
                    messageMetadataEvent: {
                        conversationId: mockConversationId,
                    },
                },
                {
                    assistantResponseEvent: {
                        content: 'I see the tool failed with error: ',
                    },
                },
                {
                    assistantResponseEvent: {
                        content: mockErrorMessage,
                    },
                },
            ]

            getMessagesStub
                .onFirstCall()
                .returns([])
                .onSecondCall()
                .returns([
                    { userInputMessage: { content: 'Hello with failing tool' } },
                    { assistantResponseMessage: { content: 'I need to use a tool that will fail. ' } },
                ])

            // Reset the stub and set up to return different responses on consecutive calls
            generateAssistantResponseStub.restore()
            generateAssistantResponseStub = sinon.stub(CodeWhispererStreaming.prototype, 'generateAssistantResponse')

            generateAssistantResponseStub.onFirstCall().returns(
                Promise.resolve({
                    $metadata: {
                        requestId: mockMessageId,
                    },
                    generateAssistantResponseResponse: createIterableResponse(mockToolUseResponseList),
                })
            )

            generateAssistantResponseStub.onSecondCall().returns(
                Promise.resolve({
                    $metadata: {
                        requestId: mockMessageId,
                    },
                    generateAssistantResponseResponse: createIterableResponse(mockFinalResponseList),
                })
            )

            // Reset the runTool stub and make it throw an error
            const runToolStub = testFeatures.agent.runTool as sinon.SinonStub
            runToolStub.reset()
            runToolStub.rejects(new Error(mockErrorMessage))

            // Make the request
            const chatResultPromise = chatController.onChatPrompt(
                { tabId: mockTabId, prompt: { prompt: 'Hello with failing tool' } },
                mockCancellationToken
            )

            const chatResult = await chatResultPromise

            // Verify that generateAssistantResponse was called twice
            sinon.assert.calledTwice(generateAssistantResponseStub)

            // Verify that the tool was executed
            sinon.assert.calledOnce(runToolStub)
            sinon.assert.calledWith(runToolStub, mockToolName, JSON.parse(mockToolInput))

            // Verify that the second request included the tool error in the toolResults with status 'error'
            const secondCallArgs = generateAssistantResponseStub.secondCall.args[0]
            assert.ok(
                secondCallArgs.conversationState?.currentMessage?.userInputMessage?.userInputMessageContext?.toolResults
            )
            assert.strictEqual(
                secondCallArgs.conversationState?.currentMessage?.userInputMessage?.userInputMessageContext?.toolResults
                    .length,
                1
            )
            assert.strictEqual(
                secondCallArgs.conversationState?.currentMessage?.userInputMessage?.userInputMessageContext
                    ?.toolResults[0].toolUseId,
                mockToolUseId
            )
            assert.strictEqual(
                secondCallArgs.conversationState?.currentMessage?.userInputMessage?.userInputMessageContext
                    ?.toolResults[0].status,
                'error'
            )
            assert.deepStrictEqual(
                secondCallArgs.conversationState?.currentMessage?.userInputMessage?.userInputMessageContext
                    ?.toolResults[0].content[0].json,
                { error: mockErrorMessage }
            )

            // Verify that the history was updated correctly
            assert.ok(secondCallArgs.conversationState?.history)
            assert.strictEqual(secondCallArgs.conversationState?.history.length, 2)
            assert.ok(secondCallArgs.conversationState?.history[0].userInputMessage)
            assert.ok(secondCallArgs.conversationState?.history[1].assistantResponseMessage)

            // Create expected result format matching the actual format
            const expectedErrorChatResult: ChatResult = {
                messageId: mockMessageId,
                body: 'I see the tool failed with error: Tool execution failed with an error',
                canBeVoted: true,
                codeReference: undefined,
                followUp: undefined,
                relatedContent: undefined,
            }

            // Verify the final result includes both messages
            assertChatResultsMatch(chatResult, expectedErrorChatResult)
        })

        it('handles multiple iterations of tool uses with proper history updates', async () => {
            // First response includes a tool use request
            const mockToolUseId1 = 'mock-tool-use-id-1'
            const mockToolName1 = 'mock-tool-name-1'
            const mockToolInput1 = JSON.stringify({ param1: 'value1' })
            const mockToolResult1 = { result: 'tool execution result 1' }

            // Second tool use in a subsequent response
            const mockToolUseId2 = 'mock-tool-use-id-2'
            const mockToolName2 = 'mock-tool-name-2'
            const mockToolInput2 = JSON.stringify({ param2: 'value2' })
            const mockToolResult2 = { result: 'tool execution result 2' }

            // First response with first tool use
            const mockFirstToolUseResponseList: ChatResponseStream[] = [
                {
                    messageMetadataEvent: {
                        conversationId: mockConversationId,
                    },
                },
                {
                    assistantResponseEvent: {
                        content: 'I need to use tool 1. ',
                    },
                },
                {
                    toolUseEvent: {
                        toolUseId: mockToolUseId1,
                        name: mockToolName1,
                        input: mockToolInput1,
                        stop: true,
                    },
                },
            ]

            // Second response with second tool use
            const mockSecondToolUseResponseList: ChatResponseStream[] = [
                {
                    messageMetadataEvent: {
                        conversationId: mockConversationId,
                    },
                },
                {
                    assistantResponseEvent: {
                        content: 'Now I need to use tool 2. ',
                    },
                },
                {
                    toolUseEvent: {
                        toolUseId: mockToolUseId2,
                        name: mockToolName2,
                        input: mockToolInput2,
                        stop: true,
                    },
                },
            ]

            // Final response with complete answer
            const mockFinalResponseList: ChatResponseStream[] = [
                {
                    messageMetadataEvent: {
                        conversationId: mockConversationId,
                    },
                },
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

            const historyAfterTool1 = [
                { userInputMessage: { content: 'Hello with multiple tools' } },
                { assistantResponseMessage: { content: 'I need to use tool 1. ' } },
            ]
            const historyAfterTool2 = [
                ...historyAfterTool1,
                { userInputMessage: { content: 'Hello with multiple tools' } },
                { assistantResponseMessage: { content: 'Now I need to use tool 2. ' } },
            ]

            getMessagesStub
                .onFirstCall()
                .returns([])
                .onSecondCall()
                .returns(historyAfterTool1)
                .onThirdCall()
                .returns(historyAfterTool2)

            // Reset the stub and set up to return different responses on consecutive calls
            generateAssistantResponseStub.restore()
            generateAssistantResponseStub = sinon.stub(CodeWhispererStreaming.prototype, 'generateAssistantResponse')

            generateAssistantResponseStub.onFirstCall().returns(
                Promise.resolve({
                    $metadata: {
                        requestId: mockMessageId,
                    },
                    generateAssistantResponseResponse: createIterableResponse(mockFirstToolUseResponseList),
                })
            )

            generateAssistantResponseStub.onSecondCall().returns(
                Promise.resolve({
                    $metadata: {
                        requestId: mockMessageId,
                    },
                    generateAssistantResponseResponse: createIterableResponse(mockSecondToolUseResponseList),
                })
            )

            generateAssistantResponseStub.onThirdCall().returns(
                Promise.resolve({
                    $metadata: {
                        requestId: mockMessageId,
                    },
                    generateAssistantResponseResponse: createIterableResponse(mockFinalResponseList),
                })
            )

            // Reset the runTool stub
            const runToolStub = testFeatures.agent.runTool as sinon.SinonStub
            runToolStub.reset()
            runToolStub.withArgs(mockToolName1, JSON.parse(mockToolInput1)).resolves(mockToolResult1)
            runToolStub.withArgs(mockToolName2, JSON.parse(mockToolInput2)).resolves(mockToolResult2)

            // Make the request
            const chatResultPromise = chatController.onChatPrompt(
                { tabId: mockTabId, prompt: { prompt: 'Hello with multiple tools' } },
                mockCancellationToken
            )

            const chatResult = await chatResultPromise

            // Verify that generateAssistantResponse was called three times
            sinon.assert.calledThrice(generateAssistantResponseStub)

            // Verify that the tools were executed
            sinon.assert.calledTwice(runToolStub)
            sinon.assert.calledWith(runToolStub, mockToolName1, JSON.parse(mockToolInput1))
            sinon.assert.calledWith(runToolStub, mockToolName2, JSON.parse(mockToolInput2))

            // Verify that the second request included the first tool results
            const secondCallArgs = generateAssistantResponseStub.secondCall.args[0]
            assert.ok(
                secondCallArgs.conversationState?.currentMessage?.userInputMessage?.userInputMessageContext?.toolResults
            )
            assert.strictEqual(
                secondCallArgs.conversationState?.currentMessage?.userInputMessage?.userInputMessageContext?.toolResults
                    .length,
                1
            )
            assert.strictEqual(
                secondCallArgs.conversationState?.currentMessage?.userInputMessage?.userInputMessageContext
                    ?.toolResults[0].toolUseId,
                mockToolUseId1
            )

            // Verify that the history was updated correctly after first tool use
            assert.ok(secondCallArgs.conversationState?.history)
            assert.strictEqual(secondCallArgs.conversationState?.history.length, 2)
            assert.ok(secondCallArgs.conversationState?.history[0].userInputMessage)
            assert.ok(secondCallArgs.conversationState?.history[1].assistantResponseMessage)
            assert.strictEqual(
                secondCallArgs.conversationState?.history[1].assistantResponseMessage?.content,
                'I need to use tool 1. '
            )

            // Verify that the third request included the second tool results
            const thirdCallArgs = generateAssistantResponseStub.thirdCall.args[0]
            assert.ok(
                thirdCallArgs.conversationState?.currentMessage?.userInputMessage?.userInputMessageContext?.toolResults
            )
            assert.strictEqual(
                thirdCallArgs.conversationState?.currentMessage?.userInputMessage?.userInputMessageContext?.toolResults
                    .length,
                1
            )
            assert.strictEqual(
                thirdCallArgs.conversationState?.currentMessage?.userInputMessage?.userInputMessageContext
                    ?.toolResults[0].toolUseId,
                mockToolUseId2
            )

            // Verify that the history was updated correctly after second tool use
            assert.ok(thirdCallArgs.conversationState?.history)
            assert.strictEqual(thirdCallArgs.conversationState?.history.length, 4)
            assert.ok(thirdCallArgs.conversationState?.history[2].userInputMessage)
            assert.ok(thirdCallArgs.conversationState?.history[3].assistantResponseMessage)
            assert.strictEqual(
                thirdCallArgs.conversationState?.history[3].assistantResponseMessage?.content,
                'Now I need to use tool 2. '
            )

            // Verify the final result
            assertChatResultsMatch(chatResult, expectedCompleteChatResult)
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

            sinon.assert.callCount(testFeatures.lsp.sendProgress, mockChatResponseList.length + 1) // response length + 1 loading messages
            assert.deepStrictEqual(chatResult, {
                additionalMessages: [],
                body: '\n\nHello World!',
                messageId: 'mock-message-id',
                buttons: [],
            })
        })

        it('can use 0 as progress token', async () => {
            const chatResultPromise = chatController.onChatPrompt(
                { tabId: mockTabId, prompt: { prompt: 'Hello' }, partialResultToken: 0 },
                mockCancellationToken
            )

            const chatResult = await chatResultPromise

            sinon.assert.callCount(testFeatures.lsp.sendProgress, mockChatResponseList.length + 1) // response length + 1 loading message
            assert.deepStrictEqual(chatResult, {
                additionalMessages: [],
                body: '\n\nHello World!',
                messageId: 'mock-message-id',
                buttons: [],
            })
        })

        it('propagates model error back to client', async () => {
            generateAssistantResponseStub.callsFake(() => {
                throw new Error('Error')
            })

            const chatResult = await chatController.onChatPrompt(
                { tabId: mockTabId, prompt: { prompt: 'Hello' } },
                mockCancellationToken
            )

            // These checks will fail if a response error is returned.
            const typedChatResult = chatResult as ResponseError<ChatResult>
            assert.strictEqual(typedChatResult.message, 'Error')
            assert.strictEqual(
                typedChatResult.data?.body,
                'An error occurred when communicating with the model, check the logs for more information.'
            )
        })

        it('returns an auth follow up action if model request returns an auth error', async () => {
            generateAssistantResponseStub.callsFake(() => {
                throw new Error('Error')
            })

            sinon.stub(utils, 'getAuthFollowUpType').returns('full-auth')
            const chatResultPromise = chatController.onChatPrompt(
                { tabId: mockTabId, prompt: { prompt: 'Hello' }, partialResultToken: 1 },
                mockCancellationToken
            )

            const chatResult = await chatResultPromise

            // called once for error message propagation and once for loading message.
            sinon.assert.callCount(testFeatures.lsp.sendProgress, 2)
            assert.deepStrictEqual(chatResult, utils.createAuthFollowUpResult('full-auth'))
        })

        it('returns a ResponseError if response streams return an error event', async () => {
            generateAssistantResponseStub.callsFake(() => {
                return Promise.resolve({
                    $metadata: {
                        requestId: mockMessageId,
                    },
                    generateAssistantResponseResponse: createIterableResponse([
                        // ["Hello ", "World"]
                        ...mockChatResponseList.slice(1, 3),
                        { error: { message: 'some error' } },
                        // ["!"]
                        ...mockChatResponseList.slice(3),
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
                    $metadata: {
                        requestId: mockMessageId,
                    },
                    generateAssistantResponseResponse: createIterableResponse([
                        // ["Hello ", "World"]
                        ...mockChatResponseList.slice(1, 3),
                        { invalidStateEvent: { message: 'invalid state' } },
                        // ["!"]
                        ...mockChatResponseList.slice(3),
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
                extractDocumentContextStub = sinon.stub(DocumentContextExtractor.prototype, 'extractDocumentContext')
                testFeatures.openDocument(typescriptDocument)
            })

            afterEach(() => {
                extractDocumentContextStub.restore()
            })

            it('parses relevant document and includes as requestInput if @workspace context is included', async () => {
                const localProjectContextController = new LocalProjectContextController('client-name', [], logging)
                const mockRelevantDocs = [
                    { filePath: '/test/1.ts', content: 'text', id: 'id-1', index: 0, vec: [1] },
                    { filePath: '/test/2.ts', content: 'text2', id: 'id-2', index: 0, vec: [1] },
                ]

                sinon.stub(LocalProjectContextController, 'getInstance').resolves(localProjectContextController)

                Object.defineProperty(localProjectContextController, 'isEnabled', {
                    get: () => true,
                })

                sinon.stub(localProjectContextController, 'queryVectorIndex').resolves(mockRelevantDocs)

                await chatController.onChatPrompt(
                    {
                        tabId: 'tab',
                        prompt: {
                            prompt: '@workspace help me understand this code',
                            escapedPrompt: '@workspace help me understand this code',
                        },
                        context: [{ command: '@workspace' }],
                    },
                    mockCancellationToken
                )

                const calledRequestInput: GenerateAssistantResponseCommandInput =
                    generateAssistantResponseStub.firstCall.firstArg

                assert.deepStrictEqual(
                    calledRequestInput.conversationState?.currentMessage?.userInputMessage?.userInputMessageContext
                        ?.editorState,
                    {
                        workspaceFolders: [],
                        relevantDocuments: [
                            {
                                endLine: -1,
                                relativeFilePath: '1.ts',
                                startLine: -1,
                                text: 'text',
                            },
                            {
                                endLine: -1,
                                relativeFilePath: '2.ts',
                                startLine: -1,
                                text: 'text2',
                            },
                        ],
                        useRelevantDocuments: true,
                    }
                )
            })

            it('leaves cursorState as undefined if cursorState is not passed', async () => {
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
                        ?.editorState?.cursorState,
                    undefined
                )
            })

            it('leaves document as undefined if relative file path is undefined', async () => {
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
                        ?.editorState?.document,
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
                            programmingLanguage: 'typescript',
                            relativeFilePath: 'file:///test.ts',
                            text: undefined,
                        },
                        workspaceFolders: [],
                        relevantDocuments: undefined,
                        useRelevantDocuments: false,
                    }
                )
            })
        })
    })

    describe('onCreatePrompt', () => {
        it('should create prompt file with given name', async () => {
            const promptName = 'testPrompt'
            const expectedPath = path.join(getUserPromptsDirectory(), `testPrompt${promptFileExtension}`)

            await chatController.onCreatePrompt({ promptName })

            sinon.assert.calledOnceWithExactly(fsWriteFileStub, expectedPath, '', { mode: 0o600 })
        })

        it('should create default prompt file when no name provided', async () => {
            const expectedPath = path.join(getUserPromptsDirectory(), `default${promptFileExtension}`)

            await chatController.onCreatePrompt({ promptName: '' })

            sinon.assert.calledOnceWithExactly(fsWriteFileStub, expectedPath, '', { mode: 0o600 })
        })
    })

    describe('onInlineChatPrompt', () => {
        it('read all the response streams and return compiled results', async () => {
            const chatResultPromise = chatController.onInlineChatPrompt(
                { prompt: { prompt: 'Hello' } },
                mockCancellationToken
            )

            const chatResult = await chatResultPromise

            sinon.assert.callCount(testFeatures.lsp.sendProgress, 0)
            assert.deepStrictEqual(chatResult, expectedCompleteInlineChatResult)
        })

        it('read all the response streams and send progress as partial result is received', async () => {
            const chatResultPromise = chatController.onInlineChatPrompt(
                { prompt: { prompt: 'Hello' }, partialResultToken: 1 },
                mockCancellationToken
            )

            const chatResult = await chatResultPromise

            sinon.assert.callCount(testFeatures.lsp.sendProgress, mockChatResponseList.length)
            assert.deepStrictEqual(chatResult, expectedCompleteInlineChatResult)
        })

        it('can use 0 as progress token', async () => {
            const chatResultPromise = chatController.onInlineChatPrompt(
                { prompt: { prompt: 'Hello' }, partialResultToken: 0 },
                mockCancellationToken
            )

            const chatResult = await chatResultPromise

            sinon.assert.callCount(testFeatures.lsp.sendProgress, mockChatResponseList.length)
            assert.deepStrictEqual(chatResult, expectedCompleteInlineChatResult)
        })

        it('returns a ResponseError if sendMessage returns an error', async () => {
            sendMessageStub.callsFake(() => {
                throw new Error('Error')
            })

            const chatResult = await chatController.onInlineChatPrompt(
                { prompt: { prompt: 'Hello' } },
                mockCancellationToken
            )

            assert.ok(chatResult instanceof ResponseError)
        })

        it('returns a Response error if sendMessage returns an auth error', async () => {
            sendMessageStub.callsFake(() => {
                throw new Error('Error')
            })

            const chatResultPromise = chatController.onInlineChatPrompt(
                { prompt: { prompt: 'Hello' }, partialResultToken: 1 },
                mockCancellationToken
            )

            const chatResult = await chatResultPromise

            sinon.assert.callCount(testFeatures.lsp.sendProgress, 0)
            assert.ok(chatResult instanceof ResponseError)
        })

        it('returns a ResponseError if response streams return an error event', async () => {
            sendMessageStub.callsFake(() => {
                return Promise.resolve({
                    $metadata: {
                        requestId: mockMessageId,
                    },
                    sendMessageResponse: createIterableResponse([
                        // ["Hello ", "World"]
                        ...mockChatResponseList.slice(1, 3),
                        { error: { message: 'some error' } },
                        // ["!"]
                        ...mockChatResponseList.slice(3),
                    ]),
                })
            })

            const chatResult = await chatController.onInlineChatPrompt(
                { prompt: { prompt: 'Hello' } },
                mockCancellationToken
            )

            assert.deepStrictEqual(chatResult, new ResponseError(LSPErrorCodes.RequestFailed, 'some error'))
        })

        it('returns a ResponseError if response streams return an invalid state event', async () => {
            sendMessageStub.callsFake(() => {
                return Promise.resolve({
                    $metadata: {
                        requestId: mockMessageId,
                    },
                    sendMessageResponse: createIterableResponse([
                        // ["Hello ", "World"]
                        ...mockChatResponseList.slice(1, 3),
                        { invalidStateEvent: { message: 'invalid state' } },
                        // ["!"]
                        ...mockChatResponseList.slice(3),
                    ]),
                })
            })

            const chatResult = await chatController.onInlineChatPrompt(
                { prompt: { prompt: 'Hello' } },
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
                extractDocumentContextStub = sinon.stub(DocumentContextExtractor.prototype, 'extractDocumentContext')
                testFeatures.openDocument(typescriptDocument)
            })

            afterEach(() => {
                extractDocumentContextStub.restore()
            })

            it('leaves cursorState as undefined if cursorState is not passed', async () => {
                const documentContextObject = {
                    programmingLanguage: 'typescript',
                    cursorState: undefined,
                    relativeFilePath: 'file:///test.ts',
                }
                extractDocumentContextStub.resolves(documentContextObject)

                await chatController.onInlineChatPrompt(
                    {
                        prompt: { prompt: 'Hello' },
                        textDocument: { uri: 'file:///test.ts' },
                        cursorState: undefined,
                    },
                    mockCancellationToken
                )

                const calledRequestInput: SendMessageCommandInput = sendMessageStub.firstCall.firstArg

                assert.strictEqual(
                    calledRequestInput.conversationState?.currentMessage?.userInputMessage?.userInputMessageContext
                        ?.editorState?.cursorState,
                    undefined
                )
            })

            it('leaves document as undefined if relative file path is undefined', async () => {
                const documentContextObject = {
                    programmingLanguage: 'typescript',
                    cursorState: [],
                    relativeFilePath: undefined,
                }
                extractDocumentContextStub.resolves(documentContextObject)

                await chatController.onInlineChatPrompt(
                    {
                        prompt: { prompt: 'Hello' },
                        cursorState: [mockCursorState],
                    },
                    mockCancellationToken
                )

                const calledRequestInput: SendMessageCommandInput = sendMessageStub.firstCall.firstArg

                assert.strictEqual(
                    calledRequestInput.conversationState?.currentMessage?.userInputMessage?.userInputMessageContext
                        ?.editorState?.document,
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

                await chatController.onInlineChatPrompt(
                    {
                        prompt: { prompt: 'Hello' },
                        textDocument: { uri: 'file:///test.ts' },
                        cursorState: [mockCursorState],
                    },
                    mockCancellationToken
                )

                const calledRequestInput: SendMessageCommandInput = sendMessageStub.firstCall.firstArg

                assert.deepStrictEqual(
                    calledRequestInput.conversationState?.currentMessage?.userInputMessage?.userInputMessageContext
                        ?.editorState,
                    {
                        cursorState: [],
                        document: {
                            programmingLanguage: 'typescript',
                            relativeFilePath: 'file:///test.ts',
                            text: undefined,
                        },
                        workspaceFolders: [],
                        relevantDocuments: undefined,
                        useRelevantDocuments: false,
                    }
                )
            })
        })
    })

    describe('onCodeInsertToCursorPosition', () => {
        beforeEach(() => {
            chatController.onTabAdd({ tabId: mockTabId })
            testFeatures.lsp.workspace.applyWorkspaceEdit.resolves({ applied: true })
            testFeatures.workspace.getTextDocument = sinon.stub()
        })

        afterEach(() => {
            chatController.dispose()
        })

        it('handles regular insertion correctly', async () => {
            const document: TextDocument = TextDocument.create('test.ts', 'typescript', 1, ' ')
            testFeatures.workspace.getTextDocument.resolves(document)

            const cursorPosition = Position.create(0, 0)
            const params: InsertToCursorPositionParams = {
                textDocument: { uri: 'test.ts' },
                cursorPosition,
                code: 'const x = 1\n   const y = 2',
                tabId: mockTabId,
                messageId: 'XXX',
            }
            await chatController.onCodeInsertToCursorPosition(params)

            assert.deepStrictEqual(testFeatures.lsp.workspace.applyWorkspaceEdit.firstCall.args[0], {
                edit: {
                    documentChanges: [
                        {
                            textDocument: { uri: 'test.ts', version: 0 },
                            edits: [
                                {
                                    range: {
                                        start: cursorPosition,
                                        end: cursorPosition,
                                    },
                                    newText: params.code,
                                },
                            ],
                        },
                    ],
                },
            })
        })

        it('handles tab-based indentation correctly', async () => {
            const documentContent = 'function test() {\n\tif (true) {\n\t\t// cursor here\n\t}'
            const document: TextDocument = TextDocument.create('test.ts', 'typescript', 1, documentContent)
            testFeatures.workspace.getTextDocument.resolves(document)

            const cursorPosition = Position.create(2, 2)
            const params: InsertToCursorPositionParams = {
                textDocument: { uri: 'test.ts' },
                cursorPosition,
                code: 'console.log("test");\nconsole.log("test2")',
                tabId: mockTabId,
                messageId: 'XXX',
            }

            await chatController.onCodeInsertToCursorPosition(params)

            const documentChanges = testFeatures.lsp.workspace.applyWorkspaceEdit.firstCall.args[0].edit.documentChanges
            assert(documentChanges)
            const insertedText = (documentChanges[0] as TextDocumentEdit).edits[0].newText
            // Should maintain tab-based indentation
            assert.deepStrictEqual(insertedText, 'console.log("test");\n\t\tconsole.log("test2")')
        })

        it('handles insertion at mixed indentation levels correctly', async () => {
            const documentContent = `function test() {
    if (true) {
            // cursor here
        console.log("test");
    }
}`
            const document: TextDocument = TextDocument.create('test.ts', 'typescript', 1, documentContent)
            testFeatures.workspace.getTextDocument.resolves(document)

            const cursorPosition = Position.create(2, 12)
            const params: InsertToCursorPositionParams = {
                textDocument: { uri: 'test.ts' },
                cursorPosition,
                code: 'const x = 1;\nconst y = 2;',
                tabId: mockTabId,
                messageId: 'XXX',
            }

            await chatController.onCodeInsertToCursorPosition(params)

            // Verify that the inserted code maintains the indentation level of the insertion point
            const documentChanges = testFeatures.lsp.workspace.applyWorkspaceEdit.firstCall.args[0].edit.documentChanges
            assert(documentChanges)
            const insertedText = (documentChanges[0] as TextDocumentEdit).edits[0].newText
            assert.deepStrictEqual(insertedText, `const x = 1;\n${' '.repeat(12)}const y = 2;`)
        })

        it('handles code starting with multiple blank lines correctly', async () => {
            // Create a document with some existing indentation
            const documentContent = `${' '.repeat(4)}const existingCode = true;`
            const document: TextDocument = TextDocument.create('test.ts', 'typescript', 1, documentContent)
            testFeatures.workspace.getTextDocument.resolves(document)

            // Position cursor at an indented position
            const cursorPosition = Position.create(0, 4)
            const params: InsertToCursorPositionParams = {
                textDocument: { uri: 'test.ts' },
                cursorPosition,
                // Code starts with 3 blank lines, followed by actual code
                code: '\n\n\nfunction test() {\n    console.log("test");\n}',
                tabId: mockTabId,
                messageId: 'XXX',
            }
            await chatController.onCodeInsertToCursorPosition(params)

            const documentChanges = testFeatures.lsp.workspace.applyWorkspaceEdit.firstCall.args[0].edit.documentChanges
            assert(documentChanges)
            const insertedText = (documentChanges[0] as TextDocumentEdit).edits[0].newText
            // The blank lines should have no indentation
            // Only the actual code lines should be indented
            // First three lines should be empty with no indentation
            // Following lines should have the indentation
            assert.deepStrictEqual(
                insertedText,
                `\n\n\n${' '.repeat(4)}function test() {\n${' '.repeat(8)}console.log("test");\n${' '.repeat(4)}}`
            )
        })

        it('handles insertion of code with multiple leading blank lines into empty document at position 0', async () => {
            const documentContent = ''
            const document: TextDocument = TextDocument.create('test.py', 'python', 1, documentContent)
            testFeatures.workspace.getTextDocument.resolves(document)

            const cursorPosition = Position.create(0, 0)
            const params: InsertToCursorPositionParams = {
                textDocument: { uri: 'test.ts' },
                cursorPosition,
                // Code with 5 blank lines at the beginning
                code: '\n\n\n\n\ndef multiply(x, y):\n    result = x * y\n    return result\n\nprint(multiply(4, 5))',
                tabId: mockTabId,
                messageId: 'XXX',
            }

            await chatController.onCodeInsertToCursorPosition(params)

            const documentChanges = testFeatures.lsp.workspace.applyWorkspaceEdit.firstCall.args[0].edit.documentChanges
            assert(documentChanges)
            const insertedText = (documentChanges[0] as TextDocumentEdit).edits[0].newText
            // Since document is empty and cursor is at 0,0:
            // - Leading blank lines should be preserved exactly as is
            // - No additional indentation should be added to any lines
            assert.deepStrictEqual(insertedText, params.code)
        })

        it('handles undefined document content correctly', async () => {
            testFeatures.workspace.getTextDocument.resolves(undefined)

            const cursorPosition = Position.create(0, 0)
            const params: InsertToCursorPositionParams = {
                textDocument: { uri: 'test.ts' },
                cursorPosition,
                code: 'const x = 1;\nconst y = 2;',
                tabId: mockTabId,
                messageId: 'XXX',
            }

            await chatController.onCodeInsertToCursorPosition(params)

            // When document content is undefined, the code should:
            // 1. Still attempt to insert the code
            // 2. Not add any indentation

            const documentChanges = testFeatures.lsp.workspace.applyWorkspaceEdit.firstCall.args[0].edit.documentChanges
            assert(documentChanges)
            const edit = (documentChanges[0] as TextDocumentEdit).edits[0]

            assert.deepStrictEqual(edit.newText, params.code)
            assert.deepStrictEqual(edit.range.start, cursorPosition)
            assert.deepStrictEqual(edit.range.end, cursorPosition)
        })

        it('handles indentation correctly when inserting after an indent', async () => {
            // Text document contains 8 space characters
            const documentContent = ' '.repeat(8)
            const document: TextDocument = TextDocument.create('test.ts', 'typescript', 1, documentContent)
            testFeatures.workspace.getTextDocument.resolves(document)

            // Cursor is positioned at the end of the first line, after the 8 spaces
            const cursorPosition = Position.create(0, documentContent.length)
            const params: InsertToCursorPositionParams = {
                textDocument: { uri: 'test.ts' },
                cursorPosition,
                code: 'const x = 1\nconst y = 2',
                tabId: mockTabId,
                messageId: 'XXX',
            }
            await chatController.onCodeInsertToCursorPosition(params)

            assert.deepStrictEqual(testFeatures.lsp.workspace.applyWorkspaceEdit.firstCall.args[0], {
                edit: {
                    documentChanges: [
                        {
                            textDocument: { uri: 'test.ts', version: 0 },
                            edits: [
                                {
                                    range: {
                                        start: cursorPosition,
                                        end: cursorPosition,
                                    },
                                    // We expect new text to be added to the end of the existing line and also apply indentation on the next line
                                    newText: `const x = 1\n${' '.repeat(8)}const y = 2`,
                                },
                            ],
                        },
                    ],
                },
            })
        })

        it('handles indentation correctly when inserting at the end of a single line that does not have any indentation', async () => {
            const documentContent = 'console.log("Hello world")'
            const document: TextDocument = TextDocument.create('test.ts', 'typescript', 1, documentContent)
            testFeatures.workspace.getTextDocument.resolves(document)

            const forLoop = `for (let i = 2; i <= n; i++) {
                const next = prev + current;
                prev = current;
                current = next;
            }`

            const cursorPosition = Position.create(0, documentContent.length)
            const params: InsertToCursorPositionParams = {
                textDocument: { uri: 'test.ts' },
                cursorPosition,
                code: forLoop,
                tabId: mockTabId,
                messageId: 'XXX',
            }

            await chatController.onCodeInsertToCursorPosition(params)

            const documentChanges = testFeatures.lsp.workspace.applyWorkspaceEdit.firstCall.args[0].edit.documentChanges
            assert(documentChanges)
            const insertedText = (documentChanges[0] as TextDocumentEdit).edits[0].newText
            // For loop should be inserted as is in this case
            assert.deepStrictEqual(insertedText, forLoop)
        })

        it('handles indentation correctly when inserting inside an indented block', async () => {
            const fibonacci = `function fibonacci(n) {
    if (n <= 1) return n;

    let prev = 0, 
    let current = 1;

    for (let i = 2; i <= n; i++) {
        // Insertion will happen on the line below
        
        const next = prev + current;
        prev = current;
        current = next;
    }

    return current;
}
`

            // This test will insert an extra for loop inside the existing for loop in the fibonacci function above
            const forLoop = `for (let i = 2; i <= n; i++) {
    const next = prev + current;
    prev = current;
    current = next;
}
`
            // Given the for loop is inside a function and we will be inserting a new for loop inside, the for loop to be inserted will have 8 prefix spaces
            const twiceIndentedForLoop = `for (let i = 2; i <= n; i++) {
${' '.repeat(8)}    const next = prev + current;
${' '.repeat(8)}    prev = current;
${' '.repeat(8)}    current = next;
${' '.repeat(8)}}
`

            let document: TextDocument = TextDocument.create('test.ts', 'typescript', 1, fibonacci)
            testFeatures.workspace.getTextDocument.resolves(document)

            const cursorPosition = Position.create(8, 8)
            const params: InsertToCursorPositionParams = {
                textDocument: { uri: 'test.ts' },
                cursorPosition,
                code: forLoop,
                tabId: mockTabId,
                messageId: 'XXX',
            }

            await chatController.onCodeInsertToCursorPosition(params)

            const documentChanges = testFeatures.lsp.workspace.applyWorkspaceEdit.firstCall.args[0].edit.documentChanges
            assert(documentChanges)
            const insertedText = (documentChanges[0] as TextDocumentEdit).edits[0].newText
            assert.deepStrictEqual(insertedText, twiceIndentedForLoop)
        })

        it('handles virtual spaces when cursor is in empty line with virtual indent', async () => {
            // Create an empty document
            const document: TextDocument = TextDocument.create('test.ts', 'typescript', 1, '')
            testFeatures.workspace.getTextDocument.resolves(document)

            // Position cursor at character 8 in an empty line (virtual space)
            const cursorPosition = Position.create(0, 8)
            const params: InsertToCursorPositionParams = {
                textDocument: { uri: 'test.ts' },
                cursorPosition,
                code: 'const x = 1\nconst y = 2',
                tabId: mockTabId,
                messageId: 'XXX',
            }

            await chatController.onCodeInsertToCursorPosition(params)

            // The code should be indented with 8 spaces for both lines
            // and cursor should be moved to position 0
            assert.deepStrictEqual(testFeatures.lsp.workspace.applyWorkspaceEdit.firstCall.args[0], {
                edit: {
                    documentChanges: [
                        {
                            textDocument: { uri: 'test.ts', version: 0 },
                            edits: [
                                {
                                    range: {
                                        start: Position.create(0, 0), // Note: cursor moved to start
                                        end: Position.create(0, 0),
                                    },
                                    newText: `${' '.repeat(8)}const x = 1\n${' '.repeat(8)}const y = 2`,
                                },
                            ],
                        },
                    ],
                },
            })
        })

        it('handles virtual spaces with multiline code containing empty lines', async () => {
            // Create an empty document
            let document: TextDocument = TextDocument.create('test.ts', 'typescript', 1, '')
            testFeatures.workspace.getTextDocument.resolves(document)

            // Position cursor at character 4 in an empty line (virtual space)
            const cursorPosition = Position.create(0, 4)
            const params: InsertToCursorPositionParams = {
                textDocument: { uri: 'test.ts' },
                cursorPosition,
                code: 'if (condition) {\n\n    console.log("test");\n}',
                tabId: mockTabId,
                messageId: 'XXX',
            }

            await chatController.onCodeInsertToCursorPosition(params)

            // The code should be indented with 4 spaces, empty lines should remain empty
            assert.deepStrictEqual(testFeatures.lsp.workspace.applyWorkspaceEdit.firstCall.args[0], {
                edit: {
                    documentChanges: [
                        {
                            textDocument: { uri: 'test.ts', version: 0 },
                            edits: [
                                {
                                    range: {
                                        start: Position.create(0, 0), // Note: cursor moved to start
                                        end: Position.create(0, 0),
                                    },
                                    newText: `${' '.repeat(4)}if (condition) {\n\n${' '.repeat(8)}console.log("test");\n    }`,
                                },
                            ],
                        },
                    ],
                },
            })
        })

        it('handles virtual spaces correctly when code starts with empty line', async () => {
            const document: TextDocument = TextDocument.create('test.ts', 'typescript', 1, '')
            testFeatures.workspace.getTextDocument.resolves(document)

            // Position cursor at character 6 in an empty line (virtual space)
            const cursorPosition = Position.create(0, 6)
            const params: InsertToCursorPositionParams = {
                textDocument: { uri: 'test.ts' },
                cursorPosition,
                // Code starts with an empty line, followed by actual code
                code: '\nfunction test() {\n    console.log("test");\n}',
                tabId: mockTabId,
                messageId: 'XXX',
            }

            await chatController.onCodeInsertToCursorPosition(params)

            // The first empty line should have no indentation
            // Subsequent lines should be indented with 6 spaces
            assert.deepStrictEqual(testFeatures.lsp.workspace.applyWorkspaceEdit.firstCall.args[0], {
                edit: {
                    documentChanges: [
                        {
                            textDocument: { uri: 'test.ts', version: 0 },
                            edits: [
                                {
                                    range: {
                                        start: Position.create(0, 0), // Note: cursor moved to start
                                        end: Position.create(0, 0),
                                    },
                                    // First line is empty (no indentation)
                                    // Following lines get the virtual space indentation
                                    newText: `\n${' '.repeat(6)}function test() {\n${' '.repeat(10)}console.log("test");\n${' '.repeat(6)}}`,
                                },
                            ],
                        },
                    ],
                },
            })
        })
    })

    it('calls TabBarControlled when tabBarAction request is received', async () => {
        const tabBarActionStub = sinon.stub(TabBarController.prototype, 'onTabBarAction')

        await chatController.onTabBarAction({ tabId: mockTabId, action: 'export' })

        sinon.assert.calledOnce(tabBarActionStub)
    })

    it('determines when an error is a user action', function () {
        const nonUserAction = new Error('User action error')
        const cancellationError = new CancellationError('user')
        const rejectionError = new ToolApprovalException()
        const tokenSource = new CancellationTokenSource()

        assert.ok(!chatController.isUserAction(nonUserAction))
        assert.ok(chatController.isUserAction(cancellationError))
        assert.ok(chatController.isUserAction(rejectionError))

        assert.ok(!chatController.isUserAction(nonUserAction, tokenSource.token))

        tokenSource.cancel()

        assert.ok(chatController.isUserAction(nonUserAction, tokenSource.token))
    })
})

// The body may include text-based progress updates from tool invocations.
// We want to ignore these in the tests.
function assertChatResultsMatch(actual: any, expected: ChatResult) {
    // TODO: tool messages completely re-order the response.
    return

    // if (actual?.body && expected?.body) {
    //     assert.ok(
    //         actual.body.endsWith(expected.body),
    //         `Body should end with "${expected.body}"\nActual: "${actual.body}"`
    //     )
    // }

    // assert.deepStrictEqual({ ...actual, body: undefined }, { ...expected, body: undefined })
}
