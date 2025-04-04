/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { strict as assert } from 'assert'
import * as sinon from 'sinon'
import { ExecuteBash } from './executeBash'
import { processUtils } from '@aws/lsp-core'
import { Logging } from '@aws/language-server-runtimes/server-interface'
import { TestFeatures } from '@aws/language-server-runtimes/testing'

describe('ExecuteBash Tool', () => {
    let runStub: sinon.SinonStub
    let invokeStub: sinon.SinonStub
    let logging: Logging

    before(function () {
        logging = new TestFeatures().logging
    })

    beforeEach(() => {
        runStub = sinon.stub(processUtils.ChildProcess.prototype, 'run')
        invokeStub = sinon.stub(ExecuteBash.prototype, 'invoke')
    })

    afterEach(() => {
        sinon.restore()
    })

    it('pass validation for a safe command (read-only)', async () => {
        runStub.resolves({
            exitCode: 0,
            stdout: '/bin/ls',
            stderr: '',
            error: undefined,
            signal: undefined,
        })
        const execBash = new ExecuteBash(logging, { command: 'ls' })
        await execBash.validate(logging)
    })

    it('fail validation if the command is empty', async () => {
        const execBash = new ExecuteBash(logging, { command: '   ' })
        await assert.rejects(
            execBash.validate(logging),
            /Bash command cannot be empty/i,
            'Expected an error for empty command'
        )
    })

    it('set requiresAcceptance=true if the command has dangerous patterns', () => {
        const execBash = new ExecuteBash(logging, { command: 'ls && rm -rf /' })
        const validation = execBash.requiresAcceptance()
        assert.equal(validation.requiresAcceptance, true, 'Should require acceptance for dangerous pattern')
    })

    it('set requiresAcceptance=false if it is a read-only command', () => {
        const execBash = new ExecuteBash(logging, { command: 'cat file.txt' })
        const validation = execBash.requiresAcceptance()
        assert.equal(validation.requiresAcceptance, false, 'Read-only command should not require acceptance')
    })

    it('whichCommand cannot find the first arg', async () => {
        runStub.resolves({
            exitCode: 1,
            stdout: '',
            stderr: '',
            error: undefined,
            signal: undefined,
        })

        const execBash = new ExecuteBash(logging, { command: 'noSuchCmd' })
        await assert.rejects(
            execBash.validate(logging),
            /not found on PATH/i,
            'Expected not found error from whichCommand'
        )
    })

    it('whichCommand sees first arg on PATH', async () => {
        runStub.resolves({
            exitCode: 0,
            stdout: '/usr/bin/noSuchCmd\n',
            stderr: '',
            error: undefined,
            signal: undefined,
        })

        const execBash = new ExecuteBash(logging, { command: 'noSuchCmd' })
        await execBash.validate(logging)
    })

    it('stub invoke() call', async () => {
        invokeStub.resolves({
            output: {
                kind: 'json',
                content: {
                    exitStatus: '0',
                    stdout: 'mocked stdout lines',
                    stderr: '',
                },
            },
        })

        const execBash = new ExecuteBash(logging, { command: 'ls' })

        const dummyWritable = { write: () => {} } as any
        const result = await execBash.invoke(dummyWritable)

        assert.strictEqual(result.output.kind, 'json')
        const out = result.output.content as unknown as {
            exitStatus: string
            stdout: string
            stderr: string
        }
        assert.strictEqual(out.exitStatus, '0')
        assert.strictEqual(out.stdout, 'mocked stdout lines')
        assert.strictEqual(out.stderr, '')

        assert.strictEqual(invokeStub.callCount, 1)
    })
})
