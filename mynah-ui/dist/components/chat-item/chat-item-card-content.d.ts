/*!
 * Copyright 2022 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
import { DomBuilderObject, ExtendedHTMLElement } from '../../helper/dom';
import { CardRenderDetails, CodeBlockActions, OnCodeBlockActionFunction, OnCopiedToClipboardFunction, ReferenceTrackerInformation } from '../../static';
import { CardBody } from '../card/card-body';
export interface ChatItemCardContentProps {
    body?: string;
    renderAsStream?: boolean;
    classNames?: string[];
    codeReference?: ReferenceTrackerInformation[];
    onAnimationStateChange?: (isAnimating: boolean) => void;
    contentProperties?: {
        codeBlockActions?: CodeBlockActions;
        onLinkClick?: (url: string, e: MouseEvent) => void;
        onCopiedToClipboard?: OnCopiedToClipboardFunction;
        onCodeBlockAction?: OnCodeBlockActionFunction;
    };
    children?: Array<ExtendedHTMLElement | HTMLElement | string | DomBuilderObject>;
}
export declare class ChatItemCardContent {
    private props;
    render: ExtendedHTMLElement;
    contentBody: CardBody | null;
    private readonly updateStack;
    private typewriterItemIndex;
    private readonly typewriterId;
    private lastAnimationDuration;
    private updateTimer;
    constructor(props: ChatItemCardContentProps);
    private readonly getCardContent;
    private readonly updateCard;
    readonly updateCardStack: (updateWith: Partial<ChatItemCardContentProps>) => void;
    readonly getRenderDetails: () => CardRenderDetails;
}
