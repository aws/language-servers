/*!
 * Copyright 2022 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
import { ExtendedHTMLElement } from '../../helper/dom';
import { PromptAttachmentType } from '../../static';
export declare const MAX_USER_INPUT_THRESHOLD = 96;
export declare const MAX_USER_INPUT: () => number;
export interface ChatPromptInputProps {
    tabId: string;
}
export declare class ChatPromptInput {
    render: ExtendedHTMLElement;
    private readonly props;
    private readonly attachmentWrapper;
    private readonly promptTextInput;
    private readonly promptTextInputCommand;
    private readonly remainingCharsIndicator;
    private readonly sendButton;
    private readonly promptAttachment;
    private quickPickTriggerIndex;
    private quickPickType;
    private textAfter;
    private quickPickItemGroups;
    private filteredQuickPickItemGroups;
    private quickPick;
    private quickPickOpen;
    private selectedCommand;
    constructor(props: ChatPromptInputProps);
    private readonly updateAvailableCharactersIndicator;
    private readonly handleInputKeydown;
    private readonly getQuickPickItemGroups;
    private readonly handleQuickActionCommandSelection;
    private readonly handleContextCommandSelection;
    readonly clearTextArea: (keepAttachment?: boolean) => void;
    readonly addAttachment: (attachmentContent: string, type?: PromptAttachmentType) => void;
    private readonly sendPrompt;
}
