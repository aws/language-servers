/*!
 * Copyright 2022 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
import { ExtendedHTMLElement } from '../../helper/dom';
import { FileNodeAction, ReferenceTrackerInformation, TreeNodeDetails } from '../../static';
export interface ChatItemTreeViewWrapperProps {
    tabId: string;
    messageId: string;
    files: string[];
    cardTitle?: string;
    classNames?: string[];
    rootTitle?: string;
    deletedFiles: string[];
    actions?: Record<string, FileNodeAction[]>;
    details?: Record<string, TreeNodeDetails>;
    referenceSuggestionLabel: string;
    references: ReferenceTrackerInformation[];
}
export declare class ChatItemTreeViewWrapper {
    render: ExtendedHTMLElement;
    constructor(props: ChatItemTreeViewWrapperProps);
}
