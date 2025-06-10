/*!
 * Copyright Amazon.com, Inc. or its affiliates.
 * All Rights Reserved. SPDX-License-Identifier: Apache-2.0
 */

import type { Features } from '@aws/language-server-runtimes/server-interface/server'
import { ChatTelemetryEventName } from '../../../../shared/telemetry/types'
import { getGlobalMcpConfigPath } from './mcpUtils'
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
import { isEmptyEnv, loadMcpServerConfigs, loadPersonaPermissions } from './mcpUtils'
import { AgenticChatError } from '../../errors'
import { EventEmitter } from 'events'
import { Mutex } from 'async-mutex'
import path = require('path')
import { URI } from 'vscode-uri'

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
    private configLoadErrors: Map<string, string>
    private mcpServerPermissions: Map<string, MCPServerPermission>
    public readonly events: EventEmitter
    private static readonly configMutex = new Mutex()
    private static readonly personaMutex = new Mutex()
    private toolNameMapping: Map<string, { serverName: string; toolName: string }>

    private constructor(
        private configPaths: string[],
        private personaPaths: string[],
        private features: Pick<
            Features,
            'logging' | 'workspace' | 'lsp' | 'telemetry' | 'credentialsProvider' | 'runtime'
        >
    ) {
        this.mcpTools = []
        this.clients = new Map<string, Client>()
        this.mcpServers = new Map<string, MCPServerConfig>()
        this.mcpServerStates = new Map<string, McpServerRuntimeState>()
        this.configLoadErrors = new Map<string, string>()
        this.mcpServerPermissions = new Map<string, MCPServerPermission>()
        this.events = new EventEmitter()
        this.features.logging.info(`MCP manager: initialized with ${configPaths.length} configs`)
        this.toolNameMapping = new Map<string, { serverName: string; toolName: string }>()
    }

    public static async init(
        configPaths: string[],
        personaPaths: string[],
        features: Pick<Features, 'logging' | 'workspace' | 'lsp' | 'telemetry' | 'credentialsProvider' | 'runtime'>
    ): Promise<McpManager> {
        if (!McpManager.#instance) {
            const mgr = new McpManager(configPaths, personaPaths, features)
            McpManager.#instance = mgr
            await mgr.discoverAllServers()
            features.logging.info(`MCP: discovered ${mgr.mcpTools.length} tools across all servers`)

            // Emit MCP configuration metrics
            const serverConfigs = mgr.getAllServerConfigs()
            const activeServers = Array.from(serverConfigs.entries()).filter(([name, _]) => !mgr.isServerDisabled(name))

            // Count global vs project servers
            const globalServers = Array.from(serverConfigs.entries()).filter(
                ([_, config]) =>
                    config?.__configPath__ === getGlobalMcpConfigPath(features.workspace.fs.getUserHomeDir())
            ).length
            const projectServers = serverConfigs.size - globalServers

            // Count tools by permission
            let toolsAlwaysAllowed = 0
            let toolsDenied = 0

            for (const [serverName, _] of activeServers) {
                const toolsWithPermissions = mgr.getAllToolsWithPermissions(serverName)
                toolsWithPermissions.forEach(item => {
                    if (item.permission === McpPermissionType.alwaysAllow) {
                        toolsAlwaysAllowed++
                    } else if (item.permission === McpPermissionType.deny) {
                        toolsDenied++
                    }
                })
            }

            // Emit MCP configuration metrics
            if (features.telemetry) {
                features.telemetry.emitMetric({
                    name: ChatTelemetryEventName.MCPConfig,
                    data: {
                        credentialStartUrl: features.credentialsProvider?.getConnectionMetadata()?.sso?.startUrl,
                        languageServerVersion: features.runtime?.serverInfo.version,
                        numActiveServers: activeServers.length,
                        numGlobalServers: globalServers,
                        numProjectServers: projectServers,
                        numToolsAlwaysAllowed: toolsAlwaysAllowed,
                        numToolsDenied: toolsDenied,
                    },
                })
            }
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

        const { servers, errors } = await loadMcpServerConfigs(
            this.features.workspace,
            this.features.logging,
            this.configPaths
        )
        this.mcpServers = servers
        // Reset the configuration errors after every refresh.
        this.configLoadErrors.clear()

        // Store any config load errors
        errors.forEach((errorMsg, key) => {
            this.configLoadErrors.set(key, errorMsg)
        })

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
                // Make sure we do not have empty key and value in mergedEnv, or adding server through UI will fail on Windows
                ...(cfg.env && !isEmptyEnv(cfg.env)
                    ? Object.fromEntries(Object.entries(cfg.env).filter(([key]) => key && key.trim() !== ''))
                    : {}),
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

            const connectPromise = client.connect(transport).catch(err => {
                let errorMessage = err.message

                // Provide specific guidance for common command not found errors
                if (err.code === 'ENOENT') {
                    errorMessage = `Command '${cfg.command}' not found. Please ensure it's installed and available in your PATH.`
                } else if (err.code === 'EINVAL') {
                    errorMessage = `Invalid arguments. Please check the command and arguments.`
                } else if (err.code === -32000) {
                    errorMessage = `MCP protocol error. The server may not be properly configured.`
                }

                throw new AgenticChatError(
                    `MCP: server '${serverName}' failed to connect: ${errorMessage}`,
                    'MCPServerConnectionFailed'
                )
            })

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

        const result =
            srv?.toolPerms[tool] ??
            srv?.toolPerms['*'] ??
            star?.toolPerms[tool] ??
            star?.toolPerms['*'] ??
            McpPermissionType.ask

        return result
    }

    /**
     * Return a list of all server configurations.
     */
    public getAllServerConfigs(): Map<string, MCPServerConfig> {
        return new Map(this.mcpServers)
    }

    public getAllPermissions(): Map<string, MCPServerPermission> {
        return new Map(this.mcpServerPermissions)
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
                const serverConfig: MCPServerConfig = {
                    command: cfg.command,
                    initializationTimeout: cfg.initializationTimeout,
                    timeout: cfg.timeout,
                }
                if (cfg.args && cfg.args.length > 0) {
                    serverConfig.args = cfg.args
                }
                if (cfg.env && !isEmptyEnv(cfg.env)) {
                    serverConfig.env = cfg.env
                }
                json.mcpServers[serverName] = serverConfig
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
            this.features.logging.error(
                `Failed to add MCP server '${serverName}': ${err instanceof Error ? err.message : String(err)}`
            )
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

        // Capture the remaining server keys before deletion for persona file update
        const remainingServer = Array.from(this.mcpServers.keys()).filter(key => key !== serverName)

        const client = this.clients.get(serverName)
        if (client) {
            await client.close()
            this.clients.delete(serverName)
        }
        this.mcpTools = this.mcpTools.filter(t => t.serverName !== serverName)
        this.mcpServerStates.delete(serverName)

        // Remove from config file first
        await this.mutateConfigFile(cfg.__configPath__, json => {
            delete json.mcpServers[serverName]
        })

        // Remove from persona file with the correct remaining server list
        if (permission && permission.__configPath__) {
            await this.mutatePersonaFile(permission.__configPath__, p => p.removeServer(serverName, remainingServer))
        }

        this.mcpServers.delete(serverName)
        this.mcpServerPermissions.delete(serverName)
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
        configUpdates: Partial<Omit<MCPServerConfig, '__configPath__'>>,
        configPath: string
    ): Promise<void> {
        try {
            if (!configPath) {
                throw new Error(`Missing configPath for '${serverName}'`)
            }
            const oldCfg = this.mcpServers.get(serverName)
            if (!oldCfg || !oldCfg.__configPath__) {
                throw new Error(`MCP: server '${serverName}' not found`)
            }

            await this.mutateConfigFile(configPath, json => {
                json.mcpServers ||= {}
                const updatedConfig = { ...(json.mcpServers[serverName] || {}) }
                if (configUpdates.command !== undefined) updatedConfig.command = configUpdates.command
                if (configUpdates.initializationTimeout !== undefined)
                    updatedConfig.initializationTimeout = configUpdates.initializationTimeout
                if (configUpdates.timeout !== undefined) updatedConfig.timeout = configUpdates.timeout
                if (configUpdates.args !== undefined) {
                    if (configUpdates.args.length > 0) {
                        updatedConfig.args = configUpdates.args
                    } else {
                        delete updatedConfig.args
                    }
                }
                if (configUpdates.env !== undefined) {
                    if (!isEmptyEnv(configUpdates.env)) {
                        updatedConfig.env = configUpdates.env
                    } else {
                        delete updatedConfig.env
                    }
                }
                json.mcpServers[serverName] = updatedConfig
            })

            const newCfg: MCPServerConfig = {
                ...oldCfg,
                ...configUpdates,
                __configPath__: configPath,
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
            // Save the current tool name mapping to preserve tool names across reinitializations
            const savedToolNameMapping = this.getToolNameMapping()

            // close clients, clear state, but don't reset singleton
            await this.close(true)

            // Restore the saved tool name mapping
            this.setToolNameMapping(savedToolNameMapping)

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
                    const existing = p.toJson().toolPerms?.[serverName] ?? {}
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
                let json: any = { mcpServers: {} }
                try {
                    const raw = await this.features.workspace.fs.readFile(configPath)
                    const existing = JSON.parse(raw.toString())
                    json = { mcpServers: {}, ...existing }
                } catch (err: any) {
                    // ignore fire not exist error
                    if (err?.code !== 'ENOENT') throw err
                }
                mutator(json)

                let fsPath: string
                try {
                    const uri = URI.parse(configPath)
                    fsPath = uri.scheme === 'file' ? uri.fsPath : configPath
                } catch {
                    fsPath = configPath
                }
                fsPath = path.normalize(fsPath)

                const dir = path.dirname(fsPath)
                await this.features.workspace.fs.mkdir(dir, { recursive: true })

                await this.features.workspace.fs.writeFile(fsPath, JSON.stringify(json, null, 2))
                this.features.logging.debug(`MCP config file write complete: ${configPath}`)
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

                const model = PersonaModel.fromJson(raw ? JSON.parse(raw) : {})
                mutator(model)
                await this.features.workspace.fs.writeFile(personaPath, JSON.stringify(model.toJson(), null, 2))
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

    /**
     * Returns any errors that occurred during loading of MCP configuration files
     */
    public getConfigLoadErrors(): string | undefined {
        if (this.configLoadErrors.size === 0) {
            return undefined
        }

        return Array.from(this.configLoadErrors.entries())
            .map(([server, error]) => `File: ${server}, Error: ${error}`)
            .join('\n\n')
    }

    /**
     * Remove a server from the config file but keep it in memory.
     * This is used when there's a server status error during initialization.
     */
    public async removeServerFromConfigFile(serverName: string): Promise<void> {
        try {
            const cfg = this.mcpServers.get(serverName)
            if (!cfg || !cfg.__configPath__) {
                this.features.logging.warn(
                    `Cannot remove config for server '${serverName}': Config not found or missing path`
                )
                return
            }

            await this.mutateConfigFile(cfg.__configPath__, json => {
                delete json.mcpServers[serverName]
            })

            this.features.logging.info(`Removed server '${serverName}' from config file but kept in memory`)
        } catch (err) {
            this.features.logging.error(`Error removing server '${serverName}' from config file: ${err}`)
        }
    }

    public getOriginalToolNames(namespacedName: string): { serverName: string; toolName: string } | undefined {
        return this.toolNameMapping.get(namespacedName)
    }

    public clearToolNameMapping(): void {
        this.toolNameMapping.clear()
    }

    public getToolNameMapping(): Map<string, { serverName: string; toolName: string }> {
        return new Map(this.toolNameMapping)
    }

    public setToolNameMapping(mapping: Map<string, { serverName: string; toolName: string }>): void {
        this.toolNameMapping = new Map(mapping)
    }
}
