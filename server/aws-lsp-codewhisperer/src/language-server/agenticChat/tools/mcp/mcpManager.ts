/*!
 * Copyright Amazon.com, Inc. or its affiliates.
 * All Rights Reserved. SPDX-License-Identifier: Apache-2.0
 */

import type { Features } from '@aws/language-server-runtimes/server-interface/server'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import type { MCPServerConfig, McpToolDefinition, ListToolsResponse } from './mcpTypes'
import { loadMcpServerConfigs } from './mcpUtils'

/**
 * Manages MCP servers and their tools
 */
export class McpManager {
    static #instance?: McpManager
    private clients = new Map<string, Client>()
    private mcpTools: McpToolDefinition[]
    private mcpServers: Map<string, MCPServerConfig>

    private constructor(
        private configPaths: string[],
        private features: Pick<Features, 'logging' | 'workspace' | 'lsp'>
    ) {
        this.mcpTools = []
        this.mcpServers = new Map<string, MCPServerConfig>()
        this.features.logging.info(`MCP manager: initialized with ${configPaths.length} configs`)
    }

    /**
     * Initialize or return existing manager, then discover all servers.
     * @param configPaths Paths to MCP config files
     * @param features Logging, workspace, and LSP hooks
     */
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

    /**
     * Load configurations and initialize each enabled server.
     */
    private async discoverAllServers(): Promise<void> {
        this.mcpServers = await loadMcpServerConfigs(this.features.workspace, this.features.logging, this.configPaths)

        for (const [name, cfg] of this.mcpServers.entries()) {
            if (cfg.disabled) {
                this.features.logging.info(`MCP: server '${name}' is disabled, skipping`)
                continue
            }
            try {
                await this.initOneServer(name, cfg)
            } catch (e: any) {
                this.mcpServers.delete(name)
                this.clients.delete(name)
                this.mcpTools = this.mcpTools.filter(t => t.serverName !== name)
                this.features.logging.warn(`MCP: server [${name}] init failed: ${e.message}`)
            }
        }
    }

    /**
     * Start a server process, connect client, and register its tools.
     * Errors are logged but do not stop discovery of other servers.
     */
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

            this.mcpTools = this.mcpTools.filter(t => t.serverName !== serverName)
            const resp = (await client.listTools()) as ListToolsResponse
            for (const t of resp.tools) {
                if (!t.name) {
                    this.features.logging.warn(`MCP: server [${serverName}] returned tool with no name, skipping`)
                    continue
                }
                const toolName = t.name
                this.features.logging.info(`MCP: discovered tool ${serverName}::${toolName}`)
                const disabled = cfg.toolOverrides?.[toolName]?.disabled
                if (!disabled)
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

    /**
     * Return a list of all discovered tools.
     */
    public getAllTools(): McpToolDefinition[] {
        return [...this.mcpTools]
    }

    /**
     * Return a list of all server configurations.
     */
    public getAllServerConfigs(): Map<string, MCPServerConfig> {
        return new Map(this.mcpServers)
    }

    /**
     * Map server names to their available tool names.
     */
    public listServersAndTools(): Record<string, string[]> {
        const result: Record<string, string[]> = {}
        for (const { serverName, toolName } of this.mcpTools) {
            result[serverName] ||= []
            result[serverName].push(toolName)
        }
        return result
    }

    /**
     * Invoke a tool on a server after validating server and tool.
     * @throws if server or tool is missing, disabled, or disconnected(shouldn't happen).
     */
    public async callTool(server: string, tool: string, args: any): Promise<any> {
        const cfg = this.mcpServers.get(server)
        if (!cfg) throw new Error(`MCP: server '${server}' is not configured`)
        if (cfg.disabled) throw new Error(`MCP: server '${server}' is disabled`)

        const tools = this.mcpTools.filter(t => t.serverName === server).map(t => t.toolName)
        if (!tools.includes(tool)) {
            throw new Error(`MCP: tool '${tool}' not found on '${server}'. Available: ${tools.join(', ')}`)
        }

        const client = this.clients.get(server)
        if (!client) throw new Error(`MCP: server '${server}' not connected`)
        return client.callTool({ name: tool, arguments: args })
    }

    /**
     * Add a new server: persist config, register in memory, and initialize.
     */
    public async addServer(serverName: string, cfg: MCPServerConfig, configPath: string): Promise<void> {
        if (this.mcpServers.has(serverName)) {
            throw new Error(`MCP: server '${serverName}' already exists`)
        }

        await this.mutateConfigFile(configPath, json => {
            json.mcpServers[serverName] = {
                command: cfg.command,
                args: cfg.args,
                env: cfg.env,
                disabled: cfg.disabled,
                autoApprove: cfg.autoApprove,
                toolOverrides: cfg.toolOverrides,
            }
        })

        const newCfg: MCPServerConfig = { ...cfg, __configPath__: configPath }
        this.mcpServers.set(serverName, newCfg)

        try {
            await this.initOneServer(serverName, newCfg)
        } catch (e: any) {
            this.mcpServers.delete(serverName)
            this.clients.delete(serverName)
            this.mcpTools = this.mcpTools.filter(t => t.serverName !== serverName)
            this.features.logging.warn(`MCP: server [${serverName}] init failed: ${e.message}`)
        }
    }

    /**
     * Remove a server: shutdown client, remove tools, and delete disk entry.
     */
    public async removeServer(serverName: string): Promise<void> {
        const cfg = this.mcpServers.get(serverName)
        if (!cfg || !cfg.__configPath__) {
            throw new Error(`MCP: server '${serverName}' not found`)
        }

        const client = this.clients.get(serverName)
        if (client) {
            await client.close()
            this.clients.delete(serverName)
        }
        this.mcpTools = this.mcpTools.filter(t => t.serverName !== serverName)
        this.mcpServers.delete(serverName)

        await this.mutateConfigFile(cfg.__configPath__, json => {
            delete json.mcpServers[serverName]
        })
    }

    /**
     * Update a server: persist changes, teardown old client/tools, and re-init if enabled.
     */
    public async updateServer(
        serverName: string,
        configUpdates: Partial<Omit<MCPServerConfig, '__configPath__'>>
    ): Promise<void> {
        const oldCfg = this.mcpServers.get(serverName)
        if (!oldCfg || !oldCfg.__configPath__) {
            throw new Error(`MCP: server '${serverName}' not found`)
        }

        await this.mutateConfigFile(oldCfg.__configPath__, json => {
            json.mcpServers ||= {}
            json.mcpServers[serverName] = {
                ...json.mcpServers[serverName],
                ...configUpdates,
                toolOverrides: configUpdates.toolOverrides ?? oldCfg.toolOverrides ?? {},
            }
        })

        const newCfg: MCPServerConfig = {
            ...oldCfg,
            ...configUpdates,
            toolOverrides: configUpdates.toolOverrides ?? oldCfg.toolOverrides ?? {},
            __configPath__: oldCfg.__configPath__,
        }
        this.mcpServers.set(serverName, newCfg)

        const oldClient = this.clients.get(serverName)
        if (oldClient) {
            await oldClient.close()
            this.clients.delete(serverName)
        }
        this.mcpTools = this.mcpTools.filter(t => t.serverName !== serverName)

        if (!newCfg.disabled) {
            try {
                await this.initOneServer(serverName, newCfg)
            } catch (e: any) {
                this.mcpServers.delete(serverName)
                this.clients.delete(serverName)
                this.mcpTools = this.mcpTools.filter(t => t.serverName !== serverName)
                this.features.logging.warn(`MCP: server [${serverName}] init failed: ${e.message}`)
            }
        }
    }

    /**
     * Read, mutate, and write the JSON config at the given path.
     * @private
     */
    private async mutateConfigFile(configPath: string, mutator: (json: any) => void): Promise<void> {
        try {
            const raw = await this.features.workspace.fs.readFile(configPath)
            const json = JSON.parse(raw.toString())
            json.mcpServers = json.mcpServers || {}
            mutator(json)
            await this.features.workspace.fs.writeFile(configPath, JSON.stringify(json, null, 2))
        } catch (e: any) {
            this.features.logging.error(`MCP: failed to update config at ${configPath}: ${e.message}`)
            throw e
        }
    }

    /**
     * Close all clients, clear state, and reset singleton.
     */
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
        this.mcpServers.clear()
        McpManager.#instance = undefined
    }

    /**
     * Check if a tool requires approval.
     * @param server the server name
     * @param tool the tool name
     */
    public requiresApproval(server: string, tool: string): boolean {
        const cfg = this.mcpServers.get(server)
        if (!cfg) {
            // Unknown server → be conservative and require approval
            return true
        }

        // 1) server default (true = auto-approved)
        const serverAuto = cfg.autoApprove ?? true

        // 2) per-tool override, if any
        const toolAuto = cfg.toolOverrides?.[tool]?.autoApprove

        // 3) pick override if defined, else fall back to server
        const finalAuto = toolAuto !== undefined ? toolAuto : serverAuto

        // if finalAuto is false → we *require* approval
        return !finalAuto
    }
}
