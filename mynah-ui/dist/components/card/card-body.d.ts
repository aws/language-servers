/*!
 * Copyright 2022 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
import { DomBuilderObject, ExtendedHTMLElement } from '../../helper/dom';
import { CodeBlockActions, OnCodeBlockActionFunction, OnCopiedToClipboardFunction, ReferenceTrackerInformation } from '../../static';
import '../../styles/components/card/_card.scss';
export declare const highlightersWithTooltip: {
    start: {
        markupStart: string;
        markupAttributes: (markerIndex: string) => string;
        markupEnd: string;
    };
    end: {
        markup: string;
    };
};
export declare const PARTS_CLASS_NAME = "typewriter-part";
export declare const PARTS_CLASS_NAME_VISIBLE = "typewriter";
export interface CardBodyProps {
    body?: string;
    children?: Array<ExtendedHTMLElement | HTMLElement | string | DomBuilderObject>;
    childLocation?: 'above-body' | 'below-body';
    highlightRangeWithTooltip?: ReferenceTrackerInformation[];
    codeBlockActions?: CodeBlockActions;
    useParts?: boolean;
    codeBlockStartIndex?: number;
    processChildren?: boolean;
    classNames?: string[];
    onLinkClick?: (url: string, e: MouseEvent) => void;
    onCopiedToClipboard?: OnCopiedToClipboardFunction;
    onCodeBlockAction?: OnCodeBlockActionFunction;
}
export declare class CardBody {
    render: ExtendedHTMLElement;
    props: CardBodyProps;
    nextCodeBlockIndex: number;
    codeBlockStartIndex: number;
    private highlightRangeTooltip;
    private highlightRangeTooltipTimeout;
    constructor(props: CardBodyProps);
    private readonly processNode;
    private readonly getReferenceTrackerInformationFromElement;
    private readonly showHighlightRangeTooltip;
    private readonly hideHighlightRangeTooltip;
    private readonly getContentBodyChildren;
}
