/*!
 * Copyright 2022 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
import { DomBuilderObject, ExtendedHTMLElement } from '../../helper/dom';
import { ReferenceTrackerInformation, SourceLink } from '../../static';
export interface SourceLinkBodyProps {
    suggestion: Partial<SourceLink>;
    children?: Array<ExtendedHTMLElement | HTMLElement | string | DomBuilderObject>;
    highlightRangeWithTooltip?: ReferenceTrackerInformation[];
}
export declare class SourceLinkBody {
    render: ExtendedHTMLElement;
    props: SourceLinkBodyProps;
    constructor(props: SourceLinkBodyProps);
}
