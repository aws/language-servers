import { sanitize } from '@aws/lsp-core/out/util/path'
import { CommandValidation, InvokeOutput, requiresPathAcceptance, validatePath } from './toolShared'
import { Features } from '@aws/language-server-runtimes/server-interface/server'

export interface FsReadParams {
    paths: string[]
}

export interface FileReadResult {
    path: string
    content: string
    truncated: boolean
}

export class FsRead {
    static maxResponseSize = 200_000
    static maxResponseSizeTotal = 400_000
    private readonly logging: Features['logging']
    private readonly workspace: Features['workspace']
    private readonly lsp: Features['lsp']

    constructor(features: Pick<Features, 'lsp' | 'workspace' | 'logging'> & Partial<Features>) {
        this.logging = features.logging
        this.workspace = features.workspace
        this.lsp = features.lsp
    }

    public async validate(params: FsReadParams): Promise<void> {
        for (const path of params.paths) {
            await validatePath(path, this.workspace.fs.exists)
        }
    }

    public async requiresAcceptance(params: FsReadParams, approvedPaths?: Set<string>): Promise<CommandValidation> {
        // Check acceptance for all paths in the array
        for (const path of params.paths) {
            const validation = await requiresPathAcceptance(path, this.lsp, this.logging, approvedPaths)
            if (validation.requiresAcceptance) {
                return validation
            }
        }
        return { requiresAcceptance: false }
    }

    public async invoke(params: FsReadParams): Promise<InvokeOutput> {
        const fileResult: FileReadResult[] = []
        for (const path of params.paths) {
            const sanitizedPath = sanitize(path)
            const content = await this.readFile(sanitizedPath)
            this.logging.info(`Read file: ${sanitizedPath}, size: ${content.length}`)
            fileResult.push({ path, content, truncated: false })
        }

        return this.createOutput(fileResult)
    }

    private async readFile(filePath: string): Promise<string> {
        this.logging.info(`Reading file: ${filePath}`)
        return await this.workspace.fs.readFile(filePath)
    }

    private createOutput(fileResult: FileReadResult[]): InvokeOutput {
        let totalSize = 0
        for (const result of fileResult) {
            const exceedsMaxSize = result.content.length > FsRead.maxResponseSize
            if (exceedsMaxSize) {
                this.logging.info(`FsRead: truncating ${result.path} to first ${FsRead.maxResponseSize} characters`)
                result.content = result.content.substring(0, FsRead.maxResponseSize - 3) + '...'
                result.truncated = true
            }
            totalSize += result.content.length
        }

        if (totalSize > FsRead.maxResponseSizeTotal) {
            throw Error('Files are too large, please break the file read into smaller chunks')
        }

        return {
            output: {
                kind: 'json',
                content: fileResult,
            },
        }
    }

    public getSpec() {
        return {
            name: 'fsRead',
            description:
                'A tool for reading files.\n\n' +
                '## Overview\n' +
                'This tool returns the contents of files.\n\n' +
                '## When to use\n' +
                '- When you need to examine the content of a file or multiple files\n' +
                '- When you need to analyze code or configuration files\n\n' +
                '## When not to use\n' +
                '- When you need to search for patterns across multiple files\n' +
                '- When you need to process files in binary format\n\n' +
                '## Notes\n' +
                '- Prioritize reading multiple files at once by passing in multiple paths rather than calling this tool with a single path multiple times\n' +
                '- When reading multiple files, the total characters combined cannot exceed 400K characters, break the step into smaller chunks if it happens\n' +
                '- This tool is more effective than running a command like `head -n` using `executeBash` tool\n' +
                '- If a file exceeds 200K characters, this tool will only read the first 200K characters of the file with a `truncated=true` in the output',
            inputSchema: {
                type: 'object',
                properties: {
                    paths: {
                        description: 'List of file paths to read in a sequence',
                        type: 'array',
                        items: {
                            type: 'string',
                            description:
                                'Absolute path to a file, e.g. `/repo/file.py` for Unix-like system including Unix/Linux/macOS or `d:\\repo\\file.py` for Windows.',
                        },
                    },
                },
                required: ['paths'],
            },
        } as const
    }
}
