import * as assert from 'assert'
import { FsRead } from './fsRead'
import * as path from 'path'
import * as fs from 'fs/promises'
import * as os from 'os'
import { TestFeatures } from '@aws/language-server-runtimes/testing'
import { Workspace } from '@aws/language-server-runtimes/server-interface'
import { StubbedInstance } from 'ts-sinon'

describe('FsRead Tool', () => {
    let features: TestFeatures
    let testFolder: TestFolder

    before(async () => {
        features = new TestFeatures()
        features.workspace = {
            // @ts-ignore reading a file should use readOnly fs operations
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
        testFolder = await TestFolder.create()
    })

    after(async () => {
        testFolder.delete()
    })

    afterEach(async () => {
        testFolder.clear()
    })

    it('throws if path is empty', async () => {
        const fsRead = new FsRead(features, { path: '', homePath: os.homedir() })
        await assert.rejects(fsRead.validate(), /Path cannot be empty/i, 'Expected an error about empty path')
    })

    it('reads entire file', async () => {
        const fileContent = 'Line 1\nLine 2\nLine 3'
        const filePath = await testFolder.write('fullFile.txt', fileContent)

        const fsRead = new FsRead(features, { path: filePath, homePath: os.homedir() })
        await fsRead.validate()
        const result = await fsRead.invoke(process.stdout)

        assert.strictEqual(result.output.kind, 'text', 'Output kind should be "text"')
        assert.strictEqual(result.output.content, fileContent, 'File content should match exactly')
    })

    it('reads partial lines of a file', async () => {
        const fileContent = 'A\nB\nC\nD\nE\nF'
        const filePath = await testFolder.write('partialFile.txt', fileContent)

        const fsRead = new FsRead(features, { path: filePath, readRange: [2, 4], homePath: os.homedir() })
        await fsRead.validate()
        const result = await fsRead.invoke(process.stdout)

        assert.strictEqual(result.output.kind, 'text')
        assert.strictEqual(result.output.content, 'B\nC\nD')
    })

    it('throws error if path does not exist', async () => {
        const filePath = path.join(testFolder.folderPath, 'no_such_file.txt')
        const fsRead = new FsRead(features, { path: filePath, homePath: os.homedir() })

        await assert.rejects(
            fsRead.validate(),
            /does not exist or cannot be accessed/i,
            'Expected an error indicating the path does not exist'
        )
    })

    it('throws error if content exceeds 30KB', async function () {
        const bigContent = 'x'.repeat(35_000)

        const filePath = await testFolder.write('bigFile.txt', bigContent)

        const fsRead = new FsRead(features, { homePath: os.homedir(), path: filePath })
        await fsRead.validate()

        await assert.rejects(
            fsRead.invoke(process.stdout),
            /This tool only supports reading \d+ bytes at a time/i,
            'Expected a size-limit error'
        )
    })

    it('invalid line range', async () => {
        const filePath = await testFolder.write('rangeTest.txt', '1\n2\n3')
        const fsRead = new FsRead(features, { path: filePath, readRange: [3, 2], homePath: os.homedir() })

        await fsRead.validate()
        const result = await fsRead.invoke(process.stdout)
        assert.strictEqual(result.output.kind, 'text')
        assert.strictEqual(result.output.content, '')
    })
})

// TODO: move this a test utility file.
class TestFolder {
    private constructor(public readonly folderPath: string) {}

    async write(fileName: string, content: string): Promise<string> {
        const filePath = path.join(this.folderPath, fileName)
        await fs.writeFile(filePath, content)
        return filePath
    }

    static async create() {
        const tempDir = path.join(os.type() === 'Darwin' ? '/tmp' : os.tmpdir(), 'aws-language-servers')
        await fs.mkdir(tempDir, { recursive: true })
        return new TestFolder(tempDir)
    }

    async delete() {
        fs.rm(this.folderPath, { recursive: true, force: true })
    }

    async clear() {
        const files = await fs.readdir(this.folderPath)
        for (const f of files) {
            await fs.rm(path.join(this.folderPath, f), { recursive: true, force: true })
        }
    }
}
