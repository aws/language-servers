/*!
 * Copyright 2022 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
import { ExtendedHTMLElement } from '../../helper/dom';
export interface FeedbackFormCommentProps {
    onChange?: (comment: string) => void;
    initComment?: string;
}
export declare class FeedbackFormComment {
    render: ExtendedHTMLElement;
    constructor(props: FeedbackFormCommentProps);
    getComment: () => string;
    clear: () => void;
}
