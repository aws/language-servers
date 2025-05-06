/*!
 * Copyright Amazon.com, Inc. or its affiliates.
 * All Rights Reserved. SPDX-License-Identifier: Apache-2.0
 */

import { expect } from 'chai'
import * as sinon from 'sinon'
import { McpManager } from './mcpManager'
import * as mcpUtils from './mcpUtils'
import type { MCPServerConfig } from './mcpTypes'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'

describe('McpManager (singleton & empty-config)', () => {
    const fakeLogging = { log: () => {}, info: () => {}, warn: () => {}, error: () => {}, debug: () => {} }
    const fakeWorkspace = {
        fs: {
            exists: (_: string) => Promise.resolve(false),
            readFile: (_: string) => Promise.resolve(Buffer.from('')),
            writeFile: (_path: string, _data: string) => Promise.resolve(),
        },
        getUserHomeDir: () => '',
    }
    const features = { logging: fakeLogging, workspace: fakeWorkspace, lsp: {} } as any

    afterEach(async () => {
        sinon.restore()
        try {
            await McpManager.instance.close()
        } catch {}
    })

    it('init() always returns the same instance', async () => {
        sinon.stub(mcpUtils, 'loadMcpServerConfigs').resolves(new Map())
        const m1 = await McpManager.init([], features)
        const m2 = await McpManager.init([], features)
        expect(m1).to.equal(m2)
    })

    it('with no config paths it discovers zero tools', async () => {
        sinon.stub(mcpUtils, 'loadMcpServerConfigs').resolves(new Map())
        const mgr = await McpManager.init([], features)
        expect(mgr.getAllTools()).to.be.an('array').that.is.empty
    })

    it('callTool() on non-existent server throws', async () => {
        sinon.stub(mcpUtils, 'loadMcpServerConfigs').resolves(new Map())
        const mgr = await McpManager.init([], features)
        try {
            await mgr.callTool('nope', 'foo', {})
            throw new Error('Expected callTool to throw for non-existent server')
        } catch (err: any) {
            expect(err).to.be.instanceOf(Error)
            expect(err.message).to.equal("MCP: server 'nope' is not configured")
        }
    })
})

describe('McpManager additional methods', () => {
    let loadStub: sinon.SinonStub
    let initOneStub: sinon.SinonStub
    let mutateStub: sinon.SinonStub
    let callToolStub: sinon.SinonStub

    const fakeLogging = { log: () => {}, info: () => {}, warn: () => {}, error: () => {}, debug: () => {} }
    const fakeWorkspace = {
        fs: {
            exists: (_: string) => Promise.resolve(true),
            readFile: (_: string) => Promise.resolve(Buffer.from('{}')),
            writeFile: (_path: string, _data: string) => Promise.resolve(),
        },
        getUserHomeDir: () => '',
    }
    const features = { logging: fakeLogging, workspace: fakeWorkspace, lsp: {} } as any

    beforeEach(() => {
        loadStub = sinon.stub(mcpUtils, 'loadMcpServerConfigs')
        initOneStub = sinon.stub(McpManager.prototype as any, 'initOneServer' as any).callsFake(async function (
            this: any,
            ...args: any[]
        ) {
            const serverName = args[0] as string
            this.clients.set(serverName, new Client({ name: 'stub', version: '0.0.0' }))
            this.mcpTools.push({ serverName, toolName: 'tool1', description: 'desc', inputSchema: {} as any })
        })
        mutateStub = sinon.stub(McpManager.prototype as any, 'mutateConfigFile' as any).resolves()
        callToolStub = sinon.stub(Client.prototype as any, 'callTool' as any).resolves('ok' as any)
    })

    afterEach(async () => {
        sinon.restore()
        try {
            await McpManager.instance.close()
        } catch {}
    })

    it('discovers and lists tools for enabled servers', async () => {
        const cfg = {
            command: 'c',
            args: [],
            env: {},
            disabled: false,
            autoApprove: false,
            toolOverrides: {},
            __configPath__: 'p.json',
        } as MCPServerConfig
        loadStub.resolves(new Map([['s1', cfg]]))

        const mgr = await McpManager.init(['p.json'], features)
        expect(initOneStub.calledOnceWith('s1', cfg)).to.be.true
        expect(mgr.getAllTools()).to.deep.equal([
            { serverName: 's1', toolName: 'tool1', description: 'desc', inputSchema: {} },
        ])
        expect(mgr.listServersAndTools()).to.deep.equal({ s1: ['tool1'] })
    })

    it('callTool invokes client.callTool correctly', async () => {
        const cfg = {
            command: 'c',
            args: [],
            env: {},
            disabled: false,
            autoApprove: false,
            toolOverrides: {},
            __configPath__: 'p.json',
        } as MCPServerConfig
        loadStub.resolves(new Map([['s1', cfg]]))

        const mgr = await McpManager.init(['p.json'], features)
        ;(mgr as any).clients.set('s1', new Client({ name: 'x', version: 'v' }))

        const result = await mgr.callTool('s1', 'tool1', { foo: 1 })
        expect(callToolStub.calledOnceWith({ name: 'tool1', arguments: { foo: 1 } })).to.be.true
        expect(result).to.equal('ok')
    })

    it('addServer persists config and initializes new server', async () => {
        loadStub.resolves(new Map())
        const mgr = await McpManager.init([], features)
        const newCfg = {
            command: 'c2',
            args: ['a'],
            env: { X: '1' },
            disabled: false,
            autoApprove: true,
            toolOverrides: {},
            __configPath__: 'path.json',
        } as MCPServerConfig

        await mgr.addServer('newS', newCfg, 'path.json')
        expect(mutateStub.calledOnce).to.be.true
        expect(initOneStub.calledWith('newS', newCfg)).to.be.true
        expect(mgr.listServersAndTools()).to.have.property('newS')
    })

    it('removeServer shuts down client and cleans state', async () => {
        loadStub.resolves(new Map())
        const mgr = await McpManager.init([], features)
        const dummyClient = new Client({ name: 'c', version: 'v' })
        const cfg = {
            command: '',
            args: [],
            env: {},
            disabled: false,
            autoApprove: false,
            toolOverrides: {},
            __configPath__: 'cfg.json',
        } as MCPServerConfig
        ;(mgr as any).clients.set('s2', dummyClient)
        ;(mgr as any).mcpServers.set('s2', cfg)
        ;(mgr as any).mcpTools.push({ serverName: 's2', toolName: 't', description: '', inputSchema: {} })

        await mgr.removeServer('s2')
        expect(mutateStub.calledOnce).to.be.true
        expect((mgr as any).clients.has('s2')).to.be.false
        expect((mgr as any).mcpServers.has('s2')).to.be.false
        expect(mgr.getAllTools()).to.be.empty
    })

    it('updateServer toggles autoApprove and re-initializes server', async () => {
        const oldCfg = {
            command: 'cmd',
            args: [],
            env: {},
            disabled: false,
            autoApprove: false,
            toolOverrides: {},
            __configPath__: 'u.json',
        } as MCPServerConfig
        loadStub.resolves(new Map([['u1', oldCfg]]))
        await McpManager.init([], features)
        const mgr = McpManager.instance

        const fakeClient = new Client({ name: 'c', version: 'v' })
        ;(mgr as any).clients.set('u1', fakeClient)
        ;(mgr as any).mcpTools.push({ serverName: 'u1', toolName: 't1', description: 'd', inputSchema: {} })

        initOneStub.resetHistory()
        mutateStub.resetHistory()
        const closeSpy = sinon.spy(fakeClient, 'close')

        await mgr.updateServer('u1', { autoApprove: true })
        expect(mutateStub.calledOnce).to.be.true
        expect(closeSpy.calledOnce).to.be.true
        expect(initOneStub.calledOnce).to.be.true

        const updated = (mgr as any).mcpServers.get('u1')!
        expect(updated.autoApprove).to.be.true
    })

    it('updateServer disables and re-enables server correctly', async () => {
        const cfg = {
            command: 'cmd2',
            args: [],
            env: {},
            disabled: false,
            autoApprove: false,
            toolOverrides: {},
            __configPath__: 'd.json',
        } as MCPServerConfig
        loadStub.resolves(new Map([['d1', cfg]]))
        await McpManager.init([], features)
        const mgr = McpManager.instance

        const fakeClient2 = new Client({ name: 'c2', version: 'v2' })
        ;(mgr as any).clients.set('d1', fakeClient2)
        ;(mgr as any).mcpTools.push({ serverName: 'd1', toolName: 't2', description: 'd2', inputSchema: {} })

        initOneStub.resetHistory()
        mutateStub.resetHistory()
        const closeSpy2 = sinon.spy(fakeClient2, 'close')

        // Disable
        await mgr.updateServer('d1', { disabled: true })
        expect(mutateStub.calledOnce).to.be.true
        expect(closeSpy2.calledOnce).to.be.true
        expect(initOneStub.notCalled).to.be.true
        expect((mgr as any).clients.has('d1')).to.be.false
        expect(mgr.getAllTools().every(t => t.serverName !== 'd1')).to.be.true

        // Re-enable
        mutateStub.resetHistory()
        initOneStub.resetHistory()
        await mgr.updateServer('d1', { disabled: false })
        expect(mutateStub.calledOnce).to.be.true
        expect(initOneStub.calledOnceWith('d1', sinon.match.object)).to.be.true
    })

    it('updateServer merges toolOverrides in config correctly', async () => {
        const initialOverrides = { toolA: { autoApprove: false } }
        const cfg = {
            command: 'cmd3',
            args: [],
            env: {},
            disabled: false,
            autoApprove: false,
            toolOverrides: initialOverrides,
            __configPath__: 'o.json',
        } as MCPServerConfig
        loadStub.resolves(new Map([['o1', cfg]]))
        await McpManager.init([], features)
        const mgr = McpManager.instance

        initOneStub.resetHistory()
        mutateStub.resetHistory()

        const newOverrides = { toolA: { autoApprove: true } }
        await mgr.updateServer('o1', { toolOverrides: newOverrides })
        expect(mutateStub.calledOnce).to.be.true

        const updated = (mgr as any).mcpServers.get('o1')!
        expect(updated.toolOverrides.toolA.autoApprove).to.be.true
    })

    describe('requiresApproval()', () => {
        it('requires approval when server not configured', async () => {
            loadStub.resolves(new Map())
            const mgr = await McpManager.init([], features)
            expect(mgr.requiresApproval('unknown', 'anyTool')).to.be.true
        })

        it('uses server.autoApprove when no toolOverride', async () => {
            const cfg = {
                command: 'c',
                args: [],
                env: {},
                disabled: false,
                autoApprove: false,
                toolOverrides: {},
                __configPath__: 'p',
            } as MCPServerConfig
            loadStub.resolves(new Map([['s', cfg]]))
            await McpManager.init(['p'], features)

            // server default = false → require approval
            expect(McpManager.instance.requiresApproval('s', 'foo')).to.be.true

            // flip server autoApprove to true in-memory
            ;(McpManager.instance as any).mcpServers.set('s', { ...cfg, autoApprove: true })
            expect(McpManager.instance.requiresApproval('s', 'foo')).to.be.false
        })

        it('toolOverrides.autoApprove overrides server setting', async () => {
            const cfg = {
                command: 'c',
                args: [],
                env: {},
                disabled: false,
                autoApprove: true,
                toolOverrides: { foo: { autoApprove: false } },
                __configPath__: 'p',
            } as MCPServerConfig
            loadStub.resolves(new Map([['s', cfg]]))
            await McpManager.init(['p'], features)

            // override for 'foo' = false → require approval
            expect(McpManager.instance.requiresApproval('s', 'foo')).to.be.true
            // other tools fall back to server default true → no approval
            expect(McpManager.instance.requiresApproval('s', 'bar')).to.be.false
        })
    })

    it('getAllServerConfigs returns a snapshot of configs', async () => {
        const cfg = {
            command: 'cmd',
            args: [],
            env: {},
            disabled: false,
            autoApprove: true,
            toolOverrides: {},
            __configPath__: 'cfg.json',
        } as MCPServerConfig
        loadStub.resolves(new Map([['srv', cfg]]))
        const mgr = await McpManager.init(['cfg.json'], features)

        const snapshot = mgr.getAllServerConfigs()
        expect(snapshot).to.be.instanceOf(Map)
        expect(snapshot.get('srv')).to.deep.equal(cfg)

        // Mutating the returned map should NOT affect the manager’s internal state
        snapshot.delete('srv')
        const again = mgr.getAllServerConfigs()
        expect(again.has('srv')).to.be.true
    })

    it('listServersAndTools skips servers that have no tools', async () => {
        const cfg = {
            command: 'cmd',
            args: [],
            env: {},
            disabled: true,
            autoApprove: true,
            toolOverrides: {},
            __configPath__: 'p.json',
        } as MCPServerConfig
        loadStub.resolves(new Map([['emptySrv', cfg]]))

        const mgr = await McpManager.init(['p.json'], features)
        expect(mgr.listServersAndTools()).to.deep.equal({})
    })
})

describe('McpManager close()', () => {
    it('shuts all clients and resets singleton', async () => {
        const fakeLogging = { log: () => {}, info: () => {}, warn: () => {}, error: () => {}, debug: () => {} }
        const fakeWorkspace = {
            fs: {
                exists: (_: string) => Promise.resolve(false),
                readFile: (_: string) => Promise.resolve(Buffer.from('')),
                writeFile: (_path: string, _data: string) => Promise.resolve(),
            },
            getUserHomeDir: () => '',
        }
        const features = { logging: fakeLogging, workspace: fakeWorkspace, lsp: {} } as any

        sinon.stub(mcpUtils, 'loadMcpServerConfigs').resolves(new Map())
        await McpManager.init([], features)
        const mgr = McpManager.instance

        const c1 = new Client({ name: 'c1', version: 'v' })
        const c2 = new Client({ name: 'c2', version: 'v' })
        const spy1 = sinon.spy(c1, 'close')
        const spy2 = sinon.spy(c2, 'close')
        ;(mgr as any).clients.set('a', c1)
        ;(mgr as any).clients.set('b', c2)

        await mgr.close()
        expect(spy1.calledOnce).to.be.true
        expect(spy2.calledOnce).to.be.true
        expect(() => McpManager.instance).to.throw(Error, 'not initialized')
    })
})
