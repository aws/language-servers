import {
    CancellationToken,
    CredentialsProvider,
    ExecuteCommandParams,
    Server,
} from '@aws/language-server-runtimes/server-interface'
import { StreamingClient } from '../client/streamingClient/codewhispererStreamingClient'
import { CodeWhispererServiceToken } from './codeWhispererService'
import {
    emitTransformationJobArtifactsDownloadedFailure,
    emitTransformationJobArtifactsDownloadedTelemetry,
    emitTransformationJobCancelledFailure,
    emitTransformationJobCancelledTelemetry,
    emitTransformationJobPolledFailure,
    emitTransformationJobPolledForPlanFailure,
    emitTransformationJobPolledForPlanTelemetry,
    emitTransformationJobPolledTelemetry,
    emitTransformationJobReceivedFailure,
    emitTransformationJobReceivedTelemetry,
    emitTransformationJobStartedFailure,
    emitTransformationJobStartedTelemetry,
    emitTransformationPlanReceivedFailure,
    emitTransformationPlanReceivedTelemetry,
} from './metrics'
import {
    QNetCancelTransformRequest,
    QNetDownloadArtifactsRequest,
    QNetGetTransformPlanRequest,
    QNetGetTransformRequest,
    QNetStartTransformRequest,
} from './netTransform/models'
import { TransformHandler } from './netTransform/transformHandler'

export const validStatesForGettingPlan = ['COMPLETED', 'PARTIALLY_COMPLETED', 'PLANNED', 'TRANSFORMING', 'TRANSFORMED']
export const validStatesForComplete = ['COMPLETED']
export const failureStates = ['FAILED', 'STOPPING', 'STOPPED', 'REJECTED']

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
                        const response = await transformHandler.downloadExportResultArchive(
                            cwStreamingClient,
                            request.TransformationJobId
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
