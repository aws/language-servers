import * as chai from 'chai'
import { expect } from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import { ChildProcessWithoutNullStreams, spawn } from 'child_process'
import { describe } from 'node:test'
import * as path from 'path'
import { JSONRPCEndpoint, LspClient } from './lspClient'
import { pathToFileURL } from 'url'
import * as crypto from 'crypto'
import { EncryptionInitialization } from '@aws/lsp-core'
import { authenticateServer, decryptObjectWithKey, encryptObjectWithKey, normalizePath } from './testUtils'
import { ChatParams, ChatResult } from '@aws/language-server-runtimes/protocol'
import * as fs from 'fs'

chai.use(chaiAsPromised)

describe('Q Agentic Chat Server Integration Tests', async () => {
    // In compiled output, __dirname points to out/tests, so testFixture is at out/tests/testFixture
    const rootPath = path.resolve(path.join(__dirname, 'testFixture'))
    let serverProcess: ChildProcessWithoutNullStreams
    let endpoint: JSONRPCEndpoint
    let client: LspClient
    let encryptionKey: string
    let runtimeFile: string

    let testSsoToken: string
    let testSsoStartUrl: string
    let testProfileArn: string

    let tabId: string
    let partialResultToken: string

    let serverLogs: string[] = []

    before(async () => {
        testSsoToken = process.env.TEST_SSO_TOKEN || ''
        testSsoStartUrl = process.env.TEST_SSO_START_URL || ''
        testProfileArn = process.env.TEST_PROFILE_ARN || ''

        runtimeFile =
            process.env.TEST_RUNTIME_FILE ||
            path.join(__dirname, '../../../../app/aws-lsp-codewhisperer-runtimes/build/aws-lsp-codewhisperer.js')

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
        serverProcess.stdout.on('data', (data: Buffer) => {
            const message = data.toString()
            if (process.env.DEBUG) {
                console.log(message)
            }
            serverLogs.push(message)
        })

        serverProcess.stderr.on('data', (data: Buffer) => {
            const message = data.toString()
            if (process.env.DEBUG) {
                console.error(message)
            }
            serverLogs.push(`STDERR: ${message}`)
        })

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

    beforeEach(() => {
        tabId = crypto.randomUUID()
        partialResultToken = crypto.randomUUID()
    })

    after(async () => {
        client.exit()
    })

    afterEach(function (this: Mocha.Context) {
        if (this.currentTest?.state === 'failed') {
            console.log('\n=== SERVER LOGS ON FAILURE ===')
            console.log(serverLogs.join(''))
            console.log('=== END SERVER LOGS ===\n')
        }
        serverLogs = []
    })

    it('responds to chat prompt', async () => {
        const encryptedMessage = await encryptObjectWithKey<ChatParams>(
            { tabId, prompt: { prompt: 'Hello' } },
            encryptionKey
        )
        const result = await client.sendChatPrompt({ message: encryptedMessage })
        const decryptedResult = await decryptObjectWithKey<ChatResult>(result, encryptionKey)

        expect(decryptedResult).to.have.property('messageId')
        expect(decryptedResult).to.have.property('body')
        expect(decryptedResult.body).to.not.be.empty
    })

    it('reads file contents using fsRead tool', async () => {
        const encryptedMessage = await encryptObjectWithKey<ChatParams>(
            {
                tabId,
                prompt: { prompt: 'Read the contents of the test.py file using the fsRead tool.' },
            },
            encryptionKey
        )
        const result = await client.sendChatPrompt({ message: encryptedMessage })
        const decryptedResult = await decryptObjectWithKey<ChatResult>(result, encryptionKey)

        expect(decryptedResult.additionalMessages).to.be.an('array')
        const fsReadMessage = decryptedResult.additionalMessages?.find(
            msg => msg.type === 'tool' && msg.header?.body === '1 file read'
        )
        expect(fsReadMessage).to.exist
        const expectedPath = path.join(rootPath, 'test.py')
        const actualPaths = fsReadMessage?.header?.fileList?.filePaths?.map(normalizePath) || []
        expect(actualPaths).to.include.members([normalizePath(expectedPath)])
        expect(fsReadMessage?.messageId?.startsWith('tooluse_')).to.be.true
    })

    it('lists directory contents using listDirectory tool', async () => {
        const encryptedMessage = await encryptObjectWithKey<ChatParams>(
            {
                tabId,
                prompt: { prompt: 'List the contents of the current directory using the listDirectory tool.' },
            },
            encryptionKey
        )
        const result = await client.sendChatPrompt({ message: encryptedMessage })
        const decryptedResult = await decryptObjectWithKey<ChatResult>(result, encryptionKey)

        expect(decryptedResult.additionalMessages).to.be.an('array')
        const listDirectoryMessage = decryptedResult.additionalMessages?.find(
            msg => msg.type === 'tool' && msg.header?.body === '1 directory listed'
        )
        expect(listDirectoryMessage).to.exist
        const actualPaths = listDirectoryMessage?.header?.fileList?.filePaths?.map(normalizePath) || []
        expect(actualPaths).to.include.members([normalizePath(rootPath)])
        expect(listDirectoryMessage?.messageId?.startsWith('tooluse_')).to.be.true
    })

    it('executes bash command using executeBash tool', async () => {
        const encryptedMessage = await encryptObjectWithKey<ChatParams>(
            {
                tabId,
                prompt: { prompt: 'Execute ls command using the executeBash tool.' },
            },
            encryptionKey
        )
        const result = await client.sendChatPrompt({ message: encryptedMessage })
        const decryptedResult = await decryptObjectWithKey<ChatResult>(result, encryptionKey)

        expect(decryptedResult.additionalMessages).to.be.an('array')
        const executeBashMessage = decryptedResult.additionalMessages?.find(
            msg => msg.type === 'tool' && msg.body?.startsWith('```') && msg.body?.endsWith('```')
        )
        expect(executeBashMessage).to.exist
        expect(executeBashMessage?.body).to.include('test.py')
        expect(executeBashMessage?.body).to.include('test.ts')
    })

    it('waits for user acceptance when executing mutable bash commands', async function () {
        const command =
            process.platform === 'win32'
                ? 'echo %date% > timestamp.txt && echo "Timestamp saved"'
                : 'date > timestamp.txt && echo "Timestamp saved"'

        const encryptedMessage = await encryptObjectWithKey<ChatParams>(
            {
                tabId,
                prompt: {
                    prompt: `Run this command using the executeBash tool: \`${command}\``,
                },
            },
            encryptionKey
        )

        const toolUseIdPromise = new Promise<string>((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Timeout waiting for executeBash tool use ID'))
            }, 10000) // 10 second timeout

            const dataHandler = async (data: Buffer) => {
                const message = data.toString()
                try {
                    const jsonRegex = /\{"jsonrpc":"2\.0".*?\}(?=\n|$)/g
                    const matches = message.match(jsonRegex) ?? []
                    for (const match of matches) {
                        const obj = JSON.parse(match)
                        if (obj.method !== '$/progress' || obj.params.token !== partialResultToken) {
                            continue
                        }
                        const decryptedValue = await decryptObjectWithKey<ChatResult>(obj.params.value, encryptionKey)
                        const executeBashMessage = decryptedValue.additionalMessages?.find(
                            m => m.type === 'tool' && m.header?.body === 'shell'
                        )
                        if (!executeBashMessage?.messageId) {
                            continue
                        }
                        resolve(executeBashMessage.messageId)
                        serverProcess.stdout.removeListener('data', dataHandler)
                        clearTimeout(timeout)
                    }
                } catch (err) {
                    // Continue even if regex matching fails
                }
            }
            serverProcess.stdout.on('data', dataHandler)
        })

        // Start the chat but don't await it yet
        const chatPromise = client.sendChatPrompt({ message: encryptedMessage, partialResultToken })
        const toolUseId = await toolUseIdPromise

        // Simulate button click
        const buttonClickResult = await client.buttonClick({
            tabId,
            buttonId: 'run-shell-command',
            messageId: toolUseId,
        })
        expect(buttonClickResult.success).to.be.true

        const chatResult = await chatPromise
        const decryptedResult = await decryptObjectWithKey<ChatResult>(chatResult, encryptionKey)

        expect(decryptedResult.additionalMessages).to.be.an('array')
        const executeBashMessage = decryptedResult.additionalMessages?.find(
            msg => msg.type === 'tool' && msg.messageId === toolUseId
        )
        expect(executeBashMessage).to.exist
        expect(executeBashMessage?.body).to.include('Timestamp saved')
    })

    it('writes to a file using fsWrite tool', async () => {
        const fileName = 'testWrite.txt'
        const filePath = path.join(rootPath, fileName)
        const encryptedMessage = await encryptObjectWithKey<ChatParams>(
            {
                tabId,
                prompt: { prompt: `Write "Hello World" to ${filePath} using the fsWrite tool.` },
            },
            encryptionKey
        )
        const result = await client.sendChatPrompt({ message: encryptedMessage })
        const decryptedResult = await decryptObjectWithKey<ChatResult>(result, encryptionKey)

        expect(decryptedResult.additionalMessages).to.be.an('array')
        const fsWriteMessage = decryptedResult.additionalMessages?.find(
            msg => msg.type === 'tool' && msg.header?.buttons?.[0].id === 'undo-changes'
        )
        expect(fsWriteMessage).to.exist
        expect(fsWriteMessage?.messageId?.startsWith('tooluse_')).to.be.true
        expect(fsWriteMessage?.header?.fileList?.filePaths).to.include.members([fileName])
        expect(fsWriteMessage?.header?.fileList?.details?.[fileName]?.changes).to.deep.equal({ added: 1, deleted: 0 })
        expect(fsWriteMessage?.header?.fileList?.details?.[fileName]?.description).to.equal(filePath)

        // Verify the file was created
        expect(fs.existsSync(filePath)).to.be.true
        fs.rmSync(filePath, { force: true }) // Clean up the file after test
    })

    it('replaces file content using fsReplace tool', async () => {
        const fileName = 'testReplace.txt'
        const filePath = path.join(rootPath, fileName)
        const originalContent = 'Hello World\nThis is a test file\nEnd of file'

        // Create initial file
        fs.writeFileSync(filePath, originalContent)

        const encryptedMessage = await encryptObjectWithKey<ChatParams>(
            {
                tabId,
                prompt: {
                    prompt: `Replace "Hello World" with "Goodbye World" and "test file" with "sample file" in ${filePath} using the fsReplace tool.`,
                },
            },
            encryptionKey
        )
        const result = await client.sendChatPrompt({ message: encryptedMessage })
        const decryptedResult = await decryptObjectWithKey<ChatResult>(result, encryptionKey)

        expect(decryptedResult.additionalMessages).to.be.an('array')
        const fsReplaceMessage = decryptedResult.additionalMessages?.find(
            msg => msg.type === 'tool' && msg.header?.buttons?.[0].id === 'undo-changes'
        )
        expect(fsReplaceMessage).to.exist
        expect(fsReplaceMessage?.messageId?.startsWith('tooluse_')).to.be.true
        expect(fsReplaceMessage?.header?.fileList?.filePaths).to.include.members([fileName])
        expect(fsReplaceMessage?.header?.fileList?.details?.[fileName]?.description).to.equal(filePath)

        // Verify the file content was replaced
        const updatedContent = fs.readFileSync(filePath, 'utf8')
        expect(updatedContent).to.include('Goodbye World')
        expect(updatedContent).to.include('sample file')
        expect(updatedContent).to.not.include('Hello World')
        expect(updatedContent).to.not.include('test file')

        fs.rmSync(filePath, { force: true }) // Clean up
    })

    it('searches for files using fileSearch tool', async () => {
        const encryptedMessage = await encryptObjectWithKey<ChatParams>(
            {
                tabId,
                prompt: { prompt: 'Search for files with "test" in the name using the fileSearch tool.' },
            },
            encryptionKey
        )
        const result = await client.sendChatPrompt({ message: encryptedMessage })
        const decryptedResult = await decryptObjectWithKey<ChatResult>(result, encryptionKey)

        expect(decryptedResult.additionalMessages).to.be.an('array')
        const fileSearchMessage = decryptedResult.additionalMessages?.find(
            msg => msg.type === 'tool' && msg.header?.body === 'Searched for `test` in '
        )
        expect(fileSearchMessage).to.exist
        expect(fileSearchMessage?.messageId?.startsWith('tooluse_')).to.be.true
        expect(fileSearchMessage?.header?.status?.text).to.equal('3 results found')
        const actualPaths = fileSearchMessage?.header?.fileList?.filePaths?.map(normalizePath) || []
        expect(actualPaths).to.include.members([normalizePath(rootPath)])
    })
})
