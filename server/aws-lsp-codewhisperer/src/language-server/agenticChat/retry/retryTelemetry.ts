import { TelemetryService } from '../../../shared/telemetry/telemetryService'

export interface RetryTelemetryEvent {
    type: 'initial_request_delayed' | 'retry_attempt_delayed' | 'rate_limiter_state_changed' | 'delay_notification_sent'
    conversationId?: string
    delayMs?: number
    attemptNumber?: number
    errorType?: string
    rateLimiterCapacity?: number
    rateLimiterFillRate?: number
    rateLimiterEnabled?: boolean
    triggerErrorType?: string
    notificationType?: string
    thresholdExceeded?: string
}

export class RetryTelemetryController {
    private telemetryService?: TelemetryService

    constructor(telemetryService?: TelemetryService) {
        this.telemetryService = telemetryService
    }

    emitInitialRequestDelayed(event: {
        conversationId: string
        delayMs: number
        rateLimiterCapacity: number
        rateLimiterFillRate: number
    }): void {
        const telemetryEvent: RetryTelemetryEvent = {
            type: 'initial_request_delayed',
            conversationId: event.conversationId,
            delayMs: event.delayMs,
            rateLimiterCapacity: event.rateLimiterCapacity,
            rateLimiterFillRate: event.rateLimiterFillRate,
        }

        this.telemetryService?.['telemetry'].emitMetric({
            name: 'amazonq_retry_initial_request_delayed',
            data: telemetryEvent,
        })
    }

    emitRetryAttemptDelayed(event: {
        conversationId: string
        attemptNumber: number
        errorType: string
        retryDelayMs: number
        rateLimitDelayMs: number
        backoffDelayMs: number
    }): void {
        const telemetryEvent: RetryTelemetryEvent = {
            type: 'retry_attempt_delayed',
            conversationId: event.conversationId,
            attemptNumber: event.attemptNumber,
            errorType: event.errorType,
            delayMs: event.retryDelayMs,
        }

        this.telemetryService?.['telemetry'].emitMetric({
            name: 'amazonq_retry_attempt_delayed',
            data: {
                ...telemetryEvent,
                rateLimitDelayMs: event.rateLimitDelayMs,
                backoffDelayMs: event.backoffDelayMs,
            },
        })
    }

    emitRateLimiterStateChanged(event: {
        conversationId: string
        enabled: boolean
        capacity: number
        fillRate: number
        triggerErrorType?: string
    }): void {
        const telemetryEvent: RetryTelemetryEvent = {
            type: 'rate_limiter_state_changed',
            conversationId: event.conversationId,
            rateLimiterEnabled: event.enabled,
            rateLimiterCapacity: event.capacity,
            rateLimiterFillRate: event.fillRate,
            triggerErrorType: event.triggerErrorType,
        }

        this.telemetryService?.['telemetry'].emitMetric({
            name: 'amazonq_retry_rate_limiter_state_changed',
            data: telemetryEvent,
        })
    }

    emitDelayNotificationSent(event: {
        conversationId: string
        notificationType: string
        delayMs: number
        thresholdExceeded: string
    }): void {
        const telemetryEvent: RetryTelemetryEvent = {
            type: 'delay_notification_sent',
            conversationId: event.conversationId,
            notificationType: event.notificationType,
            delayMs: event.delayMs,
            thresholdExceeded: event.thresholdExceeded,
        }

        this.telemetryService?.['telemetry'].emitMetric({
            name: 'amazonq_retry_delay_notification_sent',
            data: telemetryEvent,
        })
    }
}
