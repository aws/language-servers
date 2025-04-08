import * as assert from 'assert'
import { Writable } from 'stream'
import { ListDirectory } from './listDirectory'
import { testFolder } from '@aws/lsp-core'
import * as path from 'path'
import * as fs from 'fs/promises'
import { TestFeatures } from '@aws/language-server-runtimes/testing'
import { Features } from '@aws/language-server-runtimes/server-interface/server'

describe('ListDirectory Tool', () => {
    let tempFolder: testFolder.TestFolder
    let testFeatures: TestFeatures

    before(async () => {
        testFeatures = new TestFeatures()
        // @ts-ignore does not require all fs operations to be implemented
        testFeatures.workspace.fs = {
            exists: path =>
                fs
                    .access(path)
                    .then(() => true)
                    .catch(() => false),
            readdir: path => fs.readdir(path, { withFileTypes: true }),
        } as Features['workspace']['fs']
        tempFolder = await testFolder.TestFolder.create()
    })

    after(async () => {
        await tempFolder.delete()
    })

    it('lists directory contents', async () => {
        await tempFolder.nest('subfolder')
        await tempFolder.write('fileA.txt', 'fileA content')

        const listDirectory = new ListDirectory(testFeatures)
        const result = await listDirectory.invoke({ path: tempFolder.path, maxDepth: 0 })

        const lines = result.output.content.split('\n')
        const hasFileA = lines.some((line: string | string[]) => line.includes('[FILE] ') && line.includes('fileA.txt'))
        const hasSubfolder = lines.some(
            (line: string | string[]) => line.includes('[DIR] ') && line.includes('subfolder')
        )

        assert.ok(hasFileA, 'Should list fileA.txt in the directory output')
        assert.ok(hasSubfolder, 'Should list the subfolder in the directory output')
    })

    it('lists directory contents recursively', async () => {
        await tempFolder.nest('subfolder')
        await tempFolder.write('fileA.txt', 'fileA content')
        await tempFolder.write(path.join('subfolder', 'fileB.md'), '# fileB')

        const listDirectory = new ListDirectory(testFeatures)
        const result = await listDirectory.invoke({ path: tempFolder.path })

        const lines = result.output.content.split('\n')
        const hasFileA = lines.some((line: string | string[]) => line.includes('[FILE] ') && line.includes('fileA.txt'))
        const hasSubfolder = lines.some(
            (line: string | string[]) => line.includes('[DIR] ') && line.includes('subfolder')
        )
        const hasFileB = lines.some((line: string | string[]) => line.includes('[FILE] ') && line.includes('fileB.md'))

        assert.ok(hasFileA, 'Should list fileA.txt in the directory output')
        assert.ok(hasSubfolder, 'Should list the subfolder in the directory output')
        assert.ok(hasFileB, 'Should list fileB.md in the subfolder in the directory output')
    })

    it('throws error if path does not exist', async () => {
        const missingPath = path.join(tempFolder.path, 'no_such_file.txt')
        const listDirectory = new ListDirectory(testFeatures)

        await assert.rejects(listDirectory.invoke({ path: missingPath, maxDepth: 0 }))
    })

    it('expands ~ path', async () => {
        const listDirectory = new ListDirectory(testFeatures)
        const result = await listDirectory.invoke({ path: '~', maxDepth: 0 })

        assert.strictEqual(result.output.kind, 'text')
        assert.ok(result.output.content.length > 0)
    })
})
