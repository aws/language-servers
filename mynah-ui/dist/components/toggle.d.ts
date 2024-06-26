/*!
 * Copyright 2022 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
import { ExtendedHTMLElement } from '../helper/dom';
import { MynahIcons } from './icon';
import '../styles/components/_toggle.scss';
export interface ToggleOption {
    label?: ExtendedHTMLElement | string | HTMLElement;
    icon?: MynahIcons;
    disabled?: boolean;
    selected?: boolean;
    value: string;
    disabledTooltip?: string | ExtendedHTMLElement;
}
export interface ToggleProps {
    options: ToggleOption[];
    direction?: 'horizontal' | 'vertical';
    value?: string | null;
    name: string;
    disabled?: boolean;
    onChange?: (selectedValue: string) => void;
    onRemove?: (selectedValue: string, domElement: ExtendedHTMLElement) => void;
}
export declare class Toggle {
    render: ExtendedHTMLElement;
    private readonly props;
    private currentValue?;
    constructor(props: ToggleProps);
    private readonly transformScroll;
    private readonly getChildren;
    private readonly updateSelectionRender;
    setValue: (value: string) => void;
    addOption: (option: ToggleOption) => void;
    removeOption: (value: string) => void;
    updateOptionTitle: (value: string, title: string) => void;
    updateOptionIndicator: (value: string, indication: boolean) => void;
    snapToOption: (value: string) => void;
    getValue: () => string | undefined | null;
}
