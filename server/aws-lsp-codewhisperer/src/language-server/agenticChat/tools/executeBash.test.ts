import { strict as assert } from 'assert'
import * as mockfs from 'mock-fs'
import * as sinon from 'sinon'
import { ExecuteBash } from './executeBash'
import { TestFeatures } from '@aws/language-server-runtimes/testing'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { URI } from 'vscode-uri'

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
})
