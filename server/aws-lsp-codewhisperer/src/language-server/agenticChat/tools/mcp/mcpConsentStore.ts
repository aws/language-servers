/**
 * Copyright Amazon.com, Inc. or its affiliates.
 * All Rights Reserved. SPDX-License-Identifier: Apache-2.0
 */

import { createHash } from 'crypto'
import * as path from 'path'
import type { Workspace, Logging } from '@aws/language-server-runtimes/server-interface'
import type { MCPServerConfig } from './mcpTypes'

const APPROVALS_FILE = 'mcp-approvals.json'
const STORE_VERSION = 1

interface Approval {
    serverName: string
    fingerprint: string
    workspaceHash: string
    approvedAt: string
}

interface ApprovalStore {
    version: number
    approvals: Approval[]
}

/**
 * SHA-256 of a canonical JSON form of the server's execution-relevant fields.
 * Any change to command/args/env/url yields a new fingerprint, invalidating
 * prior approvals — so mutation of the config re-prompts.
 */
export function fingerprintServerConfig(cfg: MCPServerConfig): string {
    const canonical = {
        command: cfg.command ?? null,
        args: cfg.args ?? [],
        env: cfg.env ? Object.fromEntries(Object.entries(cfg.env).sort(([a], [b]) => a.localeCompare(b))) : {},
        url: cfg.url ?? null,
    }
    return 'sha256:' + createHash('sha256').update(JSON.stringify(canonical)).digest('hex')
}

/** Hash of the workspace path so approval is scoped to (workspace, config).
 *  Normalizes the path to forward slashes for cross-platform consistency. */
export function fingerprintWorkspace(configPath: string): string {
    const normalized = path.resolve(path.dirname(configPath)).replace(/\\/g, '/')
    return 'sha256:' + createHash('sha256').update(normalized).digest('hex')
}

function getStorePath(workspace: Workspace): string {
    return path.join(workspace.fs.getUserHomeDir(), '.aws', 'amazonq', APPROVALS_FILE)
}

async function readStore(workspace: Workspace, logging: Logging): Promise<ApprovalStore> {
    const file = getStorePath(workspace)
    try {
        if (!(await workspace.fs.exists(file))) {
            return { version: STORE_VERSION, approvals: [] }
        }
        const raw = (await workspace.fs.readFile(file)).toString()
        const parsed = JSON.parse(raw) as ApprovalStore
        if (parsed?.version !== STORE_VERSION || !Array.isArray(parsed.approvals)) {
            logging.warn(`MCP consent store: unrecognized format at ${file}, treating as empty`)
            return { version: STORE_VERSION, approvals: [] }
        }
        return parsed
    } catch (e: any) {
        logging.warn(`MCP consent store: failed to read ${file}: ${e?.message}`)
        return { version: STORE_VERSION, approvals: [] }
    }
}

async function writeStore(workspace: Workspace, logging: Logging, store: ApprovalStore): Promise<void> {
    const file = getStorePath(workspace)
    try {
        await workspace.fs.mkdir(path.dirname(file), { recursive: true })
        await workspace.fs.writeFile(file, JSON.stringify(store, null, 2))
    } catch (e: any) {
        logging.warn(`MCP consent store: failed to write ${file}: ${e?.message}`)
    }
}

export async function hasApproval(
    workspace: Workspace,
    logging: Logging,
    serverName: string,
    cfg: MCPServerConfig,
    configPath: string
): Promise<boolean> {
    const store = await readStore(workspace, logging)
    const fp = fingerprintServerConfig(cfg)
    const wh = fingerprintWorkspace(configPath)
    return store.approvals.some(a => a.serverName === serverName && a.fingerprint === fp && a.workspaceHash === wh)
}

export async function recordApproval(
    workspace: Workspace,
    logging: Logging,
    serverName: string,
    cfg: MCPServerConfig,
    configPath: string
): Promise<void> {
    const store = await readStore(workspace, logging)
    const fp = fingerprintServerConfig(cfg)
    const wh = fingerprintWorkspace(configPath)
    // Replace any prior approval for the same (server, workspace) — this evicts
    // stale entries when the config changes (fingerprint differs).
    store.approvals = store.approvals.filter(a => !(a.serverName === serverName && a.workspaceHash === wh))
    store.approvals.push({
        serverName,
        fingerprint: fp,
        workspaceHash: wh,
        approvedAt: new Date().toISOString(),
    })
    await writeStore(workspace, logging, store)
}
