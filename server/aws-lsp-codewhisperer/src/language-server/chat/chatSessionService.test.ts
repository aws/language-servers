import { SendMessageCommandInput, SendMessageCommandOutput } from '@amzn/codewhisperer-streaming'
import * as assert from 'assert'
import sinon, { StubbedInstance, stubInterface } from 'ts-sinon'
import { ChatSessionService } from './chatSessionService'
import { AmazonQTokenServiceManager } from '../../shared/amazonQServiceManager/AmazonQTokenServiceManager'
import { AmazonQIAMServiceManager } from '../../shared/amazonQServiceManager/AmazonQIAMServiceManager'
import { StreamingClientServiceToken, StreamingClientServiceIAM } from '../../shared/streamingClientService'

describe('Chat Session Service', () => {
    let abortStub: sinon.SinonStub<any, any>
    let chatSessionService: ChatSessionService
    let amazonQServiceManager: StubbedInstance<AmazonQTokenServiceManager>
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

        amazonQServiceManager = stubInterface<AmazonQTokenServiceManager>()
        amazonQServiceManager.getStreamingClient.returns(codeWhispererStreamingClient)

        abortStub = sinon.stub(AbortController.prototype, 'abort')

        chatSessionService = new ChatSessionService(amazonQServiceManager)
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
    })

    it('abortRequest() aborts request with AbortController', async () => {
        await chatSessionService.sendMessage(mockRequestParams)

        chatSessionService.abortRequest()

        sinon.assert.calledOnce(abortStub)
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

    it('dispose() calls aborts outgoing requests', async () => {
        await chatSessionService.sendMessage(mockRequestParams)

        chatSessionService.dispose()

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

    it('clear() resets conversation id and aborts outgoing request', async () => {
        await chatSessionService.sendMessage(mockRequestParams)
        chatSessionService.conversationId = mockConversationId

        assert.strictEqual(chatSessionService.conversationId, mockConversationId)

        chatSessionService.clear()

        sinon.assert.calledOnce(abortStub)
        assert.strictEqual(chatSessionService.conversationId, undefined)
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
})
