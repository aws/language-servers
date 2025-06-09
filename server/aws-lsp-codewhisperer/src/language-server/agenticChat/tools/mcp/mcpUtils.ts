/*!
 * Copyright Amazon.com, Inc. or its affiliates.
 * All Rights Reserved. SPDX-License-Identifier: Apache-2.0
 */

import { InitializeParams, Logger, Workspace } from '@aws/language-server-runtimes/server-interface'
import { URI } from 'vscode-uri'
import { MCPServerConfig, PersonaConfig, MCPServerPermission, McpPermissionType } from './mcpTypes'
import path = require('path')
import { QClientCapabilities } from '../../../configuration/qConfigurationServer'

/**
 * Load, validate, and parse MCP server configurations from JSON files.
 * - Deduplicates input paths.
 * - Normalizes file and URI inputs.
 * - Skips missing, unreadable, or invalid JSON files.
 * - Handle server name conflicts, prioritize workspace config over global when both define the same server.
 * - Validates required fields and logs warnings for issues.
 * - Captures and returns any errors that occur during loading
 */
export async function loadMcpServerConfigs(
    workspace: Workspace,
    logging: Logger,
    rawPaths: string[]
): Promise<{ servers: Map<string, MCPServerConfig>; errors: Map<string, string> }> {
    const servers = new Map<string, MCPServerConfig>()
    const configErrors = new Map<string, string>()
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
            const errorMsg = `Could not stat MCP config at ${fsPath}: ${e.message}`
            logging.warn(errorMsg)
            continue
        }
        if (!exists) {
            const errorMsg = `MCP config not found at ${fsPath}, skipping.`
            logging.warn(errorMsg)
            continue
        }

        // 3) read + parse JSON
        let rawText: string
        try {
            rawText = (await workspace.fs.readFile(fsPath)).toString()
        } catch (e: any) {
            const errorMsg = `Failed to read MCP config at ${fsPath}: ${e.message}`
            logging.warn(errorMsg)
            configErrors.set(`${fsPath}`, errorMsg)
            continue
        }

        let json: any
        try {
            json = JSON.parse(rawText)
        } catch (e: any) {
            const errorMsg = `Invalid JSON in MCP config at ${fsPath}: ${e.message}`
            logging.warn(errorMsg)
            configErrors.set(`${fsPath}`, errorMsg)
            continue
        }

        if (!json.mcpServers || typeof json.mcpServers !== 'object') {
            const errorMsg = `MCP config at ${fsPath} missing or invalid 'mcpServers' field`
            logging.warn(errorMsg)
            configErrors.set(`${fsPath}`, errorMsg)
            continue
        }

        // 4) dedupe and validate
        for (const [name, entry] of Object.entries(json.mcpServers)) {
            if (!entry || typeof (entry as any).command !== 'string') {
                const errorMsg = `MCP server '${name}' in ${fsPath} missing required 'command', skipping.`
                logging.warn(errorMsg)
                configErrors.set(`${name}`, errorMsg)
                continue
            }
            if ((entry as any).timeout !== undefined && typeof (entry as any).timeout !== 'number') {
                const errorMsg = `Invalid timeout value on '${name}', ignoring.`
                logging.warn(errorMsg)
                configErrors.set(`${name}_timeout`, errorMsg)
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

    return { servers, errors: configErrors }
}

const DEFAULT_PERSONA_RAW = `{
  "mcpServers": [
    "*"
  ],
  "toolPerms": {
    "builtIn": {
      "execute_bash": {
        "alwaysAllow": [
          {
            "preset": "readOnly"
          }
        ]
      },
      "fs_read": "alwaysAllow",
      "fs_write": "ask",
      "report_issue": "alwaysAllow",
      "use_aws": {
        "alwaysAllow": [
          {
            "preset": "readOnly"
          }
        ]
      }
    }
  },
  "context": {
    "files": [
      "AmazonQ.md",
      "README.md",
      ".amazonq/rules/**/*.md"
    ]
  }
}`

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
    // use workspace files if they exist, otherwise fall back to global
    let selectedFile: string | undefined
    if (wsFiles.length > 0) {
        selectedFile = wsFiles[0]
        logging.info(`Using workspace persona file: ${selectedFile}`)
    } else if (globalExists) {
        selectedFile = globalPath
        logging.info(`Using global persona file: ${selectedFile}`)
    } else {
        await workspace.fs.mkdir(path.dirname(globalPath), { recursive: true })
        await workspace.fs
            .writeFile(globalPath, DEFAULT_PERSONA_RAW)
            .then(() => logging.info(`Created default persona file at ${globalPath}`))
            .catch(e => {
                logging.error(`Failed to create default persona file: ${e.message}`)
            })
        selectedFile = globalPath
        logging.info(`Using newly created default persona file: ${selectedFile}`)
    }

    // read all persona files, including global and workspace
    const result = new Map<string, MCPServerPermission>()

    if (selectedFile) {
        let cfg: PersonaConfig
        try {
            const raw = (await workspace.fs.readFile(selectedFile)).toString().trim()
            cfg = raw ? (JSON.parse(raw) as PersonaConfig) : { mcpServers: [], toolPerms: {} }
        } catch (err: any) {
            logging.warn(`Invalid Persona config in ${selectedFile}: ${err.message}`)
            return result
        }

        // enable servers listed under mcpServers
        const enabled = new Set(cfg['mcpServers'] ?? [])
        for (const name of enabled) {
            result.set(name, { enabled: true, toolPerms: {}, __configPath__: selectedFile })
        }

        // Check if wildcard is present in mcpServers
        const hasWildcard = enabled.has('*')

        // apply toolPerms to servers
        for (const [name, perms] of Object.entries(cfg['toolPerms'] ?? {})) {
            // If there's a wildcard in mcpServers, or if this server is explicitly enabled
            if (hasWildcard || enabled.has(name)) {
                // Create entry for this server if it doesn't exist yet
                if (!result.has(name)) {
                    result.set(name, { enabled: true, toolPerms: {}, __configPath__: selectedFile })
                }

                const rec = result.get(name)!
                rec.toolPerms = perms as Record<string, McpPermissionType>
            }
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

/** Given an array of workspace diretory, return each workspace persona config location */
export function getWorkspacePersonaConfigPaths(wsUris: string[]): string[] {
    return wsUris.map(uri => path.join(uri, '.amazonq', 'personas', 'default.json'))
}

/** Given a user's home directory, return the global persona config location */
export function getGlobalPersonaConfigPath(home: string): string {
    return path.join(home, '.aws', 'amazonq', 'personas', 'default.json')
}

/** Given an array of workspace diretory, return each workspace mcp config location */
export function getWorkspaceMcpConfigPaths(wsUris: string[]): string[] {
    return wsUris.map(uri => path.join(uri, '.amazonq', 'mcp.json'))
}

/** Given a user's home directory, return the global mcp config location */
export function getGlobalMcpConfigPath(homeDir: string): string {
    return path.join(homeDir, '.aws', 'amazonq', 'mcp.json')
}

/** Returns true if env object is undefined, null, contains only empty keys or values */
export function isEmptyEnv(env: Record<string, string>): boolean {
    if (!env || typeof env !== 'object') {
        return true
    }
    for (const [key, value] of Object.entries(env)) {
        if (key.trim() !== '' && value.trim() !== '') {
            return false
        }
    }
    return true
}

export function enabledMCP(params: InitializeParams | undefined): boolean {
    const qCapabilities = params?.initializationOptions?.aws?.awsClientCapabilities?.q as
        | QClientCapabilities
        | undefined
    return qCapabilities?.mcp || false
}

export const MAX_TOOL_NAME_LENGTH = 64

/**
 * Create a namespaced tool name from server and tool names.
 * Handles truncation and conflicts according to specific rules.
 * Also stores the mapping from namespaced name back to original names.
 */
export function createNamespacedToolName(
    serverName: string,
    toolName: string,
    allNamespacedTools: Set<string>,
    toolNameMapping: Map<string, { serverName: string; toolName: string }>
): string {
    // First, check if this server/tool combination already has a mapping
    // If it does, reuse that name to maintain consistency across reinitializations
    for (const [existingName, mapping] of toolNameMapping.entries()) {
        if (mapping.serverName === serverName && mapping.toolName === toolName) {
            // If the name is already in the set, it's already registered
            // If not, add it to the set
            if (!allNamespacedTools.has(existingName)) {
                allNamespacedTools.add(existingName)
            }
            return existingName
        }
    }

    const sep = '___'
    // If tool name alone isn't unique or is too long, try adding server prefix
    const fullName = `${serverName}${sep}${toolName}`

    // If the full name fits and is unique, use it
    if (fullName.length <= MAX_TOOL_NAME_LENGTH && !allNamespacedTools.has(fullName)) {
        allNamespacedTools.add(fullName)
        toolNameMapping.set(fullName, { serverName, toolName })
        return fullName
    }

    // If the full name is too long, truncate the server name
    if (fullName.length > MAX_TOOL_NAME_LENGTH) {
        const maxServerLength = MAX_TOOL_NAME_LENGTH - sep.length - toolName.length
        if (maxServerLength > 0) {
            const truncatedServer = serverName.substring(0, maxServerLength)
            const namespacedName = `${truncatedServer}${sep}${toolName}`

            if (!allNamespacedTools.has(namespacedName)) {
                allNamespacedTools.add(namespacedName)
                toolNameMapping.set(namespacedName, { serverName, toolName })
                return namespacedName
            }
        }
    }

    // If we get here, either:
    // 1. The tool name was already taken
    // 2. The full name was already taken
    // 3. Server truncation resulted in a duplicate
    // In all cases, fall back to numeric suffix on the tool name

    // Check if the tool name is already in use with a server prefix
    // If so, we need to use a numeric suffix instead of server prefix
    const isToolNameWithServerPrefixInUse = Array.from(allNamespacedTools).some(
        name => name.includes('___') && name.split('___')[1] === toolName
    )

    let duplicateNum = 1
    while (true) {
        const suffix = duplicateNum.toString()
        const maxToolLength = MAX_TOOL_NAME_LENGTH - suffix.length

        let candidateName: string
        if (toolName.length <= maxToolLength) {
            candidateName = `${toolName}${suffix}`
        } else {
            // Truncate tool name to make room for suffix
            const truncatedTool = toolName.substring(0, maxToolLength)
            candidateName = `${truncatedTool}${suffix}`
        }

        if (!allNamespacedTools.has(candidateName)) {
            allNamespacedTools.add(candidateName)
            toolNameMapping.set(candidateName, { serverName, toolName })
            return candidateName
        }

        duplicateNum++
    }
}
