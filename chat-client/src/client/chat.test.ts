import { injectJSDOM } from '../test/jsDomInjector'
// This needs to be run before all other imports so that mynah ui gets loaded inside of jsdom
injectJSDOM()

import { ERROR_MESSAGE, GENERIC_COMMAND, SEND_TO_PROMPT } from '@aws/chat-client-ui-types'
import {
    CHAT_REQUEST_METHOD,
    READY_NOTIFICATION_METHOD,
    TAB_ADD_NOTIFICATION_METHOD,
    TAB_CHANGE_NOTIFICATION_METHOD,
    TAB_REMOVE_NOTIFICATION_METHOD,
} from '@aws/language-server-runtimes-types'
import { afterEach } from 'mocha'
import { assert } from 'sinon'
import { createChat } from './chat'
import sinon = require('sinon')
import { TELEMETRY } from '../contracts/serverContracts'
import {
    ERROR_MESSAGE_TELEMETRY_EVENT,
    SEND_TO_PROMPT_TELEMETRY_EVENT,
    TAB_ADD_TELEMETRY_EVENT,
} from '../contracts/telemetry'
import { MynahUI } from '@aws/mynah-ui'
import { TabFactory } from './tabs/tabFactory'

describe('Chat', () => {
    const sandbox = sinon.createSandbox()
    const initialTabId = 'tab-1'
    let mynahUi: MynahUI
    let clientApi: { postMessage: sinon.SinonStub }

    before(() => {
        // Mock global observers for test environment
        // @ts-ignore
        global.ResizeObserver = null
        // @ts-ignore
        global.IntersectionObserver = null
    })

    beforeEach(() => {
        sandbox.stub(TabFactory, 'generateUniqueId').returns(initialTabId)

        clientApi = {
            postMessage: sandbox.stub(),
        }

        mynahUi = createChat(clientApi)
    })

    afterEach(() => {
        sandbox.restore()

        Object.keys(mynahUi.getAllTabs()).forEach(tabId => {
            mynahUi.removeTab(tabId, (mynahUi as any).lastEventId)
        })
    })

    after(() => {
        // @ts-ignore
        global.ResizeObserver = undefined
    })

    it('publishes ready event and initial tab add event, when initialized', () => {
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

    it('publishes tab changed event, when UI tab is changed ', () => {
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

    it('complete chat response triggers ui events ', () => {
        const endMessageStreamStub = sandbox.stub(mynahUi, 'endMessageStream')
        const updateLastChatAnswerStub = sandbox.stub(mynahUi, 'updateLastChatAnswer')
        const updateStoreStub = sandbox.stub(mynahUi, 'updateStore')

        const tabId = '123'
        const body = 'some response'

        const chatEvent = createInboundEvent({
            command: CHAT_REQUEST_METHOD,
            tabId,
            params: { body },
        })
        window.dispatchEvent(chatEvent)

        assert.calledOnceWithExactly(endMessageStreamStub, tabId, '')
        assert.calledOnceWithMatch(updateLastChatAnswerStub, tabId, { body })
        assert.calledOnceWithExactly(updateStoreStub, tabId, {
            loadingChat: false,
            promptInputDisabledState: false,
        })
    })

    it('partial chat response triggers ui events ', () => {
        const endMessageStreamStub = sandbox.stub(mynahUi, 'endMessageStream')
        const updateLastChatAnswerStub = sandbox.stub(mynahUi, 'updateLastChatAnswer')
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

        assert.calledOnceWithExactly(updateLastChatAnswerStub, tabId, { body, header: undefined })
        assert.notCalled(endMessageStreamStub)
        assert.notCalled(updateStoreStub)
    })

    function createInboundEvent(params: any) {
        const event = new CustomEvent('message') as any
        event.data = params
        return event
    }
})
