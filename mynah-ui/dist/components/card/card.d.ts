/*!
 * Copyright 2022 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
import { DomBuilderObject, ExtendedHTMLElement } from '../../helper/dom';
import { EngagementType } from '../../static';
import '../../styles/components/card/_card.scss';
export interface CardProps extends Partial<DomBuilderObject> {
    border?: boolean;
    background?: boolean;
    padding?: 'small' | 'medium' | 'large' | 'none';
    children?: Array<HTMLElement | ExtendedHTMLElement | string>;
    onCardEngaged?: (engagement: {
        engagementDurationTillTrigger: number;
        engagementType: EngagementType;
        totalMouseDistanceTraveled: {
            x: number;
            y: number;
        };
        selectionDistanceTraveled?: {
            x: number;
            y: number;
            selectedText?: string | undefined;
        };
    }) => void;
}
export declare class Card {
    render: ExtendedHTMLElement;
    private readonly props;
    private engagementStartTime;
    private totalMouseDistanceTraveled;
    private previousMousePosition;
    private mouseDownInfo;
    constructor(props: CardProps);
    private readonly resetEngagement;
    private readonly handleEngagement;
}
