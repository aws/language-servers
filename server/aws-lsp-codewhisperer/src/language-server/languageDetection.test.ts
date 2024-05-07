import * as assert from 'assert'
import { TextDocument } from 'vscode-languageserver-textdocument'
import {
    getLanguageId,
    getSupportedLanguageId,
    languageByExtension,
    qLanguageIdByDocumentLanguageId,
} from './languageDetection'

describe('LanguageDetection', () => {
    describe('getLanguageId', () => {
        it('matches all document language ids that are defined in qLanguageIdByDocumentId', () => {
            for (const [documentLanguageId, qLanguageId] of Object.entries(qLanguageIdByDocumentLanguageId)) {
                assert.strictEqual(
                    getLanguageId(TextDocument.create(`test://test.xxx`, documentLanguageId, 1, '')),
                    qLanguageId
                )
            }
        })

        it('able to match language ids regardless of casing', () => {
            assert.strictEqual(getLanguageId(TextDocument.create(`test://test.xxx`, 'CSHarp', 1, '')), 'csharp')
            assert.strictEqual(getLanguageId(TextDocument.create(`test://test.xxx`, 'TyPeScRipT', 1, '')), 'typescript')
        })

        it(`fallbacks to extension check if document's languageId does not exist`, () => {
            for (const [extension, languageId] of Object.entries(languageByExtension)) {
                assert.strictEqual(
                    getLanguageId(TextDocument.create(`test://test.${extension}`, undefined as any, 1, '')),
                    languageId
                )
            }
        })
    })

    describe('getSupportedLanguageId', () => {
        const typescriptDocument = TextDocument.create('test://test.ts', 'typescript', 1, '')
        it('should return language id if it is in the list of supported languages', () => {
            assert.ok(getSupportedLanguageId(typescriptDocument, ['typescript', 'javascript']))
            assert.ok(!getSupportedLanguageId(typescriptDocument, ['javascript']))
        })
    })
})
