import { ExtendedHTMLElement } from '../../../helper/dom';
import { PromptAttachmentType } from '../../../static';
export interface PromptAttachmentProps {
    tabId: string;
}
export declare class PromptAttachment {
    render: ExtendedHTMLElement;
    lastAttachmentContent: string;
    private readonly props;
    private attachmentItem;
    constructor(props: PromptAttachmentProps);
    readonly updateAttachment: (attachmentContent: string | undefined, type?: PromptAttachmentType) => void;
    readonly clear: () => void;
}
