/*!
 * Copyright 2022 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
import { ExtendedHTMLElement } from '../../helper/dom';
import { CardRenderDetails, ChatItem } from '../../static';
export interface ChatItemCardProps {
    tabId: string;
    chatItem: ChatItem;
    inline?: boolean;
    small?: boolean;
}
export declare class ChatItemCard {
    readonly props: ChatItemCardProps;
    render: ExtendedHTMLElement;
    private readonly card;
    private readonly updateStack;
    private readonly initialSpinner;
    private cardFooter;
    private cardIcon;
    private contentBody;
    private chatAvatar;
    private chatFormItems;
    private customRendererWrapper;
    private chatButtons;
    private fileTreeWrapper;
    private followUps;
    private votes;
    private footer;
    constructor(props: ChatItemCardProps);
    private readonly getCardFooter;
    private readonly generateCard;
    private readonly getCardClasses;
    private readonly updateCardContent;
    private readonly getChatAvatar;
    private readonly canShowAvatar;
    private readonly checkCardSnap;
    readonly updateCard: () => void;
    readonly updateCardStack: (updateWith: Partial<ChatItem>) => void;
    readonly getRenderDetails: () => CardRenderDetails;
    readonly cleanFollowupsAndRemoveIfEmpty: () => boolean;
}
