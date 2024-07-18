import * as chai from 'chai'
import { expect } from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import { ChildProcessWithoutNullStreams, spawn } from 'child_process'
import { describe } from 'node:test'
import * as path from 'path'
import { JSONRPCEndpoint, LspClient } from 'ts-lsp-client'
import { pathToFileURL } from 'url'

chai.use(chaiAsPromised)

describe('Test HelloWorldServer', async () => {
    const rootPath = path.resolve(path.join(__dirname, 'testFixture'))
    let process: ChildProcessWithoutNullStreams
    let endpoint: JSONRPCEndpoint
    let client: LspClient
    const runtimeFile = path.join(__dirname, '../../', 'build', 'hello-world-lsp-standalone.js')

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
            capabilities: {},
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

    it('should return completion items', async () => {
        const docUri = pathToFileURL(path.join(rootPath, 'completion.ts')).href
        await client.didOpen({
            textDocument: {
                uri: docUri,
                text: '',
                version: 1,
                languageId: 'typescript',
            },
        })
        const result = await endpoint.send('textDocument/completion', {
            textDocument: {
                uri: docUri,
            },
            position: {
                line: 0,
                character: 1,
            },
            context: {
                triggerKind: 1,
            },
        })

        const expectedResult = {
            isIncomplete: false,
            items: [
                {
                    label: 'Hello World!!!',
                    kind: 1,
                },
                {
                    label: 'Hello Developers!!!',
                    kind: 1,
                },
            ],
        }
        expect(result).to.deep.equal(expectedResult)
    })
})
