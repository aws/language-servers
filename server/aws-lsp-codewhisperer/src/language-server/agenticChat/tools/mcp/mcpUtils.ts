/*!
 * Copyright Amazon.com, Inc. or its affiliates.
 * All Rights Reserved. SPDX-License-Identifier: Apache-2.0
 */

import { Logger, Workspace } from '@aws/language-server-runtimes/server-interface'
import { URI } from 'vscode-uri'
import { MCPServerConfig } from './mcpTypes'

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
                disabled: !!(entry as any).disabled,
                autoApprove: Boolean((entry as any).autoApprove),
                toolOverrides: (() => {
                    const o = (entry as any).toolOverrides
                    if (o && typeof o === 'object' && !Array.isArray(o)) return o
                    if (o != null) {
                        logging.warn(`Invalid toolOverrides on '${name}', ignoring.`)
                    }
                    return {}
                })(),
                initializationTimeout:
                    typeof (entry as any).initializationTimeout === 'number'
                        ? (entry as any).initializationTimeout
                        : undefined,
                timeout:
                    typeof (entry as any).executionTimeout === 'number' ? (entry as any).executionTimeout : undefined,
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

/** Given an array of workspace diretory, return each workspace mcp config location */
export function getWorkspaceMcpConfigPaths(wsUris: string[]): string[] {
    return wsUris.map(uri => `${uri}/.amazonq/mcp.json`)
}

/** Given a user’s home directory, return the global mcp config location */
export function getGlobalMcpConfigPath(homeDir: string): string {
    return `${homeDir}/.aws/amazonq/mcp.json`
}
