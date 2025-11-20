import {
    CancellationToken,
    ExecuteCommandParams,
    InitializeParams,
    Server,
} from '@aws/language-server-runtimes/server-interface'
import { AtxTokenServiceManager } from '../../shared/amazonQServiceManager/AtxTokenServiceManager'
import { ATXTransformHandler } from './atxTransformHandler'

import {
    AtxCreateWorkspaceRequest,
    AtxCreateJobRequest,
    AtxCreateArtifactUploadUrlRequest,
    AtxCompleteArtifactUploadRequest,
    AtxStartJobRequest,
    AtxGetJobRequest,
    AtxStopJobRequest,
    AtxDownloadArtifactUrlRequest,
    AtxListArtifactsRequest,
    AtxListJobPlanStepsRequest,
    AtxCreateZipRequest,
    AtxUploadArtifactToS3Request,
    AtxStartTransformRequest,
    AtxListOrCreateWorkspaceRequest,
    AtxGetJobStatusInfoRequest,
    CategoryType as CategoryTypeEnum,
    FileType as FileTypeEnum,
} from './atxModels'

// ATX Workspace Commands
const AtxListWorkspacesCommand = 'aws/atxTransform/listWorkspaces'
const AtxCreateWorkspaceCommand = 'aws/atxTransform/createWorkspace'
const AtxCreateJobCommand = 'aws/atxTransform/createJob'
const AtxCreateArtifactUploadUrlCommand = 'aws/atxTransform/createArtifactUploadUrl'
const AtxCompleteArtifactUploadCommand = 'aws/atxTransform/completeArtifactUpload'
const AtxStartJobCommand = 'aws/atxTransform/startJob'
const AtxGetJobCommand = 'aws/atxTransform/getJob'
const AtxStopJobCommand = 'aws/atxTransform/stopJob'
const AtxDownloadArtifactUrlCommand = 'aws/atxTransform/downloadArtifactUrl'
const AtxListArtifactsCommand = 'aws/atxTransform/listArtifacts'
const AtxListJobPlanStepsCommand = 'aws/atxTransform/listJobPlanSteps'
const AtxCreateZipCommand = 'aws/atxTransform/createZip'
const AtxUploadArtifactToS3Command = 'aws/atxTransform/uploadArtifactToS3'
const AtxStartTransformCommand = 'aws/atxTransform/startTransform'
const AtxListOrCreateWorkspaceCommand = 'aws/atxTransform/listOrCreateWorkspace'
const AtxGetJobStatusInfoCommand = 'aws/atxTransform/getJobStatusInfo'

// ATX FES Commands - Transform Operations Only (profiles handled by transformConfigurationServer)

// TODO: Phase 2 - Add ATX FES Transform APIs
// const AtxVerifySessionCommand = 'aws/atxNetTransform/verifySession' // LSP-only implementation
// const AtxListWorkspacesCommand = 'aws/atxNetTransform/listWorkspaces'
// const AtxCreateWorkspaceCommand = 'aws/atxNetTransform/createWorkspace'
// const AtxCreateJobCommand = 'aws/atxNetTransform/createJob'
// const AtxStartJobCommand = 'aws/atxNetTransform/startJob'
// const AtxGetJobCommand = 'aws/atxNetTransform/getJob'
// const AtxStopJobCommand = 'aws/atxNetTransform/stopJob'
// const AtxCreateUploadArtifactURLCommand = 'aws/atxNetTransform/createUploadArtifactURL'
// const AtxCompleteUploadArtifactURLCommand = 'aws/atxNetTransform/completeUploadArtifactURL'
// const AtxCreateDownloadArtifactURLCommand = 'aws/atxNetTransform/createDownloadArtifactURL'
// const AtxListArtifactsCommand = 'aws/atxNetTransform/listArtifacts'
// const AtxListJobStepPlansCommand = 'aws/atxNetTransform/listJobStepPlans'

export const AtxNetTransformServerToken =
    (): Server =>
    ({ workspace, logging, lsp, telemetry, runtime }) => {
        let atxTokenServiceManager: AtxTokenServiceManager
        let atxTransformHandler: ATXTransformHandler

        const runAtxTransformCommand = async (params: ExecuteCommandParams, _token: CancellationToken) => {
            try {
                switch (params.command) {
                    case AtxListWorkspacesCommand: {
                        logging.log('ATX: Handling listWorkspaces command')
                        const workspaces = await atxTransformHandler.listWorkspaces()
                        return { workspaces }
                    }
                    case AtxCreateWorkspaceCommand: {
                        logging.log('ATX: Handling createWorkspace command')
                        const { WorkspaceName } = params as AtxCreateWorkspaceRequest

                        const workspaceId = await atxTransformHandler.createWorkspace(WorkspaceName || null)
                        if (workspaceId) {
                            logging.log(`ATX: CreateWorkspace returned workspaceId: ${workspaceId}`)
                            return { workspaceId }
                        } else {
                            throw new Error('Failed to create workspace - API returned null')
                        }
                    }
                    case AtxCreateJobCommand: {
                        try {
                            logging.log('ATX: Handling createJob command')

                            const { WorkspaceId, JobName } = params as AtxCreateJobRequest

                            if (!WorkspaceId) {
                                throw new Error('WorkspaceId is required for createJob')
                            }

                            const jobResult = await atxTransformHandler.createJob({
                                workspaceId: WorkspaceId,
                                jobName: JobName,
                            })
                            if (jobResult) {
                                logging.log(
                                    `ATX: CreateJob returned jobId: ${jobResult.jobId}, status: ${jobResult.status}`
                                )
                                return jobResult
                            } else {
                                throw new Error('Failed to create job - API returned null')
                            }
                        } catch (error) {
                            logging.error(
                                `ATX: CreateJob failed: ${error instanceof Error ? error.message : 'Unknown error'}`
                            )
                            throw error
                        }
                    }
                    case AtxCreateArtifactUploadUrlCommand: {
                        logging.log('ATX: Handling createArtifactUploadUrl command')
                        const { WorkspaceId, JobId, FilePath, CategoryType, FileType } =
                            params as AtxCreateArtifactUploadUrlRequest

                        if (!WorkspaceId || !JobId || !FilePath || !CategoryType || !FileType) {
                            throw new Error(
                                'WorkspaceId, JobId, FilePath, CategoryType, and FileType are required for createArtifactUploadUrl'
                            )
                        }

                        const uploadResult = await atxTransformHandler.createArtifactUploadUrl(
                            WorkspaceId,
                            JobId,
                            FilePath,
                            CategoryType || CategoryTypeEnum.CUSTOMER_INPUT,
                            FileType || FileTypeEnum.ZIP
                        )
                        if (uploadResult) {
                            logging.log(`ATX: CreateArtifactUploadUrl returned uploadId: ${uploadResult.uploadId}`)
                            return uploadResult
                        } else {
                            throw new Error('Failed to create artifact upload URL - API returned null')
                        }
                    }
                    case AtxCompleteArtifactUploadCommand: {
                        logging.log('ATX: Handling completeArtifactUpload command')
                        const { WorkspaceId, JobId, ArtifactId } = params as AtxCompleteArtifactUploadRequest

                        if (!WorkspaceId || !JobId || !ArtifactId) {
                            throw new Error(
                                'WorkspaceId, JobId, and ArtifactId are required for completeArtifactUpload'
                            )
                        }

                        const success = await atxTransformHandler.completeArtifactUpload(WorkspaceId, JobId, ArtifactId)
                        if (success) {
                            logging.log(`ATX: CompleteArtifactUpload completed successfully`)
                            return { success: true }
                        } else {
                            throw new Error('Failed to complete artifact upload - API returned false')
                        }
                    }
                    case AtxStartJobCommand: {
                        logging.log('ATX: Handling startJob command')
                        const { WorkspaceId, JobId } = params as AtxStartJobRequest

                        if (!WorkspaceId || !JobId) {
                            throw new Error('WorkspaceId and JobId are required for startJob')
                        }

                        const success = await atxTransformHandler.startJob(WorkspaceId, JobId)
                        if (success) {
                            logging.log(`ATX: StartJob completed successfully`)
                            return { success: true }
                        } else {
                            throw new Error('Failed to start job - API returned false')
                        }
                    }
                    case AtxGetJobCommand: {
                        logging.log('ATX: Handling getJob command')
                        const { WorkspaceId, JobId } = params as AtxGetJobRequest

                        if (!WorkspaceId || !JobId) {
                            throw new Error('WorkspaceId and JobId are required for getJob')
                        }

                        const result = await atxTransformHandler.getJob(WorkspaceId, JobId)
                        return { job: result?.job || null }
                    }
                    case AtxStopJobCommand: {
                        logging.log('ATX: Handling stopJob command')
                        const { WorkspaceId, JobId } = params as AtxStopJobRequest

                        if (!WorkspaceId || !JobId) {
                            throw new Error('WorkspaceId and JobId are required for stopJob')
                        }

                        const result = await atxTransformHandler.stopJob(WorkspaceId, JobId)
                        return { success: result }
                    }
                    case AtxDownloadArtifactUrlCommand: {
                        logging.log('ATX: Handling downloadArtifactUrl command')
                        const { WorkspaceId, JobId, ArtifactId } = params as AtxDownloadArtifactUrlRequest

                        if (!WorkspaceId || !JobId || !ArtifactId) {
                            throw new Error('WorkspaceId, JobId, and ArtifactId are required for downloadArtifactUrl')
                        }

                        const result = await atxTransformHandler.downloadArtifactUrl(WorkspaceId, JobId, ArtifactId)
                        return result
                    }
                    case AtxListArtifactsCommand: {
                        logging.log('ATX: Handling listArtifacts command')
                        const { WorkspaceId, JobId, CategoryType } = params as AtxListArtifactsRequest

                        if (!WorkspaceId || !JobId) {
                            throw new Error('WorkspaceId and JobId are required for listArtifacts')
                        }

                        const result = await atxTransformHandler.listArtifacts(
                            WorkspaceId,
                            JobId,
                            CategoryType || CategoryTypeEnum.CUSTOMER_OUTPUT
                        )
                        return { artifacts: result }
                    }
                    case AtxListJobPlanStepsCommand: {
                        logging.log('ATX: Handling listJobPlanSteps command')
                        const { WorkspaceId, JobId } = params as AtxListJobPlanStepsRequest

                        if (!WorkspaceId || !JobId) {
                            throw new Error('WorkspaceId and JobId are required for listJobPlanSteps')
                        }

                        const result = await atxTransformHandler.listJobPlanSteps(WorkspaceId, JobId)
                        return { steps: result }
                    }
                    case AtxCreateZipCommand: {
                        logging.log('ATX: Handling createZip command')
                        const { StartTransformRequest } = params as AtxCreateZipRequest

                        const zipFilePath = await atxTransformHandler.createZip(StartTransformRequest)
                        logging.log(`ATX: ZIP file created: ${zipFilePath}`)
                        return { zipFilePath }
                    }
                    case AtxUploadArtifactToS3Command: {
                        logging.log('ATX: Handling uploadArtifactToS3 command')
                        const { FilePath, S3PreSignedUrl, RequestHeaders } = params as AtxUploadArtifactToS3Request

                        if (!FilePath || !S3PreSignedUrl) {
                            throw new Error('FilePath and S3PreSignedUrl are required for uploadArtifactToS3')
                        }

                        const success = await atxTransformHandler.uploadArtifact(
                            S3PreSignedUrl,
                            FilePath,
                            RequestHeaders
                        )
                        logging.log(`ATX: S3 upload ${success ? 'succeeded' : 'failed'}`)
                        return success
                    }
                    case AtxStartTransformCommand: {
                        logging.log('ATX: Handling startTransform command')
                        const { WorkspaceId, JobName, StartTransformRequest } = params as AtxStartTransformRequest

                        if (!WorkspaceId) {
                            throw new Error('WorkspaceId is required for startTransform')
                        }

                        const result = await atxTransformHandler.startTransform({
                            workspaceId: WorkspaceId,
                            jobName: JobName,
                            startTransformRequest: StartTransformRequest,
                        })

                        if (!result) {
                            throw new Error('StartTransform workflow failed')
                        }

                        logging.log(`ATX: StartTransform completed with jobId: ${result.jobId}`)

                        // Return in RTS-compatible format
                        return {
                            TransformationJobId: result.jobId,
                            ArtifactPath: result.zipFilePath || '',
                            UploadId: result.uploadId || '',
                            UnSupportedProjects: [],
                            ContainsUnsupportedViews: false,
                        }
                    }
                    case AtxListOrCreateWorkspaceCommand: {
                        logging.log('ATX: Handling listOrCreateWorkspace command')
                        const request = params as AtxListOrCreateWorkspaceRequest

                        const result = await atxTransformHandler.listOrCreateWorkspace(request)

                        if (!result) {
                            throw new Error('ListOrCreateWorkspace failed')
                        }

                        logging.log(
                            `ATX: ListOrCreateWorkspace completed - ${result.AvailableWorkspaces.length} workspaces`
                        )
                        return result
                    }
                    case AtxGetJobStatusInfoCommand: {
                        logging.log('ATX: Handling getJobStatusInfo command')
                        const { WorkspaceId, JobId, IncludePlanSteps, IncludeArtifacts } =
                            params as AtxGetJobStatusInfoRequest

                        if (!WorkspaceId || !JobId) {
                            throw new Error('WorkspaceId and JobId are required for getJobStatusInfo')
                        }

                        logging.log(
                            `ATX: GetJobStatusInfo called with includePlanSteps=${IncludePlanSteps}, includeArtifacts=${IncludeArtifacts}`
                        )

                        const result = await atxTransformHandler.getJobStatusInfo({
                            workspaceId: WorkspaceId,
                            jobId: JobId,
                            includePlanSteps: IncludePlanSteps,
                            includeArtifacts: IncludeArtifacts,
                        })

                        if (!result) {
                            throw new Error('GetJobStatusInfo failed')
                        }

                        logging.log(
                            `ATX: GetJobStatusInfo completed for job: ${result.JobId} (status: ${result.Status})`
                        )
                        return result
                    }
                    // TODO: Phase 2 - Add Transform operation commands here
                    default: {
                        throw new Error(`Unknown ATX FES command: ${params.command}`)
                    }
                }
            } catch (e: any) {
                throw e
            }
        }

        const onExecuteCommandHandler = async (
            params: ExecuteCommandParams,
            _token: CancellationToken
        ): Promise<any> => {
            return runAtxTransformCommand(params, _token)
        }

        const onInitializeHandler = async (params: InitializeParams) => {
            return {
                capabilities: {
                    executeCommandProvider: {
                        commands: [
                            // TODO: Phase 2: Add ATX FES Transform operation commands
                            // AtxVerifySessionCommand, // LSP-only implementation
                            AtxListWorkspacesCommand,
                            AtxCreateWorkspaceCommand,
                            AtxCreateJobCommand,
                            AtxCreateArtifactUploadUrlCommand,
                            AtxCompleteArtifactUploadCommand,
                            AtxStartJobCommand,
                            AtxGetJobCommand,
                            AtxStopJobCommand,
                            AtxDownloadArtifactUrlCommand,
                            AtxListArtifactsCommand,
                            AtxListJobPlanStepsCommand,
                            AtxCreateZipCommand,
                            AtxUploadArtifactToS3Command,
                            AtxStartTransformCommand,
                            AtxListOrCreateWorkspaceCommand,
                            AtxGetJobStatusInfoCommand,
                            // AtxStartJobCommand,
                            // AtxGetJobCommand,
                            // AtxStopJobCommand,
                            // AtxCreateUploadArtifactURLCommand,
                            // AtxCompleteUploadArtifactURLCommand,
                            // AtxCreateDownloadArtifactURLCommand,
                            // AtxListArtifactsCommand,
                            // AtxListJobStepPlansCommand,
                        ],
                    },
                },
            }
        }

        const onInitializedHandler = () => {
            try {
                atxTokenServiceManager = AtxTokenServiceManager.getInstance()
                atxTransformHandler = new ATXTransformHandler(atxTokenServiceManager, workspace, logging, runtime)
                logging.log('ATX Transform Handler initialized successfully')
            } catch (error) {
                logging.error(
                    `ATX Transform Handler initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`
                )
                logging.error(
                    `ATX Transform Handler error stack: ${error instanceof Error ? error.stack : 'No stack trace'}`
                )
            }
        }

        lsp.addInitializer(onInitializeHandler)
        lsp.onInitialized(onInitializedHandler)
        lsp.onExecuteCommand(onExecuteCommandHandler)

        return () => {}
    }
