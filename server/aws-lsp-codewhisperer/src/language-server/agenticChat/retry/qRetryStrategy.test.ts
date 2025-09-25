import { QRetryStrategy } from './qRetryStrategy'
import { QRetryClassifier, RetryAction } from './retryClassifier'
import { QDelayTrackingInterceptor } from './delayInterceptor'
import { RetryToken, RetryErrorInfo } from '@aws-sdk/types'
import { expect } from 'chai'
import * as sinon from 'sinon'

describe('QRetryStrategy', () => {
    let retryStrategy: QRetryStrategy
    let mockClassifier: sinon.SinonStubbedInstance<QRetryClassifier>
    let mockDelayInterceptor: sinon.SinonStubbedInstance<QDelayTrackingInterceptor>
    let mockLogging: any

    beforeEach(() => {
        mockLogging = {
            log: sinon.spy(),
            debug: sinon.spy(),
        }

        mockClassifier = {
            classifyRetry: sinon.stub(),
        } as any

        mockDelayInterceptor = {
            beforeAttempt: sinon.stub(),
            reset: sinon.stub(),
        } as any

        retryStrategy = new QRetryStrategy(mockClassifier, mockDelayInterceptor, 3, mockLogging)
    })

    describe('acquireInitialRetryToken', () => {
        it('should return initial token with zero counts', async () => {
            const token = await retryStrategy.acquireInitialRetryToken('test-scope')

            expect(token.getRetryCount()).to.equal(0)
            expect((retryStrategy as any).attemptCount).to.equal(0)
            expect(
                mockLogging.log.args.some((args: any) =>
                    args[0].includes('Initial retry token acquired for scope: test-scope')
                )
            ).to.be.true
        })
    })

    describe('refreshRetryTokenForRetry', () => {
        let initialToken: RetryToken

        beforeEach(async () => {
            initialToken = await retryStrategy.acquireInitialRetryToken('test-scope')
        })

        it('should allow retry for throttling errors', async () => {
            const error = new Error('Throttling')
            ;(error as any).code = 'ThrottlingException'
            ;(error as any).$metadata = {}
            const errorInfo: RetryErrorInfo = { error: error as any, errorType: 'THROTTLING' }

            mockClassifier.classifyRetry.returns(RetryAction.ThrottlingError)

            const newToken = await retryStrategy.refreshRetryTokenForRetry(initialToken, errorInfo)

            expect(newToken.getRetryCount()).to.equal(1)
            expect(mockDelayInterceptor.beforeAttempt.calledWith(2)).to.be.true
        })

        it('should reject retry for forbidden errors', async () => {
            const error = new Error('Abort')
            ;(error as any).$metadata = {}
            const errorInfo: RetryErrorInfo = { error: error as any, errorType: 'CLIENT_ERROR' }
            mockClassifier.classifyRetry.returns(RetryAction.RetryForbidden)

            try {
                await retryStrategy.refreshRetryTokenForRetry(initialToken, errorInfo)
                expect.fail('Should have thrown error')
            } catch (e: any) {
                expect(e.message).to.equal('Abort') // Original error is thrown
            }
        })

        it('should delegate to adaptive strategy for max attempts', async () => {
            mockClassifier.classifyRetry.returns(RetryAction.ThrottlingError)
            const error = new Error('Test error')
            ;(error as any).$metadata = {}
            const errorInfo: RetryErrorInfo = { error: error as any, errorType: 'THROTTLING' }

            // The adaptive strategy will handle max attempts internally
            // We just verify our classifier is called
            try {
                await retryStrategy.refreshRetryTokenForRetry(initialToken, errorInfo)
            } catch (e) {
                // May throw due to adaptive strategy limits
            }

            expect(mockClassifier.classifyRetry.called).to.be.true
        })

        it('should delegate delay calculation to adaptive strategy', async () => {
            mockClassifier.classifyRetry.returns(RetryAction.ThrottlingError)
            const error = new Error()
            ;(error as any).$metadata = {}
            const errorInfo: RetryErrorInfo = { error: error as any, errorType: 'THROTTLING' }

            const token = await retryStrategy.refreshRetryTokenForRetry(initialToken, errorInfo)

            // Adaptive strategy handles delay calculation
            expect(token.getRetryCount()).to.equal(1)
            expect(mockDelayInterceptor.beforeAttempt.calledWith(2)).to.be.true
        })

        it('should track delay interceptor calls', async () => {
            mockClassifier.classifyRetry.returns(RetryAction.ThrottlingError)
            const error = new Error()
            ;(error as any).$metadata = {}
            const errorInfo: RetryErrorInfo = { error: error as any, errorType: 'THROTTLING' }

            await retryStrategy.refreshRetryTokenForRetry(initialToken, errorInfo)

            expect(mockDelayInterceptor.beforeAttempt.calledWith(2)).to.be.true
        })
    })

    describe('recordSuccess', () => {
        it('should reset state and call delay interceptor', async () => {
            const token = await retryStrategy.acquireInitialRetryToken('test-scope')

            retryStrategy.recordSuccess(token)

            expect(mockDelayInterceptor.reset.called).to.be.true
            expect((retryStrategy as any).attemptCount).to.equal(0)
            expect(
                mockLogging.log.args.some((args: any) => args[0].includes('Request succeeded after 1 total attempts'))
            ).to.be.true
        })

        it('should handle reset errors gracefully', async () => {
            mockDelayInterceptor.reset.throws(new Error('Reset failed'))

            const token = await retryStrategy.acquireInitialRetryToken('test-scope')

            retryStrategy.recordSuccess(token) // Should not throw
            expect(
                mockLogging.log.args.some((args: any) =>
                    args[0].includes('Warning - failed to reset state after success')
                )
            ).to.be.true
        })

        it('should handle parent recordSuccess errors gracefully', async () => {
            const strategy = new QRetryStrategy(mockClassifier, mockDelayInterceptor, 3, mockLogging)
            const token = await strategy.acquireInitialRetryToken('test-scope')

            // Mock the parent recordSuccess to throw
            const originalRecordSuccess = Object.getPrototypeOf(Object.getPrototypeOf(strategy)).recordSuccess
            Object.getPrototypeOf(Object.getPrototypeOf(strategy)).recordSuccess = () => {
                throw new Error('Parent recordSuccess failed')
            }

            strategy.recordSuccess(token) // Should not throw

            // Restore original method
            Object.getPrototypeOf(Object.getPrototypeOf(strategy)).recordSuccess = originalRecordSuccess

            expect(
                mockLogging.log.args.some((args: any) =>
                    args[0].includes('Warning - failed to reset state after success')
                )
            ).to.be.true
        })
    })

    describe('getAttemptCount', () => {
        it('should return current attempt count', async () => {
            const token = await retryStrategy.acquireInitialRetryToken('test-scope')

            expect(retryStrategy.getAttemptCount()).to.equal(0)
        })
    })
})
