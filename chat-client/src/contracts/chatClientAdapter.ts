import { ChatPrompt, MynahUI, MynahUIProps } from '@aws/mynah-ui'

export interface ChatEventHandler
    extends Pick<
        MynahUIProps,
        | 'onTabAdd'
        | 'onTabChange'
        | 'onBeforeTabRemove'
        | 'onTabRemove'
        | 'onChatPrompt'
        | 'onStopChatResponse'
        | 'onLinkClick'
        | 'onSourceLinkClick'
        | 'onInfoLinkClick'
        | 'onCodeInsertToCursorPosition'
        | 'onCopyCodeToClipboard'
        | 'onCodeBlockActionClicked'
        | 'onFileClick'
        | 'onFileActionClick'
        | 'onVote'
        | 'onSendFeedback'
        | 'onFollowUpClicked'
        | 'onInBodyButtonClicked'
        | 'onCustomFormAction'
        | 'onFormTextualItemKeyPress'
        | 'onQuickCommandGroupActionClick'
        | 'onContextSelected'
        | 'onChatItemEngagement'
        | 'onShowMoreWebResultsClick'
        | 'onChatPromptProgressActionButtonClicked'
        | 'onTabbedContentTabChange'
        | 'onFormLinkClick'
        | 'onFormModifierEnterPress'
        | 'onTabBarButtonClick'
        | 'onFocusStateChanged'
        | 'onResetStore'
        | 'onReady'
        | 'onPromptInputOptionChange'
        | 'onMessageDismiss'
    > {}

/**
 * ChatClientAdapter serves as an integration point between the Chat Client and Host application.
 * It provides an extension point and bridge for handling communication, events, and custom behaviors between the chat UI
 * and the host application (IDE).
 *
 * This adapter enables host to:
 * - Create custom event handlers for chat interactions
 * - Filter and process messages from the host application
 * - Determine which tabs and quick actions are supported by the host application
 * - Handle specialized quick actions with custom implementation
 */
export interface ChatClientAdapter {
    /**
     * Creates a chat event handler that processes UI events from the MynahUI component.
     *
     * @param mynahUIRef - Reference object containing the MynahUI instance
     * @returns A ChatEventHandler implementation that processes UI events
     */
    createChatEventHandler(mynahUIRef: { mynahUI: MynahUI | undefined }): ChatEventHandler

    /**
     * Determines if a specific tab is supported by this adapter implementation.
     * Used to filter which tabs should be handled by this adapter versus the default handler.
     *
     * @param tabId - The ID of the tab to check for support
     * @returns True if the tab is supported by this adapter, false otherwise
     */
    isSupportedTab(tabId: string): boolean

    /**
     * Determines if a specific quick action command is supported by this adapter implementation.
     * Used to filter which quick actions should be handled by this adapter versus the default handler.
     *
     * @param command - The command string identifier for the quick action
     * @returns True if the quick action is supported by this adapter, false otherwise
     */
    isSupportedQuickAction(command: string): boolean

    /**
     * Processes incoming messages from the host application that are specifically
     * targeted for this adapter (identified by the 'sender' property in the message).
     *
     * This method enables custom message routing between the IDE extension and the chat client.
     *
     * @param message - The message event containing data from the host application
     */
    handleMessageReceive(message: MessageEvent): void

    /**
     * Handles execution of quick actions that are supported by this adapter.
     * Provides custom implementation for specialized quick action commands.
     *
     * @param prompt - The chat prompt containing the quick action details
     * @param tabId - The ID of the tab where the quick action was triggered
     * @param eventId - Optional identifier for the event that triggered the quick action
     */
    handleQuickAction(prompt: ChatPrompt, tabId: string, eventId: string | undefined): void
}
