import * as path from 'path'
import * as sinon from 'sinon'
import * as assert from 'assert'
import { expect } from 'chai'
import {
    getUserPromptsDirectory,
    getNewPromptFilePath,
    promptFileExtension,
    mergeRelevantTextDocuments,
    mergeFileLists,
} from './contextUtils'
import * as pathUtils from '@aws/lsp-core/out/util/path'
import { sanitizeFilename } from '@aws/lsp-core/out/util/text'
import { FileList } from '@aws/language-server-runtimes/server-interface'
import { RelevantTextDocumentAddition } from './agenticChatTriggerContext'

describe('contextUtils', () => {
    let getUserHomeDirStub: sinon.SinonStub

    beforeEach(() => {
        getUserHomeDirStub = sinon.stub(pathUtils, 'getUserHomeDir')

        // Default behavior
        getUserHomeDirStub.returns('/home/user')
    })

    afterEach(() => {
        sinon.restore()
    })

    describe('getUserPromptsDirectory', () => {
        it('should return the correct prompts directory path', () => {
            const result = getUserPromptsDirectory()
            assert.strictEqual(result, path.join('/home/user', '.aws', 'amazonq', 'prompts'))
        })
    })

    describe('getNewPromptFilePath', () => {
        it('should use default name when promptName is empty', () => {
            const result = getNewPromptFilePath('')
            assert.strictEqual(
                result,
                path.join('/home/user', '.aws', 'amazonq', 'prompts', `default${promptFileExtension}`)
            )
        })

        it('should use default name when promptName is undefined', () => {
            const result = getNewPromptFilePath(undefined as unknown as string)
            assert.strictEqual(
                result,
                path.join('/home/user', '.aws', 'amazonq', 'prompts', `default${promptFileExtension}`)
            )
        })

        it('should trim whitespace from promptName', () => {
            const result = getNewPromptFilePath('  test-prompt  ')
            const expectedSanitized = sanitizeFilename('test-prompt')
            assert.strictEqual(
                result,
                path.join('/home/user', '.aws', 'amazonq', 'prompts', `${expectedSanitized}${promptFileExtension}`)
            )
        })

        it('should truncate promptName if longer than 100 characters', () => {
            const longName = 'a'.repeat(150)
            const truncatedName = 'a'.repeat(100)

            const result = getNewPromptFilePath(longName)
            const expectedSanitized = sanitizeFilename(truncatedName)

            assert.strictEqual(
                result,
                path.join('/home/user', '.aws', 'amazonq', 'prompts', `${expectedSanitized}${promptFileExtension}`)
            )
        })

        it('should sanitize the filename using sanitizeFilename', () => {
            const unsafeName = 'unsafe/name?with:invalid*chars'
            const expectedSanitized = sanitizeFilename(path.basename(unsafeName))

            const result = getNewPromptFilePath(unsafeName)

            assert.strictEqual(
                result,
                path.join('/home/user', '.aws', 'amazonq', 'prompts', `${expectedSanitized}${promptFileExtension}`)
            )
        })

        it('should handle path traversal attempts', () => {
            const traversalPath = '../../../etc/passwd'
            const expectedSanitized = sanitizeFilename(path.basename(traversalPath))

            const result = getNewPromptFilePath(traversalPath)

            assert.strictEqual(
                result,
                path.join('/home/user', '.aws', 'amazonq', 'prompts', `${expectedSanitized}${promptFileExtension}`)
            )
        })
    })

    describe('mergeRelevantTextDocuments', () => {
        it('should return empty FileList when input array is empty', () => {
            const result = mergeRelevantTextDocuments([])
            expect(result.filePaths).to.be.an('array').that.is.empty
            expect(result.details).to.deep.equal({})
        })

        it('should skip documents with missing required fields', () => {
            const docs: RelevantTextDocumentAddition[] = [
                {
                    text: 'content',
                    path: '/path/to/file.js',
                    relativeFilePath: undefined, // Missing required field
                    startLine: 1,
                    endLine: 5,
                } as unknown as RelevantTextDocumentAddition,
                {
                    text: 'content',
                    path: '/path/to/file2.js',
                    relativeFilePath: 'file2.js',
                    startLine: undefined, // Missing required field
                    endLine: 10,
                } as unknown as RelevantTextDocumentAddition,
            ]

            const result = mergeRelevantTextDocuments(docs)
            expect(result.filePaths).to.be.an('array').that.is.empty
            expect(result.details).to.deep.equal({})
        })

        it('should merge overlapping line ranges for the same file', () => {
            const docs: RelevantTextDocumentAddition[] = [
                {
                    text: 'content1',
                    path: '/path/to/file.js',
                    relativeFilePath: 'file.js',
                    startLine: 1,
                    endLine: 5,
                } as RelevantTextDocumentAddition,
                {
                    text: 'content2',
                    path: '/path/to/file.js',
                    relativeFilePath: 'file.js',
                    startLine: 4,
                    endLine: 8,
                } as RelevantTextDocumentAddition,
                {
                    text: 'content3',
                    path: '/path/to/file.js',
                    relativeFilePath: 'file.js',
                    startLine: 10,
                    endLine: 15,
                } as RelevantTextDocumentAddition,
            ]

            const result = mergeRelevantTextDocuments(docs)
            expect(result.filePaths).to.deep.equal(['file.js'])
            expect(result.details?.['file.js'].lineRanges).to.deep.equal([
                { first: 1, second: 8 },
                { first: 10, second: 15 },
            ])
        })

        it('should handle multiple files correctly', () => {
            const docs: RelevantTextDocumentAddition[] = [
                {
                    text: 'content1',
                    path: '/path/to/file1.js',
                    relativeFilePath: 'file1.js',
                    startLine: 1,
                    endLine: 5,
                } as RelevantTextDocumentAddition,
                {
                    text: 'content2',
                    path: '/path/to/file2.js',
                    relativeFilePath: 'file2.js',
                    startLine: 10,
                    endLine: 15,
                } as RelevantTextDocumentAddition,
            ]

            const result = mergeRelevantTextDocuments(docs)
            expect(result.filePaths).to.have.members(['file1.js', 'file2.js'])
            expect(result.details?.['file1.js'].lineRanges).to.deep.equal([{ first: 1, second: 5 }])
            expect(result.details?.['file2.js'].lineRanges).to.deep.equal([{ first: 10, second: 15 }])
        })
    })

    describe('mergeFileLists', () => {
        it('should return second FileList when first is empty', () => {
            const fileList1: FileList = { filePaths: [], details: {} }
            const fileList2: FileList = {
                filePaths: ['file.js'],
                details: {
                    'file.js': {
                        fullPath: 'file.js',
                        lineRanges: [{ first: 1, second: 5 }],
                    },
                },
            }

            const result = mergeFileLists(fileList1, fileList2)
            expect(result).to.deep.equal(fileList2)
        })

        it('should return first FileList when second is empty', () => {
            const fileList1: FileList = {
                filePaths: ['file.js'],
                details: {
                    'file.js': {
                        fullPath: 'file.js',
                        lineRanges: [{ first: 1, second: 5 }],
                    },
                },
            }
            const fileList2: FileList = { filePaths: [], details: {} }

            const result = mergeFileLists(fileList1, fileList2)
            expect(result).to.deep.equal(fileList1)
        })

        it('should merge non-overlapping files from both lists', () => {
            const fileList1: FileList = {
                filePaths: ['file1.js'],
                details: {
                    'file1.js': {
                        fullPath: 'file1.js',
                        lineRanges: [{ first: 1, second: 5 }],
                    },
                },
            }
            const fileList2: FileList = {
                filePaths: ['file2.js'],
                details: {
                    'file2.js': {
                        fullPath: 'file2.js',
                        lineRanges: [{ first: 10, second: 15 }],
                    },
                },
            }

            const result = mergeFileLists(fileList1, fileList2)
            expect(result.filePaths).to.have.members(['file1.js', 'file2.js'])
            expect(result.details?.['file1.js'].lineRanges).to.deep.equal([{ first: 1, second: 5 }])
            expect(result.details?.['file2.js'].lineRanges).to.deep.equal([{ first: 10, second: 15 }])
        })

        it('should merge overlapping line ranges for the same file', () => {
            const fileList1: FileList = {
                filePaths: ['file.js'],
                details: {
                    'file.js': {
                        fullPath: 'file.js',
                        lineRanges: [
                            { first: 1, second: 5 },
                            { first: 10, second: 15 },
                        ],
                    },
                },
            }
            const fileList2: FileList = {
                filePaths: ['file.js'],
                details: {
                    'file.js': {
                        fullPath: 'file.js',
                        lineRanges: [
                            { first: 4, second: 8 },
                            { first: 20, second: 25 },
                        ],
                    },
                },
            }

            const result = mergeFileLists(fileList1, fileList2)
            expect(result.filePaths).to.deep.equal(['file.js'])
            expect(result.details?.['file.js'].lineRanges).to.deep.equal([
                { first: 1, second: 8 },
                { first: 10, second: 15 },
                { first: 20, second: 25 },
            ])
        })

        it('should handle consecutive ranges by merging them', () => {
            const fileList1: FileList = {
                filePaths: ['file.js'],
                details: {
                    'file.js': {
                        fullPath: 'file.js',
                        lineRanges: [{ first: 1, second: 5 }],
                    },
                },
            }
            const fileList2: FileList = {
                filePaths: ['file.js'],
                details: {
                    'file.js': {
                        fullPath: 'file.js',
                        lineRanges: [{ first: 6, second: 10 }],
                    },
                },
            }

            const result = mergeFileLists(fileList1, fileList2)
            expect(result.filePaths).to.deep.equal(['file.js'])
            expect(result.details?.['file.js'].lineRanges).to.deep.equal([{ first: 1, second: 10 }])
        })

        it('should handle undefined lineRanges', () => {
            const fileList1: FileList = {
                filePaths: ['file.js'],
                details: {
                    'file.js': {
                        fullPath: 'file.js',
                        lineRanges: undefined,
                    },
                },
            }
            const fileList2: FileList = {
                filePaths: ['file.js'],
                details: {
                    'file.js': {
                        fullPath: 'file.js',
                        lineRanges: [{ first: 1, second: 5 }],
                    },
                },
            }

            const result = mergeFileLists(fileList1, fileList2)
            expect(result.filePaths).to.deep.equal(['file.js'])
            expect(result.details?.['file.js'].lineRanges).to.deep.equal([{ first: 1, second: 5 }])
        })
    })
})
