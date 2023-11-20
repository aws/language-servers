import { getPrefixSuffixOverlap, truncateOverlapWithRightContext } from './mergeRightUtils'
import assert = require('assert')

describe('Merge Right Utils', () => {
    const HELLO_WORLD = `Console.WriteLine("Hello World!");`

    it('get prefix suffix overlap works as expected', () => {
        const result = getPrefixSuffixOverlap('adwg31', '31ggrs')
        assert.deepEqual(result, '31')
    })

    it('should return empty suggestion when right context equals file content ', () => {
        const result = truncateOverlapWithRightContext(HELLO_WORLD, HELLO_WORLD)
        assert.deepEqual(result, '')
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
})
