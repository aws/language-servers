import { expect } from 'chai'
import { ChildProcessWithoutNullStreams, spawn } from 'child_process'
import { describe } from 'node:test'
import * as path from 'path'
import { JSONRPCEndpoint, LspClient } from 'ts-lsp-client'
import { pathToFileURL } from 'url'
import {
    COMPLETIONS_EMPTY_OBJECT_JSON,
    DIAGNOSTICS_RESPONSE_JSON,
    FORMAT_EDITS_JSON,
    HOVER_JSON,
    TEXT_TO_DIAGNOSE_JSON,
    TEXT_TO_FORMAT_JSON,
    TEXT_TO_HOVER_JSON,
} from './testUtilsCF'

describe('Test JsonServer with CloudFormation schema', () => {
    const rootPath = path.resolve(__dirname)
    let process: ChildProcessWithoutNullStreams
    let endpoint: JSONRPCEndpoint
    let client: LspClient
    const runtimeFile = path.join(__dirname, '../../', 'build', 'aws-lsp-json-standalone.js')

    before(async () => {
        // start the LSP server
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

    after(() => {
        client.exit()
    })

    it('should return completion items for CloudFormation, JSON', async () => {
        const docUri = 'completion.json'
        const emptyObject = '{}'
        client.didOpen({
            textDocument: {
                uri: docUri,
                text: emptyObject,
                version: 1,
                languageId: 'json',
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

        expect(result).to.deep.equal(COMPLETIONS_EMPTY_OBJECT_JSON)
    })

    it('should return hover item, JSON', async () => {
        const docUri = 'hover.json'
        client.didOpen({
            textDocument: {
                uri: docUri,
                text: TEXT_TO_HOVER_JSON,
                version: 1,
                languageId: 'json',
            },
        })
        const clientResult = await client.hover({
            textDocument: {
                uri: docUri,
            },
            position: {
                line: 2,
                character: 10,
            },
        })

        expect(clientResult).to.deep.equal(HOVER_JSON)
    })

    it('should return diagnostic items, JSON', async () => {
        const docUri = 'diagnostics.json'
        client.didOpen({
            textDocument: {
                uri: docUri,
                text: TEXT_TO_DIAGNOSE_JSON,
                version: 1,
                languageId: 'json',
            },
        })
        const result = await client.once('textDocument/publishDiagnostics')

        expect(result[0]).to.deep.equal(DIAGNOSTICS_RESPONSE_JSON)
    })

    it('should return format items, JSON', async () => {
        const docUri = 'format.json'
        client.didOpen({
            textDocument: {
                uri: docUri,
                text: TEXT_TO_FORMAT_JSON,
                version: 1,
                languageId: 'json',
            },
        })
        const result = await endpoint.send('textDocument/formatting', {
            textDocument: {
                uri: docUri,
            },
            options: {
                tabSize: 4,
                insertSpaces: true,
                trimFinalNewlines: true,
            },
        })

        expect(result).to.deep.equal(FORMAT_EDITS_JSON)
    })
})
