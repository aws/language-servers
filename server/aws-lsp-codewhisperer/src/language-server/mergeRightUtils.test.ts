import { getPrefixSuffixOverlap, truncateOverlapWithRightContext } from './mergeRightUtils'
import assert = require('assert')

describe('Merge Right Utils', () => {
    const HELLO_WORLD = `Console.WriteLine("Hello World!");`

    it('get prefix suffix overlap works as expected', () => {
        const result = getPrefixSuffixOverlap('adwg31', '31ggrs')
        assert.deepEqual(result, '31')
    })

    it('should return empty suggestion when right context equals file content ', () => {
        const result = truncateOverlapWithRightContext(
            {
                leftFileContent: '',
                rightFileContent: HELLO_WORLD,
                filename: 'File',
                programmingLanguage: { languageName: 'csharp' },
            },
            HELLO_WORLD
        )
        assert.deepEqual(result, '')
    })

    it('should return truncated suggestion when right context matches end of the suggestion', () => {
        // File contents will be `nsole.WriteLine("Hello World!");`
        // Suggestion will be the full HELLO_WORLD
        // Final truncated result should be the first two letters of HELLO_WORLD
        const result = truncateOverlapWithRightContext(
            {
                leftFileContent: '',
                rightFileContent: HELLO_WORLD.substring(2),
                filename: 'File',
                programmingLanguage: { languageName: 'csharp' },
            },
            HELLO_WORLD
        )

        assert.deepEqual(result, HELLO_WORLD.substring(0, 2))
    })
})
