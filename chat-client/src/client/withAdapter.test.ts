import { afterEach, describe, it } from 'mocha'
import sinon from 'ts-sinon'
const assert = require('assert')
import { withAdapter } from './withAdapter'
import { ChatClientAdapter, ChatEventHandler } from '../contracts/chatClientAdapter'
import { MynahUI, MynahUIProps, RelevancyVoteType } from '@aws/mynah-ui'
import { disclaimerAcknowledgeButtonId } from './texts/disclaimer'

describe('withAdapter', () => {
    let defaultEventHandlers: ChatEventHandler
    let mynahUIRef: { mynahUI: MynahUI | undefined }
    let chatClientAdapter: ChatClientAdapter
    let customEventHandlers: ChatEventHandler
    let mynahUiPropsWithAdapter: MynahUIProps

    beforeEach(() => {
        // Set up base MynahUIProps with stub methods
        defaultEventHandlers = {
            onTabAdd: sinon.stub(),
            onTabChange: sinon.stub(),
            onBeforeTabRemove: sinon.stub().returns(true),
            onTabRemove: sinon.stub(),
            onChatPrompt: sinon.stub(),
            onStopChatResponse: sinon.stub(),
            onLinkClick: sinon.stub(),
            onSourceLinkClick: sinon.stub(),
            onInfoLinkClick: sinon.stub(),
            onCodeInsertToCursorPosition: sinon.stub(),
            onCopyCodeToClipboard: sinon.stub(),
            onCodeBlockActionClicked: sinon.stub(),
            onFileClick: sinon.stub(),
            onFileActionClick: sinon.stub(),
            onVote: sinon.stub(),
            onSendFeedback: sinon.stub(),
            onFollowUpClicked: sinon.stub(),
            onInBodyButtonClicked: sinon.stub(),
            onCustomFormAction: sinon.stub(),
            onFormTextualItemKeyPress: sinon.stub().returns(false),
            onQuickCommandGroupActionClick: sinon.stub(),
            onContextSelected: sinon.stub().returns(true),
            onChatItemEngagement: sinon.stub(),
            onShowMoreWebResultsClick: sinon.stub(),
            onChatPromptProgressActionButtonClicked: sinon.stub(),
            onTabbedContentTabChange: sinon.stub(),
            onFormLinkClick: sinon.stub(),
            onFormModifierEnterPress: sinon.stub(),
            onTabBarButtonClick: sinon.stub(),
            onReady: sinon.stub(),
            onResetStore: sinon.stub(),
            onFocusStateChanged: sinon.stub(),
        }

        // Set up MynahUI reference
        mynahUIRef = {
            mynahUI: {
                getSelectedTabId: sinon.stub().returns('tab-1'),
            } as unknown as MynahUI,
        }

        // Set up custom event handler with stub methods
        customEventHandlers = {
            onTabAdd: sinon.stub(),
            onTabChange: sinon.stub(),
            onBeforeTabRemove: sinon.stub().returns(true),
            onTabRemove: sinon.stub(),
            onChatPrompt: sinon.stub(),
            onStopChatResponse: sinon.stub(),
            onLinkClick: sinon.stub(),
            onSourceLinkClick: sinon.stub(),
            onInfoLinkClick: sinon.stub(),
            onCodeInsertToCursorPosition: sinon.stub(),
            onCopyCodeToClipboard: sinon.stub(),
            onCodeBlockActionClicked: sinon.stub(),
            onFileClick: sinon.stub(),
            onFileActionClick: sinon.stub(),
            onVote: sinon.stub(),
            onSendFeedback: sinon.stub(),
            onFollowUpClicked: sinon.stub(),
            onInBodyButtonClicked: sinon.stub(),
            onCustomFormAction: sinon.stub(),
            onFormTextualItemKeyPress: sinon.stub().returns(false),
            onQuickCommandGroupActionClick: sinon.stub(),
            onContextSelected: sinon.stub().returns(true),
            onChatItemEngagement: sinon.stub(),
            onShowMoreWebResultsClick: sinon.stub(),
            onChatPromptProgressActionButtonClicked: sinon.stub(),
            onTabbedContentTabChange: sinon.stub(),
            onFormLinkClick: sinon.stub(),
            onFormModifierEnterPress: sinon.stub(),
            onTabBarButtonClick: sinon.stub(),
            onReady: sinon.stub(),
            onResetStore: sinon.stub(),
            onFocusStateChanged: sinon.stub(),
        }

        // Set up chat client adapter
        chatClientAdapter = {
            createChatEventHandler: sinon.stub().returns(customEventHandlers),
            isSupportedTab: sinon.stub().callsFake(tabId => tabId === 'supported-tab'),
            isSupportedQuickAction: sinon.stub().callsFake(command => command === '/supported-command'),
            handleMessageReceive: sinon.stub(),
            handleQuickAction: sinon.stub(),
        }

        // Create the enhanced props
        mynahUiPropsWithAdapter = withAdapter(defaultEventHandlers, mynahUIRef, chatClientAdapter)
    })

    afterEach(() => {
        sinon.restore()
    })

    interface TestEventHandlerParams {
        handlerName: keyof ChatEventHandler
        args: any[]
        supportedTabId?: string
        unsupportedTabId?: string
    }

    const testEventHandler = ({
        handlerName,
        args,
        supportedTabId = 'supported-tab',
        unsupportedTabId = 'unsupported-tab',
    }: TestEventHandlerParams) => {
        describe(handlerName, () => {
            it(`should delegate ${handlerName} to custom handler for supported tabs`, () => {
                const handlerArgs = args.map(arg => (arg === '__TAB_ID__' ? supportedTabId : arg))

                ;(mynahUiPropsWithAdapter[handlerName] as Function)?.(...handlerArgs)

                sinon.assert.calledOnceWithExactly(
                    // @ts-ignore
                    customEventHandlers[handlerName] as sinon.SinonStub,
                    ...handlerArgs
                )
                sinon.assert.notCalled(defaultEventHandlers[handlerName] as sinon.SinonStub)
            })

            it(`should delegate ${handlerName} to original handler for unsupported tabs`, () => {
                const handlerArgs = args.map(arg => (arg === '__TAB_ID__' ? unsupportedTabId : arg))

                ;(mynahUiPropsWithAdapter[handlerName] as Function)?.(...handlerArgs)

                // @ts-ignore
                sinon.assert.notCalled(customEventHandlers[handlerName] as sinon.SinonStub)
                sinon.assert.calledOnceWithExactly(defaultEventHandlers[handlerName] as sinon.SinonStub, ...handlerArgs)
            })
        })
    }

    it('should throw error if custom event handler is not defined', () => {
        const invalidAdapter: ChatClientAdapter = {
            createChatEventHandler: sinon.stub().returns(undefined),
            isSupportedTab: sinon.stub(),
            isSupportedQuickAction: sinon.stub(),
            handleMessageReceive: sinon.stub(),
            handleQuickAction: sinon.stub(),
        }

        assert.throws(() => {
            withAdapter(defaultEventHandlers, mynahUIRef, invalidAdapter)
        }, new Error('Custom ChatEventHandler is not defined'))
    })

    describe('Standard Events routing on tabId as first argument', () => {
        testEventHandler({
            handlerName: 'onTabAdd',
            args: ['__TAB_ID__'],
        })

        testEventHandler({
            handlerName: 'onTabChange',
            args: ['__TAB_ID__'],
        })

        testEventHandler({
            handlerName: 'onTabRemove',
            args: ['__TAB_ID__'],
        })

        testEventHandler({
            handlerName: 'onStopChatResponse',
            args: ['__TAB_ID__'],
        })

        const mouseEvent = {
            preventDefault: sinon.stub(),
            stopPropagation: sinon.stub(),
            stopImmediatePropagation: sinon.stub(),
        } as unknown as MouseEvent

        testEventHandler({
            handlerName: 'onLinkClick',
            args: ['__TAB_ID__', 'message-1', 'https://example.com', mouseEvent, 'event-1'],
        })

        testEventHandler({
            handlerName: 'onSourceLinkClick',
            args: ['__TAB_ID__', 'message-1', 'https://example.com', mouseEvent, 'event-1'],
        })

        testEventHandler({
            handlerName: 'onInfoLinkClick',
            args: ['__TAB_ID__', 'https://example.com', mouseEvent, 'event-1'],
        })

        testEventHandler({
            handlerName: 'onCodeInsertToCursorPosition',
            args: [
                '__TAB_ID__',
                'message-1',
                'console.log("Hello")',
                'selection',
                [{ information: 'ref1' }],
                'event-1',
                1,
                2,
            ],
        })

        testEventHandler({
            handlerName: 'onCopyCodeToClipboard',
            args: [
                '__TAB_ID__',
                'message-1',
                'console.log("Hello")',
                'selection',
                [{ information: 'ref1' }],
                'event-1',
                1,
                2,
            ],
        })

        testEventHandler({
            handlerName: 'onCodeBlockActionClicked',
            args: [
                '__TAB_ID__',
                'message-1',
                'action-1',
                'data',
                'console.log("Hello")',
                'selection',
                [{ information: 'ref1' }],
                'event-1',
                1,
                2,
            ],
        })

        testEventHandler({
            handlerName: 'onFileClick',
            args: ['__TAB_ID__', '/path/to/file.js', false, 'message-1', 'event-1'],
        })

        testEventHandler({
            handlerName: 'onFileActionClick',
            args: ['__TAB_ID__', 'message-1', '/path/to/file.js', 'open', 'event-1'],
        })

        testEventHandler({
            handlerName: 'onVote',
            args: ['__TAB_ID__', 'message-1', RelevancyVoteType.UP, 'event-1'],
        })

        testEventHandler({
            handlerName: 'onSendFeedback',
            args: [
                '__TAB_ID__',
                {
                    messageId: 'feedback',
                    tabId: 'tab-id',
                    selectedOption: '1',
                    comment: 'Great service!',
                },
                'event-1',
            ],
        })

        testEventHandler({
            handlerName: 'onFollowUpClicked',
            args: ['__TAB_ID__', 'message-1', { pillText: 'Tell me more' }, 'event-1'],
        })

        testEventHandler({
            handlerName: 'onCustomFormAction',
            args: ['__TAB_ID__', { id: 'action-id' }, 'event-1'],
        })

        testEventHandler({
            handlerName: 'onQuickCommandGroupActionClick',
            args: ['__TAB_ID__', { id: 'action-id' }, 'event-1'],
        })

        testEventHandler({
            handlerName: 'onChatItemEngagement',
            args: [
                '__TAB_ID__',
                'message-1',
                {
                    onChatItemEngagement: 'interaction',
                    engagementDurationTillTrigger: 1,
                    totalMouseDistanceTraveled: { x: 1, y: 2 },
                },
                'event-1',
            ],
        })

        testEventHandler({
            handlerName: 'onShowMoreWebResultsClick',
            args: ['__TAB_ID__', 'message-1', 'event-1'],
        })

        testEventHandler({
            handlerName: 'onChatPromptProgressActionButtonClicked',
            args: [
                '__TAB_ID__',
                {
                    id: 'action-id',
                },
                'event-1',
            ],
        })

        testEventHandler({
            handlerName: 'onTabbedContentTabChange',
            args: ['__TAB_ID__', 'message-1', 'content-tab-1', 'event-1'],
        })
    })

    describe('Special Routing Logic', () => {
        it('should delegate onBeforeTabRemove to custom handler for supported tabs', () => {
            const result = mynahUiPropsWithAdapter.onBeforeTabRemove?.('supported-tab', 'event-1')

            sinon.assert.calledOnceWithExactly(
                customEventHandlers.onBeforeTabRemove as sinon.SinonStub,
                'supported-tab',
                'event-1'
            )
            sinon.assert.notCalled(defaultEventHandlers.onBeforeTabRemove as sinon.SinonStub)
            assert.equal(result, true)
        })

        describe('onChatPrompt', () => {
            it('should delegate onChatPrompt to custom handler for supported tabs', () => {
                const prompt = { prompt: 'Hello world', escapedPrompt: 'Hello world' }
                mynahUiPropsWithAdapter.onChatPrompt?.('supported-tab', prompt, 'event-1')

                sinon.assert.calledOnceWithExactly(
                    customEventHandlers.onChatPrompt as sinon.SinonStub,
                    'supported-tab',
                    prompt,
                    'event-1'
                )
                sinon.assert.notCalled(defaultEventHandlers.onChatPrompt as sinon.SinonStub)
            })

            it('should delegate quick action commands to adapter handler', () => {
                const prompt = { prompt: 'Test command', escapedPrompt: 'Test command', command: '/supported-command' }
                mynahUiPropsWithAdapter.onChatPrompt?.('unsupported-tab', prompt, 'event-1')

                sinon.assert.notCalled(customEventHandlers.onChatPrompt as sinon.SinonStub)
                sinon.assert.notCalled(defaultEventHandlers.onChatPrompt as sinon.SinonStub)
                sinon.assert.calledOnceWithExactly(
                    chatClientAdapter.handleQuickAction as sinon.SinonStub,
                    prompt,
                    'unsupported-tab',
                    'event-1'
                )
            })

            it('should delegate onChatPrompt to original handler for unsupported tabs and commands', () => {
                const prompt = { prompt: 'Hello world', escapedPrompt: 'Hello world' }
                mynahUiPropsWithAdapter.onChatPrompt?.('unsupported-tab', prompt, 'event-1')

                sinon.assert.notCalled(customEventHandlers.onChatPrompt as sinon.SinonStub)
                sinon.assert.calledOnceWithExactly(
                    defaultEventHandlers.onChatPrompt as sinon.SinonStub,
                    'unsupported-tab',
                    prompt,
                    'event-1'
                )
            })
        })

        describe('onInBodyButtonClicked', () => {
            it('should delegate onInBodyButtonClicked to original handler for disclaimerAcknowledge action', () => {
                const action = { id: disclaimerAcknowledgeButtonId, text: 'Click me' }

                mynahUiPropsWithAdapter.onInBodyButtonClicked?.('supported-tab', 'message-1', action, 'event-1')

                sinon.assert.notCalled(customEventHandlers.onInBodyButtonClicked as sinon.SinonStub)
                sinon.assert.calledOnceWithExactly(
                    defaultEventHandlers.onInBodyButtonClicked as sinon.SinonStub,
                    'supported-tab',
                    'message-1',
                    action,
                    'event-1'
                )
            })

            it('should delegate onInBodyButtonClicked to custom handler for supported tabs', () => {
                const action = { id: 'button-1', text: 'Click me' }

                mynahUiPropsWithAdapter.onInBodyButtonClicked?.('supported-tab', 'message-1', action, 'event-1')

                sinon.assert.calledOnceWithExactly(
                    customEventHandlers.onInBodyButtonClicked as sinon.SinonStub,
                    'supported-tab',
                    'message-1',
                    action,
                    'event-1'
                )
                sinon.assert.notCalled(defaultEventHandlers.onInBodyButtonClicked as sinon.SinonStub)
            })

            it('should delegate onInBodyButtonClicked to original handler for unsupported tab', () => {
                const action = { id: 'button-1', text: 'Click me' }

                mynahUiPropsWithAdapter.onInBodyButtonClicked?.('unsupported-tab', 'message-1', action, 'event-1')

                sinon.assert.notCalled(customEventHandlers.onInBodyButtonClicked as sinon.SinonStub)
                sinon.assert.calledOnceWithExactly(
                    defaultEventHandlers.onInBodyButtonClicked as sinon.SinonStub,
                    'unsupported-tab',
                    'message-1',
                    action,
                    'event-1'
                )
            })
        })

        describe('onFormTextualItemKeyPress', () => {
            it('should delegate onFormTextualItemKeyPress to custom handler for supported tabs', () => {
                const event = { key: 'Enter' } as unknown as KeyboardEvent
                const formData = { input: 'test' }

                mynahUiPropsWithAdapter.onFormTextualItemKeyPress?.(
                    event,
                    formData,
                    'item-1',
                    'supported-tab',
                    'event-1'
                )

                sinon.assert.calledOnceWithExactly(
                    customEventHandlers.onFormTextualItemKeyPress as sinon.SinonStub,
                    event,
                    formData,
                    'item-1',
                    'supported-tab',
                    'event-1'
                )
                sinon.assert.notCalled(defaultEventHandlers.onFormTextualItemKeyPress as sinon.SinonStub)
            })

            it('should delegate onFormTextualItemKeyPress to original handler for unsupported tabs', () => {
                const event = { key: 'Enter' } as unknown as KeyboardEvent
                const formData = { input: 'test' }

                mynahUiPropsWithAdapter.onFormTextualItemKeyPress?.(
                    event,
                    formData,
                    'item-1',
                    'unsupported-tab',
                    'event-1'
                )

                sinon.assert.notCalled(customEventHandlers.onFormTextualItemKeyPress as sinon.SinonStub)
                sinon.assert.calledOnceWithExactly(
                    defaultEventHandlers.onFormTextualItemKeyPress as sinon.SinonStub,
                    event,
                    formData,
                    'item-1',
                    'unsupported-tab',
                    'event-1'
                )
            })
        })

        describe('onFormModifierEnterPress', () => {
            it('should delegate onFormModifierEnterPress to custom handler for supported tabs', () => {
                const formData = { input: 'test' }

                mynahUiPropsWithAdapter.onFormModifierEnterPress?.(formData, 'supported-tab', 'event-1')

                sinon.assert.calledOnceWithExactly(
                    customEventHandlers.onFormModifierEnterPress as sinon.SinonStub,
                    formData,
                    'supported-tab',
                    'event-1'
                )
                sinon.assert.notCalled(defaultEventHandlers.onFormModifierEnterPress as sinon.SinonStub)
            })

            it('should delegate onFormModifierEnterPress to original handler for unsupported tabs', () => {
                const formData = { input: 'test' }

                mynahUiPropsWithAdapter.onFormModifierEnterPress?.(formData, 'unsupported-tab', 'event-1')

                sinon.assert.notCalled(customEventHandlers.onFormModifierEnterPress as sinon.SinonStub)
                sinon.assert.calledOnceWithExactly(
                    defaultEventHandlers.onFormModifierEnterPress as sinon.SinonStub,
                    formData,
                    'unsupported-tab',
                    'event-1'
                )
            })
        })

        describe('onContextSelected', () => {
            it('should delegate onContextSelected to custom handler for supported tabs', () => {
                const contextItem = { command: 'command-1' }

                mynahUiPropsWithAdapter.onContextSelected?.(contextItem, 'supported-tab', 'event-1')

                sinon.assert.calledOnceWithExactly(
                    customEventHandlers.onContextSelected as sinon.SinonStub,
                    contextItem,
                    'supported-tab',
                    'event-1'
                )
                sinon.assert.notCalled(defaultEventHandlers.onContextSelected as sinon.SinonStub)
            })

            it('should delegate onContextSelected to original handler for unsupported tabs', () => {
                const contextItem = { command: 'command-1' }

                mynahUiPropsWithAdapter.onContextSelected?.(contextItem, 'unsupported-tab', 'event-1')

                sinon.assert.notCalled(customEventHandlers.onContextSelected as sinon.SinonStub)
                sinon.assert.calledOnceWithExactly(
                    defaultEventHandlers.onContextSelected as sinon.SinonStub,
                    contextItem,
                    'unsupported-tab',
                    'event-1'
                )
            })
        })

        describe('onFormLinkClick', () => {
            const mouseEvent = { preventDefault: sinon.stub() } as unknown as MouseEvent

            it('should delegate onFormLinkClick to custom handler if it exists', () => {
                mynahUiPropsWithAdapter.onFormLinkClick?.('https://example.com', mouseEvent, 'event-1')

                sinon.assert.calledOnceWithExactly(
                    customEventHandlers.onFormLinkClick as sinon.SinonStub,
                    'https://example.com',
                    mouseEvent,
                    'event-1'
                )
                sinon.assert.notCalled(defaultEventHandlers.onFormLinkClick as sinon.SinonStub)
            })

            it('should delegate onFormLinkClick to original handler if adapter handler does not exist', () => {
                const onFormLinkClickStub = sinon.stub()
                const mynahUiPropsWithAdapter = withAdapter(
                    {
                        onFormLinkClick: onFormLinkClickStub,
                    },
                    mynahUIRef,
                    // @ts-ignore
                    {
                        createChatEventHandler: () => ({}),
                    }
                )

                const customOnFormLinkClickHandler = customEventHandlers.onFileActionClick
                customEventHandlers.onFileActionClick = undefined

                mynahUiPropsWithAdapter.onFormLinkClick?.('https://example.com', mouseEvent, 'event-1')

                sinon.assert.notCalled(customOnFormLinkClickHandler as sinon.SinonStub)
                sinon.assert.calledOnceWithExactly(onFormLinkClickStub, 'https://example.com', mouseEvent, 'event-1')
            })
        })

        it('should call route onTabBarButtonClick only to default handler', () => {
            mynahUiPropsWithAdapter.onTabBarButtonClick?.('tab-1', 'button-1')

            sinon.assert.notCalled(customEventHandlers.onTabBarButtonClick as sinon.SinonStub)
            sinon.assert.calledOnceWithMatch(
                defaultEventHandlers.onTabBarButtonClick as sinon.SinonStub,
                'tab-1',
                'button-1'
            )
        })

        it('should call both custom and original onReady handlers', () => {
            mynahUiPropsWithAdapter.onReady?.()

            sinon.assert.calledOnce(customEventHandlers.onReady as sinon.SinonStub)
            sinon.assert.calledOnce(defaultEventHandlers.onReady as sinon.SinonStub)
        })

        it('should call both custom and original onResetStore handlers', () => {
            mynahUiPropsWithAdapter.onResetStore?.('tab-1')

            sinon.assert.calledOnceWithExactly(customEventHandlers.onResetStore as sinon.SinonStub, 'tab-1')
            sinon.assert.calledOnceWithExactly(defaultEventHandlers.onResetStore as sinon.SinonStub, 'tab-1')
        })

        it('should call both custom and original onFocusStateChanged handlers', () => {
            ;(mynahUIRef.mynahUI?.getSelectedTabId as sinon.SinonStub).returns('supported-tab')

            mynahUiPropsWithAdapter.onFocusStateChanged?.(true)

            sinon.assert.calledOnceWithExactly(customEventHandlers.onFocusStateChanged as sinon.SinonStub, true)
            sinon.assert.calledOnceWithExactly(defaultEventHandlers.onFocusStateChanged as sinon.SinonStub, true)
        })
    })
})
