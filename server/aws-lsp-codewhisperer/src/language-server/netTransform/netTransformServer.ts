import {
    CancellationToken,
    CredentialsProvider,
    ExecuteCommandParams,
    InitializeParams,
    Server,
    Workspace,
    Logging,
} from '@aws/language-server-runtimes/server-interface'
import { StreamingClient } from '../../client/streamingClient/codewhispererStreamingClient'
import { CodeWhispererServiceToken } from '../../shared/codeWhispererService'
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
    CancelTransformRequest,
    DownloadArtifactsRequest,
    GetTransformPlanRequest,
    GetTransformRequest,
    StartTransformRequest,
} from './models'
import { TransformHandler } from './transformHandler'
import { CodeWhispererStreamingClientConfig } from '@amzn/codewhisperer-streaming'
import { getUserAgent } from '../../shared/telemetryUtils'

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
import {
    DEFAULT_AWS_Q_REGION,
    DEFAULT_AWS_Q_ENDPOINT_URL,
    AWS_Q_REGION_ENV_VAR,
    AWS_Q_ENDPOINT_URL_ENV_VAR,
} from '../../shared/constants'
import { SDKInitializator } from '@aws/language-server-runtimes/server-interface'

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
            logging: Logging,
            awsQRegion: string,
            awsQEndpointUrl: string,
            sdkInitializator: SDKInitializator
        ) => CodeWhispererServiceToken
    ): Server =>
    ({ credentialsProvider, workspace, logging, lsp, telemetry, runtime, sdkInitializator }) => {
        const codewhispererclient = service(
            credentialsProvider,
            workspace,
            logging,
            runtime.getConfiguration(AWS_Q_REGION_ENV_VAR) ?? DEFAULT_AWS_Q_REGION,
            runtime.getConfiguration(AWS_Q_ENDPOINT_URL_ENV_VAR) ?? DEFAULT_AWS_Q_ENDPOINT_URL,
            sdkInitializator
        )
        const transformHandler = new TransformHandler(codewhispererclient, workspace, logging, runtime)
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
                            runtime.getConfiguration(AWS_Q_REGION_ENV_VAR) ?? DEFAULT_AWS_Q_REGION,
                            runtime.getConfiguration(AWS_Q_ENDPOINT_URL_ENV_VAR) ?? DEFAULT_AWS_Q_ENDPOINT_URL,
                            sdkInitializator,
                            logging,
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
