import {
    CodeWhispererStreaming,
    GenerateAssistantResponseCommandInput,
    GenerateAssistantResponseCommandOutput,
} from '@amzn/codewhisperer-streaming'
import { CredentialsProvider } from '@aws/language-server-runtimes/server-interface'
import { AbortController } from '@smithy/abort-controller'
import * as assert from 'assert'
import sinon from 'ts-sinon'
import { ChatSessionService } from './chatSessionService'

describe('Chat Session Service', () => {
    let generateAssistantResponseStub: sinon.SinonStub<any, any>
    let abortStub: sinon.SinonStub<any, any>
    let destroyClientStub: sinon.SinonStub<any, any>
    let chatSessionService: ChatSessionService
    const mockCredentialsProvider: CredentialsProvider = {
        hasCredentials: sinon.stub().returns(true),
        getCredentials: sinon.stub().returns(Promise.resolve({ token: 'mockToken ' })),
        getConnectionMetadata: sinon.stub(),
    }

    const mockConversationId = 'mockConversationId'

    const mockRequestParams: GenerateAssistantResponseCommandInput = {
        conversationState: {
            chatTriggerType: 'MANUAL',
            currentMessage: {
                userInputMessage: {
                    content: 'hello',
                },
            },
        },
    }

    const mockRequestResponse: GenerateAssistantResponseCommandOutput = {
        conversationId: mockConversationId,
        $metadata: {},
        generateAssistantResponseResponse: undefined,
    }

    beforeEach(() => {
        abortStub = sinon.stub(AbortController.prototype, 'abort')

        generateAssistantResponseStub = sinon
            .stub(CodeWhispererStreaming.prototype, 'generateAssistantResponse')
            .callsFake(() => Promise.resolve(mockRequestResponse))

        destroyClientStub = sinon.stub(CodeWhispererStreaming.prototype, 'destroy')

        chatSessionService = new ChatSessionService(mockCredentialsProvider)
    })

    afterEach(() => {
        generateAssistantResponseStub.restore()
        destroyClientStub.restore()
        abortStub.restore()
    })

    describe('calling GenerateAssistantResponse', () => {
        it('should call generate assistant response from the streaming client and set the session id ', async () => {
            await chatSessionService.generateAssistantResponse(mockRequestParams)

            sinon.assert.calledOnceWithExactly(generateAssistantResponseStub, mockRequestParams, sinon.match.object)
            assert.strictEqual(chatSessionService.sessionId, mockConversationId)
        })

        it('should fill in conversationId with session id in the request if exists', async () => {
            await chatSessionService.generateAssistantResponse(mockRequestParams)

            sinon.assert.calledOnceWithExactly(generateAssistantResponseStub, mockRequestParams, sinon.match.object)

            await chatSessionService.generateAssistantResponse(mockRequestParams)

            const requestParamsWithConversationId = {
                conversationState: {
                    ...mockRequestParams.conversationState,
                    conversationId: mockConversationId,
                },
            }

            assert.ok(
                generateAssistantResponseStub
                    .getCall(1)
                    .calledWithExactly(requestParamsWithConversationId, sinon.match.object)
            )
        })
    })

    it('calling .abortRequest() aborts request with AbortController', async () => {
        await chatSessionService.generateAssistantResponse(mockRequestParams)

        chatSessionService.abortRequest()

        sinon.assert.calledOnce(abortStub)
    })

    it('calling .dispose() calls client.destroy and aborts outgoing requests', async () => {
        await chatSessionService.generateAssistantResponse(mockRequestParams)

        chatSessionService.dispose()

        sinon.assert.calledOnce(abortStub)
        sinon.assert.calledOnce(destroyClientStub)
    })
})
