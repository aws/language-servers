import { CommandValidation, ExplanatoryParams, InvokeOutput, requiresPathAcceptance } from './toolShared'
import { Features } from '@aws/language-server-runtimes/server-interface/server'
import { sanitize } from '@aws/lsp-core/out/util/path'
import * as os from 'os'

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

    public async requiresAcceptance(params: FsWriteParams, approvedPaths?: Set<string>): Promise<CommandValidation> {
        return requiresPathAcceptance(params.path, this.workspace, this.logging, approvedPaths)
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
                'A tool for creating and editing a file.\n\n' +
                '## Overview\n' +
                'This tool provides multiple commands for file operations including creating, replacing, inserting, and appending content.\n\n' +
                '## When to use\n' +
                '- When creating new files (create)\n' +
                '- When replacing specific text in existing files (strReplace)\n' +
                '- When inserting text at a specific line (insert)\n' +
                '- When adding text to the end of a file (append)\n\n' +
                '## When not to use\n' +
                '- When you only need to read file content (use fsRead instead)\n' +
                '- When you need to delete a file (no delete operation is available)\n' +
                '- When you need to rename or move a file\n\n' +
                '## Command details\n' +
                '- The `create` command will override the file at `path` if it already exists as a file, and otherwise create a new file. Make sure the `path` exists first when using this command for initial file creation, such as scaffolding a new project. You should also use this command when overwriting large boilerplate files where you want to replace the entire content at once.\n' +
                '- The `insert` command will insert `newStr` after `insertLine` and place it on its own line.\n' +
                '- The `append` command will add content to the end of an existing file, automatically adding a newline if the file does not end with one.\n' +
                '- The `strReplace` command will replace `oldStr` in an existing file with `newStr`.\n\n' +
                '## IMPORTANT Notes for using the `strReplace` command\n' +
                '- Use this command to delete code by using empty `newStr` parameter.\n' +
                '- If you need to make small changes to an existing file, consider using `strReplace` command to avoid unnecessary rewriting the entire file.\n' +
                '- Prefer the `create` command if the complexity or number of changes would make `strReplace` unwieldy or error-prone.\n' +
                '- The `oldStr` parameter should match EXACTLY one or more consecutive lines from the original file. Be mindful of whitespaces! Include just the changing lines, and a few surrounding lines if needed for uniqueness. Do not include long runs of unchanging lines in `oldStr`.\n' +
                '- The `newStr` parameter should contain the edited lines that should replace the `oldStr`.\n' +
                '- When multiple edits to the same file are needed, combine them into a single call whenever possible. This improves efficiency by reducing the number of tool calls and ensures the file remains in a consistent state.',
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
                        description:
                            'Absolute path to a file, e.g. `/repo/file.py` for Unix-like system including Unix/Linux/macOS or `d:\\repo\\file.py` for Windows.',
                        type: 'string',
                    },
                },
                required: ['command', 'path'],
            },
        } as const
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
    // Detect line ending from oldContent (CRLF, LF, or CR)
    const match = oldContent.match(/\r\n|\r|\n/)
    const lineEnding = match ? match[0] : os.EOL

    // Normalize oldStr and newStr to match oldContent's line ending style
    const normalizedOldStr = params.oldStr.split(/\r\n|\r|\n/).join(lineEnding)
    const normalizedNewStr = params.newStr.split(/\r\n|\r|\n/).join(lineEnding)

    const matches = [...oldContent.matchAll(new RegExp(escapeRegExp(normalizedOldStr), 'g'))]

    if (matches.length === 0) {
        throw new Error(`No occurrences of "${params.oldStr}" were found`)
    }
    if (matches.length > 1) {
        throw new Error(`${matches.length} occurrences of oldStr were found when only 1 is expected`)
    }

    return oldContent.replace(normalizedOldStr, normalizedNewStr)
}

const escapeRegExp = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
