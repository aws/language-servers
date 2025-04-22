/*!
 * Copyright Amazon.com, Inc. or its affiliates.
 * All Rights Reserved. SPDX-License-Identifier: Apache-2.0
 */

import { Logger, Workspace } from '@aws/language-server-runtimes/server-interface'
import { URI } from 'vscode-uri'
import { MCPServerConfig } from './mcpTypes'

export async function loadMcpServerConfigs(
    workspace: Workspace,
    logging: Logger,
    rawPaths: string[]
): Promise<Map<string, MCPServerConfig>> {
    const servers = new Map<string, MCPServerConfig>()

    for (const raw of rawPaths) {
        // 1) normalize file:/ URIs → real fs paths
        let fsPath: string
        try {
            const uri = URI.parse(raw)
            fsPath = uri.scheme === 'file' ? uri.fsPath : raw
        } catch {
            fsPath = raw
        }

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
            if (servers.has(name)) {
                logging.warn(`Duplicate MCP server '${name}' in ${fsPath}, skipping.`)
                continue
            }
            if (!entry || typeof (entry as any).command !== 'string') {
                logging.warn(`MCP server '${name}' in ${fsPath} missing required 'command', skipping.`)
                continue
            }
            const cfg: MCPServerConfig = {
                command: (entry as any).command,
                args: Array.isArray((entry as any).args) ? (entry as any).args : [],
                env: typeof (entry as any).env === 'object' ? (entry as any).env : {},
                disabled: !!(entry as any).disabled,
                autoApprove: Array.isArray((entry as any).autoApprove) ? (entry as any).autoApprove : [],
            }
            servers.set(name, cfg)
            logging.info(`Loaded MCP server '${name}' from ${fsPath}`)
        }
    }

    return servers
}
