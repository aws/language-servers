import { InvokeOutput, OutputKind } from './toolShared'
import { Features } from '@aws/language-server-runtimes/server-interface/server'
import { sanitize } from '@aws/lsp-core/out/util/path'

// Port of https://github.com/aws/aws-toolkit-vscode/blob/10bb1c7dc45f128df14d749d95905c0e9b808096/packages/core/src/codewhispererChat/tools/fsWrite.ts#L42

interface BaseParams {
    path: string
}

export interface CreateParams extends BaseParams {
    command: 'create'
    fileText?: string
    newStr?: string
}

export interface StrReplaceParams extends BaseParams {
    command: 'strReplace'
    oldStr: string
    newStr: string
}

export interface InsertParams extends BaseParams {
    command: 'insert'
    insertLine: number
    newStr: string
}

export interface AppendParams extends BaseParams {
    command: 'append'
    newStr: string
}

export type FsWriteParams = CreateParams | StrReplaceParams | InsertParams | AppendParams

export class FsWrite {
    private fsPath: string
    private readonly logging: Features['logging']
    private readonly workspace: Features['workspace']

    constructor(
        features: Pick<Features, 'workspace' | 'logging'> & Partial<Features>,
        readonly params: FsWriteParams
    ) {
        this.fsPath = params.path
        this.logging = features.logging
        this.workspace = features.workspace
    }

    public async invoke(_updates: WritableStream): Promise<InvokeOutput> {
        const sanitizedPath = sanitize(this.params.path)

        switch (this.params.command) {
            case 'create':
                await this.handleCreate(this.params, sanitizedPath)
                break
            case 'strReplace':
                await this.handleStrReplace(this.params, sanitizedPath)
                break
            case 'insert':
                await this.handleInsert(this.params, sanitizedPath)
                break
            case 'append':
                await this.handleAppend(this.params, sanitizedPath)
                break
        }

        return {
            output: {
                kind: OutputKind.Text,
                content: '',
            },
        }
    }

    public async queueDescription(updates: WritableStream): Promise<void> {
        const writer = updates.getWriter()
        await writer.write(`Writing to: (${this.params.path})`)
        await writer.close()
    }

    public async validate(): Promise<void> {
        switch (this.params.command) {
            case 'create':
                if (!this.params.path) {
                    throw new Error('Path must not be empty')
                }
                break
            case 'strReplace':
            case 'insert': {
                const fileExists = await this.workspace.fs.exists(this.params.path)
                if (!fileExists) {
                    throw new Error('The provided path must exist in order to replace or insert contents into it')
                }
                break
            }
            case 'append':
                if (!this.params.path) {
                    throw new Error('Path must not be empty')
                }
                if (!this.params.newStr) {
                    throw new Error('Content to append must not be empty')
                }
                break
        }
    }

    private async handleCreate(params: CreateParams, sanitizedPath: string): Promise<void> {
        const content = this.getCreateCommandText(params)

        await this.workspace.fs.writeFile(sanitizedPath, content)
    }

    private async handleStrReplace(params: StrReplaceParams, sanitizedPath: string): Promise<void> {
        const fileContent = await this.workspace.fs.readFile(sanitizedPath)

        const matches = [...fileContent.matchAll(new RegExp(this.escapeRegExp(params.oldStr), 'g'))]

        if (matches.length === 0) {
            throw new Error(`No occurrences of "${params.oldStr}" were found`)
        }
        if (matches.length > 1) {
            throw new Error(`${matches.length} occurrences of oldStr were found when only 1 is expected`)
        }

        const newContent = fileContent.replace(params.oldStr, params.newStr)
        await this.workspace.fs.writeFile(sanitizedPath, newContent)
    }

    private async handleInsert(params: InsertParams, sanitizedPath: string): Promise<void> {
        const fileContent = await this.workspace.fs.readFile(sanitizedPath)
        const lines = fileContent.split('\n')

        const numLines = lines.length
        const insertLine = Math.max(0, Math.min(params.insertLine, numLines))

        let newContent: string
        if (insertLine === 0) {
            newContent = params.newStr + '\n' + fileContent
        } else {
            newContent = [...lines.slice(0, insertLine), params.newStr, ...lines.slice(insertLine)].join('\n')
        }

        await this.workspace.fs.writeFile(sanitizedPath, newContent)
    }

    private async handleAppend(params: AppendParams, sanitizedPath: string): Promise<void> {
        const fileContent = await this.workspace.fs.readFile(sanitizedPath)
        const needsNewline = fileContent.length !== 0 && !fileContent.endsWith('\n')

        let contentToAppend = params.newStr
        if (needsNewline) {
            contentToAppend = '\n' + contentToAppend
        }

        const newContent = fileContent + contentToAppend
        await this.workspace.fs.writeFile(sanitizedPath, newContent)
    }

    private getCreateCommandText(params: CreateParams): string {
        if (params.fileText) {
            return params.fileText
        }
        if (params.newStr) {
            this.logging.warn('Required field `fileText` is missing, use the provided `newStr` instead')
            return params.newStr
        }
        this.logging.warn('No content provided for the create command')
        return ''
    }

    private escapeRegExp(string: string): string {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    }
}
