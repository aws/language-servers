import {
    CodeWhispererStreaming,
    SendMessageCommandInput,
    SendMessageCommandOutput,
} from '@amzn/codewhisperer-streaming'
import {
    CredentialsProvider,
    SDKInitializator,
    SDKClientConstructorV2,
    SDKClientConstructorV3,
} from '@aws/language-server-runtimes/server-interface'
import * as assert from 'assert'
import sinon from 'ts-sinon'
import { ChatSessionService } from './chatSessionService'
import { DEFAULT_AWS_Q_ENDPOINT_URL, DEFAULT_AWS_Q_REGION } from '../../constants'
import { Service } from 'aws-sdk'
import { ServiceConfigurationOptions } from 'aws-sdk/lib/service'

describe('Chat Session Service', () => {
    let sendMessageStub: sinon.SinonStub<any, any>
    let abortStub: sinon.SinonStub<any, any>
    let chatSessionService: ChatSessionService
    const mockCredentialsProvider: CredentialsProvider = {
        hasCredentials: sinon.stub().returns(true),
        getCredentials: sinon.stub().returns(Promise.resolve({ token: 'mockToken ' })),
        getConnectionMetadata: sinon.stub(),
        getConnectionType: sinon.stub(),
        onCredentialsDeleted: sinon.stub(),
    }
    const awsQRegion: string = DEFAULT_AWS_Q_REGION
    const awsQEndpointUrl: string = DEFAULT_AWS_Q_ENDPOINT_URL
    const mockConversationId = 'mockConversationId'

    const mockSdkRuntimeConfigurator: SDKInitializator = Object.assign(
        // Default callable function for v3 clients
        <T, P>(Ctor: SDKClientConstructorV3<T, P>, current_config: P): T => new Ctor({ ...current_config }),
        // Property for v2 clients
        {
            v2: <T extends Service, P extends ServiceConfigurationOptions>(
                Ctor: SDKClientConstructorV2<T, P>,
                current_config: P
            ): T => new Ctor({ ...current_config }),
        }
    )

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
        abortStub = sinon.stub(AbortController.prototype, 'abort')

        sendMessageStub = sinon
            .stub(CodeWhispererStreaming.prototype, 'sendMessage')
            .callsFake(() => Promise.resolve(mockRequestResponse))

        chatSessionService = new ChatSessionService(
            mockCredentialsProvider,
            awsQRegion,
            awsQEndpointUrl,
            mockSdkRuntimeConfigurator
        )
    })

    afterEach(() => {
        sendMessageStub.restore()
        abortStub.restore()
    })

    describe('calling SendMessage', () => {
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
