import { AppendParams, CreateParams, FsWrite, InsertParams, StrReplaceParams } from './fsWrite'
import { testFolder } from '@aws/lsp-core'
import * as path from 'path'
import * as assert from 'assert'
import * as fs from 'fs/promises'
import { InvokeOutput } from './toolShared'
import { TestFeatures } from '@aws/language-server-runtimes/testing'
import { Workspace } from '@aws/language-server-runtimes/server-interface'
import { StubbedInstance } from 'ts-sinon'
import * as os from 'os'

describe('FsWrite Tool', function () {
    let tempFolder: testFolder.TestFolder
    let features: TestFeatures
    const expectedOutput: InvokeOutput = {
        output: {
            kind: 'text',
            content: '',
        },
    }

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

    afterEach(async function () {
        await tempFolder.clear()
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
            const filePath = await tempFolder.write('file1.txt', 'Hello World')
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
            const filePath = await tempFolder.write('file1.txt', 'some text is here')

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
            const filePath = path.join(tempFolder.path, 'insertFileLine.txt')
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
            const originalContent = 'Line 1\nLine 2\nNew Line\nLine 3\nLine 4'
            const filePath = await tempFolder.write('insertStart.txt', originalContent)
            const params: InsertParams = {
                command: 'insert',
                path: filePath,
                insertLine: 0,
                newStr: 'New First Line',
            }
            const fsWrite = new FsWrite(features)
            const output = await fsWrite.invoke(params)

            const newContent = await features.workspace.fs.readFile(filePath)
            assert.strictEqual(newContent, `New First Line\n${originalContent}`)

            assert.deepStrictEqual(output, expectedOutput)
        })

        it('inserts text at the end when line number exceeds file length', async function () {
            const originalContent = 'Line 1\nLine 2\nNew Line\nLine 3\nLine 4'
            const filePath = await tempFolder.write('insertEnd.txt', originalContent)
            const params: InsertParams = {
                command: 'insert',
                path: filePath,
                insertLine: 10,
                newStr: 'New Last Line',
            }
            const fsWrite = new FsWrite(features)
            const output = await fsWrite.invoke(params)

            const newContent = await features.workspace.fs.readFile(filePath)
            assert.strictEqual(newContent, 'Line 1\nLine 2\nNew Line\nLine 3\nLine 4\nNew Last Line')

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
            const filePath = await tempFolder.write('negativeInsert.txt', 'First Line\n')

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
            const filePath = await tempFolder.write('multiLineAppend.txt', 'Line 1')

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

    describe('getStrReplaceContent', function () {
        it('preserves CRLF line endings in file when oldStr uses LF', async () => {
            const filePath = await tempFolder.write('test1.txt', 'before\r\nline 1\r\nline 2\r\nline 3\r\nafter')

            const params: StrReplaceParams = {
                command: 'strReplace',
                path: filePath,
                oldStr: 'line 1\nline 2\nline 3',
                newStr: 'new line 1\nnew line 2\nnew line 3',
            }

            const fsWrite = new FsWrite(features)
            await fsWrite.invoke(params)

            const result = await features.workspace.fs.readFile(filePath)
            assert.strictEqual(result, 'before\r\nnew line 1\r\nnew line 2\r\nnew line 3\r\nafter')
        })

        it('preserves LF line endings in file when oldStr uses CRLF', async () => {
            const filePath = await tempFolder.write('test2.txt', 'before\nline 1\nline 2\nline 3\nafter')

            const params: StrReplaceParams = {
                command: 'strReplace',
                path: filePath,
                oldStr: 'line 1\r\nline 2\r\nline 3',
                newStr: 'new line 1\r\nnew line 2\r\nnew line 3',
            }

            const fsWrite = new FsWrite(features)
            await fsWrite.invoke(params)

            const result = await features.workspace.fs.readFile(filePath)
            assert.strictEqual(result, 'before\nnew line 1\nnew line 2\nnew line 3\nafter')
        })

        it('preserves CR line endings in file when oldStr uses LF', async () => {
            const filePath = await tempFolder.write('test3.txt', 'before\rline 1\rline 2\rline 3\rafter')

            const params: StrReplaceParams = {
                command: 'strReplace',
                path: filePath,
                oldStr: 'line 1\nline 2\nline 3',
                newStr: 'new line 1\nnew line 2\nnew line 3',
            }

            const fsWrite = new FsWrite(features)
            await fsWrite.invoke(params)

            const result = await features.workspace.fs.readFile(filePath)
            assert.strictEqual(result, 'before\rnew line 1\rnew line 2\rnew line 3\rafter')
        })

        it('handles mixed line endings in newStr by normalizing to file line ending', async () => {
            const filePath = await tempFolder.write('test4.txt', 'before\r\nline 1\r\nline 2\r\nafter')

            const params: StrReplaceParams = {
                command: 'strReplace',
                path: filePath,
                oldStr: 'line 1\nline 2',
                newStr: 'new line 1\r\nnew line 2\nnew line 3\rend',
            }

            const fsWrite = new FsWrite(features)
            await fsWrite.invoke(params)

            const result = await features.workspace.fs.readFile(filePath)
            assert.strictEqual(result, 'before\r\nnew line 1\r\nnew line 2\r\nnew line 3\r\nend\r\nafter')
        })

        it('handles content with no line endings', async () => {
            const filePath = await tempFolder.write('test5.txt', 'before simple text after')

            const params: StrReplaceParams = {
                command: 'strReplace',
                path: filePath,
                oldStr: 'simple text',
                newStr: 'replacement',
            }

            const fsWrite = new FsWrite(features)
            await fsWrite.invoke(params)

            const result = await features.workspace.fs.readFile(filePath)
            assert.strictEqual(result, 'before replacement after')
        })

        it('uses OS default line ending when file has no line endings and adding new lines', async () => {
            const filePath = await tempFolder.write('test6.txt', 'before text after')

            const params: StrReplaceParams = {
                command: 'strReplace',
                path: filePath,
                oldStr: 'text',
                newStr: 'line 1\nline 2',
            }

            const fsWrite = new FsWrite(features)
            await fsWrite.invoke(params)

            const result = await features.workspace.fs.readFile(filePath)
            assert.strictEqual(result, `before line 1${os.EOL}line 2 after`)
        })

        it('preserves line endings when only portion of line is replaced', async () => {
            const filePath = await tempFolder.write('test8.txt', 'start\r\nprefix middle suffix\r\nend')

            const params: StrReplaceParams = {
                command: 'strReplace',
                path: filePath,
                oldStr: 'middle',
                newStr: 'center',
            }

            const fsWrite = new FsWrite(features)
            await fsWrite.invoke(params)

            const result = await features.workspace.fs.readFile(filePath)
            assert.strictEqual(result, 'start\r\nprefix center suffix\r\nend')
        })
    })
})
