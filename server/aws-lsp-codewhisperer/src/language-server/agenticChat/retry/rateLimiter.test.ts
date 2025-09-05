import { ClientSideRateLimiter, TokenCost } from './rateLimiter'
import { RateLimiterConfig } from './retryConfig'
import { Logging } from '@aws/language-server-runtimes/server-interface'
import { expect } from 'chai'
import * as sinon from 'sinon'

describe('ClientSideRateLimiter', () => {
    let rateLimiter: ClientSideRateLimiter
    let mockLogging: any
    let config: RateLimiterConfig

    beforeEach(() => {
        mockLogging = {
            info: sinon.stub(),
            debug: sinon.stub(),
            warn: sinon.stub(),
            error: sinon.stub(),
        }

        config = {
            enabled: false,
            initialCapacity: 1.0,
            minFillRate: 0.5,
            beta: 0.7,
            smooth: 0.8,
        }

        rateLimiter = new ClientSideRateLimiter(config, mockLogging)
    })

    describe('initial state', () => {
        it('should start disabled', () => {
            expect(rateLimiter.isEnabled()).to.be.false
            expect(rateLimiter.getState()).to.deep.equal({
                enabled: false,
                capacity: 1.0,
                fillRate: 0.5,
            })
        })
    })

    describe('activate', () => {
        it('should activate rate limiter with default measured rate', () => {
            rateLimiter.activate()

            expect(rateLimiter.isEnabled()).to.be.true
            sinon.assert.calledWith(mockLogging.info, sinon.match(/Rate limiter activated/))

            const state = rateLimiter.getState()
            expect(state.enabled).to.be.true
            expect(state.fillRate).to.equal(0.35) // 0.5 * 0.7
            expect(state.capacity).to.equal(1.0) // max(0.35, 1.0)
        })

        it('should activate with custom measured rate', () => {
            rateLimiter.activate(1.0)

            const state = rateLimiter.getState()
            expect(state.fillRate).to.equal(0.35) // Math.min(1.0, 0.5) * 0.7 = 0.5 * 0.7 = 0.35
        })

        it('should apply additional throttling when already enabled', () => {
            rateLimiter.activate(1.0)
            const initialFillRate = rateLimiter.getState().fillRate // 0.35

            rateLimiter.activate(1.0)
            const newFillRate = rateLimiter.getState().fillRate // 0.35 * 0.7 = 0.245, but capped at minFillRate 0.5

            expect(newFillRate).to.be.at.least(config.minFillRate) // Should be capped at 0.5
            expect(newFillRate).to.equal(config.minFillRate) // Should equal 0.5 due to capping
        })
    })

    describe('checkAndCalculateDelay', () => {
        it('should return 0 delay when disabled', () => {
            const delay = rateLimiter.checkAndCalculateDelay(TokenCost.InitialRequest)
            expect(delay).to.equal(0)
        })

        it('should return 0 delay when sufficient capacity', () => {
            rateLimiter.activate()
            const delay = rateLimiter.checkAndCalculateDelay(TokenCost.InitialRequest)
            expect(delay).to.equal(0)
        })

        it('should calculate delay when insufficient capacity', () => {
            rateLimiter.activate()
            // Consume all capacity first
            rateLimiter.checkAndCalculateDelay(TokenCost.InitialRequest)

            const delay = rateLimiter.checkAndCalculateDelay(TokenCost.Retry)
            expect(delay).to.be.greaterThan(0)
            sinon.assert.calledWith(mockLogging.debug, sinon.match(/Rate limiter delay/))
        })
    })

    describe('applyDelayAndConsumeTokens', () => {
        it('should consume tokens without delay', async () => {
            rateLimiter.activate()
            const initialCapacity = rateLimiter.getState().capacity

            await rateLimiter.applyDelayAndConsumeTokens(0, TokenCost.InitialRequest)

            const finalCapacity = rateLimiter.getState().capacity
            expect(finalCapacity).to.be.lessThan(initialCapacity)
        })

        it('should apply delay and consume tokens', async () => {
            rateLimiter.activate()
            const startTime = Date.now()

            await rateLimiter.applyDelayAndConsumeTokens(100, TokenCost.InitialRequest)

            const endTime = Date.now()
            expect(endTime - startTime).to.be.at.least(90) // Allow some timing variance
        })

        it('should not consume tokens when disabled', async () => {
            const initialState = rateLimiter.getState()

            await rateLimiter.applyDelayAndConsumeTokens(0, TokenCost.InitialRequest)

            const finalState = rateLimiter.getState()
            expect(finalState).to.deep.equal(initialState)
        })
    })

    describe('onSuccessfulRequest', () => {
        it('should increase fill rate on successful request', () => {
            rateLimiter.activate()
            const initialFillRate = rateLimiter.getState().fillRate

            rateLimiter.onSuccessfulRequest()

            const newFillRate = rateLimiter.getState().fillRate
            expect(newFillRate).to.be.greaterThan(initialFillRate)
            sinon.assert.calledWith(mockLogging.debug, sinon.match(/Rate limiter recovery/))
        })

        it('should cap fill rate at maximum', () => {
            rateLimiter.activate()

            // Call multiple times to test capping
            for (let i = 0; i < 10; i++) {
                rateLimiter.onSuccessfulRequest()
            }

            const finalFillRate = rateLimiter.getState().fillRate
            expect(finalFillRate).to.be.at.most(2.0)
        })

        it('should not affect disabled rate limiter', () => {
            const initialState = rateLimiter.getState()

            rateLimiter.onSuccessfulRequest()

            const finalState = rateLimiter.getState()
            expect(finalState).to.deep.equal(initialState)
        })
    })

    describe('token refill', () => {
        it('should refill tokens over time', async () => {
            rateLimiter.activate()

            // Consume all tokens
            rateLimiter.checkAndCalculateDelay(TokenCost.InitialRequest)
            const capacityAfterConsumption = rateLimiter.getState().capacity

            // Wait for refill
            await new Promise(resolve => setTimeout(resolve, 100))

            const delay = rateLimiter.checkAndCalculateDelay(TokenCost.InitialRequest)
            const capacityAfterRefill = rateLimiter.getState().capacity

            expect(capacityAfterRefill).to.be.greaterThan(capacityAfterConsumption)
        })
    })
})
