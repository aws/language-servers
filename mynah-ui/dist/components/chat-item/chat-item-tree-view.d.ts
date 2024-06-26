import { ExtendedHTMLElement } from '../../helper/dom';
import { TreeNode } from '../../helper/file-tree';
export interface ChatItemTreeViewProps {
    node: TreeNode;
    depth?: number;
    tabId: string;
    messageId: string;
}
export declare class ChatItemTreeView {
    private readonly node;
    private isOpen;
    private readonly depth;
    private readonly tabId;
    private readonly messageId;
    render: ExtendedHTMLElement;
    constructor(props: ChatItemTreeViewProps);
    getClassNames(): string[];
    updateTree(): void;
    buildFolderChildren(): ExtendedHTMLElement[];
    buildFolderNode(): ExtendedHTMLElement[];
    buildFileNode(): ExtendedHTMLElement[];
}
