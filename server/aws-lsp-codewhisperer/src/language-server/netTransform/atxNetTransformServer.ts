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
    AtxStartTransformRequest,
    AtxGetTransformInfoRequest,
    AtxStopJobRequest,
    AtxUploadPlanRequest,
    AtxUploadPackagesRequest,
} from './atxModels'

// ATX FES Commands - Consolidated APIs
const AtxListOrCreateWorkspaceCommand = 'aws/atxTransform/listOrCreateWorkspace'
const AtxStartTransformCommand = 'aws/atxTransform/startTransform'
const AtxGetTransformInfoCommand = 'aws/atxTransform/getTransformInfo'
const AtxStopJobCommand = 'aws/atxTransform/stopJob'
const AtxUploadPlanCommand = 'aws/atxTransform/uploadPlan'
const AtxUploadPackagesCommand = 'aws/atxTransform/uploadPackages'
const AtxSendMessageCommand = 'aws/atxTransform/sendMessage'
const AtxListMessagesCommand = 'aws/atxTransform/listMessages'
const AtxBatchGetMessagesCommand = 'aws/atxTransform/batchGetMessages'

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
                    case AtxStartTransformCommand: {
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
                            startTimestamp,
                        })
                    }
                    case AtxBatchGetMessagesCommand: {
                        const { workspaceId, messageIds } = params as any
                        return await atxTransformHandler.batchGetMessages({
                            workspaceId,
                            messageIds,
                        })
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
                            AtxStartTransformCommand,
                            AtxGetTransformInfoCommand,
                            AtxUploadPlanCommand,
                            AtxStopJobCommand,
                            AtxUploadPackagesCommand,
                            AtxSendMessageCommand,
                            AtxListMessagesCommand,
                            AtxBatchGetMessagesCommand,
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
