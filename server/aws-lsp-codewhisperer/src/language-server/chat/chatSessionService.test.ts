import { SendMessageCommandInput, SendMessageCommandOutput } from '@aws/codewhisperer-streaming-client'
import * as assert from 'assert'
import sinon, { StubbedInstance, stubInterface } from 'ts-sinon'
import { ChatSessionService } from './chatSessionService'
import { AmazonQTokenServiceManager } from '../../shared/amazonQServiceManager/AmazonQTokenServiceManager'
import { StreamingClientServiceToken, StreamingClientServiceIAM } from '../../shared/streamingClientService'
import { AmazonQBaseServiceManager } from '../../shared/amazonQServiceManager/BaseAmazonQServiceManager'
import { AmazonQIAMServiceManager } from '../../shared/amazonQServiceManager/AmazonQIAMServiceManager'

describe('Chat Session Service', () => {
    let abortStub: sinon.SinonStub<any, any>
    let chatSessionService: ChatSessionService
    let amazonQServiceManager: StubbedInstance<AmazonQBaseServiceManager>
    let codeWhispererStreamingClient: StubbedInstance<StreamingClientServiceToken>
    const mockConversationId = 'mockConversationId'

    const mockRequestParams: SendMessageCommandInput = {
        conversationState: {
            chatTriggerType: 'MANUAL',
            currentMessage: {
                userInputMessage: {
                    content: 'hello',
                },
            },
        },
    }

    const mockRequestResponse: SendMessageCommandOutput = {
        $metadata: {},
        sendMessageResponse: undefined,
    }

    beforeEach(() => {
        codeWhispererStreamingClient = stubInterface<StreamingClientServiceToken>()
        codeWhispererStreamingClient.sendMessage.callsFake(() => Promise.resolve(mockRequestResponse))

        amazonQServiceManager = stubInterface<AmazonQBaseServiceManager>()
        amazonQServiceManager.getStreamingClient.returns(codeWhispererStreamingClient)

        abortStub = sinon.stub(AbortController.prototype, 'abort')

        chatSessionService = new ChatSessionService(amazonQServiceManager)

        // needed to identify the stubs as the actual class when checking 'instanceof' in generateAssistantResponse
        Object.setPrototypeOf(amazonQServiceManager, AmazonQTokenServiceManager.prototype)
        Object.setPrototypeOf(codeWhispererStreamingClient, StreamingClientServiceToken.prototype)
    })

    afterEach(() => {
        abortStub.restore()
    })

    describe('calling SendMessage', () => {
        it('throws error is AmazonQTokenServiceManager is not initialized', async () => {
            chatSessionService = new ChatSessionService(undefined)

            await assert.rejects(
                chatSessionService.sendMessage(mockRequestParams),
                new Error('amazonQServiceManager is not initialized')
            )
        })

        it('should fill in conversationId in the request if exists', async () => {
            await chatSessionService.sendMessage(mockRequestParams)
            sinon.assert.calledOnce(codeWhispererStreamingClient.sendMessage)
            sinon.assert.match(codeWhispererStreamingClient.sendMessage.firstCall.firstArg, mockRequestParams)

            chatSessionService.conversationId = mockConversationId

            await chatSessionService.sendMessage(mockRequestParams)

            const requestParamsWithConversationId = {
                conversationState: {
                    ...mockRequestParams.conversationState,
                    conversationId: mockConversationId,
                },
            }

            sinon.assert.match(
                codeWhispererStreamingClient.sendMessage.getCall(1).firstArg,
                requestParamsWithConversationId
            )
        })

        it('abortRequest() aborts request with AbortController', async () => {
            await chatSessionService.sendMessage(mockRequestParams)

            chatSessionService.abortRequest()

            sinon.assert.calledOnce(abortStub)
        })

        it('dispose() calls aborts outgoing requests', async () => {
            await chatSessionService.sendMessage(mockRequestParams)

            chatSessionService.dispose()

            sinon.assert.calledOnce(abortStub)
        })

        it('clear() resets conversation id and aborts outgoing request', async () => {
            await chatSessionService.sendMessage(mockRequestParams)
            chatSessionService.conversationId = mockConversationId

            assert.strictEqual(chatSessionService.conversationId, mockConversationId)

            chatSessionService.clear()

            sinon.assert.calledOnce(abortStub)
            assert.strictEqual(chatSessionService.conversationId, undefined)
        })
    })

    describe('calling GenerateAssistantResponse', () => {
        it('throws error is AmazonQTokenServiceManager is not initialized', async () => {
            chatSessionService = new ChatSessionService(undefined)

            await assert.rejects(
                chatSessionService.generateAssistantResponse(mockRequestParams),
                new Error('amazonQServiceManager is not initialized')
            )
        })

        it('should fill in conversationId in the request if exists', async () => {
            await chatSessionService.generateAssistantResponse(mockRequestParams)
            sinon.assert.calledOnce(codeWhispererStreamingClient.generateAssistantResponse)
            sinon.assert.match(
                codeWhispererStreamingClient.generateAssistantResponse.firstCall.firstArg,
                mockRequestParams
            )

            chatSessionService.conversationId = mockConversationId

            await chatSessionService.generateAssistantResponse(mockRequestParams)

            const requestParamsWithConversationId = {
                conversationState: {
                    ...mockRequestParams.conversationState,
                    conversationId: mockConversationId,
                },
            }

            sinon.assert.match(
                codeWhispererStreamingClient.generateAssistantResponse.getCall(1).firstArg,
                requestParamsWithConversationId
            )
        })

        it('abortRequest() in IAM client, aborts request with AbortController', async () => {
            const codeWhispererStreamingClientIAM = stubInterface<StreamingClientServiceIAM>()
            codeWhispererStreamingClientIAM.sendMessage.callsFake(() => Promise.resolve(mockRequestResponse))

            const amazonQServiceManagerIAM = stubInterface<AmazonQIAMServiceManager>()
            amazonQServiceManagerIAM.getStreamingClient.returns(codeWhispererStreamingClientIAM)

            const chatSessionServiceIAM = new ChatSessionService(amazonQServiceManagerIAM)
            await chatSessionServiceIAM.sendMessage(mockRequestParams)

            chatSessionServiceIAM.abortRequest()

            sinon.assert.calledOnce(abortStub)
        })

        it('dispose() in IAM client, calls aborts outgoing requests', async () => {
            const codeWhispererStreamingClientIAM = stubInterface<StreamingClientServiceIAM>()
            codeWhispererStreamingClientIAM.sendMessage.callsFake(() => Promise.resolve(mockRequestResponse))

            const amazonQServiceManagerIAM = stubInterface<AmazonQIAMServiceManager>()
            amazonQServiceManagerIAM.getStreamingClient.returns(codeWhispererStreamingClientIAM)

            const chatSessionServiceIAM = new ChatSessionService(amazonQServiceManagerIAM)
            await chatSessionServiceIAM.sendMessage(mockRequestParams)

            chatSessionServiceIAM.dispose()

            sinon.assert.calledOnce(abortStub)
        })

        it('abortRequest() aborts request with AbortController', async () => {
            await chatSessionService.generateAssistantResponse(mockRequestParams)

            chatSessionService.abortRequest()

            sinon.assert.calledOnce(abortStub)
        })

        it('dispose() calls aborts outgoing requests', async () => {
            await chatSessionService.generateAssistantResponse(mockRequestParams)

            chatSessionService.dispose()

            sinon.assert.calledOnce(abortStub)
        })

        it('clear() resets conversation id and aborts outgoing request', async () => {
            await chatSessionService.generateAssistantResponse(mockRequestParams)
            chatSessionService.conversationId = mockConversationId

            assert.strictEqual(chatSessionService.conversationId, mockConversationId)

            chatSessionService.clear()

            sinon.assert.calledOnce(abortStub)
            assert.strictEqual(chatSessionService.conversationId, undefined)
        })
    })

    it('clear() in IAM client, resets conversation id and aborts outgoing request', async () => {
        const codeWhispererStreamingClientIAM = stubInterface<StreamingClientServiceIAM>()
        codeWhispererStreamingClientIAM.sendMessage.callsFake(() => Promise.resolve(mockRequestResponse))

        const amazonQServiceManagerIAM = stubInterface<AmazonQIAMServiceManager>()
        amazonQServiceManagerIAM.getStreamingClient.returns(codeWhispererStreamingClientIAM)

        const chatSessionServiceIAM = new ChatSessionService(amazonQServiceManagerIAM)
        await chatSessionServiceIAM.sendMessage(mockRequestParams)

        chatSessionServiceIAM.conversationId = mockConversationId

        assert.strictEqual(chatSessionServiceIAM.conversationId, mockConversationId)

        chatSessionServiceIAM.clear()

        sinon.assert.calledOnce(abortStub)
        assert.strictEqual(chatSessionServiceIAM.conversationId, undefined)
    })

    describe('Prompt ID', () => {
        let chatSessionService: ChatSessionService

        beforeEach(() => {
            chatSessionService = new ChatSessionService()
        })

        it('should initialize with undefined promptId', () => {
            assert.strictEqual(chatSessionService.isCurrentPrompt('test-id'), false)
        })

        it('should set and check current prompt ID', () => {
            const promptId = 'test-prompt-id'
            chatSessionService.setCurrentPromptId(promptId)

            assert.strictEqual(chatSessionService.isCurrentPrompt(promptId), true)
            assert.strictEqual(chatSessionService.isCurrentPrompt('different-id'), false)
        })
    })

    describe('Approved Paths', () => {
        let chatSessionService: ChatSessionService

        beforeEach(() => {
            chatSessionService = new ChatSessionService()
        })

        it('should initialize with an empty set of approved paths', () => {
            const approvedPaths = chatSessionService.approvedPaths
            assert.strictEqual(approvedPaths.size, 0)
            assert.ok(approvedPaths instanceof Set)
        })

        it('should add a path to approved paths', () => {
            const testPath = '/test/path/file.js'
            chatSessionService.addApprovedPath(testPath)

            const approvedPaths = chatSessionService.approvedPaths
            assert.strictEqual(approvedPaths.size, 1)
            assert.ok(approvedPaths.has(testPath))
        })

        it('should not add empty paths', () => {
            chatSessionService.addApprovedPath('')
            chatSessionService.addApprovedPath(undefined as unknown as string)

            const approvedPaths = chatSessionService.approvedPaths
            assert.strictEqual(approvedPaths.size, 0)
        })

        it('should normalize Windows-style paths', () => {
            const windowsPath = 'C:\\Users\\test\\file.js'
            const normalizedPath = 'C:/Users/test/file.js'

            chatSessionService.addApprovedPath(windowsPath)

            const approvedPaths = chatSessionService.approvedPaths
            assert.strictEqual(approvedPaths.size, 1)
            assert.ok(approvedPaths.has(normalizedPath))
            assert.ok(!approvedPaths.has(windowsPath))
        })

        it('should handle multiple paths correctly', () => {
            const paths = ['/path/one/file.js', '/path/two/file.js', 'C:\\path\\three\\file.js']

            paths.forEach(p => chatSessionService.addApprovedPath(p))

            const approvedPaths = chatSessionService.approvedPaths
            assert.strictEqual(approvedPaths.size, 3)
            assert.ok(approvedPaths.has(paths[0]))
            assert.ok(approvedPaths.has(paths[1]))
            assert.ok(approvedPaths.has('C:/path/three/file.js'))
        })

        it('should not add duplicate paths', () => {
            const testPath = '/test/path/file.js'

            chatSessionService.addApprovedPath(testPath)
            chatSessionService.addApprovedPath(testPath)

            const approvedPaths = chatSessionService.approvedPaths
            assert.strictEqual(approvedPaths.size, 1)
        })

        it('should treat normalized paths as the same path', () => {
            const unixPath = '/test/path/file.js'
            const windowsPath = '/test\\path\\file.js'

            chatSessionService.addApprovedPath(unixPath)
            chatSessionService.addApprovedPath(windowsPath)

            const approvedPaths = chatSessionService.approvedPaths
            assert.strictEqual(approvedPaths.size, 1)
            assert.ok(approvedPaths.has(unixPath))
        })
    })
})
