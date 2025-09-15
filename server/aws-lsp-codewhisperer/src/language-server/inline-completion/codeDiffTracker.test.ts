import { TestFeatures } from '@aws/language-server-runtimes/testing'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { CodeDiffTracker } from './codeDiffTracker'
import sinon = require('sinon')
import assert = require('assert')

describe('codeDiffTracker', () => {
    let codeDiffTracker: CodeDiffTracker
    let mockRecordMetric: sinon.SinonStub
    let testFeatures: TestFeatures
    const flushInterval = 1000
    const timeElapsedThreshold = 5000
    const maxQueueSize = 3

    beforeEach(() => {
        sinon.useFakeTimers({
            now: 0,
            shouldAdvanceTime: false,
        })
        testFeatures = new TestFeatures()
        mockRecordMetric = sinon.stub().rejects(true)
        codeDiffTracker = new CodeDiffTracker(testFeatures.workspace, testFeatures.logging, mockRecordMetric, {
            flushInterval,
            timeElapsedThreshold,
            maxQueueSize,
        })
        testFeatures.openDocument(TextDocument.create('test.cs', 'typescript', 1, 'test'))
    })

    afterEach(() => {
        testFeatures.dispose()
        sinon.clock.restore()
        sinon.restore()
    })

    it('shutdown should flush the queue', async () => {
        const mockEntry = {
            startPosition: {
                line: 0,
                character: 0,
            },
            endPosition: {
                line: 20,
                character: 0,
            },
            fileUrl: 'test.cs',
            // fake timer starts at 0
            time: -timeElapsedThreshold,
            originalString: "console.log('test console')",
        }

        // use negative time so we don't have to move the timer which would cause the interval to run
        codeDiffTracker.enqueue(mockEntry)

        codeDiffTracker.enqueue({
            startPosition: {
                line: 0,
                character: 0,
            },
            endPosition: {
                line: 20,
                character: 0,
            },
            fileUrl: 'test.cs',
            // fake timer starts at 0
            time: -timeElapsedThreshold + 100,
            originalString: "console.log('test console')",
        })

        await codeDiffTracker.shutdown()
        sinon.assert.calledOnce(mockRecordMetric)
        sinon.assert.calledWith(mockRecordMetric, mockEntry, sinon.match.number)
    })

    it('queue should be flushed after time elapsed threshold is reached', async () => {
        const mockEntry = {
            startPosition: {
                line: 0,
                character: 0,
            },
            endPosition: {
                line: 20,
                character: 0,
            },
            fileUrl: 'test.cs',
            time: 0,
            originalString: "console.log('test console')",
        }
        codeDiffTracker.enqueue(mockEntry)

        const mockEntry2 = {
            startPosition: {
                line: 1,
                character: 1,
            },
            endPosition: {
                line: 20,
                character: 0,
            },
            fileUrl: 'test.cs',
            time: 1000,
            originalString: "console.log('test console 2')",
        }
        codeDiffTracker.enqueue(mockEntry2)

        await sinon.clock.tickAsync(timeElapsedThreshold)

        sinon.assert.calledOnce(mockRecordMetric)
        sinon.assert.calledWith(mockRecordMetric, mockEntry, sinon.match.number)

        mockRecordMetric.resetHistory()
        await sinon.clock.tickAsync(flushInterval)

        sinon.assert.calledOnce(mockRecordMetric)
        sinon.assert.calledWith(mockRecordMetric, mockEntry2, sinon.match.number)
    })

    it('queue does not exceed the size', async () => {
        const mockEntry = {
            startPosition: {
                line: 0,
                character: 0,
            },
            endPosition: {
                line: 20,
                character: 0,
            },
            fileUrl: 'test.cs',
            time: 0,
            originalString: "console.log('test console')",
        }

        for (let i = 0; i < maxQueueSize + 5; i++) {
            codeDiffTracker.enqueue(mockEntry)
        }

        await sinon.clock.tickAsync(timeElapsedThreshold)

        assert.strictEqual(mockRecordMetric.callCount, maxQueueSize)
    })

    it('shutdown should catch exceptions in report handler', async () => {
        const mockRecordMetric = sinon.stub().rejects('Record metric rejection')
        const codeDiffTracker = new CodeDiffTracker(testFeatures.workspace, testFeatures.logging, mockRecordMetric, {
            flushInterval,
            timeElapsedThreshold,
            maxQueueSize,
        })

        const mockEntry = {
            startPosition: {
                line: 0,
                character: 0,
            },
            endPosition: {
                line: 20,
                character: 0,
            },
            fileUrl: 'test.cs',
            // fake timer starts at 0
            time: -timeElapsedThreshold,
            originalString: "console.log('test console')",
        }

        // use negative time so we don't have to move the timer which would cause the interval to run
        codeDiffTracker.enqueue(mockEntry)

        codeDiffTracker.enqueue({
            startPosition: {
                line: 0,
                character: 0,
            },
            endPosition: {
                line: 20,
                character: 0,
            },
            fileUrl: 'test.cs',
            // fake timer starts at 0
            time: -timeElapsedThreshold + 100,
            originalString: "console.log('test console')",
        })

        await codeDiffTracker.shutdown()
        sinon.assert.calledOnce(mockRecordMetric)
        sinon.assert.calledWith(mockRecordMetric, mockEntry, sinon.match.number)

        assert(
            testFeatures.logging.log.calledWithMatch('Exception Thrown from CodeDiffTracker: Record metric rejection')
        )
    })
})
