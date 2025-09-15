import { QRetryStrategy } from './qRetryStrategy'
import { QRetryClassifier, RetryAction } from './retryClassifier'
import { QDelayTrackingInterceptor } from './delayInterceptor'
import { RetryToken } from '@aws-sdk/types'
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
            expect(token.getRetryDelay()).to.equal(0)
            expect(retryStrategy.getAttemptCount()).to.equal(0)
            expect(
                mockLogging.log.args.some((args: any) =>
                    args[0].includes('Initial retry token acquired for scope: test-scope')
                )
            ).to.be.true
        })

        it('should sanitize scope input for logging', async () => {
            await retryStrategy.acquireInitialRetryToken('test\nscope\r')

            expect(mockLogging.log.args.some((args: any) => args[0].includes('test_scope_'))).to.be.true
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

            mockClassifier.classifyRetry.returns(RetryAction.ThrottlingError)

            const newToken = await retryStrategy.refreshRetryTokenForRetry(initialToken, { error })

            expect(newToken.getRetryCount()).to.equal(1)
            expect(newToken.getRetryDelay()).to.equal(600) // 300 * 2^1
            expect(mockDelayInterceptor.beforeAttempt.calledWith(2)).to.be.true
        })

        it('should reject retry for forbidden errors', async () => {
            const error = new Error('Abort')
            mockClassifier.classifyRetry.returns(RetryAction.RetryForbidden)

            try {
                await retryStrategy.refreshRetryTokenForRetry(initialToken, { error })
                expect.fail('Should have thrown error')
            } catch (e: any) {
                expect(e.message).to.equal('Abort') // Original error is thrown
            }
        })

        it('should reject retry when max attempts reached', async () => {
            mockClassifier.classifyRetry.returns(RetryAction.ThrottlingError)

            // Simulate 3 attempts
            let token = initialToken
            token = await retryStrategy.refreshRetryTokenForRetry(token, { error: new Error() })
            token = await retryStrategy.refreshRetryTokenForRetry(token, { error: new Error() })

            try {
                await retryStrategy.refreshRetryTokenForRetry(token, { error: new Error('Test error') })
                expect.fail('Should have thrown error')
            } catch (e: any) {
                expect(e.message).to.equal('Test error') // Original error is thrown
            }
        })

        it('should calculate exponential backoff delay', async () => {
            mockClassifier.classifyRetry.returns(RetryAction.ThrottlingError)

            let token = initialToken
            token = await retryStrategy.refreshRetryTokenForRetry(token, { error: new Error() })
            expect(token.getRetryDelay()).to.equal(600) // 300 * 2^1

            token = await retryStrategy.refreshRetryTokenForRetry(token, { error: new Error() })
            expect(token.getRetryDelay()).to.equal(1200) // 300 * 2^2
        })

        it('should cap delay at maximum', async () => {
            const strategy = new QRetryStrategy(mockClassifier, mockDelayInterceptor, 10, mockLogging)
            mockClassifier.classifyRetry.returns(RetryAction.ThrottlingError)

            let token = await strategy.acquireInitialRetryToken('test')

            // Simulate many attempts to reach max delay
            for (let i = 0; i < 8; i++) {
                token = await strategy.refreshRetryTokenForRetry(token, { error: new Error() })
            }

            expect(token.getRetryDelay()).to.equal(10000) // Max delay
        })
    })

    describe('recordSuccess', () => {
        it('should reset state and call delay interceptor', async () => {
            const token = await retryStrategy.acquireInitialRetryToken('test-scope')

            await retryStrategy.recordSuccess(token)

            expect(mockDelayInterceptor.reset.called).to.be.true
            expect(retryStrategy.getAttemptCount()).to.equal(0)
            expect(
                mockLogging.log.args.some((args: any) => args[0].includes('Request succeeded after 1 total attempts'))
            ).to.be.true
        })

        it('should handle reset errors gracefully', async () => {
            mockDelayInterceptor.reset.throws(new Error('Reset failed'))

            const token = await retryStrategy.acquireInitialRetryToken('test-scope')

            await retryStrategy.recordSuccess(token) // Should not throw
            expect(
                mockLogging.log.args.some((args: any) =>
                    args[0].includes('Warning - failed to reset state after success')
                )
            ).to.be.true
        })
    })
})
