/*!
 * Copyright 2022 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
import { ExtendedHTMLElement } from '../../helper/dom';
import '../../styles/components/_form-input.scss';
export type StarValues = 1 | 2 | 3 | 4 | 5;
export interface StarsProps {
    classNames?: string[];
    attributes?: Record<string, string>;
    label?: HTMLElement | ExtendedHTMLElement | string;
    value?: string;
    onChange?: (value: string) => void;
    initStar?: StarValues;
}
export declare class Stars {
    private readonly starsContainer;
    render: ExtendedHTMLElement;
    constructor(props: StarsProps);
    setValue: (star: StarValues) => void;
    getValue: () => string;
    setEnabled: (enabled: boolean) => void;
}
