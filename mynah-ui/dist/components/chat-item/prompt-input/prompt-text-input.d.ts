import { ExtendedHTMLElement } from '../../../helper/dom';
export interface PromptTextInputProps {
    tabId: string;
    initMaxLength: number;
    contextReplacement?: boolean;
    onKeydown: (e: KeyboardEvent) => void;
    onInput?: (e: KeyboardEvent) => void;
}
export declare class PromptTextInput {
    render: ExtendedHTMLElement;
    promptTextInputMaxLength: number;
    private readonly props;
    private readonly promptTextInputSizer;
    private readonly promptTextInput;
    private keydownSupport;
    constructor(props: PromptTextInputProps);
    private readonly updatePromptTextInputSizer;
    readonly setContextReplacement: (contextReplacement: boolean) => void;
    readonly getCursorPos: () => number;
    readonly getWordAndIndexOnCursorPos: () => {
        wordStartIndex: number;
        word: string;
    };
    readonly clear: () => void;
    readonly focus: (cursorIndex?: number) => void;
    readonly getTextInputValue: () => string;
    readonly updateTextInputValue: (value: string, placeHolder?: {
        index?: number;
        text?: string;
    }) => void;
    readonly updateTextInputMaxLength: (maxLength: number) => void;
    readonly updateTextInputPlaceholder: (text: string) => void;
}
