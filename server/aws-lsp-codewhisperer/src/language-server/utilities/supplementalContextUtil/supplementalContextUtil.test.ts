import * as assert from 'assert'
import * as sinon from 'sinon'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { CancellationToken, Logging, Position, Workspace } from '@aws/language-server-runtimes/server-interface'
import { fetchSupplementalContext, CancellationError } from './supplementalContextUtil'
import * as crossFileContextUtil from './crossFileContextUtil'
import * as codeParsingUtil from './codeParsingUtil'
import { CodeWhispererSupplementalContext } from '../../models/model'

describe('fetchSupplementalContext', function () {
    let workspace: Workspace
    let logging: Logging
    let cancellationToken: CancellationToken
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
        } as Logging
        cancellationToken = {
            isCancellationRequested: false,
            onCancellationRequested: sinon.stub(),
        }
        crossFileContextStub = sinon.stub(crossFileContextUtil, 'fetchSupplementalContextForSrc')
        isTestFileStub = sinon.stub(codeParsingUtil, 'isTestFile')

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

        const result = await fetchSupplementalContext(document, position, workspace, logging, cancellationToken)

        assert.deepStrictEqual(result, expectedContext)
    })

    it('should return undefined for test files', async function () {
        isTestFileStub.returns(true)

        const result = await fetchSupplementalContext(document, position, workspace, logging, cancellationToken)

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

        const result = await fetchSupplementalContext(document, position, workspace, logging, cancellationToken)

        assert.deepStrictEqual(result, expectedContext)
    })

    it('should handle errors and return undefined', async function () {
        isTestFileStub.returns(false)
        crossFileContextStub.throws(new Error('Some error'))

        const result = await fetchSupplementalContext(document, position, workspace, logging, cancellationToken)

        assert.strictEqual(result, undefined)
        sinon.assert.calledWithMatch(
            logging.log,
            'Fail to fetch supplemental context for target file file:///somefile.js'
        )
    })
})
