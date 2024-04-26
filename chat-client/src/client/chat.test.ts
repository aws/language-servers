import { injectJSDOM } from '../test/jsDomInjector'
// This needs to be run before all other imports so that mynah ui gets loaded inside of jsdom
injectJSDOM()

import { afterEach } from 'mocha'
import { assert } from 'sinon'
import { NEW_TAB_CREATED, TAB_CHANGED, TAB_REMOVED, UI_IS_READY } from '../contracts/serverContracts'
import { SEND_TO_PROMPT, TAB_ID_RECEIVED } from '../contracts/uiContracts'
import { createChat } from './chat'
import sinon = require('sinon')

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

    it('chat initialized publishes ready event', () => {
        createChat(clientApi)
        assert.calledOnceWithExactly(clientApi.postMessage, { command: UI_IS_READY })
    })

    it('send to prompt publishes telemetry event', () => {
        createChat(clientApi)

        const sendToPromptEvent = createInboundEvent({ command: SEND_TO_PROMPT, params: { prompt: 'hey' } })
        window.dispatchEvent(sendToPromptEvent)

        assert.calledWithMatch(clientApi.postMessage, { command: TAB_ID_RECEIVED })
    })

    it('UI tab add publishes tab added event', () => {
        const mynahUi = createChat(clientApi)
        const tabId = mynahUi.updateStore('', {})

        assert.calledWithMatch(clientApi.postMessage, { command: NEW_TAB_CREATED, params: { tabId: tabId } })
    })

    it('UI tab removed publishes tab removed event', () => {
        const mynahUi = createChat(clientApi)
        const tabId = mynahUi.updateStore('', {})
        mynahUi.removeTab(tabId!, (mynahUi as any).lastEventId)

        assert.calledWithMatch(clientApi.postMessage, { command: TAB_REMOVED, params: { tabId: tabId } })
    })

    it('UI tab changed publishes tab changed event', () => {
        const mynahUi = createChat(clientApi)
        const tabId = mynahUi.updateStore('', {})
        mynahUi.updateStore('', {})
        mynahUi.selectTab(tabId!, (mynahUi as any).lastEventId)

        assert.calledWithMatch(clientApi.postMessage, { command: TAB_CHANGED, params: { tabId: tabId } })
    })

    function createInboundEvent(params: any) {
        const event = new CustomEvent('message') as any
        event.data = params
        return event
    }
})
