import * as fqn from '@aws/fully-qualified-names'
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
        typescriptStub = sinon.stub(fqn.TypeScript, 'findNamesWithInExtent').callsFake(() => Promise.resolve(tsResult))
        javaStub = sinon.stub(fqn.Java, 'findNamesWithInExtent').callsFake(() => Promise.resolve(javaResult))
    })

    afterEach(() => {
        typescriptStub.restore()
        javaStub.restore()
    })

    it('throws error with unsupported languageId', async () => {
        await assert.rejects(() =>
            extract(fqn, {
                languageId: 'lolcode' as any,
                fileText: mockFileText,
                selection: mockRange,
            })
        )
    })

    it('calls the corresponding fqn function', async () => {
        let result = await extract(fqn, {
            languageId: 'typescript',
            fileText: mockFileText,
            selection: mockRange,
        })

        sinon.assert.calledOnceWithMatch(typescriptStub, mockFileText, sinon.match.instanceOf(fqn.Extent))

        // reference check
        assert.strictEqual(result, tsResult)

        result = await extract(fqn, {
            languageId: 'java',
            fileText: mockFileText,
            selection: mockRange,
        })

        sinon.assert.calledOnceWithMatch(javaStub, mockFileText, sinon.match.instanceOf(fqn.Extent))

        // reference check
        assert.strictEqual(result, javaResult)
    })
})
