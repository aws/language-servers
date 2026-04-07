import {
    CancellationToken,
    ExecuteCommandParams,
    InitializeParams,
    Server,
} from '@aws/language-server-runtimes/server-interface'
import { AtxTokenServiceManager } from '../../shared/amazonQServiceManager/AtxTokenServiceManager'
import { ATXTransformHandler } from './atxTransformHandler'
import {
    AtxListOrCreateWorkspaceRequest,
    AtxListJobsRequest,
    AtxStartTransformRequest,
    AtxGetTransformInfoRequest,
    AtxStopJobRequest,
    AtxUploadPlanRequest,
    AtxSetCheckpointsRequest,
    AtxUpdateWorkspaceRequest,
    AtxUploadPackagesRequest,
    AtxListArtifactsRequest,
    AtxDownloadArtifactRequest,
    AtxGetJobDashboardRequest,
    AtxGetJobReportRequest,
} from './atxModels'

// ATX FES Commands - Consolidated APIs
const AtxListOrCreateWorkspaceCommand = 'aws/atxTransform/listOrCreateWorkspace'
const AtxListJobsCommand = 'aws/atxTransform/listJobs'
const AtxStartTransformCommand = 'aws/atxTransform/startTransform'
const AtxGetTransformInfoCommand = 'aws/atxTransform/getTransformInfo'
const AtxStopJobCommand = 'aws/atxTransform/stopJob'
const AtxUploadPlanCommand = 'aws/atxTransform/uploadPlan'
const AtxSetCheckpointsCommand = 'aws/atxTransform/setCheckpoints'
const AtxUpdateWorkspaceCommand = 'aws/atxTransform/updateWorkspace'
const AtxUploadPackagesCommand = 'aws/atxTransform/uploadPackages'
const AtxSendMessageCommand = 'aws/atxTransform/sendMessage'
const AtxListMessagesCommand = 'aws/atxTransform/listMessages'
const AtxBatchGetMessagesCommand = 'aws/atxTransform/batchGetMessages'
const AtxListArtifactsCommand = 'aws/atxTransform/listArtifacts'
const AtxDownloadArtifactCommand = 'aws/atxTransform/downloadArtifact'
const AtxGetJobDashboardCommand = 'aws/atxTransform/getJobDashboard'
const AtxGetJobReportCommand = 'aws/atxTransform/getJobReport'

export const AtxNetTransformServerToken =
    (): Server =>
    ({ workspace, logging, lsp, telemetry, runtime }) => {
        let atxTokenServiceManager: AtxTokenServiceManager
        let atxTransformHandler: ATXTransformHandler

        const runAtxTransformCommand = async (params: ExecuteCommandParams, _token: CancellationToken) => {
            try {
                switch (params.command) {
                    case AtxListOrCreateWorkspaceCommand: {
                        const request = params as AtxListOrCreateWorkspaceRequest
                        const result = await atxTransformHandler.listOrCreateWorkspace(request)
                        return result
                    }
                    case AtxListJobsCommand: {
                        const { WorkspaceId } = params as AtxListJobsRequest
                        if (!WorkspaceId) {
                            throw new Error('WorkspaceId is required for listJobs')
                        }
                        const result = await atxTransformHandler.listJobs(WorkspaceId)
                        return result
                    }
                    case AtxStartTransformCommand: {
                        const { WorkspaceId, JobName, InteractiveMode, StartTransformRequest } =
                            params as AtxStartTransformRequest

                        if (!WorkspaceId) {
                            throw new Error('WorkspaceId is required for startTransform')
                        }

                        const result = await atxTransformHandler.startTransform({
                            workspaceId: WorkspaceId,
                            jobName: JobName,
                            interactiveMode: InteractiveMode,
                            startTransformRequest: StartTransformRequest,
                        })

                        if (!result) {
                            throw new Error('StartTransform workflow failed')
                        }

                        return {
                            TransformationJobId: result.TransformationJobId,
                            ArtifactPath: result.ArtifactPath || '',
                            UploadId: result.UploadId || '',
                            UnSupportedProjects: [],
                            ContainsUnsupportedViews: false,
                        }
                    }
                    case AtxGetTransformInfoCommand: {
                        const request = params as AtxGetTransformInfoRequest

                        return await atxTransformHandler.getTransformInfo(request)
                    }
                    case AtxUploadPlanCommand: {
                        const request = params as AtxUploadPlanRequest
                        return await atxTransformHandler.uploadPlan(request)
                    }
                    case AtxStopJobCommand: {
                        const { WorkspaceId, JobId } = params as AtxStopJobRequest

                        if (!WorkspaceId || !JobId) {
                            throw new Error('WorkspaceId and JobId are required for stopJob')
                        }

                        const result = await atxTransformHandler.stopJob(WorkspaceId, JobId)
                        return { Status: result }
                    }
                    case AtxSetCheckpointsCommand: {
                        const { WorkspaceId, TransformationJobId, SolutionRootPath, Checkpoints, InteractiveMode } =
                            params as AtxSetCheckpointsRequest

                        logging.info(
                            `ATX: setCheckpoints params - InteractiveMode=${InteractiveMode}, Checkpoints=${JSON.stringify(Checkpoints)}`
                        )

                        return await atxTransformHandler.setCheckpoints(
                            WorkspaceId,
                            TransformationJobId,
                            SolutionRootPath,
                            Checkpoints || {},
                            InteractiveMode
                        )
                    }
                    case AtxUpdateWorkspaceCommand: {
                        const { WorkspaceId, TransformationJobId, StepId, SolutionRootPath } =
                            params as AtxUpdateWorkspaceRequest

                        return await atxTransformHandler.updateWorkspace(
                            WorkspaceId,
                            TransformationJobId,
                            SolutionRootPath,
                            StepId
                        )
                    }
                    case AtxUploadPackagesCommand: {
                        const request = params as AtxUploadPackagesRequest
                        return await atxTransformHandler.uploadPackages(request)
                    }
                    case AtxSendMessageCommand: {
                        const { workspaceId, jobId, text, skipPolling } = params as any
                        return await atxTransformHandler.sendMessage({
                            workspaceId,
                            jobId,
                            text,
                            skipPolling,
                        })
                    }
                    case AtxListMessagesCommand: {
                        const { workspaceId, jobId, maxResults, nextToken, startTimestamp } = params as any
                        return await atxTransformHandler.listMessages({
                            workspaceId,
                            jobId,
                            maxResults,
                            nextToken,
                            startTimestamp: startTimestamp ? new Date(startTimestamp) : undefined,
                        })
                    }
                    case AtxBatchGetMessagesCommand: {
                        const { workspaceId, messageIds } = params as any
                        return await atxTransformHandler.batchGetMessages({
                            workspaceId,
                            messageIds,
                        })
                    }
                    case AtxListArtifactsCommand: {
                        const { WorkspaceId, TransformationJobId } = params as AtxListArtifactsRequest
                        logging.log(
                            `ATX: ListArtifacts command received - WorkspaceId: ${WorkspaceId}, JobId: ${TransformationJobId}`
                        )
                        return await atxTransformHandler.listArtifactsForDownload(WorkspaceId, TransformationJobId)
                    }
                    case AtxDownloadArtifactCommand: {
                        const { WorkspaceId, TransformationJobId, ArtifactId, ArtifactName, SavePath } =
                            params as AtxDownloadArtifactRequest
                        return await atxTransformHandler.downloadArtifactToPath(
                            WorkspaceId,
                            TransformationJobId,
                            ArtifactId,
                            SavePath,
                            ArtifactName
                        )
                    }
                    case AtxGetJobDashboardCommand: {
                        const { WorkspaceId, JobId } = params as AtxGetJobDashboardRequest

                        if (!WorkspaceId || !JobId) {
                            throw new Error('WorkspaceId and JobId are required for getJobDashboard')
                        }

                        return await atxTransformHandler.getJobDashboard(WorkspaceId, JobId)
                    }
                    case AtxGetJobReportCommand: {
                        const { WorkspaceId, JobId, ArtifactId } = params as AtxGetJobReportRequest

                        if (!WorkspaceId || !JobId || !ArtifactId) {
                            throw new Error('WorkspaceId, JobId and ArtifactId are required for getJobReport')
                        }

                        return await atxTransformHandler.getJobReport(WorkspaceId, JobId, ArtifactId)
                    }
                    default: {
                        throw new Error(`Unknown ATX FES command: ${params.command}`)
                    }
                }
            } catch (e: any) {
                logging.error(`ATXTransformServer: Error executing command: ${String(e)}`)
            }
        }

        const onExecuteCommandHandler = async (
            params: ExecuteCommandParams,
            _token: CancellationToken
        ): Promise<any> => {
            logging.info(`Received ATX FES command: ${params.command}`)
            return runAtxTransformCommand(params, _token)
        }

        const onInitializeHandler = async (params: InitializeParams) => {
            return {
                capabilities: {
                    executeCommandProvider: {
                        commands: [
                            AtxListOrCreateWorkspaceCommand,
                            AtxListJobsCommand,
                            AtxStartTransformCommand,
                            AtxGetTransformInfoCommand,
                            AtxUploadPlanCommand,
                            AtxStopJobCommand,
                            AtxSetCheckpointsCommand,
                            AtxUpdateWorkspaceCommand,
                            AtxUploadPackagesCommand,
                            AtxSendMessageCommand,
                            AtxListMessagesCommand,
                            AtxBatchGetMessagesCommand,
                            AtxListArtifactsCommand,
                            AtxDownloadArtifactCommand,
                            AtxGetJobDashboardCommand,
                            AtxGetJobReportCommand,
                        ],
                    },
                },
            }
        }

        const onInitializedHandler = () => {
            atxTokenServiceManager = AtxTokenServiceManager.getInstance()
            atxTransformHandler = new ATXTransformHandler(atxTokenServiceManager, workspace, logging, runtime)
        }

        lsp.addInitializer(onInitializeHandler)
        lsp.onInitialized(onInitializedHandler)
        lsp.onExecuteCommand(onExecuteCommandHandler)

        return () => {}
    }
