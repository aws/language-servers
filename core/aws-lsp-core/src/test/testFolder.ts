import * as path from 'path'
import * as fs from 'fs'
import * as os from 'os'
import * as crypto from 'crypto'

/**
 * Interface for working with temporary files.
 * Simplified port of https://github.com/aws/aws-toolkit-vscode/blob/16477869525fb79f8dc82cb22e301aaea9c5e0c6/packages/core/src/test/testUtil.ts#L77
 *
 * Proper usage requires adding the proper logic into the hooks. See example below:
 *
 * before(async () => {
 *      ...
 *      testFolder = await TestFolder.create()
 *      ...
 * }
 * // Only necessary if test state should not bleed through.
 * afterEach(async () => {
 *      ...
 *      await testFolder.clear()
 *      ...
 * })
 *
 * after(async () => {
 *     ...
 *     await testFolder.delete()
 *     ...
 * })
 */
export class TestFolder {
    private constructor(public readonly path: string) {}

    async write(fileName: string, content: string): Promise<string> {
        const filePath = path.join(this.path, fileName)
        fs.writeFileSync(filePath, content)
        return filePath
    }

    static async create() {
        const tempDir = path.join(
            os.type() === 'Darwin' ? '/tmp' : os.tmpdir(),
            'aws-language-servers',
            'test',
            crypto.randomBytes(4).toString('hex')
        )
        await fs.promises.mkdir(tempDir, { recursive: true })
        return new TestFolder(tempDir)
    }

    async createNested(name: string) {
        const tempDir = path.join(this.path, name)
        await fs.promises.mkdir(tempDir, { recursive: true })
        return new TestFolder(tempDir)
    }

    async delete() {
        fs.rmSync(this.path, { recursive: true, force: true })
    }

    async clear() {
        const files = await fs.promises.readdir(this.path)
        for (const f of files) {
            await fs.promises.rm(path.join(this.path, f), { recursive: true, force: true })
        }
    }

    async nest(folderName: string) {
        const folderPath = path.join(this.path, folderName)
        await fs.promises.mkdir(folderPath, { recursive: true })
        return new TestFolder(folderPath)
    }
}
