import * as assert from 'assert'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { getExtendedCodeBlockRange } from './utils'

describe('getExtendedCodeBlockRange', () => {
    const mockDocument = TextDocument.create(
        'file://test.ts',
        'typescript',
        1,
        `const fs = require('node:fs/promises');
    async function example(file: string) {
      try {
        const data = await fs.readFile(file, { encoding: 'utf8' });
        console.log(data);
      } catch (err) {
        console.error(err);
      }
    }
    example('/Users/user1/test.txt');`
    )

    it('able to extend a code block range up to the character limit', () => {
        const result = getExtendedCodeBlockRange(
            mockDocument,
            {
                // highlightling "console"
                start: { line: 4, character: 8 },
                end: { line: 4, character: 14 },
            },
            10
        )

        assert.deepStrictEqual(result, {
            start: { line: 4, character: 6 },
            end: { line: 4, character: 16 },
        })
    })

    it('able to extend a code block range correctly if character limit is an odd number', () => {
        const result = getExtendedCodeBlockRange(
            mockDocument,
            {
                // highlightling "console"
                start: { line: 4, character: 8 },
                end: { line: 4, character: 14 },
            },
            9
        )

        assert.deepStrictEqual(result, {
            start: { line: 4, character: 6 },
            end: { line: 4, character: 15 },
        })
    })

    it('does not extend beyond the lower document bound', () => {
        const result = getExtendedCodeBlockRange(
            mockDocument,
            {
                // highlighting "fs" in document
                start: { line: 0, character: 6 },
                end: { line: 0, character: 8 },
            },
            20
        )

        assert.deepStrictEqual(result, {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 20 },
        })
    })

    it('does not extend beyond the upper document bound', () => {
        const result = getExtendedCodeBlockRange(
            mockDocument,
            {
                // highlighting "test" on the last line in document
                start: { line: 9, character: 26 },
                end: { line: 9, character: 30 },
            },
            20
        )

        assert.deepStrictEqual(result, {
            start: { line: 9, character: 17 },
            end: { line: 9, character: 37 },
        })
    })

    it('trims text if already exceeds character limit', () => {
        const result = getExtendedCodeBlockRange(
            mockDocument,
            {
                start: { line: 3, character: 8 },
                end: { line: 3, character: 60 },
            },
            40
        )

        assert.deepStrictEqual(result, {
            start: { line: 3, character: 8 },
            end: { line: 3, character: 48 },
        })
    })
})
