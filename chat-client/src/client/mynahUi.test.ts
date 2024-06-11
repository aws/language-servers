import { before, afterEach } from 'mocha'
import sinon = require('sinon')
import { assert } from 'sinon'
import { createMynahUi, InboundChatApi, handleChatPrompt } from './mynahUi'
import { Messager, OutboundChatApi } from './messager'
import { TabFactory } from './tabs/tabFactory'
import { ChatItemType, MynahUI } from '@aws/mynah-ui'

describe('MynahUI', () => {
    let messager: Messager
    let mynahUi: MynahUI
    let inboundChatApi: InboundChatApi
    let outboundChatApi: OutboundChatApi

    let getSelectedTabIdStub: sinon.SinonStub
    let createTabStub: sinon.SinonStub
    let updateStoreSpy: sinon.SinonSpy
    let addChatItemSpy: sinon.SinonSpy
    let onChatPromptSpy: sinon.SinonSpy
    let onQuickActionSpy: sinon.SinonSpy

    before(() => {
        outboundChatApi = {
            sendChatPrompt: sinon.stub(),
            sendQuickActionCommand: sinon.stub(),
            tabAdded: sinon.stub(),
            tabChanged: sinon.stub(),
            tabRemoved: sinon.stub(),
            telemetry: sinon.stub(),
            insertToCursorPosition: sinon.stub(),
            authFollowUpClicked: sinon.stub(),
            followUpClicked: sinon.stub(),
            sendFeedback: sinon.stub(),
            linkClick: sinon.stub(),
            sourceLinkClick: sinon.stub(),
            infoLinkClick: sinon.stub(),
            uiReady: sinon.stub(),
        }

        messager = new Messager(outboundChatApi)
        onChatPromptSpy = sinon.spy(messager, 'onChatPrompt')
        onQuickActionSpy = sinon.spy(messager, 'onQuickActionCommand')

        const tabFactory = new TabFactory({})
        createTabStub = sinon.stub(tabFactory, 'createTab')
        createTabStub.returns({})
        const mynahUiResult = createMynahUi(messager, tabFactory)
        mynahUi = mynahUiResult[0]
        inboundChatApi = mynahUiResult[1]
        getSelectedTabIdStub = sinon.stub(mynahUi, 'getSelectedTabId')
        updateStoreSpy = sinon.spy(mynahUi, 'updateStore')
        addChatItemSpy = sinon.spy(mynahUi, 'addChatItem')
    })

    afterEach(() => {
        sinon.resetHistory()
    })

    describe('handleChatPrompt', () => {
        it('should handle normal chat prompt', () => {
            const tabId = 'tab-1'
            const prompt = { prompt: 'Test prompt', escapedPrompt: 'Test prompt' }

            handleChatPrompt(mynahUi, tabId, prompt, messager)

            assert.notCalled(onQuickActionSpy)
            assert.calledWith(onChatPromptSpy, { prompt, tabId })
            assert.calledWith(addChatItemSpy, tabId, { type: ChatItemType.PROMPT, body: prompt.escapedPrompt })
            assert.calledWith(updateStoreSpy, tabId, { loadingChat: true, promptInputDisabledState: true })
            assert.calledWith(addChatItemSpy, tabId, { type: ChatItemType.ANSWER_STREAM })
        })

        it('should handle clear quick action', () => {
            const tabId = 'tab-1'
            const prompt = { prompt: 'Test prompt', escapedPrompt: 'Test prompt', command: '/clear' }

            handleChatPrompt(mynahUi, tabId, prompt, messager)

            assert.notCalled(onChatPromptSpy)
            assert.calledWith(onQuickActionSpy, { quickAction: prompt.command, prompt: prompt.prompt, tabId })
            assert.calledThrice(updateStoreSpy)
            assert.calledWith(updateStoreSpy.firstCall, tabId, { chatItems: [] })
            assert.calledWith(updateStoreSpy.secondCall, tabId, { loadingChat: false, promptInputDisabledState: false })
            assert.calledWith(updateStoreSpy.thirdCall, tabId, { loadingChat: true, promptInputDisabledState: true })
        })

        it('should handle quick actions', () => {
            const tabId = 'tab-1'
            const prompt = { prompt: 'Test prompt', escapedPrompt: 'Test prompt', command: '/help' }

            handleChatPrompt(mynahUi, tabId, prompt, messager)

            assert.notCalled(onChatPromptSpy)
            assert.calledWith(onQuickActionSpy, { quickAction: prompt.command, prompt: prompt.prompt, tabId })
            assert.calledOnce(updateStoreSpy)
            assert.calledWith(updateStoreSpy, tabId, { loadingChat: true, promptInputDisabledState: true })
        })
    })

    describe('sendGenericCommand', () => {
        it('should create a new tab if none exits', () => {
            const genericCommand = 'Explain'
            const selection = 'const x = 5;'
            const tabId = ''
            const triggerType = 'click'
            getSelectedTabIdStub.returns(undefined)
            inboundChatApi.sendGenericCommand({ genericCommand, selection, tabId, triggerType })

            sinon.assert.calledWithMatch(createTabStub.lastCall, false)
            sinon.assert.calledTwice(updateStoreSpy)
        })

        it('should not create a new tab if one exits already', () => {
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
            const expectedPrompt = `${genericCommand} the following part of my code:\n~~~~\n${selection}\n~~~~`

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
                promptInputDisabledState: true,
            })
        })
    })
})
