import { Features } from '@aws/language-server-runtimes/server-interface/server'
import { workspaceUtils } from '@aws/lsp-core'
import { getWorkspaceFolderPaths } from '@aws/lsp-core/out/util/workspaceUtils'

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

export interface CommandValidation {
    requiresAcceptance: boolean
    warning?: string
}

export class ToolApprovalException extends Error {
    constructor() {
        super(`Tool execution invalidated`)
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
 * Shared implementation to check if a file path requires user acceptance.
 * Returns true when the file is not resolvable within our workspace (i.e., is outside of our workspace).
 *
 * @param path The file path to check
 * @param lsp The LSP feature to get workspace folders
 * @param logging Optional logging feature for better error reporting
 * @returns CommandValidation object with requiresAcceptance flag
 */
export async function requiresPathAcceptance(
    path: string,
    lsp: Features['lsp'],
    logging?: Features['logging']
): Promise<CommandValidation> {
    try {
        const workspaceFolders = getWorkspaceFolderPaths(lsp)
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
