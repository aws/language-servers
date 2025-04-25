import { workspaceUtils } from '@aws/lsp-core'
import { CommandValidation, ExplanatoryParams, InvokeOutput, requiresPathAcceptance } from './toolShared'
import { Features } from '@aws/language-server-runtimes/server-interface/server'
import { sanitize } from '@aws/lsp-core/out/util/path'
import { Change, diffLines } from 'diff'
import { URI } from 'vscode-uri'
import { getWorkspaceFolderPaths } from '@aws/lsp-core/out/util/workspaceUtils'

// Port of https://github.com/aws/aws-toolkit-vscode/blob/16aa8768834f41ae512522473a6a962bb96abe51/packages/core/src/codewhispererChat/tools/fsWrite.ts#L42

interface BaseParams extends ExplanatoryParams {
    path: string
}

export interface CreateParams extends BaseParams {
    command: 'create'
    fileText: string
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
    content: string
    isNew: boolean
}

export class FsWrite {
    private readonly logging: Features['logging']
    private readonly workspace: Features['workspace']
    private readonly lsp: Features['lsp']

    constructor(features: Pick<Features, 'workspace' | 'logging' | 'lsp'> & Partial<Features>) {
        this.logging = features.logging
        this.workspace = features.workspace
        this.lsp = features.lsp
    }

    public async validate(params: FsWriteParams): Promise<void> {
        if (!params.path) {
            throw new Error('Path must not be empty')
        }
        const sanitizedPath = sanitize(params.path)
        switch (params.command) {
            case 'create': {
                if (params.fileText === undefined) {
                    throw new Error('fileText must be provided for create command')
                }
                const fileExists = await this.workspace.fs.exists(sanitizedPath)
                if (fileExists) {
                    const oldContent = await this.workspace.fs.readFile(sanitizedPath)
                    if (oldContent === params.fileText) {
                        throw new Error('The file already exists with the same content')
                    }
                }
                break
            }
            case 'strReplace': {
                if (params.oldStr === params.newStr) {
                    throw new Error('The provided oldStr and newStr are the exact same, this is a no-op')
                }
                const fileExists = await this.workspace.fs.exists(sanitizedPath)
                if (!fileExists) {
                    throw new Error('The provided path must exist in order to replace contents into it')
                }
                break
            }
            case 'insert': {
                const fileExists = await this.workspace.fs.exists(sanitizedPath)
                if (!fileExists) {
                    throw new Error('The provided path must exist in order to insert contents into it')
                }
                break
            }
            case 'append':
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

    public async requiresAcceptance(params: FsWriteParams): Promise<CommandValidation> {
        return requiresPathAcceptance(params.path, this.lsp, this.logging)
    }

    private async handleCreate(params: CreateParams, sanitizedPath: string): Promise<void> {
        const content = params.fileText
        await this.workspace.fs.writeFile(sanitizedPath, content)
    }

    private async handleStrReplace(params: StrReplaceParams, sanitizedPath: string): Promise<void> {
        const fileContent = await this.workspace.fs.readFile(sanitizedPath)
        const newContent = getStrReplaceContent(params, fileContent)
        await this.workspace.fs.writeFile(sanitizedPath, newContent)
    }

    private async handleInsert(params: InsertParams, sanitizedPath: string): Promise<void> {
        const fileContent = await this.workspace.fs.readFile(sanitizedPath)
        const newContent = getInsertContent(params, fileContent)
        await this.workspace.fs.writeFile(sanitizedPath, newContent)
    }

    private async handleAppend(params: AppendParams, sanitizedPath: string): Promise<void> {
        const fileContent = await this.workspace.fs.readFile(sanitizedPath)
        const newContent = getAppendContent(params, fileContent)
        await this.workspace.fs.writeFile(sanitizedPath, newContent)
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
                IMPORTANT: Only use the `strReplace` command for simple, isolated single-line replacements. \
                If you are editing multiple lines, always prefer the `create` command and replace the entire file content instead.\n * \
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

const getFinalContent = (params: FsWriteParams, oldContent: string): string => {
    switch (params.command) {
        case 'append':
            return getAppendContent(params, oldContent)
        case 'create':
            return params.fileText
        case 'insert':
            return getInsertContent(params, oldContent)
        case 'strReplace':
            return getStrReplaceContent(params, oldContent)
    }
}

const getAppendContent = (params: AppendParams, oldContent: string) => {
    const needsNewline = oldContent.length !== 0 && !oldContent.endsWith('\n')

    let contentToAppend = params.newStr
    if (needsNewline) {
        contentToAppend = '\n' + contentToAppend
    }

    return oldContent + contentToAppend
}

const getInsertContent = (params: InsertParams, oldContent: string) => {
    const lines = oldContent.split('\n')

    const numLines = lines.length
    const insertLine = Math.max(0, Math.min(params.insertLine, numLines))

    let newContent: string
    if (insertLine === 0) {
        newContent = params.newStr + '\n' + oldContent
    } else {
        newContent = [...lines.slice(0, insertLine), params.newStr, ...lines.slice(insertLine)].join('\n')
    }
    return newContent
}

const getStrReplaceContent = (params: StrReplaceParams, oldContent: string) => {
    const matches = [...oldContent.matchAll(new RegExp(escapeRegExp(params.oldStr), 'g'))]

    if (matches.length === 0) {
        throw new Error(`No occurrences of "${params.oldStr}" were found`)
    }
    if (matches.length > 1) {
        throw new Error(`${matches.length} occurrences of oldStr were found when only 1 is expected`)
    }

    return oldContent.replace(params.oldStr, params.newStr)
}

const escapeRegExp = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export const getDiffChanges = (params: FsWriteParams, oldContent: string): Change[] => {
    const finalContent = getFinalContent(params, oldContent)
    return diffLines(oldContent, finalContent)
}
