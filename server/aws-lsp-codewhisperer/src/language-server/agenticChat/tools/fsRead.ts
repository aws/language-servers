/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
import { InvokeOutput, maxToolResponseSize, OutputKind } from './toolShared'
import { Features } from '@aws/language-server-runtimes/server-interface/server'
import { sanitize } from '@aws/lsp-core/out/util/path'

// Port of https://github.com/aws/aws-toolkit-vscode/blob/10bb1c7dc45f128df14d749d95905c0e9b808096/packages/core/src/codewhispererChat/tools/fsRead.ts#L17

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
        this.logging.log(`Validating fsPath: ${params.path}`)
        if (!params.path || params.path.trim().length === 0) {
            throw new Error('Path cannot be empty.')
        }

        const sanitized = sanitize(params.path)
        params.path = sanitized

        let fileExists: boolean
        try {
            fileExists = await this.workspace.fs.exists(params.path)
            if (!fileExists) {
                throw new Error(`Path: "${params.path}" does not exist or cannot be accessed.`)
            }
        } catch (err) {
            throw new Error(`Path: "${params.path}" does not exist or cannot be accessed. (${err})`)
        }

        this.logging.log(`Validation succeeded for path: ${params.path}`)
    }

    public async queueDescription(updates: WritableStream, params: FsReadParams): Promise<void> {
        const writer = updates.getWriter()
        await writer.write(`Reading file: (${params.path}), `)

        const [start, end] = params.readRange ?? []

        if (start && end) {
            await writer.write(`from line ${start} to ${end}`)
        } else if (start) {
            if (start > 0) {
                await writer.write(`from line ${start} to end of file`)
            } else {
                await writer.write(`${start} line from the end of file to end of file`)
            }
        } else {
            await writer.write('all lines')
        }
        await writer.close()
    }

    public async invoke(_updates: WritableStream, params: FsReadParams): Promise<InvokeOutput> {
        try {
            const fileContents = await this.readFile(params.path)
            this.logging.info(`Read file: ${params.path}, size: ${fileContents.length}`)
            return this.handleFileRange(params, fileContents)
        } catch (error: any) {
            this.logging.error(`Failed to read "${params.path}": ${error.message || error}`)
            throw new Error(`Failed to read "${params.path}": ${error.message || error}`)
        }
    }

    private async readFile(filePath: string): Promise<string> {
        this.logging.info(`Reading file: ${filePath}`)
        return await this.workspace.fs.readFile(filePath)
    }

    private handleFileRange(params: FsReadParams, fullText: string): InvokeOutput {
        if (!params.readRange || params.readRange.length === 0) {
            this.logging.log('No range provided. returning entire file.')
            return this.createOutput(this.enforceMaxSize(fullText))
        }

        const lines = fullText.split('\n')
        const [start, end] = this.parseLineRange(lines.length, params.readRange)
        if (start > end) {
            this.logging.error(`Invalid range: ${params.readRange.join('-')}`)
            return this.createOutput('')
        }

        this.logging.log(`Reading file: ${params.path}, lines ${start + 1}-${end + 1}`)
        const slice = lines.slice(start, end + 1).join('\n')
        return this.createOutput(this.enforceMaxSize(slice))
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

    private enforceMaxSize(content: string): string {
        const byteCount = Buffer.byteLength(content, 'utf8')
        if (byteCount > maxToolResponseSize) {
            throw new Error(
                `This tool only supports reading ${maxToolResponseSize} bytes at a time.
                You tried to read ${byteCount} bytes. Try executing with fewer lines specified.`
            )
        }
        return content
    }

    private createOutput(content: string): InvokeOutput {
        return {
            output: {
                kind: OutputKind.Text,
                content: content,
            },
        }
    }
}
