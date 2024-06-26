/*!
 * Copyright 2022 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
import { ExtendedHTMLElement } from '../../helper/dom';
import { ReferenceTrackerInformation } from '../../static';
export interface ChatItemTreeViewLicenseProps {
    referenceSuggestionLabel: string;
    references: ReferenceTrackerInformation[];
}
export declare class ChatItemTreeViewLicense {
    render: ExtendedHTMLElement;
    constructor(props: ChatItemTreeViewLicenseProps);
    private readonly buildDropdownChildren;
}
