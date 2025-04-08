import { StreamingClientService } from './streamingClientService'
import sinon from 'ts-sinon'
import { expect } from 'chai'
import { TestFeatures } from '@aws/language-server-runtimes/testing'
import { BearerCredentials } from '@aws/language-server-runtimes/server-interface'
import { DEFAULT_AWS_Q_ENDPOINT_URL, DEFAULT_AWS_Q_REGION } from './constants'
import {
    CodeWhispererStreaming,
    SendMessageCommandInput,
    SendMessageCommandOutput,
} from '@amzn/codewhisperer-streaming'
import { rejects } from 'assert'

const TIME_TO_ADVANCE_MS = 100

describe('StreamingClientService', () => {
    let streamingClientService: StreamingClientService
    let features: TestFeatures
    let clock: sinon.SinonFakeTimers
    let sendMessageStub: sinon.SinonStub
    let abortStub: sinon.SinonStub

    const MOCKED_TOKEN_ONE: BearerCredentials = { token: 'some-fake-token' }
    const MOCKED_TOKEN_TWO: BearerCredentials = { token: 'some-other-fake-token' }

    const MOCKED_SEND_MESSAGE_REQUEST: SendMessageCommandInput = {
        conversationState: {
            chatTriggerType: 'MANUAL',
            currentMessage: {
                userInputMessage: {
                    content: 'some-content',
                },
            },
        },
    }

    const MOCKED_SEND_MESSAGE_RESPONSE: SendMessageCommandOutput = {
        $metadata: {},
        sendMessageResponse: undefined,
    }

    beforeEach(() => {
        clock = sinon.useFakeTimers({ now: new Date() })
        features = new TestFeatures()

        features.credentialsProvider.hasCredentials.withArgs('bearer').returns(true)
        features.credentialsProvider.getCredentials.withArgs('bearer').returns(MOCKED_TOKEN_ONE)

        sendMessageStub = sinon
            .stub(CodeWhispererStreaming.prototype, 'sendMessage')
            .callsFake(() => Promise.resolve(MOCKED_SEND_MESSAGE_RESPONSE))
        streamingClientService = new StreamingClientService(
            features.credentialsProvider,
            features.sdkInitializator,
            features.logging,
            DEFAULT_AWS_Q_REGION,
            DEFAULT_AWS_Q_ENDPOINT_URL,
            'some-user-agent'
        )

        abortStub = sinon.stub(AbortController.prototype, 'abort')
    })

    afterEach(() => {
        clock.restore()
        sinon.restore()
    })

    it('provides the lastest token present in the credentials provider', async () => {
        const tokenProvider = streamingClientService.client.config.token
        expect(tokenProvider).not.to.be.undefined

        const firstTokenPromise = (tokenProvider as any)()
        await clock.tickAsync(TIME_TO_ADVANCE_MS)

        const firstToken = await firstTokenPromise
        expect(firstToken.token).to.deep.equal(MOCKED_TOKEN_ONE.token)

        features.credentialsProvider.getCredentials.withArgs('bearer').returns(MOCKED_TOKEN_TWO)

        const secondTokenPromise = (tokenProvider as any)()
        await clock.tickAsync(TIME_TO_ADVANCE_MS)
        const secondToken = await secondTokenPromise

        expect(secondToken.token).to.deep.equal(MOCKED_TOKEN_TWO.token)
    })

    it('aborts in flight requests', async () => {
        streamingClientService.sendMessage(MOCKED_SEND_MESSAGE_REQUEST)
        streamingClientService.sendMessage(MOCKED_SEND_MESSAGE_REQUEST)

        streamingClientService.abortInflightRequests()

        sinon.assert.calledTwice(abortStub)
        expect(streamingClientService['inflightRequests'].size).to.eq(0)
    })

    it('attaches known profileArn to request', async () => {
        const mockedProfileArn = 'some-profile-arn'
        streamingClientService.profileArn = mockedProfileArn
        const expectedRequest: SendMessageCommandInput = {
            ...MOCKED_SEND_MESSAGE_REQUEST,
            profileArn: mockedProfileArn,
        }
        const promise = streamingClientService.sendMessage(MOCKED_SEND_MESSAGE_REQUEST)

        await clock.tickAsync(TIME_TO_ADVANCE_MS)
        await promise

        sinon.assert.calledOnce(sendMessageStub)
        sinon.assert.match(sendMessageStub.firstCall.firstArg, expectedRequest)
    })
})
