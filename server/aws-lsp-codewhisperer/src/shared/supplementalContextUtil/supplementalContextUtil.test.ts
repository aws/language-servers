import * as assert from 'assert'
import * as sinon from 'sinon'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { CancellationToken, Logging, Position, Workspace } from '@aws/language-server-runtimes/server-interface'
import {
    fetchSupplementalContext,
    CancellationError,
    truncateSupplementalContext,
    truncateLineByLine,
    trimSupplementalContexts,
} from './supplementalContextUtil'
import * as crossFileContextUtil from './crossFileContextUtil'
import * as codeParsingUtil from './codeParsingUtil'
import { CodeWhispererSupplementalContext, CodeWhispererSupplementalContextItem } from '../models/model'
import { crossFileContextConfig } from '../models/constants'

function makeItem(content: string, filePath = 'file.ts', score?: number): CodeWhispererSupplementalContextItem {
    return { content, filePath, score }
}

function makeContext(
    items: CodeWhispererSupplementalContextItem[],
    overrides?: Partial<CodeWhispererSupplementalContext>
): CodeWhispererSupplementalContext {
    return {
        isUtg: false,
        isProcessTimeout: false,
        supplementalContextItems: items,
        contentsLength: items.reduce((acc, i) => acc + i.content.length, 0),
        latency: 50,
        strategy: 'OpenTabs_BM25',
        ...overrides,
    }
}

describe('fetchSupplementalContext', function () {
    let workspace: Workspace
    let logging: Logging
    let cancellationToken: CancellationToken
    let amazonQServiceManager: any
    let document: TextDocument
    let position: Position
    let crossFileContextStub: sinon.SinonStub
    let isTestFileStub: sinon.SinonStub
    let performanceStub: sinon.SinonStubbedInstance<{ now: () => number }>

    beforeEach(() => {
        document = TextDocument.create('file:///somefile.js', 'javascript', 1, 'console.log("Hello, World!");')
        position = Position.create(0, 0)
        workspace = {} as Workspace
        logging = {
            log: sinon.stub(),
        } as unknown as Logging
        cancellationToken = {
            isCancellationRequested: false,
            onCancellationRequested: sinon.stub(),
        }
        crossFileContextStub = sinon.stub(crossFileContextUtil, 'fetchSupplementalContextForSrc')
        isTestFileStub = sinon.stub(codeParsingUtil, 'isTestFile')
        amazonQServiceManager = {
            getConfiguration: sinon.stub().returns({
                projectContext: {
                    enableLocalIndexing: true,
                },
            }),
        }
        performanceStub = sinon.stub({ now: () => 0 })
        sinon.stub(global, 'performance').value(performanceStub)
    })

    afterEach(() => {
        sinon.restore()
    })

    it('should return supplemental context for non-test files', async function () {
        performanceStub.now.onFirstCall().returns(0)
        performanceStub.now.onSecondCall().returns(100) // 100ms elapsed time
        isTestFileStub.returns(false)
        crossFileContextStub.returns({
            supplementalContextItems: [{ content: 'test content', filePath: 'somefile.js' }],
            strategy: 'OpenTabs_BM25',
        })

        const expectedContext: CodeWhispererSupplementalContext = {
            isUtg: false,
            isProcessTimeout: false,
            latency: 100,
            contentsLength: 12,
            supplementalContextItems: [{ content: 'test content', filePath: 'somefile.js' }],
            strategy: 'OpenTabs_BM25',
        }

        const result = await fetchSupplementalContext(
            document,
            position,
            workspace,
            logging,
            cancellationToken,
            amazonQServiceManager
        )

        assert.deepStrictEqual(result, expectedContext)
    })

    it('should return undefined for test files', async function () {
        isTestFileStub.returns(true)

        const result = await fetchSupplementalContext(
            document,
            position,
            workspace,
            logging,
            cancellationToken,
            amazonQServiceManager
        )

        assert.strictEqual(result, undefined)
    })

    it('should return empty context when CancellationError is received', async function () {
        isTestFileStub.returns(false)
        crossFileContextStub.throws(new CancellationError())
        performanceStub.now.onFirstCall().returns(0)
        performanceStub.now.onSecondCall().returns(100) // 100ms elapsed time
        const expectedContext = {
            contentsLength: 0,
            isProcessTimeout: true,
            isUtg: false,
            latency: 100,
            strategy: 'Empty',
            supplementalContextItems: [],
        }

        const result = await fetchSupplementalContext(
            document,
            position,
            workspace,
            logging,
            cancellationToken,
            amazonQServiceManager
        )

        assert.deepStrictEqual(result, expectedContext)
    })

    it('should handle errors and return undefined', async function () {
        isTestFileStub.returns(false)
        crossFileContextStub.throws(new Error('Some error'))

        const result = await fetchSupplementalContext(
            document,
            position,
            workspace,
            logging,
            cancellationToken,
            amazonQServiceManager
        )

        assert.strictEqual(result, undefined)
        sinon.assert.calledWithMatch(
            // @ts-ignore
            logging.log,
            'Fail to fetch supplemental context for target file file:///somefile.js'
        )
    })

    it('should return empty context when workspace context is disabled', async function () {
        amazonQServiceManager.getConfiguration.returns({
            projectContext: {
                enableLocalIndexing: false,
            },
        })

        performanceStub.now.onFirstCall().returns(0)
        performanceStub.now.onSecondCall().returns(100) // 100ms elapsed time
        isTestFileStub.returns(false)

        crossFileContextStub.returns({
            supplementalContextItems: [],
            strategy: 'Empty',
        })

        const result = await fetchSupplementalContext(
            document,
            position,
            workspace,
            logging,
            cancellationToken,
            amazonQServiceManager
        )

        const expectedContext: CodeWhispererSupplementalContext = {
            isUtg: false,
            isProcessTimeout: false,
            latency: 100,
            contentsLength: 0,
            supplementalContextItems: [],
            strategy: 'Empty',
        }

        assert.deepStrictEqual(result, expectedContext)

        sinon.assert.calledOnce(crossFileContextStub)
    })
})

describe('truncateSupplementalContext', function () {
    it('should pass through items that are within all limits', function () {
        const items = [makeItem('short content', 'a.ts'), makeItem('another chunk', 'b.ts')]
        const ctx = makeContext(items)
        const result = truncateSupplementalContext(ctx)

        assert.strictEqual(result.supplementalContextItems.length, 2)
        assert.strictEqual(result.supplementalContextItems[0].content, 'short content')
        assert.strictEqual(result.supplementalContextItems[1].content, 'another chunk')
        assert.strictEqual(result.contentsLength, 'short content'.length + 'another chunk'.length)
    })

    it('should return empty array when given no items', function () {
        const ctx = makeContext([])
        const result = truncateSupplementalContext(ctx)

        assert.strictEqual(result.supplementalContextItems.length, 0)
        assert.strictEqual(result.contentsLength, 0)
    })

    it('should truncate individual chunks exceeding maxLengthEachChunk (10240)', function () {
        const longContent = 'a\n'.repeat(10240) // well over 10240 chars
        const items = [makeItem(longContent, 'big.ts')]
        const ctx = makeContext(items)
        const result = truncateSupplementalContext(ctx)

        assert.strictEqual(result.supplementalContextItems.length, 1)
        assert.ok(
            result.supplementalContextItems[0].content.length <= crossFileContextConfig.maxLengthEachChunk,
            `Chunk length ${result.supplementalContextItems[0].content.length} should be <= ${crossFileContextConfig.maxLengthEachChunk}`
        )
    })

    it('should limit to maxContextCount (5) items', function () {
        const items = Array.from({ length: 8 }, (_, i) => makeItem(`chunk ${i}`, `file${i}.ts`))
        const ctx = makeContext(items)
        const result = truncateSupplementalContext(ctx)

        assert.strictEqual(result.supplementalContextItems.length, crossFileContextConfig.maxContextCount)
        // Should keep the first 5
        assert.strictEqual(result.supplementalContextItems[0].content, 'chunk 0')
        assert.strictEqual(result.supplementalContextItems[4].content, 'chunk 4')
    })

    it('should drop trailing chunks when total length exceeds 20480', function () {
        // 5 chunks of 5000 chars each = 25000 total, exceeds 20480
        const items = Array.from({ length: 5 }, (_, i) => makeItem('x'.repeat(5000), `file${i}.ts`))
        const ctx = makeContext(items)
        const result = truncateSupplementalContext(ctx)

        // Should drop chunks from the end until total <= 20480
        const totalLen = result.supplementalContextItems.reduce((acc, i) => acc + i.content.length, 0)
        assert.ok(totalLen <= 20480, `Total length ${totalLen} should be <= 20480`)
        assert.strictEqual(result.contentsLength, totalLen)
    })

    it('should handle exactly maxContextCount items within total length', function () {
        // 5 chunks of 4000 chars each = 20000 total, under 20480
        const items = Array.from({ length: 5 }, (_, i) => makeItem('y'.repeat(4000), `file${i}.ts`))
        const ctx = makeContext(items)
        const result = truncateSupplementalContext(ctx)

        assert.strictEqual(result.supplementalContextItems.length, 5)
        assert.strictEqual(result.contentsLength, 20000)
    })

    it('should handle total length exactly at 20480 boundary', function () {
        // After fix: > 20480 triggers dropping, so exactly 20480 is valid and kept
        const items = [makeItem('a'.repeat(10240), 'a.ts'), makeItem('b'.repeat(10240), 'b.ts')]
        const ctx = makeContext(items)
        const result = truncateSupplementalContext(ctx)

        assert.strictEqual(result.supplementalContextItems.length, 2)
        assert.strictEqual(result.contentsLength, 20480)
    })

    it('should preserve item metadata (filePath, score) after truncation', function () {
        const items = [makeItem('content', 'path/to/file.ts', 0.95)]
        const ctx = makeContext(items)
        const result = truncateSupplementalContext(ctx)

        assert.strictEqual(result.supplementalContextItems[0].filePath, 'path/to/file.ts')
        assert.strictEqual(result.supplementalContextItems[0].score, 0.95)
    })

    it('should preserve context-level fields (isUtg, strategy, etc.)', function () {
        const items = [makeItem('content')]
        const ctx = makeContext(items, { isUtg: true, strategy: 'NEW_UTG', latency: 42 })
        const result = truncateSupplementalContext(ctx)

        assert.strictEqual(result.isUtg, true)
        assert.strictEqual(result.strategy, 'NEW_UTG')
        assert.strictEqual(result.latency, 42)
    })

    it('should apply both per-chunk and count truncation together', function () {
        // 7 items, some oversized
        const items = [
            makeItem('a\n'.repeat(6000), 'big1.ts'), // over 10240
            makeItem('short', 'small1.ts'),
            makeItem('b\n'.repeat(6000), 'big2.ts'), // over 10240
            makeItem('tiny', 'small2.ts'),
            makeItem('c\n'.repeat(6000), 'big3.ts'), // over 10240
            makeItem('extra1', 'small3.ts'),
            makeItem('extra2', 'small4.ts'),
        ]
        const ctx = makeContext(items)
        const result = truncateSupplementalContext(ctx)

        // Should be capped at 5 items
        assert.ok(result.supplementalContextItems.length <= crossFileContextConfig.maxContextCount)
        // Each chunk should be within per-chunk limit
        for (const item of result.supplementalContextItems) {
            assert.ok(
                item.content.length <= crossFileContextConfig.maxLengthEachChunk,
                `Chunk ${item.filePath} has length ${item.content.length} exceeding ${crossFileContextConfig.maxLengthEachChunk}`
            )
        }
    })

    it('should update contentsLength to reflect post-truncation total', function () {
        const items = [makeItem('a'.repeat(15000), 'a.ts'), makeItem('b'.repeat(15000), 'b.ts')]
        const ctx = makeContext(items)
        const result = truncateSupplementalContext(ctx)

        const actualTotal = result.supplementalContextItems.reduce((acc, i) => acc + i.content.length, 0)
        assert.strictEqual(result.contentsLength, actualTotal)
    })
})

describe('truncateLineByLine', function () {
    it('should return empty string for empty input', function () {
        assert.strictEqual(truncateLineByLine('', 100), '')
    })

    it('should return input unchanged when within limit', function () {
        const input = 'line1\nline2\nline3'
        assert.strictEqual(truncateLineByLine(input, 100), input)
    })

    it('should truncate lines from the end to fit within limit', function () {
        const input = 'line1\nline2\nline3\nline4\nline5'
        const result = truncateLineByLine(input, 15)
        // Should drop lines from the end until length <= 15
        assert.ok(result.length <= 15, `Result length ${result.length} should be <= 15`)
        assert.ok(result.startsWith('line1'), 'Should preserve lines from the beginning')
    })

    it('should handle negative maxLength by using absolute value', function () {
        const input = 'line1\nline2\nline3'
        const resultPositive = truncateLineByLine(input, 10)
        const resultNegative = truncateLineByLine(input, -10)
        assert.strictEqual(resultPositive, resultNegative)
    })

    it('should preserve trailing newline if input had one', function () {
        const input = 'line1\nline2\n'
        const result = truncateLineByLine(input, 1000)
        assert.ok(result.endsWith('\n'), 'Should preserve trailing newline')
    })

    it('should not add trailing newline if input did not have one', function () {
        const input = 'line1\nline2'
        const result = truncateLineByLine(input, 1000)
        assert.ok(!result.endsWith('\n'), 'Should not add trailing newline')
    })

    it('should handle single-line input', function () {
        const input = 'single line content'
        const result = truncateLineByLine(input, 5)
        // Single line that exceeds limit — the while loop will remove it, leaving empty
        assert.strictEqual(result, '')
    })

    it('should handle input where every line is very long', function () {
        const input = 'a'.repeat(5000) + '\n' + 'b'.repeat(5000)
        const result = truncateLineByLine(input, 6000)
        // Only the first line should fit
        assert.ok(result.length <= 6000, `Result length ${result.length} should be <= 6000`)
    })

    it('should handle maxLength of 0 by treating as absolute value (edge case)', function () {
        // maxLength 0 => abs(0) = 0, but -1 * 0 = 0 in the code path for negative
        // The while loop condition curLen > 0 will strip everything
        const input = 'some content'
        const result = truncateLineByLine(input, 0)
        assert.strictEqual(result, '')
    })
})

describe('trimSupplementalContexts', function () {
    it('should return empty array for empty input', function () {
        const result = trimSupplementalContexts([], 5)
        assert.deepStrictEqual(result, [])
    })

    it('should pass through items within all limits', function () {
        const items = [makeItem('content1', 'a.ts'), makeItem('content2', 'b.ts')]
        const result = trimSupplementalContexts(items, 5)
        assert.strictEqual(result.length, 2)
    })

    it('should truncate items exceeding per-chunk character limit (10240) instead of dropping them', function () {
        const items = [
            makeItem('ok', 'a.ts'),
            makeItem('x\n'.repeat(6000), 'toobig.ts'), // 12000 chars, exceeds 10240
            makeItem('also ok', 'b.ts'),
        ]
        const result = trimSupplementalContexts(items, 5)
        // All 3 items should be kept — the oversized one is truncated, not dropped
        assert.strictEqual(result.length, 3)
        assert.ok(
            result[1].content.length <= crossFileContextConfig.maxLengthEachChunk,
            `Truncated chunk should be <= ${crossFileContextConfig.maxLengthEachChunk}, got ${result[1].content.length}`
        )
        assert.strictEqual(result[0].content, 'ok')
        assert.strictEqual(result[2].content, 'also ok')
    })

    it('should keep items exactly at the per-chunk character limit (10240)', function () {
        const items = [makeItem('x'.repeat(10240), 'exact.ts')]
        const result = trimSupplementalContexts(items, 5)
        assert.strictEqual(result.length, 1)
        assert.strictEqual(result[0].content.length, 10240)
    })

    it('should keep items at per-chunk limit when total limit is not exceeded', function () {
        const items = [makeItem('x'.repeat(10240), 'fits.ts')]
        const result = trimSupplementalContexts(items, 5)
        assert.strictEqual(result.length, 1)
        assert.strictEqual(result[0].content.length, 10240)
    })

    it('should limit to maxContexts count', function () {
        const items = Array.from({ length: 10 }, (_, i) => makeItem(`item${i}`, `f${i}.ts`))
        const result = trimSupplementalContexts(items, 3)
        assert.strictEqual(result.length, 3)
        assert.strictEqual(result[0].content, 'item0')
        assert.strictEqual(result[2].content, 'item2')
    })

    it('should enforce total character limit (20480)', function () {
        // 3 items of 8000 chars each = 24000, exceeds 20480
        const items = [
            makeItem('a'.repeat(8000), 'a.ts'),
            makeItem('b'.repeat(8000), 'b.ts'),
            makeItem('c'.repeat(8000), 'c.ts'),
        ]
        const result = trimSupplementalContexts(items, 5)

        const totalLen = result.reduce((acc, i) => acc + i.content.length, 0)
        assert.ok(totalLen <= 20480, `Total length ${totalLen} should be <= 20480`)
        // First two items = 16000, within limit. Third would push to 24000.
        assert.strictEqual(result.length, 2)
    })

    it('should handle case where first item alone exceeds total limit after truncation', function () {
        // Single item of 10240 chars (at per-chunk limit), under total limit of 20480
        const items = [makeItem('x'.repeat(10240), 'big.ts')]
        const result = trimSupplementalContexts(items, 5)
        assert.strictEqual(result.length, 1)
        assert.strictEqual(result[0].content.length, 10240)
    })

    it('should apply all three steps in order: per-chunk truncation, count, total length', function () {
        const items = [
            makeItem('x\n'.repeat(6000), 'truncated.ts'), // 12000 chars, truncated to <= 10240
            makeItem('a'.repeat(8000), 'a.ts'),
            makeItem('b'.repeat(8000), 'b.ts'),
            makeItem('c'.repeat(8000), 'c.ts'),
        ]
        const result = trimSupplementalContexts(items, 4)

        // After per-chunk truncation: item[0] <= 10240, rest unchanged
        // After count limit (4): all 4 kept
        // After total limit (20480): truncated(~10240) + a(8000) = ~18240 ok, + b(8000) = ~26240 > 20480
        assert.strictEqual(result.length, 2)
        assert.ok(result[0].content.length <= crossFileContextConfig.maxLengthEachChunk)
        assert.strictEqual(result[1].filePath, 'a.ts')
    })

    it('should handle maxContexts of 0', function () {
        const items = [makeItem('content', 'a.ts')]
        const result = trimSupplementalContexts(items, 0)
        assert.strictEqual(result.length, 0)
    })

    it('should preserve item order (newest first assumption)', function () {
        const items = [
            makeItem('newest', 'new.ts', 0.9),
            makeItem('middle', 'mid.ts', 0.5),
            makeItem('oldest', 'old.ts', 0.1),
        ]
        const result = trimSupplementalContexts(items, 5)
        assert.strictEqual(result[0].content, 'newest')
        assert.strictEqual(result[1].content, 'middle')
        assert.strictEqual(result[2].content, 'oldest')
    })

    it('should handle total length exactly at 20480 boundary', function () {
        // Two items that sum to exactly 20480
        const items = [makeItem('a'.repeat(10240), 'a.ts'), makeItem('b'.repeat(10240), 'b.ts')]
        const result = trimSupplementalContexts(items, 5)

        // totalLength after item 0: 10240 <= 20480, continue
        // totalLength after item 1: 20480, NOT > 20480, so continue
        assert.strictEqual(result.length, 2)
    })

    it('should ensure no individual item exceeds 10240 in the output', function () {
        const items = [makeItem('a\n'.repeat(7000), 'a.ts'), makeItem('b\n'.repeat(7000), 'b.ts')]
        const result = trimSupplementalContexts(items, 5)
        for (const item of result) {
            assert.ok(
                item.content.length <= crossFileContextConfig.maxLengthEachChunk,
                `Item ${item.filePath} length ${item.content.length} exceeds ${crossFileContextConfig.maxLengthEachChunk}`
            )
        }
    })

    it('should ensure total output length never exceeds 20480', function () {
        // 5 items of 5000 chars = 25000 total
        const items = Array.from({ length: 5 }, (_, i) => makeItem('z'.repeat(5000), `f${i}.ts`))
        const result = trimSupplementalContexts(items, 5)
        const totalLen = result.reduce((acc, i) => acc + i.content.length, 0)
        assert.ok(totalLen <= 20480, `Total length ${totalLen} should be <= 20480`)
    })
})
