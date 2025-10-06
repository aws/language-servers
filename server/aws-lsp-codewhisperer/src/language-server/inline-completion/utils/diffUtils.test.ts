import * as assert from 'assert'
import { getAddedAndDeletedLines, getCharacterDifferences, generateDiffContexts } from './diffUtils'

describe('diffUtils', () => {
    describe('getAddedAndDeletedLines', () => {
        const SAMPLE_UNIFIED_DIFF = `--- a/file.txt
+++ b/file.txt
@@ -1,3 +1,3 @@
 line1
-old line
+new line
 line3`
        it('should extract added and deleted lines from unified diff', () => {
            const result = getAddedAndDeletedLines(SAMPLE_UNIFIED_DIFF)

            assert.deepEqual(result.addedLines, ['new line'])
            assert.deepEqual(result.deletedLines, ['old line'])
        })

        it('should handle empty diff', () => {
            const result = getAddedAndDeletedLines('')
            assert.deepEqual(result.addedLines, [])
            assert.deepEqual(result.deletedLines, [])
        })
    })

    describe('getCharacterDifferences', () => {
        const ADDED_LINES = ['hello world']
        const DELETED_LINES = ['hello there']
        it('should calculate character differences using LCS', () => {
            const result = getCharacterDifferences(ADDED_LINES, DELETED_LINES)

            assert.equal(result.charactersAdded, 4)
            assert.equal(result.charactersRemoved, 4)
        })

        it('should handle empty added lines', () => {
            const result = getCharacterDifferences([], DELETED_LINES)

            assert.equal(result.charactersAdded, 0)
            assert.equal(result.charactersRemoved, 11) // 'hello there' = 11 chars
        })

        it('should handle empty deleted lines', () => {
            const result = getCharacterDifferences(ADDED_LINES, [])

            assert.equal(result.charactersAdded, 11) // 'hello world' = 11 chars
            assert.equal(result.charactersRemoved, 0)
        })
    })

    describe('generateDiffContexts', () => {
        const TEST_FILE_PATH = '/test/file.ts'
        const CURRENT_CONTENT = 'current content'
        const OLD_CONTENT = 'old content'
        const MAX_CONTEXTS = 5
        const SNAPSHOT_CONTENTS = [
            {
                filePath: TEST_FILE_PATH,
                content: OLD_CONTENT,
                timestamp: Date.now() - 1000,
            },
        ]
        it('should generate diff contexts from snapshots', () => {
            const result = generateDiffContexts(TEST_FILE_PATH, CURRENT_CONTENT, SNAPSHOT_CONTENTS, MAX_CONTEXTS)

            assert.equal(result.isUtg, false)
            assert.equal(result.isProcessTimeout, false)
            assert.equal(result.strategy, 'recentEdits')
            assert.equal(typeof result.latency, 'number')
            assert.equal(typeof result.contentsLength, 'number')
        })

        it('should return empty context for no snapshots', () => {
            const result = generateDiffContexts(TEST_FILE_PATH, 'content', [], MAX_CONTEXTS)

            assert.equal(result.isUtg, false)
            assert.equal(result.isProcessTimeout, false)
            assert.equal(result.supplementalContextItems.length, 0)
            assert.equal(result.contentsLength, 0)
            assert.equal(result.latency, 0)
            assert.equal(result.strategy, 'recentEdits')
        })
    })
})
