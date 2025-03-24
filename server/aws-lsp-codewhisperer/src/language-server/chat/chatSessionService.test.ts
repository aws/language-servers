import {
    CodeWhispererStreaming,
    SendMessageCommandInput,
    SendMessageCommandOutput,
} from '@amzn/codewhisperer-streaming'
import * as assert from 'assert'
import sinon, { StubbedInstance, stubInterface } from 'ts-sinon'
import { ChatSessionService } from './chatSessionService'

import { AmazonQTokenServiceManager } from '../../shared/amazonQServiceManager/AmazonQTokenServiceManager'

describe('Chat Session Service', () => {
    let sendMessageStub: sinon.SinonStub<any, any>
    let abortStub: sinon.SinonStub<any, any>
    let chatSessionService: ChatSessionService
    let amazonQServiceManager: StubbedInstance<AmazonQTokenServiceManager>
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
        sendMessageStub = sinon
            .stub(CodeWhispererStreaming.prototype, 'sendMessage')
            .callsFake(() => Promise.resolve(mockRequestResponse))

        amazonQServiceManager = stubInterface<AmazonQTokenServiceManager>()
        amazonQServiceManager.getStreamingClient.returns(new CodeWhispererStreaming())

        abortStub = sinon.stub(AbortController.prototype, 'abort')

        chatSessionService = new ChatSessionService(amazonQServiceManager)
    })

    afterEach(() => {
        sendMessageStub.restore()
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

            sinon.assert.calledOnceWithExactly(sendMessageStub, mockRequestParams, sinon.match.object)

            chatSessionService.conversationId = mockConversationId

            await chatSessionService.sendMessage(mockRequestParams)

            const requestParamsWithConversationId = {
                conversationState: {
                    ...mockRequestParams.conversationState,
                    conversationId: mockConversationId,
                },
            }

            assert.ok(sendMessageStub.getCall(1).calledWithExactly(requestParamsWithConversationId, sinon.match.object))
        })
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
