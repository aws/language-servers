import mock = require('mock-fs')
import * as fs from 'fs'
import * as assert from 'assert'
import * as cp from 'child_process'

describe('demo', function () {
    let temporaryDir: string

    before(function () {
        temporaryDir = '/tmp/myTestDirectory'
    })

    // This is needed unless fs is mocked and its very hard to tell that its mocked.
    // It does not work in the before loop.
    // beforeEach(function () {
    //     mock.restore()
    // })

    it('test', async function () {
        // Create temporary dir and assert it exists.
        fs.mkdirSync(temporaryDir, { recursive: true })
        assert.ok(fs.existsSync(temporaryDir), 'does not exist directly after creating')

        // Run a process that checks that it exists.
        const result = new Promise((resolve, reject) => {
            const proc = cp.spawn('ls', [temporaryDir])
            proc.on('exit', function (code) {
                resolve(code)
            })
            proc.stderr.on('data', function (data) {
                reject(data.toString())
            })
        })
        const r = await result
        // Assert that process found the file
        assert.strictEqual(r, 0, 'did not exit with 0')
        assert.ok(fs.existsSync(temporaryDir), 'does not exist after the test')
        fs.rmdirSync(temporaryDir, { recursive: true })
        assert.ok(!fs.existsSync(temporaryDir), 'exists after removing the test')
    })
})
