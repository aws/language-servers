// FileSearch tool based on ListDirectory implementation
import { CommandValidation, InvokeOutput, requiresPathAcceptance, validatePath } from './toolShared'
import { workspaceUtils } from '@aws/lsp-core'
import { Features } from '@aws/language-server-runtimes/server-interface/server'
import { sanitize } from '@aws/lsp-core/out/util/path'
import { DEFAULT_EXCLUDE_DIRS, DEFAULT_EXCLUDE_FILES } from '../../chat/constants'

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

    public async requiresAcceptance(params: FileSearchParams, approvedPaths?: Set<string>): Promise<CommandValidation> {
        return requiresPathAcceptance(params.path, this.workspace, this.logging, approvedPaths)
    }

    public async invoke(params: FileSearchParams): Promise<InvokeOutput> {
        const path = sanitize(params.path)
        try {
            // Get all files and directories
            const listing = await workspaceUtils.readDirectoryRecursively(
                { workspace: this.workspace, logging: this.logging },
                path,
                { maxDepth: params.maxDepth, excludeDirs: DEFAULT_EXCLUDE_DIRS, excludeFiles: DEFAULT_EXCLUDE_FILES }
            )

            // Create regex pattern for filtering
            const regex = new RegExp(params.pattern, params.caseSensitive ? '' : 'i')

            // Filter the file results based on the pattern
            const filteredResults = listing
                .filter(item => item.startsWith('[F] '))
                .map(item => item.substring(4))
                .filter(item => regex.test(item))

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
                'Search for files in a directory and its subdirectories using regex patterns.\n\n' +
                '## Overview\n' +
                'This tool searches for files matching a regex pattern, ignoring common build and dependency directories.\n\n' +
                '## When to use\n' +
                '- When you need to find files with specific naming patterns\n' +
                '- When you need to locate files before using more targeted tools like fsRead\n' +
                '- When you need to search across a project structure\n\n' +
                '## When not to use\n' +
                '- When you need to search file contents\n' +
                '- When you already know the exact file path\n' +
                '- When you need to list all files in a directory (use listDirectory instead)\n\n' +
                '## Notes\n' +
                '- This tool is more effective than running a command like `find` using `executeBash` tool\n' +
                '- Case sensitivity can be controlled with the caseSensitive parameter\n' +
                '- Use the `maxDepth` parameter to control how deep the directory traversal goes',
            inputSchema: {
                type: 'object',
                properties: {
                    path: {
                        type: 'string',
                        description:
                            'Absolute path to a directory, e.g. `/repo` for Unix-like system including Unix/Linux/macOS or `d:\\repo\\` for Windows',
                    },
                    pattern: {
                        type: 'string',
                        description: 'Regex pattern to match against file names.',
                    },
                    maxDepth: {
                        type: 'number',
                        description:
                            'Maximum depth to traverse when searching files. Use `0` to search only under the specified directory, `1` to include immediate subdirectories, etc. If it is not provided, it will search all subdirectories recursively.',
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
