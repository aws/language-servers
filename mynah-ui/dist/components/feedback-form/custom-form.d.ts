/*!
 * Copyright 2022 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
import { ExtendedHTMLElement } from '../../helper/dom';
import { ChatItem } from '../../static';
import { ChatItemFormItemsWrapper } from '../chat-item/chat-item-form-items';
import { ChatItemButtonsWrapper } from '../chat-item/chat-item-buttons';
export interface CustomFormWrapperProps {
    tabId: string;
    chatItem: Partial<ChatItem>;
    title?: string;
    description?: string;
    onFormAction?: (actionName: string, formData: Record<string, string>) => void;
    onCloseButtonClick?: (e: Event) => void;
}
export declare class CustomFormWrapper {
    readonly props: CustomFormWrapperProps;
    render: ExtendedHTMLElement;
    chatFormItems: ChatItemFormItemsWrapper | null;
    chatButtons: ChatItemButtonsWrapper | null;
    constructor(props: CustomFormWrapperProps);
    private readonly getFormItems;
}
