import { QRetryClassifier, RetryAction } from './retryClassifier'
import { AdaptiveRetryConfig } from './retryConfig'
import { ClientSideRateLimiter, TokenCost } from './rateLimiter'
import { expect } from 'chai'

describe('Retry Logic', () => {
    describe('QRetryClassifier', () => {
        let classifier: QRetryClassifier

        beforeEach(() => {
            classifier = new QRetryClassifier()
        })

        it('should classify monthly limit error as RetryForbidden', () => {
            const error = {
                message: 'Monthly limit exceeded',
                cause: {
                    $response: {
                        body: '{"reason":"MONTHLY_REQUEST_COUNT"}',
                    },
                },
            }

            const result = classifier.classifyRetry(error)
            expect(result).to.equal(RetryAction.RetryForbidden)
        })

        it('should classify service overload as ThrottlingError', () => {
            const error = {
                message: 'Encountered unexpectedly high load when processing the request, please try again.',
                cause: {
                    $metadata: {
                        httpStatusCode: 500,
                    },
                },
            }

            const result = classifier.classifyRetry(error)
            expect(result).to.equal(RetryAction.ThrottlingError)
        })

        it('should classify 500 errors as TransientError', () => {
            const error = {
                message: 'Internal server error',
                cause: {
                    $metadata: {
                        httpStatusCode: 500,
                    },
                },
            }

            const result = classifier.classifyRetry(error)
            expect(result).to.equal(RetryAction.TransientError)
        })
    })

    describe('AdaptiveRetryConfig', () => {
        it('should calculate exponential backoff correctly', () => {
            const backoff1 = AdaptiveRetryConfig.calculateExponentialBackoff(1.0, 1.0, 0, 10000)
            const backoff2 = AdaptiveRetryConfig.calculateExponentialBackoff(1.0, 1.0, 1, 10000)
            const backoff3 = AdaptiveRetryConfig.calculateExponentialBackoff(1.0, 1.0, 2, 10000)

            expect(backoff1).to.equal(1000) // 1s * 2^0 = 1s
            expect(backoff2).to.equal(2000) // 1s * 2^1 = 2s
            expect(backoff3).to.equal(4000) // 1s * 2^2 = 4s
        })

        it('should respect max backoff limit', () => {
            const backoff = AdaptiveRetryConfig.calculateExponentialBackoff(1.0, 1.0, 10, 5000)
            expect(backoff).to.equal(5000) // Should be capped at 5s
        })
    })

    describe('ClientSideRateLimiter', () => {
        let rateLimiter: ClientSideRateLimiter

        beforeEach(() => {
            const config = AdaptiveRetryConfig.getRateLimiterConfig()
            rateLimiter = new ClientSideRateLimiter(config)
        })

        it('should not delay when disabled', () => {
            const delay = rateLimiter.checkAndCalculateDelay(TokenCost.InitialRequest)
            expect(delay).to.equal(0)
        })

        it('should calculate delay when activated', () => {
            rateLimiter.activate()
            const delay = rateLimiter.checkAndCalculateDelay(TokenCost.ThrottlingRetry)
            expect(delay).to.be.greaterThan(0)
        })

        it('should track state correctly', () => {
            expect(rateLimiter.isEnabled()).to.be.false

            rateLimiter.activate()
            expect(rateLimiter.isEnabled()).to.be.true

            const state = rateLimiter.getState()
            expect(state.enabled).to.be.true
            expect(state.capacity).to.be.greaterThan(0)
            expect(state.fillRate).to.be.greaterThan(0)
        })
    })
})
