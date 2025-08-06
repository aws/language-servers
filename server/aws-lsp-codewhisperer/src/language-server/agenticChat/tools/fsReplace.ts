import { CommandValidation, ExplanatoryParams, InvokeOutput, requiresPathAcceptance } from './toolShared'
import { EmptyPathError, EmptyDiffsError, FileNotExistsError, TextNotFoundError, MultipleMatchesError } from '../errors'
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
            throw new EmptyPathError()
        }
        if (!params.diffs || params.diffs.length === 0) {
            throw new EmptyDiffsError()
        }
        const sanitizedPath = sanitize(params.path)
        const fileExists = await this.workspace.fs.exists(sanitizedPath)
        if (!fileExists) {
            throw new FileNotExistsError()
        }
    }

    public async invoke(params: FsReplaceParams): Promise<InvokeOutput> {
        const sanitizedPath = sanitize(params.path)

        await this.handleReplace(params, sanitizedPath)

        return {
            output: {
                kind: 'text',
                content: 'File updated successfully',
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
                'A tool for search and replace contents of an existing file using SMALL, GRANULAR diff pairs.\n\n' +
                '## Overview\n' +
                'This tool replaces sections of content using MULTIPLE SMALL `oldStr`/`newStr` pairs (30-50 chars MAXIMUM each) that define precise, granular changes.' +
                'CRITICAL: Create MANY small diff pairs instead of few large ones for better visual animation.\n' +
                'SUPER IMPORTANT: The file path should ALWAYS be the first parameter in the JSON, followed by the diffs and explanation.\n\n' +
                '## GRANULAR DIFF STRATEGY (REQUIRED)\n' +
                '- **BREAK DOWN LARGE CHANGES**: Split big modifications into multiple small diff pairs\n' +
                '- **MULTIPLE PAIRS FOR FUNCTIONS**: When modifying a function, create separate diff pairs for:\n' +
                '  * Function name change\n' +
                '  * Parameter changes\n' +
                '  * Individual line changes inside function body\n' +
                '  * Return statement changes\n\n' +
                '## When to use\n' +
                '- When you need to make targeted changes to specific parts of a file\n' +
                '- When you need to update multiple sections of the same file\n' +
                '- When you want smooth, granular animation of changes\n' +
                '## When not to use\n' +
                '- When you need to create a new file (use fsWrite instead)\n' +
                '- When you need to rename or move a file\n' +
                '- When replacing entire file content (use fsWrite instead)\n\n' +
                '## CRITICAL REQUIREMENTS\n' +
                '- **ABSOLUTE PATH FIRST**: Always calculate the absolute path as the first parameter\n' +
                '- **EXACT MATCHING**: `oldStr` must match EXACTLY including whitespaces, tabs, and line breaks\n' +
                '- **SMALL DIFF PAIRS**: Each oldStr/newStr should be 20-50 characters maximum\n' +
                '- **MULTIPLE PAIRS**: Create 3-10+ small diff pairs instead of 1-2 large ones\n' +
                '- **DELETE WITH EMPTY**: Use empty `newStr` to delete content\n\n',
            inputSchema: {
                type: 'object',
                properties: {
                    path: {
                        description:
                            'Absolute path to a file, e.g. `/repo/file.py` for Unix-like system including Unix/Linux/macOS or `d:\\repo\\file.py` for Windows. This MUST be the first parameter in the JSON before the diffs and explanation.',
                        type: 'string',
                    },
                    diffs: {
                        description:
                            'A list of SMALL, GRANULAR `oldStr`/`newStr` pairs (20-50 chars each) to replace content. Create MULTIPLE small diff pairs instead of few large ones for smooth animation. Example: `[{"oldStr": "oldName", "newStr": "newName"}, {"oldStr": "param1", "newStr": "param1, param2"}]`. CRITICAL: Use JSON array syntax [{}], NOT string "[{}]". REQUIRED: Each oldStr/newStr should be 20-50 characters maximum for optimal animation.',
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                oldStr: {
                                    description:
                                        'The exact string content to be replaced (20-50 chars max). Must match EXACTLY including whitespaces. Focus on ONE small concept per diff pair for granular animation.',
                                    type: 'string',
                                },
                                newStr: {
                                    description:
                                        'The new string content (20-50 chars max) that will replace the oldStr. Use empty string to delete content. Keep changes small and focused.',
                                    type: 'string',
                                },
                            },
                            required: ['oldStr'],
                        },
                    },
                    explanation: {
                        description:
                            'One sentence explanation as to why this tool is being used, and how it contributes to the goal.',
                        type: 'string',
                    },
                },
                required: ['path'],
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
        if (diff.oldStr === diff.newStr) {
            continue
        }

        // Normalize oldStr and newStr to match fileContent's line ending style
        const normalizedOldStr = diff.oldStr.split(/\r\n|\r|\n/).join(lineEnding)
        const normalizedNewStr = diff.newStr.split(/\r\n|\r|\n/).join(lineEnding)

        // Use string indexOf and substring for safer replacement with special characters
        const startIndex = fileContent.indexOf(normalizedOldStr)

        if (startIndex === -1) {
            throw new TextNotFoundError(diff.oldStr)
        }

        // Check for multiple occurrences
        const secondIndex = fileContent.indexOf(normalizedOldStr, startIndex + 1)
        if (secondIndex !== -1) {
            throw new MultipleMatchesError(diff.oldStr)
        }

        // Perform the replacement using string operations instead of regex
        fileContent =
            fileContent.substring(0, startIndex) +
            normalizedNewStr +
            fileContent.substring(startIndex + normalizedOldStr.length)
    }
    return fileContent
}
