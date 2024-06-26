/*!
 * Copyright 2022 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
import { ExtendedHTMLElement } from '../../helper/dom';
import '../../styles/components/_form-input.scss';
interface SelectOption {
    value: string;
    label: string;
}
export interface RadioGroupProps {
    classNames?: string[];
    attributes?: Record<string, string>;
    label?: HTMLElement | ExtendedHTMLElement | string;
    value?: string;
    optional?: boolean;
    options?: SelectOption[];
    onChange?: (value: string) => void;
}
export declare abstract class RadioGroupAbstract {
    render: ExtendedHTMLElement;
    setValue: (value: string) => void;
    getValue: () => string;
    setEnabled: (enabled: boolean) => void;
}
export declare class RadioGroupInternal extends RadioGroupAbstract {
    private readonly radioGroupElement;
    private readonly groupName;
    render: ExtendedHTMLElement;
    constructor(props: RadioGroupProps);
    setValue: (value: string) => void;
    getValue: () => string;
    setEnabled: (enabled: boolean) => void;
}
export declare class RadioGroup extends RadioGroupAbstract {
    render: ExtendedHTMLElement;
    constructor(props: RadioGroupProps);
    setValue: (value: string) => void;
    getValue: () => string;
    setEnabled: (enabled: boolean) => void;
}
export {};
