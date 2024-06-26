/*!
 * Copyright 2022 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
import { ExtendedHTMLElement } from '../helper/dom';
export interface TabBarButtonsWrapperProps {
    onButtonClick?: (selectedTabId: string, buttonId: string) => void;
}
export declare class TabBarButtonsWrapper {
    render: ExtendedHTMLElement;
    private readonly props;
    constructor(props?: TabBarButtonsWrapperProps);
    private readonly getTabsBarButtonsRender;
}
