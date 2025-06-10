/*!
 * Copyright Amazon.com, Inc. or its affiliates.
 * All Rights Reserved. SPDX-License-Identifier: Apache-2.0
 */

import { expect } from 'chai'
import * as sinon from 'sinon'
import { AGENT_TOOLS_CHANGED, MCP_SERVER_STATUS_CHANGED, McpManager } from './mcpManager'
import * as mcpUtils from './mcpUtils'
import { McpPermissionType, McpServerStatus, type MCPServerConfig, type MCPServerPermission } from './mcpTypes'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'

const fakeLogging = {
    log: () => {},
    info: () => {},
    warn: () => {},
    error: () => {},
    debug: () => {},
}
const fakeWorkspace = {
    fs: {
        exists: (_: string) => Promise.resolve(false),
        readFile: (_: string) => Promise.resolve(Buffer.from('{}')),
        writeFile: (_: string, _d: string) => Promise.resolve(),
        getUserHomeDir: () => '',
        mkdir: (_: string, __: any) => Promise.resolve(),
    },
    getUserHomeDir: () => '',
}
const features = { logging: fakeLogging, workspace: fakeWorkspace, lsp: {} } as any

function stubPersonaAllow(): sinon.SinonStub {
    const map = new Map<string, MCPServerPermission>([
        ['*', { enabled: true, toolPerms: {}, __configPath__: '/tmp/p.yaml' }],
    ])
    return sinon.stub(mcpUtils, 'loadPersonaPermissions').resolves(map)
}

function stubInitOneServer(): sinon.SinonStub {
    return sinon.stub(McpManager.prototype as any, 'initOneServer' as keyof McpManager).callsFake(async function (
        this: any,
        ...args: any[]
    ) {
        const serverName = args[0] as string
        this.clients.set(serverName, new Client({ name: 'stub', version: '0.0.0' }))
        this.mcpTools.push({
            serverName,
            toolName: 'tool1',
            description: 'desc',
            inputSchema: {},
        })
        ;(this as any).setState(serverName, 'ENABLED', 1)
    })
}

describe('init()', () => {
    let loadStub: sinon.SinonStub

    afterEach(async () => {
        sinon.restore()
        try {
            await McpManager.instance.close()
        } catch {}
    })

    it('returns the same instance', async () => {
        loadStub = sinon.stub(mcpUtils, 'loadMcpServerConfigs').resolves({ servers: new Map(), errors: new Map() })
        stubPersonaAllow()

        const m1 = await McpManager.init([], [], features)
        const m2 = await McpManager.init([], [], features)
        expect(m1).to.equal(m2)
    })
})

describe('getAllTools()', () => {
    let loadStub: sinon.SinonStub

    afterEach(async () => {
        sinon.restore()
        try {
            await McpManager.instance.close()
        } catch {}
    })

    it('returns empty array when no servers', async () => {
        loadStub = sinon.stub(mcpUtils, 'loadMcpServerConfigs').resolves({ servers: new Map(), errors: new Map() })
        stubPersonaAllow()

        const mgr = await McpManager.init([], [], features)
        expect(mgr.getAllTools()).to.be.an('array').that.is.empty
    })
})

describe('callTool()', () => {
    let loadStub: sinon.SinonStub
    let initOneStub: sinon.SinonStub
    let mutateStub: sinon.SinonStub
    let callToolStub: sinon.SinonStub

    const enabledCfg: MCPServerConfig = {
        command: 'c',
        args: [],
        env: {},
        timeout: 0,
        __configPath__: 'p.json',
    }

    beforeEach(() => {
        loadStub = sinon.stub(mcpUtils, 'loadMcpServerConfigs')
        stubPersonaAllow()
        initOneStub = stubInitOneServer()
        mutateStub = sinon.stub(McpManager.prototype as any, 'mutateConfigFile' as keyof McpManager).resolves()
        callToolStub = sinon.stub(Client.prototype as any, 'callTool' as any).resolves('ok' as any)
    })

    afterEach(async () => {
        sinon.restore()
        try {
            await McpManager.instance.close()
        } catch {}
    })

    it('throws when server is unknown', async () => {
        loadStub.resolves({ servers: new Map(), errors: new Map() })
        const mgr = await McpManager.init([], [], features)

        try {
            await mgr.callTool('nope', 'foo', {})
            throw new Error('should have thrown')
        } catch (err: any) {
            expect(err.message).to.equal("MCP: server 'nope' is not configured")
        }
    })

    it('invokes underlying client.callTool', async () => {
        loadStub.resolves({ servers: new Map([['s1', enabledCfg]]), errors: new Map() })
        const mgr = await McpManager.init(['p.json'], [], features)
        ;(mgr as any).clients.set('s1', new Client({ name: 'x', version: 'v' }))

        const res = await mgr.callTool('s1', 'tool1', { foo: 1 })
        expect(callToolStub.calledOnceWith({ name: 'tool1', arguments: { foo: 1 } })).to.be.true
        expect(res).to.equal('ok')
    })

    it('times out and logs error', async () => {
        const timeoutCfg = { ...enabledCfg, timeout: 1 }
        loadStub.resolves({ servers: new Map([['s1', timeoutCfg]]), errors: new Map() })
        const mgr = await McpManager.init(['p.json'], [], features)

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

describe('addServer()', () => {
    let loadStub: sinon.SinonStub
    let initOneStub: sinon.SinonStub
    let mutateStub: sinon.SinonStub

    beforeEach(() => {
        loadStub = sinon.stub(mcpUtils, 'loadMcpServerConfigs')
        stubPersonaAllow()
        initOneStub = stubInitOneServer()
        mutateStub = sinon.stub(McpManager.prototype as any, 'mutateConfigFile' as keyof McpManager).resolves()
        sinon.stub(McpManager.prototype as any, 'mutatePersonaFile' as keyof McpManager).resolves()
    })

    afterEach(async () => {
        sinon.restore()
        try {
            await McpManager.instance.close()
        } catch {}
    })

    it('persists config and initializes', async () => {
        loadStub.resolves({ servers: new Map(), errors: new Map() })
        const mgr = await McpManager.init([], [], features)
        const newCfg: MCPServerConfig = {
            command: 'c2',
            args: ['a'],
            env: { X: '1' },
            timeout: 0,
            __configPath__: 'path.json',
        }
        await mgr.addServer('newS', newCfg, 'path.json', '/tmp/p.yaml')
        expect(mutateStub.calledOnce).to.be.true
        expect(initOneStub.calledWith('newS', newCfg)).to.be.true
    })
})

describe('removeServer()', () => {
    let loadStub: sinon.SinonStub
    let mutateStub: sinon.SinonStub

    beforeEach(() => {
        loadStub = sinon.stub(mcpUtils, 'loadMcpServerConfigs')
        stubPersonaAllow()
        mutateStub = sinon.stub(McpManager.prototype as any, 'mutateConfigFile' as keyof McpManager).resolves()
    })

    afterEach(async () => {
        sinon.restore()
        try {
            await McpManager.instance.close()
        } catch {}
    })

    it('shuts client and cleans state', async () => {
        loadStub.resolves({ servers: new Map(), errors: new Map() })
        const mgr = await McpManager.init([], [], features)
        const dummy = new Client({ name: 'c', version: 'v' })
        ;(mgr as any).clients.set('x', dummy)
        ;(mgr as any).mcpServers.set('x', {
            command: '',
            args: [],
            env: {},
            timeout: 0,
            __configPath__: 'c.json',
        } as MCPServerConfig)

        await mgr.removeServer('x')
        expect(mutateStub.calledOnce).to.be.true
        expect((mgr as any).clients.has('x')).to.be.false
    })
})

describe('updateServer()', () => {
    let loadStub: sinon.SinonStub
    let initOneStub: sinon.SinonStub
    let mutateStub: sinon.SinonStub

    beforeEach(() => {
        loadStub = sinon.stub(mcpUtils, 'loadMcpServerConfigs')
        stubPersonaAllow()
        initOneStub = stubInitOneServer()
        mutateStub = sinon.stub(McpManager.prototype as any, 'mutateConfigFile' as keyof McpManager).resolves()
    })

    afterEach(async () => {
        sinon.restore()
        try {
            await McpManager.instance.close()
        } catch {}
    })

    it('re-initializes when changing timeout', async () => {
        const oldCfg: MCPServerConfig = {
            command: 'cmd',
            args: [],
            env: {},
            timeout: 1,
            __configPath__: 'u.json',
        }
        loadStub.resolves({ servers: new Map([['u1', oldCfg]]), errors: new Map() })
        await McpManager.init([], [], features)
        const mgr = McpManager.instance
        const fakeClient = new Client({ name: 'c', version: 'v' })
        ;(mgr as any).clients.set('u1', fakeClient)

        const closeStub = sinon.stub(fakeClient, 'close').resolves()
        initOneStub.resetHistory()
        mutateStub.resetHistory()

        await mgr.updateServer('u1', { timeout: 999 }, 'fakepath')
        expect(mutateStub.calledOnce).to.be.true
        expect(closeStub.calledOnce).to.be.true
        expect(initOneStub.calledOnce).to.be.true
    })
})

describe('requiresApproval()', () => {
    let loadStub: sinon.SinonStub

    afterEach(async () => {
        sinon.restore()
        try {
            await McpManager.instance.close()
        } catch {}
    })

    it('returns true for unknown server', async () => {
        loadStub = sinon.stub(mcpUtils, 'loadMcpServerConfigs').resolves({ servers: new Map(), errors: new Map() })
        stubPersonaAllow()

        const mgr = await McpManager.init([], [], features)
        expect(mgr.requiresApproval('x', 'y')).to.be.true
    })

    it('returns false when permission is alwaysAllow', async () => {
        const cfg: MCPServerConfig = {
            command: 'c',
            args: [],
            env: {},
            timeout: 0,
            __configPath__: 'p',
        }
        loadStub = sinon
            .stub(mcpUtils, 'loadMcpServerConfigs')
            .resolves({ servers: new Map([['s', cfg]]), errors: new Map() })
        stubPersonaAllow()
        await McpManager.init(['p'], [], features)

        const mgr = McpManager.instance
        const map = new Map<string, MCPServerPermission>([
            [
                's',
                {
                    enabled: true,
                    toolPerms: { '*': 'alwaysAllow' as McpPermissionType },
                    __configPath__: '/tmp/p.yaml',
                },
            ],
        ])
        ;(mgr as any).mcpServerPermissions = map
        expect(mgr.requiresApproval('s', 'foo')).to.be.false
    })
})

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
            timeout: 0,
            __configPath__: 'cfg.json',
        }
        loadStub = sinon
            .stub(mcpUtils, 'loadMcpServerConfigs')
            .resolves({ servers: new Map([['srv', cfg]]), errors: new Map() })
        stubPersonaAllow()
        const mgr = await McpManager.init(['cfg.json'], [], features)
        const snap = mgr.getAllServerConfigs()
        expect(snap.get('srv')).to.deep.equal(cfg)
        snap.delete('srv')
        expect(mgr.getAllServerConfigs().has('srv')).to.be.true
    })
})

function createStateStubs() {
    const loadStub = sinon.stub(mcpUtils, 'loadMcpServerConfigs')
    stubPersonaAllow()
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
            timeout: 0,
            __configPath__: 'state.json',
        }
        loadStub.resolves({ servers: new Map([['srv', cfg]]), errors: new Map() })
        const mgr = await McpManager.init(['state.json'], [], features)
        expect(mgr.getServerState('srv')).to.deep.include({
            status: 'ENABLED',
            toolsCount: 1,
        })
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
            timeout: 0,
            __configPath__: 'state.json',
        }
        loadStub.resolves({ servers: new Map([['srv', cfg]]), errors: new Map() })
        const mgr = await McpManager.init(['state.json'], [], features)
        const map = mgr.getAllServerStates()
        expect(map.get('srv')).to.deep.include({
            status: 'ENABLED',
            toolsCount: 1,
        })
    })
})

describe('getEnabledTools()', () => {
    let loadStub: sinon.SinonStub
    let initOneStub: sinon.SinonStub

    beforeEach(() => {
        loadStub = sinon.stub(mcpUtils, 'loadMcpServerConfigs')
        stubPersonaAllow()
        initOneStub = stubInitOneServer()
    })

    afterEach(async () => {
        sinon.restore()
        try {
            await McpManager.instance.close()
        } catch {}
    })

    it('filters out tools with deny permission', async () => {
        const cfg: MCPServerConfig = {
            command: 'c',
            args: [],
            env: {},
            timeout: 0,
            __configPath__: 't.json',
        }
        loadStub.resolves({ servers: new Map([['srv', cfg]]), errors: new Map() })
        const mgr = await McpManager.init(['t.json'], [], features)

        expect(mgr.getEnabledTools()).to.have.length(1)

        const denyMap = new Map<string, MCPServerPermission>([
            [
                'srv',
                {
                    enabled: true,
                    toolPerms: { tool1: McpPermissionType.deny },
                    __configPath__: '/tmp/p.yaml',
                },
            ],
        ])
        ;(mgr as any).mcpServerPermissions = denyMap
        expect(mgr.getEnabledTools()).to.be.empty
    })
})

describe('getAllToolsWithPermissions()', () => {
    let loadStub: sinon.SinonStub
    let initOneStub: sinon.SinonStub
    let mgr: McpManager

    const cfg: MCPServerConfig = {
        command: 'c',
        args: [],
        env: {},
        timeout: 0,
        __configPath__: 'p.json',
    }

    beforeEach(async () => {
        loadStub = sinon.stub(mcpUtils, 'loadMcpServerConfigs')
        stubPersonaAllow()
        initOneStub = stubInitOneServer()
        loadStub.resolves({ servers: new Map([['s1', cfg]]), errors: new Map() })
        mgr = await McpManager.init(['p.json'], [], features)
    })

    afterEach(async () => {
        sinon.restore()
        try {
            await McpManager.instance.close()
        } catch {}
    })

    it('reports permission value', () => {
        const [info] = mgr.getAllToolsWithPermissions()
        expect(info.permission).to.equal('ask')
    })

    it('honours serverFilter', () => {
        ;(mgr as any).mcpTools.push({
            serverName: 's2',
            toolName: 'foo',
            description: '',
            inputSchema: {},
        })
        expect(mgr.getAllToolsWithPermissions()).to.have.length(2)
        expect(mgr.getAllToolsWithPermissions('s1')).to.have.length(1)
        expect(mgr.getAllToolsWithPermissions('s2')).to.have.length(1)
    })
})

describe('close()', () => {
    let loadStub: sinon.SinonStub

    afterEach(() => sinon.restore())

    it('shuts all clients and resets singleton', async () => {
        loadStub = sinon.stub(mcpUtils, 'loadMcpServerConfigs').resolves({ servers: new Map(), errors: new Map() })
        stubPersonaAllow()
        await McpManager.init([], [], features)
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

describe('isServerDisabled()', () => {
    afterEach(async () => {
        sinon.restore()
        try {
            await McpManager.instance.close()
        } catch {}
    })

    it('reflects permission map', async () => {
        const cfg: MCPServerConfig = {
            command: 'c',
            args: [],
            env: {},
            timeout: 0,
            __configPath__: 's.json',
        }
        sinon.stub(mcpUtils, 'loadMcpServerConfigs').resolves({ servers: new Map([['srv', cfg]]), errors: new Map() })
        const permMap1 = new Map<string, MCPServerPermission>([
            ['*', { enabled: true, toolPerms: {}, __configPath__: '/p' }],
        ])
        const permMap2 = new Map<string, MCPServerPermission>([
            ['srv', { enabled: false, toolPerms: {}, __configPath__: '/p' }],
        ])
        const permStub = sinon
            .stub(mcpUtils, 'loadPersonaPermissions')
            .onFirstCall()
            .resolves(permMap1)
            .onSecondCall()
            .resolves(permMap2)
        await McpManager.init(['s.json'], [], features)
        const mgr = McpManager.instance
        expect(mgr.isServerDisabled('srv')).to.be.false

        await mgr.updateServerPermission('srv', {
            enabled: false,
            toolPerms: {},
            __configPath__: '/p',
        })
        expect(mgr.isServerDisabled('srv')).to.be.true
        expect(permStub.calledTwice).to.be.true
    })
})

describe('listServersAndTools()', () => {
    afterEach(async () => {
        sinon.restore()
        try {
            await McpManager.instance.close()
        } catch {}
    })

    it('lists names grouped by server', async () => {
        sinon.stub(mcpUtils, 'loadMcpServerConfigs').resolves({ servers: new Map(), errors: new Map() })
        stubPersonaAllow()
        const initStub = stubInitOneServer()
        const mgr = await McpManager.init([], [], features)
        ;(mgr as any).mcpTools.push({
            serverName: 'srv2',
            toolName: 'extra',
            description: '',
            inputSchema: {},
        })
        const map = mgr.listServersAndTools()
        expect(map['srv2']).to.deep.equal(['extra'])
        expect(initStub.called).to.be.false
    })
})

describe('updateServerPermission()', () => {
    afterEach(async () => {
        sinon.restore()
        try {
            await McpManager.instance.close()
        } catch {}
    })

    it('disables then re-enables a server', async () => {
        const cfg: MCPServerConfig = {
            command: 'c',
            args: [],
            env: {},
            timeout: 0,
            __configPath__: 'x.json',
        }
        sinon.stub(mcpUtils, 'loadMcpServerConfigs').resolves({ servers: new Map([['srv', cfg]]), errors: new Map() })

        const permEnabled = new Map<string, MCPServerPermission>([
            ['*', { enabled: true, toolPerms: {}, __configPath__: '/p' }],
        ])
        const permDisabled = new Map<string, MCPServerPermission>([
            ['srv', { enabled: false, toolPerms: {}, __configPath__: '/p' }],
        ])

        const permStub = sinon
            .stub(mcpUtils, 'loadPersonaPermissions')
            .onFirstCall()
            .resolves(permEnabled) // initial
            .onSecondCall()
            .resolves(permDisabled) // after disable
            .onThirdCall()
            .resolves(permEnabled) // after re-enable

        sinon.stub(McpManager.prototype as any, 'mutatePersonaFile').resolves()
        const initStub = stubInitOneServer()

        await McpManager.init(['x.json'], [], features)
        const mgr = McpManager.instance

        await mgr.updateServerPermission('srv', {
            enabled: false,
            toolPerms: {},
            __configPath__: '/p',
        })
        expect(mgr.isServerDisabled('srv')).to.be.true
        expect(initStub.calledOnce).to.be.true // first init during constructor

        await mgr.updateServerPermission('srv', {
            enabled: true,
            toolPerms: {},
            __configPath__: '/p',
        })
        expect(mgr.isServerDisabled('srv')).to.be.false
        expect(initStub.callCount).to.equal(2) // re-initialized
        expect(permStub.callCount).to.equal(3)
    })
})

describe('reinitializeMcpServers()', () => {
    afterEach(async () => {
        sinon.restore()
        try {
            await McpManager.instance.close()
        } catch {}
    })

    it('closes then reloads servers', async () => {
        const cfg1: MCPServerConfig = {
            command: 'c',
            args: [],
            env: {},
            timeout: 0,
            __configPath__: 'a.json',
        }
        const cfg2: MCPServerConfig = {
            command: 'd',
            args: [],
            env: {},
            timeout: 0,
            __configPath__: 'b.json',
        }
        const loadStub = sinon
            .stub(mcpUtils, 'loadMcpServerConfigs')
            .onFirstCall()
            .resolves({ servers: new Map([['srvA', cfg1]]), errors: new Map() })
            .onSecondCall()
            .resolves({ servers: new Map([['srvB', cfg2]]), errors: new Map() })
        stubPersonaAllow()
        stubInitOneServer()

        const mgr = await McpManager.init(['a.json'], [], features)
        expect(mgr.getAllServerConfigs().has('srvA')).to.be.true

        const closeSpy = sinon.spy(mgr, 'close' as any)
        await mgr.reinitializeMcpServers()
        expect(closeSpy.calledOnce).to.be.true
        expect(loadStub.callCount).to.equal(2)
        expect(mgr.getAllServerConfigs().has('srvB')).to.be.true
    })
})

describe('handleError()', () => {
    let mgr: McpManager
    let loadStub: sinon.SinonStub
    let errorSpy: sinon.SinonSpy
    let statusEvents: Array<{ server: string; state: any }>
    let toolsEvents: Array<{ server: string; tools: any[] }>

    beforeEach(async () => {
        loadStub = sinon.stub(mcpUtils, 'loadMcpServerConfigs').resolves({ servers: new Map(), errors: new Map() })
        stubPersonaAllow()
        mgr = await McpManager.init([], [], features)
        errorSpy = sinon.spy(fakeLogging, 'error')

        // Capture emitted events
        statusEvents = []
        toolsEvents = []
        mgr.events.on(MCP_SERVER_STATUS_CHANGED, (srv, st) => {
            statusEvents.push({ server: srv, state: st })
        })
        mgr.events.on(AGENT_TOOLS_CHANGED, (srv, tools) => {
            toolsEvents.push({ server: srv, tools })
        })
    })

    afterEach(async () => {
        sinon.restore()
        try {
            await McpManager.instance.close()
        } catch {}
    })

    it('logs error and emits FAILED state + toolsChanged', () => {
        ;(mgr as any).handleError('srvX', new Error('boom!'))

        expect(errorSpy.calledOnce).to.be.true
        expect(errorSpy.firstCall.args[0]).to.match(/MCP ERROR \[srvX\]: boom!/)

        expect(statusEvents).to.have.length(1)
        expect(statusEvents[0].server).to.equal('srvX')
        expect(statusEvents[0].state.status).to.equal(McpServerStatus.FAILED)
        expect(statusEvents[0].state.lastError).to.equal('boom!')

        expect(toolsEvents).to.have.length(1)
        expect(toolsEvents[0].server).to.equal('srvX')
        expect(toolsEvents[0].tools).to.be.an('array').that.is.empty
    })
})

describe('McpManager error handling', () => {
    let loadStub: sinon.SinonStub

    beforeEach(() => {
        sinon.restore()
        // Stub the loadPersonaPermissions to return a simple map
        sinon
            .stub(mcpUtils, 'loadPersonaPermissions')
            .resolves(new Map([['*', { enabled: true, toolPerms: {}, __configPath__: '/tmp/p.yaml' }]]))
    })

    afterEach(async () => {
        sinon.restore()
        try {
            await McpManager.instance.close()
        } catch {}
    })

    it('stores and returns config load errors', async () => {
        // Create a mock response with errors
        const mockErrors = new Map<string, string>([
            ['file1.json', 'File not found error'],
            ['serverA', 'Missing command error'],
        ])

        loadStub = sinon.stub(mcpUtils, 'loadMcpServerConfigs').resolves({
            servers: new Map(),
            errors: mockErrors,
        })

        const mgr = await McpManager.init([], [], features)

        // Test that getConfigLoadErrors returns the expected error messages
        const errors = mgr.getConfigLoadErrors()
        expect(errors).to.not.be.undefined
        expect(errors).to.include('File: file1.json, Error: File not found error')
        expect(errors).to.include('File: serverA, Error: Missing command error')
    })

    it('returns undefined when no errors exist', async () => {
        // Create a mock response with no errors
        loadStub = sinon.stub(mcpUtils, 'loadMcpServerConfigs').resolves({
            servers: new Map(),
            errors: new Map(),
        })

        const mgr = await McpManager.init([], [], features)

        // Test that getConfigLoadErrors returns undefined when no errors
        const errors = mgr.getConfigLoadErrors()
        expect(errors).to.be.undefined
    })

    it('logs error and updates server state', async () => {
        // Create a mock response with no errors initially
        loadStub = sinon.stub(mcpUtils, 'loadMcpServerConfigs').resolves({
            servers: new Map(),
            errors: new Map(),
        })

        const mgr = await McpManager.init([], [], features)

        // Spy on logging.error and setState
        const errorSpy = sinon.spy(fakeLogging, 'error')
        const setStateSpy = sinon.spy(mgr as any, 'setState')

        // Access the private handleError method using type assertion
        const handleError = (mgr as any).handleError.bind(mgr)

        // Call handleError with a server name and error
        handleError('testServer', new Error('Test error message'))

        // Verify error is logged
        expect(errorSpy.calledOnce).to.be.true
        // We can't check the exact arguments due to the function signature,
        // so we'll focus on verifying the behavior through other means

        // Verify setState is called with correct parameters
        expect(setStateSpy.calledWith('testServer', McpServerStatus.FAILED, 0, 'Test error message')).to.be.true
    })

    it('clears errors when reloading configurations', async () => {
        // First load with errors
        loadStub = sinon
            .stub(mcpUtils, 'loadMcpServerConfigs')
            .onFirstCall()
            .resolves({
                servers: new Map(),
                errors: new Map([['file1.json', 'Initial error']]),
            })
            // Second load with no errors
            .onSecondCall()
            .resolves({
                servers: new Map(),
                errors: new Map(),
            })

        const mgr = await McpManager.init([], [], features)

        // Verify initial errors exist
        let errors = mgr.getConfigLoadErrors()
        expect(errors).to.not.be.undefined
        expect(errors).to.include('Initial error')

        // Reinitialize to clear errors
        await mgr.reinitializeMcpServers()

        // Verify errors are cleared
        errors = mgr.getConfigLoadErrors()
        expect(errors).to.be.undefined
    })
})
