/*!
 * Copyright 2022 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
import { FeedbackPayload } from '../../static';
import { ExtendedHTMLElement } from '../../helper/dom';
import '../../styles/components/_feedback-form.scss';
export interface FeedbackFormProps {
    initPayload?: FeedbackPayload;
}
export declare class FeedbackForm {
    private feedbackFormWrapper;
    private readonly feedbackOptionsWrapper;
    private readonly feedbackComment;
    private readonly feedbackSubmitButton;
    private feedbackPayload;
    readonly feedbackFormContainer: ExtendedHTMLElement;
    constructor(props?: FeedbackFormProps);
    private readonly onFeedbackSet;
    close: () => void;
    show: () => void;
}
