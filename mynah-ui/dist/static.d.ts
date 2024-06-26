/*!
 * Copyright 2022 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
import { MynahIcons } from './components/icon';
import { ChatItemBodyRenderer } from './helper/dom';
import { SelectAbstract, SelectProps, RadioGroupAbstract, RadioGroupProps, ButtonAbstract, ButtonProps, TextInputProps, TextInputAbstract, TextAreaProps, TextAreaAbstract } from './main';
export interface QuickActionCommand {
    command: string;
    disabled?: boolean;
    description?: string;
    placeholder?: string;
}
export interface QuickActionCommandGroup {
    groupName?: string;
    commands: QuickActionCommand[];
}
/**
 * data store model to update the mynah ui partially or fully
 */
export interface MynahUIDataModel {
    /**
     * Tab title
     * */
    tabTitle?: string;
    /**
     * If tab is running an action (loadingChat = true) this markdown will be shown before close in a popup
     */
    tabCloseConfirmationMessage?: string | null;
    /**
     * Keep tab open button text
     */
    tabCloseConfirmationKeepButton?: string | null;
    /**
     * Close tab button text
     */
    tabCloseConfirmationCloseButton?: string | null;
    /**
     * Chat screen loading animation state (mainly use during the stream or getting the initial answer)
     */
    loadingChat?: boolean;
    /**
     * Show chat avatars or not
     * */
    showChatAvatars?: boolean;
    /**
     * Show cancel button while loading the chat
     * */
    cancelButtonWhenLoading?: boolean;
    /**
    * Quick Action commands to show when user hits / to the input initially
    */
    quickActionCommands?: QuickActionCommandGroup[];
    /**
    * Context commands to show when user hits @ to the input any point
    */
    contextCommands?: QuickActionCommandGroup[];
    /**
    * Placeholder to be shown on prompt input
    */
    promptInputPlaceholder?: string;
    /**
    * Info block to be shown under prompt input
    */
    promptInputInfo?: string;
    /**
    * A sticky chat item card on top of the prompt input
    */
    promptInputStickyCard?: Partial<ChatItem> | null;
    /**
    * Prompt input field disabled state, set to tru to disable it
    */
    promptInputDisabledState?: boolean;
    /**
    * List of chat item objects to be shown on the web suggestions search screen
    */
    chatItems?: ChatItem[];
    /**
     * Attached code under the prompt input field
     */
    selectedCodeSnippet?: string;
    /**
     * Tab bar buttons next to the tab items
     */
    tabBarButtons?: TabBarMainAction[];
}
export interface MynahUITabStoreTab {
    /**
     * Is tab selected
     */
    isSelected?: boolean;
    /**
    * Tab items data store
    */
    store?: MynahUIDataModel;
}
/**
 * tabs store model to update the tabs partially or fully
 */
export interface MynahUITabStoreModel {
    [tabId: string]: MynahUITabStoreTab;
}
export declare enum MynahEventNames {
    RESET_STORE = "resetStore",
    FEEDBACK_SET = "feedbackSet",
    ROOT_FOCUS = "rootFocusStateChange",
    CARD_VOTE = "cardVote",
    SOURCE_LINK_CLICK = "sourceLinkClick",
    INFO_LINK_CLICK = "infoLinkClick",
    LINK_CLICK = "linkClick",
    CHAT_ITEM_ENGAGEMENT = "chatItemEngagement",
    COPY_CODE_TO_CLIPBOARD = "copyCodeToClipboard",
    CODE_BLOCK_ACTION = "codeBlockAction",
    CHAT_PROMPT = "chatPrompt",
    CHAT_ITEM_ADD = "chatItemAdd",
    FOLLOW_UP_CLICKED = "followUpClicked",
    BODY_ACTION_CLICKED = "bodyActionClicked",
    SHOW_MORE_WEB_RESULTS_CLICK = "showMoreWebResultsClick",
    SHOW_FEEDBACK_FORM = "showFeedbackForm",
    FILE_CLICK = "fileClick",
    FILE_ACTION_CLICK = "fileActionClick",
    TAB_FOCUS = "tabFocus",
    CUSTOM_FORM_ACTION_CLICK = "customFormActionClick",
    ADD_ATTACHMENT = "addAttachment",
    REMOVE_ATTACHMENT = "removeAttachment",
    TAB_BAR_BUTTON_CLICK = "tabBarButtonClick"
}
export declare enum MynahPortalNames {
    WRAPPER = "wrapper",
    SIDE_NAV = "sideNav",
    OVERLAY = "overlay",
    FEEDBACK_FORM = "feedbackForm"
}
export type PromptAttachmentType = 'code' | 'markdown';
export interface SourceLinkMetaData {
    stars?: number;
    forks?: number;
    answerCount?: number;
    isOfficialDoc?: boolean;
    isAccepted?: boolean;
    score?: number;
    lastActivityDate?: number;
}
export interface SourceLink {
    title: string;
    id?: string;
    url: string;
    body?: string;
    type?: string;
    metadata?: Record<string, SourceLinkMetaData>;
}
export declare enum ChatItemType {
    PROMPT = "prompt",
    SYSTEM_PROMPT = "system-prompt",
    AI_PROMPT = "ai-prompt",
    ANSWER = "answer",
    ANSWER_STREAM = "answer-stream",
    ANSWER_PART = "answer-part",
    CODE_RESULT = "code-result"
}
export interface TreeNodeDetails {
    status?: 'info' | 'success' | 'warning' | 'error';
    icon?: MynahIcons;
    label?: string;
    description?: string;
}
export interface ChatItemContent {
    body?: string;
    customRenderer?: string | ChatItemBodyRenderer | ChatItemBodyRenderer[];
    followUp?: {
        text?: string;
        options?: ChatItemAction[];
    };
    relatedContent?: {
        title?: string;
        content: SourceLink[];
    };
    codeReference?: ReferenceTrackerInformation[];
    fileList?: {
        fileTreeTitle?: string;
        rootFolderTitle?: string;
        filePaths?: string[];
        deletedFiles?: string[];
        actions?: Record<string, FileNodeAction[]>;
        details?: Record<string, TreeNodeDetails>;
    };
    buttons?: ChatItemButton[];
    formItems?: ChatItemFormItem[];
    footer?: ChatItemContent;
    codeBlockActions?: CodeBlockActions;
}
export interface ChatItem extends ChatItemContent {
    type: ChatItemType;
    messageId?: string;
    snapToTop?: boolean;
    canBeVoted?: boolean;
    icon?: MynahIcons;
    status?: 'info' | 'success' | 'warning' | 'error';
}
export interface ChatItemFormItem {
    id: string;
    type: 'select' | 'textarea' | 'textinput' | 'numericinput' | 'stars' | 'radiogroup' | 'email';
    mandatory?: boolean;
    title?: string;
    placeholder?: string;
    value?: string;
    options?: Array<{
        value: string;
        label: string;
    }>;
}
export interface ChatPrompt {
    prompt?: string;
    escapedPrompt?: string;
    command?: string;
    context?: string[];
}
export interface ChatItemAction extends ChatPrompt {
    type?: string;
    pillText: string;
    disabled?: boolean;
    description?: string;
    status?: 'primary' | 'info' | 'success' | 'warning' | 'error';
    icon?: MynahIcons;
}
export interface ChatItemButton {
    keepCardAfterClick?: boolean;
    waitMandatoryFormItems?: boolean;
    text: string;
    id: string;
    disabled?: boolean;
    description?: string;
    status?: 'primary' | 'info' | 'success' | 'warning' | 'error';
    icon?: MynahIcons;
}
export interface TabBarAction {
    text?: string;
    id: string;
    disabled?: boolean;
    description?: string;
    status?: 'info' | 'success' | 'warning' | 'error';
    icon?: MynahIcons;
}
export interface TabBarMainAction extends TabBarAction {
    items?: TabBarAction[];
}
export interface FileNodeAction {
    name: string;
    label?: string;
    disabled?: boolean;
    description?: string;
    status?: 'info' | 'success' | 'warning' | 'error';
    icon: MynahIcons;
}
export declare enum KeyMap {
    ESCAPE = "Escape",
    ENTER = "Enter",
    BACKSPACE = "Backspace",
    SPACE = " ",
    DELETE = "Delete",
    ARROW_UP = "ArrowUp",
    ARROW_DOWN = "ArrowDown",
    ARROW_LEFT = "ArrowLeft",
    ARROW_RIGHT = "ArrowRight",
    PAGE_UP = "PageUp",
    PAGED_OWN = "PageDown",
    HOME = "Home",
    END = "End",
    META = "Meta",
    TAB = "Tab",
    SHIFT = "Shift",
    CONTROL = "Control",
    ALT = "Alt",
    AT = "@",
    SLASH = "/",
    BACK_SLASH = "\\"
}
export interface ReferenceTrackerInformation {
    licenseName?: string;
    repository?: string;
    url?: string;
    recommendationContentSpan?: {
        start: number;
        end: number;
    };
    information: string;
}
export type CodeSelectionType = 'selection' | 'block';
export type OnCopiedToClipboardFunction = (type?: CodeSelectionType, text?: string, referenceTrackerInformation?: ReferenceTrackerInformation[], codeBlockIndex?: number, totalCodeBlocks?: number) => void;
export type OnCodeBlockActionFunction = (actionId: string, data?: any, type?: CodeSelectionType, text?: string, referenceTrackerInformation?: ReferenceTrackerInformation[], codeBlockIndex?: number, totalCodeBlocks?: number) => void;
export declare enum RelevancyVoteType {
    UP = "upvote",
    DOWN = "downvote"
}
/**
 * 'interaction' will be set if there was a potential text selection or a click input was triggered by the user.
 *  If this is a selection selectionDistanceTraveled object will also be filled
 * 'timespend' will be set basically if there is no interaction except mouse movements in a time spent longer than the ENGAGEMENT_DURATION_LIMIT
 *  Don't forget that in 'timespend' case, user should leave the suggestion card at some point to count it as an interaction.
 *  (They need to go back to the code or move to another card instead)
 */
export declare enum EngagementType {
    INTERACTION = "interaction",
    TIME = "timespend"
}
export interface Engagement {
    /**
       * Engagement type
       */
    engagementType: EngagementType;
    /**
       * Total duration in ms till the engagement triggered.
       */
    engagementDurationTillTrigger: number;
    /**
       * Total mouse movement in x and y directions till the engagement triggered.
       * To avoid confusion: this is not the distance between start and end points, this is the total traveled distance.
       */
    totalMouseDistanceTraveled: {
        x: number;
        y: number;
    };
    /**
       * If the engagementType is "interaction" and this object has a value, you can assume it as a text selection.
       * If the engagementType is "interaction" but this object is not defined, you can assume it as a click
       */
    selectionDistanceTraveled?: {
        x: number;
        y: number;
        selectedText?: string;
    };
}
export interface FeedbackPayload {
    messageId: string;
    tabId: string;
    selectedOption: string;
    comment?: string;
}
export declare enum NotificationType {
    INFO = "info",
    SUCCESS = "ok-circled",
    WARNING = "warning",
    ERROR = "error"
}
export interface CodeBlockAction {
    id: 'copy' | 'insert-to-cursor' | string;
    label: string;
    description?: string;
    icon?: MynahIcons;
    data?: any;
    acceptedLanguages?: string[];
}
export type CodeBlockActions = Record<'copy' | 'insert-to-cursor' | string, CodeBlockAction | undefined | null>;
export interface ConfigTexts {
    mainTitle: string;
    feedbackFormTitle: string;
    feedbackFormOptionsLabel: string;
    feedbackFormCommentLabel: string;
    feedbackThanks: string;
    feedbackReportButtonLabel: string;
    codeSuggestions: string;
    clickFileToViewDiff: string;
    files: string;
    changes: string;
    insertAtCursorLabel: string;
    copy: string;
    showMore: string;
    save: string;
    cancel: string;
    submit: string;
    pleaseSelect: string;
    stopGenerating: string;
    copyToClipboard: string;
    noMoreTabsTooltip: string;
    codeSuggestionWithReferenceTitle: string;
    spinnerText: string;
    tabCloseConfirmationMessage: string;
    tabCloseConfirmationKeepButton: string;
    tabCloseConfirmationCloseButton: string;
    noTabsOpen: string;
    openNewTab: string;
}
type PickMatching<T, V> = {
    [K in keyof T as T[K] extends V ? K : never]: T[K];
};
type ExtractMethods<T> = PickMatching<T, any>;
export interface ComponentOverrides {
    Button?: new (props: ButtonProps) => ExtractMethods<ButtonAbstract>;
    RadioGroup?: new (props: RadioGroupProps) => ExtractMethods<RadioGroupAbstract>;
    Select?: new (props: SelectProps) => ExtractMethods<SelectAbstract>;
    TextInput?: new (props: TextInputProps) => ExtractMethods<TextInputAbstract>;
    TextArea?: new (props: TextAreaProps) => ExtractMethods<TextAreaAbstract>;
}
export interface ConfigOptions {
    feedbackOptions: Array<{
        label: string;
        value: string;
    }>;
    tabBarButtons?: TabBarMainAction[];
    maxTabs: number;
    showPromptField: boolean;
    autoFocus: boolean;
    maxUserInput: number;
    codeBlockActions?: CodeBlockActions;
    codeInsertToCursorEnabled?: boolean;
    codeCopyToClipboardEnabled?: boolean;
}
export interface ConfigModel extends ConfigOptions {
    texts: Partial<ConfigTexts>;
    componentOverrides: Partial<ComponentOverrides>;
}
export interface CardRenderDetails {
    totalNumberOfCodeBlocks?: number;
}
export {};
