/*!
 * Copyright 2022 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
import { ExtendedHTMLElement } from '../../helper/dom';
import { ChatItemButton } from '../../static';
import { ChatItemFormItemsWrapper } from './chat-item-form-items';
export interface ChatItemButtonsWrapperProps {
    tabId: string;
    classNames?: string[];
    buttons: ChatItemButton[];
    formItems: ChatItemFormItemsWrapper | null;
    onActionClick: (action: ChatItemButton, e?: Event) => void;
}
export declare class ChatItemButtonsWrapper {
    private readonly props;
    private readonly actions;
    render: ExtendedHTMLElement;
    constructor(props: ChatItemButtonsWrapperProps);
    private readonly handleValidationChange;
    private readonly disableAll;
}
