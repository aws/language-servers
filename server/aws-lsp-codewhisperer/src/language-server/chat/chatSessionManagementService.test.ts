import { CredentialsProvider } from '@aws/language-server-runtimes/server-interface'
import * as assert from 'assert'
import sinon from 'ts-sinon'
import { ChatSessionManagementService } from './chatSessionManagementService'
import { ChatSessionService } from './chatSessionService'

describe('ChatSessionManagementService', () => {
    const mockSessionId = 'mockSessionId'

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
        }

        const mockSessionId2 = 'mockSessionId2'
        let disposeStub: sinon.SinonStub
        let chatSessionManagementService: ChatSessionManagementService

        beforeEach(() => {
            disposeStub = sinon.stub(ChatSessionService.prototype, 'dispose')
            chatSessionManagementService =
                ChatSessionManagementService.getInstance().withCredentialsProvider(mockCredentialsProvider)
        })

        afterEach(() => {
            ChatSessionManagementService.reset()
            disposeStub.restore()
        })

        it('getSession should return an existing client if found', () => {
            assert.ok(!chatSessionManagementService.hasSession(mockSessionId))

            sinon.assert.match(chatSessionManagementService.getSession(mockSessionId), {
                success: false,
                error: sinon.match.string,
            })

            const chatClientData = chatSessionManagementService.createSession(mockSessionId)

            sinon.assert.match(chatClientData, {
                success: true,
                data: sinon.match.instanceOf(ChatSessionService),
            })

            assert.ok(chatSessionManagementService.hasSession(mockSessionId))

            // asserting object reference
            assert.strictEqual(chatSessionManagementService.getSession(mockSessionId).data, chatClientData.data)
        })

        it('creating a session with an existing id should return an error', () => {
            chatSessionManagementService.createSession(mockSessionId)

            sinon.assert.match(chatSessionManagementService.createSession(mockSessionId), {
                success: false,
                error: sinon.match.string,
            })
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
