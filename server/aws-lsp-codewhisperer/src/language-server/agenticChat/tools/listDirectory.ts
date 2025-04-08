// VSC Port from https://github.com/aws/aws-toolkit-vscode/blob/dfee9f7a400e677e91a75e9c20d9515a52a6fad4/packages/core/src/codewhispererChat/tools/listDirectory.ts#L18
import { InvokeOutput } from './toolShared'
import { pathUtils, workspaceUtils } from '@aws/lsp-core'
import { Features } from '@aws/language-server-runtimes/server-interface/server'

export interface ListDirectoryParams {
    path: string
    maxDepth?: number
}

export class ListDirectory {
    private fsPath: string
    private maxDepth?: number
    private readonly logging: Features['logging']
    private readonly workspace: Features['workspace']

    constructor(features: Pick<Features, 'logging' | 'workspace'>, params: ListDirectoryParams) {
        this.fsPath = params.path
        this.maxDepth = params.maxDepth
        this.logging = features.logging
        this.workspace = features.workspace
    }

    public async validate(): Promise<void> {
        if (!this.fsPath || this.fsPath.trim().length === 0) {
            throw new Error('Path cannot be empty.')
        }
        if (this.maxDepth !== undefined && this.maxDepth < 0) {
            throw new Error('MaxDepth cannot be negative.')
        }

        const sanitized = pathUtils.sanitize(this.fsPath)
        this.fsPath = sanitized

        let pathExists: boolean
        try {
            pathExists = await this.workspace.fs.exists(this.fsPath)
            if (!pathExists) {
                throw new Error(`Path: "${this.fsPath}" does not exist or cannot be accessed.`)
            }
        } catch (err) {
            throw new Error(`Path: "${this.fsPath}" does not exist or cannot be accessed. (${err})`)
        }
    }

    public async queueDescription(updates: WritableStream) {
        const writer = updates.getWriter()
        if (this.maxDepth === undefined) {
            await writer.write(`Listing directory recursively: ${this.fsPath}`)
        } else if (this.maxDepth === 0) {
            await writer.write(`Listing directory: ${this.fsPath}`)
        } else {
            const level = this.maxDepth > 1 ? 'levels' : 'level'
            await writer.write(`Listing directory: ${this.fsPath} limited to ${this.maxDepth} subfolder ${level}`)
        }
        await writer.close()
    }

    public async invoke(_updates?: WritableStream): Promise<InvokeOutput> {
        try {
            const listing = await workspaceUtils.readDirectoryRecursively(
                { workspace: this.workspace, logging: this.logging },
                this.fsPath,
                this.maxDepth
            )
            return this.createOutput(listing.join('\n'))
        } catch (error: any) {
            this.logging.error(`Failed to list directory "${this.fsPath}": ${error.message || error}`)
            throw new Error(`Failed to list directory "${this.fsPath}": ${error.message || error}`)
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
}
