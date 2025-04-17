import { sanitize } from '@aws/lsp-core/out/util/path'
import { InvokeOutput } from './toolShared'
import { Features } from '@aws/language-server-runtimes/server-interface/server'

// Port of https://github.com/aws/aws-toolkit-vscode/blob/8e00eefa33f4eee99eed162582c32c270e9e798e/packages/core/src/codewhispererChat/tools/fsRead.ts#L17

export interface FsReadParams {
    path: string
    readRange?: number[]
}

export class FsRead {
    private readonly logging: Features['logging']
    private readonly workspace: Features['workspace']

    constructor(features: Pick<Features, 'workspace' | 'logging'> & Partial<Features>) {
        this.logging = features.logging
        this.workspace = features.workspace
    }

    public async validate(params: FsReadParams): Promise<void> {
        this.logging.debug(`Validating path: ${params.path}`)
        if (!params.path || params.path.trim().length === 0) {
            throw new Error('Path cannot be empty.')
        }

        const fileExists = await this.workspace.fs.exists(params.path)
        if (!fileExists) {
            throw new Error(`Path: "${params.path}" does not exist or cannot be accessed.`)
        }

        this.logging.debug(`Validation succeeded for path: ${params.path}`)
    }

    public async queueDescription(params: FsReadParams, updates: WritableStream) {
        const updateWriter = updates.getWriter()
        await updateWriter.write(`Reading file: ${params.path}]`)

        const [start, end] = params.readRange ?? []

        if (start && end) {
            await updateWriter.write(`from line ${start} to ${end}`)
        } else if (start) {
            if (start > 0) {
                await updateWriter.write(`from line ${start} to end of file`)
            } else {
                await updateWriter.write(`${start} line from the end of file to end of file`)
            }
        } else {
            await updateWriter.write('all lines')
        }
        await updateWriter.close()
        updateWriter.releaseLock()
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
        return {
            output: {
                kind: 'text',
                content: content,
            },
        }
    }

    public getSpec() {
        return {
            name: 'fsRead',
            description:
                'A tool for reading a file.\n * This tool returns the contents of a file, and the optional `readRange` determines what range of lines will be read from the specified file',
            inputSchema: {
                type: 'object',
                properties: {
                    path: {
                        description:
                            'Path to a file, e.g. `/path/to/repo/file.py`. If you want to access a path relative to the current workspace, use relative paths e.g. `./src/file.py`.',
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
