import * as assert from 'assert'
import {
    getPrefixSuffixOverlap,
    truncateOverlapWithRightContext,
    mergeSuggestionsWithRightContext,
} from './mergeRightUtils'
import { Suggestion } from '../../../shared/codeWhispererService'
import { HELLO_WORLD_IN_CSHARP, HELLO_WORLD_WITH_WINDOWS_ENDING } from '../../../shared/testUtils'

describe('mergeRightUtils', () => {
    describe('getPrefixSuffixOverlap', () => {
        it('should find overlap between suffix and prefix', () => {
            const result = getPrefixSuffixOverlap('adwg31', '31ggrs')
            assert.equal(result, '31')
        })

        it('should return empty string when no overlap', () => {
            const result = getPrefixSuffixOverlap('hello', 'world')
            assert.equal(result, '')
        })

        it('should handle empty strings', () => {
            const result = getPrefixSuffixOverlap('', 'test')
            assert.equal(result, '')
        })

        it('should find full overlap when second string is prefix of first', () => {
            const result = getPrefixSuffixOverlap('hello', 'hello world')
            assert.equal(result, 'hello')
        })
    })

    describe('truncateOverlapWithRightContext', () => {
        const HELLO_WORLD = 'Console.WriteLine("Hello World!");'
        it('should truncate overlap with right context', () => {
            const rightContext = '");'
            const result = truncateOverlapWithRightContext(rightContext, HELLO_WORLD)
            assert.equal(result, 'Console.WriteLine("Hello World!')
        })

        it('should return original suggestion when no overlap', () => {
            const rightContext = 'different content'
            const result = truncateOverlapWithRightContext(rightContext, HELLO_WORLD)
            assert.equal(result, HELLO_WORLD)
        })

        it('should handle right context with leading whitespace', () => {
            const suggestion = 'const x = 1;'
            const rightContext = '    ; // comment'
            const result = truncateOverlapWithRightContext(rightContext, suggestion)
            assert.equal(result, 'const x = 1')
        })

        it('should return empty suggestion when right context equals line content ', () => {
            const result1 = truncateOverlapWithRightContext(HELLO_WORLD, HELLO_WORLD)
            assert.deepEqual(result1, '')
            // Without trimStart, this test would fail because the function doesn't trim leading new line from right context
            const result2 = truncateOverlapWithRightContext(HELLO_WORLD_IN_CSHARP.trimStart(), HELLO_WORLD_IN_CSHARP)
            assert.deepEqual(result2, '')
        })

        it('should not handle the case where right context fully matches suggestion but starts with a newline ', () => {
            const result = truncateOverlapWithRightContext('\n' + HELLO_WORLD_IN_CSHARP, HELLO_WORLD_IN_CSHARP)
            // Even though right context and suggestion are equal, the newline of right context doesn't get trimmed while the newline of suggestion gets trimmed
            // As a result, we end up with no overlap
            assert.deepEqual(result, HELLO_WORLD_IN_CSHARP)
        })

        it('should return truncated suggestion when right context matches end of the suggestion', () => {
            // File contents will be `nsole.WriteLine("Hello World!");`
            // Suggestion will be the full HELLO_WORLD
            // Final truncated result should be the first two letters of HELLO_WORLD
            const result = truncateOverlapWithRightContext(HELLO_WORLD.substring(2), HELLO_WORLD)

            assert.deepEqual(result, HELLO_WORLD.substring(0, 2))
        })

        it('should trim right-context tabs and whitespaces until first newline', () => {
            const suggestion = '{\n            return a + b;\n        }'
            const rightContent = '       \n        }\n\n    }\n}'
            const expected_result = '{\n            return a + b;'
            const result = truncateOverlapWithRightContext(rightContent, suggestion)

            assert.deepEqual(result, expected_result)
        })

        it('should handle different line endings', () => {
            const suggestion = '{\n            return a + b;\n        }'
            const rightContent = '\r\n        }\r\n}\r\n}'
            const expected_result = '{\n            return a + b;'
            const result = truncateOverlapWithRightContext(rightContent, suggestion)

            assert.deepEqual(result, expected_result)
        })

        it('should handle windows line endings for files', () => {
            const result = truncateOverlapWithRightContext(
                HELLO_WORLD_WITH_WINDOWS_ENDING,
                HELLO_WORLD_WITH_WINDOWS_ENDING.replaceAll('\r', '')
            )
            assert.deepEqual(result, '')
        })
    })

    describe('mergeSuggestionsWithRightContext', () => {
        const mockSuggestions: Suggestion[] = [
            {
                itemId: 'item1',
                content: 'console.log("test");',
                references: [
                    {
                        licenseName: 'MIT',
                        url: 'https://example.com',
                        repository: 'test-repo',
                        recommendationContentSpan: { start: 0, end: 10 },
                    },
                ],
                mostRelevantMissingImports: [
                    {
                        statement: 'import { test } from "test"',
                    },
                ],
            },
        ]

        it('should merge suggestions with right context', () => {
            const rightContext = '");'
            const result = mergeSuggestionsWithRightContext(rightContext, mockSuggestions, false)

            assert.equal(result.length, 1)
            assert.equal(result[0].itemId, 'item1')
            assert.equal(result[0].insertText, 'console.log("test')
            assert.equal(result[0].mostRelevantMissingImports, undefined)
        })

        it('should include imports when enabled', () => {
            const rightContext = ''
            const result = mergeSuggestionsWithRightContext(rightContext, mockSuggestions, true)

            assert.equal(result[0].mostRelevantMissingImports?.length, 1)
            assert.equal(result[0].mostRelevantMissingImports?.[0].statement, 'import { test } from "test"')
        })

        it('should filter references based on insert text length', () => {
            const suggestions: Suggestion[] = [
                {
                    itemId: 'item1',
                    content: 'short',
                    references: [
                        {
                            licenseName: 'MIT',
                            url: 'https://example.com',
                            repository: 'test-repo',
                            recommendationContentSpan: { start: 10, end: 20 }, // start > insertText.length
                        },
                    ],
                },
            ]

            const result = mergeSuggestionsWithRightContext('', suggestions, false)

            assert.equal(result[0].references, undefined)
        })

        it('should include range when provided', () => {
            const range = { start: { line: 0, character: 0 }, end: { line: 0, character: 5 } }
            const result = mergeSuggestionsWithRightContext('', mockSuggestions, false, range)

            assert.deepEqual(result[0].range, range)
        })

        it('should handle suggestions with no references', () => {
            const suggestions: Suggestion[] = [
                {
                    itemId: 'item1',
                    content: 'test content',
                },
            ]

            const result = mergeSuggestionsWithRightContext('', suggestions, false)

            assert.equal(result[0].references, undefined)
        })
    })
})
