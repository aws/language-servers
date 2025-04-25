/*!
 * Copyright Amazon.com, Inc. or its affiliates.
 * All Rights Reserved. SPDX-License-Identifier: Apache-2.0
 */

import { expect } from 'chai'
import { McpTool } from './mcpTool'
import { McpManager } from './mcpManager'
import type { McpToolDefinition } from './mcpTypes'

describe('McpTool', () => {
    const fakeFeatures = {
        logging: { info: () => {}, warn: () => {}, error: () => {}, debug: () => {}, log: () => {} },
        workspace: {
            fs: { exists: () => Promise.resolve(false), readFile: () => Promise.resolve(Buffer.from('')) },
            getUserHomeDir: () => '',
        },
        lsp: {},
    } as unknown as Pick<
        import('@aws/language-server-runtimes/server-interface/server').Features,
        'logging' | 'workspace' | 'lsp'
    >

    const definition: McpToolDefinition = {
        serverName: 'nope',
        toolName: 'doesNotExist',
        description: 'desc',
        inputSchema: {},
    }

    afterEach(async () => {
        try {
            await McpManager.instance.close()
        } catch {
            // ignore
        }
    })

    it('invoke() throws when server is not connected', async () => {
        // Initialize McpManager with no config paths → zero servers
        await McpManager.init([], fakeFeatures)

        const tool = new McpTool(fakeFeatures, definition)

        try {
            await tool.invoke({}) // should throw
            throw new Error('Expected invoke() to throw')
        } catch (err: any) {
            expect(err).to.be.instanceOf(Error)
            expect(err.message).to.equal(`Failed to invoke MCP tool: MCP: server 'nope' not connected`)
        }
    })
})
