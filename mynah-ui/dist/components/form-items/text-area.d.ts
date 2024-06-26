/*!
 * Copyright 2022 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
import { ExtendedHTMLElement } from '../../helper/dom';
import '../../styles/components/_form-input.scss';
export interface TextAreaProps {
    classNames?: string[];
    attributes?: Record<string, string>;
    label?: HTMLElement | ExtendedHTMLElement | string;
    placeholder?: string;
    value?: string;
    onChange?: (value: string) => void;
}
export declare abstract class TextAreaAbstract {
    render: ExtendedHTMLElement;
    setValue: (value: string) => void;
    getValue: () => string;
    setEnabled: (enabled: boolean) => void;
}
export declare class TextAreaInternal extends TextAreaAbstract {
    private readonly inputElement;
    render: ExtendedHTMLElement;
    constructor(props: TextAreaProps);
    setValue: (value: string) => void;
    getValue: () => string;
    setEnabled: (enabled: boolean) => void;
}
export declare class TextArea extends TextAreaAbstract {
    render: ExtendedHTMLElement;
    constructor(props: TextAreaProps);
    setValue: (value: string) => void;
    getValue: () => string;
    setEnabled: (enabled: boolean) => void;
}
