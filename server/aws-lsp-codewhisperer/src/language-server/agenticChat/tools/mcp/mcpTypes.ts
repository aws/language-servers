/*!
 * Copyright Amazon.com, Inc. or its affiliates.
 * All Rights Reserved. SPDX-License-Identifier: Apache-2.0
 */

export enum McpServerStatus {
    INITIALIZING = 'INITIALIZING',
    ENABLED = 'ENABLED',
    FAILED = 'FAILED',
    DISABLED = 'DISABLED',
    UNINITIALIZED = 'UNINITIALIZED',
}
export enum McpPermissionType {
    alwaysAllow = 'alwaysAllow',
    ask = 'ask',
    deny = 'deny',
}
export interface McpServerRuntimeState {
    status: McpServerStatus
    toolsCount: number
    lastError?: string
}
export interface McpToolDefinition {
    serverName: string
    toolName: string
    description: string
    inputSchema: any
}

export interface MCPServerConfig {
    command: string
    args?: string[]
    env?: Record<string, string>
    initializationTimeout?: number
    timeout?: number
    __configPath__?: string
}
export interface MCPServerPermission {
    enabled: boolean
    toolPerms: Record<string, McpPermissionType>
    __configPath__?: string
}

export interface AgentConfig {
    name: string // Required: Agent name
    version: string // Required: Agent version (semver)
    description: string // Required: Agent description
    model?: string // Optional: Model that backs the agent
    tags?: string[] // Optional: Tags for categorization
    inputSchema?: any // Optional: Schema for agent inputs
    mcpServers: Record<string, MCPServerConfig> // Map of server name to server config
    tools: string[] // List of enabled tools
    allowedTools: string[] // List of tools that don't require approval
    toolsSettings?: Record<string, any> // Tool-specific settings
    includedFiles?: string[] // Files to include in context
    createHooks?: string[] // Hooks to run at conversation start
    promptHooks?: string[] // Hooks to run per prompt
    resources?: string[] // Resources for the agent (prompts, files, etc.)
}

export interface PersonaConfig {
    mcpServers: string[] // list of enabled servers, wildcard "*" allowed
    toolPerms?: Record<string, Record<string, McpPermissionType>> // server → tool → perm, wildcard "*" allowed
}

export class AgentModel {
    constructor(private cfg: AgentConfig) {}

    static fromJson(doc: any): AgentModel {
        const cfg: AgentConfig = {
            name: doc?.['name'] || 'default-agent',
            version: doc?.['version'] || '1.0.0',
            description: doc?.['description'] || 'Default agent configuration',
            model: doc?.['model'],
            tags: Array.isArray(doc?.['tags']) ? doc['tags'] : undefined,
            inputSchema: doc?.['inputSchema'],
            mcpServers: typeof doc?.['mcpServers'] === 'object' ? doc['mcpServers'] : {},
            tools: Array.isArray(doc?.['tools']) ? doc['tools'] : [],
            allowedTools: Array.isArray(doc?.['allowedTools']) ? doc['allowedTools'] : [],
            toolsSettings: typeof doc?.['toolsSettings'] === 'object' ? doc['toolsSettings'] : {},
            includedFiles: Array.isArray(doc?.['includedFiles']) ? doc['includedFiles'] : [],
            createHooks: Array.isArray(doc?.['createHooks']) ? doc['createHooks'] : [],
            promptHooks: Array.isArray(doc?.['promptHooks']) ? doc['promptHooks'] : [],
            resources: Array.isArray(doc?.['resources']) ? doc['resources'] : [],
        }
        return new AgentModel(cfg)
    }

    toJson(): AgentConfig {
        return this.cfg
    }

    addServer(name: string, config: MCPServerConfig): void {
        this.cfg.mcpServers[name] = config
    }

    removeServer(name: string): void {
        delete this.cfg.mcpServers[name]
    }

    addTool(tool: string): void {
        if (!this.cfg.tools.includes(tool)) {
            this.cfg.tools.push(tool)
        }
    }

    removeTool(tool: string): void {
        const idx = this.cfg.tools.indexOf(tool)
        if (idx >= 0) this.cfg.tools.splice(idx, 1)
    }

    allowTool(tool: string): void {
        if (!this.cfg.allowedTools.includes(tool)) {
            this.cfg.allowedTools.push(tool)
        }
    }

    denyTool(tool: string): void {
        const idx = this.cfg.allowedTools.indexOf(tool)
        if (idx >= 0) this.cfg.allowedTools.splice(idx, 1)
    }

    updateToolSettings(tool: string, settings: any): void {
        this.cfg.toolsSettings = this.cfg.toolsSettings || {}
        this.cfg.toolsSettings[tool] = settings
    }
}

export class PersonaModel {
    constructor(private cfg: PersonaConfig) {}

    static fromJson(doc: any): PersonaModel {
        const cfg: PersonaConfig = {
            mcpServers: Array.isArray(doc?.['mcpServers']) ? doc['mcpServers'] : [],
            toolPerms: typeof doc?.['toolPerms'] === 'object' ? doc['toolPerms'] : {},
        }
        return new PersonaModel(cfg)
    }

    toJson(): PersonaConfig {
        return this.cfg
    }

    private hasWildcard(): boolean {
        return this.cfg['mcpServers'].includes('*')
    }

    addServer(name: string): void {
        if (!this.hasWildcard() && !this.cfg['mcpServers'].includes(name)) {
            this.cfg['mcpServers'].push(name)
        }
    }

    removeServer(name: string, knownServers: string[]): void {
        const starIdx = this.cfg.mcpServers.indexOf('*')

        if (starIdx >= 0) {
            this.cfg.mcpServers = Array.from(new Set(knownServers))
        }

        const idx = this.cfg.mcpServers.indexOf(name)
        if (idx >= 0) this.cfg.mcpServers.splice(idx, 1)
        if (this.cfg.toolPerms) delete this.cfg.toolPerms[name]
    }

    replaceToolPerms(server: string, toolPerms: Record<string, McpPermissionType>): void {
        this.cfg['toolPerms'] ||= {}
        this.cfg['toolPerms'][server] = { ...toolPerms }
    }

    /** Ensure a “* : ask” entry exists. */
    ensureWildcardAsk(server: string): void {
        this.cfg['toolPerms'] ||= {}
        const s = (this.cfg['toolPerms'][server] ||= {})
        if (Object.keys(s).length === 0) s['*'] = McpPermissionType.ask
    }
}
export interface ListToolsResponse {
    tools: {
        name?: string
        description?: string
        inputSchema?: object
        [key: string]: any
    }[]
}
