import * as chai from 'chai'
import { expect } from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import { ChildProcessWithoutNullStreams, spawn } from 'child_process'
import { describe } from 'node:test'
import * as path from 'path'
import { JSONRPCEndpoint, LspClient } from 'ts-lsp-client'
import { pathToFileURL } from 'url'

chai.use(chaiAsPromised)

describe('Test CodeWhisperer Server', async () => {
    const rootPath = path.resolve(path.join(__dirname, 'testFixture'))
    let process: ChildProcessWithoutNullStreams
    let endpoint: JSONRPCEndpoint
    let client: LspClient
    const runtimeFile = path.join(__dirname, '../../', 'build', 'aws-lsp-codewhisperer-token-binary.js')

    before(async () => {
        process = spawn('node', [runtimeFile, '--stdio'], {
            shell: true,
            stdio: 'pipe',
        })

        // create an RPC endpoint for the process
        endpoint = new JSONRPCEndpoint(process.stdin, process.stdout)

        // create the LSP client
        client = new LspClient(endpoint)

        const result = await client.initialize({
            processId: process.pid ?? null,
            capabilities: {
                textDocument: {
                    completion: {
                        completionItem: {
                            snippetSupport: true,
                        },
                    },
                },
            },
            workspaceFolders: [
                {
                    name: 'workspace',
                    uri: pathToFileURL(rootPath).href,
                },
            ],
            rootUri: null,
        })

        expect(result.capabilities).to.exist
    })

    after(async () => {
        client.exit()
    })

    it('should initialize successfully', async () => {
        // Test passes if we reach this point without errors
        expect(true).to.be.true
    })

    it('should handle textDocument/didOpen', async () => {
        const docUri = pathToFileURL(path.join(rootPath, 'test.py')).href
        await client.didOpen({
            textDocument: {
                uri: docUri,
                text: 'def hello():\n    print("Hello World")',
                version: 1,
                languageId: 'python',
            },
        })

        // Test passes if no error is thrown
        expect(true).to.be.true
    })
})
