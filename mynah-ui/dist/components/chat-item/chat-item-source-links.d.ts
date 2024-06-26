/*!
 * Copyright 2022 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
import { ExtendedHTMLElement } from '../../helper/dom';
import { SourceLink } from '../../static';
export interface ChatItemSourceLinksContainerProps {
    tabId: string;
    messageId: string;
    title?: string;
    relatedContent?: SourceLink[];
}
export declare class ChatItemSourceLinksContainer {
    private readonly props;
    private readonly showMoreButtonBlock;
    render: ExtendedHTMLElement;
    chatAvatar: ExtendedHTMLElement;
    constructor(props: ChatItemSourceLinksContainerProps);
}
