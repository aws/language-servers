import { Range } from '@aws/language-server-runtimes/server-interface'
import { FqnWorkerPool } from '@aws/lsp-fqn'
import * as assert from 'assert'
import sinon from 'ts-sinon'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { DocumentFqnExtractor } from './documentFqnExtractor'
import { expectedExtractedNames, mockExtractedSymbols } from './mockData'

describe('DocumentFQNExtractor', () => {
    let extractorStub: sinon.SinonStub

    const typescriptDocument = TextDocument.create('file:///test.ts', 'typescript', 1, 'test')
    const mockRange: Range = { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } }
    let documentFqnExtractor: DocumentFqnExtractor

    beforeEach(() => {
        extractorStub = sinon.stub(FqnWorkerPool.prototype, 'exec')
        documentFqnExtractor = new DocumentFqnExtractor()
    })

    afterEach(() => {
        extractorStub.restore()
    })

    it('returns symbols in the right shape', async () => {
        const documentFqnExtractor = new DocumentFqnExtractor()

        extractorStub.returns([Promise.resolve({ success: true, data: mockExtractedSymbols }), () => {}])
        const [documentSymbolsPromise] = documentFqnExtractor.extractDocumentSymbols(typescriptDocument, mockRange)

        assert.deepStrictEqual(await documentSymbolsPromise, expectedExtractedNames)
        sinon.assert.calledOnceWithExactly(extractorStub, {
            fileText: typescriptDocument.getText(),
            selection: mockRange,
            languageId: typescriptDocument.languageId,
        })
    })

    it('returns empty array if language id is not supported', async () => {
        const documentFqnExtractor = new DocumentFqnExtractor()

        extractorStub.returns([Promise.resolve({ success: true, data: mockExtractedSymbols }), () => {}])
        const [documentSymbolsPromise] = documentFqnExtractor.extractDocumentSymbols(
            typescriptDocument,
            mockRange,
            'lolcode'
        )

        assert.deepStrictEqual(await documentSymbolsPromise, [])
    })

    it('resolves to empty array if not successful', async () => {
        extractorStub.returns([Promise.resolve({ success: false, data: mockExtractedSymbols }), () => {}])

        let [documentSymbolsPromise] = documentFqnExtractor.extractDocumentSymbols(typescriptDocument, mockRange)

        assert.deepStrictEqual(await documentSymbolsPromise, [])

        extractorStub.returns([Promise.resolve({ success: false, data: undefined }), () => {}])(
            ([documentSymbolsPromise] = documentFqnExtractor.extractDocumentSymbols(typescriptDocument, mockRange))
        )

        assert.deepStrictEqual(await documentSymbolsPromise, [])
    })

    it('uses language id if passed', async () => {
        const documentFqnExtractor = new DocumentFqnExtractor()

        extractorStub.returns([Promise.resolve({ success: true, data: mockExtractedSymbols }), () => {}])
        const [documentSymbolsPromise] = documentFqnExtractor.extractDocumentSymbols(
            typescriptDocument,
            mockRange,
            'python'
        )

        assert.deepStrictEqual(await documentSymbolsPromise, expectedExtractedNames)
        sinon.assert.calledOnceWithExactly(extractorStub, {
            fileText: typescriptDocument.getText(),
            selection: mockRange,
            languageId: 'python',
        })
    })

    it('dedups symbols', async () => {
        const documentFqnExtractor = new DocumentFqnExtractor()

        extractorStub.returns([
            Promise.resolve({
                success: true,
                data: {
                    fullyQualified: {
                        ...mockExtractedSymbols.fullyQualified,
                        usedSymbols: [
                            ...mockExtractedSymbols.fullyQualified.usedSymbols.slice(0, 4),
                            ...mockExtractedSymbols.fullyQualified.usedSymbols.slice(3, 6),
                            ...mockExtractedSymbols.fullyQualified.usedSymbols.slice(5),
                        ],
                    },
                },
            }),
            () => {},
        ])

        const [documentSymbolsPromise] = documentFqnExtractor.extractDocumentSymbols(typescriptDocument, mockRange)

        assert.deepStrictEqual(await documentSymbolsPromise, expectedExtractedNames)
    })

    it('returns no more than the limit of symbols specify', async () => {
        const documentFqnExtractor = new DocumentFqnExtractor({ maxSymbols: 3 })

        extractorStub.returns([
            Promise.resolve({
                success: true,
                data: mockExtractedSymbols,
            }),
            () => {},
        ])
        const [documentSymbolsPromise] = documentFqnExtractor.extractDocumentSymbols(typescriptDocument, mockRange)

        assert.deepStrictEqual(await documentSymbolsPromise, expectedExtractedNames.slice(0, 3))
    })

    it('filters out symbols if either name or source does not conform to the length limit', async () => {
        const documentFqnExtractor = new DocumentFqnExtractor({ nameMinLength: 5, nameMaxLength: 8 })

        extractorStub.returns([
            Promise.resolve({
                success: true,
                data: mockExtractedSymbols,
            }),
            () => {},
        ])
        const [documentSymbolsPromise] = documentFqnExtractor.extractDocumentSymbols(typescriptDocument, mockRange)

        assert.deepStrictEqual(await documentSymbolsPromise, [{ name: 'mkdir', type: 'USAGE', source: 'node:fs' }])
    })
})
