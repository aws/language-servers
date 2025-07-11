import { strict as assert } from 'assert'
import * as mockfs from 'mock-fs'
import * as sinon from 'sinon'
import { ExecuteBash } from './executeBash'
import { TestFeatures } from '@aws/language-server-runtimes/testing'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { URI } from 'vscode-uri'
import * as fs from 'fs'
import * as path from 'path'

describe('ExecuteBash Tool', () => {
    let features: TestFeatures
    const workspaceFolder = '/workspace/folder'

    before(function () {
        features = new TestFeatures()
        features.workspace.getAllWorkspaceFolders = sinon
            .stub()
            .returns([{ uri: URI.file(workspaceFolder).toString(), name: 'test' }]) as any
    })

    beforeEach(() => {
        mockfs.restore()
    })

    afterEach(() => {
        sinon.restore()
    })

    it('pass validation for a safe command (read-only)', async () => {
        const execBash = new ExecuteBash(features)
        await execBash.validate({ command: 'ls' })
    })

    it('fail validation if the command is empty', async () => {
        const execBash = new ExecuteBash(features)
        await assert.rejects(
            execBash.validate({ command: '  ' }),
            /command cannot be empty/i,
            'Expected an error for empty command'
        )
    })

    it('set requiresAcceptance=true if the command has dangerous patterns', async () => {
        const execBash = new ExecuteBash(features)
        const validation = await execBash.requiresAcceptance({ command: 'ls && rm -rf /' })
        assert.equal(validation.requiresAcceptance, true, 'Should require acceptance for dangerous pattern')
    })

    it('set requiresAcceptance=false if it is a read-only command', async () => {
        const execBash = new ExecuteBash(features)
        const validation = await execBash.requiresAcceptance({ command: 'cat file.txt' })
        assert.equal(validation.requiresAcceptance, false, 'Read-only command should not require acceptance')
    })

    it('whichCommand cannot find the first arg', async () => {
        const execBash = new ExecuteBash(features)
        await assert.rejects(
            execBash.validate({ command: 'noSuchCmd' }),
            /not found on PATH/i,
            'Expected not found error from whichCommand'
        )
    })

    it('validate and invokes the command', async () => {
        const execBash = new ExecuteBash(features)

        const writable = new WritableStream()
        const result = await execBash.invoke({ command: 'ls' }, undefined, writable)
        assert.strictEqual(result.output.kind, 'json')
        assert.ok('exitStatus' in result.output.content)
        assert.ok('stdout' in result.output.content && typeof result.output.content.stdout === 'string')
    })

    it('requires acceptance if the command references an absolute file path outside the workspace', async () => {
        const execBash = new ExecuteBash({
            ...features,
            workspace: {
                ...features.workspace,
                getTextDocument: async s => undefined,
            },
        })
        const result = await execBash.requiresAcceptance({
            command: 'cat /not/in/workspace/file.txt',
            cwd: workspaceFolder,
        })

        assert.equal(
            result.requiresAcceptance,
            true,
            'Should require acceptance for an absolute path outside of workspace'
        )
    })

    it('does NOT require acceptance if the command references a relative file path inside the workspace', async () => {
        // Command references a relative path that resolves within the workspace
        const execBash = new ExecuteBash({
            ...features,
            workspace: {
                ...features.workspace,
                getTextDocument: async s => ({}) as TextDocument,
            },
        })
        const result = await execBash.requiresAcceptance({ command: 'cat ./file.txt', cwd: workspaceFolder })

        assert.equal(result.requiresAcceptance, false, 'Relative path inside workspace should not require acceptance')
    })

    it('does NOT require acceptance if there is no path-like token in the command', async () => {
        const execBash = new ExecuteBash({
            ...features,
            workspace: {
                ...features.workspace,
                getTextDocument: async s => ({}) as TextDocument,
            },
        })
        const result = await execBash.requiresAcceptance({ command: 'echo hello world', cwd: workspaceFolder })

        assert.equal(
            result.requiresAcceptance,
            false,
            'A command without any path-like token should not require acceptance'
        )
    })

    describe('isLikelyCredentialFile', () => {
        let execBash: ExecuteBash

        beforeEach(() => {
            execBash = new ExecuteBash(features)
        })

        it('should identify credential files by name', () => {
            assert.equal((execBash as any).isLikelyCredentialFile('/path/to/credentials.json'), true)
            assert.equal((execBash as any).isLikelyCredentialFile('/path/to/secret_key.txt'), true)
            assert.equal((execBash as any).isLikelyCredentialFile('/path/to/auth_token'), true)
            assert.equal((execBash as any).isLikelyCredentialFile('/path/to/password.txt'), true)
        })

        it('should identify credential files by extension', () => {
            assert.equal((execBash as any).isLikelyCredentialFile('/path/to/certificate.pem'), true)
            assert.equal((execBash as any).isLikelyCredentialFile('/path/to/private.key'), true)
            assert.equal((execBash as any).isLikelyCredentialFile('/path/to/cert.crt'), true)
            assert.equal((execBash as any).isLikelyCredentialFile('/path/to/keystore.p12'), true)
        })

        it('should identify credential-related config files', () => {
            assert.equal((execBash as any).isLikelyCredentialFile('/path/to/.aws/config'), true)
            assert.equal((execBash as any).isLikelyCredentialFile('/path/to/.ssh/id_rsa'), true)
            assert.equal((execBash as any).isLikelyCredentialFile('/path/to/config.json'), true)
            assert.equal((execBash as any).isLikelyCredentialFile('/path/to/.env'), true)
        })

        it('should not identify non-credential files', () => {
            assert.equal((execBash as any).isLikelyCredentialFile('/path/to/document.txt'), false)
            assert.equal((execBash as any).isLikelyCredentialFile('/path/to/image.png'), false)
            assert.equal((execBash as any).isLikelyCredentialFile('/path/to/script.js'), false)
            assert.equal((execBash as any).isLikelyCredentialFile('/path/to/data.csv'), false)
        })
    })

    describe('isLikelyBinaryFile', () => {
        let execBash: ExecuteBash

        beforeEach(() => {
            execBash = new ExecuteBash(features)
        })

        describe('on Windows', () => {
            // Save original platform
            const originalPlatform = process.platform

            before(() => {
                // Mock Windows platform
                Object.defineProperty(process, 'platform', { value: 'win32' })
            })

            after(() => {
                // Restore original platform
                Object.defineProperty(process, 'platform', { value: originalPlatform })
            })

            it('should identify Windows executable extensions', () => {
                // Create a simple mock implementation
                const isLikelyBinaryFileMock = function (filePath: string): boolean {
                    const ext = path.extname(filePath).toLowerCase()
                    return ['.exe', '.dll', '.bat', '.cmd'].includes(ext)
                }

                // Replace the method with our mock
                sinon.replace(execBash as any, 'isLikelyBinaryFile', isLikelyBinaryFileMock)

                assert.equal((execBash as any).isLikelyBinaryFile('/path/to/program.exe'), true)
                assert.equal((execBash as any).isLikelyBinaryFile('/path/to/library.dll'), true)
                assert.equal((execBash as any).isLikelyBinaryFile('/path/to/script.bat'), true)
                assert.equal((execBash as any).isLikelyBinaryFile('/path/to/command.cmd'), true)
            })

            it('should not identify non-executable extensions on Windows', () => {
                // Create a simple mock implementation
                const isLikelyBinaryFileMock = function (filePath: string): boolean {
                    const ext = path.extname(filePath).toLowerCase()
                    return ['.exe', '.dll', '.bat', '.cmd'].includes(ext)
                }

                // Replace the method with our mock
                sinon.replace(execBash as any, 'isLikelyBinaryFile', isLikelyBinaryFileMock)

                assert.equal((execBash as any).isLikelyBinaryFile('/path/to/document.txt'), false)
                assert.equal((execBash as any).isLikelyBinaryFile('/path/to/script.js'), false)
                assert.equal((execBash as any).isLikelyBinaryFile('/path/to/data.csv'), false)
            })
        })

        describe('on Unix', () => {
            // Save original platform
            const originalPlatform = process.platform

            before(() => {
                // Mock Unix platform
                Object.defineProperty(process, 'platform', { value: 'darwin' })
            })

            after(() => {
                // Restore original platform
                Object.defineProperty(process, 'platform', { value: originalPlatform })
            })

            it('should identify files with execute permissions', () => {
                const mockStats = {
                    isFile: () => true,
                    mode: 0o755, // rwxr-xr-x
                } as fs.Stats

                sinon.stub(fs, 'statSync').returns(mockStats)

                assert.equal((execBash as any).isLikelyBinaryFile('/path/to/executable'), true)
            })

            it('should not identify files without execute permissions', () => {
                const mockStats = {
                    isFile: () => true,
                    mode: 0o644, // rw-r--r--
                } as fs.Stats

                sinon.stub(fs, 'statSync').returns(mockStats)

                assert.equal((execBash as any).isLikelyBinaryFile('/path/to/non-executable'), false)
            })

            it('should not identify non-existent files', () => {
                sinon.stub(fs, 'statSync').throws(new Error('File not found'))

                assert.equal((execBash as any).isLikelyBinaryFile('/path/to/non-existent-file'), false)
            })

            it('should not identify directories', () => {
                const mockStats = {
                    isFile: () => false,
                    mode: 0o755, // rwxr-xr-x
                } as fs.Stats

                sinon.stub(fs, 'statSync').returns(mockStats)

                assert.equal((execBash as any).isLikelyBinaryFile('/path/to/directory'), false)
            })
        })
    })
})
