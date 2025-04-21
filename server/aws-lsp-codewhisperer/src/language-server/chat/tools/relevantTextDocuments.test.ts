import { convertChunksToRelevantTextDocuments } from './relevantTextDocuments'
import { Chunk } from 'local-indexing'
import { RelevantTextDocument } from '@amzn/codewhisperer-streaming'

describe('convertChunksToRelevantTextDocuments', () => {
    test('converts empty array to empty array', () => {
        expect(convertChunksToRelevantTextDocuments([])).toEqual([])
    })

    test('combines chunks from same file and sorts by startLine', () => {
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

        expect(convertChunksToRelevantTextDocuments(chunks)).toEqual(expected)
    })

    test('handles chunks without startLine', () => {
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

        expect(convertChunksToRelevantTextDocuments(chunks)).toEqual(expected)
    })

    test('handles unknown programming language', () => {
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

        expect(convertChunksToRelevantTextDocuments(chunks)).toEqual(expected)
    })

    test('filters out empty content', () => {
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

        expect(convertChunksToRelevantTextDocuments(chunks)).toEqual(expected)
    })

    test('truncates relative file path if too long', () => {
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
        expect(result[0].relativeFilePath?.length).toBe(4000)
    })

    test('handles multiple files', () => {
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

        expect(convertChunksToRelevantTextDocuments(chunks)).toEqual(expected)
    })
})
