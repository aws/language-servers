import { convertChunksToRelevantTextDocuments } from './relevantTextDocuments'
import { Chunk } from 'local-indexing'
import { RelevantTextDocument } from '@aws/codewhisperer-streaming-client'
import * as assert from 'assert'

describe('relevantTextDocuments', () => {
    it('converts empty array to empty array', () => {
        const result = convertChunksToRelevantTextDocuments([])
        assert.deepStrictEqual(result, [])
    })

    it('combines chunks from same file and sorts by startLine', () => {
        const chunks: Chunk[] = [
            {
                id: '1',
                index: 0,
                filePath: 'test.ts',
                relativePath: 'src/test.ts',
                content: 'second chunk',
                startLine: 2,
                programmingLanguage: 'typescript',
                vec: [],
            },
            {
                id: '2',
                index: 1,
                filePath: 'test.ts',
                relativePath: 'src/test.ts',
                content: 'first chunk',
                startLine: 1,
                programmingLanguage: 'typescript',
                vec: [],
            },
        ]

        const expected: RelevantTextDocument[] = [
            {
                relativeFilePath: 'src/test.ts',
                programmingLanguage: { languageName: 'typescript' },
                text: 'first chunk\nsecond chunk',
            },
        ]

        const result = convertChunksToRelevantTextDocuments(chunks)
        assert.deepStrictEqual(result, expected)
    })

    it('handles chunks without startLine', () => {
        const chunks: Chunk[] = [
            {
                id: '1',
                index: 0,
                filePath: 'test.ts',
                relativePath: 'src/test.ts',
                content: 'chunk1',
                programmingLanguage: 'typescript',
                vec: [],
            },
            {
                id: '2',
                index: 1,
                filePath: 'test.ts',
                relativePath: 'src/test.ts',
                content: 'chunk2',
                programmingLanguage: 'typescript',
                vec: [],
            },
        ]

        const expected: RelevantTextDocument[] = [
            {
                relativeFilePath: 'src/test.ts',
                programmingLanguage: { languageName: 'typescript' },
                text: 'chunk1\nchunk2',
            },
        ]

        const result = convertChunksToRelevantTextDocuments(chunks)
        assert.deepStrictEqual(result, expected)
    })

    it('handles unknown programming language', () => {
        const chunks: Chunk[] = [
            {
                id: '1',
                index: 0,
                filePath: 'test.txt',
                relativePath: 'src/test.txt',
                content: 'content',
                programmingLanguage: 'unknown',
                vec: [],
            },
        ]

        const expected: RelevantTextDocument[] = [
            {
                relativeFilePath: 'src/test.txt',
                text: 'content',
            },
        ]

        const result = convertChunksToRelevantTextDocuments(chunks)
        assert.deepStrictEqual(result, expected)
    })

    it('filters out empty content', () => {
        const chunks: Chunk[] = [
            {
                id: '1',
                index: 0,
                filePath: 'test.ts',
                relativePath: 'src/test.ts',
                content: '',
                programmingLanguage: 'typescript',
                vec: [],
            },
            {
                id: '2',
                index: 1,
                filePath: 'test.ts',
                relativePath: 'src/test.ts',
                content: 'valid content',
                programmingLanguage: 'typescript',
                vec: [],
            },
        ]

        const expected: RelevantTextDocument[] = [
            {
                relativeFilePath: 'src/test.ts',
                programmingLanguage: { languageName: 'typescript' },
                text: 'valid content',
            },
        ]

        const result = convertChunksToRelevantTextDocuments(chunks)
        assert.deepStrictEqual(result, expected)
    })

    it('truncates relative file path if too long', () => {
        const longPath = 'a'.repeat(5000)
        const chunks: Chunk[] = [
            {
                id: '1',
                index: 0,
                filePath: 'test.ts',
                relativePath: longPath,
                content: 'content',
                programmingLanguage: 'typescript',
                vec: [],
            },
        ]

        const result = convertChunksToRelevantTextDocuments(chunks)
        assert.strictEqual(result[0].relativeFilePath?.length, 4000)
    })

    it('handles multiple files', () => {
        const chunks: Chunk[] = [
            {
                id: '1',
                index: 0,
                filePath: 'test1.ts',
                relativePath: 'src/test1.ts',
                content: 'content1',
                programmingLanguage: 'typescript',
                vec: [],
            },
            {
                id: '2',
                index: 1,
                filePath: 'test2.ts',
                relativePath: 'src/test2.ts',
                content: 'content2',
                programmingLanguage: 'typescript',
                vec: [],
            },
        ]

        const expected: RelevantTextDocument[] = [
            {
                relativeFilePath: 'src/test1.ts',
                programmingLanguage: { languageName: 'typescript' },
                text: 'content1',
            },
            {
                relativeFilePath: 'src/test2.ts',
                programmingLanguage: { languageName: 'typescript' },
                text: 'content2',
            },
        ]

        const result = convertChunksToRelevantTextDocuments(chunks)
        assert.deepStrictEqual(result, expected)
    })
})
