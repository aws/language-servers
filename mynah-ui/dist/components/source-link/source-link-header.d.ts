/*!
 * Copyright 2022 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
import { ExtendedHTMLElement } from '../../helper/dom';
import { SourceLink } from '../../static';
export interface SourceLinkHeaderProps {
    sourceLink: SourceLink;
    showCardOnHover?: boolean;
    onClick?: (e?: MouseEvent) => void;
}
export declare class SourceLinkHeader {
    private sourceLinkPreview;
    private sourceLinkPreviewTimeout;
    render: ExtendedHTMLElement;
    constructor(props: SourceLinkHeaderProps);
    private readonly getSourceMetaBlock;
    private readonly showLinkPreview;
    private readonly hideLinkPreview;
}
