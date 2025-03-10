import {
    CredentialsProvider,
    SDKInitializator,
    SDKClientConstructorV2,
    SDKClientConstructorV3,
} from '@aws/language-server-runtimes/server-interface'
import * as assert from 'assert'
import sinon from 'ts-sinon'
import { ChatSessionManagementService } from './chatSessionManagementService'
import { ChatSessionService } from './chatSessionService'
import { Service } from 'aws-sdk'
import { ServiceConfigurationOptions } from 'aws-sdk/lib/service'

describe('ChatSessionManagementService', () => {
    const mockSessionId = 'mockSessionId'
    const mockAwsQRegion: string = 'mock-aws-q-region'
    const mockAwsQEndpointUrl: string = 'mock-aws-q-endpoint-url'

    it('getInstance should return the same instance if initialized', () => {
        const instance = ChatSessionManagementService.getInstance()
        const instance2 = ChatSessionManagementService.getInstance()

        assert.strictEqual(instance, instance2)
    })

    it('creating a session without credentials provider should throw an error', () => {
        const createSessionResult = ChatSessionManagementService.getInstance().createSession(mockSessionId)

        sinon.assert.match(createSessionResult, { success: false, error: sinon.match.string })
    })

    describe('Session interface', () => {
        const mockCredentialsProvider: CredentialsProvider = {
            hasCredentials: sinon.stub().returns(true),
            getCredentials: sinon.stub().returns(Promise.resolve({ token: 'mockToken' })),
            getConnectionMetadata: sinon.stub(),
            getConnectionType: sinon.stub(),
        }

        const mockSessionId2 = 'mockSessionId2'
        let disposeStub: sinon.SinonStub
        let chatSessionManagementService: ChatSessionManagementService

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

        beforeEach(() => {
            disposeStub = sinon.stub(ChatSessionService.prototype, 'dispose')
            chatSessionManagementService = ChatSessionManagementService.getInstance()
                .withCredentialsProvider(mockCredentialsProvider)
                .withCodeWhispererRegion(mockAwsQRegion)
                .withCodeWhispererEndpoint(mockAwsQEndpointUrl)
                .withSdkRuntimeConfigurator(mockSdkRuntimeConfigurator)
        })

        afterEach(() => {
            ChatSessionManagementService.reset()
            disposeStub.restore()
        })

        it('getSession should create a client if not found and returns existing client if found', () => {
            assert.ok(!chatSessionManagementService.hasSession(mockSessionId))

            const result = chatSessionManagementService.getSession(mockSessionId)

            sinon.assert.match(result, {
                success: true,
                data: sinon.match.instanceOf(ChatSessionService),
            })

            assert.ok(chatSessionManagementService.hasSession(mockSessionId))

            assert.strictEqual(chatSessionManagementService.getSession(mockSessionId).data, result.data)
        })

        it('creating a session with an existing id should return existing session', () => {
            const createdSession = chatSessionManagementService.createSession(mockSessionId)

            assert.deepStrictEqual(chatSessionManagementService.createSession(mockSessionId), createdSession)
        })

        it('deleting session should dispose the chat session service and delete from map', () => {
            chatSessionManagementService.createSession(mockSessionId)

            assert.ok(chatSessionManagementService.hasSession(mockSessionId))

            chatSessionManagementService.deleteSession(mockSessionId)

            assert.ok(!chatSessionManagementService.hasSession(mockSessionId))

            sinon.assert.calledOnce(disposeStub)
        })

        it('disposing the chat session management should dispose all the chat session services', () => {
            chatSessionManagementService.createSession(mockSessionId)
            chatSessionManagementService.createSession(mockSessionId2)

            chatSessionManagementService.dispose()

            sinon.assert.calledTwice(disposeStub)
        })
    })
})
