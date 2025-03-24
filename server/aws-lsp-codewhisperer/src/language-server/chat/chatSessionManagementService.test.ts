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

    describe('Session interface', () => {
        const mockSessionId2 = 'mockSessionId2'
        let disposeStub: sinon.SinonStub
        let chatSessionManagementService: ChatSessionManagementService

        beforeEach(() => {
            disposeStub = sinon.stub(ChatSessionService.prototype, 'dispose')
            chatSessionManagementService = ChatSessionManagementService.getInstance()
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
