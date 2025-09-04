import { DelayTracker, DelayNotification } from './delayTracker'
import { Logging } from '@aws/language-server-runtimes/server-interface'
import { expect } from 'chai'
import * as sinon from 'sinon'

describe('DelayTracker', () => {
    let tracker: DelayTracker
    let mockLogging: any
    let mockOnNotification: sinon.SinonStub

    beforeEach(() => {
        mockLogging = {
            info: sinon.stub(),
            debug: sinon.stub(),
            warn: sinon.stub(),
            error: sinon.stub(),
        }

        mockOnNotification = sinon.stub()
        tracker = new DelayTracker(mockLogging, mockOnNotification)
    })

    describe('trackInitialDelay', () => {
        it('should track delay above minor threshold', () => {
            tracker.trackInitialDelay(3000)

            sinon.assert.calledWith(
                mockLogging.info,
                sinon.match(/Initial request delayed: ⏳ Request delayed by 3.0s/)
            )
            sinon.assert.calledWith(
                mockOnNotification,
                sinon.match({
                    type: 'initial_delay',
                    delayMs: 3000,
                    attemptNumber: 1,
                    message: sinon.match(/⏳ Request delayed by 3.0s/),
                    thresholdExceeded: true,
                })
            )
        })

        it('should not track delay below minor threshold', () => {
            tracker.trackInitialDelay(1000)

            sinon.assert.notCalled(mockLogging.info)
            sinon.assert.notCalled(mockOnNotification)
        })

        it('should generate appropriate context messages', () => {
            tracker.trackInitialDelay(15000)

            sinon.assert.calledWith(
                mockOnNotification,
                sinon.match({
                    message: sinon.match(/Service is under heavy load/),
                })
            )
        })
    })

    describe('trackRetryDelay', () => {
        it('should track delay above major threshold', () => {
            tracker.trackRetryDelay(6000, 2)

            sinon.assert.calledWith(mockLogging.info, sinon.match(/Retry attempt delayed: ⚠️ Retry #2 delayed by 6.0s/))
            sinon.assert.calledWith(mockOnNotification, {
                type: 'retry_delay',
                delayMs: 6000,
                attemptNumber: 2,
                message: sinon.match(/⚠️ Retry #2 delayed by 6.0s/),
                thresholdExceeded: true,
            })
        })

        it('should track delay when doubled from previous', () => {
            tracker.trackRetryDelay(4000, 2, 1000)

            sinon.assert.calledWith(mockOnNotification, {
                type: 'retry_delay',
                delayMs: 4000,
                attemptNumber: 2,
                message: sinon.match(/increased from 1.0s/),
                thresholdExceeded: true,
            })
        })

        it('should not track delay below thresholds', () => {
            tracker.trackRetryDelay(3000, 2, 2000)

            sinon.assert.notCalled(mockLogging.info)
            sinon.assert.notCalled(mockOnNotification)
        })
    })

    describe('summarizeDelayImpact', () => {
        it('should summarize delays above major threshold', () => {
            tracker.summarizeDelayImpact(8000, 3, 2000)

            sinon.assert.calledWith(
                mockLogging.info,
                sinon.match(
                    /Delay summary: 📊 Request completed with delays: total delay: 8.0s, 3 attempts, final retry delay: 2.0s/
                )
            )
            sinon.assert.calledWith(mockOnNotification, {
                type: 'summary',
                delayMs: 8000,
                attemptNumber: 3,
                message: sinon.match(/📊 Request completed with delays/),
                thresholdExceeded: true,
            })
        })

        it('should summarize without final retry delay', () => {
            tracker.summarizeDelayImpact(6000, 2)

            sinon.assert.calledWith(
                mockOnNotification,
                sinon.match({
                    message: sinon.match(str => !str.includes('final retry delay')),
                })
            )
        })

        it('should not summarize delays below major threshold', () => {
            tracker.summarizeDelayImpact(3000, 2)

            sinon.assert.notCalled(mockLogging.info)
            sinon.assert.notCalled(mockOnNotification)
        })
    })

    describe('without callbacks', () => {
        it('should work without logging or notification callbacks', () => {
            const simpleTracker = new DelayTracker()

            expect(() => {
                simpleTracker.trackInitialDelay(3000)
                simpleTracker.trackRetryDelay(6000, 2)
                simpleTracker.summarizeDelayImpact(8000, 3)
            }).not.to.throw()
        })
    })
})
