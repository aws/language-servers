import { Logging } from '@aws/language-server-runtimes/server-interface'
import { RateLimiterConfig } from './retryConfig'

export enum TokenCost {
    InitialRequest = 1.0,
    Retry = 5.0,
    ThrottlingRetry = 10.0,
}

export class ClientSideRateLimiter {
    private enabled: boolean = false
    private capacity: number = 1.0
    private fillRate: number = 0.5 // requests per second
    private lastRefillTime: number = Date.now()
    private config: RateLimiterConfig
    private logging?: Logging

    constructor(config: RateLimiterConfig, logging?: Logging) {
        this.config = config
        this.logging = logging
        this.capacity = config.initialCapacity
        this.fillRate = config.minFillRate
    }

    /**
     * Activate rate limiter when throttling is detected
     * Matches CLI's rate limiter activation logic
     */
    activate(measuredTxRate: number = 2.0): void {
        if (this.enabled) {
            // Already enabled, apply additional throttling
            this.fillRate = Math.max(this.fillRate * this.config.beta, this.config.minFillRate)
        } else {
            // First activation
            this.enabled = true
            const lastMaxRate = Math.min(measuredTxRate, this.config.minFillRate)
            this.fillRate = lastMaxRate * this.config.beta
            this.capacity = Math.max(this.fillRate, 1.0)
            this.lastRefillTime = Date.now()

            this.logging?.info(
                `Rate limiter activated: fillRate=${this.fillRate.toFixed(2)} req/s, capacity=${this.capacity.toFixed(2)}`
            )
        }
    }

    /**
     * Check if request can proceed and calculate delay if needed
     * Matches CLI's token bucket delay calculation
     */
    checkAndCalculateDelay(tokenCost: TokenCost): number {
        if (!this.enabled) {
            return 0
        }

        this.refillTokens()

        const requiredTokens = tokenCost as number
        if (this.capacity >= requiredTokens) {
            this.capacity -= requiredTokens
            return 0
        }

        // Calculate delay: (required_tokens - available_tokens) / fill_rate
        const delaySeconds = (requiredTokens - this.capacity) / this.fillRate
        const delayMs = Math.round(delaySeconds * 1000)

        this.logging?.debug(
            `Rate limiter delay: ${delayMs}ms for ${requiredTokens} tokens (capacity: ${this.capacity.toFixed(2)}, fillRate: ${this.fillRate.toFixed(2)})`
        )

        return delayMs
    }

    /**
     * Apply delay and consume tokens
     */
    async applyDelayAndConsumeTokens(delayMs: number, tokenCost: TokenCost): Promise<void> {
        if (delayMs > 0) {
            await this.sleep(delayMs)
            this.refillTokens()
        }

        if (this.enabled) {
            this.capacity = Math.max(0, this.capacity - (tokenCost as number))
        }
    }

    /**
     * Handle successful request for cubic recovery
     */
    onSuccessfulRequest(): void {
        if (this.enabled) {
            // Begin cubic recovery algorithm - gradually increase fill rate
            this.fillRate = Math.min(this.fillRate * 1.1, 2.0) // Cap at 2 req/s
            this.logging?.debug(`Rate limiter recovery: fillRate increased to ${this.fillRate.toFixed(2)} req/s`)
        }
    }

    private refillTokens(): void {
        if (!this.enabled) {
            return
        }

        const now = Date.now()
        const timeDeltaSeconds = (now - this.lastRefillTime) / 1000
        const tokensToAdd = timeDeltaSeconds * this.fillRate

        this.capacity = Math.min(this.capacity + tokensToAdd, Math.max(this.fillRate, 1.0))
        this.lastRefillTime = now
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms))
    }

    isEnabled(): boolean {
        return this.enabled
    }

    getState(): { enabled: boolean; capacity: number; fillRate: number } {
        return {
            enabled: this.enabled,
            capacity: this.capacity,
            fillRate: this.fillRate,
        }
    }
}
