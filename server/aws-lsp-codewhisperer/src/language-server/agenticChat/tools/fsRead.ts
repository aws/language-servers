import { sanitize } from '@aws/lsp-core/out/util/path'
import { URI } from 'vscode-uri'
import { CommandValidation, InvokeOutput, requiresPathAcceptance, validatePath } from './toolShared'
import { Features } from '@aws/language-server-runtimes/server-interface/server'
import { workspaceUtils } from '@aws/lsp-core'
import { getWorkspaceFolderPaths } from '@aws/lsp-core/out/util/workspaceUtils'

// Port of https://github.com/aws/aws-toolkit-vscode/blob/5a0404eb0e2c637ca3bd119714f5c7a24634f746/packages/core/src/codewhispererChat/tools/fsRead.ts#L17

export interface FsReadParams {
    path: string
    readRange?: number[]
}

export class FsRead {
    static maxResponseSize = 200_000
    private readonly logging: Features['logging']
    private readonly workspace: Features['workspace']
    private readonly lsp: Features['lsp']

    constructor(features: Pick<Features, 'lsp' | 'workspace' | 'logging'> & Partial<Features>) {
        this.logging = features.logging
        this.workspace = features.workspace
        this.lsp = features.lsp
    }

    public async validate(params: FsReadParams): Promise<void> {
        await validatePath(params.path, this.workspace.fs.exists)
    }

    public async queueDescription(params: FsReadParams, updates: WritableStream, requiresAcceptance: boolean) {
        const updateWriter = updates.getWriter()
        const closeWriter = async (w: WritableStreamDefaultWriter) => {
            await w.close()
            w.releaseLock()
        }
        if (!requiresAcceptance) {
            await closeWriter(updateWriter)
            return
        }
        await updateWriter.write(`Reading file: [${params.path}]`)

        const [start, end] = params.readRange ?? []

        if (start && end) {
            await updateWriter.write(`from line ${start} to ${end}`)
        } else if (start) {
            const msg =
                start > 0 ? `from line ${start} to end of file` : `${start} line from the end of file to end of file`
            await updateWriter.write(msg)
        } else {
            await updateWriter.write('all lines')
        }
        await closeWriter(updateWriter)
    }

    public async requiresAcceptance(params: FsReadParams): Promise<CommandValidation> {
        return requiresPathAcceptance(params.path, this.lsp, this.logging)
    }

    public async invoke(params: FsReadParams): Promise<InvokeOutput> {
        const path = sanitize(params.path)
        const fileContents = await this.readFile(path)
        this.logging.info(`Read file: ${path}, size: ${fileContents.length}`)
        return this.handleFileRange(params, fileContents)
    }

    private async readFile(filePath: string): Promise<string> {
        this.logging.info(`Reading file: ${filePath}`)
        return await this.workspace.fs.readFile(filePath)
    }

    private handleFileRange(params: FsReadParams, fullText: string): InvokeOutput {
        if (!params.readRange || params.readRange.length === 0) {
            this.logging.log('No range provided. returning entire file.')
            return this.createOutput(fullText)
        }

        const lines = fullText.split('\n')
        const [start, end] = this.parseLineRange(lines.length, params.readRange)
        if (start > end) {
            this.logging.error(`Invalid range: ${params.readRange.join('-')}`)
            return this.createOutput('')
        }

        this.logging.log(`Reading file: ${params.path}, lines ${start + 1}-${end + 1}`)
        const slice = lines.slice(start, end + 1).join('\n')
        return this.createOutput(slice)
    }

    private parseLineRange(lineCount: number, range: number[]): [number, number] {
        const startIdx = range[0]
        let endIdx = range.length >= 2 ? range[1] : undefined

        if (endIdx === undefined) {
            endIdx = -1
        }

        const convert = (i: number): number => {
            return i < 0 ? lineCount + i : i - 1
        }

        const finalStart = Math.max(0, Math.min(lineCount - 1, convert(startIdx)))
        const finalEnd = Math.max(0, Math.min(lineCount - 1, convert(endIdx)))
        return [finalStart, finalEnd]
    }

    private createOutput(content: string): InvokeOutput {
        const exceedsMaxSize = content.length > FsRead.maxResponseSize
        if (exceedsMaxSize) {
            this.logging.info(`FsRead: truncating response to first ${FsRead.maxResponseSize} characters`)
            content = content.substring(0, FsRead.maxResponseSize - 3) + '...'
        }
        return {
            output: {
                kind: 'json',
                content: {
                    content,
                    truncated: exceedsMaxSize,
                },
            },
        }
    }

    public getSpec() {
        return {
            name: 'fsRead',
            description:
                'A tool for reading a file.\n\n' +
                '## Overview\n' +
                'This tool returns the contents of a file, with optional line range specification.\n\n' +
                '## When to use\n' +
                '- When you need to examine the content of a file\n' +
                '- When you need to read specific line ranges from a file\n' +
                '- When you need to analyze code or configuration files\n\n' +
                '## When not to use\n' +
                '- When the file is very large (>200K characters) and you need the full content\n' +
                '- When you need to search for patterns across multiple files\n\n' +
                '## Notes\n' +
                '- This tool is more effective than running a command like `head -n` using `executeBash` tool\n' +
                '- If the file exceeds 200K characters, this tool will only read the first 200K characters of the file with a `truncated=true` in the output\n' +
                '- DO NOT re-read the file again using `readRange` unless explicitly asked by the user\n\n' +
                '## Related tools\n' +
                '- fsWrite: Use to modify the file after reading\n' +
                '- listDirectory: Use to find files before reading them',
            inputSchema: {
                type: 'object',
                properties: {
                    path: {
                        description: 'Absolute path to a file, e.g. `/repo/file.py`.',
                        type: 'string',
                    },
                    readRange: {
                        description:
                            'Optional parameter when reading files.\n * If none is given, the full file is shown. If provided, the file will be shown in the indicated line number range, e.g. [11, 12] will show lines 11 and 12. Indexing at 1 to start. Setting `[startLine, -1]` shows all lines from `startLine` to the end of the file.',
                        type: 'array',
                        items: {
                            type: 'number',
                        },
                    },
                },
                required: ['path'],
            },
        } as const
    }
}
