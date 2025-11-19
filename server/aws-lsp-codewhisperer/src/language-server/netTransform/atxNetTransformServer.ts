import {
    CancellationToken,
    ExecuteCommandParams,
    InitializeParams,
    Server,
} from '@aws/language-server-runtimes/server-interface'
import { AtxTokenServiceManager } from '../../shared/amazonQServiceManager/AtxTokenServiceManager'
import { ATXTransformHandler } from './atxTransformHandler'
import { GetHitlRequest, ListHitlRequest, SubmitHitlRequest, DownloadExtractArtifactRequest } from './atxModels'

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
const AtxListHitlsCommand = 'aws/atxTransform/listHitls'
const AtxSubmitHitlCommand = 'aws/atxTransform/submitHitl'
const AtxGetHitlStatus = 'aws/atxTransform/getHitl'
const AtxDownloadExtractArtifactCommand = 'aws/atxTransform/downloadExtractArtifact'

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
                        const request = params.arguments?.[0] as { workspaceName?: string }
                        const workspaceName = request?.workspaceName || null

                        const workspaceId = await atxTransformHandler.createWorkspace(workspaceName)
                        if (workspaceId) {
                            logging.log(`ATX: CreateWorkspace returned workspaceId: ${workspaceId}`)
                            return { workspaceId }
                        } else {
                            throw new Error('Failed to create workspace - API returned null')
                        }
                    }
                    case AtxCreateJobCommand: {
                        logging.log('ATX: Handling createJob command')
                        const request = params.arguments?.[0] as { workspaceId: string; jobName?: string }
                        const { workspaceId, jobName } = request

                        if (!workspaceId) {
                            throw new Error('workspaceId is required for createJob')
                        }

                        const jobResult = await atxTransformHandler.createJob(workspaceId, jobName)
                        if (jobResult) {
                            logging.log(
                                `ATX: CreateJob returned jobId: ${jobResult.jobId}, status: ${jobResult.status}`
                            )
                            return jobResult
                        } else {
                            throw new Error('Failed to create job - API returned null')
                        }
                    }
                    case AtxCreateArtifactUploadUrlCommand: {
                        logging.log('ATX: Handling createArtifactUploadUrl command')
                        const request = params.arguments?.[0] as {
                            workspaceId: string
                            jobId: string
                            filePath: string
                        }
                        const { workspaceId, jobId, filePath } = request

                        if (!workspaceId || !jobId || !filePath) {
                            throw new Error('workspaceId, jobId, and filePath are required for createArtifactUploadUrl')
                        }

                        const uploadResult = await atxTransformHandler.createArtifactUploadUrl(
                            workspaceId,
                            jobId,
                            filePath
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
                        const request = params.arguments?.[0] as {
                            workspaceId: string
                            jobId: string
                            artifactId: string
                        }
                        const { workspaceId, jobId, artifactId } = request

                        if (!workspaceId || !jobId || !artifactId) {
                            throw new Error(
                                'workspaceId, jobId, and artifactId are required for completeArtifactUpload'
                            )
                        }

                        const success = await atxTransformHandler.completeArtifactUpload(workspaceId, jobId, artifactId)
                        if (success) {
                            logging.log(`ATX: CompleteArtifactUpload completed successfully`)
                            return { success: true }
                        } else {
                            throw new Error('Failed to complete artifact upload - API returned false')
                        }
                    }
                    case AtxStartJobCommand: {
                        logging.log('ATX: Handling startJob command')
                        const request = params.arguments?.[0] as { workspaceId: string; jobId: string }
                        const { workspaceId, jobId } = request

                        if (!workspaceId || !jobId) {
                            throw new Error('workspaceId and jobId are required for startJob')
                        }

                        const success = await atxTransformHandler.startJob(workspaceId, jobId)
                        if (success) {
                            logging.log(`ATX: StartJob completed successfully`)
                            return { success: true }
                        } else {
                            throw new Error('Failed to start job - API returned false')
                        }
                    }
                    case AtxGetJobCommand: {
                        logging.log('ATX: Handling getJob command')
                        const request = params.arguments?.[0] as { workspaceId: string; jobId: string }
                        const { workspaceId, jobId } = request

                        if (!workspaceId || !jobId) {
                            throw new Error('workspaceId and jobId are required for getJob')
                        }

                        const result = await atxTransformHandler.getJob(workspaceId, jobId)
                        return { job: result?.job || null }
                    }
                    case AtxStopJobCommand: {
                        logging.log('ATX: Handling stopJob command')
                        const request = params.arguments?.[0] as { workspaceId: string; jobId: string }
                        const { workspaceId, jobId } = request

                        if (!workspaceId || !jobId) {
                            throw new Error('workspaceId and jobId are required for stopJob')
                        }

                        const result = await atxTransformHandler.stopJob(workspaceId, jobId)
                        return { success: result }
                    }
                    case AtxDownloadArtifactUrlCommand: {
                        logging.log('ATX: Handling downloadArtifactUrl command')
                        const request = params.arguments?.[0] as {
                            workspaceId: string
                            jobId: string
                            artifactId: string
                        }
                        const { workspaceId, jobId, artifactId } = request

                        if (!workspaceId || !jobId || !artifactId) {
                            throw new Error('workspaceId, jobId, and artifactId are required for downloadArtifactUrl')
                        }

                        const result = await atxTransformHandler.downloadArtifactUrl(workspaceId, jobId, artifactId)
                        return result
                    }
                    case AtxListArtifactsCommand: {
                        logging.log('ATX: Handling listArtifacts command')
                        const request = params.arguments?.[0] as {
                            workspaceId: string
                            jobId: string
                            categoryType?: string
                        }
                        const { workspaceId, jobId, categoryType } = request

                        if (!workspaceId || !jobId) {
                            throw new Error('workspaceId and jobId are required for listArtifacts')
                        }

                        const result = await atxTransformHandler.listArtifacts(workspaceId, jobId, categoryType)
                        return { artifacts: result }
                    }
                    case AtxListJobPlanStepsCommand: {
                        logging.log('ATX: Handling listJobPlanSteps command')
                        const request = params.arguments?.[0] as { workspaceId: string; jobId: string }
                        const { workspaceId, jobId } = request

                        if (!workspaceId || !jobId) {
                            throw new Error('workspaceId and jobId are required for listJobPlanSteps')
                        }

                        const result = await atxTransformHandler.listJobPlanSteps(workspaceId, jobId)
                        return { steps: result }
                    }
                    case AtxCreateZipCommand: {
                        logging.log('ATX: Handling createZip command')
                        const request = params.arguments?.[0] as any // StartTransformRequest

                        const zipFilePath = await atxTransformHandler.createZip(request)
                        logging.log(`ATX: ZIP file created: ${zipFilePath}`)
                        return { zipFilePath }
                    }
                    case AtxUploadArtifactToS3Command: {
                        logging.log('ATX: Handling uploadArtifactToS3 command')
                        const request = params.arguments?.[0] as {
                            filePath: string
                            s3PreSignedUrl: string
                            requestHeaders: any
                        }
                        const { filePath, s3PreSignedUrl, requestHeaders } = request

                        if (!filePath || !s3PreSignedUrl) {
                            throw new Error('filePath and s3PreSignedUrl are required for uploadArtifactToS3')
                        }

                        const success = await atxTransformHandler.uploadArtifact(
                            s3PreSignedUrl,
                            filePath,
                            requestHeaders
                        )
                        logging.log(`ATX: S3 upload ${success ? 'succeeded' : 'failed'}`)
                        return success
                    }
                    case AtxListHitlsCommand: {
                        logging.log('ATX: Handling listHitls command')
                        logging.log(`Parmas:${String(params)}`)
                        const request = params as ListHitlRequest
                        const result = await atxTransformHandler.listHitls(request)
                        return result
                    }
                    case AtxSubmitHitlCommand: {
                        logging.log('ATX: Handling submitHitl command')
                        const request = params as SubmitHitlRequest
                        const result = await atxTransformHandler.submitHitl(request)
                        return result
                    }
                    case AtxGetHitlStatus: {
                        logging.log('ATX: Handling getHitl command')
                        const request = params as GetHitlRequest
                        const result = await atxTransformHandler.getHitl(request)
                        return result
                    }
                    case AtxDownloadExtractArtifactCommand: {
                        logging.log('ATX: Handling downloadExtractArtifact command')
                        const request = params as DownloadExtractArtifactRequest
                        const result = await atxTransformHandler.downloadAndExtractArchive(
                            request.DownloadUrl,
                            request.RequestHeaders,
                            request.SaveToDir,
                            request.FileName
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
                            AtxListHitlsCommand,
                            AtxSubmitHitlCommand,
                            AtxGetHitlStatus,
                            AtxDownloadExtractArtifactCommand,
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
