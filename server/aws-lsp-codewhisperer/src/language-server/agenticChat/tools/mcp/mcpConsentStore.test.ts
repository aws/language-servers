/*!
 * Copyright Amazon.com, Inc. or its affiliates.
 * All Rights Reserved. SPDX-License-Identifier: Apache-2.0
 */

import { expect } from 'chai'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import { fingerprintServerConfig, fingerprintWorkspace, hasApproval, recordApproval } from './mcpConsentStore'
import type { MCPServerConfig } from './mcpTypes'

describe('mcpConsentStore', () => {
    let tmpHome: string
    let workspace: any
    let logger: any

    beforeEach(() => {
        tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), 'mcpConsentTest-'))
        workspace = {
            fs: {
                exists: (p: string) => Promise.resolve(fs.existsSync(p)),
                readFile: (p: string) => Promise.resolve(Buffer.from(fs.readFileSync(p))),
                writeFile: (p: string, d: string) => Promise.resolve(fs.writeFileSync(p, d)),
                mkdir: (p: string, _opts: any) => Promise.resolve(fs.mkdirSync(p, { recursive: true })),
                getUserHomeDir: () => tmpHome,
            },
        }
        logger = { warn: () => {}, info: () => {}, error: () => {} }
    })

    afterEach(() => {
        fs.rmSync(tmpHome, { recursive: true, force: true })
    })

    describe('fingerprintServerConfig', () => {
        it('is deterministic for identical config', () => {
            const cfg: MCPServerConfig = { command: 'sh', args: ['-c', 'echo hi'] }
            expect(fingerprintServerConfig(cfg)).to.equal(fingerprintServerConfig({ ...cfg }))
        })

        it('differs when command changes', () => {
            const a: MCPServerConfig = { command: 'sh', args: ['-c', 'echo hi'] }
            const b: MCPServerConfig = { command: 'bash', args: ['-c', 'echo hi'] }
            expect(fingerprintServerConfig(a)).to.not.equal(fingerprintServerConfig(b))
        })

        it('differs when args change', () => {
            const a: MCPServerConfig = { command: 'sh', args: ['-c', 'echo hi'] }
            const b: MCPServerConfig = { command: 'sh', args: ['-c', 'echo bye'] }
            expect(fingerprintServerConfig(a)).to.not.equal(fingerprintServerConfig(b))
        })

        it('differs when env changes', () => {
            const a: MCPServerConfig = { command: 'sh', args: [], env: { FOO: '1' } }
            const b: MCPServerConfig = { command: 'sh', args: [], env: { FOO: '2' } }
            expect(fingerprintServerConfig(a)).to.not.equal(fingerprintServerConfig(b))
        })

        it('is stable regardless of env key order', () => {
            const a: MCPServerConfig = { command: 'sh', args: [], env: { A: '1', B: '2' } }
            const b: MCPServerConfig = { command: 'sh', args: [], env: { B: '2', A: '1' } }
            expect(fingerprintServerConfig(a)).to.equal(fingerprintServerConfig(b))
        })

        it('differs when url changes', () => {
            const a: MCPServerConfig = { url: 'https://a.example' }
            const b: MCPServerConfig = { url: 'https://b.example' }
            expect(fingerprintServerConfig(a)).to.not.equal(fingerprintServerConfig(b))
        })
    })

    describe('fingerprintWorkspace', () => {
        it('is keyed on the directory of the config, not the filename', () => {
            const a = fingerprintWorkspace('/foo/bar/.amazonq/mcp.json')
            const b = fingerprintWorkspace('/foo/bar/.amazonq/agents/default.json')
            // both live under /foo/bar/.amazonq's parent-dir once; path.dirname differs though
            expect(a).to.not.equal(b)
        })

        it('is deterministic for the same path', () => {
            const p = '/foo/bar/.amazonq/mcp.json'
            expect(fingerprintWorkspace(p)).to.equal(fingerprintWorkspace(p))
        })
    })

    describe('hasApproval / recordApproval', () => {
        const cfg: MCPServerConfig = { command: 'sh', args: ['-c', 'echo ok'] }
        const configPath = '/tmp/ws-a/.amazonq/mcp.json'

        it('returns false when store is empty', async () => {
            expect(await hasApproval(workspace, logger, 'poc', cfg, configPath)).to.be.false
        })

        it('records and finds an approval for same (name, config, workspace)', async () => {
            await recordApproval(workspace, logger, 'poc', cfg, configPath)
            expect(await hasApproval(workspace, logger, 'poc', cfg, configPath)).to.be.true
        })

        it('does not match when workspace path differs', async () => {
            await recordApproval(workspace, logger, 'poc', cfg, '/tmp/ws-a/.amazonq/mcp.json')
            expect(await hasApproval(workspace, logger, 'poc', cfg, '/tmp/ws-b/.amazonq/mcp.json')).to.be.false
        })

        it('does not match when command changes (fingerprint invalidates)', async () => {
            await recordApproval(workspace, logger, 'poc', cfg, configPath)
            const mutated: MCPServerConfig = { command: 'sh', args: ['-c', 'curl evil'] }
            expect(await hasApproval(workspace, logger, 'poc', mutated, configPath)).to.be.false
        })

        it('does not match when server name differs', async () => {
            await recordApproval(workspace, logger, 'poc', cfg, configPath)
            expect(await hasApproval(workspace, logger, 'other', cfg, configPath)).to.be.false
        })

        it('dedupes repeated approvals for the same key', async () => {
            await recordApproval(workspace, logger, 'poc', cfg, configPath)
            await recordApproval(workspace, logger, 'poc', cfg, configPath)
            const stored = JSON.parse(
                fs.readFileSync(path.join(tmpHome, '.aws', 'amazonq', 'mcp-approvals.json')).toString()
            )
            expect(stored.approvals).to.have.lengthOf(1)
        })

        it('ignores a store with unrecognized version', async () => {
            const storeDir = path.join(tmpHome, '.aws', 'amazonq')
            fs.mkdirSync(storeDir, { recursive: true })
            fs.writeFileSync(path.join(storeDir, 'mcp-approvals.json'), JSON.stringify({ version: 999, approvals: [] }))
            // record should still work (overwrites with v1)
            await recordApproval(workspace, logger, 'poc', cfg, configPath)
            expect(await hasApproval(workspace, logger, 'poc', cfg, configPath)).to.be.true
        })

        it('treats a malformed store as empty', async () => {
            const storeDir = path.join(tmpHome, '.aws', 'amazonq')
            fs.mkdirSync(storeDir, { recursive: true })
            fs.writeFileSync(path.join(storeDir, 'mcp-approvals.json'), 'not json')
            expect(await hasApproval(workspace, logger, 'poc', cfg, configPath)).to.be.false
        })
    })
})
