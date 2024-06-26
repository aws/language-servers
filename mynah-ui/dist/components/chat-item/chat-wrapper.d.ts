/*!
 * Copyright 2022 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
import { ExtendedHTMLElement } from '../../helper/dom';
import { CardRenderDetails, ChatItem, PromptAttachmentType } from '../../static';
import '../../styles/components/chat/_chat-wrapper.scss';
export declare const CONTAINER_GAP = 12;
export interface ChatWrapperProps {
    onStopChatResponse?: (tabId: string) => void;
    tabId: string;
}
export declare class ChatWrapper {
    private readonly props;
    private readonly chatItemsContainer;
    private readonly intermediateBlockContainer;
    private readonly promptInputElement;
    private readonly promptInput;
    private readonly promptInfo;
    private readonly promptStickyCard;
    private lastStreamingChatItemCard;
    private lastStreamingChatItemMessageId;
    private allRenderedChatItems;
    render: ExtendedHTMLElement;
    constructor(props: ChatWrapperProps);
    private readonly removeEmptyCardsAndFollowups;
    private readonly insertChatItem;
    private readonly checkLastAnswerStreamChange;
    updateLastChatAnswer: (updateWith: Partial<ChatItem>) => void;
    getLastStreamingMessageId: () => string | null;
    getChatItem: (messageId: string) => {
        chatItem: ChatItem;
        render: ExtendedHTMLElement | HTMLElement;
        renderDetails: CardRenderDetails;
    } | undefined;
    endStreamWithMessageId: (messageId: string, updateWith: Partial<ChatItem>) => void;
    updateChatAnswerWithMessageId: (messageId: string, updateWith: Partial<ChatItem>) => void;
    addAttachmentToPrompt: (textToAdd: string, type?: PromptAttachmentType) => void;
}
