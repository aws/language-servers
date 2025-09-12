/*!
 * Copyright Amazon.com, Inc. or its affiliates.
 * All Rights Reserved. SPDX-License-Identifier: Apache-2.0
 */

import { AgentConfig, McpPermissionType } from './mcpTypes'

/**
 * Manages agent tool permissions with wildcard support for reading and simple patterns for writing
 */
export class AgentPermissionManager {
    constructor(private agentConfig: AgentConfig) {}

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

        // Check exact matches first
        if (this.agentConfig.tools.includes(toolId)) return true
        if (serverPrefix && this.agentConfig.tools.includes(serverPrefix)) return true

        // Check wildcard patterns
        for (const tool of this.agentConfig.tools) {
            if (tool.includes('*') || tool.includes('?')) {
                if (this.matchesPattern(toolId, tool)) return true
            }
        }

        // Check for global wildcard
        return this.agentConfig.tools.includes('*')
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
        const isEnabled = this.isToolEnabled(serverName, toolName)
        const isAlwaysAllowed = this.isToolAlwaysAllowed(serverName, toolName)

        // If tool is always allowed, it's implicitly enabled
        if (isAlwaysAllowed) {
            return McpPermissionType.alwaysAllow
        }

        // If tool is enabled but not always allowed, ask for permission
        if (isEnabled) {
            return McpPermissionType.ask
        }

        // Tool is not enabled and not always allowed
        return McpPermissionType.deny
    }

    /**
     * Set permission for a tool (uses simple patterns for writing)
     */
    setToolPermission(serverName: string, toolName: string, permission: McpPermissionType): void {
        const toolId = serverName ? `@${serverName}/${toolName}` : toolName
        const serverPrefix = serverName ? `@${serverName}` : ''

        // Remove conflicting wildcards that would affect this tool
        this.removeConflictingWildcards(toolId)

        switch (permission) {
            case McpPermissionType.deny:
                this.removeTool(toolId, serverPrefix)
                this.removeFromAllowedTools(toolId, serverPrefix)
                break

            case McpPermissionType.ask:
                this.addTool(toolId)
                this.removeFromAllowedTools(toolId, serverPrefix)
                break

            case McpPermissionType.alwaysAllow:
                this.addTool(toolId)
                this.addToAllowedTools(toolId)
                break
        }
    }

    /**
     * Remove wildcards that would conflict with specific tool permission
     */
    private removeConflictingWildcards(toolId: string): void {
        // Remove wildcards from tools array that would match this tool
        this.agentConfig.tools = this.agentConfig.tools.filter(tool => {
            if (!tool.includes('*') && !tool.includes('?')) return true
            return !this.matchesPattern(toolId, tool)
        })

        // Remove wildcards from allowedTools array that would match this tool
        this.agentConfig.allowedTools = this.agentConfig.allowedTools.filter(tool => {
            if (!tool.includes('*') && !tool.includes('?')) return true
            return !this.matchesPattern(toolId, tool)
        })
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
     * Remove tool from allowedTools array
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
     * Get updated agent config
     */
    getAgentConfig(): AgentConfig {
        return this.agentConfig
    }
}
