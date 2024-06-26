/*!
 * Copyright 2022 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
import { ExtendedHTMLElement } from '../../helper/dom';
export interface ChatPromptInputCommandProps {
    command: string;
    onRemoveClick: () => void;
}
export declare class ChatPromptInputCommand {
    render: ExtendedHTMLElement;
    private readonly props;
    private readonly promptTextInputCommand;
    constructor(props: ChatPromptInputCommandProps);
    setCommand: (command: string) => void;
}
