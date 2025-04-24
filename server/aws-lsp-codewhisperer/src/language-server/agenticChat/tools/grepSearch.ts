/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
import { CommandValidation, InvokeOutput, validatePath } from './toolShared'
import { CancellationError, workspaceUtils } from '@aws/lsp-core'
import { Features } from '@aws/language-server-runtimes/server-interface/server'
import { getWorkspaceFolderPaths } from '@aws/lsp-core/out/util/workspaceUtils'
import { CancellationToken } from '@aws/language-server-runtimes/protocol'
import { DEFAULT_EXCLUDE_PATTERNS } from '../../chat/constants'
import { ChildProcess, ChildProcessOptions } from '@aws/lsp-core/out/util/processUtils'
import { rgPath } from '@vscode/ripgrep'
import path = require('path')

export interface GrepSearchParams {
    path?: string
    query: string
    caseSensitive?: boolean
    excludePattern?: string
    includePattern?: string
}

/**
 * Represents the structured output from ripgrep search results
 */
export interface SanitizedRipgrepOutput {
    /** Total number of matches across all files */
    totalMatchCount: number

    /** Array of file match details */
    fileMatches: Array<{
        /** Full path to the file */
        filePath: string

        /** Number of matches in this file */
        matchCount: number

        /** Record of line numbers to matched content */
        matches: Record<string, string>
    }>
}

export class GrepSearch {
    private readonly logging: Features['logging']
    private readonly workspace: Features['workspace']
    private readonly lsp: Features['lsp']

    constructor(features: Pick<Features, 'logging' | 'workspace' | 'lsp'>) {
        this.logging = features.logging
        this.workspace = features.workspace
        this.lsp = features.lsp
    }

    public async validate(params: GrepSearchParams): Promise<void> {
        if (!params.query || params.query.trim().length === 0) {
            throw new Error('Grep search query cannot be empty.')
        }

        const path = this.getSearchDirectory(params.path)
        if (path.trim().length === 0) {
            throw new Error('Path cannot be empty or no workspace folder is available.')
        }

        await validatePath(path, this.workspace.fs.exists)
    }

    public async queueDescription(params: GrepSearchParams, updates: WritableStream, requiresAcceptance: boolean) {
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
        await writer.write(`Searching for \"${params.query}\" in ${params.path || 'workspace'}`)
        await closeWriter(writer)
    }

    public async requiresAcceptance(params: GrepSearchParams): Promise<CommandValidation> {
        const path = this.getSearchDirectory(params.path)
        return { requiresAcceptance: !workspaceUtils.isInWorkspace(getWorkspaceFolderPaths(this.lsp), path) }
    }

    public async invoke(params: GrepSearchParams, token?: CancellationToken): Promise<InvokeOutput> {
        const path = this.getSearchDirectory(params.path)
        try {
            const results = await this.executeRipgrep(params, path, token)
            return this.createOutput(results)
        } catch (error: any) {
            if (CancellationError.isUserCancelled(error)) {
                // bubble this up to the main agentic chat loop
                throw error
            }
            this.logging.error(`Failed to search in \"${path}\": ${error.message || error}`)
            throw new Error(`Failed to search in \"${path}\": ${error.message || error}`)
        }
    }

    private getSearchDirectory(path?: string): string {
        if (path && path.trim().length !== 0) {
            return path
        }

        // Use current workspace folder as default if path is not provided
        const workspaceFolders = getWorkspaceFolderPaths(this.lsp)
        if (workspaceFolders && workspaceFolders.length !== 0) {
            this.logging.debug(`Using default workspace folder: ${workspaceFolders[0]}`)
            return workspaceFolders[0]
        }

        return ''
    }

    private async executeRipgrep(
        params: GrepSearchParams,
        path: string,
        token?: CancellationToken
    ): Promise<SanitizedRipgrepOutput> {
        return new Promise(async (resolve, reject) => {
            const args: string[] = []

            // Add search options
            if (!(params.caseSensitive ?? false)) {
                args.push('-i') // Case insensitive search
            }
            args.push('--line-number') // Show line numbers

            // No heading (don't group matches by file)
            args.push('--no-heading')

            // Don't use color in output
            args.push('--color', 'never')

            // Limit results to prevent overwhelming output
            args.push('--max-count', '50')

            // Add include/exclude patterns
            if (params.includePattern) {
                // Support multiple include patterns
                const patterns = params.includePattern.split(',')
                for (const pattern of patterns) {
                    args.push('--glob', pattern.trim())
                }
            }

            if (params.excludePattern) {
                // Support multiple exclude patterns
                const patterns = params.excludePattern.split(',')
                for (const pattern of patterns) {
                    args.push('--glob', `!${pattern.trim()}`)
                }
            }

            // Add default exclude patterns
            for (const pattern of DEFAULT_EXCLUDE_PATTERNS) {
                args.push('--glob', `!${pattern}`)
            }

            // Add search pattern and path
            args.push(params.query, path)

            this.logging.debug(`Executing ripgrep with args: ${args.join(' ')}`)

            const options: ChildProcessOptions = {
                collect: true,
                logging: 'yes',
                rejectOnErrorCode: code => {
                    if (code !== 0 && code !== 1) {
                        this.logging.error(`Ripgrep process exited with code ${code}`)
                        return new Error(`Ripgrep process exited with code ${code}`)
                    }
                    // For exit codes 0 and 1, don't reject
                    return false as unknown as Error
                },
            }

            try {
                const rg = new ChildProcess(this.logging, rgPath, args, options)

                const result = await rg.run()
                this.logging.info(`Ripgrep search completed with exit code: ${result.exitCode}`)

                // Process the output to format with file URLs and content previews
                const sanitizedOutput = this.processRipgrepOutput(result.stdout)
                resolve(sanitizedOutput)
            } catch (err) {
                reject(err)
            }
        })
    }

    /**
     * Process ripgrep output to:
     * 1. Group results by file
     * 2. Return structured match details for each file
     */
    private processRipgrepOutput(output: string): SanitizedRipgrepOutput {
        if (!output || output.trim() === '') {
            return {
                totalMatchCount: 0,
                fileMatches: [],
            }
        }
        const lines = output.split('\n')
        // Group by file path
        const fileGroups: Record<string, { lineNumbers: string[]; content: string[] }> = {}
        let totalMatchCount = 0
        for (const line of lines) {
            if (!line || line.trim() === '') {
                continue
            }
            // Extract file path, line number, and content
            const parts = line.split(':')
            if (parts.length < 3) {
                continue
            }
            const filePath = parts[0]
            const lineNumber = parts[1]
            const content = parts.slice(2).join(':').trim()
            if (!fileGroups[filePath]) {
                fileGroups[filePath] = { lineNumbers: [], content: [] }
            }
            fileGroups[filePath].lineNumbers.push(lineNumber)
            fileGroups[filePath].content.push(content)
            totalMatchCount++
        }
        // Sort files by match count (most matches first)
        const sortedFiles = Object.entries(fileGroups).sort((a, b) => b[1].lineNumbers.length - a[1].lineNumbers.length)
        // Create structured file matches
        const fileMatches = sortedFiles.map(([filePath, data]) => {
            const matchCount = data.lineNumbers.length
            // Create a regular object instead of a Map for better JSON serialization
            const matches: Record<string, string> = {}
            for (const [idx, lineNum] of data.lineNumbers.entries()) {
                matches[lineNum] = data.content[idx]
            }

            return {
                filePath,
                matchCount,
                matches,
            }
        })

        return {
            totalMatchCount,
            fileMatches,
        }
    }

    private createOutput(content: SanitizedRipgrepOutput): InvokeOutput {
        return {
            output: {
                kind: 'json',
                content: content,
            },
        }
    }

    public getSpec() {
        return {
            name: 'grepSearch',
            description:
                'Search for text content in files within a directory and its subdirectories. It filters out build outputs such as `build/`, `out/` and `dist` and dependency directories such as `node_modules/`.\n * Results include file paths, line numbers, and matching content.\n * Case sensitivity can be controlled with the caseSensitive parameter.\n * Include and exclude patterns can be specified to narrow down the search scope.',
            inputSchema: {
                type: 'object',
                properties: {
                    path: {
                        type: 'string',
                        description:
                            'Absolute path to a directory to search in, e.g., `/repo`. If not provided, the current workspace folder will be used.',
                    },
                    query: {
                        type: 'string',
                        description: 'The text pattern to search for in files.',
                    },
                    caseSensitive: {
                        type: 'boolean',
                        description: 'Whether the search should be case-sensitive. Defaults to false if not provided.',
                    },
                    includePattern: {
                        type: 'string',
                        description: 'Comma-separated glob patterns to include in the search, e.g., "*.js,*.ts".',
                    },
                    excludePattern: {
                        type: 'string',
                        description:
                            'Comma-separated glob patterns to exclude from the search, e.g., "*.min.js,*.d.ts".',
                    },
                },
                required: ['query'],
            },
        } as const
    }
}
