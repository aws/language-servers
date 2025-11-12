import { Telemetry } from '@aws/language-server-runtimes/server-interface'
import { IdeDiagnostic, UserDecisionReason } from '@amzn/codewhisperer-runtime'
import { ServiceException } from '@smithy/smithy-client'
import { CodeWhispererSession, UserTriggerDecision } from '../session/sessionManager'
import {
    CodeWhispererPerceivedLatencyEvent,
    CodeWhispererServiceInvocationEvent,
} from '../../../shared/telemetry/types'
import { getCompletionType, isServiceException, getErrorId } from '../../../shared/utils'
import { TelemetryService } from '../../../shared/telemetry/telemetryService'
import { SuggestionType } from '../../../shared/codeWhispererService'

export const emitServiceInvocationTelemetry = (
    telemetry: Telemetry,
    session: CodeWhispererSession,
    requestId: string | undefined
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
    error: Error | ServiceException
) => {
    const duration = new Date().getTime() - session.startTime
    const codewhispererRequestId = isServiceException(error) ? error.$metadata.requestId : undefined

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
            errorCode: getErrorId(error),
            httpStatusCode: isServiceException(error) ? error.$metadata.httpStatusCode : undefined,
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

export async function emitEmptyUserTriggerDecisionTelemetry(
    telemetryService: TelemetryService,
    session: CodeWhispererSession,
    timeSinceLastUserModification?: number,
    streakLength?: number,
    userDecisionReason?: UserDecisionReason
) {
    // Prevent reporting user decision if it was already sent
    if (session.reportedUserDecision) {
        return
    }

    // Non-blocking
    emitAggregatedUserTriggerDecisionTelemetry(
        telemetryService,
        session,
        'Empty',
        timeSinceLastUserModification,
        0,
        0,
        [],
        [],
        streakLength,
        userDecisionReason
    )
        .then()
        .catch(e => {})
        .finally(() => {
            session.reportedUserDecision = true
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
    itemId?: string,
    userDecisionReason?: UserDecisionReason
) => {
    // Prevent reporting user decision if it was already sent
    if (session.reportedUserDecision) {
        return
    }

    // Edits show one suggestion sequentially (with pagination), so use latest itemId state;
    // Completions show multiple suggestions together, so aggregate all states
    const userTriggerDecision =
        session.predictionType === SuggestionType.EDIT
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
        streakLength,
        userDecisionReason
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
    streakLength?: number,
    userDecisionReason?: UserDecisionReason
) => {
    return telemetryService.emitUserTriggerDecision(
        session,
        userTriggerDecision,
        timeSinceLastUserModification,
        addedCharsCountForEditSuggestion,
        deletedCharsCountForEditSuggestion,
        addedIdeDiagnostics,
        removedIdeDiagnostics,
        streakLength,
        userDecisionReason
    )
}
