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

        extractorStub.returns(Promise.resolve({ success: true, data: mockExtractedSymbols }))
        const documentSymbols = await documentFqnExtractor.extractDocumentSymbols(typescriptDocument, mockRange)

        assert.deepStrictEqual(documentSymbols, expectedExtractedNames)
        sinon.assert.calledOnceWithExactly(extractorStub, {
            fileText: typescriptDocument.getText(),
            selection: mockRange,
            languageId: typescriptDocument.languageId,
        })
    })

    it('returns empty array if language id is not supported', async () => {
        const documentFqnExtractor = new DocumentFqnExtractor()

        extractorStub.returns(Promise.resolve({ success: true, data: mockExtractedSymbols }))
        const documentSymbols = await documentFqnExtractor.extractDocumentSymbols(
            typescriptDocument,
            mockRange,
            'lolcode'
        )

        assert.deepStrictEqual(documentSymbols, [])
    })

    it('resolves to empty array if not successful', async () => {
        extractorStub.resolves({ success: false, data: mockExtractedSymbols })

        let documentSymbols = await documentFqnExtractor.extractDocumentSymbols(typescriptDocument, mockRange)

        assert.deepStrictEqual(documentSymbols, [])

        extractorStub.resolves({ success: false, data: undefined })

        documentSymbols = await documentFqnExtractor.extractDocumentSymbols(typescriptDocument, mockRange)

        assert.deepStrictEqual(documentSymbols, [])
    })

    it('uses language id if passed', async () => {
        const documentFqnExtractor = new DocumentFqnExtractor()

        extractorStub.resolves({ success: true, data: mockExtractedSymbols })
        const documentSymbols = await documentFqnExtractor.extractDocumentSymbols(
            typescriptDocument,
            mockRange,
            'python'
        )

        assert.deepStrictEqual(documentSymbols, expectedExtractedNames)
        sinon.assert.calledOnceWithExactly(extractorStub, {
            fileText: typescriptDocument.getText(),
            selection: mockRange,
            languageId: 'python',
        })
    })

    it('dedups symbols', async () => {
        const documentFqnExtractor = new DocumentFqnExtractor()

        extractorStub.resolves({
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
        })

        const documentSymbols = await documentFqnExtractor.extractDocumentSymbols(typescriptDocument, mockRange)

        assert.deepStrictEqual(documentSymbols, expectedExtractedNames)
    })

    it('returns no more than the limit of symbols specify', async () => {
        const documentFqnExtractor = new DocumentFqnExtractor({ maxSymbols: 3 })

        extractorStub.resolves({
            success: true,
            data: mockExtractedSymbols,
        })
        const documentSymbols = await documentFqnExtractor.extractDocumentSymbols(typescriptDocument, mockRange)

        assert.deepStrictEqual(documentSymbols, expectedExtractedNames.slice(0, 3))
    })

    it('filters out symbols if either name or source does not conform to the length limit', async () => {
        const documentFqnExtractor = new DocumentFqnExtractor({ nameMinLength: 5, nameMaxLength: 8 })

        extractorStub.resolves({
            success: true,
            data: mockExtractedSymbols,
        })
        const documentSymbols = await documentFqnExtractor.extractDocumentSymbols(typescriptDocument, mockRange)

        assert.deepStrictEqual(documentSymbols, [{ name: 'mkdir', type: 'USAGE', source: 'node:fs' }])
    })
})
