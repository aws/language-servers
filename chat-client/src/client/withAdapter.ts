import { MynahUI, MynahUIProps } from '@aws/mynah-ui'
import { ChatClientAdapter, ChatEventHandler } from '../contracts/chatClientAdapter'
import { disclaimerAcknowledgeButtonId } from './texts/disclaimer'

type HandlerMethodName = keyof ChatEventHandler
type HandlerParameters<T extends HandlerMethodName> = Parameters<NonNullable<ChatEventHandler[T]>>

export const withAdapter = (
    defaultEventHandler: ChatEventHandler,
    mynahUIRef: { mynahUI: MynahUI | undefined },
    chatClientAdapter: ChatClientAdapter
): MynahUIProps => {
    // Inject reference to MynahUI object into external event handler.
    // This allows custom controllers to maintain drive Chat UI with custom, feature-specific logic.
    const customEventHandler: ChatEventHandler = chatClientAdapter.createChatEventHandler(mynahUIRef)
    if (!customEventHandler) {
        throw new Error('Custom ChatEventHandler is not defined')
    }

    // Add default routing logic for event handlers with tabId as first argument.
    const addDefaultRouting = (eventName: HandlerMethodName, defaultReturnValue?: any) => {
        // @ts-ignore
        return (...params) => {
            // tabId is always the first argument
            const tabId = params[0]
            if (chatClientAdapter.isSupportedTab(tabId)) {
                // @ts-ignore
                return customEventHandler[eventName]?.(...params) ?? defaultReturnValue
            }

            // @ts-ignore
            return defaultEventHandler[eventName]?.(...params) ?? defaultEventHandler
        }
    }

    const eventHandlerWithAdapter: ChatEventHandler = {
        onTabAdd: addDefaultRouting('onTabAdd'),
        onTabChange: addDefaultRouting('onTabChange'),
        onBeforeTabRemove: addDefaultRouting('onBeforeTabRemove', true),
        onTabRemove: addDefaultRouting('onTabRemove'),
        onStopChatResponse: addDefaultRouting('onStopChatResponse'),
        onLinkClick: addDefaultRouting('onLinkClick'),
        onSourceLinkClick: addDefaultRouting('onSourceLinkClick'),
        onInfoLinkClick: addDefaultRouting('onInfoLinkClick'),
        onCodeInsertToCursorPosition: addDefaultRouting('onCodeInsertToCursorPosition'),
        onCopyCodeToClipboard: addDefaultRouting('onCopyCodeToClipboard'),
        onCodeBlockActionClicked: addDefaultRouting('onCodeBlockActionClicked'),
        onFileClick: addDefaultRouting('onFileClick'),
        onFileActionClick: addDefaultRouting('onFileActionClick'),
        onVote: addDefaultRouting('onVote'),
        onSendFeedback: addDefaultRouting('onSendFeedback'),
        onFollowUpClicked: addDefaultRouting('onFollowUpClicked'),
        onCustomFormAction: addDefaultRouting('onCustomFormAction'),
        onQuickCommandGroupActionClick: addDefaultRouting('onQuickCommandGroupActionClick'),
        onChatItemEngagement: addDefaultRouting('onChatItemEngagement'),
        onShowMoreWebResultsClick: addDefaultRouting('onShowMoreWebResultsClick'),
        onChatPromptProgressActionButtonClicked: addDefaultRouting('onChatPromptProgressActionButtonClicked'),
        onTabbedContentTabChange: addDefaultRouting('onTabbedContentTabChange'),
        onPromptInputOptionChange: addDefaultRouting('onPromptInputOptionChange'),
        onMessageDismiss: addDefaultRouting('onMessageDismiss'),

        /**
         * Handler with special routing logic
         */

        onChatPrompt(tabId, prompt, eventId) {
            if (chatClientAdapter.isSupportedTab(tabId)) {
                customEventHandler.onChatPrompt?.(tabId, prompt, eventId)
                return
            }

            if (prompt.command && chatClientAdapter.isSupportedQuickAction(prompt.command)) {
                chatClientAdapter.handleQuickAction(prompt, tabId, eventId)
                return
            }

            defaultEventHandler.onChatPrompt?.(tabId, prompt, eventId)
        },

        onInBodyButtonClicked(tabId, messageId, action, eventId) {
            // Chat client already handles disclaimerAcknowledge action by default and sends message to IDE
            // https://github.com/aws/language-servers/blob/996a422665f95656a481a766c8facfd7636ba2ba/chat-client/src/client/chat.ts#L173-L175

            if (action.id === disclaimerAcknowledgeButtonId) {
                defaultEventHandler.onInBodyButtonClicked?.(tabId, messageId, action, eventId)
                return
            }

            if (chatClientAdapter.isSupportedTab(tabId)) {
                customEventHandler.onInBodyButtonClicked?.(tabId, messageId, action, eventId)
                return
            }

            defaultEventHandler.onInBodyButtonClicked?.(tabId, messageId, action, eventId)
        },

        // onFormTextualItemKeyPress has different API than rest on handlers in MynahUI
        onFormTextualItemKeyPress(event, formData, itemId, tabId, eventId) {
            if (chatClientAdapter.isSupportedTab(tabId)) {
                // Follow-up: Check if logic should be moved and be default in chat-client https://github.com/aws/aws-toolkit-vscode/blob/master/packages/core/src/amazonq/webview/ui/apps/cwChatConnector.ts#L163-L184
                return customEventHandler.onFormTextualItemKeyPress?.(event, formData, itemId, tabId, eventId) ?? false
            }

            return defaultEventHandler.onFormTextualItemKeyPress?.(event, formData, itemId, tabId, eventId) ?? false
        },

        onFormModifierEnterPress(formData, tabId, eventId) {
            if (chatClientAdapter.isSupportedTab(tabId)) {
                return customEventHandler.onFormModifierEnterPress?.(formData, tabId, eventId)
            }

            return defaultEventHandler.onFormModifierEnterPress?.(formData, tabId, eventId)
        },

        onContextSelected(contextItem, tabId, eventId) {
            if (chatClientAdapter.isSupportedTab(tabId)) {
                return customEventHandler.onContextSelected?.(contextItem, tabId, eventId) ?? false
            }

            return defaultEventHandler.onContextSelected?.(contextItem, tabId, eventId) ?? false
        },

        onFormLinkClick(link, mouseEvent, eventId) {
            // Always delegate onFormLinkClick to adapter, if handled exists, since it's not tied to specific tabId
            if (customEventHandler.onFormLinkClick) {
                customEventHandler.onFormLinkClick(link, mouseEvent, eventId)
                return
            }

            defaultEventHandler.onFormLinkClick?.(link, mouseEvent, eventId)
        },

        onTabBarButtonClick(tabId, buttonId) {
            // Always route tab bar actions to original handler
            defaultEventHandler.onTabBarButtonClick?.(tabId, buttonId)
        },

        onReady() {
            customEventHandler.onReady?.()
            defaultEventHandler.onReady?.()
        },

        onResetStore(tabId) {
            customEventHandler.onResetStore?.(tabId)
            defaultEventHandler.onResetStore?.(tabId)
        },

        onFocusStateChanged(focusState) {
            customEventHandler.onFocusStateChanged?.(focusState)
            defaultEventHandler.onFocusStateChanged?.(focusState)
        },
    }

    console.log('Set Chat events routing with custom client adapter')

    return eventHandlerWithAdapter
}
