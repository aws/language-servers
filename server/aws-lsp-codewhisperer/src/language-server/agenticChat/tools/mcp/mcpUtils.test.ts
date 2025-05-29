/*!
 * Copyright Amazon.com, Inc. or its affiliates.
 * All Rights Reserved. SPDX-License-Identifier: Apache-2.0
 */

import { expect } from 'chai'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import {
    loadMcpServerConfigs,
    loadPersonaPermissions,
    getWorkspacePersonaConfigPaths,
    getGlobalPersonaConfigPath,
    enabledMCP,
} from './mcpUtils'
import type { MCPServerConfig } from './mcpTypes'
import { pathToFileURL } from 'url'
import * as sinon from 'sinon'

describe('loadMcpServerConfigs', () => {
    let tmpDir: string
    let workspace: any
    let logger: any

    beforeEach(() => {
        sinon.restore()
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mcpUtilsTest-'))
        // a minimal Workspace stub
        workspace = {
            fs: {
                exists: (p: string) => Promise.resolve(fs.existsSync(p)),
                readFile: (p: string) => Promise.resolve(Buffer.from(fs.readFileSync(p))),
                getUserHomeDir: () => tmpDir,
            },
        }
        // logger that just swallows
        logger = { warn: () => {}, info: () => {}, error: () => {} }
    })

    afterEach(() => {
        fs.rmSync(tmpDir, { recursive: true, force: true })
    })

    it('loads valid configs and skips invalid ones', async () => {
        const good = { mcpServers: { A: { command: 'cmdA', args: ['x'], env: { X: 'x' } } } }
        const bad = { nope: {} }

        const goodPath = path.join(tmpDir, 'good.json')
        const badPath = path.join(tmpDir, 'bad.json')
        fs.writeFileSync(goodPath, JSON.stringify(good))
        fs.writeFileSync(badPath, JSON.stringify(bad))

        const out = await loadMcpServerConfigs(workspace, logger, [goodPath, badPath])

        expect(out.size).to.equal(1)
        expect(out.has('A')).to.be.true
        const cfg = out.get('A') as MCPServerConfig
        expect(cfg.command).to.equal('cmdA')
        expect(cfg.args).to.deep.equal(['x'])
        expect(cfg.env).to.deep.equal({ X: 'x' })
    })

    it('normalizes file:// URIs', async () => {
        const cfg = { mcpServers: { B: { command: 'cmdB' } } }
        const p = path.join(tmpDir, 'u.json')
        fs.writeFileSync(p, JSON.stringify(cfg))
        const uri = pathToFileURL(p).toString()

        const out = await loadMcpServerConfigs(workspace, logger, [uri])
        expect(out.has('B')).to.be.true
    })

    it('dedupes same server name across files, keeping first', async () => {
        const c1 = { mcpServers: { S: { command: 'one' } } }
        const c2 = { mcpServers: { S: { command: 'two' }, T: { command: 'three' } } }
        const p1 = path.join(tmpDir, '1.json')
        const p2 = path.join(tmpDir, '2.json')
        fs.writeFileSync(p1, JSON.stringify(c1))
        fs.writeFileSync(p2, JSON.stringify(c2))

        const out = await loadMcpServerConfigs(workspace, logger, [p1, p2])
        expect(out.size).to.equal(2)
        expect(out.get('S')!.command).to.equal('one')
        expect(out.get('T')!.command).to.equal('three')
    })

    it('workspace config overrides global config of the same server', async () => {
        const globalDir = path.join(tmpDir, '.aws', 'amazonq')
        fs.mkdirSync(globalDir, { recursive: true })
        const globalPath = path.join(globalDir, 'mcp.json')
        fs.writeFileSync(globalPath, JSON.stringify({ mcpServers: { S: { command: 'globalCmd' } } }))

        const overridePath = path.join(tmpDir, 'override.json')
        fs.writeFileSync(overridePath, JSON.stringify({ mcpServers: { S: { command: 'workspaceCmd' } } }))

        const out1 = await loadMcpServerConfigs(workspace, logger, [globalPath, overridePath])
        expect(out1.get('S')!.command).to.equal('workspaceCmd')

        const out2 = await loadMcpServerConfigs(workspace, logger, [overridePath, globalPath])
        expect(out2.get('S')!.command).to.equal('workspaceCmd')
    })
})

describe('loadPersonaPermissions', () => {
    let tmpDir: string
    let workspace: any
    let logger: any

    beforeEach(() => {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'personaTest-'))
        workspace = {
            fs: {
                exists: (p: string) => Promise.resolve(fs.existsSync(p)),
                readFile: (p: string) => Promise.resolve(Buffer.from(fs.readFileSync(p))),
                writeFile: (p: string, d: string) => Promise.resolve(fs.writeFileSync(p, d)),
                mkdir: (d: string, opts: any) => Promise.resolve(fs.mkdirSync(d, { recursive: opts.recursive })),
                getUserHomeDir: () => tmpDir,
            },
        }
        logger = { warn() {}, info() {}, error() {} }
    })

    afterEach(() => {
        fs.rmSync(tmpDir, { recursive: true, force: true })
    })

    it('creates a default persona and returns a wildcard-enabled map', async () => {
        const perms = await loadPersonaPermissions(workspace, logger, [])

        // Should have “*” entry with enabled=true and empty toolPerms
        expect(perms.has('*')).to.be.true
        const p = perms.get('*')!
        expect(p.enabled).to.be.true
        expect(p.toolPerms).to.deep.equal({})

        // The default file should have been written under ~/.aws/amazonq/personas/default.yaml
        const personaPath = getGlobalPersonaConfigPath(tmpDir)
        expect(fs.existsSync(personaPath)).to.be.true
        const content = fs.readFileSync(personaPath, 'utf-8')
        expect(content).to.contain('mcpServers')
    })
})

describe('persona path helpers', () => {
    it('getWorkspacePersonaConfigPaths()', () => {
        const uris = ['uri1', 'uri2']
        expect(getWorkspacePersonaConfigPaths(uris)).to.deep.equal([
            'uri1/.amazonq/personas/default.yaml',
            'uri2/.amazonq/personas/default.yaml',
        ])
    })

    it('getGlobalPersonaConfigPath()', () => {
        expect(getGlobalPersonaConfigPath('/home/me')).to.equal('/home/me/.aws/amazonq/personas/default.yaml')
    })
})

describe('enabledMCP', () => {
    it('should return true when client passes in mcp = true', () => {
        const params = {
            initializationOptions: {
                aws: {
                    awsClientCapabilities: {
                        q: {
                            mcp: true,
                        },
                    },
                },
            },
        }

        expect(enabledMCP(params as any)).to.equal(true)
    })
    it('should return false when client passes in mcp = false', () => {
        const params = {
            initializationOptions: {
                aws: {
                    awsClientCapabilities: {
                        q: {
                            mcp: false,
                        },
                    },
                },
            },
        }

        expect(enabledMCP(params as any)).to.equal(false)
    })
    it('should return false when client does not pass in mcp', () => {
        const params = {
            initializationOptions: {
                aws: {
                    clientInfo: {
                        extension: {
                            name: 'AmazonQ-For-VSCode',
                            version: '1.0.0-testPluginVersion',
                        },
                    },
                },
            },
        }

        expect(enabledMCP(params as any)).to.equal(false)
    })
})
