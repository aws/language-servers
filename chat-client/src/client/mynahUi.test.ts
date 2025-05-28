import { afterEach } from 'mocha'
import * as sinon from 'sinon'
import { assert } from 'sinon'
import {
    createMynahUi,
    InboundChatApi,
    handleChatPrompt,
    DEFAULT_HELP_PROMPT,
    handlePromptInputChange,
} from './mynahUi'
import { Messager, OutboundChatApi } from './messager'
import { TabFactory } from './tabs/tabFactory'
import { ChatItemType, MynahUI, NotificationType } from '@aws/mynah-ui'
import { ChatClientAdapter } from '../contracts/chatClientAdapter'
import { ChatMessage } from '@aws/language-server-runtimes-types'
import { ChatHistory } from './features/history'
import { pairProgrammingModeOn, pairProgrammingModeOff } from './texts/pairProgramming'
import { BedrockModel } from './texts/modelSelection'

describe('MynahUI', () => {
    let messager: Messager
    let mynahUi: MynahUI
    let inboundChatApi: InboundChatApi
    let outboundChatApi: OutboundChatApi

    let getSelectedTabIdStub: sinon.SinonStub
    let createTabStub: sinon.SinonStub
    let getChatItemsStub: sinon.SinonStub
    let getAllTabsStub: sinon.SinonStub
    let updateStoreSpy: sinon.SinonSpy
    let addChatItemSpy: sinon.SinonSpy
    let onChatPromptSpy: sinon.SinonSpy
    let onQuickActionSpy: sinon.SinonSpy
    let onOpenTabSpy: sinon.SinonSpy
    let selectTabSpy: sinon.SinonSpy
    let serializeChatStub: sinon.SinonStub
    let notifySpy: sinon.SinonSpy
    const requestId = '1234'

    beforeEach(() => {
        outboundChatApi = {
            sendChatPrompt: sinon.stub(),
            sendQuickActionCommand: sinon.stub(),
            tabAdded: sinon.stub(),
            tabChanged: sinon.stub(),
            tabRemoved: sinon.stub(),
            telemetry: sinon.stub(),
            insertToCursorPosition: sinon.stub(),
            copyToClipboard: sinon.stub(),
            authFollowUpClicked: sinon.stub(),
            followUpClicked: sinon.stub(),
            sendFeedback: sinon.stub(),
            linkClick: sinon.stub(),
            sourceLinkClick: sinon.stub(),
            infoLinkClick: sinon.stub(),
            uiReady: sinon.stub(),
            disclaimerAcknowledged: sinon.stub(),
            chatPromptOptionAcknowledged: sinon.stub(),
            onOpenTab: sinon.stub(),
            createPrompt: sinon.stub(),
            fileClick: sinon.stub(),
            listConversations: sinon.stub(),
            conversationClick: sinon.stub(),
            tabBarAction: sinon.stub(),
            onGetSerializedChat: sinon.stub(),
            promptInputOptionChange: sinon.stub(),
            stopChatResponse: sinon.stub(),
            sendButtonClickEvent: sinon.stub(),
            onOpenSettings: sinon.stub(),
        }

        messager = new Messager(outboundChatApi)
        onChatPromptSpy = sinon.spy(messager, 'onChatPrompt')
        onQuickActionSpy = sinon.spy(messager, 'onQuickActionCommand')
        onOpenTabSpy = sinon.spy(messager, 'onOpenTab')

        const tabFactory = new TabFactory({})
        createTabStub = sinon.stub(tabFactory, 'createTab')
        createTabStub.returns({})
        getChatItemsStub = sinon.stub(tabFactory, 'getChatItems')
        getChatItemsStub.returns([])
        const mynahUiResult = createMynahUi(messager, tabFactory, true, true, undefined, undefined, true)
        mynahUi = mynahUiResult[0]
        inboundChatApi = mynahUiResult[1]
        getSelectedTabIdStub = sinon.stub(mynahUi, 'getSelectedTabId')
        getAllTabsStub = sinon.stub(mynahUi, 'getAllTabs').returns({})
        updateStoreSpy = sinon.spy(mynahUi, 'updateStore')
        addChatItemSpy = sinon.spy(mynahUi, 'addChatItem')
        selectTabSpy = sinon.spy(mynahUi, 'selectTab')
        serializeChatStub = sinon.stub(mynahUi, 'serializeChat')
        notifySpy = sinon.spy(mynahUi, 'notify')
    })

    afterEach(() => {
        sinon.restore()

        Object.keys(mynahUi.getAllTabs()).forEach(tabId => {
            mynahUi.removeTab(tabId, (mynahUi as any).lastEventId)
        })
    })

    describe('handleChatPrompt', () => {
        it('should handle normal chat prompt', () => {
            const tabId = 'tab-1'
            const prompt = { prompt: 'Test prompt', escapedPrompt: 'Test prompt' }

            handleChatPrompt(mynahUi, tabId, prompt, messager, undefined, undefined, true)

            assert.notCalled(onQuickActionSpy)
            assert.calledWith(onChatPromptSpy, { prompt, tabId, context: undefined })
            assert.calledWith(addChatItemSpy, tabId, { type: ChatItemType.PROMPT, body: prompt.escapedPrompt })
            assert.calledWith(updateStoreSpy, tabId, {
                loadingChat: true,
                promptInputDisabledState: false,
                cancelButtonWhenLoading: true,
            })
            assert.calledWith(addChatItemSpy, tabId, { type: ChatItemType.ANSWER_STREAM })
        })

        it('should handle clear quick action', () => {
            const tabId = 'tab-1'
            const prompt = { prompt: 'Test prompt', escapedPrompt: 'Test prompt', command: '/clear' }

            handleChatPrompt(mynahUi, tabId, prompt, messager)

            assert.notCalled(onChatPromptSpy)
            assert.calledWith(onQuickActionSpy, { quickAction: prompt.command, prompt: prompt.prompt, tabId })
            assert.calledOnce(updateStoreSpy)
            assert.calledWith(updateStoreSpy.firstCall, tabId, { chatItems: [] })
        })

        it('should handle quick actions', () => {
            const tabId = 'tab-1'
            const prompt = { prompt: 'Test prompt', escapedPrompt: 'Test prompt', command: '/help' }

            handleChatPrompt(mynahUi, tabId, prompt, messager, undefined, undefined, true)

            assert.notCalled(onChatPromptSpy)
            assert.calledWith(onQuickActionSpy, {
                quickAction: prompt.command,
                prompt: DEFAULT_HELP_PROMPT,
                tabId,
            })
            assert.calledOnce(updateStoreSpy)
            assert.calledWith(updateStoreSpy, tabId, {
                loadingChat: true,
                promptInputDisabledState: false,
                cancelButtonWhenLoading: true,
            })
        })
    })

    describe('openTab', () => {
        it('should create a new tab with welcome messages if tabId not passed and previous messages not passed', () => {
            createTabStub.resetHistory()
            getChatItemsStub.resetHistory()

            inboundChatApi.openTab(requestId, {})

            sinon.assert.calledOnceWithExactly(createTabStub, false)
            sinon.assert.calledOnceWithExactly(getChatItemsStub, true, false, undefined)
            sinon.assert.notCalled(selectTabSpy)
            sinon.assert.calledOnce(onOpenTabSpy)
        })

        it('should create a new tab with messages if tabId is not passed and previous messages are passed', () => {
            const mockMessages: ChatMessage[] = [
                {
                    messageId: 'msg1',
                    body: 'Test message 1',
                    type: ChatItemType.PROMPT,
                },
                {
                    messageId: 'msg2',
                    body: 'Test message 2',
                    type: ChatItemType.ANSWER,
                },
            ]

            createTabStub.resetHistory()
            getChatItemsStub.resetHistory()

            inboundChatApi.openTab(requestId, {
                newTabOptions: {
                    data: {
                        messages: mockMessages,
                    },
                },
            })

            sinon.assert.calledOnceWithExactly(createTabStub, false)
            sinon.assert.calledOnceWithExactly(getChatItemsStub, false, false, mockMessages)
            sinon.assert.notCalled(selectTabSpy)
            sinon.assert.calledOnce(onOpenTabSpy)
        })

        it('should call onOpenTab if a new tab if tabId not passed and tab not created', () => {
            createTabStub.resetHistory()
            getChatItemsStub.resetHistory()
            updateStoreSpy.restore()
            sinon.stub(mynahUi, 'updateStore').returns(undefined)

            inboundChatApi.openTab(requestId, {})

            sinon.assert.calledOnceWithExactly(createTabStub, false)
            sinon.assert.notCalled(selectTabSpy)
            sinon.assert.calledOnceWithMatch(onOpenTabSpy, requestId, { type: 'InvalidRequest' })
        })

        it('should open existing tab if tabId passed and tabId not selected', () => {
            createTabStub.resetHistory()

            getSelectedTabIdStub.returns('1')
            const tabId = '2'

            inboundChatApi.openTab(requestId, { tabId })

            sinon.assert.notCalled(createTabStub)
            sinon.assert.calledOnceWithExactly(selectTabSpy, tabId)
            sinon.assert.calledOnceWithExactly(onOpenTabSpy, requestId, { tabId })
        })

        it('should not open existing tab if tabId passed but tabId already selected', () => {
            createTabStub.resetHistory()

            const tabId = '1'
            getSelectedTabIdStub.returns(tabId)

            inboundChatApi.openTab(requestId, { tabId })

            sinon.assert.notCalled(createTabStub)
            sinon.assert.notCalled(selectTabSpy)
            sinon.assert.calledOnceWithExactly(onOpenTabSpy, requestId, { tabId })
        })
    })

    describe('sendGenericCommand', () => {
        it('should create a new tab if none exits', () => {
            // clear create tab stub since set up process calls it twice
            createTabStub.resetHistory()
            const genericCommand = 'Explain'
            const selection = 'const x = 5;'
            const tabId = ''
            const triggerType = 'click'
            getSelectedTabIdStub.returns(undefined)
            inboundChatApi.sendGenericCommand({ genericCommand, selection, tabId, triggerType })

            sinon.assert.calledOnceWithExactly(createTabStub, false)
            sinon.assert.calledThrice(updateStoreSpy)
        })

        it('should create a new tab if current tab is loading', () => {
            // clear create tab stub since set up process calls it twice
            createTabStub.resetHistory()
            getAllTabsStub.returns({ 'tab-1': { store: { loadingChat: true } } })

            const genericCommand = 'Explain'
            const selection = 'const x = 5;'
            const tabId = 'tab-1'
            const triggerType = 'click'
            getSelectedTabIdStub.returns(tabId)
            inboundChatApi.sendGenericCommand({ genericCommand, selection, tabId, triggerType })

            sinon.assert.calledOnceWithExactly(createTabStub, false)
            sinon.assert.calledThrice(updateStoreSpy)
        })

        it('should not create a new tab if one exists already', () => {
            createTabStub.resetHistory()
            const genericCommand = 'Explain'
            const selection = 'const x = 5;'
            const tabId = 'tab-1'
            const triggerType = 'click'
            getSelectedTabIdStub.returns(tabId)
            inboundChatApi.sendGenericCommand({ genericCommand, selection, tabId, triggerType })

            sinon.assert.notCalled(createTabStub)
            sinon.assert.calledOnce(updateStoreSpy)
        })

        it('should call handleChatPrompt when sendGenericCommand is called', () => {
            const genericCommand = 'Explain'
            const selection = 'const x = 5;'
            const tabId = 'tab-1'
            const triggerType = 'click'
            const expectedPrompt = `${genericCommand} the following part of my code:\n~~~~\n${selection}\n~~~~\n`

            getSelectedTabIdStub.returns(tabId)

            inboundChatApi.sendGenericCommand({ genericCommand, selection, tabId, triggerType })

            assert.calledOnceWithMatch(onChatPromptSpy, {
                prompt: { prompt: expectedPrompt, escapedPrompt: expectedPrompt },
            })

            sinon.assert.calledTwice(addChatItemSpy)

            sinon.assert.calledWithMatch(addChatItemSpy.firstCall, tabId, {
                type: ChatItemType.PROMPT,
                body: expectedPrompt,
            })

            sinon.assert.calledWithMatch(addChatItemSpy.secondCall, tabId, {
                type: ChatItemType.ANSWER_STREAM,
            })

            sinon.assert.calledOnceWithMatch(updateStoreSpy, tabId, {
                loadingChat: true,
                promptInputDisabledState: false,
            })
        })
    })

    describe('onTabBarButtonClick', () => {
        it('should list conversations when Chat History button is clicked', () => {
            const listConversationsSpy = sinon.spy(messager, 'onListConversations')

            // @ts-ignore
            mynahUi.props.onTabBarButtonClick('tab-123', ChatHistory.TabBarButtonId)

            sinon.assert.calledOnce(listConversationsSpy)
        })

        it('should export conversation when Export button is clicked', () => {
            const listConversationsSpy = sinon.spy(messager, 'onTabBarAction')

            // @ts-ignore
            mynahUi.props.onTabBarButtonClick('tab-123', 'export')

            sinon.assert.calledOnceWithExactly(listConversationsSpy, {
                tabId: 'tab-123',
                action: 'export',
            })
        })
    })

    describe('conversationClicked result', () => {
        it('should list conversations if successfully deleted conversation', () => {
            const listConversationsSpy = sinon.spy(messager, 'onListConversations')

            // Successful conversation deletion
            inboundChatApi.conversationClicked({
                success: true,
                action: 'delete',
                id: 'test-conversation-id',
            })

            sinon.assert.calledOnce(listConversationsSpy)
        })
        it('should not list conversarions if conversartion click processing failed', () => {
            const listConversationsSpy = sinon.spy(messager, 'onListConversations')

            // Unsuccessful conversation deletion
            inboundChatApi.conversationClicked({
                success: false,
                action: 'delete',
                id: 'test-conversation-id',
            })

            sinon.assert.neverCalledWith(listConversationsSpy)
        })
    })

    describe('handlePromptInputChange', () => {
        it('should add pairProgrammingModeOn message when switching from off to on', () => {
            const tabId = 'tab-1'
            const getTabDataStub = sinon.stub(mynahUi, 'getTabData')
            getTabDataStub.returns({
                getStore: () => ({
                    // @ts-expect-error partial object
                    promptInputOptions: [{ id: 'pair-programmer-mode', value: 'false' }],
                }),
            })

            handlePromptInputChange(mynahUi, tabId, { 'pair-programmer-mode': 'true' })

            sinon.assert.calledWith(addChatItemSpy, tabId, pairProgrammingModeOn)
        })

        it('should add pairProgrammingModeOff message when switching from on to off', () => {
            const tabId = 'tab-1'
            const getTabDataStub = sinon.stub(mynahUi, 'getTabData')
            getTabDataStub.returns({
                getStore: () => ({
                    // @ts-expect-error partial object
                    promptInputOptions: [{ id: 'pair-programmer-mode', value: 'true' }],
                }),
            })

            handlePromptInputChange(mynahUi, tabId, { 'pair-programmer-mode': 'false' })

            sinon.assert.calledWith(addChatItemSpy, tabId, pairProgrammingModeOff)
        })

        it('should not add any message when pair programming mode is not changed', () => {
            const tabId = 'tab-1'
            const getTabDataStub = sinon.stub(mynahUi, 'getTabData')
            getTabDataStub.returns({
                getStore: () => ({
                    // @ts-expect-error partial object
                    promptInputOptions: [{ id: 'pair-programmer-mode', value: 'true' }],
                }),
            })

            addChatItemSpy.resetHistory()
            handlePromptInputChange(mynahUi, tabId, { 'pair-programmer-mode': 'true' })

            sinon.assert.notCalled(addChatItemSpy)
        })

        it('should update all promptInputOptions with new values', () => {
            const tabId = 'tab-1'
            const promptInputOptions = [
                { id: 'pair-programmer-mode', value: 'true' },
                { id: 'model-selection', value: 'auto' },
            ]
            const getTabDataStub = sinon.stub(mynahUi, 'getTabData')
            getTabDataStub.returns({
                getStore: () => ({
                    // @ts-expect-error partial object
                    promptInputOptions,
                }),
            })

            const newValues = {
                'pair-programmer-mode': 'true',
                'model-selection': BedrockModel.CLAUDE_3_5_SONNET_20241022_V2_0,
            }

            handlePromptInputChange(mynahUi, tabId, newValues)

            const expectedOptions = [
                { id: 'pair-programmer-mode', value: 'true' },
                { id: 'model-selection', value: BedrockModel.CLAUDE_3_5_SONNET_20241022_V2_0 },
            ]

            sinon.assert.calledWith(updateStoreSpy, tabId, {
                promptInputOptions: expectedOptions,
            })
        })
    })

    describe('getSerializedChat', () => {
        it('should return serialized chat content for supported formats', () => {
            const onGetSerializedChatSpy = sinon.spy(messager, 'onGetSerializedChat')
            serializeChatStub.returns('Test Serialized Chat')

            inboundChatApi.getSerializedChat(requestId, {
                format: 'markdown',
                tabId: 'tab-1',
            })

            sinon.assert.calledWith(onGetSerializedChatSpy, requestId, { content: 'Test Serialized Chat' })
        })

        it('should show an error if requested format is not supported', () => {
            const onGetSerializedChatSpy = sinon.spy(messager, 'onGetSerializedChat')
            serializeChatStub.returns('Test Serialized Chat')

            inboundChatApi.getSerializedChat(requestId, {
                // @ts-ignore
                format: 'unsupported-format',
                tabId: 'tab-1',
            })

            sinon.assert.calledWith(onGetSerializedChatSpy, requestId, {
                type: 'InvalidRequest',
                message: 'Failed to get serialized chat content, unsupported-format is not supported',
            })
            sinon.assert.calledWith(notifySpy, {
                content: `Failed to export chat`,
                type: NotificationType.ERROR,
            })
        })
    })
})

describe('withAdapter', () => {
    let mynahUi: MynahUI
    let mynahUIRef: { mynahUI: MynahUI | undefined }
    let chatClientAdapter: ChatClientAdapter

    beforeEach(() => {
        // Set up chat client adapter
        chatClientAdapter = {
            createChatEventHandler: newMynahUIRef => {
                mynahUIRef = newMynahUIRef

                return {}
            },
            isSupportedTab: sinon.stub().callsFake(tabId => tabId === 'supported-tab'),
            isSupportedQuickAction: sinon.stub().callsFake(command => command === '/supported-command'),
            handleMessageReceive: sinon.stub(),
            handleQuickAction: sinon.stub(),
        }

        // @ts-ignore
        const messager: Partial<Messager> = new Messager({
            uiReady: sinon.stub(),
            tabAdded: sinon.stub(),
            telemetry: sinon.stub(),
        } as OutboundChatApi)
        const tabFactory = new TabFactory({})
        const mynahUiResult = createMynahUi(
            messager as Messager,
            tabFactory,
            true,
            true,
            chatClientAdapter,
            undefined,
            true
        )
        mynahUi = mynahUiResult[0]
    })

    it('should instantiate and inject mynahUIRef to Adapter', () => {
        assert.match(mynahUIRef.mynahUI, mynahUi)
    })
})
