/*!
 * Copyright Amazon.com, Inc. or its affiliates.
 * All Rights Reserved. SPDX-License-Identifier: Apache-2.0
 */

import type { Features } from '@aws/language-server-runtimes/server-interface/server'
import { ChatTelemetryEventName } from '../../../../shared/telemetry/types'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import {
    MCPServerConfig,
    McpToolDefinition,
    ListToolsResponse,
    McpServerRuntimeState,
    McpServerStatus,
    McpPermissionType,
    MCPServerPermission,
    AgentConfig,
} from './mcpTypes'
import {
    isEmptyEnv,
    loadAgentConfig,
    saveAgentConfig,
    sanitizeName,
    getGlobalAgentConfigPath,
    getWorkspaceMcpConfigPaths,
    getGlobalMcpConfigPath,
} from './mcpUtils'
import { AgenticChatError } from '../../errors'
import { EventEmitter } from 'events'
import { Mutex } from 'async-mutex'
import path = require('path')
import { URI } from 'vscode-uri'
import { sanitizeInput } from '../../../../shared/utils'

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
    private serverNameMapping: Map<string, string>
    private agentConfig!: AgentConfig

    private constructor(
        private agentPaths: string[],
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
        this.events = new EventEmitter({ captureRejections: true }).on('error', console.error)
        this.features.logging.info(`MCP manager: initialized with ${agentPaths.length} configs`)
        this.toolNameMapping = new Map<string, { serverName: string; toolName: string }>()
        this.serverNameMapping = new Map<string, string>()
    }

    public static async init(
        agentPaths: string[],
        features: Pick<Features, 'logging' | 'workspace' | 'lsp' | 'telemetry' | 'credentialsProvider' | 'runtime'>
    ): Promise<McpManager> {
        if (!McpManager.#instance) {
            const mgr = new McpManager(agentPaths, features)
            McpManager.#instance = mgr
            await mgr.discoverAllServers()
            features.logging.info(`MCP: discovered ${mgr.mcpTools.length} tools across all servers`)

            // Emit MCP configuration metrics
            const serverConfigs = mgr.getAllServerConfigs()
            const activeServers = Array.from(serverConfigs.entries())

            // Count global vs project servers
            const globalServers = Array.from(serverConfigs.entries()).filter(
                ([_, config]) =>
                    config?.__configPath__ === getGlobalAgentConfigPath(features.workspace.fs.getUserHomeDir())
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
        // Load agent config
        const result = await loadAgentConfig(this.features.workspace, this.features.logging, this.agentPaths)

        // Extract agent config and other data
        this.agentConfig = result.agentConfig
        this.mcpServers = result.servers
        this.serverNameMapping = result.serverNameMapping

        // Reset the configuration errors after every refresh.
        this.configLoadErrors.clear()

        // Store any config load errors
        result.errors.forEach((errorMsg, key) => {
            this.configLoadErrors.set(key, errorMsg)
        })

        this.features.logging.info('Using agent configuration')

        // Reset permissions map
        this.mcpServerPermissions.clear()

        // Initialize permissions for servers from agent config
        for (const [sanitizedName, _] of this.mcpServers.entries()) {
            const name = this.serverNameMapping.get(sanitizedName) || sanitizedName

            // Set server status to UNINITIALIZED initially
            this.setState(sanitizedName, McpServerStatus.UNINITIALIZED, 0)

            // Initialize permissions for this server
            const serverPrefix = `@${name}`

            // Extract tool permissions from agent config
            const toolPerms: Record<string, McpPermissionType> = {}

            // Check if the server is enabled as a whole (@server) or just specific tools (@server/tool)
            const isWholeServerEnabled = this.agentConfig.tools.includes(serverPrefix)

            if (isWholeServerEnabled) {
                // Check for specific tools in allowedTools
                this.agentConfig.allowedTools.forEach(allowedTool => {
                    if (allowedTool.startsWith(serverPrefix + '/')) {
                        const toolName = allowedTool.substring(serverPrefix.length + 1)
                        if (toolName) {
                            // This specific tool is in allowedTools
                            toolPerms[toolName] = McpPermissionType.alwaysAllow
                        }
                    }
                })
            } else {
                // Only specific tools are enabled
                this.agentConfig.tools.forEach(tool => {
                    if (tool.startsWith(serverPrefix + '/')) {
                        const toolName = tool.substring(serverPrefix.length + 1)
                        if (toolName) {
                            // Check if tool is in allowedTools
                            if (this.agentConfig.allowedTools.includes(tool)) {
                                toolPerms[toolName] = McpPermissionType.alwaysAllow
                            } else {
                                toolPerms[toolName] = McpPermissionType.ask
                            }
                        }
                    }
                })
            }

            this.mcpServerPermissions.set(sanitizedName, {
                enabled: true,
                toolPerms,
            })
        }

        // Get all servers that need to be initialized
        const serversToInit: Array<[string, MCPServerConfig]> = []

        for (const [name, cfg] of this.mcpServers.entries()) {
            serversToInit.push([name, cfg])
        }

        // Process servers in batches of 5 at a time
        const MAX_CONCURRENT_SERVERS = 5
        const totalServers = serversToInit.length

        if (totalServers > 0) {
            this.features.logging.info(
                `MCP: initializing ${totalServers} servers with max concurrency of ${MAX_CONCURRENT_SERVERS}`
            )

            // Process servers in batches
            for (let i = 0; i < totalServers; i += MAX_CONCURRENT_SERVERS) {
                const batch = serversToInit.slice(i, i + MAX_CONCURRENT_SERVERS)
                const batchPromises = batch.map(([name, cfg]) => this.initOneServer(name, cfg))

                this.features.logging.debug(
                    `MCP: initializing batch of ${batch.length} servers (${i + 1}-${Math.min(i + MAX_CONCURRENT_SERVERS, totalServers)} of ${totalServers})`
                )
                await Promise.all(batchPromises)
            }

            this.features.logging.info(`MCP: completed initialization of ${totalServers} servers`)
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
            const transportConfig: any = {
                command: cfg.command,
                args: cfg.args ?? [],
                env: mergedEnv,
            }

            try {
                const workspaceFolders = this.features.workspace.getAllWorkspaceFolders()
                if (workspaceFolders.length > 0) {
                    transportConfig.cwd = URI.parse(workspaceFolders[0].uri).fsPath
                }
            } catch {
                this.features.logging.debug(
                    `MCP: No workspace folder available for server [${serverName}], continuing without cwd`
                )
            }

            const transport = new StdioClientTransport(transportConfig)
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

            // 0 or undefined -> no timeout
            if (cfg.initializationTimeout === 0 || cfg.initializationTimeout === undefined) {
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
                    description: sanitizeInput(t.description ?? ''),
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
        return this.mcpTools.filter(t => !this.isToolDisabled(t.serverName, t.toolName))
    }

    /**
     * Returns true if the given tool on the given server is currently disabled.
     */
    public isToolDisabled(server: string, tool: string): boolean {
        // built-in tools cannot be disabled
        if (server === 'builtIn') {
            return false
        }

        // Check if the server is enabled as a whole (@server)
        const serverPrefix = `@${server}`
        const isWholeServerEnabled = this.agentConfig.tools.includes(serverPrefix)

        // Check if the specific tool is enabled
        const toolId = `${serverPrefix}/${tool}`
        const isSpecificToolEnabled = this.agentConfig.tools.includes(toolId)

        // If server is enabled as a whole, all tools are enabled
        if (isWholeServerEnabled) {
            return false
        }

        // Otherwise, check if this specific tool is enabled
        return !isSpecificToolEnabled
    }

    /**
     * Returns true if the given server is currently disabled.
     */
    // public isServerDisabled(name: string): boolean {
    //     // Check if any tool from this server is enabled
    //     return !this.agentConfig.tools.some(tool => {
    //         if (tool.startsWith('@')) {
    //             // Check if it's the server itself or a tool from the server
    //             return tool === `@${name}` || tool.startsWith(`@${name}/`)
    //         }
    //         return false
    //     })
    // }

    /**
     * Returns tool permission type for a given tool.
     */
    public getToolPerm(server: string, tool: string): McpPermissionType {
        // For built-in tools, check directly without prefix
        if (server === 'builtIn') {
            return this.agentConfig.allowedTools.includes(tool) ? McpPermissionType.alwaysAllow : McpPermissionType.ask
        }

        // Check if the server is enabled as a whole (@server)
        const serverPrefix = `@${server}`
        const isWholeServerEnabled = this.agentConfig.tools.includes(serverPrefix)

        // Check if the specific tool is enabled
        const toolId = `${serverPrefix}/${tool}`
        const isSpecificToolEnabled = this.agentConfig.tools.includes(toolId)

        // If the tool is not enabled, return deny
        if (!isWholeServerEnabled && !isSpecificToolEnabled) {
            return McpPermissionType.deny
        }

        // If server is enabled as a whole, check if the server itself is in allowedTools
        if (isWholeServerEnabled) {
            // If server is in allowedTools, all tools are alwaysAllow
            if (this.agentConfig.allowedTools.includes(serverPrefix)) {
                return McpPermissionType.alwaysAllow
            }

            // Otherwise, check if specific tool is in allowedTools
            return this.agentConfig.allowedTools.includes(toolId)
                ? McpPermissionType.alwaysAllow
                : McpPermissionType.ask
        }

        // For specific tools, check if it's in allowedTools
        return this.agentConfig.allowedTools.includes(toolId) ? McpPermissionType.alwaysAllow : McpPermissionType.ask
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
        // if (this.isServerDisabled(server)) throw new Error(`MCP: server '${server}' is disabled`)

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
    public async addServer(serverName: string, cfg: MCPServerConfig, agentPath: string): Promise<void> {
        try {
            const sanitizedName = sanitizeName(serverName)
            if (
                this.mcpServers.has(sanitizedName) &&
                this.getServerState(sanitizedName)?.status == McpServerStatus.ENABLED
            ) {
                throw new Error(`MCP: server '${sanitizedName}' already exists`)
            }

            // Add server to agent config
            const serverConfig: MCPServerConfig = {
                command: cfg.command,
                initializationTimeout: cfg.initializationTimeout,
            }

            // Only add timeout to agent config if it's not 0
            if (cfg.timeout !== 0) {
                serverConfig.timeout = cfg.timeout
            }
            if (cfg.args && cfg.args.length > 0) {
                serverConfig.args = cfg.args
            }
            if (cfg.env && !isEmptyEnv(cfg.env)) {
                serverConfig.env = cfg.env
            }

            // Add to agent config
            this.agentConfig.mcpServers[serverName] = serverConfig

            // We don't need to store configPath anymore as we're using agent config
            const newCfg: MCPServerConfig = { ...cfg, __configPath__: agentPath }
            this.mcpServers.set(sanitizedName, newCfg)
            this.serverNameMapping.set(sanitizedName, serverName)

            // Check if the server already has permissions in the agent config
            const serverPrefix = `@${serverName}`
            const hasServerInTools = this.agentConfig.tools.some(
                tool => tool === serverPrefix || tool.startsWith(`${serverPrefix}/`)
            )

            // Only set permissions if the server doesn't already have them
            if (!hasServerInTools) {
                // Enable the server as a whole rather than individual tools
                this.agentConfig.tools.push(serverPrefix)
            }

            // Save agent config once with all changes
            await saveAgentConfig(this.features.workspace, this.features.logging, this.agentConfig, agentPath)

            // Add server tools to tools list after initialization
            await this.initOneServer(sanitizedName, newCfg)
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
        const unsanitizedName = this.serverNameMapping.get(serverName)
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
        this.mcpServerStates.delete(serverName)

        // Remove from agent config
        if (unsanitizedName && this.agentConfig) {
            // Remove server from mcpServers
            delete this.agentConfig.mcpServers[unsanitizedName]

            // Remove server tools from tools list
            this.agentConfig.tools = this.agentConfig.tools.filter(tool => {
                if (tool.startsWith('@')) {
                    if (tool === `@${unsanitizedName}`) {
                        return false
                    }
                    if (tool.startsWith(`@${unsanitizedName}/`)) {
                        return false
                    }
                }
                return true
            })

            // Remove server tools from allowedTools
            this.agentConfig.allowedTools = this.agentConfig.allowedTools.filter(tool => {
                if (tool.startsWith('@')) {
                    if (tool === `@${unsanitizedName}`) {
                        return false
                    }
                    if (tool.startsWith(`@${unsanitizedName}/`)) {
                        return false
                    }
                }
                return true
            })

            // Save agent config
            await saveAgentConfig(this.features.workspace, this.features.logging, this.agentConfig, cfg.__configPath__)

            // Get all config paths and delete the server from each one
            const wsUris = this.features.workspace.getAllWorkspaceFolders()?.map(f => f.uri) ?? []
            const wsConfigPaths = getWorkspaceMcpConfigPaths(wsUris)
            const globalConfigPath = getGlobalMcpConfigPath(this.features.workspace.fs.getUserHomeDir())
            const allConfigPaths = [...wsConfigPaths, globalConfigPath]

            // Delete the server from all config files
            for (const configPath of allConfigPaths) {
                try {
                    await this.mutateConfigFile(configPath, json => {
                        if (json.mcpServers && json.mcpServers[unsanitizedName]) {
                            delete json.mcpServers[unsanitizedName]
                            this.features.logging.info(
                                `Deleted server '${unsanitizedName}' from config file: ${configPath}`
                            )
                        }
                    })
                } catch (err) {
                    this.features.logging.warn(
                        `Failed to delete server '${unsanitizedName}' from config file ${configPath}: ${err}`
                    )
                }
            }
        }

        this.mcpServers.delete(serverName)
        this.serverNameMapping.delete(serverName)
        this.emitToolsChanged(serverName)
    }

    /**
     * Update a server: persist changes, teardown old client/tools, and re-init if enabled.
     */
    public async updateServer(
        serverName: string,
        configUpdates: Partial<Omit<MCPServerConfig, '__configPath__'>>,
        agentPath: string
    ): Promise<void> {
        try {
            const oldCfg = this.mcpServers.get(serverName)
            if (!oldCfg) {
                throw new Error(`MCP: server '${serverName}' not found`)
            }

            const unsanitizedServerName = this.serverNameMapping.get(serverName)!

            // Update agent config
            if (this.agentConfig && unsanitizedServerName) {
                const updatedConfig = { ...(this.agentConfig.mcpServers[unsanitizedServerName] || {}) }
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

                this.agentConfig.mcpServers[unsanitizedServerName] = updatedConfig

                // Save agent config
                await saveAgentConfig(this.features.workspace, this.features.logging, this.agentConfig, agentPath)
            }

            const newCfg: MCPServerConfig = {
                ...oldCfg,
                ...configUpdates,
            }

            const oldClient = this.clients.get(serverName)
            if (oldClient) {
                await oldClient.close()
                this.clients.delete(serverName)
            }
            this.mcpTools = this.mcpTools.filter(t => t.serverName !== serverName)
            this.mcpServers.set(serverName, newCfg)
            this.serverNameMapping.set(serverName, unsanitizedServerName)

            // if (this.isServerDisabled(serverName)) {
            //     this.setState(serverName, McpServerStatus.DISABLED, 0)
            //     this.emitToolsChanged(serverName)
            // } else {
            //     await this.initOneServer(serverName, newCfg)
            // }
            await this.initOneServer(serverName, newCfg)
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
        this.agentConfig = {
            name: 'default-agent',
            version: '1.0.0',
            description: 'Agent configuration',
            mcpServers: {},
            tools: [],
            allowedTools: [],
            toolsSettings: {},
            includedFiles: [],
            resources: [],
        }
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
            const unsanitizedServerName = this.serverNameMapping.get(serverName) || serverName

            // Get server config
            // const serverConfig = this.mcpServers.get(serverName)
            // if (!serverConfig) {
            //     throw new Error(`Server '${serverName}' not found`)
            // }

            const serverPrefix = `@${unsanitizedServerName}`

            // Track tools that should be enabled
            const toolsToEnable = new Set<string>()
            const toolsToAlwaysAllow = new Set<string>()

            // Check if server is enabled as a whole
            const isWholeServerEnabled = this.agentConfig.tools.includes(serverPrefix)

            // Process each tool permission
            for (const [toolName, permission] of Object.entries(perm.toolPerms || {})) {
                const toolId = `${serverPrefix}/${toolName}`

                if (permission === McpPermissionType.deny) {
                    // For deny: if server is enabled as a whole, we need to switch to individual tools
                    if (isWholeServerEnabled) {
                        // Get all tools for this server
                        const serverTools = this.mcpTools.filter(t => t.serverName === serverName)

                        // Remove server prefix from tools
                        this.agentConfig.tools = this.agentConfig.tools.filter(t => t !== serverPrefix)

                        // Add all tools except the denied one
                        for (const t of serverTools) {
                            if (t.toolName !== toolName) {
                                const tid = `${serverPrefix}/${t.toolName}`
                                if (!this.agentConfig.tools.includes(tid)) {
                                    this.agentConfig.tools.push(tid)
                                }
                                toolsToEnable.add(tid)
                            }
                        }
                    } else {
                        // Just remove the specific tool
                        this.agentConfig.tools = this.agentConfig.tools.filter(t => t !== toolId)
                    }

                    // Always remove from allowedTools
                    this.agentConfig.allowedTools = this.agentConfig.allowedTools.filter(t => t !== toolId)
                } else {
                    // For ask or alwaysAllow: add to tools
                    toolsToEnable.add(toolId)

                    // For alwaysAllow: also add to allowedTools
                    if (permission === McpPermissionType.alwaysAllow) {
                        toolsToAlwaysAllow.add(toolId)
                    } else {
                        // For ask: remove from allowedTools if present
                        this.agentConfig.allowedTools = this.agentConfig.allowedTools.filter(t => t !== toolId)
                    }
                }
            }

            // If all tools are enabled, use @serverName instead of individual tools
            const allTools = this.mcpTools.filter(t => t.serverName === serverName).map(t => t.toolName)

            // Check if all tools are enabled, considering both:
            // 1. The server might already be enabled as a whole (isWholeServerEnabled)
            // 2. All tools might be individually enabled in toolsToEnable
            const allToolsEnabled =
                allTools.length > 0 &&
                // If server is already enabled as a whole and no tools are being denied
                ((isWholeServerEnabled && !Object.values(perm.toolPerms || {}).includes(McpPermissionType.deny)) ||
                    // Or if all tools are individually enabled
                    allTools.every(
                        toolName =>
                            toolsToEnable.has(`${serverPrefix}/${toolName}`) ||
                            !Object.keys(perm.toolPerms || {}).includes(toolName)
                    ))

            // Update tools list
            if (allToolsEnabled) {
                // Remove individual tool entries
                this.agentConfig.tools = this.agentConfig.tools.filter(t => !t.startsWith(`${serverPrefix}/`))
                // Add server prefix if not already there
                if (!this.agentConfig.tools.includes(serverPrefix)) {
                    this.agentConfig.tools.push(serverPrefix)
                }
            } else {
                // Remove server prefix if present
                this.agentConfig.tools = this.agentConfig.tools.filter(t => t !== serverPrefix)
                // Add individual tools
                for (const toolId of toolsToEnable) {
                    if (!this.agentConfig.tools.includes(toolId)) {
                        this.agentConfig.tools.push(toolId)
                    }
                }
            }

            // Update allowedTools list
            for (const toolId of toolsToAlwaysAllow) {
                if (!this.agentConfig.allowedTools.includes(toolId)) {
                    this.agentConfig.allowedTools.push(toolId)
                }
            }

            // Save agent config
            const agentPath = perm.__configPath__
            if (agentPath) {
                await saveAgentConfig(this.features.workspace, this.features.logging, this.agentConfig, agentPath)
            }

            // Update mcpServerPermissions map
            this.mcpServerPermissions.set(serverName, {
                enabled: perm.enabled,
                toolPerms: perm.toolPerms || {},
            })

            this.features.logging.info(`Permissions updated for '${serverName}' in agent config`)
            this.emitToolsChanged(serverName)
        } catch (err) {
            this.handleError(serverName, err)
            return
        }
    }

    /**
     * Check if a tool requires approval.
     */
    public requiresApproval(server: string, tool: string): boolean {
        // For built-in tools, check directly without prefix
        const toolId = server === 'builtIn' ? tool : `@${server}/${tool}`
        return !this.agentConfig.allowedTools.includes(toolId)
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
     * Remove a server from the agent config file but keep it in memory.
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

            const unsanitizedName = this.serverNameMapping.get(serverName) || serverName

            // Remove from agent config
            if (unsanitizedName && this.agentConfig) {
                // Remove server from mcpServers
                delete this.agentConfig.mcpServers[unsanitizedName]

                // Remove server tools from tools list
                this.agentConfig.tools = this.agentConfig.tools.filter(tool => {
                    if (tool.startsWith('@')) {
                        if (tool === `@${unsanitizedName}`) {
                            return false
                        }
                        if (tool.startsWith(`@${unsanitizedName}/`)) {
                            return false
                        }
                    }
                    return true
                })

                // Remove server tools from allowedTools
                this.agentConfig.allowedTools = this.agentConfig.allowedTools.filter(tool => {
                    if (tool.startsWith('@')) {
                        if (tool === `@${unsanitizedName}`) {
                            return false
                        }
                        if (tool.startsWith(`@${unsanitizedName}/`)) {
                            return false
                        }
                    }
                    return true
                })

                // Save agent config
                await saveAgentConfig(
                    this.features.workspace,
                    this.features.logging,
                    this.agentConfig,
                    cfg.__configPath__
                )
            }
        } catch (err) {
            this.features.logging.error(`Error removing server '${serverName}' from agent config file: ${err}`)
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
                    this.features.logging.info(`Updating MCP config file: ${configPath}`)
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

    public getOriginalToolNames(namespacedName: string): { serverName: string; toolName: string } | undefined {
        return this.toolNameMapping.get(namespacedName)
    }

    public clearToolNameMapping(): void {
        this.toolNameMapping.clear()
    }

    public getToolNameMapping(): Map<string, { serverName: string; toolName: string }> {
        return new Map(this.toolNameMapping)
    }

    /**
     * Determines if a server is global or workspace-specific
     * @param serverName The name of the server to check
     * @returns true if the server is global, false if workspace-specific
     */
    public isServerGlobal(serverName: string): boolean {
        const config = this.mcpServers.get(serverName)
        if (!config) return false

        const globalAgentPath = getGlobalAgentConfigPath(this.features.workspace.fs.getUserHomeDir())
        return config.__configPath__ === globalAgentPath
    }

    public setToolNameMapping(mapping: Map<string, { serverName: string; toolName: string }>): void {
        this.toolNameMapping = new Map(mapping)
    }
}
