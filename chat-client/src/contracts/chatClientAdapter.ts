import {
    ChatItemAction,
    ChatPrompt,
    CodeSelectionType,
    Engagement,
    FeedbackPayload,
    MynahUI,
    QuickActionCommand,
    ReferenceTrackerInformation,
    RelevancyVoteType,
} from '@aws/mynah-ui'

export interface ChatPayload {
    chatMessage: string
    chatCommand?: string
}

/**
 * Interface for the Connector class that handles communication between the Chat Client and extension
 */
export interface ChatEventHandler {
    /**
     * ======== Tab Management ========
     */

    onTabAdd?(tabId: string): void

    onTabChange?(tabId: string): void

    onBeforeTabRemove?(tabId: string): boolean

    onTabRemove?(tabId: string): void

    /**
     * ======== Chat Interaction ========
     */

    onChatPrompt?(tabId: string, payload: ChatPayload): void

    onStopChatResponse?(tabId: string): void

    /**
     * ======== Link Handling ========
     */

    onLinkClick?(tabId: string, messageId: string, link: string): void

    onSourceLinkClick?(tabId: string, messageId: string, link: string): void

    onResponseBodyLinkClick?(tabId: string, messageId: string, link: string): void

    onInfoLinkClick?(tabId: string, link: string): void

    /**
     * ======== Code Interaction ========
     */

    onCodeInsertToCursorPosition?(
        tabId: string,
        messageId: string,
        code?: string,
        type?: CodeSelectionType,
        referenceTrackerInformation?: ReferenceTrackerInformation[],
        eventId?: string,
        codeBlockIndex?: number,
        totalCodeBlocks?: number,
        userIntent?: string,
        codeBlockLanguage?: string
    ): void

    onCopyCodeToClipboard?(
        tabId: string,
        messageId: string,
        code?: string,
        type?: CodeSelectionType,
        referenceTrackerInformation?: ReferenceTrackerInformation[],
        eventId?: string,
        codeBlockIndex?: number,
        totalCodeBlocks?: number,
        userIntent?: string,
        codeBlockLanguage?: string
    ): void

    onCodeBlockActionClicked?(
        tabId: string,
        messageId: string,
        actionId: string,
        data?: string,
        code?: string,
        type?: CodeSelectionType,
        referenceTrackerInformation?: ReferenceTrackerInformation[],
        eventId?: string,
        codeBlockIndex?: number,
        totalCodeBlocks?: number
    ): void

    /**
     * ======== File Operations ========
     */

    onFileClick?(tabId: string, filePath: string, deleted: boolean, messageId?: string): void

    onFileActionClick?(tabId: string, messageId: string, filePath: string, actionName: string): void

    /**
     * ======== User Feedback ========
     */

    onVote?(tabId: string, messageId: string, vote: RelevancyVoteType): void

    onSendFeedback?(tabId: string, feedbackPayload: FeedbackPayload): void

    /**
     * ======== UI Interaction ========
     */

    onFollowUpClicked?(tabId: string, messageId: string, followUp: any): void

    onInBodyButtonClicked?(
        tabId: string,
        messageId: string,
        action: {
            id: string
            text?: string
            formItemValues?: Record<string, string>
        },
        eventId?: string
    ): void

    onCustomFormAction?(tabId: string, formId: string | undefined, action: any): void

    onFormTextualItemKeyPress?(
        event: KeyboardEvent,
        formData: Record<string, string>,
        itemId: string,
        tabId: string,
        eventId?: string
    ): boolean

    onQuickCommandGroupActionClick?(tabId: string, action: { id: string }): void

    onContextSelected?(contextItem: QuickActionCommand, tabId: string): boolean

    onChatItemEngagement?(tabId: string, messageId: string, engagement: Engagement): void

    onShowMoreWebResultsClick?(tabId: string, messageId: string): void

    onChatPromptProgressActionButtonClicked?(tabId: string, action: { id: string }): void

    onTabbedContentTabChange?(tabId: string, messageId: string, contentTabId: string): void

    onFormLinkClick?(link: string, mouseEvent?: MouseEvent): void

    onFormModifierEnterPress?(formData: Record<string, string>, tabId: string): void

    onTabBarButtonClick?(tabId: string, buttonId: string): void

    /**
     * ======== Application State ========
     */

    onUiReady(): void

    onResetStore(): void

    onFocusStateChanged?(focusState: boolean): void
}

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
