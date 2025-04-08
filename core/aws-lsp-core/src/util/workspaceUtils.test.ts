import * as mockfs from 'mock-fs'
import * as fs from 'fs'
import * as assert from 'assert'
import * as path from 'path'
import { TestFolder } from '../test/testFolder'
import { readDirectoryRecursively } from './workspaceUtils'
import { TestFeatures } from '@aws/language-server-runtimes/testing'

describe('workspaceUtils', function () {
    beforeEach(function () {
        mockfs.restore()
    })

    describe('readDirectoryRecursively', function () {
        let tempFolder: TestFolder
        let testFeatures: TestFeatures

        before(async function () {
            tempFolder = await TestFolder.create()
            testFeatures = new TestFeatures()
            // Taken from https://github.com/aws/language-server-runtimes/blob/674c02696c150838b4bc93543fb0009c5982e7ad/runtimes/runtimes/standalone.ts#L216
            testFeatures.workspace.fs.readdir = path => fs.promises.readdir(path, { withFileTypes: true })
        })

        afterEach(async function () {
            await tempFolder.clear()
        })

        after(async function () {
            await tempFolder.delete()
        })

        it('recurses into subdirectories', async function () {
            const subdir1 = await tempFolder.nest('subdir1')
            const file1 = await subdir1.write('file1', 'this is content')
            const subdir2 = await tempFolder.nest('subdir2')
            const file2 = await subdir2.write('file2', 'this is other content')

            const subdir11 = await subdir1.nest('subdir11')
            const file3 = await subdir11.write('file3', 'this is also content')
            const subdir12 = await subdir1.nest('subdir12')
            const file4 = await subdir12.write('file4', 'this is even more content')
            const file5 = await subdir12.write('file5', 'and this is it')

            const result = (
                await readDirectoryRecursively(testFeatures, tempFolder.path, undefined, entry =>
                    path.join(entry.path, entry.name)
                )
            ).sort()
            assert.strictEqual(result.length, 9)
            assert.deepStrictEqual(result, [
                subdir1.path,
                file1,
                subdir11.path,
                file3,
                subdir12.path,
                file4,
                file5,
                subdir2.path,
                file2,
            ])
        })

        it('respects maxDepth parameter', async function () {
            const subdir1 = await tempFolder.nest('subdir1')
            const file1 = await subdir1.write('file1', 'this is content')
            const subdir2 = await subdir1.nest('subdir2')
            const file2 = await subdir2.write('file2', 'this is other content')
            const subdir3 = await subdir2.nest('subdir3')
            const file3 = await subdir3.write('file3', 'this is also content')

            const depthZeroResult = (
                await readDirectoryRecursively(testFeatures, tempFolder.path, 0, entry =>
                    path.join(entry.path, entry.name)
                )
            ).sort()
            assert.strictEqual(depthZeroResult.length, 1)
            assert.deepStrictEqual(depthZeroResult, [subdir1.path])

            const depthOneResult = (
                await readDirectoryRecursively(testFeatures, tempFolder.path, 1, entry =>
                    path.join(entry.path, entry.name)
                )
            ).sort()
            assert.strictEqual(depthOneResult.length, 3)
            assert.deepStrictEqual(depthOneResult, [subdir1.path, file1, subdir2.path])

            const depthTwoResult = (
                await readDirectoryRecursively(testFeatures, tempFolder.path, 2, entry =>
                    path.join(entry.path, entry.name)
                )
            ).sort()
            assert.strictEqual(depthTwoResult.length, 5)
            assert.deepStrictEqual(depthTwoResult, [subdir1.path, file1, subdir2.path, file2, subdir3.path])
        })

        it('correctly identifies entry types', async function () {
            const file = await tempFolder.write('file1', 'this is a file')
            const subdir = await tempFolder.nest('subdir1')
            const linkPath = path.join(tempFolder.path, 'link1')
            await fs.promises.symlink(tempFolder.path, linkPath, 'dir')

            const results = (await readDirectoryRecursively(testFeatures, tempFolder.path, undefined)).sort()
            assert.deepStrictEqual(results, [`[DIR] ${subdir.path}`, `[FILE] ${file}`, `[LINK] ${linkPath}`])
        })
    })
})
