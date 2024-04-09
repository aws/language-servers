import { Telemetry } from '@aws/language-server-runtimes/server-interface'
import { TransformationSpec } from '../client/token/codewhispererbearertokenclient'
import {
    QNetCancelTransformRequest,
    QNetCancelTransformResponse,
    QNetDownloadArtifactsRequest,
    QNetDownloadArtifactsResponse,
    QNetGetTransformPlanRequest,
    QNetGetTransformPlanResponse,
    QNetGetTransformRequest,
    QNetGetTransformResponse,
    QNetStartTransformRequest,
    QNetStartTransformResponse,
} from './netTransform/models'
import {
    TransformationFailureEvent,
    TransformationJobArtifactsDownloadedEvent,
    TransformationJobCancelledEvent,
    TransformationJobReceivedEvent,
    TransformationJobStartedEvent,
    TransformationPlanReceivedEvent,
} from './telemetry/types'
import { flattenMetric } from './utils'

export const CODETRANSFORM_CATEGORY = 'codeTransform'

export const emitTransformationJobStartedTelemetry = (telemetry: Telemetry, response: QNetStartTransformResponse) => {
    const data: TransformationJobStartedEvent = {
        category: CODETRANSFORM_CATEGORY,
        transformationJobId: response.TransformationJobId,
        uploadId: response.UploadId,
        error: response.Error as string,
    }

    telemetry.emitMetric({
        name: 'codeTransform_jobIsStartedByUser',
        result: 'Succeeded',
        data: flattenMetric(data),
    })
}

export const emitTransformationJobStartedFailure = (
    telemetry: Telemetry,
    request: QNetStartTransformRequest,
    error: Error
) => {
    const data: TransformationFailureEvent = {
        category: CODETRANSFORM_CATEGORY,
        programLanguage: request.ProgramLanguage,
        selectedProjectPath: request.SelectedProjectPath,
        targetFramework: request.TargetFramework,
    }

    telemetry.emitMetric({
        name: 'codeTransform_jobIsStartedByUser',
        result: 'Failed',
        errorData: {
            reason: error.message || 'UnknownError',
        },
    })
}

export const emitTransformationJobReceivedTelemetry = (telemetry: Telemetry, response: QNetGetTransformResponse) => {
    const data: TransformationJobReceivedEvent = {
        category: CODETRANSFORM_CATEGORY,
        transformationJobId: response.TransformationJob?.jobId as string,
        transformationJobStatus: response.TransformationJob?.status as string,
        creationTime: response.TransformationJob?.creationTime as Date,
        startExecutionTime: response.TransformationJob?.startExecutionTime as Date,
        endExecutionTime: response.TransformationJob?.endExecutionTime as Date,
        reason: response.TransformationJob?.reason as string,
        transformationSpec: response.TransformationJob?.transformationSpec as TransformationSpec,
    }

    telemetry.emitMetric({
        name: 'codeTransform_jobIsReceivedByUser',
        result: 'Succeeded',
        data: flattenMetric(data),
    })
}

export const emitTransformationJobReceivedFailure = (
    telemetry: Telemetry,
    request: QNetGetTransformRequest,
    error: Error
) => {
    const data: TransformationFailureEvent = {
        category: CODETRANSFORM_CATEGORY,
        transformationJobId: request.TransformationJobId,
    }

    telemetry.emitMetric({
        name: 'codeTransform_jobIsReceivedByUser',
        result: 'Failed',
        data,
        errorData: {
            reason: error.message || 'UnknownError',
        },
    })
}

export const emitTransformationJobCancelledTelemetry = (
    telemetry: Telemetry,
    response: QNetCancelTransformResponse,
    jobId: string
) => {
    const data: TransformationJobCancelledEvent = {
        category: CODETRANSFORM_CATEGORY,
        transformationJobId: jobId,
        cancellationJobStatus: response.TransformationJobStatus,
    }

    telemetry.emitMetric({
        name: 'codeTransform_jobIsCancelledByUser',
        result: 'Succeeded',
        data: flattenMetric(data),
    })
}

export const emitTransformationJobCancelledFailure = (
    telemetry: Telemetry,
    request: QNetCancelTransformRequest,
    error: Error
) => {
    const data: TransformationFailureEvent = {
        category: CODETRANSFORM_CATEGORY,
        transformationJobId: request.TransformationJobId,
    }

    telemetry.emitMetric({
        name: 'codeTransform_jobIsCancelledByUser',
        result: 'Failed',
        data,
        errorData: {
            reason: error.message || 'UnknownError',
        },
    })
}

export const emitTransformationJobPolledTelemetry = (telemetry: Telemetry, response: QNetGetTransformResponse) => {
    const data: TransformationJobReceivedEvent = {
        category: CODETRANSFORM_CATEGORY,
        transformationJobId: response.TransformationJob?.jobId as string,
        transformationJobStatus: response.TransformationJob?.status as string,
        creationTime: response.TransformationJob?.creationTime as Date,
        startExecutionTime: response.TransformationJob?.startExecutionTime as Date,
        endExecutionTime: response.TransformationJob?.endExecutionTime as Date,
        reason: response.TransformationJob?.reason as string,
        transformationSpec: response.TransformationJob?.transformationSpec as TransformationSpec,
    }

    telemetry.emitMetric({
        name: 'codeTransform_jobIsPolledByUser',
        result: 'Succeeded',
        data: flattenMetric(data),
    })
}

export const emitTransformationJobPolledFailure = (
    telemetry: Telemetry,
    request: QNetGetTransformRequest,
    error: Error
) => {
    const data: TransformationFailureEvent = {
        category: CODETRANSFORM_CATEGORY,
        transformationJobId: request.TransformationJobId,
    }

    telemetry.emitMetric({
        name: 'codeTransform_jobIsPolledByUser',
        result: 'Failed',
        data,
        errorData: {
            reason: error.message || 'UnknownError',
        },
    })
}

export const emitTransformationJobPolledForPlanTelemetry = (
    telemetry: Telemetry,
    response: QNetGetTransformResponse
) => {
    const data: TransformationJobReceivedEvent = {
        category: CODETRANSFORM_CATEGORY,
        transformationJobId: response.TransformationJob?.jobId as string,
        transformationJobStatus: response.TransformationJob?.status as string,
        creationTime: response.TransformationJob?.creationTime as Date,
        startExecutionTime: response.TransformationJob?.startExecutionTime as Date,
        endExecutionTime: response.TransformationJob?.endExecutionTime as Date,
        reason: response.TransformationJob?.reason as string,
        transformationSpec: response.TransformationJob?.transformationSpec as TransformationSpec,
    }

    telemetry.emitMetric({
        name: 'codeTransform_jobIsPolledForPlanByUser',
        result: 'Succeeded',
        data: flattenMetric(data),
    })
}

export const emitTransformationJobPolledForPlanFailure = (
    telemetry: Telemetry,
    request: QNetGetTransformRequest,
    error: Error
) => {
    const data: TransformationFailureEvent = {
        category: CODETRANSFORM_CATEGORY,
        transformationJobId: request.TransformationJobId,
    }

    telemetry.emitMetric({
        name: 'codeTransform_jobIsPolledForPlanByUser',
        result: 'Failed',
        data,
        errorData: {
            reason: error.message || 'UnknownError',
        },
    })
}

export const emitTransformationPlanReceivedTelemetry = (
    telemetry: Telemetry,
    response: QNetGetTransformPlanResponse,
    jobId: string
) => {
    const data: TransformationPlanReceivedEvent = {
        category: CODETRANSFORM_CATEGORY,
        transformationJobId: jobId as string,
        transformationSteps: response.TransformationPlan.transformationSteps,
    }

    telemetry.emitMetric({
        name: 'codeTransform_planIsReceivedByUser',
        result: 'Succeeded',
        data: flattenMetric(data),
    })
}

export const emitTransformationPlanReceivedFailure = (
    telemetry: Telemetry,
    request: QNetGetTransformPlanRequest,
    error: Error
) => {
    const data: TransformationFailureEvent = {
        category: CODETRANSFORM_CATEGORY,
        transformationJobId: request.TransformationJobId,
    }

    telemetry.emitMetric({
        name: 'codeTransform_planIsReceivedByUser',
        result: 'Failed',
        data,
        errorData: {
            reason: error.message || 'UnknownError',
        },
    })
}

export const emitTransformationJobArtifactsDownloadedTelemetry = (
    telemetry: Telemetry,
    response: QNetDownloadArtifactsResponse,
    jobId: string
) => {
    const data: TransformationJobArtifactsDownloadedEvent = {
        category: CODETRANSFORM_CATEGORY,
        transformationJobId: jobId,
        error: response.Error,
    }

    telemetry.emitMetric({
        name: 'codeTransform_artifactsAreDownloadedByUser',
        result: 'Succeeded',
        data: flattenMetric(data),
    })
}

export const emitTransformationJobArtifactsDownloadedFailure = (
    telemetry: Telemetry,
    request: QNetDownloadArtifactsRequest,
    error: Error
) => {
    const data: TransformationFailureEvent = {
        category: CODETRANSFORM_CATEGORY,
        transformationJobId: request.TransformationJobId,
    }

    telemetry.emitMetric({
        name: 'codeTransform_artifactsAreDownloadedByUser',
        result: 'Failed',
        data,
        errorData: {
            reason: error.message || 'UnknownError',
        },
    })
}
