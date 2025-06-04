import { CommandValidation, ExplanatoryParams, InvokeOutput, requiresPathAcceptance } from './toolShared'
import { Features } from '@aws/language-server-runtimes/server-interface/server'
import { sanitize } from '@aws/lsp-core/out/util/path'
import * as os from 'os'

interface BaseParams extends ExplanatoryParams {
    path: string
}

export interface Diff {
    oldStr: string
    newStr: string
}

export interface ReplaceParams extends BaseParams {
    diffs: Diff[]
}

export type FsReplaceParams = ReplaceParams

export class FsReplace {
    private readonly logging: Features['logging']
    private readonly workspace: Features['workspace']
    private readonly lsp: Features['lsp']

    constructor(features: Pick<Features, 'workspace' | 'logging' | 'lsp'> & Partial<Features>) {
        this.logging = features.logging
        this.workspace = features.workspace
        this.lsp = features.lsp
    }

    public async validate(params: FsReplaceParams): Promise<void> {
        if (!params.path) {
            throw new Error('Path must not be empty')
        }
        const sanitizedPath = sanitize(params.path)
        for (const diff of params.diffs) {
            if (diff.oldStr === diff.newStr) {
                throw new Error('The provided oldStr and newStr are the exact same, this is a no-op')
            }
            const fileExists = await this.workspace.fs.exists(sanitizedPath)
            if (!fileExists) {
                throw new Error('The provided path must exist in order to replace contents into it')
            }
        }
    }

    public async invoke(params: FsReplaceParams): Promise<InvokeOutput> {
        const sanitizedPath = sanitize(params.path)

        await this.handleReplace(params, sanitizedPath)

        return {
            output: {
                kind: 'text',
                content: '',
            },
        }
    }

    public async requiresAcceptance(params: FsReplaceParams, approvedPaths?: Set<string>): Promise<CommandValidation> {
        return requiresPathAcceptance(params.path, this.workspace, this.logging, approvedPaths)
    }

    private async handleReplace(params: ReplaceParams, sanitizedPath: string): Promise<void> {
        const fileContent = await this.workspace.fs.readFile(sanitizedPath)
        const newContent = getReplaceContent(params, fileContent)
        await this.workspace.fs.writeFile(sanitizedPath, newContent)
    }

    public getSpec() {
        return {
            name: 'fsReplace',
            description:
                'A tool for search and replace contents of an existing file.\n\n' +
                '## Overview\n' +
                'This tool replaces sections of content in an existing file using oldStr/newStr blocks that define exact changes to specific parts of the file.\n\n' +
                '## When to use\n' +
                '- When you need to make targeted changes to specific parts of a file\n' +
                '- When you need to update multiple sections of the same file\n' +
                '## When not to use\n' +
                '- When you need to create a new file\n' +
                '- When you need to rename or move a file\n\n' +
                '## IMPORTANT Notes\n' +
                '- Use this tool to delete code by using empty `newStr` parameter.\n' +
                '- The `oldStr` parameter should match EXACTLY one or more consecutive lines from the original file. Be mindful of whitespaces! Include just the changing lines, and a few surrounding lines if needed for uniqueness. Do not include long runs of unchanging lines in `oldStr`.\n' +
                '- The `newStr` parameter should contain the edited lines that should replace the `oldStr`.\n' +
                '- When multiple edits to the same file are needed, populate the diffs array with `oldStr` and `newStr` pairs. This improves efficiency by reducing the number of tool calls and ensures the file remains in a consistent state.\n' +
                '- Each `oldStr` must be unique within the file - if there are multiple matches, the operation will fail.',
            inputSchema: {
                type: 'object',
                properties: {
                    explanation: {
                        description:
                            'One sentence explanation as to why this tool is being used, and how it contributes to the goal.',
                        type: 'string',
                    },
                    diffs: {
                        description: 'List of diffs to replace contents in an existing file.',
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                oldStr: {
                                    description:
                                        'The exact string content to be replaced in the file. Must match exactly including whitespace and line breaks.',
                                    type: 'string',
                                },
                                newStr: {
                                    description:
                                        'The new string content that will replace the oldStr. Use empty string to delete content.',
                                    type: 'string',
                                },
                            },
                            required: ['oldStr'],
                        },
                    },
                    path: {
                        description:
                            'Absolute path to a file, e.g. `/repo/file.py` for Unix-like system including Unix/Linux/macOS or `d:\\repo\\file.py` for Windows.',
                        type: 'string',
                    },
                },
                required: ['diffs', 'path'],
            },
        } as const
    }
}

const getReplaceContent = (params: ReplaceParams, fileContent: string) => {
    // Detect line ending from oldContent (CRLF, LF, or CR)
    const match = fileContent.match(/\r\n|\r|\n/)
    const lineEnding = match ? match[0] : os.EOL

    for (const diff of params.diffs) {
        if (diff.newStr == undefined) {
            diff.newStr = ''
        }
        // Normalize oldStr and newStr to match fileContent's line ending style
        const normalizedOldStr = diff.oldStr.split(/\r\n|\r|\n/).join(lineEnding)
        const normalizedNewStr = diff.newStr.split(/\r\n|\r|\n/).join(lineEnding)

        const matches = [...fileContent.matchAll(new RegExp(escapeRegExp(normalizedOldStr), 'g'))]

        if (matches.length === 0) {
            throw new Error(`No occurrences of "${diff.oldStr}" were found`)
        }
        if (matches.length > 1) {
            throw new Error(`${matches.length} occurrences of oldStr were found when only 1 is expected`)
        }
        fileContent = fileContent.replace(normalizedOldStr, normalizedNewStr)
    }
    return fileContent
}

const escapeRegExp = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
