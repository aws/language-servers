import { AdaptiveRetryConfig } from './retryConfig'
import { expect } from 'chai'

describe('AdaptiveRetryConfig', () => {
    const originalEnv = process.env

    beforeEach(() => {
        process.env = { ...originalEnv }
    })

    after(() => {
        process.env = originalEnv
    })

    describe('getRetryConfig', () => {
        it('should return default config when no env vars set', () => {
            const config = AdaptiveRetryConfig.getRetryConfig()

            expect(config).to.deep.equal({
                maxAttempts: 3,
                initialBackoffMs: 1000,
                maxBackoffMs: 10000,
                useStaticExponentialBase: false,
            })
        })

        it('should use environment variables when set', () => {
            process.env.Q_RETRY_MAX_ATTEMPTS = '5'
            process.env.Q_RETRY_INITIAL_DELAY_MS = '2000'
            process.env.Q_RETRY_MAX_DELAY_MS = '20000'
            process.env.Q_RETRY_USE_STATIC_BASE = 'true'

            const config = AdaptiveRetryConfig.getRetryConfig()

            expect(config).to.deep.equal({
                maxAttempts: 5,
                initialBackoffMs: 2000,
                maxBackoffMs: 20000,
                useStaticExponentialBase: true,
            })
        })

        it('should handle invalid environment variables', () => {
            process.env.Q_RETRY_MAX_ATTEMPTS = 'invalid'
            process.env.Q_RETRY_INITIAL_DELAY_MS = 'not-a-number'

            const config = AdaptiveRetryConfig.getRetryConfig()

            expect(config.maxAttempts).to.equal(3) // default
            expect(config.initialBackoffMs).to.equal(1000) // default
        })
    })

    describe('getRateLimiterConfig', () => {
        it('should return default rate limiter config', () => {
            const config = AdaptiveRetryConfig.getRateLimiterConfig()

            expect(config).to.deep.equal({
                enabled: false,
                initialCapacity: 1.0,
                minFillRate: 0.5,
                beta: 0.7,
                smooth: 0.8,
            })
        })

        it('should use environment variables for rate limiter config', () => {
            process.env.Q_RATE_LIMITER_INITIAL_CAPACITY = '2.0'
            process.env.Q_RATE_LIMITER_MIN_FILL_RATE = '1.0'
            process.env.Q_RATE_LIMITER_BETA = '0.8'
            process.env.Q_RATE_LIMITER_SMOOTH = '0.9'

            const config = AdaptiveRetryConfig.getRateLimiterConfig()

            expect(config.initialCapacity).to.equal(2.0)
            expect(config.minFillRate).to.equal(1.0)
            expect(config.beta).to.equal(0.8)
            expect(config.smooth).to.equal(0.9)
        })

        it('should handle invalid float environment variables', () => {
            process.env.Q_RATE_LIMITER_INITIAL_CAPACITY = 'invalid'
            process.env.Q_RATE_LIMITER_MIN_FILL_RATE = 'not-a-float'

            const config = AdaptiveRetryConfig.getRateLimiterConfig()

            expect(config.initialCapacity).to.equal(1.0) // default
            expect(config.minFillRate).to.equal(0.5) // default
        })
    })

    describe('isRetryDisabled', () => {
        it('should return false by default', () => {
            expect(AdaptiveRetryConfig.isRetryDisabled()).to.be.false
        })

        it('should return true when env var is set to true', () => {
            process.env.Q_DISABLE_RETRIES = 'true'
            expect(AdaptiveRetryConfig.isRetryDisabled()).to.be.true
        })

        it('should return false when env var is set to false', () => {
            process.env.Q_DISABLE_RETRIES = 'false'
            expect(AdaptiveRetryConfig.isRetryDisabled()).to.be.false
        })

        it('should handle case insensitive boolean values', () => {
            process.env.Q_DISABLE_RETRIES = 'TRUE'
            expect(AdaptiveRetryConfig.isRetryDisabled()).to.be.true
        })
    })

    describe('calculateExponentialBackoff', () => {
        it('should calculate exponential backoff correctly', () => {
            const result = AdaptiveRetryConfig.calculateExponentialBackoff(1.0, 1, 1, 10000)
            expect(result).to.equal(2000) // 1.0 * 1 * 2^1 * 1000
        })

        it('should respect max backoff limit', () => {
            const result = AdaptiveRetryConfig.calculateExponentialBackoff(1.0, 10, 5, 5000)
            expect(result).to.equal(5000) // Should be capped at maxBackoff
        })

        it('should handle zero attempt number', () => {
            const result = AdaptiveRetryConfig.calculateExponentialBackoff(1.0, 1, 0, 10000)
            expect(result).to.equal(1000) // 1.0 * 1 * 2^0 * 1000
        })

        it('should handle fractional base multiplier', () => {
            const result = AdaptiveRetryConfig.calculateExponentialBackoff(0.5, 2, 2, 10000)
            expect(result).to.equal(4000) // 0.5 * 2 * 2^2 * 1000
        })
    })

    describe('generateJitterBase', () => {
        it('should return 1.0 for static jitter', () => {
            const result = AdaptiveRetryConfig.generateJitterBase(true)
            expect(result).to.equal(1.0)
        })

        it('should return random value for non-static jitter', () => {
            const result = AdaptiveRetryConfig.generateJitterBase(false)
            expect(result).to.be.at.least(0)
            expect(result).to.be.lessThan(1)
        })

        it('should return different values for multiple calls with non-static jitter', () => {
            const results = Array.from({ length: 10 }, () => AdaptiveRetryConfig.generateJitterBase(false))

            // Check that not all values are the same (very unlikely with random)
            const uniqueValues = new Set(results)
            expect(uniqueValues.size).to.be.greaterThan(1)
        })
    })
})
