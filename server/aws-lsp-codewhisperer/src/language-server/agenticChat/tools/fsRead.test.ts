import * as assert from 'assert'
import { FsRead } from './fsRead'
import * as path from 'path'
import * as fs from 'fs/promises'
import { TestFeatures } from '@aws/language-server-runtimes/testing'
import { Workspace } from '@aws/language-server-runtimes/server-interface'
import { testFolder } from '@aws/lsp-core'
import { StubbedInstance } from 'ts-sinon'

describe('FsRead Tool', () => {
    let features: TestFeatures
    let tempFolder: testFolder.TestFolder

    const stdout = new WritableStream({
        write(chunk) {
            process.stdout.write(chunk)
        },
    })

    before(async () => {
        features = new TestFeatures()
        features.workspace = {
            // @ts-ignore reading a file does not require all of fs to be implemented.
            fs: {
                readFile: (path, options?) =>
                    fs.readFile(path, { encoding: (options?.encoding || 'utf-8') as BufferEncoding }),
                readdir: path => fs.readdir(path, { withFileTypes: true }),
                exists: path =>
                    fs
                        .access(path)
                        .then(() => true)
                        .catch(() => false),
            } as Workspace['fs'],
        } as StubbedInstance<Workspace>
        tempFolder = await testFolder.TestFolder.create()
    })

    after(async () => {
        tempFolder.delete()
    })

    afterEach(async () => {
        tempFolder.clear()
    })

    it('throws if path is empty', async () => {
        const fsRead = new FsRead(features)
        await assert.rejects(
            fsRead.validate({ path: '' }),
            /Path cannot be empty/i,
            'Expected an error about empty path'
        )
    })

    it('reads entire file', async () => {
        const fileContent = 'Line 1\nLine 2\nLine 3'
        const filePath = await tempFolder.write('fullFile.txt', fileContent)

        const fsRead = new FsRead(features)
        await fsRead.validate({ path: filePath })
        const result = await fsRead.invoke(stdout, { path: filePath })

        assert.strictEqual(result.output.kind, 'text', 'Output kind should be "text"')
        assert.strictEqual(result.output.content, fileContent, 'File content should match exactly')
    })

    it('reads partial lines of a file', async () => {
        const fileContent = 'A\nB\nC\nD\nE\nF'
        const filePath = await tempFolder.write('partialFile.txt', fileContent)

        const fsRead = new FsRead(features)
        await fsRead.validate({ path: filePath, readRange: [2, 4] })
        const result = await fsRead.invoke(stdout, { path: filePath, readRange: [2, 4] })

        assert.strictEqual(result.output.kind, 'text')
        assert.strictEqual(result.output.content, 'B\nC\nD')
    })

    it('throws error if path does not exist', async () => {
        const filePath = path.join(tempFolder.path, 'no_such_file.txt')
        const fsRead = new FsRead(features)

        await assert.rejects(
            fsRead.validate({ path: filePath }),
            /does not exist or cannot be accessed/i,
            'Expected an error indicating the path does not exist'
        )
    })

    it('throws error if content exceeds 30KB', async function () {
        const bigContent = 'x'.repeat(35_000)

        const filePath = await tempFolder.write('bigFile.txt', bigContent)

        const fsRead = new FsRead(features)
        await fsRead.validate({ path: filePath })

        await assert.rejects(
            fsRead.invoke(stdout, { path: filePath }),
            /This tool only supports reading \d+ bytes at a time/i,
            'Expected a size-limit error'
        )
    })

    it('invalid line range', async () => {
        const filePath = await tempFolder.write('rangeTest.txt', '1\n2\n3')
        const fsRead = new FsRead(features)

        await fsRead.validate({ path: filePath, readRange: [3, 2] })
        const result = await fsRead.invoke(stdout, { path: filePath, readRange: [3, 2] })
        assert.strictEqual(result.output.kind, 'text')
        assert.strictEqual(result.output.content, '')
    })
})
