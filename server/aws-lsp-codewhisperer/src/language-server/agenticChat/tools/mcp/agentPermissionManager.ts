/*!
 * Copyright Amazon.com, Inc. or its affiliates.
 * All Rights Reserved. SPDX-License-Identifier: Apache-2.0
 */

import { AgentConfig, McpPermissionType } from './mcpTypes'

/**
 * Manages agent tool permissions with wildcard support for reading and simple patterns for writing
 */
export class AgentPermissionManager {
    constructor(
        private agentConfig: AgentConfig,
        private getAvailableTools?: (serverName: string) => string[],
        private getAllAvailableServers?: () => string[],
        private getAllBuiltinTools?: () => string[]
    ) {}

    /**
     * Check if a tool matches a pattern using glob-style wildcards
     */
    private matchesPattern(toolName: string, pattern: string): boolean {
        // Handle exact matches first
        if (pattern === toolName) return true

        // Convert glob pattern to regex
        // Escape special regex characters except * and ?
        const regexPattern = pattern
            .replace(/[.+^${}()|[\]\\]/g, '\\$&') // Escape regex special chars
            .replace(/\*/g, '.*') // * matches any sequence
            .replace(/\?/g, '.') // ? matches single character

        const regex = new RegExp(`^${regexPattern}$`)
        return regex.test(toolName)
    }

    /**
     * Check if a tool is enabled (in tools array)
     */
    isToolEnabled(serverName: string, toolName: string): boolean {
        const toolId = serverName ? `@${serverName}/${toolName}` : toolName
        const serverPrefix = serverName ? `@${serverName}` : ''

        // Check exact matches first (exact matches take precedence)
        if (this.agentConfig.tools.includes(toolId)) return true
        if (serverPrefix && this.agentConfig.tools.includes(serverPrefix)) return true

        // Check for global wildcard
        if (this.agentConfig.tools.includes('*')) return true

        // Check for @builtin pattern (built-in tools only)
        if (!serverName && this.agentConfig.tools.includes('@builtin')) return true

        // Check wildcard patterns
        for (const tool of this.agentConfig.tools) {
            if (tool.includes('*') || tool.includes('?')) {
                // For server patterns like @*-mcp, match against server prefix
                if (serverName && tool.startsWith('@') && !tool.includes('/')) {
                    if (this.matchesPattern(serverPrefix, tool)) return true
                }
                // For full tool patterns
                if (this.matchesPattern(toolId, tool)) return true
            }
        }

        return false
    }

    /**
     * Check if a tool is always allowed (in allowedTools array)
     */
    isToolAlwaysAllowed(serverName: string, toolName: string): boolean {
        const toolId = serverName ? `@${serverName}/${toolName}` : toolName
        const serverPrefix = serverName ? `@${serverName}` : ''

        // Check exact matches first
        if (this.agentConfig.allowedTools.includes(toolId)) return true
        if (serverPrefix && this.agentConfig.allowedTools.includes(serverPrefix)) return true

        // Check wildcard patterns
        for (const allowedTool of this.agentConfig.allowedTools) {
            if (allowedTool.includes('*') || allowedTool.includes('?')) {
                if (this.matchesPattern(toolId, allowedTool)) return true
            }
        }

        return false
    }

    /**
     * Get permission type for a tool
     */
    getToolPermission(serverName: string, toolName: string): McpPermissionType {
        const toolId = serverName ? `@${serverName}/${toolName}` : toolName
        const serverPrefix = serverName ? `@${serverName}` : ''

        // Check exact matches first (exact matches take precedence over patterns)
        const exactInTools = this.agentConfig.tools.includes(toolId)
        const exactInAllowed = this.agentConfig.allowedTools.includes(toolId)
        const serverInTools = serverPrefix && this.agentConfig.tools.includes(serverPrefix)
        const serverInAllowed = serverPrefix && this.agentConfig.allowedTools.includes(serverPrefix)

        // If exact match in allowedTools or server-wide in allowedTools
        if (exactInAllowed || serverInAllowed) {
            return McpPermissionType.alwaysAllow
        }

        // If exact match in tools, check if also in allowedTools patterns
        if (exactInTools) {
            const isAlwaysAllowed = this.isToolAlwaysAllowed(serverName, toolName)
            return isAlwaysAllowed ? McpPermissionType.alwaysAllow : McpPermissionType.ask
        }

        // If server-wide in tools, check if also in allowedTools patterns
        if (serverInTools) {
            const isAlwaysAllowed = this.isToolAlwaysAllowed(serverName, toolName)
            return isAlwaysAllowed ? McpPermissionType.alwaysAllow : McpPermissionType.ask
        }

        // Fall back to pattern matching
        const isEnabled = this.isToolEnabled(serverName, toolName)
        const isAlwaysAllowed = this.isToolAlwaysAllowed(serverName, toolName)

        // Tool must be enabled first before it can be always allowed
        if (isEnabled && isAlwaysAllowed) {
            return McpPermissionType.alwaysAllow
        }

        if (isEnabled) {
            return McpPermissionType.ask
        }

        return McpPermissionType.deny
    }

    /**
     * Set permission for a tool - removes conflicting wildcards and replaces with explicit tools
     */
    setToolPermission(serverName: string, toolName: string, permission: McpPermissionType): void {
        const toolId = serverName ? `@${serverName}/${toolName}` : toolName
        const serverPrefix = serverName ? `@${serverName}` : ''

        switch (permission) {
            case McpPermissionType.deny:
                this.removeConflictingWildcardsForDeny(serverName, toolName)
                this.removeConflictingAllowedWildcardsForDeny(serverName, toolName)
                break

            case McpPermissionType.ask:
                this.removeConflictingAllowedWildcardsForAsk(serverName, toolName)
                if (!this.isToolEnabled(serverName, toolName)) {
                    this.addTool(toolId)
                }
                break

            case McpPermissionType.alwaysAllow:
                if (!this.isToolEnabled(serverName, toolName)) {
                    this.addTool(toolId)
                }
                if (!this.isToolAlwaysAllowed(serverName, toolName)) {
                    this.addToAllowedTools(toolId)
                }
                break
        }
    }

    /**
     * Add tool to tools array
     */
    private addTool(toolId: string): void {
        if (!this.agentConfig.tools.includes(toolId)) {
            this.agentConfig.tools.push(toolId)
        }
    }

    /**
     * Remove tool from tools array
     */
    private removeTool(toolId: string, serverPrefix?: string): void {
        this.agentConfig.tools = this.agentConfig.tools.filter(tool => tool !== toolId && tool !== serverPrefix)
    }

    /**
     * Add tool to allowedTools array
     */
    private addToAllowedTools(toolId: string): void {
        if (!this.agentConfig.allowedTools.includes(toolId)) {
            this.agentConfig.allowedTools.push(toolId)
        }
    }

    /**
     * Remove tool from allowedTools array (only exact matches)
     */
    private removeFromAllowedTools(toolId: string, serverPrefix?: string): void {
        this.agentConfig.allowedTools = this.agentConfig.allowedTools.filter(
            tool => tool !== toolId && tool !== serverPrefix
        )
    }

    /**
     * Set server-wide permission (uses @serverName pattern)
     */
    setServerPermission(serverName: string, permission: McpPermissionType): void {
        const serverPrefix = `@${serverName}`

        // Remove all specific tools from this server
        this.agentConfig.tools = this.agentConfig.tools.filter(tool => !tool.startsWith(`${serverPrefix}/`))
        this.agentConfig.allowedTools = this.agentConfig.allowedTools.filter(
            tool => !tool.startsWith(`${serverPrefix}/`)
        )

        switch (permission) {
            case McpPermissionType.deny:
                this.removeTool(serverPrefix, serverPrefix)
                this.removeFromAllowedTools(serverPrefix, serverPrefix)
                break

            case McpPermissionType.ask:
                this.addTool(serverPrefix)
                this.removeFromAllowedTools(serverPrefix, serverPrefix)
                break

            case McpPermissionType.alwaysAllow:
                this.addTool(serverPrefix)
                this.addToAllowedTools(serverPrefix)
                break
        }
    }

    /**
     * Convert server-wide permission to individual tools, excluding the denied tool
     */
    private convertServerWideToIndividualTools(serverName: string, deniedToolName: string): void {
        const serverPrefix = `@${serverName}`

        // Remove server-wide permission
        this.agentConfig.tools = this.agentConfig.tools.filter(tool => tool !== serverPrefix)

        // If we have a callback to get available tools, add them individually
        if (this.getAvailableTools) {
            const availableTools = this.getAvailableTools(serverName)
            for (const toolName of availableTools) {
                if (toolName !== deniedToolName) {
                    const toolId = `@${serverName}/${toolName}`
                    this.addTool(toolId)
                }
            }
        }
        // If no callback, we just remove server-wide permission (limitation)
    }

    /**
     * Remove conflicting wildcards from tools when denying a tool
     */
    private removeConflictingWildcardsForDeny(serverName: string, toolName: string): void {
        const toolId = serverName ? `@${serverName}/${toolName}` : toolName
        const serverPrefix = serverName ? `@${serverName}` : ''

        // Handle global wildcard (*)
        if (this.agentConfig.tools.includes('*')) {
            this.expandGlobalWildcard(serverName, toolName)
        }

        // Handle server-wide wildcard (@server)
        if (serverPrefix && this.agentConfig.tools.includes(serverPrefix)) {
            this.convertServerWideToIndividualTools(serverName, toolName)
        }

        // Handle @builtin wildcard
        if (!serverName && this.agentConfig.tools.includes('@builtin')) {
            this.expandBuiltinWildcard(toolName)
        }

        // Handle pattern wildcards
        this.removeMatchingPatternWildcards(serverName, toolName)

        // Remove explicit tool entry
        this.removeTool(toolId, serverPrefix)
    }

    /**
     * Remove conflicting wildcards from allowedTools when denying a tool
     */
    private removeConflictingAllowedWildcardsForDeny(serverName: string, toolName: string): void {
        const toolId = serverName ? `@${serverName}/${toolName}` : toolName
        const serverPrefix = serverName ? `@${serverName}` : ''

        // Remove exact matches
        this.agentConfig.allowedTools = this.agentConfig.allowedTools.filter(
            tool => tool !== toolId && tool !== serverPrefix
        )

        // Remove matching wildcards and expand them
        const toRemove: string[] = []
        for (const allowedTool of this.agentConfig.allowedTools) {
            if (allowedTool.includes('*') || allowedTool.includes('?')) {
                if (this.matchesPattern(toolId, allowedTool)) {
                    toRemove.push(allowedTool)
                }
            }
        }

        for (const pattern of toRemove) {
            this.expandAllowedPatternWildcard(pattern, serverName, toolName)
        }
    }

    /**
     * Remove conflicting wildcards from allowedTools when setting to ask
     */
    private removeConflictingAllowedWildcardsForAsk(serverName: string, toolName: string): void {
        const toolId = serverName ? `@${serverName}/${toolName}` : toolName
        const serverPrefix = serverName ? `@${serverName}` : ''

        // Remove exact matches
        this.agentConfig.allowedTools = this.agentConfig.allowedTools.filter(
            tool => tool !== toolId && tool !== serverPrefix
        )

        // Remove matching wildcards and expand them (excluding the tool being set to ask)
        const toRemove: string[] = []
        for (const allowedTool of this.agentConfig.allowedTools) {
            if (allowedTool.includes('*') || allowedTool.includes('?')) {
                if (this.matchesPattern(toolId, allowedTool)) {
                    toRemove.push(allowedTool)
                }
            }
        }

        for (const pattern of toRemove) {
            this.expandAllowedPatternWildcard(pattern, serverName, toolName)
        }
    }

    /**
     * Expand global wildcard (*) to all available tools except the denied one
     */
    private expandGlobalWildcard(deniedServerName: string, deniedToolName: string): void {
        this.agentConfig.tools = this.agentConfig.tools.filter(tool => tool !== '*')

        if (this.getAvailableTools) {
            // Get all available servers (this should be provided by the manager)
            const allServers = this.getAvailableServers()
            for (const serverName of allServers) {
                const tools = this.getAvailableTools(serverName)
                for (const toolName of tools) {
                    if (!(serverName === deniedServerName && toolName === deniedToolName)) {
                        this.addTool(`@${serverName}/${toolName}`)
                    }
                }
            }

            // Add builtin tools (except denied one)
            const builtinTools = this.getBuiltinTools()
            for (const toolName of builtinTools) {
                if (!(deniedServerName === '' && toolName === deniedToolName)) {
                    this.addTool(toolName)
                }
            }
        }
    }

    /**
     * Expand @builtin wildcard to all builtin tools except the denied one
     */
    private expandBuiltinWildcard(deniedToolName: string): void {
        this.agentConfig.tools = this.agentConfig.tools.filter(tool => tool !== '@builtin')

        const builtinTools = this.getBuiltinTools()
        for (const toolName of builtinTools) {
            if (toolName !== deniedToolName) {
                this.addTool(toolName)
            }
        }
    }

    /**
     * Remove pattern wildcards that match the tool and expand them
     */
    private removeMatchingPatternWildcards(serverName: string, toolName: string): void {
        const toolId = serverName ? `@${serverName}/${toolName}` : toolName
        const serverPrefix = serverName ? `@${serverName}` : ''

        const toRemove: string[] = []
        for (const tool of this.agentConfig.tools) {
            if (tool.includes('*') || tool.includes('?')) {
                if (serverName && tool.startsWith('@') && !tool.includes('/')) {
                    if (this.matchesPattern(serverPrefix, tool)) {
                        toRemove.push(tool)
                    }
                } else if (this.matchesPattern(toolId, tool)) {
                    toRemove.push(tool)
                }
            }
        }

        for (const pattern of toRemove) {
            this.expandPatternWildcard(pattern, serverName, toolName)
        }
    }

    /**
     * Expand a pattern wildcard to individual tools except the denied one
     */
    private expandPatternWildcard(pattern: string, deniedServerName: string, deniedToolName: string): void {
        this.agentConfig.tools = this.agentConfig.tools.filter(tool => tool !== pattern)

        if (!this.getAvailableTools) return

        if (pattern.startsWith('@') && !pattern.includes('/')) {
            // Server pattern like @*-mcp
            const allServers = this.getAvailableServers()
            for (const serverName of allServers) {
                const serverPrefix = `@${serverName}`
                if (this.matchesPattern(serverPrefix, pattern)) {
                    const tools = this.getAvailableTools(serverName)
                    for (const toolName of tools) {
                        if (!(serverName === deniedServerName && toolName === deniedToolName)) {
                            this.addTool(`@${serverName}/${toolName}`)
                        }
                    }
                }
            }
        } else {
            // Tool pattern like @fs/read_*
            const allServers = this.getAvailableServers()
            for (const serverName of allServers) {
                const tools = this.getAvailableTools(serverName)
                for (const toolName of tools) {
                    const toolId = `@${serverName}/${toolName}`
                    if (this.matchesPattern(toolId, pattern)) {
                        if (!(serverName === deniedServerName && toolName === deniedToolName)) {
                            this.addTool(toolId)
                        }
                    }
                }
            }
        }
    }

    /**
     * Expand allowedTools pattern wildcard except the denied tool
     */
    private expandAllowedPatternWildcard(pattern: string, deniedServerName: string, deniedToolName: string): void {
        this.agentConfig.allowedTools = this.agentConfig.allowedTools.filter(tool => tool !== pattern)

        if (!this.getAvailableTools) return

        if (pattern.startsWith('@') && !pattern.includes('/')) {
            // Server pattern like @git
            const allServers = this.getAvailableServers()
            for (const serverName of allServers) {
                const serverPrefix = `@${serverName}`
                if (this.matchesPattern(serverPrefix, pattern)) {
                    const tools = this.getAvailableTools(serverName)
                    for (const toolName of tools) {
                        if (!(serverName === deniedServerName && toolName === deniedToolName)) {
                            this.addToAllowedTools(`@${serverName}/${toolName}`)
                        }
                    }
                }
            }
        } else {
            // Tool pattern like @fs/*
            const allServers = this.getAvailableServers()
            for (const serverName of allServers) {
                const tools = this.getAvailableTools(serverName)
                for (const toolName of tools) {
                    const toolId = `@${serverName}/${toolName}`
                    if (this.matchesPattern(toolId, pattern)) {
                        if (!(serverName === deniedServerName && toolName === deniedToolName)) {
                            this.addToAllowedTools(toolId)
                        }
                    }
                }
            }
        }
    }

    /**
     * Get all available servers
     */
    private getAvailableServers(): string[] {
        return this.getAllAvailableServers?.() || []
    }

    /**
     * Get all builtin tools
     */
    private getBuiltinTools(): string[] {
        return this.getAllBuiltinTools?.() || []
    }

    /**
     * Get updated agent config
     */
    getAgentConfig(): AgentConfig {
        return this.agentConfig
    }
}
