import { injectJSDOM } from '../test/jsDomInjector'
// This needs to be run before all other imports so that mynah ui gets loaded inside of jsdom
injectJSDOM()

import { CHAT_OPTIONS, ERROR_MESSAGE, GENERIC_COMMAND, SEND_TO_PROMPT } from '@aws/chat-client-ui-types'
import {
    CHAT_REQUEST_METHOD,
    GET_SERIALIZED_CHAT_REQUEST_METHOD,
    OPEN_TAB_REQUEST_METHOD,
    READY_NOTIFICATION_METHOD,
    TAB_ADD_NOTIFICATION_METHOD,
    TAB_CHANGE_NOTIFICATION_METHOD,
    TAB_REMOVE_NOTIFICATION_METHOD,
} from '@aws/language-server-runtimes-types'
import { afterEach } from 'mocha'
import { assert } from 'sinon'
import { createChat } from './chat'
import * as sinon from 'sinon'
import { TELEMETRY } from '../contracts/serverContracts'
import {
    ERROR_MESSAGE_TELEMETRY_EVENT,
    SEND_TO_PROMPT_TELEMETRY_EVENT,
    TAB_ADD_TELEMETRY_EVENT,
} from '../contracts/telemetry'
import { MynahUI } from '@aws/mynah-ui'
import { TabFactory } from './tabs/tabFactory'
import { ChatClientAdapter } from '../contracts/chatClientAdapter'

describe('Chat', () => {
    const sandbox = sinon.createSandbox()
    const initialTabId = 'tab-1'
    let mynahUi: MynahUI
    let clientApi: { postMessage: sinon.SinonStub }

    before(() => {
        // Mock global observers for test environment
        // @ts-expect-error: mock implementation for testing
        global.ResizeObserver = null
        // @ts-expect-error: mock implementation for testing
        global.IntersectionObserver = null
        // @ts-expect-error: mock implementation for testing
        global.MutationObserver = null
    })

    beforeEach(() => {
        sandbox.stub(TabFactory, 'generateUniqueId').returns(initialTabId)
        sandbox.stub(TabFactory.prototype, 'enableHistory')
        sandbox.stub(TabFactory.prototype, 'enableExport')

        clientApi = {
            postMessage: sandbox.stub(),
        }

        mynahUi = createChat(clientApi, {
            agenticMode: true,
        })
    })

    afterEach(() => {
        sandbox.restore()

        Object.keys(mynahUi.getAllTabs()).forEach(tabId => {
            mynahUi.removeTab(tabId, (mynahUi as any).lastEventId)
        })
    })

    after(() => {
        // @ts-expect-error: mock implementation for testing
        global.ResizeObserver = undefined
        // @ts-expect-error: mock implementation for testing
        global.MutationObserver = undefined
    })

    it('publishes ready event when initialized', () => {
        assert.callCount(clientApi.postMessage, 4)

        assert.calledWithExactly(clientApi.postMessage.firstCall, {
            command: TELEMETRY,
            params: { name: 'enterFocus' },
        })
        assert.calledWithExactly(clientApi.postMessage.secondCall, { command: READY_NOTIFICATION_METHOD })

        assert.calledWithExactly(clientApi.postMessage.thirdCall, {
            command: TAB_ADD_NOTIFICATION_METHOD,
            params: { tabId: initialTabId },
        })

        assert.calledWithExactly(clientApi.postMessage.lastCall, {
            command: TELEMETRY,
            params: {
                triggerType: 'click',
                name: TAB_ADD_TELEMETRY_EVENT,
                tabId: initialTabId,
            },
        })
    })

    it('publishes telemetry event, when send to prompt is triggered', () => {
        const eventParams = { command: SEND_TO_PROMPT, params: { prompt: 'hey' } }
        const sendToPromptEvent = createInboundEvent(eventParams)
        window.dispatchEvent(sendToPromptEvent)

        assert.calledWithExactly(clientApi.postMessage, {
            command: TELEMETRY,
            params: {
                name: SEND_TO_PROMPT_TELEMETRY_EVENT,
                tabId: mynahUi.getSelectedTabId(),
                ...eventParams.params,
            },
        })
    })

    it('publishes telemetry event, when show error is triggered', () => {
        const eventParams = { command: ERROR_MESSAGE, params: { tabId: '123' } }
        const errorEvent = createInboundEvent(eventParams)
        window.dispatchEvent(errorEvent)

        assert.calledWithExactly(clientApi.postMessage, {
            command: TELEMETRY,
            params: {
                name: ERROR_MESSAGE_TELEMETRY_EVENT,
                ...eventParams.params,
            },
        })
    })

    it('publishes tab added event, when UI tab is added', () => {
        const tabId = mynahUi.updateStore('', {})

        assert.calledWithMatch(clientApi.postMessage, {
            command: TAB_ADD_NOTIFICATION_METHOD,
            params: { tabId: tabId },
        })
    })

    it('publishes tab removed event, when UI tab is removed', () => {
        const tabId = mynahUi.updateStore('', {})
        mynahUi.removeTab(tabId!, (mynahUi as any).lastEventId)

        assert.calledWithMatch(clientApi.postMessage, {
            command: TAB_REMOVE_NOTIFICATION_METHOD,
            params: { tabId: tabId },
        })
    })

    it('publishes tab changed event, when UI tab is changed', () => {
        const tabId = mynahUi.updateStore('', {})
        mynahUi.updateStore('', {})
        clientApi.postMessage.resetHistory()
        mynahUi.selectTab(tabId!, (mynahUi as any).lastEventId)

        assert.calledOnceWithExactly(clientApi.postMessage, {
            command: TAB_CHANGE_NOTIFICATION_METHOD,
            params: { tabId: tabId },
        })
    })

    it('generic command creates a chat request', () => {
        const genericCommand = 'Fix'
        const selection = 'some code'
        const tabId = '123'
        const triggerType = 'click'
        const expectedPrompt = `${genericCommand} the following part of my code:\n~~~~\n${selection}\n~~~~\n`

        const genericCommandEvent = createInboundEvent({
            command: GENERIC_COMMAND,
            params: { tabId, selection, triggerType, genericCommand },
        })

        window.dispatchEvent(genericCommandEvent)
        assert.calledWithMatch(clientApi.postMessage, {
            command: CHAT_REQUEST_METHOD,
            params: {
                prompt: {
                    prompt: expectedPrompt,
                    escapedPrompt: expectedPrompt,
                },
            },
        })
    })

    it('open tab requestId was propagated from inbound to outbound message', () => {
        const requestId = 'request-1234'

        const openTabEvent = createInboundEvent({
            command: OPEN_TAB_REQUEST_METHOD,
            params: {
                newTabOptions: {
                    data: {
                        messages: [],
                    },
                },
            },
            requestId: requestId,
        })
        window.dispatchEvent(openTabEvent)

        // Verify that postMessage was called with the correct requestId
        assert.calledWithExactly(clientApi.postMessage, {
            command: OPEN_TAB_REQUEST_METHOD,
            requestId,
            params: {
                success: true,
                result: sinon.match({
                    tabId: sinon.match.string,
                }),
            },
        })
    })

    it('complete chat response triggers ui events', () => {
        const endMessageStreamStub = sandbox.stub(mynahUi, 'endMessageStream')
        const updateStoreStub = sandbox.stub(mynahUi, 'updateStore')

        const tabId = '123'
        const body = 'some response'

        const chatEvent = createInboundEvent({
            command: CHAT_REQUEST_METHOD,
            tabId,
            params: { body },
        })
        window.dispatchEvent(chatEvent)

        assert.calledOnceWithExactly(endMessageStreamStub, tabId, '', {
            header: undefined,
            buttons: undefined,
            body: 'some response',
            followUp: {},
            relatedContent: undefined,
            canBeVoted: undefined,
            codeReference: undefined,
            fileList: undefined,
        })
        assert.calledOnceWithExactly(updateStoreStub, tabId, {
            loadingChat: false,
            promptInputDisabledState: false,
            cancelButtonWhenLoading: true,
        })
    })

    it('partial chat response triggers ui events', () => {
        const endMessageStreamStub = sandbox.stub(mynahUi, 'endMessageStream')
        const updateStoreStub = sandbox.stub(mynahUi, 'updateStore')

        const tabId = '123'
        const body = 'some response'

        const chatEvent = createInboundEvent({
            command: CHAT_REQUEST_METHOD,
            tabId,
            params: { body },
            isPartialResult: true,
        })
        window.dispatchEvent(chatEvent)
        assert.notCalled(endMessageStreamStub)
        assert.calledOnce(updateStoreStub)
    })

    it('partial chat response with header triggers ui events', () => {
        const endMessageStreamStub = sandbox.stub(mynahUi, 'endMessageStream')
        const updateStoreStub = sandbox.stub(mynahUi, 'updateStore')

        const tabId = '123'
        const body = 'some response'

        const contextList = {
            filePaths: ['file1', 'file2'],
            details: {
                file1: {
                    lineRanges: [{ first: 1, second: 2 }],
                },
            },
        }
        const params = { body, contextList }

        const mockHeader = {
            fileList: {
                fileTreeTitle: '',
                filePaths: ['file1', 'file2'],
                rootFolderTitle: 'Context',
                flatList: true,
                collapsed: true,
                hideFileCount: true,
                details: {
                    file1: {
                        label: 'line 1 - 2',
                        description: 'file1',
                        clickable: true,
                    },
                },
            },
        }

        const chatEvent = createInboundEvent({
            command: CHAT_REQUEST_METHOD,
            tabId,
            params,
            isPartialResult: true,
        })

        window.dispatchEvent(chatEvent)
        assert.notCalled(endMessageStreamStub)
        assert.calledOnce(updateStoreStub)
    })

    describe('chatOptions', () => {
        it('enables history and export features support', () => {
            const chatOptionsRequest = createInboundEvent({
                command: CHAT_OPTIONS,
                params: {
                    history: true,
                    export: true,
                },
            })
            window.dispatchEvent(chatOptionsRequest)

            // @ts-expect-error: accessing prototype method
            assert.called(TabFactory.prototype.enableHistory)
            // @ts-expect-error: accessing prototype method
            assert.called(TabFactory.prototype.enableExport)
        }).timeout(20000)

        it('does not enable history and export features support if flags are falsy', async () => {
            const chatOptionsRequest = createInboundEvent({
                command: CHAT_OPTIONS,
                params: {
                    history: false,
                    export: false,
                },
            })
            window.dispatchEvent(chatOptionsRequest)

            // @ts-expect-error: accessing prototype method
            assert.notCalled(TabFactory.prototype.enableHistory)
            // @ts-expect-error: accessing prototype method
            assert.notCalled(TabFactory.prototype.enableExport)
        }).timeout(20000)
    })

    describe('onGetSerializedChat', () => {
        it('getSerializedChat requestId was propagated from inbound to outbound message', () => {
            const requestId = 'request-1234'
            const tabId = mynahUi.updateStore('', {})

            const setSerializedChatEvent = createInboundEvent({
                command: GET_SERIALIZED_CHAT_REQUEST_METHOD,
                params: {
                    tabId: tabId,
                    format: 'markdown',
                },
                requestId: requestId,
            })
            window.dispatchEvent(setSerializedChatEvent)

            // Verify that postMessage was called with the correct requestId
            assert.calledWithExactly(clientApi.postMessage, {
                requestId,
                command: GET_SERIALIZED_CHAT_REQUEST_METHOD,
                params: {
                    success: true,
                    result: sinon.match({
                        content: sinon.match.string,
                    }),
                },
            })
        })
    })

    function createInboundEvent(params: any) {
        const event = new CustomEvent('message') as any
        event.data = params
        return event
    }

    describe('with client adapter', () => {
        it('should route inbound message to client adapter', () => {
            const handleMessageReceiveStub = sandbox.stub()
            const createChatEventHandlerStub = sandbox.stub().returns({})
            const clientAdapter: Partial<ChatClientAdapter> = {
                createChatEventHandler: createChatEventHandlerStub,
                handleMessageReceive: handleMessageReceiveStub,
                isSupportedTab: () => false,
            }
            mynahUi = createChat(
                clientApi,
                {
                    agenticMode: true,
                },
                clientAdapter as ChatClientAdapter
            )

            const tabId = '123'
            const body = 'some response'

            const chatEvent = createInboundEvent({
                command: CHAT_REQUEST_METHOD,
                tabId,
                params: { body },
                sender: 'ide-extension',
            })
            window.dispatchEvent(chatEvent)

            assert.calledOnce(handleMessageReceiveStub)
            assert.match(handleMessageReceiveStub.getCall(0).args[0].data, JSON.stringify(chatEvent.data))
        })
    })
})
