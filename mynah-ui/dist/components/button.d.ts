/*!
 * Copyright 2022 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
import { ExtendedHTMLElement } from '../helper/dom';
import { OverlayHorizontalDirection, OverlayVerticalDirection } from './overlay';
import '../styles/components/_button.scss';
export interface ButtonProps {
    classNames?: string[];
    attributes?: Record<string, string>;
    icon?: HTMLElement | ExtendedHTMLElement;
    label?: HTMLElement | ExtendedHTMLElement | string;
    tooltip?: string;
    tooltipVerticalDirection?: OverlayVerticalDirection;
    tooltipHorizontalDirection?: OverlayHorizontalDirection;
    children?: Array<HTMLElement | ExtendedHTMLElement | string>;
    primary?: boolean;
    additionalEvents?: Record<string, (event?: any) => any>;
    onClick: (e: Event) => void;
}
export declare abstract class ButtonAbstract {
    render: ExtendedHTMLElement;
    updateLabel: (label: HTMLElement | ExtendedHTMLElement | string) => void;
    setEnabled: (enabled: boolean) => void;
}
export declare class Button extends ButtonAbstract {
    render: ExtendedHTMLElement;
    constructor(props: ButtonProps);
    updateLabel: (label: HTMLElement | ExtendedHTMLElement | string) => void;
    setEnabled: (enabled: boolean) => void;
}
