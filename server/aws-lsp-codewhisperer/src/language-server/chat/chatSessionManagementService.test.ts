import { CredentialsProvider } from '@aws/language-server-runtimes/server-interface'
import * as assert from 'assert'
import sinon from 'ts-sinon'
import { ChatSessionManagementService } from './chatSessionManagementService'
import { ChatSessionService } from './chatSessionService'

describe('ChatSessionManagementService', () => {
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
        chatSessionManagementService = new ChatSessionManagementService(mockCredentialsProvider)
    })

    afterEach(() => {
        disposeStub.restore()
    })

    it('getSession should return an existing client if found or create a new client if not found', () => {
        assert.ok(!chatSessionManagementService.hasSession(mockSessionId))
        // getSession creates a new session if not found
        const chatClient = chatSessionManagementService.getSession(mockSessionId)

        assert.ok(chatClient instanceof ChatSessionService)
        assert.ok(chatSessionManagementService.hasSession(mockSessionId))

        // check if the object reference is the same to ensure we are only creating one client
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
        chatSessionManagementService.getSession(mockSessionId)
        chatSessionManagementService.getSession(mockSessionId2)

        chatSessionManagementService.dispose()

        sinon.assert.calledTwice(disposeStub)
    })
})
