/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
import { FileNodeAction, TreeNodeDetails } from '../static';
export type TreeNode = FolderNode | FileNode;
export interface FileNode {
    name: string;
    type: 'file';
    filePath: string;
    originalFilePath: string;
    deleted: boolean;
    actions?: FileNodeAction[];
    details?: TreeNodeDetails;
}
export interface FolderNode {
    name: string;
    type: 'folder';
    details?: TreeNodeDetails;
    children: Array<FolderNode | FileNode>;
}
export declare const fileListToTree: (modifiedFilePaths: string[], deletedFilePaths?: string[], actions?: Record<string, FileNodeAction[]>, details?: Record<string, TreeNodeDetails>, rootTitle?: string) => TreeNode;
