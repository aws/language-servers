import { InvokeOutput } from './toolShared'
import { Features } from '@aws/language-server-runtimes/server-interface/server'
import { sanitize } from '@aws/lsp-core/out/util/path'
import { Change, diffLines } from 'diff'

// Port of https://github.com/aws/aws-toolkit-vscode/blob/4cc64fcf279f47b1bd2ecd64de803abfed623c6d/packages/core/src/codewhispererChat/tools/fsWrite.ts#L42

interface BaseParams {
    path: string
    explanation?: string
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

export interface FsWriteBackup {
    filePath: string
    content: string
    isNew: boolean
}

export class FsWrite {
    private readonly logging: Features['logging']
    private readonly workspace: Features['workspace']

    constructor(features: Pick<Features, 'workspace' | 'logging'> & Partial<Features>) {
        this.logging = features.logging
        this.workspace = features.workspace
    }

    public async validate(params: FsWriteParams): Promise<void> {
        switch (params.command) {
            case 'create':
                if (!params.path) {
                    throw new Error('Path must not be empty')
                }
                break
            case 'strReplace':
            case 'insert': {
                const fileExists = await this.workspace.fs.exists(params.path)
                if (!fileExists) {
                    throw new Error('The provided path must exist in order to replace or insert contents into it')
                }
                break
            }
            case 'append':
                if (!params.path) {
                    throw new Error('Path must not be empty')
                }
                if (!params.newStr) {
                    throw new Error('Content to append must not be empty')
                }
                break
        }
    }

    public async invoke(params: FsWriteParams): Promise<InvokeOutput> {
        const sanitizedPath = sanitize(params.path)

        switch (params.command) {
            case 'create':
                await this.handleCreate(params, sanitizedPath)
                break
            case 'strReplace':
                await this.handleStrReplace(params, sanitizedPath)
                break
            case 'insert':
                await this.handleInsert(params, sanitizedPath)
                break
            case 'append':
                await this.handleAppend(params, sanitizedPath)
                break
        }

        return {
            output: {
                kind: 'text',
                content: '',
            },
        }
    }

    public async queueDescription(updates: WritableStream): Promise<void> {
        const updateWriter = updates.getWriter()
        // Write an empty string because FsWrite should only show a chat message with header
        await updateWriter.write(' ')
        await updateWriter.close()
        updateWriter.releaseLock()
    }

    public async getDiffChanges(params: FsWriteParams): Promise<Change[]> {
        let newContent
        const { filePath: sanitizedPath, content: oldContent } = await this.getBackup(params)
        switch (params.command) {
            case 'create':
                newContent = this.getCreateCommandText(params)
                break
            case 'strReplace':
                newContent = await this.getStrReplaceContent(params, sanitizedPath)
                break
            case 'insert':
                newContent = await this.getInsertContent(params, sanitizedPath)
                break
            case 'append':
                newContent = await this.getAppendContent(params, sanitizedPath)
                break
        }
        return diffLines(oldContent, newContent)
    }

    public async getBackup(params: FsWriteParams): Promise<FsWriteBackup> {
        const sanitizedPath = sanitize(params.path)
        let oldContent
        let isNew
        try {
            oldContent = await this.workspace.fs.readFile(sanitizedPath)
            isNew = false
        } catch (err) {
            oldContent = ''
            isNew = true
        }
        return { filePath: sanitizedPath, content: oldContent, isNew }
    }

    private async getStrReplaceContent(params: StrReplaceParams, sanitizedPath: string): Promise<string> {
        const fileContent = await this.workspace.fs.readFile(sanitizedPath)

        const matches = [...fileContent.matchAll(new RegExp(this.escapeRegExp(params.oldStr), 'g'))]

        if (matches.length === 0) {
            throw new Error(`No occurrences of "${params.oldStr}" were found`)
        }
        if (matches.length > 1) {
            throw new Error(`${matches.length} occurrences of oldStr were found when only 1 is expected`)
        }

        return fileContent.replace(params.oldStr, params.newStr)
    }

    private async getAppendContent(params: AppendParams, sanitizedPath: string): Promise<string> {
        const fileContent = await this.workspace.fs.readFile(sanitizedPath)
        const needsNewline = fileContent.length !== 0 && !fileContent.endsWith('\n')

        let contentToAppend = params.newStr
        if (needsNewline) {
            contentToAppend = '\n' + contentToAppend
        }

        return fileContent + contentToAppend
    }

    private async getInsertContent(params: InsertParams, sanitizedPath: string): Promise<string> {
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
        return newContent
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

    public getSpec() {
        const commands = ['create', 'strReplace', 'insert', 'append']
        return {
            name: 'fsWrite',
            description:
                'A tool for creating and editing a file.\n * The `create` command will override the file at `path` if it already exists as a file, \
                and otherwise create a new file\n * The `append` command will add content to the end of an existing file, \
                automatically adding a newline if the file does not end with one. \
                The file must exist.\n Notes for using the `strReplace` command:\n * \
                The `oldStr` parameter should match EXACTLY one or more consecutive lines from the original file. Be mindful of whitespaces!\n * \
                If the `oldStr` parameter is not unique in the file, the replacement will not be performed. \
                Make sure to include enough context in `oldStr` to make it unique\n * \
                The `newStr` parameter should contain the edited lines that should replace the `oldStr`. \
                The `insert` command will insert `newStr` after `insertLine` and place it on its own line.',
            inputSchema: {
                type: 'object',
                properties: {
                    command: {
                        type: 'string',
                        enum: commands,
                        description:
                            'The commands to run. Allowed options are: `create`, `strReplace`, `insert`, `append`.',
                    },
                    explanation: {
                        description:
                            'One sentence explanation as to why this tool is being used, and how it contributes to the goal.',
                        type: 'string',
                    },
                    fileText: {
                        description:
                            'Required parameter of `create` command, with the content of the file to be created.',
                        type: 'string',
                    },
                    insertLine: {
                        description:
                            'Required parameter of `insert` command. The `newStr` will be inserted AFTER the line `insertLine` of `path`.',
                        type: 'number',
                    },
                    newStr: {
                        description:
                            'Required parameter of `strReplace` command containing the new string. Required parameter of `insert` command containing the string to insert. Required parameter of `append` command containing the content to append to the file.',
                        type: 'string',
                    },
                    oldStr: {
                        description:
                            'Required parameter of `strReplace` command containing the string in `path` to replace.',
                        type: 'string',
                    },
                    path: {
                        description: 'Absolute path to file or directory, e.g. `/repo/file.py` or `/repo`.',
                        type: 'string',
                    },
                },
                required: ['command', 'path'],
            },
        } as const
    }
}
