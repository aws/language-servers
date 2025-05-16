/*!
 * Copyright Amazon.com, Inc. or its affiliates.
 * All Rights Reserved. SPDX-License-Identifier: Apache-2.0
 */

import type { Features } from '@aws/language-server-runtimes/server-interface/server'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import type {
    MCPServerConfig,
    McpToolDefinition,
    ListToolsResponse,
    McpServerRuntimeState,
    McpServerStatus,
    MCPServerPermissionUpdate,
} from './mcpTypes'
import { loadMcpServerConfigs } from './mcpUtils'
import { AgenticChatError } from '../../errors'
import { EventEmitter } from 'events'
import { Mutex } from 'async-mutex'

export const MCP_SERVER_STATUS_CHANGED = 'mcpServerStatusChanged'
export const AGENT_TOOLS_CHANGED = 'agentToolsChanged'

/**
 * Manages MCP servers and their tools
 */
export class McpManager {
    static #instance?: McpManager
    private clients: Map<string, Client>
    private mcpTools: McpToolDefinition[]
    private mcpServers: Map<string, MCPServerConfig>
    private mcpServerStates: Map<string, McpServerRuntimeState>
    public readonly events: EventEmitter
    private static readonly configMutex = new Mutex()

    private constructor(
        private configPaths: string[],
        private features: Pick<Features, 'logging' | 'workspace' | 'lsp'>
    ) {
        this.mcpTools = []
        this.clients = new Map<string, Client>()
        this.mcpServers = new Map<string, MCPServerConfig>()
        this.mcpServerStates = new Map<string, McpServerRuntimeState>()
        this.events = new EventEmitter()
        this.features.logging.info(`MCP manager: initialized with ${configPaths.length} configs`)
    }

    /**
     * Initialize or return existing manager, then discover all servers.
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
     * Return the current runtime state for one server.
     */
    public getServerState(serverName: string): McpServerRuntimeState | undefined {
        return this.mcpServerStates.get(serverName)
    }

    /**
     * Return a copy of the entire server‑state map.
     */
    public getAllServerStates(): Map<string, McpServerRuntimeState> {
        return new Map(this.mcpServerStates)
    }

    /**
     * Load configurations and initialize each enabled server.
     */
    private async discoverAllServers(): Promise<void> {
        this.mcpServers = await loadMcpServerConfigs(this.features.workspace, this.features.logging, this.configPaths)

        for (const [name, cfg] of this.mcpServers.entries()) {
            if (cfg.disabled) {
                this.features.logging.info(`MCP: server '${name}' is disabled, skipping`)
                this.setState(name, 'DISABLED', 0)
                this.emitToolsChanged(name)
                continue
            }
            await this.initOneServer(name, cfg)
        }
    }

    /**
     * Start a server process, connect client, and register its tools.
     * Errors are logged but do not stop discovery of other servers.
     */
    private async initOneServer(serverName: string, cfg: MCPServerConfig): Promise<void> {
        const DEFAULT_SERVER_INIT_TIMEOUT_MS = 60_000
        this.setState(serverName, 'INITIALIZING', 0)

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

            const connectPromise = client.connect(transport)

            // 0 -> no timeout
            if (cfg.initializationTimeout === 0) {
                await connectPromise
            } else {
                const timeoutMs = cfg.initializationTimeout ?? DEFAULT_SERVER_INIT_TIMEOUT_MS
                const timeoutPromise = new Promise<never>((_, reject) => {
                    const timer = setTimeout(
                        () =>
                            reject(
                                new AgenticChatError(
                                    `MCP: server '${serverName}' initialization timed out after ${timeoutMs} ms`,
                                    'MCPServerInitTimeout'
                                )
                            ),
                        timeoutMs
                    )
                    timer.unref()
                })
                await Promise.race([connectPromise, timeoutPromise])
            }

            this.clients.set(serverName, client)
            this.mcpTools = this.mcpTools.filter(t => t.serverName !== serverName)

            const resp = (await client.listTools()) as ListToolsResponse
            for (const t of resp.tools) {
                if (!t.name) {
                    this.features.logging.warn(`MCP: server [${serverName}] returned tool with no name, skipping`)
                    continue
                }
                this.features.logging.info(`MCP: discovered tool ${serverName}::${t.name}`)
                this.mcpTools.push({
                    serverName,
                    toolName: t.name,
                    description: t.description ?? '',
                    inputSchema: t.inputSchema ?? {},
                })
            }

            this.setState(serverName, 'ENABLED', resp.tools.length)
            this.emitToolsChanged(serverName)
        } catch (e: any) {
            const client = this.clients.get(serverName)
            if (client) {
                await client.close()
                this.clients.delete(serverName)
            }
            this.mcpTools = this.mcpTools.filter(t => t.serverName !== serverName)
            this.setState(serverName, 'FAILED', 0, e.message)
            this.emitToolsChanged(serverName)
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
     * Return all tools and their enabled & approval flags. (this will be replaced with the state enum later)
     * If serverFilter is given, only tools from that server are returned.
     */
    public getAllToolsWithStates(serverFilter?: string): {
        tool: McpToolDefinition
        disabled: boolean
        requiresApproval: boolean
    }[] {
        return this.mcpTools
            .filter(t => !serverFilter || t.serverName === serverFilter)
            .map(toolDef => ({
                tool: toolDef,
                disabled: this.isToolDisabled(toolDef.serverName, toolDef.toolName),
                requiresApproval: this.requiresApproval(toolDef.serverName, toolDef.toolName),
            }))
    }

    /**
     * Return a list of all enabled tools.
     */
    public getEnabledTools(): McpToolDefinition[] {
        return this.mcpTools.filter(t => {
            const cfg = this.mcpServers.get(t.serverName)
            return cfg && !cfg.disabled && !this.isToolDisabled(t.serverName, t.toolName)
        })
    }

    /**
     * Returns true if the given tool on the given server is currently disabled.
     */
    public isToolDisabled(server: string, tool: string): boolean {
        const cfg = this.mcpServers.get(server)
        return !!cfg?.toolOverrides?.[tool]?.disabled
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
        const DEFAULT_TOOL_EXEC_TIMEOUT_MS = 60_000

        const cfg = this.mcpServers.get(server)
        if (!cfg) throw new Error(`MCP: server '${server}' is not configured`)
        if (cfg.disabled) throw new Error(`MCP: server '${server}' is disabled`)

        const available = this.mcpTools.filter(t => t.serverName === server).map(t => t.toolName)
        if (!available.includes(tool)) {
            throw new Error(`MCP: tool '${tool}' not found on '${server}'. Available: ${available.join(', ')}`)
        }

        const client = this.clients.get(server)
        if (!client) throw new Error(`MCP: server '${server}' not connected`)

        const timeoutCfg = cfg.timeout
        const callPromise = client.callTool({ name: tool, arguments: args })

        // 0 -> no timeout
        if (timeoutCfg === 0) {
            return await callPromise
        }

        const execTimeout = timeoutCfg ?? DEFAULT_TOOL_EXEC_TIMEOUT_MS
        const timeoutPromise = new Promise<never>((_, reject) => {
            const timer = setTimeout(
                () =>
                    reject(
                        new AgenticChatError(
                            `MCP: tool '${server}::${tool}' execution timed out after ${execTimeout} ms`,
                            'MCPToolExecTimeout'
                        )
                    ),
                execTimeout
            )
            timer.unref()
        })

        try {
            return await Promise.race([callPromise, timeoutPromise])
        } catch (err: unknown) {
            if (err instanceof AgenticChatError && err.code === 'MCPToolExecTimeout') {
                this.features.logging.error(err.message)
            }
            throw err
        }
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
                initializationTimeout: cfg.initializationTimeout,
                disabled: cfg.disabled,
                autoApprove: cfg.autoApprove,
                toolOverrides: cfg.toolOverrides,
            }
        })

        const newCfg: MCPServerConfig = { ...cfg, __configPath__: configPath }
        this.mcpServers.set(serverName, newCfg)

        if (cfg.disabled) {
            this.setState(serverName, 'DISABLED', 0)
            this.emitToolsChanged(serverName)
        } else {
            await this.initOneServer(serverName, newCfg)
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
        this.mcpServerStates.delete(serverName)
        this.emitToolsChanged(serverName)
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

        const oldClient = this.clients.get(serverName)
        if (oldClient) {
            await oldClient.close()
            this.clients.delete(serverName)
        }
        this.mcpTools = this.mcpTools.filter(t => t.serverName !== serverName)
        this.mcpServers.set(serverName, newCfg)

        if (newCfg.disabled) {
            this.setState(serverName, 'DISABLED', 0)
            this.emitToolsChanged(serverName)
        } else {
            await this.initOneServer(serverName, newCfg)
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
        this.mcpServerStates.clear()
        McpManager.#instance = undefined
    }

    /**
     * Check if a tool requires approval.
     */
    public requiresApproval(server: string, tool: string): boolean {
        const cfg = this.mcpServers.get(server)
        if (!cfg) {
            return true
        }

        // 1) server default (true = auto-approved)
        const serverAuto = cfg.autoApprove ?? true

        // 2) per-tool override, if any
        const toolAuto = cfg.toolOverrides?.[tool]?.autoApprove

        // 3) pick override if defined, else fall back to server
        const finalAuto = toolAuto !== undefined ? toolAuto : serverAuto

        return !finalAuto
    }

    /**
     * Update permission for given server: if only tool permission changes, does not teardown and re-init.
     */
    public async updateServerPermission(serverName: string, perm: MCPServerPermissionUpdate): Promise<void> {
        const oldCfg = this.mcpServers.get(serverName)
        if (!oldCfg || !oldCfg.__configPath__) {
            throw new Error(`MCP: server '${serverName}' not found`)
        }

        await this.mutateConfigFile(oldCfg.__configPath__, json => {
            json.mcpServers ||= {}
            json.mcpServers[serverName] = {
                ...json.mcpServers[serverName],
                ...perm,
            }
        })

        const newCfg: MCPServerConfig = {
            ...oldCfg,
            ...perm,
            __configPath__: oldCfg.__configPath__,
        }
        this.mcpServers.set(serverName, newCfg)

        const oldDisabled = !!oldCfg.disabled // undefined -> false
        const newDisabled = perm.disabled ?? oldDisabled // no value -> old value

        if (perm.disabled !== undefined && newDisabled !== oldDisabled) {
            // Server level ENABLED → DISABLED
            if (newDisabled) {
                const client = this.clients.get(serverName)
                if (client) {
                    await client.close()
                    this.clients.delete(serverName)
                }
                this.setState(serverName, 'DISABLED', 0)
            } else {
                // Server level DISABLED → ENABLED
                await this.initOneServer(serverName, newCfg)
                return
            }
        } else {
            const count = this.mcpTools.filter(t => t.serverName === serverName).length
            this.setState(serverName, newDisabled ? 'DISABLED' : 'ENABLED', count)
        }

        this.emitToolsChanged(serverName)
    }

    /**
     * Read, mutate, and write the JSON config at the given path.
     * @private
     */
    private async mutateConfigFile(configPath: string, mutator: (json: any) => void): Promise<void> {
        return McpManager.configMutex
            .runExclusive(async () => {
                const raw = await this.features.workspace.fs.readFile(configPath)
                const json = JSON.parse(raw.toString())
                json.mcpServers = json.mcpServers || {}
                mutator(json)
                await this.features.workspace.fs.writeFile(configPath, JSON.stringify(json, null, 2))
            })
            .catch((e: any) => {
                this.features.logging.error(`MCP: failed to update config at ${configPath}: ${e.message}`)
                throw e
            })
    }

    /**
     * Updates the runtime state for a given server, including status, tool count, and optional error message.
     * This is used by the UI to reflect real-time server status.
     * @private
     */
    private setState(server: string, status: McpServerStatus, toolsCount: number, lastError?: string) {
        const st: McpServerRuntimeState = { status, toolsCount, lastError }
        this.mcpServerStates.set(server, st)
        this.events.emit(MCP_SERVER_STATUS_CHANGED, server, { ...st })
    }

    /**
     * Emits an event when the tools associated with a server change.
     * Used to refresh the Agent's tool list.
     * @private
     */
    private emitToolsChanged(server: string) {
        const enabled = this.getEnabledTools().filter(t => t.serverName === server)
        this.events.emit(AGENT_TOOLS_CHANGED, server, enabled)
    }
}
