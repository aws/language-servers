import { RetryTelemetryController, RetryTelemetryEvent } from './retryTelemetry'
import { TelemetryService } from '../../../shared/telemetry/telemetryService'
import { expect } from 'chai'
import * as sinon from 'sinon'

describe('RetryTelemetryController', () => {
    let controller: RetryTelemetryController
    let mockTelemetryService: any
    let mockEmitMetric: sinon.SinonStub

    beforeEach(() => {
        mockEmitMetric = sinon.stub()
        mockTelemetryService = {
            telemetry: {
                emitMetric: mockEmitMetric,
            },
        }

        controller = new RetryTelemetryController(mockTelemetryService)
    })

    describe('emitInitialRequestDelayed', () => {
        it('should emit initial request delayed metric', () => {
            const event = {
                conversationId: 'test-conversation',
                delayMs: 2000,
                rateLimiterCapacity: 1.0,
                rateLimiterFillRate: 0.5,
            }

            controller.emitInitialRequestDelayed(event)

            sinon.assert.calledWith(mockEmitMetric, {
                name: 'amazonq_retry_initial_request_delayed',
                data: {
                    type: 'initial_request_delayed',
                    conversationId: 'test-conversation',
                    delayMs: 2000,
                    rateLimiterCapacity: 1.0,
                    rateLimiterFillRate: 0.5,
                },
            })
        })

        it('should handle undefined telemetry service', () => {
            const controllerWithoutTelemetry = new RetryTelemetryController()
            const event = {
                conversationId: 'test-conversation',
                delayMs: 2000,
                rateLimiterCapacity: 1.0,
                rateLimiterFillRate: 0.5,
            }

            expect(() => controllerWithoutTelemetry.emitInitialRequestDelayed(event)).not.to.throw()
        })
    })

    describe('emitRetryAttemptDelayed', () => {
        it('should emit retry attempt delayed metric', () => {
            const event = {
                conversationId: 'test-conversation',
                attemptNumber: 2,
                errorType: 'ThrottlingError',
                retryDelayMs: 4000,
                rateLimitDelayMs: 1000,
                backoffDelayMs: 3000,
            }

            controller.emitRetryAttemptDelayed(event)

            sinon.assert.calledWith(mockEmitMetric, {
                name: 'amazonq_retry_attempt_delayed',
                data: {
                    type: 'retry_attempt_delayed',
                    conversationId: 'test-conversation',
                    attemptNumber: 2,
                    errorType: 'ThrottlingError',
                    delayMs: 4000,
                    rateLimitDelayMs: 1000,
                    backoffDelayMs: 3000,
                },
            })
        })
    })

    describe('emitRateLimiterStateChanged', () => {
        it('should emit rate limiter state changed metric', () => {
            const event = {
                conversationId: 'test-conversation',
                enabled: true,
                capacity: 1.5,
                fillRate: 0.7,
                triggerErrorType: 'ThrottlingError',
            }

            controller.emitRateLimiterStateChanged(event)

            sinon.assert.calledWith(mockEmitMetric, {
                name: 'amazonq_retry_rate_limiter_state_changed',
                data: {
                    type: 'rate_limiter_state_changed',
                    conversationId: 'test-conversation',
                    rateLimiterEnabled: true,
                    rateLimiterCapacity: 1.5,
                    rateLimiterFillRate: 0.7,
                    triggerErrorType: 'ThrottlingError',
                },
            })
        })

        it('should emit metric without optional triggerErrorType', () => {
            const event = {
                conversationId: 'test-conversation',
                enabled: false,
                capacity: 1.0,
                fillRate: 0.5,
            }

            controller.emitRateLimiterStateChanged(event)

            sinon.assert.calledWith(mockEmitMetric, {
                name: 'amazonq_retry_rate_limiter_state_changed',
                data: {
                    type: 'rate_limiter_state_changed',
                    conversationId: 'test-conversation',
                    rateLimiterEnabled: false,
                    rateLimiterCapacity: 1.0,
                    rateLimiterFillRate: 0.5,
                    triggerErrorType: undefined,
                },
            })
        })
    })

    describe('emitDelayNotificationSent', () => {
        it('should emit delay notification sent metric', () => {
            const event = {
                conversationId: 'test-conversation',
                notificationType: 'initial_delay',
                delayMs: 3000,
                thresholdExceeded: 'minor',
            }

            controller.emitDelayNotificationSent(event)

            sinon.assert.calledWith(mockEmitMetric, {
                name: 'amazonq_retry_delay_notification_sent',
                data: {
                    type: 'delay_notification_sent',
                    conversationId: 'test-conversation',
                    notificationType: 'initial_delay',
                    delayMs: 3000,
                    thresholdExceeded: 'minor',
                },
            })
        })
    })
})
