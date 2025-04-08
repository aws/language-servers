// VSC Port from https://github.com/aws/aws-toolkit-vscode/blob/dfee9f7a400e677e91a75e9c20d9515a52a6fad4/packages/core/src/codewhispererChat/tools/listDirectory.ts#L18
import { InvokeOutput } from './toolShared'
import { workspaceUtils } from '@aws/lsp-core'
import { Features } from '@aws/language-server-runtimes/server-interface/server'
import { sanitize } from '@aws/lsp-core/out/util/path'

export interface ListDirectoryParams {
    path: string
    maxDepth?: number
}

export class ListDirectory {
    private readonly logging: Features['logging']
    private readonly workspace: Features['workspace']

    constructor(features: Pick<Features, 'logging' | 'workspace'>) {
        this.logging = features.logging
        this.workspace = features.workspace
    }

    public async queueDescription(params: ListDirectoryParams, updates: WritableStream) {
        const writer = updates.getWriter()
        if (params.maxDepth === undefined) {
            await writer.write(`Listing directory recursively: ${params.path}`)
        } else if (params.maxDepth === 0) {
            await writer.write(`Listing directory: ${params.path}`)
        } else {
            const level = params.maxDepth > 1 ? 'levels' : 'level'
            await writer.write(`Listing directory: ${params.path} limited to ${params.maxDepth} subfolder ${level}`)
        }
        await writer.close()
    }

    public async invoke(params: ListDirectoryParams): Promise<InvokeOutput> {
        const path = sanitize(params.path)
        try {
            const listing = await workspaceUtils.readDirectoryRecursively(
                { workspace: this.workspace, logging: this.logging },
                path,
                { maxDepth: params.maxDepth }
            )
            return this.createOutput(listing.join('\n'))
        } catch (error: any) {
            this.logging.error(`Failed to list directory "${path}": ${error.message || error}`)
            throw new Error(`Failed to list directory "${path}": ${error.message || error}`)
        }
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
            name: 'listDirectory',
            description:
                'List the contents of a directory and its subdirectories.\n * Use this tool for discovery, before using more targeted tools like fsRead.\n *Useful to try to understand the file structure before diving deeper into specific files.\n *Can be used to explore the codebase.\n *Results clearly distinguish between files, directories or symlinks with [FILE], [DIR] and [LINK] prefixes.',
            inputSchema: {
                type: 'object',
                properties: {
                    path: {
                        type: 'string',
                        description: 'Absolute path to a directory, e.g., `/repo`.',
                    },
                    maxDepth: {
                        type: 'number',
                        description:
                            'Maximum depth to traverse when listing directories. Use `0` to list only the specified directory, `1` to include immediate subdirectories, etc. If it is not provided, it will list all subdirectories recursively.',
                    },
                },
                required: ['path'],
            },
        } as const
    }
}
