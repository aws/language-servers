import { Server } from '@aws/language-server-runtimes/server-interface'
import { TestFeatures } from '@aws/language-server-runtimes/testing'
import sinon from 'ts-sinon'
import { ChatController } from './chat/chatController'
import { ChatSessionManagementService } from './chat/chatSessionManagementService'
import { QChatServer } from './qChatServer'

describe('QChatServer', () => {
    const mockTabId = 'mockTabId'
    let disposeStub: sinon.SinonStub
    let testFeatures: TestFeatures
    let disposeServer: () => void
    let chatSessionManagementService: ChatSessionManagementService

    beforeEach(() => {
        testFeatures = new TestFeatures()
        disposeStub = sinon.stub(ChatSessionManagementService.prototype, 'dispose')

        chatSessionManagementService = ChatSessionManagementService.getInstance().withCredentialsProvider(
            testFeatures.credentialsProvider
        )
        const chatServerFactory: Server = QChatServer(() => chatSessionManagementService)

        disposeServer = chatServerFactory(testFeatures)
    })

    afterEach(() => {
        sinon.restore()
        ChatSessionManagementService.reset()
        testFeatures.dispose()
    })

    it('dispose should dispose all chat session services', () => {
        disposeServer()

        sinon.assert.calledOnce(disposeStub)
    })

    it('calls the corresponding controller when tabAdd notification is received', () => {
        const tabAddStub = sinon.stub(ChatController.prototype, 'onTabAdd')

        testFeatures.chat.onTabAdd.firstCall.firstArg({ tabId: mockTabId })

        sinon.assert.calledOnce(tabAddStub)
    })

    it('calls the corresponding controller when tabRemove notification is received', () => {
        const tabRemoveStub = sinon.stub(ChatController.prototype, 'onTabRemove')

        testFeatures.chat.onTabRemove.firstCall.firstArg({ tabId: mockTabId })

        sinon.assert.calledOnce(tabRemoveStub)
    })

    it('calls the corresponding controller when endChat request is received', () => {
        const endChatStub = sinon.stub(ChatController.prototype, 'onEndChat')

        testFeatures.chat.onEndChat.firstCall.firstArg({ tabId: mockTabId })

        sinon.assert.calledOnce(endChatStub)
    })

    it('calls the corresponding controller when chatPrompt request is received', () => {
        const chatPromptStub = sinon.stub(ChatController.prototype, 'onChatPrompt')

        testFeatures.chat.onChatPrompt.firstCall.firstArg({ tabId: mockTabId, prompt: { prompt: 'Hello' } }, {})

        sinon.assert.calledOnce(chatPromptStub)
    })
})
