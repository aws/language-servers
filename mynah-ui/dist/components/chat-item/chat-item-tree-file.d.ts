import { ExtendedHTMLElement } from '../../helper/dom';
import { FileNodeAction, TreeNodeDetails } from '../../static';
import { MynahIcons } from '../icon';
export interface ChatItemTreeFileProps {
    tabId: string;
    messageId: string;
    filePath: string;
    originalFilePath: string;
    fileName: string;
    icon?: MynahIcons;
    deleted?: boolean;
    details?: TreeNodeDetails;
    actions?: FileNodeAction[];
}
export declare class ChatItemTreeFile {
    render: ExtendedHTMLElement;
    private fileTooltip;
    private fileTooltipTimeout;
    constructor(props: ChatItemTreeFileProps);
    private readonly showTooltip;
    readonly hideTooltip: () => void;
}
