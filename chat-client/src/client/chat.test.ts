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

describe('Chat', () => {
    const sandbox = sinon.createSandbox()
    let clientApi: { postMessage: any }

    beforeEach(() => {
        clientApi = {
            postMessage: sandbox.stub(),
        }
    })

    afterEach(() => {
        sandbox.restore()
    })

    it('publishes ready event, when initialized', () => {
        createChat(clientApi)
        assert.calledOnceWithExactly(clientApi.postMessage, { command: READY_NOTIFICATION_METHOD })
    })

    it('publishes telemetry event, when send to prompt is triggered', () => {
        createChat(clientApi)

        const eventParams = { command: SEND_TO_PROMPT, params: { prompt: 'hey' } }
        const sendToPromptEvent = createInboundEvent(eventParams)
        window.dispatchEvent(sendToPromptEvent)

        assert.calledWithMatch(clientApi.postMessage, {
            command: TELEMETRY,
            params: {
                name: 'sendToPrompt',
                tabId: 'tab-1',
                ...eventParams.params,
            },
        })
    })

    it('publishes telemetry event, when show error is triggered', () => {
        createChat(clientApi)

        const errorEvent = createInboundEvent({ command: ERROR_MESSAGE, params: { tabId: '123' } })
        window.dispatchEvent(errorEvent)

        // assert.calledWithMatch(clientApi.postMessage, { command: TELEMETRY, params: {} })
    })

    it('publishes tab added event, when UI tab is added', () => {
        const mynahUi = createChat(clientApi)
        const tabId = mynahUi.updateStore('', {})

        assert.calledWithMatch(clientApi.postMessage, {
            command: TAB_ADD_NOTIFICATION_METHOD,
            params: { tabId: tabId },
        })
    })

    it('publishes tab removed event, when UI tab is removed', () => {
        const mynahUi = createChat(clientApi)
        const tabId = mynahUi.updateStore('', {})
        mynahUi.removeTab(tabId!, (mynahUi as any).lastEventId)

        assert.calledWithMatch(clientApi.postMessage, {
            command: TAB_REMOVE_NOTIFICATION_METHOD,
            params: { tabId: tabId },
        })
    })

    it('publishes tab changed event, when UI tab is changed ', () => {
        const mynahUi = createChat(clientApi)
        const tabId = mynahUi.updateStore('', {})
        mynahUi.updateStore('', {})
        mynahUi.selectTab(tabId!, (mynahUi as any).lastEventId)

        assert.calledWithMatch(clientApi.postMessage, {
            command: TAB_CHANGE_NOTIFICATION_METHOD,
            params: { tabId: tabId },
        })
    })

    it('generic command creates a chat request', () => {
        createChat(clientApi)

        const genericCommand = 'Fix'
        const selection = 'some code'
        const tabId = '123'
        const triggerType = 'click'
        const expectedPrompt = `${genericCommand} the following part of my code:\n~~~~\n${selection}\n~~~~`

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
        const chat = createChat(clientApi)
        const endMessageStreamStub = sinon.stub(chat, 'endMessageStream')
        const updateLastChatAnswerStub = sinon.stub(chat, 'updateLastChatAnswer')
        const updateStoreStub = sinon.stub(chat, 'updateStore')

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
        const chat = createChat(clientApi)
        const endMessageStreamStub = sinon.stub(chat, 'endMessageStream')
        const updateLastChatAnswerStub = sinon.stub(chat, 'updateLastChatAnswer')
        const updateStoreStub = sinon.stub(chat, 'updateStore')

        const tabId = '123'
        const body = 'some response'

        const chatEvent = createInboundEvent({
            command: CHAT_REQUEST_METHOD,
            tabId,
            params: { body },
            isPartialResult: true,
        })
        window.dispatchEvent(chatEvent)

        assert.calledOnceWithExactly(updateLastChatAnswerStub, tabId, { body })
        assert.notCalled(endMessageStreamStub)
        assert.notCalled(updateStoreStub)
    })

    function createInboundEvent(params: any) {
        const event = new CustomEvent('message') as any
        event.data = params
        return event
    }
})
