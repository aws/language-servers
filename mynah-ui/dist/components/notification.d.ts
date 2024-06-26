/*!
 * Copyright 2022 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
import { DomBuilderObject, ExtendedHTMLElement } from '../helper/dom';
import { NotificationType } from '../static';
import '../styles/components/_notification.scss';
type NotificationContentType = string | ExtendedHTMLElement | HTMLElement | DomBuilderObject;
export interface NotificationProps {
    duration?: number;
    type?: NotificationType;
    title?: string;
    content: NotificationContentType | NotificationContentType[];
    onNotificationClick?: () => void;
    onNotificationHide?: () => void;
}
export declare class Notification {
    private notificationOverlay;
    private readonly duration;
    private readonly type;
    private readonly props;
    constructor(props: NotificationProps);
    notify(): void;
    /**
     * Calculates the top according to the previously shown and still visible notifications
     * @returns number
     */
    private readonly getNextCalculatedTop;
    private readonly getChildren;
}
export {};
