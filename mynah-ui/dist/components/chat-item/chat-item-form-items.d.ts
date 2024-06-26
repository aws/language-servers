/*!
 * Copyright 2022 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
import { ExtendedHTMLElement } from '../../helper/dom';
import { ChatItem } from '../../static';
export interface ChatItemFormItemsWrapperProps {
    tabId: string;
    chatItem: Partial<ChatItem>;
    classNames?: string[];
}
export declare class ChatItemFormItemsWrapper {
    private readonly props;
    private readonly options;
    private readonly validationItems;
    private isValid;
    onValidationChange?: (isValid: boolean) => void;
    render: ExtendedHTMLElement;
    constructor(props: ChatItemFormItemsWrapperProps);
    private readonly getValidationHandler;
    isFormValid: () => boolean;
    disableAll: () => void;
    getAllValues: () => Record<string, string>;
}
