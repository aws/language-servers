import { Telemetry, IdeDiagnostic } from '@aws/language-server-runtimes/server-interface'
import { AWSError } from 'aws-sdk'
import { CodeWhispererSession, UserTriggerDecision } from './session/sessionManager'
import { CodeWhispererPerceivedLatencyEvent, CodeWhispererServiceInvocationEvent } from '../../shared/telemetry/types'
import { getCompletionType, isAwsError } from '../../shared/utils'
import { TelemetryService } from '../../shared/telemetry/telemetryService'
import { SuggestionType } from '../../shared/codeWhispererService'

export const emitServiceInvocationTelemetry = (
    telemetry: Telemetry,
    session: CodeWhispererSession,
    requestId: string
) => {
    const duration = new Date().getTime() - session.startTime
    const data: CodeWhispererServiceInvocationEvent = {
        codewhispererRequestId: requestId,
        codewhispererSessionId: session.responseContext?.codewhispererSessionId,
        codewhispererLastSuggestionIndex: session.suggestions.length - 1,
        codewhispererCompletionType:
            session.suggestions.length > 0 ? getCompletionType(session.suggestions[0]) : undefined,
        codewhispererTriggerType: session.triggerType,
        codewhispererAutomatedTriggerType: session.autoTriggerType,
        duration,
        codewhispererLineNumber: session.startPosition.line,
        codewhispererCursorOffset: session.startPosition.character,
        codewhispererLanguage: session.language,
        credentialStartUrl: session.credentialStartUrl,
        codewhispererSupplementalContextTimeout: session.supplementalMetadata?.isProcessTimeout,
        codewhispererSupplementalContextIsUtg: session.supplementalMetadata?.isUtg,
        codewhispererSupplementalContextLatency: session.supplementalMetadata?.latency,
        codewhispererSupplementalContextLength: session.supplementalMetadata?.contentsLength,
        codewhispererCustomizationArn: session.customizationArn,
        result: 'Succeeded',
        codewhispererImportRecommendationEnabled: session.includeImportsWithSuggestions,
    }
    telemetry.emitMetric({
        name: 'codewhisperer_serviceInvocation',
        result: 'Succeeded',
        data: {
            ...data,
            codewhispererImportRecommendationEnabled: session.includeImportsWithSuggestions,
        },
    })
}

export const emitServiceInvocationFailure = (
    telemetry: Telemetry,
    session: CodeWhispererSession,
    error: Error | AWSError
) => {
    const duration = new Date().getTime() - session.startTime
    const codewhispererRequestId = isAwsError(error) ? error.requestId : undefined

    const data: CodeWhispererServiceInvocationEvent = {
        codewhispererRequestId: codewhispererRequestId,
        codewhispererSessionId: undefined,
        codewhispererLastSuggestionIndex: -1,
        codewhispererTriggerType: session.triggerType,
        codewhispererAutomatedTriggerType: session.autoTriggerType,
        reason: `CodeWhisperer Invocation Exception: ${error.name || 'UnknownError'}`,
        duration,
        codewhispererLineNumber: session.startPosition.line,
        codewhispererCursorOffset: session.startPosition.character,
        codewhispererLanguage: session.language,
        credentialStartUrl: session.credentialStartUrl,
        codewhispererSupplementalContextTimeout: session.supplementalMetadata?.isProcessTimeout,
        codewhispererSupplementalContextIsUtg: session.supplementalMetadata?.isUtg,
        codewhispererSupplementalContextLatency: session.supplementalMetadata?.latency,
        codewhispererSupplementalContextLength: session.supplementalMetadata?.contentsLength,
        codewhispererCustomizationArn: session.customizationArn,
        codewhispererImportRecommendationEnabled: session.includeImportsWithSuggestions,
        result: 'Failed',
        traceId: 'notSet',
    }

    telemetry.emitMetric({
        name: 'codewhisperer_serviceInvocation',
        result: 'Failed',
        data,
        errorData: {
            reason: error.name || 'UnknownError',
            errorCode: isAwsError(error) ? error.code : undefined,
            httpStatusCode: isAwsError(error) ? error.statusCode : undefined,
        },
    })
}

export const emitPerceivedLatencyTelemetry = (telemetry: Telemetry, session: CodeWhispererSession) => {
    const data: CodeWhispererPerceivedLatencyEvent = {
        codewhispererRequestId: session.responseContext?.requestId,
        codewhispererSessionId: session.responseContext?.codewhispererSessionId,
        codewhispererCompletionType:
            session.suggestions.length > 0 ? getCompletionType(session.suggestions[0]) : undefined,
        codewhispererTriggerType: session.triggerType,
        duration: session.firstCompletionDisplayLatency,
        codewhispererLanguage: session.language,
        credentialStartUrl: session.credentialStartUrl,
        codewhispererCustomizationArn: session.customizationArn,
        result: 'Succeeded',
        passive: true,
    }

    telemetry.emitMetric({
        name: 'codewhisperer_perceivedLatency',
        data,
    })
}

export const emitUserTriggerDecisionTelemetry = async (
    telemetry: Telemetry,
    telemetryService: TelemetryService,
    session: CodeWhispererSession,
    timeSinceLastUserModification?: number,
    addedCharsCountForEditSuggestion?: number,
    deletedCharsCountForEditSuggestion?: number,
    addedIdeDiagnostics?: IdeDiagnostic[],
    removedIdeDiagnostics?: IdeDiagnostic[],
    streakLength?: number,
    itemId?: string
) => {
    // Prevent reporting user decision if it was already sent
    if (session.reportedUserDecision) {
        return
    }

    // Edits show one suggestion sequentially (with pagination), so use latest itemId state;
    // Completions show multiple suggestions together, so aggregate all states
    const userTriggerDecision =
        session.suggestionType === SuggestionType.EDIT
            ? session.getUserTriggerDecision(itemId)
            : session.getAggregatedUserTriggerDecision()

    // Can not emit previous trigger decision if it's not available on the session
    if (!userTriggerDecision) {
        return
    }

    await emitAggregatedUserTriggerDecisionTelemetry(
        telemetryService,
        session,
        userTriggerDecision,
        timeSinceLastUserModification,
        addedCharsCountForEditSuggestion,
        deletedCharsCountForEditSuggestion,
        addedIdeDiagnostics,
        removedIdeDiagnostics,
        streakLength
    )

    session.reportedUserDecision = true
}

export const emitAggregatedUserTriggerDecisionTelemetry = (
    telemetryService: TelemetryService,
    session: CodeWhispererSession,
    userTriggerDecision: UserTriggerDecision,
    timeSinceLastUserModification?: number,
    addedCharsCountForEditSuggestion?: number,
    deletedCharsCountForEditSuggestion?: number,
    addedIdeDiagnostics?: IdeDiagnostic[],
    removedIdeDiagnostics?: IdeDiagnostic[],
    streakLength?: number
) => {
    return telemetryService.emitUserTriggerDecision(
        session,
        userTriggerDecision,
        timeSinceLastUserModification,
        addedCharsCountForEditSuggestion,
        deletedCharsCountForEditSuggestion,
        addedIdeDiagnostics,
        removedIdeDiagnostics,
        streakLength
    )
}
