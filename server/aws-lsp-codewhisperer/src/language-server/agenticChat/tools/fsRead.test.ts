import * as assert from 'assert'
import { FsRead } from './fsRead'
import * as path from 'path'
import * as fs from 'fs/promises'
import { TestFeatures } from '@aws/language-server-runtimes/testing'
import { TextDocument, Workspace } from '@aws/language-server-runtimes/server-interface'
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

    it('invalidates empty path', async () => {
        const fsRead = new FsRead(features)
        await assert.rejects(
            fsRead.validate({ path: '' }),
            /Path cannot be empty/i,
            'Expected an error about empty path'
        )
    })

    it('invalidates non-existent paths', async () => {
        const filePath = path.join(tempFolder.path, 'no_such_file.txt')
        const fsRead = new FsRead(features)

        await assert.rejects(
            fsRead.validate({ path: filePath }),
            /does not exist or cannot be accessed/i,
            'Expected an error indicating the path does not exist'
        )
    })

    it('truncate output if too large', async () => {
        const fileContent = 'A'.repeat(FsRead.maxResponseSize + 10)
        const filePath = await tempFolder.write('largeFile.txt', fileContent)
        const fsRead = new FsRead(features)
        await fsRead.validate({ path: filePath })
        const result = await fsRead.invoke({ path: filePath })
        assert.strictEqual(result.output.kind, 'text', 'Output kind should be "text"')
        assert.strictEqual(
            result.output.content.length,
            FsRead.maxResponseSize,
            'Output should be truncated to the max size'
        )
    })

    it('reads entire file', async () => {
        const fileContent = 'Line 1\nLine 2\nLine 3'
        const filePath = await tempFolder.write('fullFile.txt', fileContent)

        const fsRead = new FsRead(features)
        const result = await fsRead.invoke({ path: filePath })

        assert.strictEqual(result.output.kind, 'text', 'Output kind should be "text"')
        assert.strictEqual(result.output.content, fileContent, 'File content should match exactly')
    })

    it('reads partial lines of a file', async () => {
        const fileContent = 'A\nB\nC\nD\nE\nF'
        const filePath = await tempFolder.write('partialFile.txt', fileContent)

        const fsRead = new FsRead(features)
        const result = await fsRead.invoke({ path: filePath, readRange: [2, 4] })

        assert.strictEqual(result.output.kind, 'text')
        assert.strictEqual(result.output.content, 'B\nC\nD')
    })

    it('invalid line range', async () => {
        const filePath = await tempFolder.write('rangeTest.txt', '1\n2\n3')
        const fsRead = new FsRead(features)

        await fsRead.invoke({ path: filePath, readRange: [3, 2] })
        const result = await fsRead.invoke({ path: filePath, readRange: [3, 2] })
        assert.strictEqual(result.output.kind, 'text')
        assert.strictEqual(result.output.content, '')
    })

    it('updates the stream', async () => {
        const fsRead = new FsRead(features)
        const chunks = []
        const stream = new WritableStream({
            write: c => {
                chunks.push(c)
            },
        })
        await fsRead.queueDescription({ path: 'this/is/my/path' }, stream, true)
        assert.ok(chunks.length > 0)
        assert.ok(!stream.locked)
    })

    it('should require acceptance if fsPath is outside the workspace', async () => {
        const fsRead = new FsRead({
            ...features,
            workspace: {
                ...features.workspace,
                getTextDocument: async s => undefined,
            },
        })
        const result = await fsRead.requiresAcceptance({ path: '/not/in/workspace/file.txt' })
        assert.equal(
            result.requiresAcceptance,
            true,
            'Expected requiresAcceptance to be true for a path outside the workspace'
        )
    })

    it('should not require acceptance if fsPath is inside the workspace', async () => {
        const fsRead = new FsRead({
            ...features,
            workspace: {
                ...features.workspace,
                getTextDocument: async s => ({}) as TextDocument,
            },
        })
        const result = await fsRead.requiresAcceptance({ path: '/workspace/folder/file.txt' })
        assert.equal(
            result.requiresAcceptance,
            false,
            'Expected requiresAcceptance to be false for a path inside the workspace'
        )
    })
})
