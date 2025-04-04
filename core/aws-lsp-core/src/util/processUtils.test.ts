import * as assert from 'assert'
import * as os from 'os'
import * as path from 'path'
import * as sinon from 'sinon'
import { chmod } from 'fs/promises'
import { ChildProcess, ChildProcessResult, ChildProcessTracker, eof, ProcessStats } from './processUtils'
import { waitUntil } from './timeoutUtils'
import { TestFolder } from '../test/testFolder'
import { TestFeatures } from '@aws/language-server-runtimes/testing'
import { Logging } from '@aws/language-server-runtimes/server-interface'
import { Features } from '@aws/language-server-runtimes/server-interface/server'

const defaultBatchFileContent = '@echo hi'
const defaultCmdFileContent = '@echo OFF${os.EOL}echo hi'

describe('ChildProcess', async function () {
    let tempFolder: TestFolder
    let testFeatures: TestFeatures

    beforeEach(async function () {
        tempFolder = await TestFolder.create()
        testFeatures = new TestFeatures()
    })

    afterEach(async function () {
        await tempFolder.delete()
    })

    after(async function () {
        ChildProcessTracker.getInstance(testFeatures.logging).clear()
    })

    describe('run', async function () {
        async function assertRegularRun(childProcess: ChildProcess): Promise<void> {
            const result = await childProcess.run()
            assert.strictEqual(result.exitCode, 0, 'Unexpected close code')
            assert.strictEqual(result.stdout, 'hi', 'Unexpected stdout')
        }

        if (process.platform === 'win32') {
            it.skip('starts and captures stdout - windows', async function () {
                const batchFile = await tempFolder.write('test-script.bat', defaultBatchFileContent)

                const childProcess = new ChildProcess(testFeatures.logging, batchFile)

                await assertRegularRun(childProcess)
            })

            it('runs cmd files containing a space in the filename and folder', async function () {
                const subfolder = await tempFolder.createNested('sub folder')
                const command = await subfolder.write('test script.cmd', defaultCmdFileContent)

                const childProcess = new ChildProcess(testFeatures.logging, command)

                await assertRegularRun(childProcess)
            })

            it('errs when starting twice - windows', async function () {
                const batchFile = await tempFolder.write('test-script.bat', defaultBatchFileContent)

                const childProcess = new ChildProcess(testFeatures.logging, batchFile)

                // We want to verify that the error is thrown even if the first
                // invocation is still in progress, so we don't await the promise.
                const firstRun = childProcess.run().catch(() => {
                    // Do nothing.
                })

                try {
                    await childProcess.run()
                } catch (err) {
                    await firstRun
                    return
                }

                assert.fail('Expected exception, but none was thrown.')
            })
        } // END Windows only tests

        if (process.platform !== 'win32') {
            it.skip('runs and captures stdout - unix', async function () {
                const scriptFile = await writeShellFile(tempFolder, 'test-script.sh')

                const childProcess = new ChildProcess(testFeatures.logging, scriptFile)

                await assertRegularRun(childProcess)
            })

            it('errs when starting twice - unix', async function () {
                const scriptFile = await writeShellFile(tempFolder, 'test-script.sh')

                const childProcess = new ChildProcess(testFeatures.logging, scriptFile)

                // We want to verify that the error is thrown even if the first
                // invocation is still in progress, so we don't await the promise.
                const firstRun = childProcess.run().catch(() => {
                    // Do nothing.
                })

                try {
                    await childProcess.run()
                } catch (err) {
                    await firstRun
                    return
                }

                assert.fail('Expected exception, but none was thrown.')
            })
        } // END Linux only tests

        it.skip('runs scripts containing a space in the filename and folder', async function () {
            const subfolder = await tempFolder.createNested('sub folder')

            let command: string

            if (process.platform === 'win32') {
                command = await subfolder.write('test script.bat', defaultBatchFileContent)
            } else {
                command = await writeShellFile(subfolder, 'test script.sh')
            }

            const childProcess = new ChildProcess(testFeatures.logging, command)

            await assertRegularRun(childProcess)
        })

        it('reports error for missing executable', async function () {
            const batchFile = path.join(tempFolder.path, 'nonExistentScript')

            const childProcess = new ChildProcess(testFeatures.logging, batchFile)

            const result = await childProcess.run()
            assert.notStrictEqual(result.exitCode, 0, 'Expected an error close code')
        })

        describe('Extra options', function () {
            let childProcess: ChildProcess

            beforeEach(async function () {
                const isWindows = process.platform === 'win32'
                const filename = `test-script.${isWindows ? 'bat' : 'sh'}`
                let command: string
                if (isWindows) {
                    command = await tempFolder.write(
                        filename,
                        ['@echo %1', '@echo %2', '@echo "%3"', 'SLEEP 20', 'exit 1'].join(os.EOL)
                    )
                } else {
                    command = await writeShellFile(
                        tempFolder,
                        filename,
                        ['echo $1', 'echo $2', 'echo "$3"', 'sleep 20', 'exit 1'].join(os.EOL)
                    )
                }

                childProcess = new ChildProcess(testFeatures.logging, command, ['1', '2'], { collect: false })
            })

            it.skip('can report errors', async function () {
                const result = childProcess.run({
                    rejectOnError: true,
                    useForceStop: true,
                    onStdout: (text, context) => {
                        if (text.includes('2')) {
                            context.reportError('Got 2')
                        }
                    },
                })

                try {
                    await result
                    assert.fail('expected errors')
                } catch (e) {
                    childProcess.stop(true)
                }
            })

            it.skip('can reject on errors if `rejectOnError` is set', async function () {
                return await assert.rejects(
                    async () =>
                        await childProcess.run({
                            rejectOnError: true,
                            onStdout: (text, context) => {
                                context.reportError('An error')
                            },
                        })
                )
            })

            it.skip('kills the process if an error is reported', async function () {
                const result = await childProcess.run({
                    waitForStreams: false,
                    onStdout: (_text, context) => {
                        context.reportError('An error')
                    },
                })
                assert.notStrictEqual(result.exitCode, 1)
            })

            it.skip('can merge with base options', async function () {
                const result = await childProcess.run({
                    collect: true,
                    waitForStreams: false,
                    extraArgs: ['4'],
                    onStdout: (text, context) => {
                        if (text.includes('4')) {
                            context.reportError('Got 4')
                        }
                    },
                })
                assert.ok(result.stdout.length !== 0)
                assert.ok(result.error?.message.includes('Got 4'))
            })

            it.skip('respects timeout parameter', async function () {
                await childProcess.run({
                    waitForStreams: false,
                    spawnOptions: {
                        timeout: 10,
                    },
                })
                assert.strictEqual(childProcess.result()?.signal, 'SIGTERM')
            })
        })
    })

    describe('stop()', async function () {
        if (process.platform === 'win32') {
            it.skip('detects running processes and successfully stops a running process - Windows', async function () {
                const batchFile = await writeBatchFileWithDelays(tempFolder, 'test-script.bat')

                const childProcess = new ChildProcess(testFeatures.logging, batchFile)

                // `await` is intentionally not used, we want to check the process while it runs.
                const proc = childProcess.run().catch(() => {
                    // Do nothing.
                })

                assert.strictEqual(childProcess.stopped, false)
                childProcess.stop()
                await waitUntil(async () => childProcess.stopped, { timeout: 1000, interval: 100, truthy: true })
                await proc
                assert.strictEqual(childProcess.stopped, true)
            })

            it.skip('can stop() previously stopped processes - Windows', async function () {
                const batchFile = await writeBatchFileWithDelays(tempFolder, 'test-script.bat')

                const childProcess = new ChildProcess(testFeatures.logging, batchFile)

                // `await` is intentionally not used, we want to check the process while it runs.
                childProcess.run().catch(() => {
                    // Do nothing.
                })

                childProcess.stop()
                await waitUntil(async () => childProcess.stopped, { timeout: 1000, interval: 100, truthy: true })
                assert.strictEqual(childProcess.stopped, true)
                assert.doesNotThrow(() => childProcess.stop())
            })
        } // END Windows-only tests

        if (process.platform !== 'win32') {
            it.skip('detects running processes and successfully stops a running process - Unix', async function () {
                const scriptFile = await writeShellFileWithDelays(tempFolder, 'test-script.sh')

                const childProcess = new ChildProcess(testFeatures.logging, 'sh', [scriptFile])
                const result = childProcess.run()

                assert.strictEqual(childProcess.stopped, false)
                childProcess.stop()
                await result

                assert.strictEqual(childProcess.stopped, true)
            })

            it.skip('can stop() previously stopped processes - Unix', async function () {
                const scriptFile = await writeShellFileWithDelays(tempFolder, 'test-script.sh')

                const childProcess = new ChildProcess(testFeatures.logging, scriptFile)

                const result = childProcess.run()

                childProcess.stop()
                await result

                assert.strictEqual(childProcess.stopped, true)
                assert.doesNotThrow(() => childProcess.stop())
            })

            it.skip('can send input - Unix', async function () {
                const childProcess = new ChildProcess(testFeatures.logging, 'cat')
                const result = childProcess.run()
                await childProcess.send('foo')
                await childProcess.send(eof)
                const { stdout } = await result
                assert.strictEqual(stdout, 'foo')
            })
        } // END Unix-only tests
    })

    async function writeBatchFileWithDelays(folder: TestFolder, filename: string): Promise<string> {
        const file = `
        @echo hi
        SLEEP 20
        @echo bye`
        return await folder.write(filename, file)
    }

    async function writeShellFile(folder: TestFolder, filename: string, contents = 'echo hi'): Promise<string> {
        const result = await folder.write(filename, `#!/bin/sh\n${contents}`)
        await chmod(result, 0o744)
        return result
    }

    async function writeShellFileWithDelays(folder: TestFolder, filename: string): Promise<string> {
        const file = `
        echo hi
        sleep 20
        echo bye`
        return await writeShellFile(folder, filename, file)
    }
})

interface RunningProcess {
    childProcess: ChildProcess
    result: Promise<ChildProcessResult>
}

function getSleepCmd() {
    return process.platform === 'win32' ? 'timeout' : 'sleep'
}

function startSleepProcess(logger: Logging, timeout: number = 90): RunningProcess {
    const childProcess = new ChildProcess(logger, getSleepCmd(), [timeout.toString()])
    const result = childProcess.run().catch(() => assert.fail('sleep command threw an error'))
    return { childProcess, result }
}

describe('ChildProcessTracker', function () {
    let tracker: ChildProcessTracker
    let clock: sinon.SinonFakeTimers
    let logging: Features['logging']
    let warnings: string[]
    let usageMock: sinon.SinonStub

    async function stopAndWait(runningProcess: RunningProcess): Promise<void> {
        runningProcess.childProcess.stop(true)
        const waitForResult = runningProcess.result
        await clock.tickAsync(1000)
        await waitForResult
    }

    before(function () {
        warnings = []
        logging = {
            warn: m => warnings.push(m),
            error: _ => {},
            info: _ => {},
            log: _ => {},
            debug: _ => {},
        }

        clock = sinon.useFakeTimers({ shouldClearNativeTimers: true })
        tracker = ChildProcessTracker.getInstance(logging)
        usageMock = sinon.stub(ChildProcessTracker.prototype, 'getUsage')
    })

    afterEach(function () {
        tracker.clear()
        warnings = []
    })

    after(function () {
        clock.restore()
        usageMock.restore()
    })

    it(`removes stopped processes every ${ChildProcessTracker.pollingInterval / 1000} seconds`, async function () {
        // Start a 'sleep' command, check it only removes after we stop it.
        const runningProcess = startSleepProcess(logging)
        tracker.add(runningProcess.childProcess)
        assert.strictEqual(tracker.has(runningProcess.childProcess), true, 'failed to add sleep command')

        await clock.tickAsync(ChildProcessTracker.pollingInterval)
        assert.strictEqual(tracker.has(runningProcess.childProcess), true, 'process was mistakenly removed')
        await stopAndWait(runningProcess)

        await clock.tickAsync(ChildProcessTracker.pollingInterval)
        assert.strictEqual(tracker.has(runningProcess.childProcess), false, 'process was not removed after stopping')
    })

    it('multiple processes from same command are tracked seperately', async function () {
        const runningProcess1 = startSleepProcess(logging)
        const runningProcess2 = startSleepProcess(logging)
        tracker.add(runningProcess1.childProcess)
        tracker.add(runningProcess2.childProcess)

        assert.strictEqual(tracker.has(runningProcess1.childProcess), true, 'Missing first process')
        assert.strictEqual(tracker.has(runningProcess2.childProcess), true, 'Missing second process')

        await stopAndWait(runningProcess1)
        await clock.tickAsync(ChildProcessTracker.pollingInterval)
        assert.strictEqual(tracker.has(runningProcess2.childProcess), true, 'second process was mistakenly removed')
        assert.strictEqual(
            tracker.has(runningProcess1.childProcess),
            false,
            'first process was not removed after stopping it'
        )

        await stopAndWait(runningProcess2)
        await clock.tickAsync(ChildProcessTracker.pollingInterval)
        assert.strictEqual(
            tracker.has(runningProcess2.childProcess),
            false,
            'second process was not removed after stopping it'
        )

        assert.strictEqual(tracker.size, 0, 'expected tracker to be empty')
    })

    it.skip('logs a warning message when system usage exceeds threshold', async function () {
        const runningProcess = startSleepProcess(logging)
        tracker.add(runningProcess.childProcess)

        const highCpu: ProcessStats = {
            cpu: ChildProcessTracker.thresholds.cpu + 1,
            memory: 0,
        }
        const highMemory: ProcessStats = {
            cpu: 0,
            memory: ChildProcessTracker.thresholds.memory + 1,
        }
        usageMock.returns(highCpu)
        await clock.tickAsync(ChildProcessTracker.pollingInterval)
        assert.strictEqual(warnings.length, 1)
        assert.ok(warnings[0].includes('exceeded cpu threshold'))

        usageMock.returns(highMemory)
        await clock.tickAsync(ChildProcessTracker.pollingInterval)
        assert.strictEqual(warnings.length, 2)
        assert.ok(warnings[1].includes('exceeded memory threshold'))

        await stopAndWait(runningProcess)
    })

    it.skip('includes pid in logs', async function () {
        const runningProcess = startSleepProcess(logging)
        tracker.add(runningProcess.childProcess)

        usageMock.returns({
            cpu: ChildProcessTracker.thresholds.cpu + 1,
            memory: 0,
        })

        await clock.tickAsync(ChildProcessTracker.pollingInterval)
        assert.strictEqual(warnings.length, 1)
        assert.ok(warnings[0].includes(runningProcess.childProcess.pid().toString()))

        await stopAndWait(runningProcess)
    })

    it('does not log for processes within threshold', async function () {
        const runningProcess = startSleepProcess(logging)

        usageMock.returns({
            cpu: ChildProcessTracker.thresholds.cpu - 1,
            memory: ChildProcessTracker.thresholds.memory - 1,
        })

        await clock.tickAsync(ChildProcessTracker.pollingInterval)

        assert.throws(() => {
            assert.strictEqual(warnings.length, 1)
            assert.ok(warnings[0].includes(runningProcess.childProcess.pid().toString()))
        })

        await stopAndWait(runningProcess)
    })
})
