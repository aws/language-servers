/*!
 * Copyright 2022 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
import { ExtendedHTMLElement } from '../../helper/dom';
import { SourceLink } from '../../static';
export interface SourceLinkCardProps {
    sourceLink: SourceLink;
    compact?: 'flat' | true;
}
export declare class SourceLinkCard {
    private readonly sourceLink;
    render: ExtendedHTMLElement;
    constructor(props: SourceLinkCardProps);
}
