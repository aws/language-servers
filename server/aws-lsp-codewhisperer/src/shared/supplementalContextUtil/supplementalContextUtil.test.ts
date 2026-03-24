import * as assert from 'assert'
import * as sinon from 'sinon'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { CancellationToken, Logging, Position, Workspace } from '@aws/language-server-runtimes/server-interface'
import { fetchSupplementalContext, CancellationError } from './supplementalContextUtil'
import * as crossFileContextUtil from './crossFileContextUtil'
import * as unitTestIntentDetection from './unitTestIntentDetection'
import { CodeWhispererSupplementalContext } from '../models/model'

describe('fetchSupplementalContext', function () {
    let workspace: Workspace
    let logging: Logging
    let cancellationToken: CancellationToken
    let document: TextDocument
    let position: Position
    let crossFileContextStub: sinon.SinonStub
    let detectUnitTestIntentStub: sinon.SinonStub
    let dateNowStub: sinon.SinonStub

    beforeEach(() => {
        document = TextDocument.create('file:///somefile.js', 'javascript', 1, 'console.log("Hello, World!");')
        position = Position.create(0, 0)
        workspace = {} as Workspace
        logging = {
            log: sinon.stub(),
            info: sinon.stub(),
        } as unknown as Logging
        cancellationToken = {
            isCancellationRequested: false,
            onCancellationRequested: sinon.stub(),
        }
        crossFileContextStub = sinon.stub(crossFileContextUtil, 'fetchSupplementalContextForSrc')
        detectUnitTestIntentStub = sinon.stub(
            unitTestIntentDetection.TestIntentDetector.prototype,
            'detectUnitTestIntent'
        )
        dateNowStub = sinon.stub(Date, 'now')
    })

    afterEach(() => {
        sinon.restore()
    })

    it('should return supplemental context for non-test files', async function () {
        dateNowStub.onFirstCall().returns(0)
        dateNowStub.onSecondCall().returns(100)
        detectUnitTestIntentStub.returns(false)
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
            'codemap'
        )

        assert.deepStrictEqual(result, expectedContext)
    })

    it('should return undefined for test files when focal file is not found', async function () {
        detectUnitTestIntentStub.returns(true)

        const result = await fetchSupplementalContext(
            document,
            position,
            workspace,
            logging,
            cancellationToken,
            'codemap'
        )

        assert.strictEqual(result, undefined)
    })

    it('should return empty context when CancellationError is received', async function () {
        detectUnitTestIntentStub.returns(false)
        crossFileContextStub.throws(new CancellationError())
        dateNowStub.onFirstCall().returns(0)
        dateNowStub.onSecondCall().returns(100)
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
            'codemap'
        )

        assert.deepStrictEqual(result, expectedContext)
    })

    it('should handle errors and return undefined', async function () {
        detectUnitTestIntentStub.returns(false)
        crossFileContextStub.throws(new Error('Some error'))

        const result = await fetchSupplementalContext(
            document,
            position,
            workspace,
            logging,
            cancellationToken,
            'codemap'
        )

        assert.strictEqual(result, undefined)
        sinon.assert.calledWithMatch(
            // @ts-ignore
            logging.log,
            'Fail to fetch supplemental context for target file file:///somefile.js'
        )
    })

    it('should return empty context when supplemental context is not supported', async function () {
        dateNowStub.onFirstCall().returns(0)
        dateNowStub.onSecondCall().returns(100)
        detectUnitTestIntentStub.returns(false)

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
            'codemap'
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
