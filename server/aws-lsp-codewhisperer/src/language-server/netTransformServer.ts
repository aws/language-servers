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
} from './netTransform/metrics'
import {
    CancelTransformRequest,
    DownloadArtifactsRequest,
    GetTransformPlanRequest,
    GetTransformRequest,
    StartTransformRequest,
} from './netTransform/models'
import { TransformHandler } from './netTransform/transformHandler'

export const validStatesForGettingPlan = ['COMPLETED', 'PARTIALLY_COMPLETED', 'PLANNED', 'TRANSFORMING', 'TRANSFORMED']
export const validStatesForComplete = ['COMPLETED']
export const failureStates = ['FAILED', 'STOPPING', 'STOPPED', 'REJECTED']
const StartTransformCommand = 'aws/qNetTransform/startTransform'
const GetTransformCommand = 'aws/qNetTransform/getTransform'
const PollTransformCommand = 'aws/qNetTransform/pollTransform'
const PollTransformForPlanCommand = 'aws/qNetTransform/pollTransformForPlan'
const GetTransformPlanCommand = 'aws/qNetTransform/getTransformPlan'
const CancelTransformCommand = 'aws/qNetTransform/cancelTransform'
const DownloadArtifactsCommand = 'aws/qNetTransform/downloadArtifacts'
const dryRunEnv = process.env.DRY_RUN
const dryRun = dryRunEnv !== undefined ? dryRunEnv.toLowerCase() === 'true' : false
/**
 *
 * @param createService Inject service instance based on credentials provider.
 * @returns  NetTransform server
 */
export const QNetTransformServerToken =
    (service: (credentialsProvider: CredentialsProvider) => CodeWhispererServiceToken): Server =>
    ({ credentialsProvider, workspace, logging, lsp, telemetry }) => {
        const codewhispererclient = service(credentialsProvider)
        const transformHandler = new TransformHandler(codewhispererclient, workspace, logging, dryRun)
        const runTransformCommand = async (params: ExecuteCommandParams, _token: CancellationToken) => {
            try {
                switch (params.command) {
                    case StartTransformCommand: {
                        const request = params as StartTransformRequest
                        logging.log('Calling startTransformRequest: ' + request.SolutionRootPath)
                        const response = await transformHandler.startTransformation(request)
                        emitTransformationJobStartedTelemetry(telemetry, response)
                        return response
                    }
                    case GetTransformCommand: {
                        const request = params as GetTransformRequest
                        logging.log('Calling getTransform request with job Id: ' + request.TransformationJobId)
                        const response = await transformHandler.getTransformation(request)
                        emitTransformationJobReceivedTelemetry(telemetry, response)
                        return response
                    }
                    case PollTransformCommand: {
                        const request = params as GetTransformRequest
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
                    case PollTransformForPlanCommand: {
                        const request = params as GetTransformRequest
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
                    case GetTransformPlanCommand: {
                        const request = params as GetTransformPlanRequest
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
                    case CancelTransformCommand: {
                        const request = params as CancelTransformRequest
                        logging.log('request job ID: ' + request.TransformationJobId)
                        const response = await transformHandler.cancelTransformation(request)
                        emitTransformationJobCancelledTelemetry(telemetry, response, request.TransformationJobId)
                        return response
                    }
                    case DownloadArtifactsCommand: {
                        const request = params as DownloadArtifactsRequest
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
                    case StartTransformCommand: {
                        const request = params as StartTransformRequest
                        emitTransformationJobStartedFailure(telemetry, request, e)
                        break
                    }
                    case GetTransformCommand: {
                        const request = params as GetTransformRequest
                        emitTransformationJobReceivedFailure(telemetry, request, e)
                        break
                    }
                    case PollTransformCommand: {
                        const request = params as GetTransformRequest
                        emitTransformationJobPolledFailure(telemetry, request, e)
                        break
                    }
                    case PollTransformForPlanCommand: {
                        const request = params as GetTransformRequest
                        emitTransformationJobPolledForPlanFailure(telemetry, request, e)
                        break
                    }
                    case GetTransformPlanCommand: {
                        const request = params as GetTransformPlanRequest
                        emitTransformationPlanReceivedFailure(telemetry, request, e)
                        break
                    }
                    case CancelTransformCommand: {
                        const request = params as CancelTransformRequest
                        emitTransformationJobCancelledFailure(telemetry, request, e)
                        break
                    }
                    case DownloadArtifactsCommand: {
                        const request = params as DownloadArtifactsRequest
                        emitTransformationJobArtifactsDownloadedFailure(telemetry, request, e)
                        break
                    }
                }
            }
        }

        const onExecuteCommandHandler = async (
            params: ExecuteCommandParams,
            _token: CancellationToken
        ): Promise<any> => {
            logging.log(params.command)
            runTransformCommand(params, _token)
        }
        const onInitializeHandler = () => {
            return {
                capabilities: {
                    executeCommandProvider: {
                        commands: [
                            StartTransformCommand,
                            GetTransformCommand,
                            PollTransformCommand,
                            PollTransformForPlanCommand,
                            GetTransformPlanCommand,
                            CancelTransformCommand,
                            DownloadArtifactsCommand,
                        ],
                    },
                },
            }
        }
        lsp.addInitializer(onInitializeHandler)
        lsp.onExecuteCommand(onExecuteCommandHandler)

        return () => {}
    }
