// FileSearch tool based on ListDirectory implementation
import { CommandValidation, InvokeOutput, validatePath } from './toolShared'
import { workspaceUtils } from '@aws/lsp-core'
import { Features } from '@aws/language-server-runtimes/server-interface/server'
import { sanitize } from '@aws/lsp-core/out/util/path'
import { DEFAULT_EXCLUDE_PATTERNS } from '../../chat/constants'
import { getWorkspaceFolderPaths } from '@aws/lsp-core/out/util/workspaceUtils'

export interface FileSearchParams {
    path: string
    pattern: string
    maxDepth?: number
    caseSensitive?: boolean
}

export class FileSearch {
    private readonly logging: Features['logging']
    private readonly workspace: Features['workspace']
    private readonly lsp: Features['lsp']

    constructor(features: Pick<Features, 'logging' | 'workspace' | 'lsp'>) {
        this.logging = features.logging
        this.workspace = features.workspace
        this.lsp = features.lsp
    }

    public async validate(params: FileSearchParams): Promise<void> {
        if (params.maxDepth !== undefined && params.maxDepth < 0) {
            throw new Error('MaxDepth cannot be negative.')
        }
        await validatePath(params.path, this.workspace.fs.exists)

        // Validate regex pattern
        try {
            new RegExp(params.pattern, params.caseSensitive ? '' : 'i')
        } catch (error) {
            throw new Error(`Invalid regex pattern: ${(error as Error).message}`)
        }
    }

    public async queueDescription(params: FileSearchParams, updates: WritableStream, requiresAcceptance: boolean) {
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

        const caseSensitiveText = params.caseSensitive ? 'case-sensitive' : 'case-insensitive'
        if (params.maxDepth === undefined) {
            await writer.write(
                `Searching recursively in ${params.path} for files matching pattern "${params.pattern}" (${caseSensitiveText})`
            )
        } else if (params.maxDepth === 0) {
            await writer.write(
                `Searching in ${params.path} for files matching pattern "${params.pattern}" (${caseSensitiveText})`
            )
        } else {
            const level = params.maxDepth > 1 ? 'levels' : 'level'
            await writer.write(
                `Searching in ${params.path} limited to ${params.maxDepth} subfolder ${level} for files matching pattern "${params.pattern}" (${caseSensitiveText})`
            )
        }
        await closeWriter(writer)
    }

    public async requiresAcceptance(params: FileSearchParams): Promise<CommandValidation> {
        return { requiresAcceptance: !workspaceUtils.isInWorkspace(getWorkspaceFolderPaths(this.lsp), params.path) }
    }

    public async invoke(params: FileSearchParams): Promise<InvokeOutput> {
        const path = sanitize(params.path)
        try {
            // Get all files and directories
            const listing = await workspaceUtils.readDirectoryRecursively(
                { workspace: this.workspace, logging: this.logging },
                path,
                { maxDepth: params.maxDepth, excludePatterns: DEFAULT_EXCLUDE_PATTERNS }
            )

            // Create regex pattern for filtering
            const regex = new RegExp(params.pattern, params.caseSensitive ? '' : 'i')

            // Filter the results based on the pattern
            const filteredResults = listing.filter(item => regex.test(item))

            if (filteredResults.length === 0) {
                return this.createOutput(`No files matching pattern "${params.pattern}" found in ${path}`)
            }

            return this.createOutput(filteredResults.join('\n'))
        } catch (error: any) {
            this.logging.error(`Failed to search directory "${path}": ${error.message || error}`)
            throw new Error(`Failed to search directory "${path}": ${error.message || error}`)
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
            name: 'fileSearch',
            description:
                'Search for files in a directory and its subdirectories using regex patterns. It filters out build outputs such as `build/`, `out/` and `dist` and dependency directories such as `node_modules/`.\n * Results are filtered by the provided regex pattern.\n * Case sensitivity can be controlled with the caseSensitive parameter.\n * Results clearly distinguish between files, directories or symlinks with [F], [D] and [L] prefixes.',
            inputSchema: {
                type: 'object',
                properties: {
                    path: {
                        type: 'string',
                        description: 'Absolute path to a directory, e.g., `/repo`.',
                    },
                    pattern: {
                        type: 'string',
                        description: 'Regex pattern to match against file and directory names.',
                    },
                    maxDepth: {
                        type: 'number',
                        description:
                            'Maximum depth to traverse when searching directories. Use `0` to search only the specified directory, `1` to include immediate subdirectories, etc. If it is not provided, it will search all subdirectories recursively.',
                    },
                    caseSensitive: {
                        type: 'boolean',
                        description:
                            'Whether the pattern matching should be case-sensitive. Defaults to false if not provided.',
                    },
                },
                required: ['path', 'pattern'],
            },
        } as const
    }
}
