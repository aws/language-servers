import * as mockfs from 'mock-fs'
import * as fs from 'fs/promises'
import * as assert from 'assert'
import * as path from 'path'
import { TestFolder } from '../test/testFolder'
import {
    readDirectoryRecursively,
    readDirectoryWithTreeOutput,
    getEntryPath,
    isParentFolder,
    isInWorkspace,
} from './workspaceUtils'
import { TestFeatures } from '@aws/language-server-runtimes/testing'

describe('workspaceUtils', function () {
    beforeEach(function () {
        mockfs.restore()
    })

    describe('isParentFolder', function () {
        it('handles different cases', function () {
            assert.ok(isParentFolder('/foo', '/foo/bar'), 'simple case')
            assert.ok(isParentFolder('/foo', '/foo/bar/'), 'trailing slash in child')
            assert.ok(isParentFolder('/foo', '/foo/bar.txt'), 'files')
            assert.ok(isParentFolder('/foo', '/foo/bar/baz'), 'neseted directory')
            assert.ok(!isParentFolder('/foo', '/foo'), 'duplicates')
            assert.ok(!isParentFolder('/foo', '/foobar'), 'prefixing')
            assert.ok(!isParentFolder('/foo/bar', '/foo'), 'reverse')
            assert.ok(isParentFolder('/foo/', '/foo/bar/baz/'), 'trailing slash in both')
        })
    })

    describe('isInWorkspace', function () {
        it('finds the file within the workspace', function () {
            const workspaceFolders = ['/foo']

            const positiveFilePath = '/foo/bar/baz.txt'
            const negativeFilePath = '/notfoo/bar/baz.txt'

            assert.ok(isInWorkspace(workspaceFolders, positiveFilePath), 'file is within the workspace')
            assert.ok(!isInWorkspace(workspaceFolders, negativeFilePath), 'file is not within the workspace')
        })

        it('handles multi-root workspaces', function () {
            const workspaceFolders = ['/foo', '/bar']

            const positiveFilePath = '/foo/bar/baz.txt'
            const secondPositiveFilePath = '/bar/bax.txt'
            const negativeFilePath = '/notfoo/bar/baz.txt'

            assert.ok(isInWorkspace(workspaceFolders, positiveFilePath), 'file is within the workspace')
            assert.ok(isInWorkspace(workspaceFolders, secondPositiveFilePath), 'file is within the workspace')
            assert.ok(!isInWorkspace(workspaceFolders, negativeFilePath), 'file is not within the workspace')
        })

        it('handles the case where its the workspace itself', function () {
            const workspaceFolders = ['/foo']

            assert.ok(isInWorkspace(workspaceFolders, '/foo'), 'workspace is inside itself')
        })
    })

    describe('readDirectoryRecursively', function () {
        let tempFolder: TestFolder
        let testFeatures: TestFeatures

        before(async function () {
            tempFolder = await TestFolder.create()
            testFeatures = new TestFeatures()
            // Taken from https://github.com/aws/language-server-runtimes/blob/674c02696c150838b4bc93543fb0009c5982e7ad/runtimes/runtimes/standalone.ts#L216
            testFeatures.workspace.fs.readdir = async dirPath => {
                const entries = await fs.readdir(dirPath, { withFileTypes: true })
                return entries.map(entry => {
                    ;(entry as any).parentPath = dirPath
                    return entry
                })
            }
            testFeatures.workspace.fs.exists = path =>
                fs.access(path).then(
                    () => true,
                    () => false
                )
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
                await readDirectoryRecursively(testFeatures, tempFolder.path, { customFormatCallback: getEntryPath })
            ).sort()
            assert.deepStrictEqual(
                result,
                [subdir1.path, file1, subdir11.path, file3, subdir12.path, file4, file5, subdir2.path, file2].sort()
            )
        })

        it('respects maxDepth parameter', async function () {
            const subdir1 = await tempFolder.nest('subdir1')
            const file1 = await subdir1.write('file1', 'this is content')
            const subdir2 = await subdir1.nest('subdir2')
            const file2 = await subdir2.write('file2', 'this is other content')
            const subdir3 = await subdir2.nest('subdir3')
            const file3 = await subdir3.write('file3', 'this is also content')

            const testDepth = async (maxDepth: number, expected: string[]) => {
                const result = await readDirectoryRecursively(testFeatures, tempFolder.path, {
                    maxDepth,
                    customFormatCallback: getEntryPath,
                })
                assert.deepStrictEqual(result.sort(), expected.sort())
            }

            await testDepth(0, [subdir1.path])
            await testDepth(1, [subdir1.path, file1, subdir2.path])
            await testDepth(2, [subdir1.path, file1, subdir2.path, file2, subdir3.path])
            await testDepth(3, [subdir1.path, file1, subdir2.path, file2, subdir3.path, file3])
        })

        it('correctly identifies entry types', async function () {
            const file = await tempFolder.write('file1', 'this is a file')
            const subdir = await tempFolder.nest('subdir1')
            // Only create symlinks on non-Windows platforms
            if (process.platform === 'win32') {
                const results = (await readDirectoryRecursively(testFeatures, tempFolder.path, undefined)).sort()
                assert.deepStrictEqual(results, [`[D] ${subdir.path}`, `[F] ${file}`])
                return
            }

            const linkPath = path.join(tempFolder.path, 'link1')
            await fs.symlink(tempFolder.path, linkPath, 'dir')
            const results = (await readDirectoryRecursively(testFeatures, tempFolder.path, undefined)).sort()
            assert.deepStrictEqual(results, [`[D] ${subdir.path}`, `[F] ${file}`, `[L] ${linkPath}`])
        })

        // This test doesn't work on windows since it modifies file permissions
        if (process.platform !== 'win32') {
            it('respects the failOnError flag', async function () {
                const subdir1 = await tempFolder.nest('subdir1')
                await subdir1.write('file1', 'this is content')

                // Temporarily make the file unreadable.
                await fs.chmod(subdir1.path, 0)
                await assert.rejects(
                    readDirectoryRecursively(testFeatures, tempFolder.path, {
                        failOnError: true,
                        customFormatCallback: getEntryPath,
                    })
                )

                const result = await readDirectoryRecursively(testFeatures, tempFolder.path, {
                    customFormatCallback: getEntryPath,
                })
                await fs.chmod(subdir1.path, 0o755)
                assert.strictEqual(result.length, 1)
                assert.deepStrictEqual(result, [subdir1.path])
            })
        }

        it('always fail if directory does not exist', async function () {
            await assert.rejects(
                readDirectoryRecursively(testFeatures, path.join(tempFolder.path, 'notReal'), {
                    customFormatCallback: getEntryPath,
                })
            )
        })

        it('ignores files in the exclude entries', async function () {
            const subdir1 = await tempFolder.nest('subdir1')
            const file1 = await subdir1.write('file1', 'this is content')
            const subdir2 = await tempFolder.nest('subdir2')
            await subdir2.write('file2-bad', 'this is other content')

            const subdir11 = await subdir1.nest('subdir11')
            const file3 = await subdir11.write('file3', 'this is also content')
            const subdir12 = await subdir1.nest('subdir12')
            await subdir12.write('file4-bad', 'this is even more content')
            const file5 = await subdir12.write('file5', 'and this is it')

            const result = (
                await readDirectoryRecursively(testFeatures, tempFolder.path, {
                    customFormatCallback: getEntryPath,
                    excludeFiles: ['file4-bad', 'file2-bad'],
                })
            ).sort()
            assert.deepStrictEqual(
                result,
                [subdir1.path, file1, subdir11.path, file3, subdir12.path, file5, subdir2.path].sort()
            )
        })

        it('ignores directories in the exclude entries', async function () {
            const subdir1 = await tempFolder.nest('subdir1')
            const file1 = await subdir1.write('file1', 'this is content')
            const subdir2 = await tempFolder.nest('subdir2')
            const file2 = await subdir2.write('file2', 'this is other content')

            const subdir11 = await subdir1.nest('subdir11')
            const file3 = await subdir11.write('file3', 'this is also content')
            const subdir12 = await subdir1.nest('subdir12-bad')
            await subdir12.write('file4-bad', 'this is even more content')
            await subdir12.write('file5-bad', 'and this is it')
            await subdir12.write('file6-bad', 'and this is it')

            const result = (
                await readDirectoryRecursively(testFeatures, tempFolder.path, {
                    customFormatCallback: getEntryPath,
                    excludeDirs: ['subdir12-bad'],
                })
            ).sort()
            assert.deepStrictEqual(result, [subdir1.path, file1, subdir11.path, file3, subdir2.path, file2].sort())
        })
    })

    describe('readDirectoryWithTreeOuput', function () {
        let tempFolder: TestFolder
        let testFeatures: TestFeatures

        before(async function () {
            tempFolder = await TestFolder.create()
            testFeatures = new TestFeatures()
            // Taken from https://github.com/aws/language-server-runtimes/blob/674c02696c150838b4bc93543fb0009c5982e7ad/runtimes/runtimes/standalone.ts#L216
            testFeatures.workspace.fs.readdir = async dirPath => {
                const entries = await fs.readdir(dirPath, { withFileTypes: true })
                // Add parentPath to each entry
                return entries.map(entry => {
                    ;(entry as any).parentPath = dirPath
                    return entry
                })
            }
            testFeatures.workspace.fs.exists = path =>
                fs.access(path).then(
                    () => true,
                    () => false
                )
        })

        afterEach(async function () {
            await tempFolder.clear()
        })

        after(async function () {
            await tempFolder.delete()
        })

        it('recurses into subdirectories', async function () {
            const subdir1 = await tempFolder.nest('subdir1')
            await subdir1.write('file1', 'this is content')
            const subdir2 = await tempFolder.nest('subdir2')
            await subdir2.write('file2', 'this is other content')

            const subdir11 = await subdir1.nest('subdir11')
            await subdir11.write('file3', 'this is also content')
            const subdir12 = await subdir1.nest('subdir12')
            await subdir12.write('file4', 'this is even more content')
            await subdir12.write('file5', 'and this is it')

            const expected =
                '|-- subdir1/\n' +
                '|   |-- subdir11/\n' +
                '|   |   `-- file3\n' +
                '|   |-- subdir12/\n' +
                '|   |   |-- file4\n' +
                '|   |   `-- file5\n' +
                '|   `-- file1\n' +
                '`-- subdir2/\n' +
                '    `-- file2\n'

            const result = await readDirectoryWithTreeOutput(testFeatures, tempFolder.path)
            assert.ok(result.includes(expected))
        })

        it('respects maxDepth parameter', async function () {
            const subdir1 = await tempFolder.nest('subdir1')
            await subdir1.write('file1', 'this is content')
            const subdir2 = await subdir1.nest('subdir2')
            await subdir2.write('file2', 'this is other content')
            const subdir3 = await subdir2.nest('subdir3')
            await subdir3.write('file3', 'this is also content')

            const testDepth = async (maxDepth: number, expected: string) => {
                const result = await readDirectoryWithTreeOutput(testFeatures, tempFolder.path, {
                    maxDepth,
                })
                assert.ok(result.includes(expected))
            }

            await testDepth(0, '`-- subdir1/\n')
            await testDepth(1, '`-- subdir1/\n    |-- subdir2/\n    `-- file1\n')
            await testDepth(
                2,
                '`-- subdir1/\n    |-- subdir2/\n    |   |-- subdir3/\n    |   `-- file2\n    `-- file1\n'
            )
            await testDepth(
                3,
                '`-- subdir1/\n    |-- subdir2/\n    |   |-- subdir3/\n    |   |   `-- file3\n    |   `-- file2\n    `-- file1\n'
            )
        })

        // This test doesn't work on windows since it modifies file permissions
        if (process.platform !== 'win32') {
            it('respects the failOnError flag', async function () {
                const subdir1 = await tempFolder.nest('subdir1')
                await subdir1.write('file1', 'this is content')

                // Temporarily make the file unreadable.
                await fs.chmod(subdir1.path, 0)
                await assert.rejects(
                    readDirectoryWithTreeOutput(testFeatures, tempFolder.path, {
                        failOnError: true,
                    })
                )

                const result = await readDirectoryWithTreeOutput(testFeatures, tempFolder.path)
                await fs.chmod(subdir1.path, 0o755)
                assert.ok(result.includes('`-- subdir1/\n'))
            })
        }

        it('always fail if directory does not exist', async function () {
            await assert.rejects(readDirectoryWithTreeOutput(testFeatures, path.join(tempFolder.path, 'notReal')))
        })

        it('ignores files in the exclude entries', async function () {
            const subdir1 = await tempFolder.nest('subdir1')
            await subdir1.write('file1', 'this is content')
            const subdir2 = await tempFolder.nest('subdir2')
            await subdir2.write('file2-bad', 'this is other content')

            const subdir11 = await subdir1.nest('subdir11')
            await subdir11.write('file3', 'this is also content')
            const subdir12 = await subdir1.nest('subdir12')
            await subdir12.write('file4-bad', 'this is even more content')
            await subdir12.write('file5', 'and this is it')

            const result = await readDirectoryWithTreeOutput(testFeatures, tempFolder.path, {
                excludeFiles: ['file4-bad', 'file2-bad'],
            })

            const expected =
                '|-- subdir1/\n' +
                '|   |-- subdir11/\n' +
                '|   |   `-- file3\n' +
                '|   |-- subdir12/\n' +
                '|   |   `-- file5\n' +
                '|   `-- file1\n' +
                '`-- subdir2/\n'
            assert.ok(result.includes(expected))
        })

        it('ignores directories in the exclude entries', async function () {
            const subdir1 = await tempFolder.nest('subdir1')
            await subdir1.write('file1', 'this is content')
            const subdir2 = await tempFolder.nest('subdir2')
            await subdir2.write('file2', 'this is other content')

            const subdir11 = await subdir1.nest('subdir11')
            await subdir11.write('file3', 'this is also content')
            const subdir12 = await subdir1.nest('subdir12-bad')
            await subdir12.write('file4-bad', 'this is even more content')
            await subdir12.write('file5-bad', 'and this is it')
            await subdir12.write('file6-bad', 'and this is it')

            const result = await readDirectoryWithTreeOutput(testFeatures, tempFolder.path, {
                excludeDirs: ['subdir12-bad'],
            })
            const expected =
                '|-- subdir1/\n' +
                '|   |-- subdir11/\n' +
                '|   |   `-- file3\n' +
                '|   `-- file1\n' +
                '`-- subdir2/\n' +
                '    `-- file2\n'
            assert.ok(result.includes(expected))
        })
    })
})
