/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
import { AppendParams, CreateParams, FsWrite, InsertParams, StrReplaceParams } from './fsWrite'
import { TestFolder } from '@aws/lsp-core'
import * as path from 'path'
import * as assert from 'assert'
import * as fs from 'fs/promises'
import { InvokeOutput, OutputKind } from './toolShared'
import { TestFeatures } from '@aws/language-server-runtimes/testing'
import { Workspace } from '@aws/language-server-runtimes/server-interface'
import { StubbedInstance } from 'ts-sinon'

describe('FsWrite Tool', function () {
    let testFolder: TestFolder
    let features: TestFeatures
    const expectedOutput: InvokeOutput = {
        output: {
            kind: OutputKind.Text,
            content: '',
        },
    }

    before(async function () {
        features = new TestFeatures()
        features.workspace = {
            // @ts-ignore writing a file does not require all fs features implemented
            fs: {
                writeFile: fs.writeFile,
                readFile: (path, options?) =>
                    fs.readFile(path, { encoding: (options?.encoding || 'utf-8') as BufferEncoding }),
                exists: path =>
                    fs
                        .access(path)
                        .then(() => true)
                        .catch(() => false),
            } as Workspace['fs'],
        } as StubbedInstance<Workspace>
        testFolder = await TestFolder.create()
    })

    after(async function () {
        await testFolder.delete()
    })

    describe('handleCreate', function () {
        it('creates a new file with fileText content', async function () {
            const filePath = path.join(testFolder.path, 'file1.txt')
            const fileExists = await features.workspace.fs.exists(filePath)
            assert.ok(!fileExists)

            const params: CreateParams = {
                command: 'create',
                fileText: 'Hello World',
                path: filePath,
            }
            const fsWrite = new FsWrite(features, params)
            const output = await fsWrite.invoke(process.stdout)

            const content = await features.workspace.fs.readFile(filePath)
            assert.strictEqual(content, 'Hello World')

            assert.deepStrictEqual(output, expectedOutput)
        })

        it('replaces existing file with fileText content', async function () {
            const filePath = path.join(testFolder.path, 'file1.txt')
            const fileExists = await features.workspace.fs.exists(filePath)
            assert.ok(fileExists)

            const params: CreateParams = {
                command: 'create',
                fileText: 'Goodbye',
                path: filePath,
            }
            const fsWrite = new FsWrite(features, params)
            const output = await fsWrite.invoke(process.stdout)

            const content = await features.workspace.fs.readFile(filePath)
            assert.strictEqual(content, 'Goodbye')

            assert.deepStrictEqual(output, expectedOutput)
        })

        it('uses newStr when fileText is not provided', async function () {
            const filePath = path.join(testFolder.path, 'file2.txt')

            const params: CreateParams = {
                command: 'create',
                newStr: 'Hello World',
                path: filePath,
            }
            const fsWrite = new FsWrite(features, params)
            const output = await fsWrite.invoke(process.stdout)

            const content = await features.workspace.fs.readFile(filePath)
            assert.strictEqual(content, 'Hello World')

            assert.deepStrictEqual(output, expectedOutput)
        })

        it('creates an empty file when no content is provided', async function () {
            const filePath = path.join(testFolder.path, 'file3.txt')

            const params: CreateParams = {
                command: 'create',
                path: filePath,
            }
            const fsWrite = new FsWrite(features, params)
            const output = await fsWrite.invoke(process.stdout)

            const content = await features.workspace.fs.readFile(filePath)
            assert.strictEqual(content, '')

            assert.deepStrictEqual(output, expectedOutput)
        })
    })

    describe('handleStrReplace', async function () {
        before(async function () {
            testFolder = await TestFolder.create()
        })

        it('replaces a single occurrence of a string', async function () {
            const filePath = path.join(testFolder.path, 'file1.txt')
            await fs.writeFile(filePath, 'Hello World')

            const params: StrReplaceParams = {
                command: 'strReplace',
                path: filePath,
                oldStr: 'Hello',
                newStr: 'Goodbye',
            }
            const fsWrite = new FsWrite(features, params)
            const output = await fsWrite.invoke(process.stdout)

            const content = await features.workspace.fs.readFile(filePath)
            assert.strictEqual(content, 'Goodbye World')

            assert.deepStrictEqual(output, expectedOutput)
        })

        it('throws error when no matches are found', async function () {
            const filePath = path.join(testFolder.path, 'file1.txt')

            const params: StrReplaceParams = {
                command: 'strReplace',
                path: filePath,
                oldStr: 'Invalid',
                newStr: 'Goodbye',
            }

            const fsWrite = new FsWrite(features, params)
            await assert.rejects(() => fsWrite.invoke(process.stdout), /No occurrences of "Invalid" were found/)
        })

        it('throws error when multiple matches are found', async function () {
            const filePath = path.join(testFolder.path, 'file2.txt')
            await fs.writeFile(filePath, 'Hello Hello World')

            const params: StrReplaceParams = {
                command: 'strReplace',
                path: filePath,
                oldStr: 'Hello',
                newStr: 'Goodbye',
            }

            const fsWrite = new FsWrite(features, params)
            await assert.rejects(
                () => fsWrite.invoke(process.stdout),
                /2 occurrences of oldStr were found when only 1 is expected/
            )
        })

        it('handles regular expression special characters correctly', async function () {
            const filePath = path.join(testFolder.path, 'file3.txt')
            await fs.writeFile(filePath, 'Text with special chars: .*+?^${}()|[]\\')

            const params: StrReplaceParams = {
                command: 'strReplace',
                path: filePath,
                oldStr: '.*+?^${}()|[]\\',
                newStr: 'REPLACED',
            }
            const fsWrite = new FsWrite(features, params)
            const output = await fsWrite.invoke(process.stdout)

            const content = await features.workspace.fs.readFile(filePath)
            assert.strictEqual(content, 'Text with special chars: REPLACED')

            assert.deepStrictEqual(output, expectedOutput)
        })

        it('preserves whitespace and newlines during replacement', async function () {
            const filePath = path.join(testFolder.path, 'file4.txt')
            await fs.writeFile(filePath, 'Line 1\n  Indented line\nLine 3')

            const params: StrReplaceParams = {
                command: 'strReplace',
                path: filePath,
                oldStr: '  Indented line\n',
                newStr: '    Double indented\n',
            }
            const fsWrite = new FsWrite(features, params)
            const output = await fsWrite.invoke(process.stdout)

            const content = await features.workspace.fs.readFile(filePath)
            assert.strictEqual(content, 'Line 1\n    Double indented\nLine 3')

            assert.deepStrictEqual(output, expectedOutput)
        })
    })

    describe('handleInsert', function () {
        before(async function () {
            testFolder = await TestFolder.create()
        })

        it('inserts text after the specified line number', async function () {
            const filePath = path.join(testFolder.path, 'file1.txt')
            await fs.writeFile(filePath, 'Line 1\nLine 2\nLine 3\nLine 4')

            const params: InsertParams = {
                command: 'insert',
                path: filePath,
                insertLine: 2,
                newStr: 'New Line',
            }
            const fsWrite = new FsWrite(features, params)
            const output = await fsWrite.invoke(process.stdout)

            const newContent = await features.workspace.fs.readFile(filePath)
            assert.strictEqual(newContent, 'Line 1\nLine 2\nNew Line\nLine 3\nLine 4')

            assert.deepStrictEqual(output, expectedOutput)
        })

        it('inserts text at the beginning when line number is 0', async function () {
            const filePath = path.join(testFolder.path, 'file1.txt')
            const params: InsertParams = {
                command: 'insert',
                path: filePath,
                insertLine: 0,
                newStr: 'New First Line',
            }
            const fsWrite = new FsWrite(features, params)
            const output = await fsWrite.invoke(process.stdout)

            const newContent = await features.workspace.fs.readFile(filePath)
            assert.strictEqual(newContent, 'New First Line\nLine 1\nLine 2\nNew Line\nLine 3\nLine 4')

            assert.deepStrictEqual(output, expectedOutput)
        })

        it('inserts text at the end when line number exceeds file length', async function () {
            const filePath = path.join(testFolder.path, 'file1.txt')
            const params: InsertParams = {
                command: 'insert',
                path: filePath,
                insertLine: 10,
                newStr: 'New Last Line',
            }
            const fsWrite = new FsWrite(features, params)
            const output = await fsWrite.invoke(process.stdout)

            const newContent = await features.workspace.fs.readFile(filePath)
            assert.strictEqual(newContent, 'New First Line\nLine 1\nLine 2\nNew Line\nLine 3\nLine 4\nNew Last Line')

            assert.deepStrictEqual(output, expectedOutput)
        })

        it('handles insertion into an empty file', async function () {
            const filePath = path.join(testFolder.path, 'file2.txt')
            await fs.writeFile(filePath, '')

            const params: InsertParams = {
                command: 'insert',
                path: filePath,
                insertLine: 0,
                newStr: 'First Line',
            }
            const fsWrite = new FsWrite(features, params)
            const output = await fsWrite.invoke(process.stdout)

            const newContent = await features.workspace.fs.readFile(filePath)
            assert.strictEqual(newContent, 'First Line\n')

            assert.deepStrictEqual(output, expectedOutput)
        })

        it('handles negative line numbers by inserting at the beginning', async function () {
            const filePath = path.join(testFolder.path, 'file2.txt')

            const params: InsertParams = {
                command: 'insert',
                path: filePath,
                insertLine: -1,
                newStr: 'New First Line',
            }
            const fsWrite = new FsWrite(features, params)
            const output = await fsWrite.invoke(process.stdout)

            const newContent = await features.workspace.fs.readFile(filePath)
            assert.strictEqual(newContent, 'New First Line\nFirst Line\n')

            assert.deepStrictEqual(output, expectedOutput)
        })

        it('throws error when file does not exist', async function () {
            const filePath = path.join(testFolder.path, 'nonexistent.txt')

            const params: InsertParams = {
                command: 'insert',
                path: filePath,
                insertLine: 1,
                newStr: 'New Line',
            }

            const fsWrite = new FsWrite(features, params)
            await assert.rejects(() => fsWrite.invoke(process.stdout), /no such file or directory/)
        })
    })

    describe('handleAppend', function () {
        it('appends text to the end of a file', async function () {
            const filePath = path.join(testFolder.path, 'file1.txt')
            await fs.writeFile(filePath, 'Line 1\nLine 2\nLine 3\n')

            const params: AppendParams = {
                command: 'append',
                path: filePath,
                newStr: 'Line 4',
            }

            const fsWrite = new FsWrite(features, params)
            const output = await fsWrite.invoke(process.stdout)

            const newContent = await features.workspace.fs.readFile(filePath)
            assert.strictEqual(newContent, 'Line 1\nLine 2\nLine 3\nLine 4')

            assert.deepStrictEqual(output, expectedOutput)
        })

        it('adds a newline before appending if file does not end with one', async function () {
            const filePath = path.join(testFolder.path, 'file2.txt')
            await fs.writeFile(filePath, 'Line 1\nLine 2\nLine 3')

            const params: AppendParams = {
                command: 'append',
                path: filePath,
                newStr: 'Line 4',
            }

            const fsWrite = new FsWrite(features, params)
            const output = await fsWrite.invoke(process.stdout)

            const newContent = await features.workspace.fs.readFile(filePath)
            assert.strictEqual(newContent, 'Line 1\nLine 2\nLine 3\nLine 4')

            assert.deepStrictEqual(output, expectedOutput)
        })

        it('appends to an empty file', async function () {
            const filePath = path.join(testFolder.path, 'file3.txt')
            await fs.writeFile(filePath, '')

            const params: AppendParams = {
                command: 'append',
                path: filePath,
                newStr: 'Line 1',
            }
            const fsWrite = new FsWrite(features, params)
            const output = await fsWrite.invoke(process.stdout)

            const newContent = await features.workspace.fs.readFile(filePath)
            assert.strictEqual(newContent, 'Line 1')

            assert.deepStrictEqual(output, expectedOutput)
        })

        it('appends multiple lines correctly', async function () {
            const filePath = path.join(testFolder.path, 'file3.txt')

            const params: AppendParams = {
                command: 'append',
                path: filePath,
                newStr: 'Line 2\nLine 3',
            }
            const fsWrite = new FsWrite(features, params)
            const output = await fsWrite.invoke(process.stdout)

            const newContent = await features.workspace.fs.readFile(filePath)
            assert.strictEqual(newContent, 'Line 1\nLine 2\nLine 3')

            assert.deepStrictEqual(output, expectedOutput)
        })

        it('handles appending empty string', async function () {
            const filePath = path.join(testFolder.path, 'file3.txt')

            const params: AppendParams = {
                command: 'append',
                path: filePath,
                newStr: '',
            }
            const fsWrite = new FsWrite(features, params)
            const output = await fsWrite.invoke(process.stdout)

            const newContent = await features.workspace.fs.readFile(filePath)
            assert.strictEqual(newContent, 'Line 1\nLine 2\nLine 3\n')

            assert.deepStrictEqual(output, expectedOutput)
        })

        it('throws error when file does not exist', async function () {
            const filePath = path.join(testFolder.path, 'nonexistent.txt')

            const params: AppendParams = {
                command: 'append',
                path: filePath,
                newStr: 'New Line',
            }

            const fsWrite = new FsWrite(features, params)
            await assert.rejects(() => fsWrite.invoke(process.stdout), /no such file or directory/)
        })
    })
})
