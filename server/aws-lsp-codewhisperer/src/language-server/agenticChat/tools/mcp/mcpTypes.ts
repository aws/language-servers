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

export interface PersonaConfig {
    mcpServers: string[] // list of enabled servers, wildcard "*" allowed
    toolPerms?: Record<string, Record<string, McpPermissionType>> // server → tool → perm, wildcard "*" allowed
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
