/*!
 * Copyright 2022 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
import { DomBuilderObject, ExtendedHTMLElement } from '../helper/dom';
import '../styles/components/_overlay.scss';
export declare const OVERLAY_MARGIN = 8;
/**
 * The horizontal creation direction of the overlay
 */
export declare enum OverlayHorizontalDirection {
    /**
       * starts from the left edge of the reference element and opens to left
       */
    TO_LEFT = "horizontal-direction-to-left",
    /**
       * starts from the right edge of the reference element and opens to left
       */
    END_TO_LEFT = "horizontal-direction-from-end-to-left",
    /**
       * starts from the right edge of the reference element and opens to right
       */
    TO_RIGHT = "horizontal-direction-to-right",
    /**
       * starts from the left edge of the reference element and opens to right
       */
    START_TO_RIGHT = "horizontal-direction-from-start-to-right",
    /**
       * starts and opens at the center of the reference element
       */
    CENTER = "horizontal-direction-at-center"
}
/**
 * The vertical creation direction of the overlay
 */
export declare enum OverlayVerticalDirection {
    /**
       * starts from the bottom edge of the reference element and opens to bottom
       */
    TO_BOTTOM = "vertical-direction-to-bottom",
    /**
       * starts from the top edge of the reference element and opens to bottom
       */
    START_TO_BOTTOM = "vertical-direction-from-start-to-bottom",
    /**
       * starts from the top edge of the reference element and opens to top
       */
    TO_TOP = "vertical-direction-to-top",
    /**
       * starts from the bottom edge of the reference element and opens to top
       */
    END_TO_TOP = "vertical-direction-from-end-to-top",
    /**
       * starts and opens at the center of the reference element
       */
    CENTER = "vertical-direction-at-center"
}
export interface OverlayProps {
    referenceElement?: HTMLElement | ExtendedHTMLElement;
    referencePoint?: {
        top: number;
        left: number;
    };
    children: Array<HTMLElement | ExtendedHTMLElement | DomBuilderObject>;
    horizontalDirection?: OverlayHorizontalDirection;
    verticalDirection?: OverlayVerticalDirection;
    stretchWidth?: boolean;
    dimOutside?: boolean;
    closeOnOutsideClick?: boolean;
    background?: boolean;
    onClose?: () => void;
    removeOtherOverlays?: boolean;
}
export declare class Overlay {
    render: ExtendedHTMLElement;
    private readonly container;
    private readonly innerContainer;
    private readonly guid;
    private readonly onClose;
    constructor(props: OverlayProps);
    close: () => void;
    private readonly windowBlurHandler;
    private readonly getCalculatedLeft;
    private readonly getCalculatedWidth;
    private readonly getCalculatedTop;
    updateContent: (children: Array<string | DomBuilderObject | HTMLElement | ExtendedHTMLElement>) => void;
    toggleHidden: (hidden: boolean) => void;
}
