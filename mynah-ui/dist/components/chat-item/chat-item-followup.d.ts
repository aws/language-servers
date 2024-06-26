/*!
 * Copyright 2022 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
import { ExtendedHTMLElement } from '../../helper/dom';
import { ChatItem } from '../../static';
export interface ChatItemFollowUpProps {
    tabId: string;
    chatItem: ChatItem;
}
export declare class ChatItemFollowUpContainer {
    private readonly props;
    render: ExtendedHTMLElement;
    private readonly itemAddListenerId;
    private followupOptions;
    constructor(props: ChatItemFollowUpProps);
    private readonly handleLinkClick;
}
