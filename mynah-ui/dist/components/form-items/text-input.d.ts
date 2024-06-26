/*!
 * Copyright 2022 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
import { ExtendedHTMLElement } from '../../helper/dom';
import '../../styles/components/_form-input.scss';
export interface TextInputProps {
    classNames?: string[];
    attributes?: Record<string, string>;
    label?: HTMLElement | ExtendedHTMLElement | string;
    placeholder?: string;
    type?: 'text' | 'number' | 'email';
    value?: string;
    onChange?: (value: string) => void;
}
export declare abstract class TextInputAbstract {
    render: ExtendedHTMLElement;
    setValue: (value: string) => void;
    getValue: () => string;
    setEnabled: (enabled: boolean) => void;
}
export declare class TextInputInternal extends TextInputAbstract {
    private readonly inputElement;
    render: ExtendedHTMLElement;
    constructor(props: TextInputProps);
    setValue: (value: string) => void;
    getValue: () => string;
    setEnabled: (enabled: boolean) => void;
}
export declare class TextInput extends TextInputAbstract {
    render: ExtendedHTMLElement;
    constructor(props: TextInputProps);
    setValue: (value: string) => void;
    getValue: () => string;
    setEnabled: (enabled: boolean) => void;
}
