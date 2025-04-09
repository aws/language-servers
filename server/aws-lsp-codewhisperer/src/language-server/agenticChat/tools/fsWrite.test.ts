/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
import { AppendParams, CreateParams, FsWrite, InsertParams, StrReplaceParams } from './fsWrite'
import { testFolder } from '@aws/lsp-core'
import * as path from 'path'
import * as assert from 'assert'
import * as fs from 'fs/promises'
import { InvokeOutput } from './toolShared'
import { TestFeatures } from '@aws/language-server-runtimes/testing'
import { Workspace } from '@aws/language-server-runtimes/server-interface'
import { StubbedInstance } from 'ts-sinon'

describe('FsWrite Tool', function () {
    let tempFolder: testFolder.TestFolder
    let features: TestFeatures
    const expectedOutput: InvokeOutput = {
        output: {
            kind: 'text',
            content: '',
        },
    }

    const stdout = new WritableStream({
        write(chunk) {
            process.stdout.write(chunk)
        },
    })

    before(async function () {
        features = new TestFeatures()
        features.workspace = {
            // @ts-ignore writing a file does not require all of fs to be implemented
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
        tempFolder = await testFolder.TestFolder.create()
    })

    after(async function () {
        await tempFolder.delete()
    })

    it('writes a empty space to updates stream', async function () {
        const fsRead = new FsWrite(features)
        const chunks: string[] = []
        const stream = new WritableStream({
            write: c => {
                chunks.push(c)
            },
        })
        await fsRead.queueDescription(stream)
        assert.strictEqual(chunks.length, 1)
        assert.ok(chunks[0], ' ')
        assert.ok(!stream.locked)
    })

    describe('handleCreate', function () {
        it('creates a new file with fileText content', async function () {
            const filePath = path.join(tempFolder.path, 'file1.txt')
            const fileExists = await features.workspace.fs.exists(filePath)
            assert.ok(!fileExists)

            const params: CreateParams = {
                command: 'create',
                fileText: 'Hello World',
                path: filePath,
            }
            const fsWrite = new FsWrite(features)
            const output = await fsWrite.invoke(params)

            const content = await features.workspace.fs.readFile(filePath)
            assert.strictEqual(content, 'Hello World')

            assert.deepStrictEqual(output, expectedOutput)
        })

        it('replaces existing file with fileText content', async function () {
            const filePath = path.join(tempFolder.path, 'file1.txt')
            const fileExists = await features.workspace.fs.exists(filePath)
            assert.ok(fileExists)

            const params: CreateParams = {
                command: 'create',
                fileText: 'Goodbye',
                path: filePath,
            }
            const fsWrite = new FsWrite(features)
            const output = await fsWrite.invoke(params)

            const content = await features.workspace.fs.readFile(filePath)
            assert.strictEqual(content, 'Goodbye')

            assert.deepStrictEqual(output, expectedOutput)
        })

        it('uses newStr when fileText is not provided', async function () {
            const filePath = path.join(tempFolder.path, 'file2.txt')

            const params: CreateParams = {
                command: 'create',
                newStr: 'Hello World',
                path: filePath,
            }
            const fsWrite = new FsWrite(features)
            const output = await fsWrite.invoke(params)

            const content = await features.workspace.fs.readFile(filePath)
            assert.strictEqual(content, 'Hello World')

            assert.deepStrictEqual(output, expectedOutput)
        })

        it('creates an empty file when no content is provided', async function () {
            const filePath = path.join(tempFolder.path, 'file3.txt')

            const params: CreateParams = {
                command: 'create',
                path: filePath,
            }
            const fsWrite = new FsWrite(features)
            const output = await fsWrite.invoke(params)

            const content = await features.workspace.fs.readFile(filePath)
            assert.strictEqual(content, '')

            assert.deepStrictEqual(output, expectedOutput)
        })
    })

    describe('handleStrReplace', async function () {
        before(async function () {
            tempFolder = await testFolder.TestFolder.create()
        })

        it('replaces a single occurrence of a string', async function () {
            const filePath = path.join(tempFolder.path, 'file1.txt')
            await fs.writeFile(filePath, 'Hello World')

            const params: StrReplaceParams = {
                command: 'strReplace',
                path: filePath,
                oldStr: 'Hello',
                newStr: 'Goodbye',
            }
            const fsWrite = new FsWrite(features)
            const output = await fsWrite.invoke(params)

            const content = await features.workspace.fs.readFile(filePath)
            assert.strictEqual(content, 'Goodbye World')

            assert.deepStrictEqual(output, expectedOutput)
        })

        it('throws error when no matches are found', async function () {
            const filePath = path.join(tempFolder.path, 'file1.txt')

            const params: StrReplaceParams = {
                command: 'strReplace',
                path: filePath,
                oldStr: 'Invalid',
                newStr: 'Goodbye',
            }

            const fsWrite = new FsWrite(features)
            await assert.rejects(() => fsWrite.invoke(params), /No occurrences of "Invalid" were found/)
        })

        it('throws error when multiple matches are found', async function () {
            const filePath = path.join(tempFolder.path, 'file2.txt')
            await fs.writeFile(filePath, 'Hello Hello World')

            const params: StrReplaceParams = {
                command: 'strReplace',
                path: filePath,
                oldStr: 'Hello',
                newStr: 'Goodbye',
            }

            const fsWrite = new FsWrite(features)
            await assert.rejects(
                () => fsWrite.invoke(params),
                /2 occurrences of oldStr were found when only 1 is expected/
            )
        })

        it('handles regular expression special characters correctly', async function () {
            const filePath = path.join(tempFolder.path, 'file3.txt')
            await fs.writeFile(filePath, 'Text with special chars: .*+?^${}()|[]\\')

            const params: StrReplaceParams = {
                command: 'strReplace',
                path: filePath,
                oldStr: '.*+?^${}()|[]\\',
                newStr: 'REPLACED',
            }
            const fsWrite = new FsWrite(features)
            const output = await fsWrite.invoke(params)

            const content = await features.workspace.fs.readFile(filePath)
            assert.strictEqual(content, 'Text with special chars: REPLACED')

            assert.deepStrictEqual(output, expectedOutput)
        })

        it('preserves whitespace and newlines during replacement', async function () {
            const filePath = path.join(tempFolder.path, 'file4.txt')
            await fs.writeFile(filePath, 'Line 1\n  Indented line\nLine 3')

            const params: StrReplaceParams = {
                command: 'strReplace',
                path: filePath,
                oldStr: '  Indented line\n',
                newStr: '    Double indented\n',
            }
            const fsWrite = new FsWrite(features)
            const output = await fsWrite.invoke(params)

            const content = await features.workspace.fs.readFile(filePath)
            assert.strictEqual(content, 'Line 1\n    Double indented\nLine 3')

            assert.deepStrictEqual(output, expectedOutput)
        })
    })

    describe('handleInsert', function () {
        before(async function () {
            tempFolder = await testFolder.TestFolder.create()
        })

        it('inserts text after the specified line number', async function () {
            const filePath = path.join(tempFolder.path, 'file1.txt')
            await fs.writeFile(filePath, 'Line 1\nLine 2\nLine 3\nLine 4')

            const params: InsertParams = {
                command: 'insert',
                path: filePath,
                insertLine: 2,
                newStr: 'New Line',
            }
            const fsWrite = new FsWrite(features)
            const output = await fsWrite.invoke(params)

            const newContent = await features.workspace.fs.readFile(filePath)
            assert.strictEqual(newContent, 'Line 1\nLine 2\nNew Line\nLine 3\nLine 4')

            assert.deepStrictEqual(output, expectedOutput)
        })

        it('inserts text at the beginning when line number is 0', async function () {
            const filePath = path.join(tempFolder.path, 'file1.txt')
            const params: InsertParams = {
                command: 'insert',
                path: filePath,
                insertLine: 0,
                newStr: 'New First Line',
            }
            const fsWrite = new FsWrite(features)
            const output = await fsWrite.invoke(params)

            const newContent = await features.workspace.fs.readFile(filePath)
            assert.strictEqual(newContent, 'New First Line\nLine 1\nLine 2\nNew Line\nLine 3\nLine 4')

            assert.deepStrictEqual(output, expectedOutput)
        })

        it('inserts text at the end when line number exceeds file length', async function () {
            const filePath = path.join(tempFolder.path, 'file1.txt')
            const params: InsertParams = {
                command: 'insert',
                path: filePath,
                insertLine: 10,
                newStr: 'New Last Line',
            }
            const fsWrite = new FsWrite(features)
            const output = await fsWrite.invoke(params)

            const newContent = await features.workspace.fs.readFile(filePath)
            assert.strictEqual(newContent, 'New First Line\nLine 1\nLine 2\nNew Line\nLine 3\nLine 4\nNew Last Line')

            assert.deepStrictEqual(output, expectedOutput)
        })

        it('handles insertion into an empty file', async function () {
            const filePath = path.join(tempFolder.path, 'file2.txt')
            await fs.writeFile(filePath, '')

            const params: InsertParams = {
                command: 'insert',
                path: filePath,
                insertLine: 0,
                newStr: 'First Line',
            }
            const fsWrite = new FsWrite(features)
            const output = await fsWrite.invoke(params)

            const newContent = await features.workspace.fs.readFile(filePath)
            assert.strictEqual(newContent, 'First Line\n')

            assert.deepStrictEqual(output, expectedOutput)
        })

        it('handles negative line numbers by inserting at the beginning', async function () {
            const filePath = path.join(tempFolder.path, 'file2.txt')

            const params: InsertParams = {
                command: 'insert',
                path: filePath,
                insertLine: -1,
                newStr: 'New First Line',
            }
            const fsWrite = new FsWrite(features)
            const output = await fsWrite.invoke(params)

            const newContent = await features.workspace.fs.readFile(filePath)
            assert.strictEqual(newContent, 'New First Line\nFirst Line\n')

            assert.deepStrictEqual(output, expectedOutput)
        })

        it('throws error when file does not exist', async function () {
            const filePath = path.join(tempFolder.path, 'nonexistent.txt')

            const params: InsertParams = {
                command: 'insert',
                path: filePath,
                insertLine: 1,
                newStr: 'New Line',
            }

            const fsWrite = new FsWrite(features)
            await assert.rejects(() => fsWrite.invoke(params), /no such file or directory/)
        })
    })

    describe('handleAppend', function () {
        it('appends text to the end of a file', async function () {
            const filePath = path.join(tempFolder.path, 'file1.txt')
            await fs.writeFile(filePath, 'Line 1\nLine 2\nLine 3\n')

            const params: AppendParams = {
                command: 'append',
                path: filePath,
                newStr: 'Line 4',
            }

            const fsWrite = new FsWrite(features)
            const output = await fsWrite.invoke(params)

            const newContent = await features.workspace.fs.readFile(filePath)
            assert.strictEqual(newContent, 'Line 1\nLine 2\nLine 3\nLine 4')

            assert.deepStrictEqual(output, expectedOutput)
        })

        it('adds a newline before appending if file does not end with one', async function () {
            const filePath = path.join(tempFolder.path, 'file2.txt')
            await fs.writeFile(filePath, 'Line 1\nLine 2\nLine 3')

            const params: AppendParams = {
                command: 'append',
                path: filePath,
                newStr: 'Line 4',
            }

            const fsWrite = new FsWrite(features)
            const output = await fsWrite.invoke(params)

            const newContent = await features.workspace.fs.readFile(filePath)
            assert.strictEqual(newContent, 'Line 1\nLine 2\nLine 3\nLine 4')

            assert.deepStrictEqual(output, expectedOutput)
        })

        it('appends to an empty file', async function () {
            const filePath = path.join(tempFolder.path, 'file3.txt')
            await fs.writeFile(filePath, '')

            const params: AppendParams = {
                command: 'append',
                path: filePath,
                newStr: 'Line 1',
            }
            const fsWrite = new FsWrite(features)
            const output = await fsWrite.invoke(params)

            const newContent = await features.workspace.fs.readFile(filePath)
            assert.strictEqual(newContent, 'Line 1')

            assert.deepStrictEqual(output, expectedOutput)
        })

        it('appends multiple lines correctly', async function () {
            const filePath = path.join(tempFolder.path, 'file3.txt')

            const params: AppendParams = {
                command: 'append',
                path: filePath,
                newStr: 'Line 2\nLine 3',
            }
            const fsWrite = new FsWrite(features)
            const output = await fsWrite.invoke(params)

            const newContent = await features.workspace.fs.readFile(filePath)
            assert.strictEqual(newContent, 'Line 1\nLine 2\nLine 3')

            assert.deepStrictEqual(output, expectedOutput)
        })

        it('throws error when file does not exist', async function () {
            const filePath = path.join(tempFolder.path, 'nonexistent.txt')

            const params: AppendParams = {
                command: 'append',
                path: filePath,
                newStr: 'New Line',
            }

            const fsWrite = new FsWrite(features)
            await assert.rejects(() => fsWrite.invoke(params), /no such file or directory/)
        })
    })

    describe('getDiffChanges', function () {
        beforeEach(async () => {
            tempFolder.clear()
        })

        it('handles create case', async function () {
            const testContent = 'newFileText'
            const fsWrite = new FsWrite(features)

            const filepath = path.join(tempFolder.path, 'testFile.txt')

            const result = await fsWrite.getDiffChanges({ command: 'create', path: filepath, fileText: testContent })
            assert.deepStrictEqual(result, [
                {
                    added: true,
                    count: 1,
                    removed: false,
                    value: testContent,
                },
            ])
            const result2 = await fsWrite.getDiffChanges({ command: 'create', path: filepath })
            assert.deepStrictEqual(result2, [])
        })

        it('handles replace case', async function () {
            const fsWrite = new FsWrite(features)
            const content = 'replace this old word'
            const filepath = await tempFolder.write('testFile.txt', content)

            const result = await fsWrite.getDiffChanges({
                command: 'strReplace',
                path: filepath,
                oldStr: 'old',
                newStr: 'new',
            })
            assert.deepStrictEqual(result, [
                {
                    added: false,
                    count: 1,
                    removed: true,
                    value: content,
                },
                {
                    added: true,
                    count: 1,
                    removed: false,
                    value: content.replace('old', 'new'),
                },
            ])
        })

        it('handles insert case', async function () {
            const fsWrite = new FsWrite(features)
            const content = 'line1 \n line2 \n line3'
            const filepath = await tempFolder.write('testFile.txt', content)

            const result = await fsWrite.getDiffChanges({
                command: 'insert',
                path: filepath,
                insertLine: 2,
                newStr: 'new text',
            })

            assert.deepStrictEqual(result, [
                {
                    added: false,
                    count: 2,
                    removed: false,
                    value: 'line1 \n line2 \n',
                },
                {
                    added: true,
                    count: 1,
                    removed: false,
                    value: 'new text\n',
                },
                {
                    added: false,
                    count: 1,
                    removed: false,
                    value: ' line3',
                },
            ])
        })

        it('handles append case', async function () {
            const fsWrite = new FsWrite(features)
            const content = 'line1 \n line2'
            const filepath = await tempFolder.write('testFile.txt', content)

            const result = await fsWrite.getDiffChanges({ command: 'append', path: filepath, newStr: 'line3' })

            assert.deepStrictEqual(result, [
                {
                    added: false,
                    count: 1,
                    removed: false,
                    value: 'line1 \n',
                },
                {
                    added: false,
                    count: 1,
                    removed: true,
                    value: ' line2',
                },
                {
                    added: true,
                    count: 2,
                    removed: false,
                    value: ' line2\nline3',
                },
            ])
        })
    })
})
