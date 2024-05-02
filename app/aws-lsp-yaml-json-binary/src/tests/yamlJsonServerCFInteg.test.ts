import { expect } from 'chai'
import { ChildProcessWithoutNullStreams, spawn } from 'child_process'
import { describe } from 'node:test'
import { platform } from 'os'
import * as path from 'path'
import { JSONRPCEndpoint, LspClient } from 'ts-lsp-client'
import { pathToFileURL } from 'url'
import {
    COMPLETIONS_EMPTY_OBJECT_JSON,
    COMPLETIONS_EMPTY_OBJECT_YAML,
    DIAGNOSTICS_RESPONSE_JSON,
    DIAGNOSTICS_RESPONSE_YAML,
    FORMAT_EDITS_JSON,
    FORMAT_EDITS_YAML,
    HOVER_JSON,
    HOVER_YAML,
    TEXT_TO_DIAGNOSE_JSON,
    TEXT_TO_DIAGNOSE_YAML,
    TEXT_TO_FORMAT_JSON,
    TEXT_TO_FORMAT_YAML,
    TEXT_TO_HOVER_JSON,
    TEXT_TO_HOVER_YAML,
} from './testUtilsCF'

describe('Test YamlJsonServer with CloudFormation schema', () => {
    const rootPath = path.resolve(__dirname)
    let process: ChildProcessWithoutNullStreams
    let endpoint: JSONRPCEndpoint
    let client: LspClient
    let binaryFile = 'lsp-yaml-json-binary'

    before(async () => {
        switch (platform()) {
            case 'darwin':
                binaryFile = binaryFile.concat('-', 'macos')
                break
            case 'linux':
                binaryFile = binaryFile.concat('-', 'linux')
                break
            case 'win32':
                binaryFile = binaryFile.concat('-', 'win.exe')
                break
            default:
                throw new Error('Platform is not supported. Exiting...')
        }

        // start the LSP server
        process = spawn(path.join(__dirname, '../../', 'bin', binaryFile), ['--stdio'], {
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

    it('should return completion items for CloudFormation, YAML', async () => {
        const docUri = 'completion.yml'
        const emptyObject = ''
        client.didOpen({
            textDocument: {
                uri: docUri,
                text: emptyObject,
                version: 1,
                languageId: 'yaml',
            },
        })

        const result = await endpoint.send('textDocument/completion', {
            textDocument: {
                uri: docUri,
            },
            position: {
                line: 0,
                character: 0,
            },
            context: {
                triggerKind: 1,
            },
        })

        expect(result).to.deep.equal(COMPLETIONS_EMPTY_OBJECT_YAML)
    })

    it('should return hover item without header and footer, YAML', async () => {
        const docUri = 'hover.yml'
        client.didOpen({
            textDocument: {
                uri: docUri,
                text: TEXT_TO_HOVER_YAML,
                version: 1,
                languageId: 'yaml',
            },
        })
        const result = await client.hover({
            textDocument: {
                uri: docUri,
            },
            position: {
                line: 0,
                character: 1,
            },
        })

        expect(result).to.deep.equal(HOVER_YAML)
    })

    it('should return diagnostic items, YAML', async () => {
        const docUri = 'diagnostics.yml'

        client.didOpen({
            textDocument: {
                uri: docUri,
                text: TEXT_TO_DIAGNOSE_YAML,
                version: 1,
                languageId: 'yaml',
            },
        })

        const result = await client.once('textDocument/publishDiagnostics')

        expect(result[0]).to.deep.equal(DIAGNOSTICS_RESPONSE_YAML)
    })

    it('should return format items, YAML', async () => {
        const docUri = 'format.yml'
        client.didOpen({
            textDocument: {
                uri: docUri,
                text: TEXT_TO_FORMAT_YAML,
                version: 1,
                languageId: 'yaml',
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

        expect(result).to.deep.equal(FORMAT_EDITS_YAML)
    })
})
