import assert from 'assert'
import { chmod, mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import { saveSharedConfigFile } from './saveSharedConfigFile'
import { IniFileType } from './types'

const original = '[default]\naws_access_key_id = test-key\n'
const updated = () => ({ default: { aws_access_key_id: 'updated-key' } })

;(process.platform === 'win32' ? describe.skip : describe)('sharedConfig file permissions', () => {
    let directory: string
    let previousUmask: number

    beforeEach(async () => {
        previousUmask = process.umask(0o022)
        directory = await mkdtemp(join(tmpdir(), 'shared-config-permissions-'))
    })

    afterEach(async () => {
        process.umask(previousUmask)
        await rm(directory, { recursive: true, force: true })
    })

    for (const mode of [0o400, 0o600, 0o640, 0o644]) {
        it(`keeps credentials and their backup private when replacing mode ${mode.toString(8)}`, async () => {
            const filepath = join(directory, 'credentials')
            await writeFile(filepath, original)
            await chmod(filepath, mode)

            await saveSharedConfigFile(filepath, IniFileType.credentials, updated())

            assert.strictEqual((await stat(filepath)).mode & 0o777, mode & 0o600)
            assert.strictEqual((await stat(filepath + '~')).mode & 0o777, mode & 0o600)
            assert.strictEqual(await readFile(filepath + '~', 'utf8'), original)
            assert.match(await readFile(filepath, 'utf8'), /aws_access_key_id = updated-key/)
        })
    }

    for (const filetype of [IniFileType.config, IniFileType.credentials]) {
        it(`creates private files and directories for ${IniFileType[filetype]}`, async () => {
            const filepath = join(directory, 'new', IniFileType[filetype])

            await saveSharedConfigFile(filepath, filetype, updated())

            assert.strictEqual((await stat(filepath)).mode & 0o777, 0o600)
            assert.strictEqual((await stat(join(directory, 'new'))).mode & 0o777, 0o700)
        })
    }

    it('preserves an existing config file mode', async () => {
        const filepath = join(directory, 'config')
        await writeFile(filepath, '[default]\nregion = us-west-2\n')
        await chmod(filepath, 0o640)

        await saveSharedConfigFile(filepath, IniFileType.config, { default: { region: 'us-east-1' } })

        assert.strictEqual((await stat(filepath)).mode & 0o777, 0o640)
        assert.strictEqual((await stat(filepath + '~')).mode & 0o777, 0o640)
    })

    it('does not change an existing parent directory mode', async () => {
        const parent = join(directory, 'existing')
        await mkdir(parent, { mode: 0o750 })

        await saveSharedConfigFile(join(parent, 'credentials'), IniFileType.credentials, updated())

        assert.strictEqual((await stat(parent)).mode & 0o777, 0o750)
    })
})
