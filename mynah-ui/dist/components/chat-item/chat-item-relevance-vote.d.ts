/*!
 * Copyright 2022 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
import { ExtendedHTMLElement } from '../../helper/dom';
export interface ChatItemRelevanceVoteProps {
    tabId: string;
    classNames?: string[];
    messageId: string;
}
export declare class ChatItemRelevanceVote {
    private readonly votingId;
    private sendFeedbackListenerId;
    render: ExtendedHTMLElement;
    props: ChatItemRelevanceVoteProps;
    constructor(props: ChatItemRelevanceVoteProps);
    private readonly handleVoteChange;
}
