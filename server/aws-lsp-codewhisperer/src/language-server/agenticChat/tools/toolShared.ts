import { Features } from '@aws/language-server-runtimes/server-interface/server'
import { workspaceUtils } from '@aws/lsp-core'
import { getWorkspaceFolderPaths } from '@aws/lsp-core/out/util/workspaceUtils'
import * as path from 'path'
import { CommandCategory } from './executeBash'

interface Output<Kind, Content> {
    kind: Kind
    content: Content
    success?: boolean
}

export interface InvokeOutput {
    output: Output<'text', string> | Output<'json', object>
}

export interface CommandValidation {
    requiresAcceptance: boolean
    warning?: string
    commandCategory?: CommandCategory
}

export async function validatePath(path: string, exists: (p: string) => Promise<boolean>) {
    if (!path || path.trim().length === 0) {
        throw new Error('Path cannot be empty.')
    }
    const pathExists = await exists(path)
    if (!pathExists) {
        throw new Error(`Path "${path}" does not exist or cannot be accessed.`)
    }
}

export class ToolApprovalException extends Error {
    public override readonly message: string
    public readonly shouldShowMessage: boolean

    constructor(message: string = 'Tool execution invalidated', shouldShowMessage: boolean = true) {
        super(message)
        this.message = message
        this.shouldShowMessage = shouldShowMessage
    }
}
export interface ExplanatoryParams {
    explanation?: string
}

export enum OutputKind {
    Text = 'text',
    Json = 'json',
}

/**
 * Checks if a path has already been approved
 * @param path The path to check
 * @param approvedPaths Set of approved paths
 * @returns True if the path or any parent directory has been approved
 */
export function isPathApproved(filePath: string, approvedPaths?: Set<string>): boolean {
    if (!approvedPaths || approvedPaths.size === 0) {
        return false
    }

    // Normalize path separators for consistent comparison
    const normalizedFilePath = filePath.replace(/\\\\/g, '/')

    // Check if the exact path is approved (try both original and normalized)
    if (approvedPaths.has(filePath) || approvedPaths.has(normalizedFilePath)) {
        return true
    }

    // Get the root directory for traversal limits
    const rootDir = path.parse(filePath).root.replace(/\\\\/g, '/')

    // Check if any approved path is a parent of the file path using isParentFolder
    for (const approvedPath of approvedPaths) {
        const normalizedApprovedPath = approvedPath.replace(/\\\\/g, '/')

        // Check using the isParentFolder utility
        if (workspaceUtils.isParentFolder(normalizedApprovedPath, normalizedFilePath)) {
            return true
        }

        // Also check with trailing slash variations to ensure consistency
        if (normalizedApprovedPath.endsWith('/')) {
            // Try without trailing slash
            const withoutSlash = normalizedApprovedPath.slice(0, -1)
            if (workspaceUtils.isParentFolder(withoutSlash, normalizedFilePath)) {
                return true
            }
        } else {
            // Try with trailing slash
            const withSlash = normalizedApprovedPath + '/'
            if (workspaceUtils.isParentFolder(withSlash, normalizedFilePath)) {
                return true
            }
        }
    }

    return false
}

/**
 * Shared implementation to check if a file path requires user acceptance.
 * Returns true when the file is not resolvable within our workspace (i.e., is outside of our workspace).
 * If the path has already been approved (in approvedPaths), returns false.
 *
 * @param path The file path to check
 * @param lsp The LSP feature to get workspace folders
 * @param logging Optional logging feature for better error reporting
 * @param approvedPaths Optional set of paths that have already been approved
 * @returns CommandValidation object with requiresAcceptance flag
 */
export async function requiresPathAcceptance(
    path: string,
    workspace: Features['workspace'],
    logging: Features['logging'],
    approvedPaths?: Set<string>
): Promise<CommandValidation> {
    try {
        // First check if the path is already approved
        if (isPathApproved(path, approvedPaths)) {
            return { requiresAcceptance: false }
        }

        const workspaceFolders = getWorkspaceFolderPaths(workspace)
        if (!workspaceFolders || workspaceFolders.length === 0) {
            if (logging) {
                logging.debug('No workspace folders found when checking file acceptance')
            }
            return { requiresAcceptance: true }
        }
        const isInWorkspace = workspaceUtils.isInWorkspace(workspaceFolders, path)
        return { requiresAcceptance: !isInWorkspace }
    } catch (error) {
        if (logging) {
            logging.error(`Error checking file acceptance: ${error}`)
        }
        // In case of error, safer to require acceptance
        return { requiresAcceptance: true }
    }
}
