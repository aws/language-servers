import { CredentialsProvider } from '@aws/language-server-runtimes/server-interface'
import * as assert from 'assert'
import sinon from 'ts-sinon'
import { ChatSessionManagementService } from './chatSessionManagementService'
import { ChatSessionService } from './chatSessionService'

describe('ChatSessionManagementService', () => {
    it('getInstance should return the same instance if initialized', () => {
        const instance = ChatSessionManagementService.getInstance()
        const instance2 = ChatSessionManagementService.getInstance()

        assert.strictEqual(instance, instance2)
    })

    it('creating a session without credentials provider should throw an error', () => {
        assert.throws(() => ChatSessionManagementService.getInstance().createSession('mockSessionId'))
    })

    describe('Session interface', () => {
        const mockCredentialsProvider: CredentialsProvider = {
            hasCredentials: sinon.stub().returns(true),
            getCredentials: sinon.stub().returns(Promise.resolve({ token: 'mockToken' })),
            getConnectionMetadata: sinon.stub(),
        }

        const mockSessionId = 'mockSessionId'
        const mockSessionId2 = 'mockSessionId2'
        let disposeStub: sinon.SinonStub
        let chatSessionManagementService: ChatSessionManagementService

        beforeEach(() => {
            disposeStub = sinon.stub(ChatSessionService.prototype, 'dispose')
            chatSessionManagementService =
                ChatSessionManagementService.getInstance().withCredentialsProvider(mockCredentialsProvider)
        })

        afterEach(() => {
            disposeStub.restore()
        })

        it('getSession should return an existing client if found', () => {
            assert.ok(!chatSessionManagementService.hasSession(mockSessionId))
            assert.strictEqual(chatSessionManagementService.getSession(mockSessionId), undefined)

            const chatClient = chatSessionManagementService.createSession(mockSessionId)

            assert.ok(chatClient instanceof ChatSessionService)
            assert.ok(chatSessionManagementService.hasSession(mockSessionId))

            assert.strictEqual(chatSessionManagementService.getSession(mockSessionId), chatClient)
        })

        it('deleting session should dispose the chat session service and delete from map', () => {
            chatSessionManagementService.getSession(mockSessionId)

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
