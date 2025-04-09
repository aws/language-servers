import { strict as assert } from 'assert'
import * as mockfs from 'mock-fs'
import * as sinon from 'sinon'
import { ExecuteBash } from './executeBash'
import { Logging } from '@aws/language-server-runtimes/server-interface'
import { TestFeatures } from '@aws/language-server-runtimes/testing'

describe('ExecuteBash Tool', () => {
    let logging: Logging

    before(function () {
        logging = new TestFeatures().logging
    })

    beforeEach(() => {
        mockfs.restore()
    })

    afterEach(() => {
        sinon.restore()
    })

    it('pass validation for a safe command (read-only)', async () => {
        const execBash = new ExecuteBash(logging)
        await execBash.validate(logging, 'ls')
    })

    it('fail validation if the command is empty', async () => {
        const execBash = new ExecuteBash(logging)
        await assert.rejects(
            execBash.validate(logging, '   '),
            /Bash command cannot be empty/i,
            'Expected an error for empty command'
        )
    })

    it('set requiresAcceptance=true if the command has dangerous patterns', () => {
        const execBash = new ExecuteBash(logging)
        const validation = execBash.requiresAcceptance('ls && rm -rf /')
        assert.equal(validation.requiresAcceptance, true, 'Should require acceptance for dangerous pattern')
    })

    it('set requiresAcceptance=false if it is a read-only command', () => {
        const execBash = new ExecuteBash(logging)
        const validation = execBash.requiresAcceptance('cat file.txt')
        assert.equal(validation.requiresAcceptance, false, 'Read-only command should not require acceptance')
    })

    it('whichCommand cannot find the first arg', async () => {
        const execBash = new ExecuteBash(logging)
        await assert.rejects(
            execBash.validate(logging, 'noSuchCmd'),
            /not found on PATH/i,
            'Expected not found error from whichCommand'
        )
    })

    it('validate and invokes the command', async () => {
        const execBash = new ExecuteBash(logging)

        const writable = new WritableStream()
        const result = await execBash.invoke({ command: 'ls' }, writable)

        assert.strictEqual(result.output.kind, 'json')
        assert.ok('exitStatus' in result.output.content && result.output.content.exitStatus === '0')
        assert.ok(
            'stdout' in result.output.content &&
                typeof result.output.content.stdout === 'string' &&
                result.output.content.stdout.length > 0
        )
    })
})
