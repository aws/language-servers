/*!
 * Copyright 2022 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
import { ExtendedHTMLElement } from '../helper/dom';
import '../styles/components/_nav-tabs.scss';
export interface TabsProps {
    onChange?: (selectedTabId: string) => void;
    onBeforeTabRemove?: (tabId: string) => boolean;
}
export declare class Tabs {
    render: ExtendedHTMLElement;
    private tabIdTitleSubscriptions;
    private tabIdChatItemsSubscriptions;
    private toggleGroup;
    private maxReachedOverlay;
    private closeConfirmationOverlay;
    private readonly props;
    constructor(props: TabsProps);
    private readonly getTabOptionsFromTabStoreData;
    private readonly getTabsRender;
    private readonly showMaxReachedOverLay;
    private readonly hideMaxReachedOverLay;
    private readonly showCloseTabConfirmationOverLay;
    private readonly hideshowCloseTabConfirmationOverLay;
    private readonly assignListener;
    private readonly removeListenerAssignments;
}
