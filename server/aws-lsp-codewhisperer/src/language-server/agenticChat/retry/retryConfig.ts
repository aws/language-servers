export interface RetryConfig {
    maxAttempts: number
    initialBackoffMs: number
    maxBackoffMs: number
    useStaticExponentialBase: boolean
}

export interface RateLimiterConfig {
    enabled: boolean
    initialCapacity: number
    minFillRate: number
    beta: number // throttle scale-down factor
    smooth: number // rate smoothing factor
}

export class AdaptiveRetryConfig {
    private static readonly DEFAULT_CONFIG: RetryConfig = {
        maxAttempts: 3,
        initialBackoffMs: 1000, // 1 second
        maxBackoffMs: 10000, // 10 seconds (matching CLI's MAX_RETRY_DELAY_DURATION)
        useStaticExponentialBase: false,
    }

    private static readonly DEFAULT_RATE_LIMITER_CONFIG: RateLimiterConfig = {
        enabled: false,
        initialCapacity: 1.0,
        minFillRate: 0.5, // requests per second
        beta: 0.7, // reduce by 30% on throttling
        smooth: 0.8,
    }

    static getRetryConfig(): RetryConfig {
        return {
            maxAttempts: this.getEnvInt('Q_RETRY_MAX_ATTEMPTS', this.DEFAULT_CONFIG.maxAttempts),
            initialBackoffMs: this.getEnvInt('Q_RETRY_INITIAL_DELAY_MS', this.DEFAULT_CONFIG.initialBackoffMs),
            maxBackoffMs: this.getEnvInt('Q_RETRY_MAX_DELAY_MS', this.DEFAULT_CONFIG.maxBackoffMs),
            useStaticExponentialBase: this.getEnvBool(
                'Q_RETRY_USE_STATIC_BASE',
                this.DEFAULT_CONFIG.useStaticExponentialBase
            ),
        }
    }

    static getRateLimiterConfig(): RateLimiterConfig {
        return {
            enabled: this.DEFAULT_RATE_LIMITER_CONFIG.enabled,
            initialCapacity: this.getEnvFloat(
                'Q_RATE_LIMITER_INITIAL_CAPACITY',
                this.DEFAULT_RATE_LIMITER_CONFIG.initialCapacity
            ),
            minFillRate: this.getEnvFloat('Q_RATE_LIMITER_MIN_FILL_RATE', this.DEFAULT_RATE_LIMITER_CONFIG.minFillRate),
            beta: this.getEnvFloat('Q_RATE_LIMITER_BETA', this.DEFAULT_RATE_LIMITER_CONFIG.beta),
            smooth: this.getEnvFloat('Q_RATE_LIMITER_SMOOTH', this.DEFAULT_RATE_LIMITER_CONFIG.smooth),
        }
    }

    static isRetryDisabled(): boolean {
        return this.getEnvBool('Q_DISABLE_RETRIES', false)
    }

    private static getEnvInt(key: string, defaultValue: number): number {
        const value = process.env[key]
        if (value) {
            const parsed = parseInt(value, 10)
            return isNaN(parsed) ? defaultValue : parsed
        }
        return defaultValue
    }

    private static getEnvFloat(key: string, defaultValue: number): number {
        const value = process.env[key]
        if (value) {
            const parsed = parseFloat(value)
            return isNaN(parsed) ? defaultValue : parsed
        }
        return defaultValue
    }

    private static getEnvBool(key: string, defaultValue: boolean): boolean {
        const value = process.env[key]
        if (value) {
            return value.toLowerCase() === 'true'
        }
        return defaultValue
    }

    /**
     * Calculate exponential backoff delay with jitter
     */
    static calculateExponentialBackoff(
        baseMultiplier: number,
        initialBackoffSeconds: number,
        attemptNumber: number,
        maxBackoff: number
    ): number {
        const backoffMs = baseMultiplier * initialBackoffSeconds * Math.pow(2, attemptNumber) * 1000
        return Math.min(backoffMs, maxBackoff)
    }

    /**
     * Generate jitter base multiplier
     * Matches fastrand::f64() behavior
     */
    static generateJitterBase(useStatic: boolean): number {
        return useStatic ? 1.0 : Math.random()
    }
}
