import {
    CancellationToken,
    ExecuteCommandParams,
    InitializeParams,
    Server,
} from '@aws/language-server-runtimes/server-interface'
import { AtxTokenServiceManager } from '../../shared/amazonQServiceManager/AtxTokenServiceManager'
import { ATXTransformHandler } from './atxTransformHandler'
import { AtxListOrCreateWorkspaceRequest, AtxStartTransformRequest } from './atxModels'

// ATX FES Commands - Consolidated APIs
const AtxListOrCreateWorkspaceCommand = 'aws/atxTransform/listOrCreateWorkspace'
const AtxStartTransformCommand = 'aws/atxTransform/startTransform'

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
                        commands: [AtxListOrCreateWorkspaceCommand, AtxStartTransformCommand],
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
