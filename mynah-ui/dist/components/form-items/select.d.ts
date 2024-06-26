/*!
 * Copyright 2022 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
import { ExtendedHTMLElement } from '../../helper/dom';
import { MynahIcons } from '../icon';
import '../../styles/components/_form-input.scss';
interface SelectOption {
    value: string;
    label: string;
}
export interface SelectProps {
    classNames?: string[];
    attributes?: Record<string, string>;
    icon?: MynahIcons;
    label?: HTMLElement | ExtendedHTMLElement | string;
    value?: string;
    optional?: boolean;
    options?: SelectOption[];
    placeholder?: string;
    onChange?: (value: string) => void;
}
export declare abstract class SelectAbstract {
    render: ExtendedHTMLElement;
    setValue: (value: string) => void;
    getValue: () => string;
    setEnabled: (enabled: boolean) => void;
}
export declare class SelectInternal {
    private readonly selectElement;
    render: ExtendedHTMLElement;
    constructor(props: SelectProps);
    setValue: (value: string) => void;
    getValue: () => string;
    setEnabled: (enabled: boolean) => void;
}
export declare class Select extends SelectAbstract {
    render: ExtendedHTMLElement;
    constructor(props: SelectProps);
    setValue: (value: string) => void;
    getValue: () => string;
    setEnabled: (enabled: boolean) => void;
}
export {};
