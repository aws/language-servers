import assert = require('assert')
import { TextDocument } from 'vscode-languageserver-textdocument'
import {
    additionalLanguageMapping,
    getLanguageId,
    getSupportedLanguageId,
    languageByExtension,
} from './languageDetection'

describe('LanguageDetection', () => {
    describe('getLanguageId', () => {
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

        it('matches inexact document language id to q language mapping', () => {
            for (const [documentLanguageId, qLanguageId] of Object.entries(additionalLanguageMapping)) {
                assert.strictEqual(
                    getLanguageId(TextDocument.create(`test://test.xxx`, documentLanguageId, 1, '')),
                    qLanguageId
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
