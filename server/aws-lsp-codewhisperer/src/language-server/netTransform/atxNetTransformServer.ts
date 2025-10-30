import {
    CancellationToken,
    ExecuteCommandParams,
    InitializeParams,
    Server,
} from '@aws/language-server-runtimes/server-interface'
import { AtxTokenServiceManager } from '../../shared/amazonQServiceManager/AtxTokenServiceManager'
import { ATXTransformHandler } from './atxTransformHandler'

// ATX FES Commands
const AtxListAvailableProfilesCommand = 'aws/atxNetTransform/listAvailableProfiles'

// TODO: Phase 2 - Add remaining ATX FES APIs
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

// TODO: Phase 2 - Add remaining ATX FES APIs
export const AtxNetTransformServerToken =
    (): Server =>
    ({ workspace, logging, lsp, telemetry, runtime }) => {
        let atxTokenServiceManager: AtxTokenServiceManager
        let atxTransformHandler: ATXTransformHandler

        const runAtxTransformCommand = async (params: ExecuteCommandParams, _token: CancellationToken) => {
            try {
                switch (params.command) {
                    case AtxListAvailableProfilesCommand: {
                        const maxResults = (params as any).maxResults || 100
                        const response = await atxTransformHandler.listAvailableProfiles(maxResults)
                        return response
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
                        commands: [
                            AtxListAvailableProfilesCommand,
                            // TODO: Phase 2: Add remaining ATX FES APIs
                            // AtxVerifySessionCommand, // LSP-only implementation
                            // AtxListWorkspacesCommand,
                            // AtxCreateWorkspaceCommand,
                            // AtxCreateJobCommand,
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
            atxTokenServiceManager = AtxTokenServiceManager.getInstance()
            atxTransformHandler = new ATXTransformHandler(atxTokenServiceManager, workspace, logging, runtime)
        }

        lsp.addInitializer(onInitializeHandler)
        lsp.onInitialized(onInitializedHandler)
        lsp.onExecuteCommand(onExecuteCommandHandler)

        return () => {}
    }
