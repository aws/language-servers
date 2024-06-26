/*!
 * Copyright 2022 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
import { RelevancyVoteType, FeedbackPayload, MynahUIDataModel, NotificationType, ChatItem, ChatItemAction, ChatPrompt, MynahUITabStoreModel, MynahUITabStoreTab, ConfigModel, ReferenceTrackerInformation, CodeSelectionType, Engagement, ChatItemFormItem, ChatItemButton, CardRenderDetails, PromptAttachmentType } from './static';
import './styles/styles.scss';
export { generateUID } from './helper/guid';
export { ChatItemBodyRenderer, } from './helper/dom';
export { AllowedAttributesInCustomRenderer, AllowedTagsInCustomRenderer } from './helper/sanitize';
export * from './static';
export { ToggleOption } from './components/toggle';
export { MynahIcons } from './components/icon';
export { DomBuilder, DomBuilderObject, ExtendedHTMLElement, } from './helper/dom';
export { ButtonProps, ButtonAbstract } from './components/button';
export { RadioGroupProps, RadioGroupAbstract } from './components/form-items/radio-group';
export { SelectProps, SelectAbstract } from './components/form-items/select';
export { TextInputProps, TextInputAbstract } from './components/form-items/text-input';
export { TextAreaProps, TextAreaAbstract } from './components/form-items/text-area';
export { ChatItemCardContent, ChatItemCardContentProps } from './components/chat-item/chat-item-card-content';
export interface MynahUIProps {
    rootSelector?: string;
    defaults?: MynahUITabStoreTab;
    tabs?: MynahUITabStoreModel;
    config?: Partial<ConfigModel>;
    onShowMoreWebResultsClick?: (tabId: string, messageId: string, eventId?: string) => void;
    onReady?: () => void;
    onFocusStateChanged?: (focusState: boolean) => void;
    onVote?: (tabId: string, messageId: string, vote: RelevancyVoteType, eventId?: string) => void;
    onStopChatResponse?: (tabId: string, eventId?: string) => void;
    onResetStore?: (tabId: string) => void;
    onChatPrompt?: (tabId: string, prompt: ChatPrompt, eventId?: string) => void;
    onFollowUpClicked?: (tabId: string, messageId: string, followUp: ChatItemAction, eventId?: string) => void;
    onInBodyButtonClicked?: (tabId: string, messageId: string, action: {
        id: string;
        text?: string;
        formItemValues?: Record<string, string>;
    }, eventId?: string) => void;
    onTabChange?: (tabId: string, eventId?: string) => void;
    onTabAdd?: (tabId: string, eventId?: string) => void;
    onTabRemove?: (tabId: string, eventId?: string) => void;
    /**
     * @param tabId tabId which the close button triggered
     * @returns boolean -> If you want to close the tab immediately send true
     */
    onBeforeTabRemove?: (tabId: string, eventId?: string) => boolean;
    onChatItemEngagement?: (tabId: string, messageId: string, engagement: Engagement) => void;
    onCodeBlockActionClicked?: (tabId: string, messageId: string, actionId: string, data?: string, code?: string, type?: CodeSelectionType, referenceTrackerInformation?: ReferenceTrackerInformation[], eventId?: string, codeBlockIndex?: number, totalCodeBlocks?: number) => void;
    /**
     * @deprecated since version 4.14.0. It will be only used for keyboard, context menu copy actions, not for button actions after version 5.x.x. Use {@link onCodeBlockActionClicked} instead
     */
    onCopyCodeToClipboard?: (tabId: string, messageId: string, code?: string, type?: CodeSelectionType, referenceTrackerInformation?: ReferenceTrackerInformation[], eventId?: string, codeBlockIndex?: number, totalCodeBlocks?: number, data?: any) => void;
    /**
     * @deprecated since version 4.14.0. Will be dropped after version 5.x.x. Use {@link onCodeBlockActionClicked} instead
     */
    onCodeInsertToCursorPosition?: (tabId: string, messageId: string, code?: string, type?: CodeSelectionType, referenceTrackerInformation?: ReferenceTrackerInformation[], eventId?: string, codeBlockIndex?: number, totalCodeBlocks?: number, data?: any) => void;
    onSourceLinkClick?: (tabId: string, messageId: string, link: string, mouseEvent?: MouseEvent, eventId?: string) => void;
    onLinkClick?: (tabId: string, messageId: string, link: string, mouseEvent?: MouseEvent, eventId?: string) => void;
    onInfoLinkClick?: (tabId: string, link: string, mouseEvent?: MouseEvent, eventId?: string) => void;
    onSendFeedback?: (tabId: string, feedbackPayload: FeedbackPayload, eventId?: string) => void;
    onCustomFormAction?: (tabId: string, action: {
        id: string;
        text?: string;
        formItemValues?: Record<string, string>;
    }, eventId?: string) => void;
    /**
     * @deprecated since version 4.6.3. Will be dropped after version 5.x.x. Use {@link onFileClick} instead
     */
    onOpenDiff?: (tabId: string, filePath: string, deleted: boolean, messageId?: string, eventId?: string) => void;
    onFileClick?: (tabId: string, filePath: string, deleted: boolean, messageId?: string, eventId?: string) => void;
    onFileActionClick?: (tabId: string, messageId: string, filePath: string, actionName: string, eventId?: string) => void;
    onTabBarButtonClick?: (tabId: string, buttonId: string, eventId?: string) => void;
}
export declare class MynahUI {
    private readonly render;
    private lastEventId;
    private readonly props;
    private readonly tabsWrapper;
    private readonly tabContentsWrapper;
    private readonly feedbackForm?;
    private readonly chatWrappers;
    constructor(props: MynahUIProps);
    private readonly getUserEventId;
    private readonly focusToInput;
    private readonly addGlobalListeners;
    addToUserPrompt: (tabId: string, attachmentContent: string, type?: PromptAttachmentType) => void;
    /**
     * Adds a new item to the chat window
     * @param tabId Corresponding tab ID.
     * @param answer ChatItem object.
     */
    addChatItem: (tabId: string, chatItem: ChatItem) => void;
    /**
     * Updates the last ChatItemType.ANSWER_STREAM chat item
     * @param tabId Corresponding tab ID.
     * @param updateWith ChatItem object to update with.
     */
    updateLastChatAnswer: (tabId: string, updateWith: Partial<ChatItem>) => void;
    /**
     * Updates the chat item with the given messageId
     * @param tabId Corresponding tab ID.
     * @param messageId Corresponding tab ID.
     * @param updateWith ChatItem object to update with.
     */
    updateChatAnswerWithMessageId: (tabId: string, messageId: string, updateWith: Partial<ChatItem>) => void;
    /**
     * Converts a card to an ANSWER if it is an ANSWER_STREAM
     * @param tabId Corresponding tab ID.
     * @param messageId Corresponding tab ID.
     * @param updateWith Optional, if you like update the card while converting it to
     * a normal ANSWER instead of a stream one, you can send a ChatItem object to update with.
     */
    endMessageStream: (tabId: string, messageId: string, updateWith?: Partial<ChatItem>) => CardRenderDetails;
    /**
     * If exists, switch to a different tab
     * @param tabId Tab ID to switch to
     * @param eventId last action's user event ID passed from an event binded to mynahUI.
     * Without user intent you cannot switch to a different tab
     */
    selectTab: (tabId: string, eventId: string) => void;
    /**
     * If exists, close the given tab
     * @param tabId Tab ID to switch to
     * @param eventId last action's user event ID passed from an event binded to mynahUI.
     * Without user intent you cannot switch to a different tab
     */
    removeTab: (tabId: string, eventId: string) => void;
    /**
     * Updates only the UI with the given data for the given tab
     * Send tab id as an empty string to open a new tab!
     * If max tabs reached, will not return tabId
     * @param data A full or partial set of data with values.
     */
    updateStore: (tabId: string | '', data: MynahUIDataModel) => string | undefined;
    /**
     * This function returns the selected tab id if there is any, otherwise returns undefined
     * @returns string selectedTabId or undefined
     */
    getSelectedTabId: () => string | undefined;
    /**
     * Returns all tabs with their store information
     * @returns string selectedTabId or undefined
     */
    getAllTabs: () => MynahUITabStoreModel;
    /**
     * Simply creates and shows a notification
     * @param props NotificationProps
     */
    notify: (props: {
        /**
         * -1 for infinite
         */
        duration?: number | undefined;
        type?: NotificationType | undefined;
        title?: string | undefined;
        content: string;
        onNotificationClick?: ((eventId: string) => void) | undefined;
        onNotificationHide?: ((eventId: string) => void) | undefined;
    }) => void;
    /**
     * Simply creates and shows a notification
     * @param props NotificationProps
     */
    showCustomForm: (tabId: string, formItems?: ChatItemFormItem[], buttons?: ChatItemButton[], title?: string, description?: string) => void;
}
