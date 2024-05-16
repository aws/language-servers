import { Extent, Java, TypeScript } from '@aws/fully-qualified-names'
import * as assert from 'assert'
import sinon from 'ts-sinon'
import { extract } from './fqnExtractor'

describe('fqnExtractor.extract', () => {
    let typescriptStub: sinon.SinonStub
    let javaStub: sinon.SinonStub
    const tsResult = {}
    const javaResult = {}
    const mockRange = {
        start: {
            line: 0,
            character: 0,
        },
        end: {
            line: 1,
            character: 1,
        },
    }
    const mockFileText = `console.log('abc')`

    beforeEach(() => {
        typescriptStub = sinon.stub(TypeScript, 'findNamesWithInExtent').callsFake(() => Promise.resolve(tsResult))
        javaStub = sinon.stub(Java, 'findNamesWithInExtent').callsFake(() => Promise.resolve(javaResult))
    })

    afterEach(() => {
        typescriptStub.restore()
        javaStub.restore()
    })

    it('throws error with unsupported languageId', async () => {
        await assert.rejects(() =>
            extract({
                languageId: 'lolcode' as any,
                fileText: mockFileText,
                selection: mockRange,
            })
        )
    })

    it('calls the corresponding fqn function', async () => {
        let result = await extract({
            languageId: 'typescript',
            fileText: mockFileText,
            selection: mockRange,
        })

        sinon.assert.calledOnceWithMatch(typescriptStub, mockFileText, sinon.match.instanceOf(Extent))

        // reference check
        assert.strictEqual(result, tsResult)

        result = await extract({
            languageId: 'java',
            fileText: mockFileText,
            selection: mockRange,
        })

        sinon.assert.calledOnceWithMatch(javaStub, mockFileText, sinon.match.instanceOf(Extent))

        // reference check
        assert.strictEqual(result, javaResult)
    })
})
