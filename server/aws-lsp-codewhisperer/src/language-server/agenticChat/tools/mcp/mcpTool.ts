/*!
 * Copyright Amazon.com, Inc. or its affiliates.
 * All Rights Reserved. SPDX-License-Identifier: Apache-2.0
 */

import { CommandValidation, InvokeOutput, OutputKind } from '../toolShared'
import type { McpToolDefinition } from './mcpTypes'
import type { Features } from '@aws/language-server-runtimes/server-interface/server'
import { McpManager } from './mcpManager'

export class McpTool {
    constructor(
        private readonly features: Pick<Features, 'logging' | 'workspace' | 'lsp'>,
        private readonly def: McpToolDefinition
    ) {}

    public getSpec() {
        return {
            name: this.def.toolName,
            description: this.def.description,
            inputSchema: this.def.inputSchema,
        } as const
    }

    public validate(_input: any): Promise<void> {
        return Promise.resolve()
    }

    public async queueDescription(command: string, updates: WritableStream) {
        const writer = updates.getWriter()
        await writer.write(`Invoking MCP tool: ${this.def.toolName} on server ${this.def.serverName}`)
        await writer.close()
        writer.releaseLock()
    }

    public requiresAcceptance(_input: any): CommandValidation {
        return { requiresAcceptance: false }
    }

    public async invoke(input: any): Promise<InvokeOutput> {
        try {
            const result = await McpManager.instance.callTool(this.def.serverName, this.def.toolName, input)
            const content = typeof result === 'object' ? JSON.stringify(result) : String(result)
            return {
                output: {
                    kind: OutputKind.Text,
                    content: content,
                },
            }
        } catch (err: any) {
            this.features.logging.error(`MCP tool ${this.def.toolName} failed: ${err.message}`)
            throw new Error(`Failed to invoke MCP tool: ${err.message}`)
        }
    }
}
