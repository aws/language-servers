/*!
 * Copyright Amazon.com, Inc. or its affiliates.
 * All Rights Reserved. SPDX-License-Identifier: Apache-2.0
 */

import { expect } from 'chai'
import * as sinon from 'sinon'
import { AGENT_TOOLS_CHANGED, MCP_SERVER_STATUS_CHANGED, McpManager } from './mcpManager'
import * as mcpUtils from './mcpUtils'
import type { MCPServerConfig, MCPServerPermissionUpdate } from './mcpTypes'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'

// Shared fakes
const fakeLogging = { log: () => {}, info: () => {}, warn: () => {}, error: () => {}, debug: () => {} }
const fakeWorkspace = {
    fs: {
        exists: (_: string) => Promise.resolve(false),
        readFile: (_: string) => Promise.resolve(Buffer.from('{}')),
        writeFile: (_: string, _d: string) => Promise.resolve(),
    },
    getUserHomeDir: () => '',
}
const features = { logging: fakeLogging, workspace: fakeWorkspace, lsp: {} } as any

// helper: stub initOneServer so it always registers one tool "tool1"
function stubInitOneServer() {
    return sinon.stub(McpManager.prototype as any, 'initOneServer' as any).callsFake(async function (
        this: any,
        ...args: any[]
    ) {
        const serverName = args[0] as string
        this.clients.set(serverName, new Client({ name: 'stub', version: '0.0.0' }))
        this.mcpTools.push({ serverName, toolName: 'tool1', description: 'desc', inputSchema: {} })
        ;(this as any).setState(serverName, 'ENABLED', 1)
    })
}

// init()
describe('init()', () => {
    let loadStub: sinon.SinonStub

    afterEach(async () => {
        sinon.restore()
        try {
            await McpManager.instance.close()
        } catch {}
    })

    it('returns the same instance', async () => {
        loadStub = sinon.stub(mcpUtils, 'loadMcpServerConfigs').resolves(new Map())
        const m1 = await McpManager.init([], features)
        const m2 = await McpManager.init([], features)
        expect(m1).to.equal(m2)
    })
})

// getAllTools()
describe('getAllTools()', () => {
    let loadStub: sinon.SinonStub

    afterEach(async () => {
        sinon.restore()
        try {
            await McpManager.instance.close()
        } catch {}
    })

    it('returns empty array when no servers', async () => {
        loadStub = sinon.stub(mcpUtils, 'loadMcpServerConfigs').resolves(new Map())
        const mgr = await McpManager.init([], features)
        expect(mgr.getAllTools()).to.be.an('array').that.is.empty
    })
})

// callTool()
describe('callTool()', () => {
    let loadStub: sinon.SinonStub
    let initOneStub: sinon.SinonStub
    let mutateStub: sinon.SinonStub
    let callToolStub: sinon.SinonStub

    const enabledCfg: MCPServerConfig = {
        command: 'c',
        args: [],
        env: {},
        disabled: false,
        autoApprove: false,
        toolOverrides: {},
        __configPath__: 'p.json',
    }

    beforeEach(() => {
        loadStub = sinon.stub(mcpUtils, 'loadMcpServerConfigs')
        initOneStub = stubInitOneServer()
        mutateStub = sinon.stub(McpManager.prototype as any, 'mutateConfigFile' as any).resolves()
        callToolStub = sinon.stub(Client.prototype as any, 'callTool' as any).resolves('ok' as any)
    })

    afterEach(async () => {
        sinon.restore()
        try {
            await McpManager.instance.close()
        } catch {}
    })

    it('throws when server is unknown', async () => {
        loadStub.resolves(new Map())
        const mgr = await McpManager.init([], features)
        try {
            await mgr.callTool('nope', 'foo', {})
            throw new Error('should have thrown')
        } catch (err: any) {
            expect(err).to.be.instanceOf(Error)
            expect(err.message).to.equal("MCP: server 'nope' is not configured")
        }
    })

    it('invokes underlying client.callTool', async () => {
        loadStub.resolves(new Map([['s1', enabledCfg]]))
        const mgr = await McpManager.init(['p.json'], features)
        ;(mgr as any).clients.set('s1', new Client({ name: 'x', version: 'v' }))

        const res = await mgr.callTool('s1', 'tool1', { foo: 1 })
        expect(callToolStub.calledOnceWith({ name: 'tool1', arguments: { foo: 1 } })).to.be.true
        expect(res).to.equal('ok')
    })

    it('times out and logs error', async () => {
        const timeoutCfg = { ...enabledCfg, timeout: 1 }
        loadStub.resolves(new Map([['s1', timeoutCfg]]))
        const mgr = await McpManager.init(['p.json'], features)

        callToolStub.resetBehavior()
        callToolStub.returns(new Promise(() => {}) as any)
        const spyErr = sinon.spy(fakeLogging, 'error')

        try {
            await mgr.callTool('s1', 'tool1', {})
            throw new Error('Expected callTool to throw on timeout')
        } catch (e: any) {
            expect(e.code).to.equal('MCPToolExecTimeout')
        }
        expect(spyErr.calledOnce).to.be.true
    })
})

// addServer()
describe('addServer()', () => {
    let loadStub: sinon.SinonStub
    let initOneStub: sinon.SinonStub
    let mutateStub: sinon.SinonStub

    beforeEach(() => {
        loadStub = sinon.stub(mcpUtils, 'loadMcpServerConfigs')
        initOneStub = stubInitOneServer()
        mutateStub = sinon.stub(McpManager.prototype as any, 'mutateConfigFile' as any).resolves()
    })

    afterEach(async () => {
        sinon.restore()
        try {
            await McpManager.instance.close()
        } catch {}
    })

    it('persists config and initializes', async () => {
        loadStub.resolves(new Map())
        const mgr = await McpManager.init([], features)
        const newCfg: MCPServerConfig = {
            command: 'c2',
            args: ['a'],
            env: { X: '1' },
            disabled: false,
            autoApprove: true,
            toolOverrides: {},
            __configPath__: 'path.json',
        }
        await mgr.addServer('newS', newCfg, 'path.json')
        expect(mutateStub.calledOnce).to.be.true
        expect(initOneStub.calledWith('newS', newCfg)).to.be.true
    })
})

// removeServer()
describe('removeServer()', () => {
    let loadStub: sinon.SinonStub
    let mutateStub: sinon.SinonStub

    beforeEach(() => {
        loadStub = sinon.stub(mcpUtils, 'loadMcpServerConfigs')
        mutateStub = sinon.stub(McpManager.prototype as any, 'mutateConfigFile' as any).resolves()
    })

    afterEach(async () => {
        sinon.restore()
        try {
            await McpManager.instance.close()
        } catch {}
    })

    it('shuts client and cleans state', async () => {
        loadStub.resolves(new Map())
        const mgr = await McpManager.init([], features)
        const dummy = new Client({ name: 'c', version: 'v' })
        ;(mgr as any).clients.set('x', dummy)
        ;(mgr as any).mcpServers.set('x', {
            command: '',
            args: [],
            env: {},
            disabled: false,
            autoApprove: false,
            toolOverrides: {},
            __configPath__: 'c.json',
        } as MCPServerConfig)
        await mgr.removeServer('x')
        expect(mutateStub.calledOnce).to.be.true
        expect((mgr as any).clients.has('x')).to.be.false
    })
})

// updateServer()
describe('updateServer()', () => {
    let loadStub: sinon.SinonStub
    let initOneStub: sinon.SinonStub
    let mutateStub: sinon.SinonStub

    beforeEach(() => {
        loadStub = sinon.stub(mcpUtils, 'loadMcpServerConfigs')
        initOneStub = stubInitOneServer()
        mutateStub = sinon.stub(McpManager.prototype as any, 'mutateConfigFile' as any).resolves()
    })

    afterEach(async () => {
        sinon.restore()
        try {
            await McpManager.instance.close()
        } catch {}
    })

    it('re‑initializes when toggling autoApprove', async () => {
        const oldCfg: MCPServerConfig = {
            command: 'cmd',
            args: [],
            env: {},
            disabled: false,
            autoApprove: false,
            toolOverrides: {},
            __configPath__: 'u.json',
        }
        loadStub.resolves(new Map([['u1', oldCfg]]))
        await McpManager.init([], features)
        const mgr = McpManager.instance
        const fakeClient = new Client({ name: 'c', version: 'v' })
        ;(mgr as any).clients.set('u1', fakeClient)

        const closeStub = sinon.stub(fakeClient, 'close').resolves()
        initOneStub.resetHistory()
        mutateStub.resetHistory()

        await mgr.updateServer('u1', { autoApprove: true })
        expect(mutateStub.calledOnce).to.be.true
        expect(closeStub.calledOnce).to.be.true
        expect(initOneStub.calledOnce).to.be.true
    })

    it('handles disable/enable cycle', async () => {
        const cfg: MCPServerConfig = {
            command: 'cmd2',
            args: [],
            env: {},
            disabled: false,
            autoApprove: false,
            toolOverrides: {},
            __configPath__: 'd.json',
        }
        loadStub.resolves(new Map([['d1', cfg]]))
        await McpManager.init([], features)
        const mgr = McpManager.instance
        const fakeClient = new Client({ name: 'c2', version: 'v2' })
        ;(mgr as any).clients.set('d1', fakeClient)
        const closeStub = sinon.stub(fakeClient, 'close').resolves()

        initOneStub.resetHistory()
        mutateStub.resetHistory()
        await mgr.updateServer('d1', { disabled: true })
        expect(closeStub.calledOnce).to.be.true
        expect(initOneStub.notCalled).to.be.true

        mutateStub.resetHistory()
        initOneStub.resetHistory()
        await mgr.updateServer('d1', { disabled: false })
        expect(initOneStub.calledOnce).to.be.true
    })

    it('merges toolOverrides correctly', async () => {
        const cfg: MCPServerConfig = {
            command: 'cmd3',
            args: [],
            env: {},
            disabled: false,
            autoApprove: false,
            toolOverrides: { toolA: { autoApprove: false } },
            __configPath__: 'o.json',
        }
        loadStub.resolves(new Map([['o1', cfg]]))
        await McpManager.init([], features)
        const mgr = McpManager.instance

        await mgr.updateServer('o1', { toolOverrides: { toolA: { autoApprove: true } } })
        expect(mutateStub.calledOnce).to.be.true
        const updated = (mgr as any).mcpServers.get('o1')!
        expect(updated.toolOverrides.toolA.autoApprove).to.be.true
    })
})

// requiresApproval()
describe('requiresApproval()', () => {
    let loadStub: sinon.SinonStub

    afterEach(async () => {
        sinon.restore()
        try {
            await McpManager.instance.close()
        } catch {}
    })

    it('returns true for unknown server', async () => {
        loadStub = sinon.stub(mcpUtils, 'loadMcpServerConfigs').resolves(new Map())
        const mgr = await McpManager.init([], features)
        expect(mgr.requiresApproval('x', 'y')).to.be.true
    })

    it('honours server autoApprove', async () => {
        const cfg: MCPServerConfig = {
            command: 'c',
            args: [],
            env: {},
            disabled: false,
            autoApprove: false,
            toolOverrides: {},
            __configPath__: 'p',
        }
        loadStub = sinon.stub(mcpUtils, 'loadMcpServerConfigs').resolves(new Map([['s', cfg]]))
        await McpManager.init(['p'], features)
        expect(McpManager.instance.requiresApproval('s', 'foo')).to.be.true
        ;(McpManager.instance as any).mcpServers.set('s', { ...cfg, autoApprove: true })
        expect(McpManager.instance.requiresApproval('s', 'foo')).to.be.false
    })

    it('tool override beats server setting', async () => {
        const cfg: MCPServerConfig = {
            command: 'c',
            args: [],
            env: {},
            disabled: false,
            autoApprove: true,
            toolOverrides: { foo: { autoApprove: false } },
            __configPath__: 'p',
        }
        loadStub = sinon.stub(mcpUtils, 'loadMcpServerConfigs').resolves(new Map([['s', cfg]]))
        await McpManager.init(['p'], features)
        expect(McpManager.instance.requiresApproval('s', 'foo')).to.be.true
        expect(McpManager.instance.requiresApproval('s', 'bar')).to.be.false
    })
})

// getAllServerConfigs()
describe('getAllServerConfigs()', () => {
    let loadStub: sinon.SinonStub

    afterEach(async () => {
        sinon.restore()
        try {
            await McpManager.instance.close()
        } catch {}
    })

    it('returns snapshot', async () => {
        const cfg: MCPServerConfig = {
            command: 'cmd',
            args: [],
            env: {},
            disabled: false,
            autoApprove: true,
            toolOverrides: {},
            __configPath__: 'cfg.json',
        }
        loadStub = sinon.stub(mcpUtils, 'loadMcpServerConfigs').resolves(new Map([['srv', cfg]]))
        const mgr = await McpManager.init(['cfg.json'], features)
        const snap = mgr.getAllServerConfigs()
        expect(snap.get('srv')).to.deep.equal(cfg)
        snap.delete('srv')
        expect(mgr.getAllServerConfigs().has('srv')).to.be.true
    })
})

// getServerState / getAllServerStates()
function createStateStubs() {
    const loadStub = sinon.stub(mcpUtils, 'loadMcpServerConfigs')
    const initOneStub = stubInitOneServer()
    return { loadStub, initOneStub }
}

describe('getServerState()', () => {
    afterEach(async () => {
        sinon.restore()
        try {
            await McpManager.instance.close()
        } catch {}
    })

    it('returns runtime info', async () => {
        const { loadStub } = createStateStubs()
        const cfg: MCPServerConfig = {
            command: 'c',
            args: [],
            env: {},
            disabled: false,
            autoApprove: false,
            toolOverrides: {},
            __configPath__: 'state.json',
        }
        loadStub.resolves(new Map([['srv', cfg]]))
        const mgr = await McpManager.init(['state.json'], features)
        expect(mgr.getServerState('srv')).to.deep.include({ status: 'ENABLED', toolsCount: 1 })
    })
})

describe('getAllServerStates()', () => {
    afterEach(async () => {
        sinon.restore()
        try {
            await McpManager.instance.close()
        } catch {}
    })

    it('returns a map with info', async () => {
        const { loadStub } = createStateStubs()
        const cfg: MCPServerConfig = {
            command: 'c',
            args: [],
            env: {},
            disabled: false,
            autoApprove: false,
            toolOverrides: {},
            __configPath__: 'state.json',
        }
        loadStub.resolves(new Map([['srv', cfg]]))
        const mgr = await McpManager.init(['state.json'], features)
        const map = mgr.getAllServerStates()
        expect(map.get('srv')).to.deep.include({ status: 'ENABLED', toolsCount: 1 })
    })
})

// getEnabledTools()
describe('getEnabledTools()', () => {
    let loadStub: sinon.SinonStub
    let initOneStub: sinon.SinonStub

    beforeEach(() => {
        loadStub = sinon.stub(mcpUtils, 'loadMcpServerConfigs')
        initOneStub = stubInitOneServer()
    })

    afterEach(async () => {
        sinon.restore()
        try {
            await McpManager.instance.close()
        } catch {}
    })

    it('excludes disabled tool overrides', async () => {
        const cfg: MCPServerConfig = {
            command: 'c',
            args: [],
            env: {},
            disabled: false,
            autoApprove: false,
            toolOverrides: { tool1: { disabled: true } },
            __configPath__: 't.json',
        }
        loadStub.resolves(new Map([['srv', cfg]]))
        const mgr = await McpManager.init(['t.json'], features)
        expect(mgr.getAllTools()).to.have.length(1)
        expect(mgr.getEnabledTools()).to.be.empty
    })

    it('server-level permission change (enabled->disabled)', async () => {
        const cfg = {
            command: 'c',
            args: [],
            env: {},
            disabled: false,
            autoApprove: false,
            toolOverrides: {},
            __configPath__: 'srv.json',
        } as MCPServerConfig
        loadStub.resolves(new Map([['srv', cfg]]))
        const mgr = await McpManager.init(['srv.json'], features)
        const client = new Client({ name: 'x', version: 'v' })
        ;(mgr as any).clients.set('srv', client)
        ;(mgr as any).mcpTools.push({ serverName: 'srv', toolName: 'tool1', description: '', inputSchema: {} })

        const statusEvents: any[] = []
        mgr.events.on(MCP_SERVER_STATUS_CHANGED, (_, s) => statusEvents.push(s))
        const toolsEvents: any[] = []
        mgr.events.on(AGENT_TOOLS_CHANGED, (_, t) => toolsEvents.push(t))

        const closeSpy = sinon.spy(client, 'close')
        await mgr.updateServerPermission('srv', { disabled: true } as MCPServerPermissionUpdate)

        expect(closeSpy.calledOnce).to.be.true
        expect(statusEvents).to.deep.equal([{ status: 'DISABLED', toolsCount: 0, lastError: undefined }])
        expect(toolsEvents).to.deep.equal([[]])
    })

    it('server-level permission change (disabled->enabled)', async () => {
        const cfg = {
            command: 'c',
            args: [],
            env: {},
            disabled: true,
            autoApprove: false,
            toolOverrides: {},
            __configPath__: 'srv2.json',
        } as MCPServerConfig
        loadStub.resolves(new Map([['srv2', cfg]]))
        const mgr = await McpManager.init([], features)
        ;(mgr as any).mcpServers.set('srv2', cfg)

        await mgr.updateServerPermission('srv2', { disabled: false } as MCPServerPermissionUpdate)
        expect(initOneStub.calledOnceWith('srv2')).to.be.true
    })

    it('disables individual tool-level permission and filters tool list', async () => {
        const cfg = {
            command: 'c',
            args: [],
            env: {},
            disabled: false,
            autoApprove: false,
            toolOverrides: {},
            __configPath__: 'srv3.json',
        } as MCPServerConfig
        loadStub.resolves(new Map([['srv3', cfg]]))
        const mgr = await McpManager.init(['srv3.json'], features)
        ;(mgr as any).mcpTools = [{ serverName: 'srv3', toolName: 'toolA', description: '', inputSchema: {} }]

        const toolsEvents: any[] = []
        mgr.events.on(AGENT_TOOLS_CHANGED, (_, t) => toolsEvents.push(t))
        await mgr.updateServerPermission('srv3', { toolOverrides: { toolA: { disabled: true } } })

        expect(toolsEvents[0]).to.deep.equal([])
    })

    it('re-enables individual tool-level permission and restores tool', async () => {
        const cfg = {
            command: 'c',
            args: [],
            env: {},
            disabled: false,
            autoApprove: false,
            toolOverrides: { toolB: { disabled: true } },
            __configPath__: 'srv4.json',
        } as MCPServerConfig
        loadStub.resolves(new Map([['srv4', cfg]]))
        const mgr = await McpManager.init(['srv4.json'], features)
        ;(mgr as any).mcpTools = [{ serverName: 'srv4', toolName: 'toolB', description: '', inputSchema: {} }]

        const toolsEvents: any[] = []
        mgr.events.on(AGENT_TOOLS_CHANGED, (_, t) => toolsEvents.push(t))
        await mgr.updateServerPermission('srv4', { toolOverrides: { toolB: { disabled: false } } })

        expect(toolsEvents[0]).to.deep.equal([
            { serverName: 'srv4', toolName: 'toolB', description: '', inputSchema: {} },
        ])
    })
})

// getAllToolsWithStates()
describe('getAllToolsWithStates()', () => {
    let loadStub: sinon.SinonStub
    let initOneStub: sinon.SinonStub
    let mgr: McpManager

    const cfg: MCPServerConfig = {
        command: 'c',
        args: [],
        env: {},
        disabled: false,
        autoApprove: false,
        toolOverrides: {},
        __configPath__: 'p.json',
    }

    beforeEach(async () => {
        loadStub = sinon.stub(mcpUtils, 'loadMcpServerConfigs')
        initOneStub = stubInitOneServer()
        loadStub.resolves(new Map([['s1', cfg]]))
        mgr = await McpManager.init(['p.json'], features)
    })

    afterEach(async () => {
        sinon.restore()
        try {
            await McpManager.instance.close()
        } catch {}
    })

    it('reports disable & approval flags', () => {
        const [info] = mgr.getAllToolsWithStates()
        expect(info.disabled).to.be.false
        expect(info.requiresApproval).to.be.true
        ;(mgr as any).mcpServers.get('s1')!.toolOverrides = { tool1: { disabled: true } }
        expect(mgr.getAllToolsWithStates()[0].disabled).to.be.true
    })

    it('honours serverFilter', () => {
        ;(mgr as any).mcpTools.push({ serverName: 's2', toolName: 'foo', description: '', inputSchema: {} })
        expect(mgr.getAllToolsWithStates()).to.have.length(2)
        expect(mgr.getAllToolsWithStates('s1')).to.have.length(1)
        expect(mgr.getAllToolsWithStates('s2')).to.have.length(1)
    })
})

// close()
describe('close()', () => {
    let loadStub: sinon.SinonStub

    afterEach(() => sinon.restore())

    it('shuts all clients and resets singleton', async () => {
        loadStub = sinon.stub(mcpUtils, 'loadMcpServerConfigs').resolves(new Map())
        await McpManager.init([], features)
        const mgr = McpManager.instance

        const c1 = new Client({ name: 'c1', version: 'v' })
        const c2 = new Client({ name: 'c2', version: 'v' })
        const s1 = sinon.spy(c1, 'close')
        const s2 = sinon.spy(c2, 'close')
        ;(mgr as any).clients.set('a', c1)
        ;(mgr as any).clients.set('b', c2)

        await mgr.close()
        expect(s1.calledOnce).to.be.true
        expect(s2.calledOnce).to.be.true
        expect(() => McpManager.instance).to.throw()
    })
})

// reinitializeMcpServers()
describe('reinitializeMcpServers()', () => {
    let loadStub: sinon.SinonStub

    beforeEach(() => {
        loadStub = sinon.stub(mcpUtils, 'loadMcpServerConfigs')
    })

    afterEach(async () => {
        sinon.restore()
        try {
            await McpManager.instance.close()
        } catch {}
    })

    it('calls necessary methods during reinitialization', async () => {
        const cfg: MCPServerConfig = {
            command: 'cmd',
            args: [],
            env: {},
            disabled: false,
            autoApprove: false,
            toolOverrides: {},
            __configPath__: 'cfg.json',
        }
        loadStub.resolves(new Map([['srv', cfg]]))

        const mgr = await McpManager.init(['cfg.json'], features)

        const closeStub = sinon.stub(mgr, 'close').resolves()
        const initStub = sinon.stub(McpManager, 'init').resolves(mgr)

        loadStub.resetHistory()

        await mgr.reinitializeMcpServers()

        expect(closeStub.calledOnce).to.be.true
        expect(initStub.calledOnce).to.be.true
        expect(initStub.firstCall.args[0]).to.deep.equal(['cfg.json'])
        expect(initStub.firstCall.args[1]).to.equal(features)

        closeStub.restore()
        initStub.restore()
    })
})
