import * as chai from 'chai'
import { expect } from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import { ChildProcessWithoutNullStreams, spawn } from 'child_process'
import { describe } from 'node:test'
import * as path from 'path'
import { JSONRPCEndpoint, LspClient } from 'ts-lsp-client'
import { pathToFileURL } from 'url'
import * as crypto from 'crypto'
import { EncryptionInitialization } from '@aws/lsp-core'
import {
    authenticateServer,
    decryptObjectWithKey,
    encryptObjectWithKey,
    getTargetPlatform,
    unzipServers,
} from './testUtils'
import { ChatParams, ChatResult } from '@aws/language-server-runtimes/protocol'

chai.use(chaiAsPromised)

describe('Test CodeWhisperer Agent Server', async () => {
    const rootPath = path.resolve(path.join(__dirname, 'testFixture'))
    let serverProcess: ChildProcessWithoutNullStreams
    let endpoint: JSONRPCEndpoint
    let client: LspClient
    let encryptionKey: string
    let runtimeFile: string

    let testSsoToken: string
    let testSsoStartUrl: string
    let testProfileArn: string

    before(async () => {
        testSsoToken = process.env.TEST_SSO_TOKEN || ''
        testSsoStartUrl = process.env.TEST_SSO_START_URL || ''
        testProfileArn = process.env.TEST_PROFILE_ARN || ''

        const target = getTargetPlatform()
        const zipPath = path.join(__dirname, '../../', 'build', 'archives', 'agent-standalone', target, 'servers.zip')

        runtimeFile = await unzipServers(zipPath)

        serverProcess = spawn(
            'node',
            [
                runtimeFile,
                '--nolazy',
                '--preserve-symlinks',
                '--stdio',
                '--pre-init-encryption',
                '--set-credentials-encryption-key',
            ],
            {
                shell: true,
                stdio: 'pipe',
            }
        )

        if (process.env.DEBUG) {
            serverProcess.stdout.on('data', data => {
                console.log(data.toString())
            })
            serverProcess.stderr.on('data', data => {
                console.error(data.toString())
            })
        }

        encryptionKey = Buffer.from(crypto.randomBytes(32)).toString('base64')
        const encryptionDetails: EncryptionInitialization = {
            version: '1.0',
            key: encryptionKey,
            mode: 'JWT',
        }
        serverProcess.stdin.write(JSON.stringify(encryptionDetails) + '\n')

        // create an RPC endpoint for the process
        endpoint = new JSONRPCEndpoint(serverProcess.stdin, serverProcess.stdout)

        // create the LSP client
        client = new LspClient(endpoint)

        const result = await client.initialize({
            processId: serverProcess.pid ?? null,
            capabilities: {
                textDocument: {
                    completion: {
                        completionItem: {
                            snippetSupport: true,
                        },
                    },
                },
                workspace: {
                    configuration: false,
                },
            },
            initializationOptions: {
                aws: {
                    awsClientCapabilities: {
                        q: {
                            developerProfiles: true,
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

        await authenticateServer(endpoint, testSsoToken, testSsoStartUrl, testProfileArn)

        client.initialized()

        expect(result.capabilities).to.exist
    })

    after(async () => {
        client.exit()
    })

    it('responds to chat prompt', async () => {
        const encryptedMessage = await encryptObjectWithKey<ChatParams>(
            { tabId: 'tab-id', prompt: { prompt: 'Hello' } },
            encryptionKey
        )
        const result = await endpoint.send('aws/chat/sendChatPrompt', { message: encryptedMessage })
        const decryptedResult = await decryptObjectWithKey<ChatResult>(result, encryptionKey)

        expect(decryptedResult).to.have.property('messageId')
        expect(decryptedResult).to.have.property('body')
        expect(decryptedResult.body).to.not.be.empty
    })
})
