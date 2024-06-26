/*!
 * Copyright 2022 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
import { ExtendedHTMLElement } from '../../helper/dom';
export interface ChatPromptInputStickyCardProps {
    tabId: string;
}
export declare class ChatPromptInputStickyCard {
    render: ExtendedHTMLElement;
    constructor(props: ChatPromptInputStickyCardProps);
}
