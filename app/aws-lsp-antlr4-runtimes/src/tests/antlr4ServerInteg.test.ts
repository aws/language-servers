import { expect } from 'chai'
import { ChildProcessWithoutNullStreams, spawn } from 'child_process'
import { describe } from 'node:test'
import * as path from 'path'
import { JSONRPCEndpoint, LspClient } from 'ts-lsp-client'
import { pathToFileURL } from 'url'

async function createLSPServer(runtimeFile: string) {
    const rootPath = path.resolve(__dirname)

    const process = spawn('node', [runtimeFile, '--stdio'], {
        shell: true,
        stdio: 'pipe',
    })
    const endpoint = new JSONRPCEndpoint(process.stdin, process.stdout)
    const client = new LspClient(endpoint)

    await client.initialize({
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

    return { client, endpoint, process }
}

describe('Test ANTLR4 Server Runtime Integration', () => {
    let client: LspClient
    let endpoint: JSONRPCEndpoint
    const runtimeFile = path.join(__dirname, '../../', 'build', 'aws-lsp-antlr4-standalone.js')

    before(async () => {
        ;({ client, endpoint } = await createLSPServer(runtimeFile))
    })

    after(() => {
        client.exit()
    })

    it('should return completion items for SQL', async () => {
        const docUri = 'completion.sql'
        const text = 'SELECT * FR'

        client.didOpen({
            textDocument: {
                uri: docUri,
                text: text,
                version: 1,
                languageId: 'sql',
            },
        })
        const result = await endpoint.send('textDocument/completion', {
            textDocument: {
                uri: docUri,
            },
            position: {
                line: 0,
                character: 10,
            },
            context: {
                triggerKind: 1,
            },
        })
        expect(result.items).to.deep.include({
            label: 'FROM',
        })
    })

    it('should return diagnostic items for SQL', async () => {
        const docUri = 'diagnostics.sql'
        const invalidText = 'SELECT * FREM table'

        client.didOpen({
            textDocument: {
                uri: docUri,
                text: invalidText,
                version: 1,
                languageId: 'sql',
            },
        })

        const result = await client.once('textDocument/publishDiagnostics')

        expect(result[0].diagnostics).to.have.lengthOf.at.least(1)
        expect(result[0].diagnostics[0]).to.deep.include({
            severity: 1, // Error severity
            range: {
                start: { line: 0, character: 9 },
                end: { line: 0, character: 12 },
            },
        })
    })

    it('should handle document changes', async () => {
        const docUri = 'changes.sql'
        const initialText = 'SELECT * FROM table'

        client.didOpen({
            textDocument: {
                uri: docUri,
                text: initialText,
                version: 1,
                languageId: 'sql',
            },
        })

        const diagnostics = await client.once('textDocument/publishDiagnostics')
        expect(diagnostics[0].diagnostics).to.have.lengthOf.at.least(1)
    })

    it('should handle document close', async () => {
        const docUri = 'close.sql'
        const text = 'SELECT * FROM table'

        client.didOpen({
            textDocument: {
                uri: docUri,
                text: text,
                version: 1,
                languageId: 'sql',
            },
        })

        client.didClose({
            textDocument: {
                uri: docUri,
            },
        })

        // Verify no errors occur when closing the document
        // This is mainly to ensure the server handles document closure gracefully
    })
})

// customized server should not have diagnostics
describe('Test ANTLR4 Server Runtime Integration with customized server', () => {
    let client: LspClient
    const runtimeFile = path.join(__dirname, '../../', 'build', 'aws-lsp-antlr4-standalone-with-customization.js')

    before(async () => {
        ;({ client } = await createLSPServer(runtimeFile))
    })

    after(() => {
        client.exit()
    })

    it('should not return diagnostic items for SQL', async () => {
        const docUri = 'diagnostics.sql'
        const invalidText = 'SELECT * FREM table'

        client.didOpen({
            textDocument: {
                uri: docUri,
                text: invalidText,
                version: 1,
                languageId: 'sql',
            },
        })

        const result = await client.once('textDocument/publishDiagnostics')

        expect(result[0].diagnostics).to.have.lengthOf(0)
    })
})
