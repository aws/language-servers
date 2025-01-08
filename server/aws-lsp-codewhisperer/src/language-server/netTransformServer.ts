import {
    CancellationToken,
    CredentialsProvider,
    ExecuteCommandParams,
    InitializeParams,
    Server,
    Workspace,
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
import { CodeWhispererStreamingClientConfig } from '@amzn/codewhisperer-streaming'
import { getUserAgent } from './utilities/telemetryUtils'

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
import { DEFAULT_AWS_Q_REGION, DEFAULT_AWS_Q_ENDPOINT_URL } from '../constants'

/**
 *
 * @param createService Inject service instance based on credentials provider.
 * @returns  NetTransform server
 */
export const QNetTransformServerToken =
    (
        service: (
            credentialsProvider: CredentialsProvider,
            workspace: Workspace,
            awsQRegion: string,
            awsQEndpointUrl: string
        ) => CodeWhispererServiceToken
    ): Server =>
    ({ credentialsProvider, workspace, logging, lsp, telemetry, runtime }) => {
        const codewhispererclient = service(
            credentialsProvider,
            workspace,
            runtime.getConfiguration('AWS_Q_REGION') ?? DEFAULT_AWS_Q_REGION,
            runtime.getConfiguration('AWS_Q_ENDPOINT_URL') ?? DEFAULT_AWS_Q_ENDPOINT_URL
        )
        const transformHandler = new TransformHandler(codewhispererclient, workspace, logging)
        const runTransformCommand = async (params: ExecuteCommandParams, _token: CancellationToken) => {
            try {
                switch (params.command) {
                    case StartTransformCommand: {
                        const request = params as StartTransformRequest
                        const response = await transformHandler.startTransformation(request)
                        emitTransformationJobStartedTelemetry(telemetry, response)
                        return response
                    }
                    case GetTransformCommand: {
                        const request = params as GetTransformRequest
                        const response = await transformHandler.getTransformation(request)
                        if (response != null) {
                            emitTransformationJobReceivedTelemetry(telemetry, response)
                        }
                        return response
                    }
                    case PollTransformCommand: {
                        const request = params as GetTransformRequest
                        const response = await transformHandler.pollTransformation(
                            request,
                            validStatesForComplete,
                            failureStates
                        )
                        emitTransformationJobPolledTelemetry(telemetry, response)
                        return response
                    }
                    case PollTransformForPlanCommand: {
                        const request = params as GetTransformRequest
                        const response = await transformHandler.pollTransformation(
                            request,
                            validStatesForGettingPlan,
                            failureStates
                        )
                        emitTransformationJobPolledForPlanTelemetry(telemetry, response)
                        return response
                    }
                    case GetTransformPlanCommand: {
                        const request = params as GetTransformPlanRequest
                        const response = await transformHandler.getTransformationPlan(request)
                        emitTransformationPlanReceivedTelemetry(telemetry, response, request.TransformationJobId)
                        return response
                    }
                    case CancelTransformCommand: {
                        const request = params as CancelTransformRequest
                        const response = await transformHandler.cancelTransformation(request)
                        emitTransformationJobCancelledTelemetry(telemetry, response, request.TransformationJobId)
                        return response
                    }
                    case DownloadArtifactsCommand: {
                        const request = params as DownloadArtifactsRequest
                        const cwStreamingClientInstance = new StreamingClient()
                        const cwStreamingClient = await cwStreamingClientInstance.getStreamingClient(
                            credentialsProvider,
                            runtime.getConfiguration('AWS_Q_REGION') ?? DEFAULT_AWS_Q_REGION,
                            runtime.getConfiguration('AWS_Q_ENDPOINT_URL') ?? DEFAULT_AWS_Q_ENDPOINT_URL,
                            customCWClientConfig
                        )

                        const response = await transformHandler.downloadExportResultArchive(
                            cwStreamingClient,
                            request.TransformationJobId,
                            request.SolutionRootPath
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
            return runTransformCommand(params, _token)
        }

        const customCWClientConfig: CodeWhispererStreamingClientConfig = {}
        const onInitializeHandler = (params: InitializeParams) => {
            // Cache user agent to reuse between commands calls
            customCWClientConfig.customUserAgent = getUserAgent(params, runtime.serverInfo)

            codewhispererclient.updateClientConfig({
                customUserAgent: customCWClientConfig.customUserAgent,
            })

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
