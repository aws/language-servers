import { ExtendedHTMLElement } from '../../../helper/dom';
export interface SendButtonProps {
    tabId: string;
    onClick: () => void;
}
export declare class SendButton {
    render: ExtendedHTMLElement;
    private readonly props;
    constructor(props: SendButtonProps);
}
