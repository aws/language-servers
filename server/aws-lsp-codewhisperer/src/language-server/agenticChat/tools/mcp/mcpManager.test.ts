/*!
 * Copyright Amazon.com, Inc. or its affiliates.
 * All Rights Reserved. SPDX-License-Identifier: Apache-2.0
 */

import { expect } from 'chai'
import { McpManager } from './mcpManager'

describe('McpManager (singleton & empty‑config)', () => {
    const fakeLogging = {
        log: (_: string) => {},
        info: (_: string) => {},
        warn: (_: string) => {},
        error: (_: string) => {},
        debug: (_: string) => {},
    }

    // Minimal stub for Features.workspace
    const fakeWorkspace = {
        fs: {
            exists: (_: string) => Promise.resolve(false),
            readFile: (_: string) => Promise.resolve(Buffer.from('')),
        },
        getUserHomeDir: () => '',
    }

    const fakeLsp = {}

    const features = {
        logging: fakeLogging,
        workspace: fakeWorkspace,
        lsp: fakeLsp,
    } as unknown as Pick<
        import('@aws/language-server-runtimes/server-interface/server').Features,
        'logging' | 'workspace' | 'lsp'
    >

    afterEach(async () => {
        try {
            await McpManager.instance.close()
        } catch {
            /* ignore */
        }
    })

    it('init() always returns the same instance', async () => {
        const m1 = await McpManager.init([], features)
        const m2 = await McpManager.init([], features)
        expect(m1).to.equal(m2)
    })

    it('with no config paths it discovers zero tools', async () => {
        const mgr = await McpManager.init([], features)
        expect(mgr.getAllTools()).to.be.an('array').that.is.empty
    })

    it('callTool() on non‑existent server throws', async () => {
        const mgr = await McpManager.init([], features)
        try {
            await mgr.callTool('nope', 'foo', {})
            throw new Error('Expected callTool to throw, but it did not')
        } catch (err: any) {
            expect(err).to.be.instanceOf(Error)
            expect(err.message).to.equal(`MCP: server 'nope' not connected`)
        }
    })
})
