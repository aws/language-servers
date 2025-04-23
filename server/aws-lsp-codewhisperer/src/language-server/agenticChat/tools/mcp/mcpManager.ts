/*!
 * Copyright Amazon.com, Inc. or its affiliates.
 * All Rights Reserved. SPDX-License-Identifier: Apache-2.0
 */

import type { Features } from '@aws/language-server-runtimes/server-interface/server'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import type { MCPServerConfig, McpToolDefinition, ListToolsResponse } from './mcpTypes'
import { loadMcpServerConfigs } from './mcpUtils'

export class McpManager {
    static #instance?: McpManager
    private clients = new Map<string, Client>()
    private mcpTools: McpToolDefinition[] = []

    private constructor(
        private configPaths: string[],
        private features: Pick<Features, 'logging' | 'workspace' | 'lsp'>
    ) {}

    public static async init(
        configPaths: string[],
        features: Pick<Features, 'logging' | 'workspace' | 'lsp'>
    ): Promise<McpManager> {
        if (!McpManager.#instance) {
            const mgr = new McpManager(configPaths, features)
            McpManager.#instance = mgr
            await mgr.discoverAllServers()
            features.logging.info(`MCP: discovered ${mgr.mcpTools.length} tools across all servers`)
        }
        return McpManager.#instance
    }

    public static get instance(): McpManager {
        if (!McpManager.#instance) {
            throw new Error('McpManager not initialized—call McpManager.init(...) first')
        }
        return McpManager.#instance
    }

    public async close(): Promise<void> {
        this.features.logging.info('MCP: closing all clients')
        for (const [name, client] of this.clients.entries()) {
            try {
                await client.close()
                this.features.logging.info(`MCP: closed client for ${name}`)
            } catch (e: any) {
                this.features.logging.error(`MCP: error closing client ${name}: ${e.message}`)
            }
        }
        this.clients.clear()
        this.mcpTools = []
        McpManager.#instance = undefined
    }

    private async discoverAllServers(): Promise<void> {
        const configs = await loadMcpServerConfigs(this.features.workspace, this.features.logging, this.configPaths)

        for (const [name, cfg] of configs.entries()) {
            if (cfg.disabled) {
                this.features.logging.info(`MCP: server '${name}' is disabled, skipping`)
                continue
            }
            await this.initOneServer(name, cfg)
        }
    }

    private async initOneServer(serverName: string, cfg: MCPServerConfig): Promise<void> {
        try {
            this.features.logging.debug(`MCP: initializing server [${serverName}]`)
            const mergedEnv = {
                ...(process.env as Record<string, string>),
                ...(cfg.env ?? {}),
            }
            const transport = new StdioClientTransport({
                command: cfg.command,
                args: cfg.args ?? [],
                env: mergedEnv,
            })
            const client = new Client({
                name: `mcp-client-${serverName}`,
                version: '1.0.0',
            })
            await client.connect(transport)
            this.clients.set(serverName, client)

            const resp = (await client.listTools()) as ListToolsResponse
            for (const t of resp.tools) {
                const toolName = t.name!
                this.features.logging.info(`MCP: discovered tool ${serverName}::${toolName}`)
                this.mcpTools.push({
                    serverName,
                    toolName,
                    description: t.description ?? '',
                    inputSchema: t.inputSchema ?? {},
                })
            }
        } catch (e: any) {
            this.features.logging.warn(`MCP: server [${serverName}] init failed: ${e.message}`)
        }
    }

    public getAllTools(): McpToolDefinition[] {
        return [...this.mcpTools]
    }

    public async callTool(server: string, tool: string, args: any): Promise<any> {
        const c = this.clients.get(server)
        if (!c) throw new Error(`MCP: server '${server}' not connected`)
        return c.callTool({ name: tool, arguments: args })
    }
}
