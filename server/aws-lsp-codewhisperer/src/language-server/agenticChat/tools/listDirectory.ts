// Port from VSC: https://github.com/aws/aws-toolkit-vscode/blob/0eea1d8ca6e25243609a07dc2a2c31886b224baa/packages/core/src/codewhispererChat/tools/listDirectory.ts#L19
import { CommandValidation, InvokeOutput, requiresPathAcceptance, validatePath } from './toolShared'
import { CancellationError, workspaceUtils } from '@aws/lsp-core'
import { Features } from '@aws/language-server-runtimes/server-interface/server'
import { sanitize } from '@aws/lsp-core/out/util/path'
import { DEFAULT_EXCLUDE_PATTERNS } from '../../chat/constants'
import { getWorkspaceFolderPaths } from '@aws/lsp-core/out/util/workspaceUtils'
import { CancellationToken } from '@aws/language-server-runtimes/protocol'

export interface ListDirectoryParams {
    path: string
    maxDepth?: number
}

export class ListDirectory {
    private readonly logging: Features['logging']
    private readonly workspace: Features['workspace']
    private readonly lsp: Features['lsp']

    constructor(features: Pick<Features, 'logging' | 'workspace' | 'lsp'>) {
        this.logging = features.logging
        this.workspace = features.workspace
        this.lsp = features.lsp
    }

    public async validate(params: ListDirectoryParams): Promise<void> {
        if (params.maxDepth !== undefined && params.maxDepth < 0) {
            throw new Error('MaxDepth cannot be negative.')
        }
        await validatePath(params.path, this.workspace.fs.exists)
    }

    public async queueDescription(params: ListDirectoryParams, updates: WritableStream, requiresAcceptance: boolean) {
        const writer = updates.getWriter()
        const closeWriter = async (w: WritableStreamDefaultWriter) => {
            await w.close()
            w.releaseLock()
        }
        if (!requiresAcceptance) {
            await writer.write('')
            await closeWriter(writer)
            return
        }
        if (params.maxDepth === undefined) {
            await writer.write(`Listing directory recursively: ${params.path}`)
        } else if (params.maxDepth === 0) {
            await writer.write(`Listing directory: ${params.path}`)
        } else {
            const level = params.maxDepth > 1 ? 'levels' : 'level'
            await writer.write(`Listing directory: ${params.path} limited to ${params.maxDepth} subfolder ${level}`)
        }
        await closeWriter(writer)
    }

    public async requiresAcceptance(params: ListDirectoryParams): Promise<CommandValidation> {
        return requiresPathAcceptance(params.path, this.lsp, this.logging)
    }

    public async invoke(params: ListDirectoryParams, token?: CancellationToken): Promise<InvokeOutput> {
        const path = sanitize(params.path)
        try {
            const listing = await workspaceUtils.readDirectoryRecursively(
                { workspace: this.workspace, logging: this.logging },
                path,
                { maxDepth: params.maxDepth, excludePatterns: DEFAULT_EXCLUDE_PATTERNS },
                token
            )
            return this.createOutput(listing.join('\n'))
        } catch (error: any) {
            if (CancellationError.isUserCancelled(error)) {
                // bubble this up to the main agentic chat loop
                throw error
            }
            this.logging.error(`Failed to list directory "${path}": ${error.message || error}`)
            throw new Error(`Failed to list directory "${path}": ${error.message || error}`)
        }
    }

    private createOutput(content: string): InvokeOutput {
        return {
            output: {
                kind: 'text',
                content: content,
            },
        }
    }

    public getSpec() {
        return {
            name: 'listDirectory',
            description:
                'List the contents of a directory and its subdirectories.\n\n' +
                '## Overview\n' +
                'This tool recursively lists directory contents, ignoring common build and dependency directories.\n\n' +
                '## When to use\n' +
                '- When exploring a codebase or project structure\n' +
                '- When you need to discover files in a directory hierarchy\n' +
                '- When you need to understand the organization of a project\n\n' +
                '## When not to use\n' +
                '- When you already know the exact file path you need\n' +
                '- When you need to confirm the existence of files you may have created (the user will let you know if files were created successfully)\n' +
                '- When you need to search for specific file patterns (consider using a search tool instead)\n\n' +
                '## Notes\n' +
                '- This tool will ignore directories such as `build/`, `out/`, `dist/` and `node_modules/`\n' +
                '- This tool is more effective than running a command like `ls` using `executeBash` tool\n' +
                '- Results clearly distinguish between files, directories or symlinks with [F], [D] and [L] prefixes\n' +
                '- Use the `maxDepth` parameter to control how deep the directory traversal goes\n\n' +
                '## Related tools\n' +
                '- fsRead: Use to examine files after finding them\n' +
                '- fsWrite: Use to modify files after finding them',
            inputSchema: {
                type: 'object',
                properties: {
                    path: {
                        type: 'string',
                        description: 'Absolute path to a directory, e.g., `/repo`.',
                    },
                    maxDepth: {
                        type: 'number',
                        description:
                            'Maximum depth to traverse when listing directories. Use `0` to list only the specified directory, `1` to include immediate subdirectories, etc. If it is not provided, it will list all subdirectories recursively.',
                    },
                },
                required: ['path'],
            },
        } as const
    }
}
