// /*!
//  * Copyright Amazon.com, Inc. or its affiliates.
//  * All Rights Reserved. SPDX-License-Identifier: Apache-2.0
//  */

// import { expect } from 'chai'
// import { McpTool } from './mcpTool'
// import { McpManager } from './mcpManager'
// import type { McpToolDefinition } from './mcpTypes'
// import sinon from 'ts-sinon'

// describe('McpTool', () => {
//     const fakeFeatures = {
//         logging: { info: () => {}, warn: () => {}, error: () => {}, debug: () => {}, log: () => {} },
//         workspace: {
//             fs: {
//                 exists: () => Promise.resolve(false),
//                 readFile: () => Promise.resolve(Buffer.from('')),
//                 getUserHomeDir: () => '',
//             },
//         },
//         lsp: {},
//     } as unknown as Pick<
//         import('@aws/language-server-runtimes/server-interface/server').Features,
//         'logging' | 'workspace' | 'lsp'
//     >

//     const definition: McpToolDefinition = {
//         serverName: 'nope',
//         toolName: 'doesNotExist',
//         description: 'desc',
//         inputSchema: {},
//     }

//     beforeEach(async () => {
//         // Tear down any existing singleton so we start fresh
//         try {
//             await McpManager.instance.close()
//         } catch {
//             // ignore if it wasn't initialized
//         }
//     })

//     afterEach(async () => {
//         sinon.restore()
//         try {
//             await McpManager.instance.close()
//         } catch {}
//     })

//     it('invoke() throws when server is not connected', async () => {
//         await McpManager.init([], fakeFeatures)
//         sinon.stub(McpManager.prototype, 'callTool').rejects(new Error(`MCP: server 'nope' not connected`))
//         const tool = new McpTool(fakeFeatures, definition)
//         try {
//             await tool.invoke({})
//             throw new Error('Expected invoke() to throw')
//         } catch (err: any) {
//             expect(err).to.be.instanceOf(Error)
//             expect(err.message).to.equal(`Failed to invoke MCP tool: MCP: server 'nope' not connected`)
//         }
//     })

//     it('requiresAcceptance consults manager.requiresApproval flag', async () => {
//         await McpManager.init([], fakeFeatures)
//         const tool = new McpTool(fakeFeatures, definition)

//         // stub on the prototype → false
//         const stubFalse = sinon.stub(McpManager.prototype, 'requiresApproval').returns(false)
//         let result = tool.requiresAcceptance(definition.serverName, definition.toolName)
//         expect(result.requiresAcceptance).to.be.false
//         expect(result.warning).to.equal(`About to invoke MCP tool “${definition.toolName}”. Do you want to proceed?`)
//         stubFalse.restore()

//         // stub on the prototype → true
//         const stubTrue = sinon.stub(McpManager.prototype, 'requiresApproval').returns(true)
//         result = tool.requiresAcceptance(definition.serverName, definition.toolName)
//         expect(result.requiresAcceptance).to.be.true
//         expect(result.warning).to.equal(`About to invoke MCP tool “${definition.toolName}”. Do you want to proceed?`)
//         stubTrue.restore()
//     })
// })
