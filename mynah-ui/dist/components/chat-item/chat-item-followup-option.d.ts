/*!
 * Copyright 2022 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
import { ExtendedHTMLElement } from '../../helper/dom';
import { ChatItemAction } from '../../static';
export interface ChatItemFollowUpOptionProps {
    followUpOption: ChatItemAction;
    onClick: (followUpOption: ChatItemAction) => void;
}
export declare class ChatItemFollowUpOption {
    private readonly props;
    render: ExtendedHTMLElement;
    private followupTooltip;
    private followupTooltipTimeout;
    private disabled;
    constructor(props: ChatItemFollowUpOptionProps);
    private readonly showCroppedFollowupText;
    readonly hideCroppedFollowupText: () => void;
    readonly setEnabled: (enabled: boolean) => void;
}
