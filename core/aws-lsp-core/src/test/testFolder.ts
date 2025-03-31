import * as path from 'path'
import * as fs from 'fs/promises'
import * as os from 'os'

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
 *
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
