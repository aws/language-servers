/*!
 * Copyright Amazon.com, Inc. or its affiliates.
 * All Rights Reserved. SPDX-License-Identifier: Apache-2.0
 */

import type { Features } from '@aws/language-server-runtimes/server-interface/server'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import {
    MCPServerConfig,
    McpToolDefinition,
    ListToolsResponse,
    McpServerRuntimeState,
    McpServerStatus,
    McpPermissionType,
    PersonaModel,
    MCPServerPermission,
} from './mcpTypes'
import { loadMcpServerConfigs, loadPersonaPermissions } from './mcpUtils'
import { AgenticChatError } from '../../errors'
import { EventEmitter } from 'events'
import { Mutex } from 'async-mutex'
import * as yaml from 'yaml'

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
    private mcpServerPermissions: Map<string, MCPServerPermission>
    public readonly events: EventEmitter
    private static readonly configMutex = new Mutex()
    private static readonly personaMutex = new Mutex()

    private constructor(
        private configPaths: string[],
        private personaPaths: string[],
        private features: Pick<Features, 'logging' | 'workspace' | 'lsp'>
    ) {
        this.mcpTools = []
        this.clients = new Map<string, Client>()
        this.mcpServers = new Map<string, MCPServerConfig>()
        this.mcpServerStates = new Map<string, McpServerRuntimeState>()
        this.mcpServerPermissions = new Map<string, MCPServerPermission>()
        this.events = new EventEmitter()
        this.features.logging.info(`MCP manager: initialized with ${configPaths.length} configs`)
    }

    /**
     * Initialize or return existing manager, then discover all servers.
     */
    public static async init(
        configPaths: string[],
        personaPaths: string[],
        features: Pick<Features, 'logging' | 'workspace' | 'lsp'>
    ): Promise<McpManager> {
        if (!McpManager.#instance) {
            const mgr = new McpManager(configPaths, personaPaths, features)
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
        const permissionMap = await loadPersonaPermissions(
            this.features.workspace,
            this.features.logging,
            this.personaPaths
        )
        this.mcpServerPermissions = permissionMap

        this.mcpServers = await loadMcpServerConfigs(this.features.workspace, this.features.logging, this.configPaths)

        // Set all servers to UNINITIALIZED state initially
        for (const name of this.mcpServers.keys()) {
            this.setState(name, McpServerStatus.UNINITIALIZED, 0)
        }

        for (const [name, cfg] of this.mcpServers.entries()) {
            if (this.isServerDisabled(name)) {
                this.features.logging.info(`MCP: server '${name}' is disabled by persona settings, skipping`)
                this.setState(name, McpServerStatus.DISABLED, 0)
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
        this.setState(serverName, McpServerStatus.INITIALIZING, 0)

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

            this.setState(serverName, McpServerStatus.ENABLED, resp.tools.length)
            this.emitToolsChanged(serverName)
        } catch (e: any) {
            this.features.logging.warn(`MCP: server [${serverName}] init failed: ${e.message}`)
            const client = this.clients.get(serverName)
            if (client) {
                await client.close()
                this.clients.delete(serverName)
            }
            this.mcpTools = this.mcpTools.filter(t => t.serverName !== serverName)
            this.handleError(serverName, e)
        }
    }

    /**
     * Return a list of all discovered tools.
     */
    public getAllTools(): McpToolDefinition[] {
        return [...this.mcpTools]
    }

    /**
     * Return all tools and their permissions
     * If serverFilter is given, only tools from that server are returned.
     */
    public getAllToolsWithPermissions(serverFilter?: string): {
        tool: McpToolDefinition
        permission: McpPermissionType
    }[] {
        return this.mcpTools
            .filter(t => !serverFilter || t.serverName === serverFilter)
            .map(toolDef => ({
                tool: toolDef,
                requiresApproval: this.requiresApproval(toolDef.serverName, toolDef.toolName),
                permission: this.getToolPerm(toolDef.serverName, toolDef.toolName),
            }))
    }

    /**
     * Return a list of all enabled tools.
     */
    public getEnabledTools(): McpToolDefinition[] {
        return this.mcpTools.filter(
            t => !this.isServerDisabled(t.serverName) && !this.isToolDisabled(t.serverName, t.toolName)
        )
    }

    /**
     * Returns true if the given tool on the given server is currently disabled.
     */
    public isToolDisabled(server: string, tool: string): boolean {
        return this.getToolPerm(server, tool) === McpPermissionType.deny
    }

    /**
     * Returns true if the given server is currently disabled.
     */
    public isServerDisabled(name: string): boolean {
        const explicit = this.mcpServerPermissions.get(name)?.enabled
        const star = this.mcpServerPermissions.get('*')?.enabled
        return !(explicit ?? star ?? false)
    }

    /**
     * Returns tool permission type for a given tool.
     */
    public getToolPerm(server: string, tool: string): McpPermissionType {
        const srv = this.mcpServerPermissions.get(server)
        const star = this.mcpServerPermissions.get('*')
        return (
            srv?.toolPerms[tool] ??
            srv?.toolPerms['*'] ??
            star?.toolPerms[tool] ??
            star?.toolPerms['*'] ??
            McpPermissionType.ask
        )
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
        if (this.isServerDisabled(server)) throw new Error(`MCP: server '${server}' is disabled`)

        const available = this.getEnabledTools()
            .filter(t => t.serverName === server)
            .map(t => t.toolName)
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
    public async addServer(
        serverName: string,
        cfg: MCPServerConfig,
        configPath: string,
        personaPath: string
    ): Promise<void> {
        try {
            if (this.mcpServers.has(serverName)) {
                throw new Error(`MCP: server '${serverName}' already exists`)
            }

            if (!configPath || !personaPath) {
                throw new Error(`Both MCP config file path and Persona config file path are required`)
            }

            await this.mutateConfigFile(configPath, json => {
                json.mcpServers[serverName] = {
                    command: cfg.command,
                    args: cfg.args,
                    env: cfg.env,
                    initializationTimeout: cfg.initializationTimeout,
                    timeout: cfg.timeout,
                }
            })

            const newCfg: MCPServerConfig = { ...cfg, __configPath__: configPath }
            this.mcpServers.set(serverName, newCfg)

            await this.mutatePersonaFile(personaPath, p => p.addServer(serverName))
            this.personaPaths = [...new Set([...this.personaPaths, personaPath])]

            const permissionMap = await loadPersonaPermissions(
                this.features.workspace,
                this.features.logging,
                this.personaPaths
            )
            this.mcpServerPermissions = permissionMap

            if (this.isServerDisabled(serverName)) {
                this.setState(serverName, McpServerStatus.DISABLED, 0)
                this.emitToolsChanged(serverName)
            } else {
                await this.initOneServer(serverName, newCfg)
            }
        } catch (err) {
            this.handleError(serverName, err)
            return
        }
    }

    /**
     * Remove a server: shutdown client, remove tools, and delete disk entry.
     */
    public async removeServer(serverName: string): Promise<void> {
        const cfg = this.mcpServers.get(serverName)
        const permission = this.mcpServerPermissions.get(serverName)
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
        this.mcpServerPermissions.delete(serverName)
        await this.mutateConfigFile(cfg.__configPath__, json => {
            delete json.mcpServers[serverName]
        })

        if (permission && permission.__configPath__) {
            await this.mutatePersonaFile(permission.__configPath__, p =>
                p.removeServer(serverName, Array.from(this.mcpServers.keys()))
            )
        }
        this.mcpServerPermissions = await loadPersonaPermissions(
            this.features.workspace,
            this.features.logging,
            this.personaPaths
        )
        this.emitToolsChanged(serverName)
    }

    /**
     * Update a server: persist changes, teardown old client/tools, and re-init if enabled.
     */
    public async updateServer(
        serverName: string,
        configUpdates: Partial<Omit<MCPServerConfig, '__configPath__'>>
    ): Promise<void> {
        try {
            const oldCfg = this.mcpServers.get(serverName)
            if (!oldCfg || !oldCfg.__configPath__) {
                throw new Error(`MCP: server '${serverName}' not found`)
            }

            await this.mutateConfigFile(oldCfg.__configPath__, json => {
                json.mcpServers ||= {}
                json.mcpServers[serverName] = {
                    ...json.mcpServers[serverName],
                    ...configUpdates,
                }
            })

            const newCfg: MCPServerConfig = {
                ...oldCfg,
                ...configUpdates,
                __configPath__: oldCfg.__configPath__,
            }

            const oldClient = this.clients.get(serverName)
            if (oldClient) {
                await oldClient.close()
                this.clients.delete(serverName)
            }
            this.mcpTools = this.mcpTools.filter(t => t.serverName !== serverName)
            this.mcpServers.set(serverName, newCfg)

            if (this.isServerDisabled(serverName)) {
                this.setState(serverName, McpServerStatus.DISABLED, 0)
                this.emitToolsChanged(serverName)
            } else {
                await this.initOneServer(serverName, newCfg)
            }
        } catch (err) {
            this.handleError(serverName, err)
            return
        }
    }

    /**
     * Close all clients, clear state, and reset singleton.
     */
    public async close(keepInstance: boolean = false): Promise<void> {
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
        if (!keepInstance) {
            McpManager.#instance = undefined
        }
    }

    /**
     * Reinitialize all MCP servers by closing existing connections and rediscovering servers
     */
    public async reinitializeMcpServers(): Promise<void> {
        this.features.logging.info('Reinitializing MCP servers')

        try {
            // close clients, clear state, but don't reset singleton
            await this.close(true)
            await this.discoverAllServers()

            const reinitializedServerCount = McpManager.#instance?.mcpServers.size
            this.features.logging.info(
                `MCP servers reinitialized completed. Total servers: ${reinitializedServerCount}`
            )
        } catch (err: any) {
            this.features.logging.error(`Error reinitializing MCP servers: ${err.message}`)
            throw err
        }
    }

    /**
     * Update permission for given server: if only tool permission changes, does not teardown and re-init.
     */
    public async updateServerPermission(serverName: string, perm: MCPServerPermission): Promise<void> {
        try {
            const personaPath = perm.__configPath__
            if (!personaPath) {
                throw new Error(`Missing personaPath for '${serverName}'`)
            }
            await this.mutatePersonaFile(personaPath, p => {
                if (perm.enabled === undefined) {
                    throw new Error('Server disabled state must be explicitly set')
                }

                // disable whole server
                if (!perm.enabled) {
                    p.removeServer(serverName, Array.from(this.mcpServers.keys())) // removes from list clears tool perms
                    return
                }

                // server must be enabled from here on
                p.addServer(serverName)

                // handle permission updates
                if (perm.toolPerms) {
                    const existing = p.toYaml().toolPerms?.[serverName] ?? {}
                    const merged = { ...existing, ...perm.toolPerms }
                    p.replaceToolPerms(serverName, merged)
                } else {
                    p.ensureWildcardAsk(serverName)
                }
            })

            const permissionMap = await loadPersonaPermissions(
                this.features.workspace,
                this.features.logging,
                this.personaPaths
            )
            this.mcpServerPermissions = permissionMap

            // enable/disable server
            if (this.isServerDisabled(serverName)) {
                const client = this.clients.get(serverName)
                if (client) {
                    await client.close()
                    this.clients.delete(serverName)
                }
                this.setState(serverName, McpServerStatus.DISABLED, 0)
            } else {
                if (!this.clients.has(serverName)) {
                    await this.initOneServer(serverName, this.mcpServers.get(serverName)!)
                } else {
                    const n = this.mcpTools.filter(t => t.serverName === serverName).length
                }
            }
            this.features.logging.info(`Permissions updated for '${serverName}' in ${personaPath}`)
            this.emitToolsChanged(serverName)
        } catch (err) {
            this.handleError(serverName, err)
            return
        }
    }

    /**
     * Read, mutate, and write the MCP JSON config at the given path.
     * @private
     */
    private async mutateConfigFile(configPath: string, mutator: (json: any) => void): Promise<void> {
        return McpManager.configMutex
            .runExclusive(async () => {
                const exists = await this.features.workspace.fs.exists(configPath)
                let json = { mcpServers: {} }
                if (exists) {
                    const raw = await this.features.workspace.fs.readFile(configPath)
                    const existingServersJson = JSON.parse(raw.toString())
                    json.mcpServers = existingServersJson.mcpServers || {}
                }
                mutator(json)
                await this.features.workspace.fs.writeFile(configPath, JSON.stringify(json, null, 2))
            })
            .catch((e: any) => {
                this.features.logging.error(`MCP: failed to update config at ${configPath}: ${e.message}`)
                throw e
            })
    }

    /**
     * Read, mutate, and write the Persona YAML config at the given path.
     * @private
     */
    private async mutatePersonaFile(personaPath: string, mutator: (p: PersonaModel) => void): Promise<void> {
        await McpManager.personaMutex
            .runExclusive(async () => {
                this.features.logging.info(`Updating persona file: ${personaPath}`)
                let raw = ''
                try {
                    raw = (await this.features.workspace.fs.readFile(personaPath)).toString()
                } catch {}

                const model = PersonaModel.fromYaml(raw ? yaml.parse(raw) : {})
                mutator(model)
                await this.features.workspace.fs.writeFile(personaPath, yaml.stringify(model.toYaml()))
                this.features.logging.debug(`Persona file write complete: ${personaPath}`)
            })
            .catch((e: any) => {
                this.features.logging.error(`MCP: failed to update persona file at ${personaPath}: ${e.message}`)
                throw e
            })
    }

    /**
     * Check if a tool requires approval.
     */
    public requiresApproval(server: string, tool: string): boolean {
        return this.getToolPerm(server, tool) === McpPermissionType.ask
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
        const enabled = this.getEnabledTools()
            .filter(t => t.serverName === server)
            .map(t => ({ ...t }))
        this.features.logging.debug(`ToolsChanged | server=${server} | toolCount=${enabled.length}`)
        this.events.emit(AGENT_TOOLS_CHANGED, server, enabled)
    }

    /**
     * Centralized error handling: logs the error, updates the status, and emits an event.
     * Exceptions are no longer thrown to ensure the remaining workflow continues uninterrupted.
     */
    private handleError(server: string | undefined, err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)

        this.features.logging.error(`MCP ERROR${server ? ` [${server}]` : ''}: ${msg}`)

        if (server) {
            this.setState(server, McpServerStatus.FAILED, 0, msg)
            this.emitToolsChanged(server)
        }
    }
}
