import { expect } from 'chai'
import { ChildProcessWithoutNullStreams, spawn } from 'child_process'
import { describe } from 'node:test'
import * as path from 'path'
import { JSONRPCEndpoint, LspClient } from 'ts-lsp-client'
import { pathToFileURL } from 'url'
import {
    COMPLETIONS_EMPTY_OBJECT_YAML,
    DIAGNOSTICS_RESPONSE_YAML,
    DIAGNOSTICS_RESPONSE_YAML_CUSTOM,
    FORMAT_EDITS_YAML,
    HOVER_YAML,
    HOVER_YAML_CUSTOMIZED,
    TEXT_TO_DIAGNOSE_YAML,
    TEXT_TO_FORMAT_YAML,
    TEXT_TO_HOVER_YAML,
} from './testUtilsCF'

async function createLSPServer(runtimeFile: string) {
    const rootPath = path.resolve(__dirname)

    // Start the LSP server
    const process = spawn('node', [runtimeFile, '--stdio'], {
        shell: true,
        stdio: 'pipe',
    })

    // Create an RPC endpoint for the process
    const endpoint = new JSONRPCEndpoint(process.stdin, process.stdout)

    // Create the LSP client
    const client = new LspClient(endpoint)

    // Initialize the LSP client
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

describe('Test YamlServer with CloudFormation schema', () => {
    const rootPath = path.resolve(__dirname)
    let process: ChildProcessWithoutNullStreams
    let endpoint: JSONRPCEndpoint
    let client: LspClient
    const runtimeFile = path.join(__dirname, '../../', 'build', 'aws-lsp-yaml-standalone.js')
    before(async () => {
        ;({ client, endpoint, process } = await createLSPServer(runtimeFile))
    })

    after(() => {
        client.exit()
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
}),
    describe('Test YamlServer with CloudFormation schema and a custom implementation of the YamlLanguageService', () => {
        let client: LspClient
        let endpoint: JSONRPCEndpoint
        let process: ChildProcessWithoutNullStreams
        const runtimeFile = path.join(__dirname, '../../', 'build', 'aws-lsp-yaml-standalone-with-customization.js')

        before(async () => {
            ;({ client, endpoint, process } = await createLSPServer(runtimeFile))
        })

        after(() => {
            client.exit()
        })
        it('should return customized diagnostic items, YAML', async () => {
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

            expect(result[0]).to.deep.equal(DIAGNOSTICS_RESPONSE_YAML_CUSTOM)
        })

        it('should return customized hover item, YAML', async () => {
            const docUri = 'hover.yml'
            client.didOpen({
                textDocument: {
                    uri: docUri,
                    text: TEXT_TO_HOVER_YAML,
                    version: 1,
                    languageId: 'yaml',
                },
            })
            const clientResult = await client.hover({
                textDocument: {
                    uri: docUri,
                },
                position: {
                    line: 0,
                    character: 1,
                },
            })

            expect(clientResult).to.deep.equal(HOVER_YAML_CUSTOMIZED)
        })
    })
