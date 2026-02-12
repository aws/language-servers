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

        it('rejects absolute paths with traversal sequences that escape workspace', function () {
            const workspaceFolders = ['/home/user/project']

            // Path that starts in workspace but traverses out
            assert.ok(
                !isInWorkspace(workspaceFolders, '/home/user/project/../../etc'),
                'traversal escaping workspace should be rejected'
            )
            assert.ok(
                !isInWorkspace(workspaceFolders, '/home/user/project/../../../etc/passwd'),
                'deep traversal should be rejected'
            )
        })

        it('rejects relative paths with traversal sequences that escape workspace', function () {
            const workspaceFolders = ['/home/user/project']

            // Double traversal pattern from the bug report
            assert.ok(
                !isInWorkspace(workspaceFolders, '.amazonq/../.amazonq/../../../etc'),
                'double traversal pattern should be rejected'
            )
            assert.ok(!isInWorkspace(workspaceFolders, '../../../etc'), 'simple relative traversal should be rejected')
        })

        it('allows paths with traversal that stay within workspace', function () {
            const workspaceFolders = ['/home/user/project']

            // Traversal that stays within workspace
            assert.ok(
                isInWorkspace(workspaceFolders, '/home/user/project/src/../lib/file.ts'),
                'traversal within workspace should be allowed'
            )
        })

        it('rejects double traversal pattern (bug bounty attack vector)', function () {
            const workspaceFolders = ['/home/user/project']

            // The exact pattern: folder/../folder/../../../ to confuse string matching
            assert.ok(
                !isInWorkspace(workspaceFolders, '/home/user/project/.amazonq/../.amazonq/../../../etc'),
                'double traversal via existing subfolder should be rejected'
            )
        })

        it('rejects traversal with redundant current-dir dots', function () {
            const workspaceFolders = ['/home/user/project']

            assert.ok(
                !isInWorkspace(workspaceFolders, '/home/user/project/./../../etc'),
                'mixed . and .. should be rejected when escaping'
            )
            assert.ok(
                isInWorkspace(workspaceFolders, '/home/user/project/./src/./file.ts'),
                'redundant . within workspace should be allowed'
            )
        })

        it('rejects deeply nested traversal that escapes workspace', function () {
            const workspaceFolders = ['/home/user/project']

            assert.ok(
                !isInWorkspace(workspaceFolders, '/home/user/project/a/b/c/d/../../../../../../../../etc/shadow'),
                'deep nesting then deep traversal should be rejected'
            )
        })

        it('rejects traversal to root', function () {
            const workspaceFolders = ['/home/user/project']

            assert.ok(
                !isInWorkspace(workspaceFolders, '/home/user/project/../../../'),
                'traversal to root should be rejected'
            )
        })

        it('rejects traversal targeting home directory', function () {
            const workspaceFolders = ['/home/user/project']

            assert.ok(
                !isInWorkspace(workspaceFolders, '/home/user/project/../../other-user/.ssh/id_rsa'),
                'traversal to another users home should be rejected'
            )
        })

        it('handles workspace at filesystem root', function () {
            const workspaceFolders = ['/workspace']

            assert.ok(isInWorkspace(workspaceFolders, '/workspace/file.txt'), 'file in root workspace')
            assert.ok(!isInWorkspace(workspaceFolders, '/workspace/../etc'), 'traversal from root workspace')
        })

        it('handles workspace with trailing slash', function () {
            const workspaceFolders = ['/home/user/project/']

            assert.ok(
                isInWorkspace(workspaceFolders, '/home/user/project/src/file.ts'),
                'should work with trailing slash workspace'
            )
            assert.ok(
                !isInWorkspace(workspaceFolders, '/home/user/project/../../../etc'),
                'traversal should still be rejected with trailing slash workspace'
            )
        })

        it('rejects traversal in multi-root workspace targeting other roots', function () {
            const workspaceFolders = ['/home/user/project-a', '/home/user/project-b']

            // Trying to escape project-a to reach project-b's parent
            assert.ok(
                !isInWorkspace(workspaceFolders, '/home/user/project-a/../../root-secret'),
                'traversal escaping any workspace root should be rejected'
            )
        })

        it('handles paths with multiple consecutive slashes', function () {
            const workspaceFolders = ['/home/user/project']

            assert.ok(
                isInWorkspace(workspaceFolders, '/home/user/project///src///file.ts'),
                'multiple slashes within workspace should be normalized and allowed'
            )
        })

        it('rejects traversal disguised with trailing slashes on each segment', function () {
            const workspaceFolders = ['/home/user/project']

            assert.ok(
                !isInWorkspace(workspaceFolders, '/home/user/project/src//../../../etc/'),
                'trailing slashes on traversal segments should still be rejected'
            )
        })

        it('rejects single parent traversal that escapes workspace', function () {
            const workspaceFolders = ['/home/user/project']

            // Just one ".." is enough to escape if workspace is shallow
            assert.ok(
                !isInWorkspace(workspaceFolders, '/home/user/project/../other-project/secret.txt'),
                'single parent traversal escaping workspace should be rejected'
            )
        })

        it('rejects path that is exactly the parent of workspace', function () {
            const workspaceFolders = ['/home/user/project']

            assert.ok(
                !isInWorkspace(workspaceFolders, '/home/user/project/..'),
                'path resolving to workspace parent should be rejected'
            )
        })

        it('handles empty workspace folders array', function () {
            assert.ok(!isInWorkspace([], '/any/path'), 'empty workspace should reject all paths')
        })

        it('rejects path with alternating traversal and real dirs', function () {
            const workspaceFolders = ['/home/user/project']

            // Pattern: go into dir, come back, go into another, come back, then escape
            assert.ok(
                !isInWorkspace(workspaceFolders, '/home/user/project/src/../node_modules/../test/../../..'),
                'alternating in/out traversal that escapes should be rejected'
            )
        })

        it('allows path that traverses within workspace boundaries', function () {
            const workspaceFolders = ['/home/user/project']

            // Go into src, back to project, into lib — stays within workspace
            assert.ok(
                isInWorkspace(workspaceFolders, '/home/user/project/src/../lib/../test/file.ts'),
                'traversal that stays within workspace should be allowed'
            )
        })

        it('rejects path with many redundant traversals that net escape', function () {
            const workspaceFolders = ['/home/user/project']

            // 10 levels deep, then 13 levels back — net escape of 3 levels
            const deepPath = '/home/user/project' + '/a'.repeat(10) + '/..'.repeat(13) + '/etc/passwd'
            assert.ok(
                !isInWorkspace(workspaceFolders, deepPath),
                'many redundant traversals netting an escape should be rejected'
            )
        })

        it('handles workspace path that itself contains dots in directory names', function () {
            const workspaceFolders = ['/home/user/my.project.v2']

            assert.ok(
                isInWorkspace(workspaceFolders, '/home/user/my.project.v2/src/file.ts'),
                'workspace with dots in name should work normally'
            )
            assert.ok(
                !isInWorkspace(workspaceFolders, '/home/user/my.project.v2/../../etc'),
                'traversal from dotted workspace should still be rejected'
            )
        })

        it('rejects path targeting another workspace root via traversal in multi-root', function () {
            const workspaceFolders = ['/home/user/project-a', '/home/user/project-b']

            // From project-a, traverse to project-b's sibling that isn't a workspace
            assert.ok(
                !isInWorkspace(workspaceFolders, '/home/user/project-a/../project-c/secrets'),
                'traversal to non-workspace sibling should be rejected'
            )
        })

        it('allows traversal from one workspace root to another in multi-root', function () {
            const workspaceFolders = ['/home/user/project-a', '/home/user/project-b']

            // From project-a, traverse to project-b — this IS in workspace
            assert.ok(
                isInWorkspace(workspaceFolders, '/home/user/project-a/../project-b/file.ts'),
                'traversal to another workspace root should be allowed'
            )
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
