import {
    CancellationToken,
    ExecuteCommandParams,
    InitializeParams,
    Server,
} from '@aws/language-server-runtimes/server-interface'
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
    emitCancelPollingTelemetry,
    emitCancelPollingFailure,
} from './metrics'
import {
    CancelTransformRequest,
    DownloadArtifactsRequest,
    GetTransformPlanRequest,
    GetTransformRequest,
    StartTransformRequest,
    GetEditablePlanRequest,
    UploadEditablePlanRequest,
} from './models'
import { TransformHandler } from './transformHandler'

export const validStatesForGettingPlan = ['COMPLETED', 'PARTIALLY_COMPLETED', 'PLANNED', 'TRANSFORMING', 'TRANSFORMED']
export const validStatesForComplete = ['COMPLETED']
export const failureStates = ['FAILED', 'STOPPED', 'REJECTED']
const StartTransformCommand = 'aws/qNetTransform/startTransform'
const GetTransformCommand = 'aws/qNetTransform/getTransform'
const PollTransformCommand = 'aws/qNetTransform/pollTransform'
const PollTransformForPlanCommand = 'aws/qNetTransform/pollTransformForPlan'
const GetTransformPlanCommand = 'aws/qNetTransform/getTransformPlan'
const CancelTransformCommand = 'aws/qNetTransform/cancelTransform'
const DownloadArtifactsCommand = 'aws/qNetTransform/downloadArtifacts'
const CancelPollingCommand = 'aws/qNetTransform/cancelPolling'
const ListWorkspacesCommand = 'aws/qNetTransform/listWorkspaces'
const CreateWorkspaceCommand = 'aws/qNetTransform/createWorkspace'
const GetEditablePlanCommand = 'aws/qNetTransform/getEditablePlan'
const UploadEditablePlanCommand = 'aws/qNetTransform/uploadEditablePlan'
import { SDKInitializator } from '@aws/language-server-runtimes/server-interface'
import { AmazonQTokenServiceManager } from '../../shared/amazonQServiceManager/AmazonQTokenServiceManager'

/**
 *
 * @param createService Inject service instance based on credentials provider.
 * @returns  NetTransform server
 */
export const QNetTransformServerToken =
    (): Server =>
    ({ workspace, logging, lsp, telemetry, runtime }) => {
        let amazonQServiceManager: AmazonQTokenServiceManager
        let transformHandler: TransformHandler

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

                        const response = await transformHandler.downloadExportResultArchive(
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
                    case CancelPollingCommand: {
                        await transformHandler.cancelPollingAsync()
                        emitCancelPollingTelemetry(telemetry)
                    }
                    case ListWorkspacesCommand: {
                        const workspaces = await transformHandler.listWorkspaces()
                        return { workspaces }
                    }
                    case CreateWorkspaceCommand: {
                        const request = params.arguments?.[0] as { workspaceName?: string }
                        const workspaceName = request?.workspaceName || null // Let backend generate default name

                        try {
                            const workspaceId = await transformHandler.createWorkspace(workspaceName)
                            if (workspaceId) {
                                logging.log(`LSP: CreateWorkspace returned workspaceId: ${workspaceId}`)
                                return { workspaceId }
                            } else {
                                throw new Error('Failed to create workspace - API returned null')
                            }
                        } catch (error) {
                            logging.error(
                                `LSP: CreateWorkspace error: ${error instanceof Error ? error.message : 'Unknown error'}`
                            )
                            throw new Error(
                                `Workspace creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
                            )
                        }
                    }
                    case GetEditablePlanCommand: {
                        const request = params as GetEditablePlanRequest
                        const response = await transformHandler.getEditablePlan(request)

                        return response
                    }
                    case UploadEditablePlanCommand: {
                        const request = params as UploadEditablePlanRequest
                        const response = await transformHandler.uploadEditablePlan(request)

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
                    case CancelPollingCommand: {
                        emitCancelPollingFailure(telemetry, e)
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

        const onInitializeHandler = async (params: InitializeParams) => {
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
                            CancelPollingCommand,
                            ListWorkspacesCommand,
                            CreateWorkspaceCommand,
                            GetEditablePlanCommand,
                            UploadEditablePlanCommand,
                        ],
                    },
                },
            }
        }

        const onInitializedHandler = () => {
            amazonQServiceManager = AmazonQTokenServiceManager.getInstance()

            transformHandler = new TransformHandler(amazonQServiceManager, workspace, logging, runtime)
        }

        lsp.addInitializer(onInitializeHandler)
        lsp.onInitialized(onInitializedHandler)
        lsp.onExecuteCommand(onExecuteCommandHandler)

        return () => {}
    }
