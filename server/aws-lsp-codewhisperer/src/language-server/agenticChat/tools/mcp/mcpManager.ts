/*!
 * Copyright Amazon.com, Inc. or its affiliates.
 * All Rights Reserved. SPDX-License-Identifier: Apache-2.0
 */

import type { Features } from '@aws/language-server-runtimes/server-interface/server'
import { ChatTelemetryEventName } from '../../../../shared/telemetry/types'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import {
    StreamableHTTPClientTransport,
    StreamableHTTPClientTransportOptions,
} from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { SSEClientTransport, SSEClientTransportOptions } from '@modelcontextprotocol/sdk/client/sse.js'
import {
    MCPServerConfig,
    McpToolDefinition,
    ListToolsResponse,
    McpServerRuntimeState,
    McpServerStatus,
    McpPermissionType,
    MCPServerPermission,
    AgentConfig,
    isMCPServerConfig,
    isRegistryServerConfig,
} from './mcpTypes'
import {
    isEmptyEnv,
    loadAgentConfig,
    saveAgentConfig,
    saveServerSpecificAgentConfig,
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
import { ProfileStatusMonitor } from './profileStatusMonitor'
import { OAuthClient } from './mcpOauthClient'
import { AgentPermissionManager } from './agentPermissionManager'
import { McpRegistryService } from './mcpRegistryService'
import { McpRegistryData } from './mcpTypes'

export const MCP_SERVER_STATUS_CHANGED = 'mcpServerStatusChanged'
export const AGENT_TOOLS_CHANGED = 'agentToolsChanged'
export enum AuthIntent {
    Interactive = 'interactive',
    Silent = 'silent',
}

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
    private permissionManager!: AgentPermissionManager
    private registryService?: McpRegistryService
    private currentRegistry: McpRegistryData | null = null

    private constructor(
        private agentPaths: string[],
        private features: Pick<
            Features,
            'logging' | 'workspace' | 'lsp' | 'telemetry' | 'credentialsProvider' | 'runtime' | 'agent'
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
        features: Pick<
            Features,
            'logging' | 'workspace' | 'lsp' | 'telemetry' | 'credentialsProvider' | 'runtime' | 'agent'
        >,
        options?: { registryUrl?: string }
    ): Promise<McpManager> {
        if (!McpManager.#instance) {
            const mgr = new McpManager(agentPaths, features)
            McpManager.#instance = mgr

            // Initialize registry service if URL provided
            if (options?.registryUrl) {
                try {
                    mgr.registryService = new McpRegistryService(features.logging)
                    const registry = await mgr.registryService.fetchRegistry(options.registryUrl)
                    if (registry) {
                        mgr.currentRegistry = registry
                        features.logging.info(
                            `MCP Registry: Initialized with ${registry.servers.length} servers from ${options.registryUrl}`
                        )
                    } else {
                        features.logging.error(
                            'MCP Registry: Failed to fetch registry during initialization - MCP functionality disabled'
                        )
                    }
                } catch (error) {
                    const errorMsg = error instanceof Error ? error.message : String(error)
                    features.logging.error(`MCP Registry: Error during initialization: ${errorMsg}`)
                }
            }

            const shouldDiscoverServers = ProfileStatusMonitor.getMcpState()

            if (shouldDiscoverServers) {
                await mgr.discoverAllServers()
                features.logging.info(`MCP: discovered ${mgr.mcpTools.length} tools across all servers`)
            } else {
                features.logging.info('MCP: initialized without server discovery')
            }

            // Emit MCP configuration metrics
            const serverConfigs = mgr.getAllServerConfigs()
            const activeServers = Array.from(serverConfigs.entries()).filter(([name, _]) => !mgr.isServerDisabled(name))

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
        // Load agent config with registry support
        const result = await loadAgentConfig(
            this.features.workspace,
            this.features.logging,
            this.agentPaths,
            this.currentRegistry
        )

        // Extract agent config and other data
        this.agentConfig = result.agentConfig
        this.permissionManager = new AgentPermissionManager(
            this.agentConfig,
            (serverName: string) => this.getAvailableToolsForServer(serverName),
            () => this.getAllAvailableServerNames(),
            () => this.getAllBuiltinToolNames()
        )
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
        // Create init state
        for (const [sanitizedName, _] of this.mcpServers.entries()) {
            // Set server status to UNINITIALIZED initially
            this.setState(sanitizedName, McpServerStatus.UNINITIALIZED, 0)
        }
        // Get all servers that need to be initialized
        const serversToInit: Array<[string, MCPServerConfig]> = []

        for (const [name, cfg] of this.mcpServers.entries()) {
            if (this.isServerDisabled(name)) {
                this.features.logging.info(`MCP: server '${name}' is disabled by persona settings, skipping`)
                this.setState(name, McpServerStatus.DISABLED, 0)
                this.emitToolsChanged(name)
                continue
            }
            if (!isMCPServerConfig(cfg)) {
                this.features.logging.warn(`MCP: server '${name}' has invalid config, skipping`)
                continue
            }
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
                const batchPromises = batch.map(([name, cfg]) => this.initOneServer(name, cfg, AuthIntent.Silent))

                this.features.logging.debug(
                    `MCP: initializing batch of ${batch.length} servers (${i + 1}-${Math.min(i + MAX_CONCURRENT_SERVERS, totalServers)} of ${totalServers})`
                )
                await Promise.all(batchPromises)
            }

            this.features.logging.info(`MCP: completed initialization of ${totalServers} servers`)
        } else {
            // Emit event to refresh MCP list page when no servers are configured
            this.setState('no-servers', McpServerStatus.UNINITIALIZED, 0)
        }

        for (const [sanitizedName, _] of this.mcpServers.entries()) {
            const name = this.serverNameMapping.get(sanitizedName) || sanitizedName
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
                // get allTools of this server, if it's not in tools --> it's denied
                // have to move the logic after all servers finish init, because that's when we have list of tools
                const deniedTools = new Set(
                    this.getAllTools()
                        .filter(tool => tool.serverName === name)
                        .map(tool => tool.toolName)
                )
                this.agentConfig.tools.forEach(tool => {
                    if (tool.startsWith(serverPrefix + '/')) {
                        // remove this from deniedTools
                        const toolName = tool.substring(serverPrefix.length + 1)
                        deniedTools.delete(toolName)
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

                // update permission to deny for rest of the tools
                deniedTools.forEach(tool => {
                    toolPerms[tool] = McpPermissionType.deny
                })
            }

            this.mcpServerPermissions.set(sanitizedName, {
                enabled: true,
                toolPerms,
            })
        }
    }

    /**
     * Start a server process, connect client, and register its tools.
     * Errors are logged but do not stop discovery of other servers.
     */
    private async initOneServer(
        serverName: string,
        cfg: MCPServerConfig,
        authIntent: AuthIntent = AuthIntent.Silent
    ): Promise<void> {
        const DEFAULT_SERVER_INIT_TIMEOUT_MS = 120_000
        this.setState(serverName, McpServerStatus.INITIALIZING, 0)

        try {
            this.features.logging.debug(`MCP: initializing server [${serverName}]`)

            const client = new Client({
                name: `q-chat-plugin`, // Do not use server name in the client name to avoid polluting builder-mcp metrics
                version: '1.0.0',
            })

            let transport: any
            const isStdio = !!cfg.command
            const doConnect = async () => {
                if (isStdio) {
                    // stdio transport
                    const mergedEnv = {
                        ...(process.env as Record<string, string>),
                        // Make sure we do not have empty key and value in mergedEnv, or adding server through UI will fail on Windows
                        ...(cfg.env && !isEmptyEnv(cfg.env)
                            ? Object.fromEntries(Object.entries(cfg.env).filter(([k, v]) => k.trim() && v.trim()))
                            : {}),
                    }
                    let cwd: string | undefined
                    try {
                        const folders = this.features.workspace.getAllWorkspaceFolders()
                        if (folders.length > 0) cwd = URI.parse(folders[0].uri).fsPath
                    } catch {
                        this.features.logging.debug(
                            `MCP: no workspace folder for [${serverName}], continuing without cwd`
                        )
                    }
                    transport = new StdioClientTransport({
                        command: cfg.command!,
                        args: cfg.args ?? [],
                        env: mergedEnv,
                        cwd,
                    })
                    this.features.logging.info(`MCP: Connecting MCP server using StdioClientTransport`)
                    try {
                        await client.connect(transport)
                    } catch (err: any) {
                        let errorMessage = err?.message ?? String(err)
                        if (err?.code === 'ENOENT') {
                            errorMessage = `Command '${cfg.command}' not found. Please ensure it's installed and on your PATH.`
                        } else if (err?.code === 'EINVAL') {
                            errorMessage = `Invalid arguments for command '${cfg.command}'.`
                        } else if (err?.code === -32000) {
                            errorMessage = `MCP protocol error. The server may not be properly configured.`
                        }
                        throw new AgenticChatError(
                            `MCP: server '${serverName}' failed to connect: ${errorMessage}`,
                            'MCPServerConnectionFailed'
                        )
                    }
                } else {
                    // streamable http/SSE transport
                    const base = new URL(cfg.url!)
                    try {
                        // Use HEAD to check if it needs OAuth
                        let headers: Record<string, string> = { ...(cfg.headers ?? {}) }
                        let needsOAuth = false
                        try {
                            const headResp = await fetch(base, { method: 'HEAD', headers })
                            const www = headResp.headers.get('www-authenticate') || ''
                            needsOAuth = headResp.status === 401 || headResp.status === 403 || /bearer/i.test(www)
                        } catch {
                            this.features.logging.info(`MCP: HEAD not available`)
                        }

                        if (needsOAuth) {
                            OAuthClient.initialize(this.features.workspace, this.features.logging, this.features.lsp)
                            try {
                                const bearer = await OAuthClient.getValidAccessToken(base, {
                                    interactive: authIntent === AuthIntent.Interactive,
                                })
                                if (bearer) {
                                    headers = { ...headers, Authorization: `Bearer ${bearer}` }
                                } else if (authIntent === AuthIntent.Silent) {
                                    throw new AgenticChatError(
                                        `Server '${serverName}' requires OAuth. Click on Save to reauthenticate.`,
                                        'MCPServerAuthFailed'
                                    )
                                }
                            } catch (e: any) {
                                const msg = e?.message || ''
                                const short = /authorization_timed_out/i.test(msg)
                                    ? 'Sign-in timed out. Please try again.'
                                    : /Authorization error|PKCE|access_denied|login|consent|token exchange failed/i.test(
                                            msg
                                        )
                                      ? 'Sign-in was cancelled or failed. Please try again.'
                                      : `OAuth failed: ${msg}`

                                throw new AgenticChatError(`MCP: ${short}`, 'MCPServerAuthFailed')
                            }
                        }

                        try {
                            // try streamable http first
                            transport = new StreamableHTTPClientTransport(base, this.buildHttpOpts(headers))

                            this.features.logging.info(`MCP: Connecting MCP server using StreamableHTTPClientTransport`)
                            await client.connect(transport)
                        } catch (err) {
                            // fallback to SSE
                            this.features.logging.info(
                                `MCP: streamable http connect failed for [${serverName}], fallback to SSEClientTransport: ${String(err)}`
                            )
                            transport = new SSEClientTransport(new URL(cfg.url!), this.buildSseOpts(headers))
                            await client.connect(transport)
                        }
                    } catch (err: any) {
                        let errorMessage = err?.message ?? String(err)
                        const oauthHint = /oauth/i.test(errorMessage) ? ' (OAuth)' : ''
                        throw new AgenticChatError(
                            `MCP: server '${serverName}' failed to connect${oauthHint}: ${errorMessage}`,
                            'MCPServerConnectionFailed'
                        )
                    }
                }
            }

            const connectPromise = doConnect()

            const timeoutMs =
                cfg.initializationTimeout === 0 || cfg.initializationTimeout === undefined
                    ? 0
                    : (cfg.initializationTimeout ?? DEFAULT_SERVER_INIT_TIMEOUT_MS)

            if (timeoutMs > 0) {
                await Promise.race([
                    connectPromise,
                    new Promise<never>((_, reject) => {
                        const t = setTimeout(
                            () =>
                                reject(
                                    new AgenticChatError(
                                        `MCP: server '${serverName}' initialization timed out after ${timeoutMs} ms`,
                                        'MCPServerInitTimeout'
                                    )
                                ),
                            timeoutMs
                        )
                        t.unref()
                    }),
                ])
            } else {
                await connectPromise
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
     * Update server map
     */
    public updateServerMap(newMap: Map<string, MCPServerConfig>): void {
        this.mcpServers = new Map(newMap)
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
        // built-in tools cannot be disabled
        if (server === 'builtIn') {
            return false
        }

        // Get unsanitized server name for prefix
        const unsanitizedServerName = this.serverNameMapping.get(server) || server
        return !this.permissionManager.isToolEnabled(server === 'builtIn' ? 'builtIn' : unsanitizedServerName, tool)
    }

    /**
     * Returns true if the given server is currently disabled.
     */
    public isServerDisabled(name: string): boolean {
        const cfg = this.mcpServers.get(name)
        return cfg?.disabled ?? false
    }

    /**
     * Returns tool permission type for a given tool.
     */
    public getToolPerm(server: string, tool: string): McpPermissionType {
        const unsanitizedServerName = this.serverNameMapping.get(server) || server
        return this.permissionManager.getToolPermission(server === 'builtIn' ? 'builtIn' : unsanitizedServerName, tool)
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
        isLegacyMcpServer: boolean = false
    ): Promise<void> {
        try {
            const sanitizedName = sanitizeName(serverName)
            if (
                this.mcpServers.has(sanitizedName) &&
                this.getServerState(sanitizedName)?.status == McpServerStatus.ENABLED
            ) {
                throw new Error(`MCP: server '${sanitizedName}' already exists`)
            }

            if (isLegacyMcpServer) {
                // Handle legacy MCP config file
                await this.mutateConfigFile(configPath, (json: any) => {
                    if (!json.mcpServers) {
                        json.mcpServers = {}
                    }
                    json.mcpServers[serverName] = {
                        command: cfg.command,
                        url: cfg.url,
                        args: cfg.args,
                        env: cfg.env,
                        headers: cfg.headers,
                        timeout: cfg.timeout,
                        initializationTimeout: cfg.initializationTimeout,
                        disabled: cfg.disabled ?? false,
                    }
                })

                // Move tool permissions to corresponding agent path
                const agentPath = configPath.replace(
                    path.sep + 'mcp.json',
                    path.sep + 'agents' + path.sep + 'default.json'
                )

                const serverPrefix = `@${serverName}`
                let serverTools = this.agentConfig.tools.filter(
                    tool => tool === serverPrefix || tool.startsWith(`${serverPrefix}/`)
                )
                if (serverTools.length === 0) {
                    serverTools = [serverPrefix]
                }
                let serverAllowedTools = this.agentConfig.allowedTools.filter(
                    tool => tool === serverPrefix || tool.startsWith(`${serverPrefix}/`)
                )

                // Push to agent config after setup
                this.agentConfig.tools.push(...serverTools.filter(tool => !this.agentConfig.tools.includes(tool)))
                this.agentConfig.allowedTools.push(
                    ...serverAllowedTools.filter(tool => !this.agentConfig.allowedTools.includes(tool))
                )

                await saveServerSpecificAgentConfig(
                    this.features.workspace,
                    this.features.logging,
                    serverName,
                    null,
                    serverTools,
                    serverAllowedTools,
                    agentPath,
                    true
                )
            } else {
                // Add server to agent config
                const serverConfig: MCPServerConfig = {
                    command: cfg.command,
                    url: cfg.url,
                    initializationTimeout: cfg.initializationTimeout,
                    disabled: cfg.disabled ?? false,
                }
                // Only add timeout to agent config if it's not 0
                if (cfg.timeout !== undefined) {
                    serverConfig.timeout = cfg.timeout
                }
                if (cfg.args && cfg.args.length > 0) {
                    serverConfig.args = cfg.args
                }
                if (cfg.env && !isEmptyEnv(cfg.env)) {
                    serverConfig.env = cfg.env
                }
                if (cfg.headers && !isEmptyEnv(cfg.headers)) {
                    serverConfig.headers = cfg.headers
                }

                // Add to agent config
                this.agentConfig.mcpServers[serverName] = serverConfig

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

                // Save server-specific changes to agent config
                const serverTools = this.agentConfig.tools.filter(
                    tool => tool === serverPrefix || tool.startsWith(`${serverPrefix}/`)
                )
                const serverAllowedTools = this.agentConfig.allowedTools.filter(
                    tool => tool === serverPrefix || tool.startsWith(`${serverPrefix}/`)
                )

                await saveServerSpecificAgentConfig(
                    this.features.workspace,
                    this.features.logging,
                    serverName,
                    serverConfig,
                    serverTools,
                    serverAllowedTools,
                    configPath
                )
            }

            const newCfg: MCPServerConfig = { ...cfg, __configPath__: configPath }
            this.mcpServers.set(sanitizedName, newCfg)
            this.serverNameMapping.set(sanitizedName, serverName)

            // Add server tools to tools list after initialization
            await this.initOneServer(sanitizedName, newCfg, AuthIntent.Interactive)
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

        // Check if this is a legacy MCP server (from MCP config file)
        const isLegacyMcpServer = cfg.__configPath__?.endsWith('mcp.json')
        let agentPath: string | undefined

        if (isLegacyMcpServer && unsanitizedName) {
            // Remove from MCP config file
            await this.mutateConfigFile(cfg.__configPath__, (json: any) => {
                if (json.mcpServers && json.mcpServers[unsanitizedName]) {
                    delete json.mcpServers[unsanitizedName]
                }
            })

            agentPath = cfg.__configPath__.replace(
                path.sep + 'mcp.json',
                path.sep + 'agents' + path.sep + 'default.json'
            )
        }

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

            // Save server removal to agent config
            await saveServerSpecificAgentConfig(
                this.features.workspace,
                this.features.logging,
                unsanitizedName,
                null, // null indicates server should be removed
                [],
                [],
                isLegacyMcpServer ? agentPath! : cfg.__configPath__,
                isLegacyMcpServer
            )
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
                const existingConfig = this.agentConfig.mcpServers[unsanitizedServerName]
                const updatedConfig = { ...(isMCPServerConfig(existingConfig) ? existingConfig : {}) }
                if (configUpdates.url !== undefined) updatedConfig.url = configUpdates.url
                if (configUpdates.headers !== undefined) {
                    if (configUpdates.headers && Object.keys(configUpdates.headers).length) {
                        updatedConfig.headers = configUpdates.headers
                    } else {
                        delete updatedConfig.headers // allow user to clear headers
                    }
                }
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
                if (configUpdates.disabled !== undefined) {
                    updatedConfig.disabled = configUpdates.disabled
                }
                this.agentConfig.mcpServers[unsanitizedServerName] = updatedConfig

                // Save server-specific changes to agent config
                const serverPrefix = `@${unsanitizedServerName}`
                const serverTools = this.agentConfig.tools.filter(
                    tool => tool === serverPrefix || tool.startsWith(`${serverPrefix}/`)
                )
                const serverAllowedTools = this.agentConfig.allowedTools.filter(
                    tool => tool === serverPrefix || tool.startsWith(`${serverPrefix}/`)
                )

                await saveServerSpecificAgentConfig(
                    this.features.workspace,
                    this.features.logging,
                    unsanitizedServerName,
                    updatedConfig,
                    serverTools,
                    serverAllowedTools,
                    agentPath
                )
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

            if (this.isServerDisabled(serverName)) {
                this.setState(serverName, McpServerStatus.DISABLED, 0)
                this.emitToolsChanged(serverName)
            } else {
                await this.initOneServer(serverName, newCfg, AuthIntent.Interactive)
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
        this.agentConfig = {
            name: 'q_ide_default',
            description: 'Agent configuration',
            mcpServers: {},
            tools: [],
            allowedTools: [],
            toolsSettings: {},
            resources: [],
            useLegacyMcpJson: true,
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

            const shouldDiscoverServers = ProfileStatusMonitor.getMcpState()

            if (shouldDiscoverServers) {
                await this.discoverAllServers()
            }

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
            const serverConfig = this.mcpServers.get(serverName)
            if (!serverConfig) {
                throw new Error(`Server '${serverName}' not found`)
            }

            const serverPrefix = `@${unsanitizedServerName}`

            // Check if this is a legacy MCP server (from MCP config file)
            const isLegacyMcpServer = serverConfig.__configPath__?.endsWith('mcp.json')

            // For agent config servers, use the permission manager
            for (const [toolName, permission] of Object.entries(perm.toolPerms || {})) {
                this.permissionManager.setToolPermission(unsanitizedServerName, toolName, permission)
            }

            // Update the agent config from the permission manager
            this.agentConfig = this.permissionManager.getAgentConfig()

            if (isLegacyMcpServer) {
                // For legacy MCP servers, save permissions to agent config file and update MCP config for enable/disable
                const mcpConfigPath = serverConfig.__configPath__!
                const agentPath = mcpConfigPath.replace(
                    path.sep + 'mcp.json',
                    path.sep + 'agents' + path.sep + 'default.json'
                )

                // Update MCP config for enable/disable
                await this.mutateConfigFile(mcpConfigPath, (json: any) => {
                    if (!json.mcpServers[unsanitizedServerName]) {
                        json.mcpServers[unsanitizedServerName] = { ...serverConfig }
                        delete json.mcpServers[unsanitizedServerName].__configPath__
                    }
                    json.mcpServers[unsanitizedServerName].disabled = !perm.enabled
                })

                // Use the same function but with corrected agent path
                const serverPrefix = `@${unsanitizedServerName}`
                const serverTools = this.agentConfig.tools.filter(
                    tool => tool === serverPrefix || tool.startsWith(`${serverPrefix}/`)
                )
                const serverAllowedTools = this.agentConfig.allowedTools.filter(
                    tool => tool === serverPrefix || tool.startsWith(`${serverPrefix}/`)
                )

                await saveServerSpecificAgentConfig(
                    this.features.workspace,
                    this.features.logging,
                    unsanitizedServerName,
                    null, // Don't save server config to agent file for legacy servers
                    serverTools,
                    serverAllowedTools,
                    agentPath,
                    isLegacyMcpServer
                )
            }

            // Update mcpServerPermissions map immediately to reflect changes
            this.mcpServerPermissions.set(serverName, {
                enabled: perm.enabled,
                toolPerms: perm.toolPerms || {},
            })

            // Update server enabled/disabled state (only for non-legacy servers)
            if (!isLegacyMcpServer) {
                const serverCfg = this.agentConfig.mcpServers[unsanitizedServerName]
                if (serverCfg && isMCPServerConfig(serverCfg)) {
                    serverCfg.disabled = !perm.enabled
                }
            }

            // Always update the mcpServers map
            if (serverConfig) {
                serverConfig.disabled = !perm.enabled
            }

            // Save only server-specific changes to agent config (for non-legacy servers)
            if (!isLegacyMcpServer) {
                const agentPath = perm.__configPath__
                if (agentPath) {
                    // Collect server-specific tools and allowedTools
                    const serverPrefix = `@${unsanitizedServerName}`
                    const serverTools = this.agentConfig.tools.filter(
                        tool => tool === serverPrefix || tool.startsWith(`${serverPrefix}/`)
                    )
                    const serverAllowedTools = this.agentConfig.allowedTools.filter(
                        tool => tool === serverPrefix || tool.startsWith(`${serverPrefix}/`)
                    )

                    const serverCfg = this.agentConfig.mcpServers[unsanitizedServerName]
                    await saveServerSpecificAgentConfig(
                        this.features.workspace,
                        this.features.logging,
                        unsanitizedServerName,
                        isMCPServerConfig(serverCfg) ? serverCfg : null,
                        serverTools,
                        serverAllowedTools,
                        agentPath
                    )
                }
            }

            // enable/disable server
            if (this.isServerDisabled(serverName)) {
                const client = this.clients.get(serverName)
                if (client) {
                    await client.close()
                    this.clients.delete(serverName)
                }
                this.setState(serverName, McpServerStatus.DISABLED, 0)
            } else {
                if (!this.clients.has(serverName) && serverName !== 'Built-in') {
                    await this.initOneServer(serverName, this.mcpServers.get(serverName)!, AuthIntent.Silent)
                }
            }

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
        if (server === 'builtIn') {
            return !this.agentConfig.allowedTools.includes(tool)
        }

        // Get unsanitized server name for prefix
        const unsanitizedServerName = this.serverNameMapping.get(server) || server
        const toolId = `@${unsanitizedServerName}/${tool}`
        return !this.agentConfig.allowedTools.includes(toolId)
    }

    /**
     * Get available tools for a specific server
     */
    private getAvailableToolsForServer(serverName: string): string[] {
        return this.mcpTools.filter(tool => tool.serverName === serverName).map(tool => tool.toolName)
    }

    /**
     * Get all available server names
     */
    private getAllAvailableServerNames(): string[] {
        const serverNames = new Set<string>()
        for (const tool of this.mcpTools) {
            serverNames.add(tool.serverName)
        }
        return Array.from(serverNames)
    }

    /**
     * Get all builtin tool names
     */
    private getAllBuiltinToolNames(): string[] {
        return this.features.agent?.getBuiltInToolNames() || []
    }

    /**
     * get server's tool permission
     */
    public getMcpServerPermissions(serverName: string): MCPServerPermission | undefined {
        return this.mcpServerPermissions.get(serverName)
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
            const sanitized = sanitizeName(serverName)
            const cfg = this.mcpServers.get(sanitized)
            if (!cfg || !cfg.__configPath__) {
                this.features.logging.warn(
                    `Cannot remove config for server '${serverName}': Config not found or missing path`
                )
                return
            }

            const unsanitizedName = this.serverNameMapping.get(sanitized) || serverName

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

                // Save server removal to agent config
                await saveServerSpecificAgentConfig(
                    this.features.workspace,
                    this.features.logging,
                    unsanitizedName,
                    null, // null indicates server should be removed
                    [],
                    [],
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
        const globalMcpPath = getGlobalMcpConfigPath(this.features.workspace.fs.getUserHomeDir())
        return config.__configPath__ === globalAgentPath || config.__configPath__ === globalMcpPath
    }

    public setToolNameMapping(mapping: Map<string, { serverName: string; toolName: string }>): void {
        this.toolNameMapping = new Map(mapping)
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

        const isBenignSseDisconnect =
            /SSE error:\s*TypeError:\s*terminated:\s*Body Timeout Error/i.test(msg) ||
            /TypeError:\s*terminated:\s*Body Timeout Error/i.test(msg) ||
            /TypeError:\s*terminated:\s*other side closed/i.test(msg) ||
            /ECONNRESET|ENETRESET|EPIPE/i.test(msg)

        if (isBenignSseDisconnect) {
            this.features.logging.debug(`MCP SSE idle timeout${server ? ` [${server}]` : ''}: ${msg}`)
        } else {
            // default path for real errors
            this.features.logging.error(`MCP ERROR${server ? ` [${server}]` : ''}: ${msg}`)
            if (server) {
                this.setState(server, McpServerStatus.FAILED, 0, msg)
                this.emitToolsChanged(server)
            }
        }
    }

    /**
     * Ensure the server-specific config is internally consistent.
     * Mutates `cfg` in-place, trimming fields that don't belong to the selected transport.
     * @private
     */
    private validateServerCfg(cfg: MCPServerConfig): void {
        const hasCmd = !!cfg.command?.trim()
        const hasUrl = !!cfg.url?.trim()

        if (hasCmd && hasUrl) throw new Error('Specify either command or url, not both')
        if (!hasCmd && !hasUrl) throw new Error('Either command or url is required')

        if (hasCmd) {
            if (!cfg.command!.trim()) throw new Error('Stdio transport requires "command"')
            delete cfg.url
            delete cfg.headers
        } else {
            if (!cfg.url!.trim()) throw new Error('HTTP transport requires "url"')
            delete cfg.command
            delete cfg.args
            delete cfg.env
        }
    }

    /**
     * Creates the option bag for SSEClientTransport
     * @private
     */
    private buildSseOpts(headers?: Record<string, string>): SSEClientTransportOptions | undefined {
        if (!headers || Object.keys(headers).length === 0) {
            return
        }
        const requestInit: RequestInit = { headers }

        // override only the SSE‐GET:
        const eventSourceInit = {
            fetch: (input: RequestInfo | URL | string, init: RequestInit = {}) => {
                const merged = new Headers(init.headers || {})
                for (const [k, v] of Object.entries(headers)) {
                    merged.set(k, v)
                }
                return fetch(input, {
                    ...init,
                    headers: merged,
                })
            },
        } as any

        return { requestInit, eventSourceInit }
    }

    /**
     * Creates the option bag for StreamableHTTPClientTransport
     * @private
     */
    private buildHttpOpts(headers?: Record<string, string>): StreamableHTTPClientTransportOptions | undefined {
        if (!headers || Object.keys(headers).length === 0) {
            return
        }
        return { requestInit: { headers } }
    }

    /**
     * Update registry URL and refetch registry
     */
    public async updateRegistryUrl(registryUrl: string): Promise<void> {
        if (!this.registryService) {
            this.registryService = new McpRegistryService(this.features.logging)
        }

        const registry = await this.registryService.fetchRegistry(registryUrl)
        if (registry) {
            this.currentRegistry = registry
            this.features.logging.info(`MCP Registry: Updated registry with ${registry.servers.length} servers`)
            await this.syncWithRegistry()
        } else {
            this.features.logging.error('MCP Registry: Failed to fetch updated registry - MCP functionality disabled')
            this.currentRegistry = null
        }
    }

    /**
     * Synchronize client configurations with registry updates
     */
    private async syncWithRegistry(): Promise<void> {
        if (!this.currentRegistry) {
            this.features.logging.debug('MCP Registry: No active registry for synchronization')
            return
        }

        this.features.logging.info('MCP Registry: Starting registry synchronization')
        const registryServerNames = new Set(this.currentRegistry.servers.map(s => s.name))
        const configuredServers = Array.from(this.mcpServers.entries())
        let serversDisabled = 0
        let versionsUpdated = 0

        for (const [sanitizedName, config] of configuredServers) {
            const unsanitizedName = this.serverNameMapping.get(sanitizedName) || sanitizedName
            const agentConfig = this.agentConfig.mcpServers[unsanitizedName]

            // Skip non-registry servers
            if (!agentConfig || !isRegistryServerConfig(agentConfig)) {
                continue
            }

            // Check if server still exists in registry
            if (!registryServerNames.has(unsanitizedName)) {
                this.features.logging.warn(
                    `MCP Registry: Server '${unsanitizedName}' removed from registry - disabling`
                )
                await this.disableRemovedServer(sanitizedName, unsanitizedName)
                serversDisabled++
                continue
            }

            // Check version mismatch for local servers
            const registryServer = this.currentRegistry.servers.find(s => s.name === unsanitizedName)
            if (registryServer && registryServer.packages) {
                const updated = await this.checkAndUpdateVersion(sanitizedName, unsanitizedName, registryServer, config)
                if (updated) versionsUpdated++
            }
        }

        this.features.logging.info(
            `MCP Registry: Synchronization complete - ${serversDisabled} servers disabled, ${versionsUpdated} versions updated`
        )
    }

    /**
     * Disable server that was removed from registry
     */
    private async disableRemovedServer(sanitizedName: string, unsanitizedName: string): Promise<void> {
        try {
            // Terminate server process if running
            const client = this.clients.get(sanitizedName)
            if (client) {
                await client.close()
                this.clients.delete(sanitizedName)
                this.features.logging.info(`MCP Registry: Terminated server process for '${unsanitizedName}'`)
            }

            // Remove tools
            const toolCount = this.mcpTools.filter(t => t.serverName === sanitizedName).length
            this.mcpTools = this.mcpTools.filter(t => t.serverName !== sanitizedName)
            if (toolCount > 0) {
                this.features.logging.info(`MCP Registry: Removed ${toolCount} tools from server '${unsanitizedName}'`)
            }

            // Mark as disabled in config (preserve entry)
            const config = this.mcpServers.get(sanitizedName)
            if (config) {
                config.disabled = true
            }

            this.setState(sanitizedName, McpServerStatus.DISABLED, 0, 'Server removed from registry')
            this.emitToolsChanged(sanitizedName)
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error)
            this.features.logging.error(`MCP Registry: Error disabling server '${unsanitizedName}': ${errorMsg}`)
        }
    }

    /**
     * Check version and reinstall if needed
     */
    private async checkAndUpdateVersion(
        sanitizedName: string,
        unsanitizedName: string,
        registryServer: any,
        currentConfig: MCPServerConfig
    ): Promise<boolean> {
        if (!isMCPServerConfig(currentConfig)) {
            return false
        }

        // Extract version from current command/args
        const currentVersion = this.extractVersionFromConfig(currentConfig)
        const registryVersion = registryServer.version

        if (currentVersion && currentVersion !== registryVersion) {
            this.features.logging.warn(
                `MCP Registry: Server '${unsanitizedName}' version mismatch: current=${currentVersion}, registry=${registryVersion} - reinstalling`
            )
            try {
                await this.reinstallServer(sanitizedName, unsanitizedName, registryServer)
                return true
            } catch (error) {
                const errorMsg = error instanceof Error ? error.message : String(error)
                this.features.logging.error(
                    `MCP Registry: Failed to reinstall server '${unsanitizedName}': ${errorMsg}`
                )
                return false
            }
        }
        return false
    }

    /**
     * Extract version from server config
     */
    private extractVersionFromConfig(config: MCPServerConfig): string | null {
        if (!config.command) {
            return null
        }

        // Check args for version (e.g., package@version)
        const args = config.args || []
        for (const arg of args) {
            const match = arg.match(/@([\d.]+(?:-[\w.]+)?)$/)
            if (match) {
                return match[1]
            }
        }

        // Check command itself
        const cmdMatch = config.command.match(/@([\d.]+(?:-[\w.]+)?)$/)
        if (cmdMatch) {
            return cmdMatch[1]
        }

        return null
    }

    /**
     * Reinstall server with new version
     */
    private async reinstallServer(sanitizedName: string, unsanitizedName: string, registryServer: any): Promise<void> {
        this.features.logging.info(
            `MCP Registry: Reinstalling server '${unsanitizedName}' with version ${registryServer.version}`
        )

        try {
            // Terminate existing server
            const client = this.clients.get(sanitizedName)
            if (client) {
                await client.close()
                this.clients.delete(sanitizedName)
            }

            // Remove old tools
            this.mcpTools = this.mcpTools.filter(t => t.serverName !== sanitizedName)

            // Convert registry server to config
            const converter = new (await import('./mcpServerConfigConverter')).McpServerConfigConverter()
            const newConfig = converter.convertRegistryServer(registryServer)

            // Update config
            this.mcpServers.set(sanitizedName, newConfig)

            // Reinitialize server
            await this.initOneServer(sanitizedName, newConfig, AuthIntent.Silent)
            this.features.logging.info(`MCP Registry: Successfully reinstalled server '${unsanitizedName}'`)
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error)
            this.features.logging.error(`MCP Registry: Failed to reinstall server '${unsanitizedName}': ${errorMsg}`)
            throw error
        }
    }
}
