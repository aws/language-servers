import {
    CancellationToken,
    CredentialsProvider,
    ExecuteCommandParams,
    Server,
    Telemetry,
} from '@aws/language-server-runtimes/server-interface'
import { StreamingClient, downloadExportResultArchive } from '../client/streamingClient/codewhispererStreamingClient'
import { TransformationSpec } from '../client/token/codewhispererbearertokenclient'
import { CodeWhispererServiceToken } from './codeWhispererService'
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
import { TransformHandler } from './netTransform/transformHandler'
import {
    TransformationFailureEvent,
    TransformationJobArtifactsDownloadedEvent,
    TransformationJobCancelledEvent,
    TransformationJobReceivedEvent,
    TransformationJobStartedEvent,
    TransformationPlanReceivedEvent,
} from './telemetry/types'

export const validStatesForGettingPlan = ['COMPLETED', 'PARTIALLY_COMPLETED', 'PLANNED', 'TRANSFORMING', 'TRANSFORMED']
export const validStatesForComplete = ['COMPLETED']
export const failureStates = ['FAILED', 'STOPPING', 'STOPPED', 'REJECTED']

const CODETRANSFORM_CATEGORY = 'codeTransform'

const flattenMetric = (obj: any, prefix = '') => {
    const flattened: any = {}

    Object.keys(obj).forEach(key => {
        const value = obj[key]

        if (prefix !== '') {
            key = '_' + key
        }

        if (typeof value === 'object' && value !== null) {
            Object.assign(flattened, flattenMetric(value, prefix + key))
        } else {
            flattened[prefix + key] = value
        }
    })

    return flattened
}

const emitTransformationJobStartedTelemetry = (telemetry: Telemetry, response: QNetStartTransformResponse) => {
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

const emitTransformationJobStartedFailure = (
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

const emitTransformationJobReceivedTelemetry = (telemetry: Telemetry, response: QNetGetTransformResponse) => {
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

const emitTransformationJobReceivedFailure = (telemetry: Telemetry, request: QNetGetTransformRequest, error: Error) => {
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

const emitTransformationJobCancelledTelemetry = (
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

const emitTransformationJobCancelledFailure = (
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

const emitTransformationJobPolledTelemetry = (telemetry: Telemetry, response: QNetGetTransformResponse) => {
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

const emitTransformationJobPolledFailure = (telemetry: Telemetry, request: QNetGetTransformRequest, error: Error) => {
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

const emitTransformationJobPolledForPlanTelemetry = (telemetry: Telemetry, response: QNetGetTransformResponse) => {
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

const emitTransformationJobPolledForPlanFailure = (
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

const emitTransformationPlanReceivedTelemetry = (
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

const emitTransformationPlanReceivedFailure = (
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

const emitTransformationJobArtifactsDownloadedTelemetry = (
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

const emitTransformationJobArtifactsDownloadedFailure = (
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

/**
 *
 * @param createService Inject service instance based on credentials provider.
 * @returns  NetTransform server
 */
export const NetTransformServerFactory: (
    createService: (credentialsProvider: CredentialsProvider) => CodeWhispererServiceToken
) => Server =
    createService =>
    ({ credentialsProvider, lsp, workspace, telemetry, logging }) => {
        const service = createService(credentialsProvider)
        const onExecuteCommandHandler = async (
            params: ExecuteCommandParams,
            _token: CancellationToken
        ): Promise<any> => {
            try {
                const client = createService(credentialsProvider)
                const transformHandler = new TransformHandler(client, workspace, logging)
                switch (params.command) {
                    case 'aws/qNetTransform/startTransform': {
                        const userInputrequest = params as QNetStartTransformRequest
                        logging.log('prepare artifact for solution: ' + userInputrequest.SolutionRootPath)
                        const response = await transformHandler.startTransformation(userInputrequest)
                        emitTransformationJobStartedTelemetry(telemetry, response)
                        return response
                    }
                    case 'aws/qNetTransform/getTransform': {
                        const request = params as QNetGetTransformRequest
                        logging.log('Calling getTransform request with job Id: ' + request.TransformationJobId)
                        const response = await transformHandler.getTransformation(request)
                        emitTransformationJobReceivedTelemetry(telemetry, response)
                        return response
                    }
                    case 'aws/qNetTransform/pollTransform': {
                        const request = params as QNetGetTransformRequest
                        logging.log('Calling pollTransform request with job Id: ' + request.TransformationJobId)
                        const response = await transformHandler.pollTransformation(
                            request,
                            validStatesForComplete,
                            failureStates
                        )
                        logging.log(
                            'Transformation job for job Id' +
                                request.TransformationJobId +
                                ' is ' +
                                JSON.stringify(response)
                        )
                        emitTransformationJobPolledTelemetry(telemetry, response)
                        return response
                    }
                    case 'aws/qNetTransform/pollTransformForPlan': {
                        const request = params as QNetGetTransformRequest
                        logging.log('Calling pollTransformForPlan request with job Id: ' + request.TransformationJobId)
                        const response = await transformHandler.pollTransformation(
                            request,
                            validStatesForGettingPlan,
                            failureStates
                        )
                        logging.log(
                            'Transformation job for job Id' +
                                request.TransformationJobId +
                                ' is ' +
                                JSON.stringify(response)
                        )
                        emitTransformationJobPolledForPlanTelemetry(telemetry, response)
                        return response
                    }
                    case 'aws/qNetTransform/getTransformPlan': {
                        const request = params as QNetGetTransformPlanRequest
                        logging.log('Calling getTransformPlan request with job Id: ' + request.TransformationJobId)
                        const response = await transformHandler.getTransformationPlan(request)
                        logging.log(
                            'Transformation plan for job Id' +
                                request.TransformationJobId +
                                ' is ' +
                                JSON.stringify(response)
                        )
                        emitTransformationPlanReceivedTelemetry(telemetry, response, request.TransformationJobId)
                        return response
                    }
                    case 'aws/qNetTransform/cancelTransform': {
                        const request = params as QNetCancelTransformRequest
                        logging.log('request job ID: ' + request.TransformationJobId)
                        const response = await transformHandler.cancelTransformation(request)
                        emitTransformationJobCancelledTelemetry(telemetry, response, request.TransformationJobId)
                        return response
                    }
                    case 'aws/qNetTransform/downloadArtifacts': {
                        const request = params as QNetDownloadArtifactsRequest
                        const cwStreamingClientInstance = new StreamingClient()
                        const cwStreamingClient =
                            await cwStreamingClientInstance.getStreamingClient(credentialsProvider)
                        logging.log('Calling Download Archive  with job Id: ' + request.TransformationJobId)
                        const response = await downloadExportResultArchive(
                            cwStreamingClient,
                            request.TransformationJobId,
                            workspace
                        )
                        emitTransformationJobArtifactsDownloadedTelemetry(
                            telemetry,
                            response,
                            request.TransformationJobId
                        )
                        return response
                    }
                }
                return
            } catch (e: any) {
                logging.log('Server side error while executing transformer Command ' + e)

                switch (params.command) {
                    case 'aws/qNetTransform/startTransform': {
                        const request = params as QNetStartTransformRequest
                        emitTransformationJobStartedFailure(telemetry, request, e)
                        break
                    }
                    case 'aws/qNetTransform/getTransform': {
                        const request = params as QNetGetTransformRequest
                        emitTransformationJobReceivedFailure(telemetry, request, e)
                        break
                    }
                    case 'aws/qNetTransform/pollTransform': {
                        const request = params as QNetGetTransformRequest
                        emitTransformationJobPolledFailure(telemetry, request, e)
                        break
                    }
                    case 'aws/qNetTransform/pollTransformForPlan': {
                        const request = params as QNetGetTransformRequest
                        emitTransformationJobPolledForPlanFailure(telemetry, request, e)
                        break
                    }
                    case 'aws/qNetTransform/getTransformPlan': {
                        const request = params as QNetGetTransformPlanRequest
                        emitTransformationPlanReceivedFailure(telemetry, request, e)
                        break
                    }
                    case 'aws/qNetTransform/cancelTransform': {
                        const request = params as QNetCancelTransformRequest
                        emitTransformationJobCancelledFailure(telemetry, request, e)
                        break
                    }
                    case 'aws/qNetTransform/downloadArtifacts': {
                        const request = params as QNetDownloadArtifactsRequest
                        emitTransformationJobArtifactsDownloadedFailure(telemetry, request, e)
                        break
                    }
                }
            }
        }

        // Do the thing
        lsp.onExecuteCommand(onExecuteCommandHandler)

        // Disposable
        return () => {
            // Do nothing
        }
    }

/**
 * Default NetTransformServer using Token authentication.
 */
export const NetTransformServer = NetTransformServerFactory(
    credentialsProvider => new CodeWhispererServiceToken(credentialsProvider, {})
)
