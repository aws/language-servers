import { QDelayTrackingInterceptor, DelayNotification } from './delayInterceptor'
import { expect } from 'chai'
import * as sinon from 'sinon'

describe('QDelayTrackingInterceptor', () => {
    let interceptor: QDelayTrackingInterceptor
    let mockLogging: any
    let mockCallback: sinon.SinonSpy

    beforeEach(() => {
        mockLogging = {
            log: sinon.spy(),
            debug: sinon.spy(),
        }
        mockCallback = sinon.spy()
        interceptor = new QDelayTrackingInterceptor(mockLogging)
    })

    describe('setDelayNotificationCallback', () => {
        it('should set callback and log debug message', () => {
            interceptor.setDelayNotificationCallback(mockCallback)

            expect(mockLogging.debug.calledWith('QDelayTrackingInterceptor: setDelayNotificationCallback called')).to.be
                .true
        })
    })

    describe('beforeAttempt', () => {
        it('should log first attempt without delay calculation', () => {
            interceptor.beforeAttempt(1)

            expect(mockLogging.debug.calledWith('QDelayTrackingInterceptor: Attempt 1')).to.be.true
            expect(
                mockLogging.debug.calledWith(
                    'QDelayTrackingInterceptor: First attempt or no lastAttemptTime, skipping delay calculation'
                )
            ).to.be.true
        })

        it('should calculate delay for subsequent attempts', () => {
            const clock = sinon.useFakeTimers()

            // First attempt
            interceptor.beforeAttempt(1)

            // Wait a bit and make second attempt
            clock.tick(3000) // 3 seconds
            interceptor.beforeAttempt(2)

            expect(mockLogging.debug.args.some((args: any) => args[0].includes('Delay'))).to.be.true

            clock.restore()
        })

        it('should send major delay notification for long delays', () => {
            interceptor.setDelayNotificationCallback(mockCallback)

            const clock = sinon.useFakeTimers(1000)

            // First attempt
            interceptor.beforeAttempt(1)

            // Simulate 6 second delay (major threshold)
            clock.tick(6000)
            interceptor.beforeAttempt(2)

            expect(mockCallback.calledOnce).to.be.true
            const call = mockCallback.getCall(0)
            expect(call.args[0].message).to.include('retrying within 10s')
            expect(call.args[0].attemptNumber).to.equal(2)
            expect(call.args[0].delay).to.equal(6)
            expect(call.args[0].thresholdExceeded).to.be.true

            clock.restore()
        })

        it('should send minor delay notification for medium delays', () => {
            interceptor.setDelayNotificationCallback(mockCallback)

            const clock = sinon.useFakeTimers(1000)

            // First attempt
            interceptor.beforeAttempt(1)

            // Simulate 3 second delay (minor threshold)
            clock.tick(3000)
            interceptor.beforeAttempt(2)

            expect(mockCallback.calledOnce).to.be.true
            const call = mockCallback.getCall(0)
            expect(call.args[0].message).to.include('retrying within 5s')
            expect(call.args[0].attemptNumber).to.equal(2)
            expect(call.args[0].delay).to.equal(3)
            expect(call.args[0].thresholdExceeded).to.be.true

            clock.restore()
        })

        it('should not notify for short delays', () => {
            interceptor.setDelayNotificationCallback(mockCallback)

            const clock = sinon.useFakeTimers(1000)

            // First attempt
            interceptor.beforeAttempt(1)

            // Simulate 1 second delay (below threshold)
            clock.tick(1000)
            interceptor.beforeAttempt(2)

            expect(mockCallback.called).to.be.false
            expect(
                mockLogging.debug.calledWith('QDelayTrackingInterceptor: Delay 1000ms below threshold, no notification')
            ).to.be.true

            clock.restore()
        })

        it('should cap delay at maximum retry delay', () => {
            interceptor.setDelayNotificationCallback(mockCallback)

            const clock = sinon.useFakeTimers(1000)

            // First attempt
            interceptor.beforeAttempt(1)

            // Simulate very long delay (15 seconds)
            clock.tick(15000)
            interceptor.beforeAttempt(2)

            expect(mockCallback.calledOnce).to.be.true
            const call = mockCallback.getCall(0)
            expect(call.args[0].message).to.include('retrying within 10s')
            expect(call.args[0].attemptNumber).to.equal(2)
            expect(call.args[0].delay).to.equal(10) // Capped at 10 seconds
            expect(call.args[0].thresholdExceeded).to.be.true

            clock.restore()
        })

        it('should log when no callback is set', () => {
            const clock = sinon.useFakeTimers(1000)

            // First attempt
            interceptor.beforeAttempt(1)

            // Simulate delay above threshold
            clock.tick(3000)
            interceptor.beforeAttempt(2)

            expect(mockLogging.debug.calledWith('QDelayTrackingInterceptor: No delay notification callback set')).to.be
                .true

            clock.restore()
        })
    })

    describe('reset', () => {
        it('should reset lastAttemptTime', () => {
            // Make an attempt to set lastAttemptTime
            interceptor.beforeAttempt(1)

            // Reset
            interceptor.reset()

            // Next attempt should be treated as first
            interceptor.beforeAttempt(1)

            expect(
                mockLogging.debug.calledWith(
                    'QDelayTrackingInterceptor: First attempt or no lastAttemptTime, skipping delay calculation'
                )
            ).to.be.true
        })
    })

    describe('name', () => {
        it('should return correct name', () => {
            expect(interceptor.name()).to.equal('Q Language Server Delay Tracking Interceptor')
        })
    })
})
