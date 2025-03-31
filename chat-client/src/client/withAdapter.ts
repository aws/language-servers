import { MynahUI, MynahUIProps } from '@aws/mynah-ui'
import { ChatClientAdapter } from '../contracts/chatClientAdapter'

export const withAdapter = (
    mynahUiProps: MynahUIProps,
    mynahUIRef: { mynahUI: MynahUI | undefined },
    chatClientAdapter: ChatClientAdapter
): MynahUIProps => {
    const customEventHandler = chatClientAdapter.createChatEventHandler(mynahUIRef)
    if (!customEventHandler) {
        throw new Error('Custom ChatEventHandler is not defined')
    }

    const mynahUiPropsWithAdapter: MynahUIProps = {
        ...mynahUiProps,

        /**
         * ======== Tab Management ========
         */

        onTabAdd(tabId) {
            if (chatClientAdapter.isSupportedTab(tabId)) {
                customEventHandler.onTabAdd?.(tabId)
                return
            }

            mynahUiProps.onTabAdd?.(tabId)
        },

        onTabChange(tabId) {
            if (chatClientAdapter.isSupportedTab(tabId)) {
                customEventHandler.onTabChange?.(tabId)
                return
            }

            mynahUiProps.onTabChange?.(tabId)
        },

        onBeforeTabRemove(tabId, eventId) {
            if (chatClientAdapter.isSupportedTab(tabId)) {
                return customEventHandler.onBeforeTabRemove?.(tabId) ?? true
            }

            return mynahUiProps.onBeforeTabRemove?.(tabId, eventId) ?? true
        },

        onTabRemove(tabId) {
            if (chatClientAdapter.isSupportedTab(tabId)) {
                customEventHandler.onTabRemove?.(tabId)
                return
            }

            mynahUiProps.onTabRemove?.(tabId)
        },

        /**
         * ======== Chat Interaction ========
         */

        onChatPrompt(tabId, prompt, eventId) {
            if (chatClientAdapter.isSupportedTab(tabId)) {
                customEventHandler.onChatPrompt?.(tabId, {
                    chatMessage: prompt.prompt ?? '',
                })
                return
            }

            if (prompt.command && chatClientAdapter.isSupportedQuickAction(prompt.command)) {
                chatClientAdapter.handleQuickAction(prompt, tabId, eventId)
                return
            }

            mynahUiProps.onChatPrompt?.(tabId, prompt, eventId)
        },

        onStopChatResponse(tabId, eventId) {
            if (chatClientAdapter.isSupportedTab(tabId)) {
                customEventHandler.onStopChatResponse?.(tabId)
                return
            }

            mynahUiProps.onStopChatResponse?.(tabId, eventId)
        },

        /**
         * ======== Link Handling ========
         */

        onLinkClick(tabId, messageId, link, mouseEvent, eventId) {
            if (chatClientAdapter.isSupportedTab(tabId)) {
                mouseEvent?.preventDefault()
                mouseEvent?.stopPropagation()
                mouseEvent?.stopImmediatePropagation()
                customEventHandler.onLinkClick?.(tabId, messageId, link)
                return
            }

            mynahUiProps.onLinkClick?.(tabId, messageId, link, mouseEvent, eventId)
        },

        onSourceLinkClick(tabId, messageId, link, mouseEvent, eventId) {
            if (chatClientAdapter.isSupportedTab(tabId)) {
                mouseEvent?.preventDefault()
                mouseEvent?.stopPropagation()
                mouseEvent?.stopImmediatePropagation()
                customEventHandler.onSourceLinkClick?.(tabId, messageId, link)
                return
            }

            mynahUiProps.onSourceLinkClick?.(tabId, messageId, link, mouseEvent, eventId)
        },

        onInfoLinkClick(tabId, link, mouseEvent, eventId) {
            if (chatClientAdapter.isSupportedTab(tabId)) {
                mouseEvent?.preventDefault()
                mouseEvent?.stopPropagation()
                mouseEvent?.stopImmediatePropagation()
                customEventHandler.onInfoLinkClick?.(tabId, link)
                return
            }

            mynahUiProps.onInfoLinkClick?.(tabId, link, mouseEvent, eventId)
        },

        /**
         * ======== Code Interaction ========
         */

        onCodeInsertToCursorPosition(
            tabId,
            messageId,
            code,
            type,
            referenceTrackerInformation,
            eventId,
            codeBlockIndex,
            totalCodeBlocks
        ) {
            if (chatClientAdapter.isSupportedTab(tabId)) {
                customEventHandler.onCodeInsertToCursorPosition?.(
                    tabId,
                    messageId,
                    code,
                    type,
                    referenceTrackerInformation,
                    eventId,
                    codeBlockIndex,
                    totalCodeBlocks
                )
                return
            }

            mynahUiProps.onCodeInsertToCursorPosition?.(
                tabId,
                messageId,
                code,
                type,
                referenceTrackerInformation,
                eventId,
                codeBlockIndex,
                totalCodeBlocks
            )
        },

        onCopyCodeToClipboard(
            tabId,
            messageId,
            code,
            type,
            referenceTrackerInformation,
            eventId,
            codeBlockIndex,
            totalCodeBlocks
        ) {
            if (chatClientAdapter.isSupportedTab(tabId)) {
                // Custom IDE logic https://github.com/aws/aws-toolkit-vscode/blob/master/packages/core/src/amazonq/webview/ui/connector.ts#L442-L483
                customEventHandler.onCopyCodeToClipboard?.(
                    tabId,
                    messageId,
                    code,
                    type,
                    referenceTrackerInformation,
                    eventId,
                    codeBlockIndex,
                    totalCodeBlocks
                )
                return
            }

            mynahUiProps.onCopyCodeToClipboard?.(
                tabId,
                messageId,
                code,
                type,
                referenceTrackerInformation,
                eventId,
                codeBlockIndex,
                totalCodeBlocks
            )
        },

        onCodeBlockActionClicked(
            tabId,
            messageId,
            actionId,
            data,
            code,
            type,
            referenceTrackerInformation,
            eventId,
            codeBlockIndex,
            totalCodeBlocks
        ) {
            if (chatClientAdapter.isSupportedTab(tabId)) {
                // TODO: IDE Connector need to be hooked to handle this event https://github.com/aws/aws-toolkit-vscode/blob/master/packages/core/src/amazonq/webview/ui/main.ts#L836-L867
                customEventHandler.onCodeBlockActionClicked?.(
                    tabId,
                    messageId,
                    actionId,
                    data,
                    code,
                    type,
                    referenceTrackerInformation,
                    eventId,
                    codeBlockIndex,
                    totalCodeBlocks
                )
                return
            }

            mynahUiProps.onCodeBlockActionClicked?.(
                tabId,
                messageId,
                actionId,
                data,
                code,
                type,
                referenceTrackerInformation,
                eventId,
                codeBlockIndex,
                totalCodeBlocks
            )
        },

        /**
         * ======== File Operations ========
         */

        onFileClick(tabId, filePath, deleted, messageId, eventId) {
            if (chatClientAdapter.isSupportedTab(tabId)) {
                customEventHandler.onFileClick?.(tabId, filePath, deleted, messageId)
                return
            }

            mynahUiProps.onFileClick?.(tabId, filePath, deleted, messageId, eventId)
        },

        onFileActionClick(tabId, messageId, filePath, actionName, eventId) {
            if (chatClientAdapter.isSupportedTab(tabId)) {
                customEventHandler.onFileActionClick?.(tabId, messageId, filePath, actionName)
                return
            }

            mynahUiProps.onFileActionClick?.(tabId, messageId, filePath, actionName, eventId)
        },

        /**
         * ======== User Feedback ========
         */

        onVote(tabId, messageId, vote, eventId) {
            if (chatClientAdapter.isSupportedTab(tabId)) {
                // Equals to onChatItemVoted in VSCode https://github.com/aws/aws-toolkit-vscode/blob/master/packages/core/src/amazonq/webview/ui/main.ts#L717
                customEventHandler.onVote?.(tabId, messageId, vote)
                return
            }

            mynahUiProps.onVote?.(tabId, messageId, vote, eventId)
        },

        onSendFeedback(tabId, feedbackPayload, eventId) {
            if (chatClientAdapter.isSupportedTab(tabId)) {
                // Renamed sendFeedback in VSCode https://github.com/aws/aws-toolkit-vscode/blob/master/packages/core/src/amazonq/webview/ui/connector.ts#L619
                customEventHandler.onSendFeedback?.(tabId, feedbackPayload)
                return
            }

            mynahUiProps.onSendFeedback?.(tabId, feedbackPayload, eventId)
        },

        /**
         * ======== UI Interaction ========
         */

        onFollowUpClicked(tabId, messageId, followUp, eventId) {
            if (chatClientAdapter.isSupportedTab(tabId)) {
                customEventHandler.onFollowUpClicked?.(tabId, messageId, followUp)
                return
            }

            mynahUiProps.onFollowUpClicked?.(tabId, messageId, followUp, eventId)
        },

        onInBodyButtonClicked(tabId, messageId, action, eventId) {
            // Delegating whole event to host handler
            // Check if this logic is sufficient for routing VSCode https://github.com/aws/aws-toolkit-vscode/blob/master/packages/core/src/amazonq/webview/ui/main.ts#L718-L775
            if (chatClientAdapter.isSupportedTab(tabId)) {
                customEventHandler.onInBodyButtonClicked?.(tabId, messageId, action, eventId)
                return
            }

            // TODO: Check if we always need to check default logic in mynahUi.ts first for Disclaimer
            // https://github.com/aws/language-servers/blob/81474b1a25ca80d0f2e3147d6ce080511ac7b2ea/chat-client/src/client/mynahUi.ts#L249-L260
            mynahUiProps.onInBodyButtonClicked?.(tabId, messageId, action, eventId)
        },

        onCustomFormAction(tabId, action, eventId) {
            if (chatClientAdapter.isSupportedTab(tabId)) {
                customEventHandler.onCustomFormAction?.(tabId, undefined, action)
                return
            }

            mynahUiProps.onCustomFormAction?.(tabId, action, eventId)
        },

        onFormTextualItemKeyPress(event, formData, itemId, tabId, eventId) {
            if (chatClientAdapter.isSupportedTab(tabId)) {
                // TODO: Check if logic should be made default in chat-client https://github.com/aws/aws-toolkit-vscode/blob/master/packages/core/src/amazonq/webview/ui/apps/cwChatConnector.ts#L163-L184
                return customEventHandler.onFormTextualItemKeyPress?.(event, formData, itemId, tabId) ?? false
            }

            return mynahUiProps.onFormTextualItemKeyPress?.(event, formData, itemId, tabId, eventId) ?? false
        },

        onQuickCommandGroupActionClick(tabId, action, eventId) {
            if (chatClientAdapter.isSupportedTab(tabId)) {
                customEventHandler.onQuickCommandGroupActionClick?.(tabId, action)
                return
            }

            mynahUiProps.onQuickCommandGroupActionClick?.(tabId, action, eventId)
        },

        onContextSelected(contextItem, tabId, eventId) {
            if (chatClientAdapter.isSupportedTab(tabId)) {
                return customEventHandler.onContextSelected?.(contextItem, tabId) ?? false
            }

            return mynahUiProps.onContextSelected?.(contextItem, tabId, eventId) ?? false
        },

        onChatItemEngagement(tabId, messageId, engagement) {
            if (chatClientAdapter.isSupportedTab(tabId)) {
                customEventHandler.onChatItemEngagement?.(tabId, messageId, engagement)
                return
            }

            mynahUiProps.onChatItemEngagement?.(tabId, messageId, engagement)
        },

        onShowMoreWebResultsClick(tabId, messageId, eventId) {
            if (chatClientAdapter.isSupportedTab(tabId)) {
                customEventHandler.onShowMoreWebResultsClick?.(tabId, messageId)
                return
            }

            mynahUiProps.onShowMoreWebResultsClick?.(tabId, messageId, eventId)
        },

        onChatPromptProgressActionButtonClicked(tabId, action, eventId) {
            if (chatClientAdapter.isSupportedTab(tabId)) {
                customEventHandler.onChatPromptProgressActionButtonClicked?.(tabId, action)
                return
            }

            mynahUiProps.onChatPromptProgressActionButtonClicked?.(tabId, action, eventId)
        },

        onTabbedContentTabChange(tabId, messageId, contentTabId, eventId) {
            if (chatClientAdapter.isSupportedTab(tabId)) {
                // Implement custom handler if needed
                customEventHandler.onTabbedContentTabChange?.(tabId, messageId, contentTabId)
                return
            }

            mynahUiProps.onTabbedContentTabChange?.(tabId, messageId, contentTabId, eventId)
        },

        onFormLinkClick(link, mouseEvent, eventId) {
            // Always delegate onFormLinkClick to adapter, if handled exists
            if (customEventHandler.onFormLinkClick) {
                customEventHandler.onFormLinkClick(link, mouseEvent)
                return
            }

            mynahUiProps.onFormLinkClick?.(link, mouseEvent, eventId)
        },

        onFormModifierEnterPress(formData, tabId, eventId) {
            if (chatClientAdapter.isSupportedTab(tabId)) {
                // Implement custom handler if needed
                customEventHandler.onFormModifierEnterPress?.(formData, tabId)
                return
            }

            mynahUiProps.onFormModifierEnterPress?.(formData, tabId, eventId)
        },

        onTabBarButtonClick(tabId, buttonId, eventId) {
            if (chatClientAdapter.isSupportedTab(tabId)) {
                // Implement custom handler if needed
                customEventHandler.onTabBarButtonClick?.(tabId, buttonId)
                return
            }

            mynahUiProps.onTabBarButtonClick?.(tabId, buttonId, eventId)
        },

        /**
         * ======== Application State ========
         */

        onReady() {
            // Rename from uiReady in VSCode client https://github.com/aws/aws-toolkit-vscode/blob/master/packages/core/src/amazonq/webview/ui/connector.ts#L511-L523
            // Do not calling original handler, since it has bindings to PostMessage that breaks integration.
            // customEventHandler.onUiReady()
            mynahUiProps.onReady?.()
        },

        onResetStore(tabId) {
            // Always delegate to original handler as this is a global event
            mynahUiProps.onResetStore?.(tabId)
        },

        onFocusStateChanged(focusState) {
            if (chatClientAdapter.isSupportedTab(mynahUIRef.mynahUI?.getSelectedTabId() || '')) {
                // TODO: Check if it's needed, it is not handled in https://github.com/aws/aws-toolkit-vscode/blob/master/packages/core/src/amazonq/webview/ui/main.ts
                customEventHandler.onFocusStateChanged?.(focusState)
                return
            }

            mynahUiProps.onFocusStateChanged?.(focusState)
        },
    }

    return mynahUiPropsWithAdapter
}
