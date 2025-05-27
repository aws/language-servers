/*!
 * Copyright Amazon.com, Inc. or its affiliates.
 * All Rights Reserved. SPDX-License-Identifier: Apache-2.0
 */

import { Logger, Workspace } from '@aws/language-server-runtimes/server-interface'
import { URI } from 'vscode-uri'
import { MCPServerConfig, PersonaConfig, MCPServerPermission, McpPermissionType } from './mcpTypes'
import * as yaml from 'yaml'
import path = require('path')

/**
 * Load, validate, and parse MCP server configurations from JSON files.
 * - Deduplicates input paths.
 * - Normalizes file and URI inputs.
 * - Skips missing, unreadable, or invalid JSON files.
 * - Handle server name conflicts, prioritize workspace config over global when both define the same server.
 * - Validates required fields and logs warnings for issues.
 */
//  todo: handle config loading errors
export async function loadMcpServerConfigs(
    workspace: Workspace,
    logging: Logger,
    rawPaths: string[]
): Promise<Map<string, MCPServerConfig>> {
    const servers = new Map<string, MCPServerConfig>()
    const uniquePaths = Array.from(new Set(rawPaths))
    const globalConfigPath = getGlobalMcpConfigPath(workspace.fs.getUserHomeDir())
    for (const raw of uniquePaths) {
        // 1) normalize file:/ URIs → real fs paths
        let fsPath: string
        try {
            const uri = URI.parse(raw)
            fsPath = uri.scheme === 'file' ? uri.fsPath : raw
        } catch {
            fsPath = raw
        }
        fsPath = require('path').normalize(fsPath)

        // 2) skip missing
        let exists: boolean
        try {
            exists = await workspace.fs.exists(fsPath)
        } catch (e: any) {
            logging.warn(`Could not stat MCP config at ${fsPath}: ${e.message}`)
            continue
        }
        if (!exists) {
            logging.warn(`MCP config not found at ${fsPath}, skipping.`)
            continue
        }

        // 3) read + parse JSON
        let rawText: string
        try {
            rawText = (await workspace.fs.readFile(fsPath)).toString()
        } catch (e: any) {
            logging.warn(`Failed to read MCP config at ${fsPath}: ${e.message}`)
            continue
        }

        let json: any
        try {
            json = JSON.parse(rawText)
        } catch (e: any) {
            logging.warn(`Invalid JSON in MCP config at ${fsPath}: ${e.message}`)
            continue
        }

        if (!json.mcpServers || typeof json.mcpServers !== 'object') {
            logging.warn(`MCP config at ${fsPath} missing or invalid 'mcpServers' field`)
            continue
        }

        // 4) dedupe and validate
        for (const [name, entry] of Object.entries(json.mcpServers)) {
            if (!entry || typeof (entry as any).command !== 'string') {
                logging.warn(`MCP server '${name}' in ${fsPath} missing required 'command', skipping.`)
                continue
            }
            if ((entry as any).timeout !== undefined && typeof (entry as any).timeout !== 'number') {
                logging.warn(`Invalid timeout value on '${name}', ignoring.`)
            }
            const cfg: MCPServerConfig = {
                command: (entry as any).command,
                args: Array.isArray((entry as any).args) ? (entry as any).args.map(String) : [],
                env: typeof (entry as any).env === 'object' && (entry as any).env !== null ? (entry as any).env : {},
                initializationTimeout:
                    typeof (entry as any).initializationTimeout === 'number'
                        ? (entry as any).initializationTimeout
                        : undefined,
                timeout: typeof (entry as any).timeout === 'number' ? (entry as any).timeout : undefined,
                __configPath__: fsPath,
            }

            if (servers.has(name)) {
                const existing = servers.get(name)!
                const existingIsGlobal = existing.__configPath__ === globalConfigPath
                const currentIsGlobal = fsPath === globalConfigPath
                if (existingIsGlobal && !currentIsGlobal) {
                    logging.warn(
                        `Workspace override for MCP server '${name}' in ${fsPath}; replacing global configuration.`
                    )
                } else {
                    logging.warn(
                        `Ignoring ${existingIsGlobal ? 'global' : 'workspace'} MCP server duplicate for '${name}' in ${fsPath}.`
                    )
                    continue
                }
            }

            servers.set(name, cfg)
            logging.info(`Loaded MCP server '${name}' from ${fsPath}`)
        }
    }

    return servers
}

/**
 * Load, validate, and parse persona configurations from YAML files.
 * - If both global and workspace files are missing, create a default global.
 * - Load global first (if exists), then workspace files—workspace overrides.
 * - Only servers in `mcpServers` are enabled.
 */
export async function loadPersonaPermissions(
    workspace: Workspace,
    logging: Logger,
    personaPaths: string[]
): Promise<Map<string, MCPServerPermission>> {
    const globalPath = getGlobalPersonaConfigPath(workspace.fs.getUserHomeDir())

    // normalize paths
    const normalized = Array.from(
        new Set(
            personaPaths.map(raw => {
                try {
                    const uri = URI.parse(raw)
                    return uri.scheme === 'file' ? path.normalize(uri.fsPath) : path.normalize(raw)
                } catch {
                    return path.normalize(raw)
                }
            })
        )
    )

    const wsFiles = (
        await Promise.all(
            normalized.map(async p => ((await workspace.fs.exists(p).catch(() => false)) ? p : undefined))
        )
    )
        .filter((p): p is string => Boolean(p))
        .filter(p => p !== globalPath)

    const globalExists = await workspace.fs.exists(globalPath).catch(() => false)

    // global first, then workspace
    const files = [...(globalExists ? [globalPath] : []), ...wsFiles]

    const result = new Map<string, MCPServerPermission>()

    // if none found, write default global persona and use it
    if (files.length === 0) {
        await workspace.fs.mkdir(path.dirname(globalPath), { recursive: true })
        await workspace.fs
            .writeFile(globalPath, 'mcpServers:\n  - "*"\n')
            .then(() => logging.info(`Created default persona file at ${globalPath}`))
            .catch(e => {
                logging.error(`Failed to create default persona file: ${e.message}`)
            })
        files.push(globalPath)
        logging.info(`Created default persona file at ${globalPath}`)
    }

    // merge configs: later files override earlier ones
    let wsHasStar = false
    const wsEnabled = new Set<string>()

    for (const file of files) {
        const isWorkspace = wsFiles.includes(file)
        logging.info(`Reading persona file ${file}`)
        let cfg: PersonaConfig
        try {
            const raw = (await workspace.fs.readFile(file)).toString().trim()
            cfg = raw ? (yaml.parse(raw) as PersonaConfig) : { mcpServers: [], toolPerms: {} }
        } catch (err: any) {
            logging.warn(`Invalid Persona config in ${file}: ${err.message}`)
            continue
        }

        // enable servers listed under mcpServers
        const enabled = new Set(cfg['mcpServers'] ?? [])
        if (wsFiles.includes(file)) {
            if (enabled.has('*')) wsHasStar = true
            enabled.forEach(s => wsEnabled.add(s))
        }
        for (const name of enabled) {
            result.set(name, { enabled: true, toolPerms: {}, __configPath__: file })
        }

        // apply toolPerms only to enabled servers
        for (const [name, perms] of Object.entries(cfg['toolPerms'] ?? {})) {
            if (enabled.has(name)) {
                const rec = result.get(name)!
                rec.toolPerms = perms as Record<string, McpPermissionType>
            } else if (isWorkspace && result.has(name)) {
                // server dropped from workspace mcpServers → remove it entirely
                result.delete(name)
            }
        }
    }

    // workspace overrides global: global has '*' but workspace does not
    if (wsFiles.length > 0 && !wsHasStar) {
        // remove the global-level wildcard
        result.delete('*')
        // drop servers that were enabled only by the global '*'
        for (const [srv] of result) {
            if (srv !== '*' && !wsEnabled.has(srv)) result.delete(srv)
        }
    }
    const summary = [...result.entries()]
        .map(([srv, perm]) => {
            const tools = Object.keys(perm.toolPerms).length > 0 ? JSON.stringify(perm.toolPerms) : '{}'
            return `${srv} => enabled=${perm.enabled}, toolPerms=${tools}`
        })
        .join('; ')
    logging.info(`Persona permission merge-result: ${summary || '(empty map)'}`)

    return result
}

// todo: pending final UX
export function processMcpToolUseMessage(message: string) {
    const allLines = message.split(/\r?\n/)
    // show only first line for long output and collaps the rest
    const summaryLine = allLines[0].trim()
    let detail = allLines.slice(1).join('\n').trim()
    detail = detail.replace(/^[ \t]*```+[\w-]*[ \t]*\r?\n?/, '')
    detail = detail.replace(/\r?\n?```+[\s`]*$/, '')
    const isJson = detail.trim().startsWith('{') || detail.trim().startsWith('[')
    const fence = '```' + (isJson ? 'json' : '')

    const collapsed = [
        '<details>',
        `  <summary>▶ ${summaryLine}</summary>`,
        '',
        fence,
        detail,
        '```',
        '',
        '</details>',
    ].join('\n')

    return collapsed
}

/** Given an array of workspace diretory, return each workspace persona config location */
export function getWorkspacePersonaConfigPaths(wsUris: string[]): string[] {
    return wsUris.map(uri => path.join(uri, '.amazonq', 'personas', 'default.yaml'))
}

/** Given a user's home directory, return the global persona config location */
export function getGlobalPersonaConfigPath(home: string): string {
    return path.join(home, '.aws', 'amazonq', 'personas', 'default.yaml')
}

/** Given an array of workspace diretory, return each workspace mcp config location */
export function getWorkspaceMcpConfigPaths(wsUris: string[]): string[] {
    return wsUris.map(uri => path.join(uri, '.amazonq', 'mcp.json'))
}

/** Given a user's home directory, return the global mcp config location */
export function getGlobalMcpConfigPath(homeDir: string): string {
    return path.join(homeDir, '.aws', 'amazonq', 'mcp.json')
}

export const MAX_TOOL_NAME_LENGTH = 64
/**
Create a namespaced tool name from server and tool names.
Handles truncation and conflicts.
 */
const allNamespacedTools = new Set<string>()

export function createNamespacedToolName(serverName: string, toolName: string, mcpNameSet: Set<string>): string {
    const sep = '___'
    // Case 1: Try the simple approach first
    const fullName = `${serverName}${sep}${toolName}`
    if (fullName.length <= MAX_TOOL_NAME_LENGTH && !mcpNameSet.has(fullName)) {
        mcpNameSet.add(fullName)
        return fullName
    }
    // Case 2: Server name is way too long
    if (serverName.length > MAX_TOOL_NAME_LENGTH) {
        const spaceForServer = MAX_TOOL_NAME_LENGTH - sep.length - Math.min(toolName.length, 10)
        let serverPart = serverName.substring(0, Math.max(4, spaceForServer))
        let result = `${serverPart}${sep}${toolName}`
        // Still too long? Trim more aggressively
        if (result.length > MAX_TOOL_NAME_LENGTH) {
            const overage = result.length - MAX_TOOL_NAME_LENGTH
            serverPart = serverPart.substring(0, serverPart.length - overage)
            result = `${serverPart}${sep}${toolName}`
        }
        // Handle name collisions
        let attempt = 1
        let baseServerPart = serverPart
        while (allNamespacedTools.has(result)) {
            serverPart = `${baseServerPart}${attempt++}`
            result = `${serverPart}${sep}${toolName}`
            // Check length again after adding counter
            if (result.length > MAX_TOOL_NAME_LENGTH) {
                const overage = result.length - MAX_TOOL_NAME_LENGTH
                serverPart = serverPart.substring(0, serverPart.length - overage)
                result = `${serverPart}${sep}${toolName}`
            }
        }
        allNamespacedTools.add(result)
        return result
    }
    // Case 3: Tool name is the problem
    if (toolName.length >= MAX_TOOL_NAME_LENGTH) {
        const spaceForTool = MAX_TOOL_NAME_LENGTH - sep.length - Math.min(4, serverName.length)
        let toolPart = toolName.substring(0, spaceForTool)
        let result = `${serverName}${sep}${toolPart}`
        if (result.length > MAX_TOOL_NAME_LENGTH) {
            const overage = result.length - MAX_TOOL_NAME_LENGTH
            toolPart = toolPart.substring(0, toolPart.length - overage)
            result = `${serverName}${sep}${toolPart}`
        }
        // Deal with conflicts by trimming tool name further
        while (allNamespacedTools.has(result)) {
            const serverPrefix = serverName.substring(0, Math.min(serverName.length, result.length + 1))
            toolPart = toolPart.substring(1)
            result = `${serverPrefix}${sep}${toolPart}`
            if (result.length > MAX_TOOL_NAME_LENGTH) {
                const overage = result.length - MAX_TOOL_NAME_LENGTH
                toolPart = toolPart.substring(0, toolPart.length - overage)
                result = `${serverPrefix}${sep}${toolPart}`
            }
        }
        allNamespacedTools.add(result)
        return result
    }
    // Case 4: Both names are reasonable but together they're too long
    if (toolName.length < MAX_TOOL_NAME_LENGTH && serverName.length < MAX_TOOL_NAME_LENGTH) {
        const spaceForServer = MAX_TOOL_NAME_LENGTH - sep.length - toolName.length
        let serverPart = serverName.substring(0, Math.max(1, spaceForServer))
        let result = `${serverPart}${sep}${toolName}`
        if (result.length > MAX_TOOL_NAME_LENGTH) {
            const overage = result.length - MAX_TOOL_NAME_LENGTH
            serverPart = serverPart.substring(0, serverPart.length - overage)
            result = `${serverPart}${sep}${toolName}`
        }
        // Add numbers to handle duplicates
        let num = 1
        let baseServerPart = serverPart
        while (allNamespacedTools.has(result)) {
            serverPart = `${baseServerPart}${num++}`
            if ((serverPart + sep + toolName).length > MAX_TOOL_NAME_LENGTH) {
                baseServerPart = baseServerPart.substring(0, baseServerPart.length - String(num).length)
                serverPart = `${baseServerPart}${num}`
            }
            result = `${serverPart}${sep}${toolName}`
        }
        allNamespacedTools.add(result)
        return result
    }
    // Shouldn't really get here, but just in case
    return `${serverName}${sep}${toolName}`
}
