/**
 * Copied from ../qChatServer.test.ts for the purpose of developing a divergent implementation.
 * Will be deleted or merged.
 */

import { CancellationToken, Server } from '@aws/language-server-runtimes/server-interface'
import { TestFeatures } from '@aws/language-server-runtimes/testing'
import sinon from 'ts-sinon'
import { AgenticChatController } from './agenticChatController'
import { ChatSessionManagementService } from '../chat/chatSessionManagementService'
import { QAgenticChatServer } from './qAgenticChatServer'
import { AmazonQTokenServiceManager } from '../../shared/amazonQServiceManager/AmazonQTokenServiceManager'
import { ChatController } from '../chat/chatController'

describe('QAgenticChatServer', () => {
    const mockTabId = 'mockTabId'
    let disposeStub: sinon.SinonStub
    let withAmazonQServiceManagerSpy: sinon.SinonSpy
    let testFeatures: TestFeatures
    let amazonQServiceManager: AmazonQTokenServiceManager
    let disposeServer: () => void
    let chatSessionManagementService: ChatSessionManagementService

    beforeEach(async () => {
        testFeatures = new TestFeatures()

        testFeatures.workspace.fs = {
            ...testFeatures.workspace.fs,
            getServerDataDirPath: sinon.stub().returns('/mock/server/data/path'),
            mkdir: sinon.stub().resolves(),
            readFile: sinon.stub().resolves(),
            writeFile: sinon.stub().resolves(),
            rm: sinon.stub().resolves(),
        }

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
        testFeatures.lsp.getClientInitializeParams.returns(cachedInitializeParams)

        amazonQServiceManager = AmazonQTokenServiceManager.getInstance(testFeatures)

        disposeStub = sinon.stub(ChatSessionManagementService.prototype, 'dispose')
        chatSessionManagementService = ChatSessionManagementService.getInstance()
        withAmazonQServiceManagerSpy = sinon.spy(chatSessionManagementService, 'withAmazonQServiceManager')

        const chatServerFactory: Server = QAgenticChatServer()

        disposeServer = chatServerFactory(testFeatures)

        // Trigger initialize notification
        await testFeatures.lsp.onInitialized.firstCall.firstArg()
    })

    afterEach(() => {
        sinon.restore()
        ChatSessionManagementService.reset()
        disposeServer()
        testFeatures.dispose()
    })

    it('should initialize ChatSessionManagementService with AmazonQTokenServiceManager instance', () => {
        sinon.assert.calledOnceWithExactly(withAmazonQServiceManagerSpy, amazonQServiceManager)
    })

    it('dispose should dispose all chat session services', () => {
        disposeServer()

        sinon.assert.calledOnce(disposeStub)
    })

    it('calls the corresponding controller when tabAdd notification is received', () => {
        const tabAddStub = sinon.stub(AgenticChatController.prototype, 'onTabAdd')

        testFeatures.chat.onTabAdd.firstCall.firstArg({ tabId: mockTabId })

        sinon.assert.calledOnce(tabAddStub)
    })

    it('calls the corresponding controller when tabRemove notification is received', () => {
        const tabRemoveStub = sinon.stub(AgenticChatController.prototype, 'onTabRemove')

        testFeatures.chat.onTabRemove.firstCall.firstArg({ tabId: mockTabId })

        sinon.assert.calledOnce(tabRemoveStub)
    })

    it('calls the corresponding controller when endChat request is received', () => {
        const endChatStub = sinon.stub(AgenticChatController.prototype, 'onEndChat')

        testFeatures.chat.onEndChat.firstCall.firstArg({ tabId: mockTabId })

        sinon.assert.calledOnce(endChatStub)
    })

    it('calls the corresponding controller when chatPrompt request is received', () => {
        const chatPromptStub = sinon.stub(AgenticChatController.prototype, 'onChatPrompt')

        testFeatures.chat.onChatPrompt.firstCall.firstArg({ tabId: mockTabId, prompt: { prompt: 'Hello' } }, {})

        sinon.assert.calledOnce(chatPromptStub)
    })

    it('calls the corresponding controller when inlineChatPrompt request is received', () => {
        const inlineChatPromptStub = sinon.stub(AgenticChatController.prototype, 'onInlineChatPrompt')
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

    it('calls the corresponding controller when tabBarAction request is received', () => {
        const tabBarActionStub = sinon.stub(AgenticChatController.prototype, 'onTabBarAction')

        testFeatures.chat.onTabBarAction.firstCall.firstArg({ tabId: mockTabId, action: 'export' })

        sinon.assert.calledOnce(tabBarActionStub)
    })
})
