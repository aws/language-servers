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
 * Checks if a path has already been approved for a specific tool
 * @param path The path to check
 * @param toolName The name of the tool requesting access
 * @param approvedPaths Map of tool names to their approved paths
 * @returns True if the path or any parent directory has been approved for this tool
 */
export function isPathApproved(filePath: string, toolName: string, approvedPaths?: Map<string, Set<string>>): boolean {
    if (!approvedPaths || approvedPaths.size === 0) {
        return false
    }

    const toolPaths = approvedPaths.get(toolName)
    if (!toolPaths || toolPaths.size === 0) {
        return false
    }

    // Normalize path separators for consistent comparison
    const normalizedFilePath = filePath.replace(/\\\\/g, '/')

    // Check if the exact path is approved for this tool
    if (toolPaths.has(filePath) || toolPaths.has(normalizedFilePath)) {
        return true
    }

    // Get the root directory for traversal limits
    const rootDir = path.parse(filePath).root.replace(/\\\\/g, '/')

    // Check if any approved path is a parent of the file path using isParentFolder
    for (const approvedPath of toolPaths) {
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
/**
 * Shared implementation to check if a file path requires user acceptance.
 * Returns true when the file is not resolvable within our workspace (i.e., is outside of our workspace).
 * If the path has already been approved (in approvedPaths), returns false.
 *
 * @param path The file path to check
 * @param toolName The name of the tool requesting access
 * @param workspace The workspace feature to get workspace folders
 * @param logging Optional logging feature for better error reporting
 * @param approvedPaths Optional map of tool names to their approved paths
 * @returns CommandValidation object with requiresAcceptance flag
 */
export async function requiresPathAcceptance(
    inputPath: string,
    toolName: string,
    workspace: Features['workspace'],
    logging: Features['logging'],
    approvedPaths?: Map<string, Set<string>>
): Promise<CommandValidation> {
    try {
        // Canonicalize the path first to resolve any ".." traversal sequences.
        // This prevents bypasses like "/workspace/../../etc" appearing to be in-workspace.
        const canonicalPath = path.resolve(inputPath)

        // Check for sensitive paths on BOTH the raw input and the resolved path
        if (isSensitivePath(inputPath) || isSensitivePath(canonicalPath)) {
            return {
                requiresAcceptance: true,
                warning: 'Access to sensitive system files requires explicit approval',
            }
        }

        // Then check if the path is already approved for this specific tool
        if (isPathApproved(canonicalPath, toolName, approvedPaths)) {
            return { requiresAcceptance: false }
        }

        const workspaceFolders = getWorkspaceFolderPaths(workspace)
        if (!workspaceFolders || workspaceFolders.length === 0) {
            if (logging) {
                logging.debug('No workspace folders found when checking file acceptance')
            }
            return { requiresAcceptance: true }
        }

        const isInWorkspace = workspaceUtils.isInWorkspace(workspaceFolders, canonicalPath)
        return { requiresAcceptance: !isInWorkspace }
    } catch (error) {
        if (logging) {
            logging.error(`Error checking file acceptance: ${error}`)
        }
        // In case of error, safer to require acceptance
        return { requiresAcceptance: true }
    }
}

function isSensitivePath(filePath: string): boolean {
    const sensitivePatterns = [
        /\/\.ssh\//,
        /\/\.aws\//,
        /\/\.env$/,
        /\/\.env\./,
        /password/i,
        /secret/i,
        /credential/i,
        /private.*key/i,
        /\/etc\//,
        /\/proc\//,
        /\/sys\//,
        /\/dev\//,
    ]

    return sensitivePatterns.some(pattern => pattern.test(filePath))
}
