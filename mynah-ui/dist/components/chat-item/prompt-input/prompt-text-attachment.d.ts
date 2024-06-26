import { ExtendedHTMLElement } from '../../../helper/dom';
import { PromptAttachmentType } from '../../../static';
export interface PromptTextAttachmentProps {
    tabId: string;
    content: string;
    type: PromptAttachmentType;
}
export declare class PromptTextAttachment {
    render: ExtendedHTMLElement;
    private readonly props;
    private previewOverlay;
    constructor(props: PromptTextAttachmentProps);
    private readonly showPreviewOverLay;
    private readonly closePreviewOverLay;
    readonly clear: () => void;
}
