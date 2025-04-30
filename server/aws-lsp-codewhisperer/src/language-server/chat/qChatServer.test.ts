import { CancellationToken, Server } from '@aws/language-server-runtimes/server-interface'
import { TestFeatures } from '@aws/language-server-runtimes/testing'
import sinon from 'ts-sinon'
import { ChatController } from './chatController'
import { ChatSessionManagementService } from './chatSessionManagementService'
import { QChatServerFactory } from './qChatServer'
import { initBaseTestServiceManager, TestAmazonQServiceManager } from '../../shared/amazonQServiceManager/testUtils'

describe('QChatServer', () => {
    const mockTabId = 'mockTabId'
    let disposeStub: sinon.SinonStub
    let withAmazonQServiceSpy: sinon.SinonSpy
    let testFeatures: TestFeatures
    let amazonQServiceManager: TestAmazonQServiceManager
    let disposeServer: () => void
    let chatSessionManagementService: ChatSessionManagementService

    beforeEach(() => {
        testFeatures = new TestFeatures()
        // @ts-ignore
        const cachedInitializeParams: InitializeParams = {
            initializationOptions: {
                aws: {
                    awsClientCapabilities: {
                        q: {
                            developerProfiles: false,
                        },
                    },
                },
            },
        }
        testFeatures.setClientParams(cachedInitializeParams)

        TestAmazonQServiceManager.resetInstance()
        amazonQServiceManager = initBaseTestServiceManager(testFeatures)
        disposeStub = sinon.stub(ChatSessionManagementService.prototype, 'dispose')
        chatSessionManagementService = ChatSessionManagementService.getInstance()
        withAmazonQServiceSpy = sinon.spy(chatSessionManagementService, 'withAmazonQServiceManager')

        const chatServerFactory: Server = QChatServerFactory(() => amazonQServiceManager)

        disposeServer = chatServerFactory(testFeatures)

        // Trigger initialize notification
        testFeatures.doSendInitializedNotification()
    })

    afterEach(() => {
        sinon.restore()
        ChatSessionManagementService.reset()
        testFeatures.dispose()
    })

    it('should initialize ChatSessionManagementService with AmazonQTokenServiceManager instance', () => {
        sinon.assert.calledOnceWithExactly(withAmazonQServiceSpy, amazonQServiceManager)
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

    it('calls the corresponding controller when inlineChatPrompt request is received', () => {
        const inlineChatPromptStub = sinon.stub(ChatController.prototype, 'onInlineChatPrompt')
        const mockCancellationToken: CancellationToken = {
            isCancellationRequested: false,
            onCancellationRequested: () => ({ dispose: () => {} }),
        }
        testFeatures.chat.onInlineChatPrompt.firstCall.firstArg({ prompt: { prompt: 'Hello' } }, mockCancellationToken)

        sinon.assert.calledOnce(inlineChatPromptStub)
        sinon.assert.calledWith(
            inlineChatPromptStub,
            {
                prompt: { prompt: 'Hello' },
            },
            mockCancellationToken
        )
    })
})
