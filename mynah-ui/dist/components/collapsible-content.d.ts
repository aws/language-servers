/*!
 * Copyright 2022 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
import { DomBuilderObject, ExtendedHTMLElement } from '../helper/dom';
import '../styles/components/_collapsible-content.scss';
interface CollapsibleContentProps {
    title: string | ExtendedHTMLElement | HTMLElement | DomBuilderObject;
    children: Array<string | ExtendedHTMLElement | HTMLElement | DomBuilderObject>;
    classNames?: string[];
    initialCollapsedState?: boolean;
    onCollapseStateChange?: (collapsed: boolean) => void;
}
export declare class CollapsibleContent {
    render: ExtendedHTMLElement;
    private readonly props;
    private readonly uid;
    private icon;
    constructor(props: CollapsibleContentProps);
}
export {};
