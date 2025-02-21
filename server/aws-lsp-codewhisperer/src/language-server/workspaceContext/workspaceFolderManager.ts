import { WebSocketClient } from './client'
import { CodeWhispererServiceToken } from '../codeWhispererService'
import { WorkspaceFolder } from '@aws/language-server-runtimes/protocol'
import {
    CreateUploadUrlRequest,
    CreateWorkspaceResponse,
    ListWorkspaceMetadataResponse,
    WorkspaceMetadata,
} from '../../client/token/codewhispererbearertokenclient'
import { Logging } from '@aws/language-server-runtimes/server-interface'
import { ArtifactManager, FileMetadata } from './artifactManager'
import { uploadArtifactToS3 } from './util'

export type RemoteWorkspaceState = 'CREATED' | 'PENDING' | 'READY' | 'CONNECTED' | 'DELETING'

interface WorkspaceState {
    remoteWorkspaceState: RemoteWorkspaceState
    webSocketClient?: WebSocketClient
    workspaceId?: string
    messageQueue?: any[]
}

type WorkspaceRoot = string

interface WorkspaceStateChange {
    workspace: WorkspaceRoot //TODO, check whether workspace info is used anywhere or if it can be removed
    previousState: RemoteWorkspaceState
    currentState: RemoteWorkspaceState
}

export class WorkspaceFolderManager {
    private cwsprClient: CodeWhispererServiceToken
    private logging: Logging
    private artifactManager: ArtifactManager
    private workspaceMap: Map<WorkspaceRoot, WorkspaceState>
    private workspacesToPoll: WorkspaceRoot[]
    private readonly pollInterval: number = 15 * 1000 // 15 seconds

    constructor(cwsprClient: CodeWhispererServiceToken, logging: Logging, artifactManager: ArtifactManager) {
        this.cwsprClient = cwsprClient
        this.logging = logging
        this.artifactManager = artifactManager
        this.workspaceMap = new Map<WorkspaceRoot, WorkspaceState>()
        this.workspacesToPoll = []
    }

    updateWorkspaceEntry(workspaceRoot: WorkspaceRoot, workspaceState: WorkspaceState) {
        if (!workspaceState.messageQueue) {
            workspaceState.messageQueue = []
        }

        if (!this.workspaceMap.has(workspaceRoot)) {
            this.workspaceMap.set(workspaceRoot, workspaceState)
        } else {
            const existingWorkspaceState = this.workspaceMap.get(workspaceRoot)
            if (existingWorkspaceState) {
                existingWorkspaceState.remoteWorkspaceState =
                    workspaceState.remoteWorkspaceState ?? existingWorkspaceState.remoteWorkspaceState
                existingWorkspaceState.webSocketClient =
                    workspaceState.webSocketClient ?? existingWorkspaceState.webSocketClient
                existingWorkspaceState.workspaceId = workspaceState.workspaceId ?? existingWorkspaceState.workspaceId
                existingWorkspaceState.messageQueue = workspaceState.messageQueue ?? existingWorkspaceState.messageQueue
            }
        }
    }

    removeWorkspaceEntry(workspaceRoot: WorkspaceRoot) {
        this.workspaceMap.delete(workspaceRoot)
    }

    getWorkspaces(): Map<WorkspaceRoot, WorkspaceState> {
        return this.workspaceMap
    }

    private async createNewWorkspace(workspace: WorkspaceRoot) {
        const createWorkspaceResponse = await this.createWorkspace(workspace)
        if (!createWorkspaceResponse) {
            this.logging.warn(`Failed to create workspace for ${workspace}`)
            return
        }

        this.updateWorkspaceEntry(workspace, {
            remoteWorkspaceState: createWorkspaceResponse.workspace.workspaceStatus,
            workspaceId: createWorkspaceResponse.workspace.workspaceId,
        })
    }

    private async pollWorkspaceUntilStateChange(
        workspace: WorkspaceRoot,
        timeout: number = 300000 // 5 minutes default timeout
    ): Promise<WorkspaceStateChange> {
        return new Promise((resolve, reject) => {
            const startTime = Date.now()
            const initialState = this.workspaceMap.get(workspace)?.remoteWorkspaceState

            if (!initialState) {
                return reject(`Can't find initial state of the workspace`)
            }
            if (initialState === 'READY') {
                resolve({
                    workspace,
                    previousState: initialState,
                    currentState: initialState,
                })
            }

            const pollIntervalId = setInterval(async () => {
                try {
                    const metadata = await this.listWorkspaceMetadata(workspace)
                    const currentState = metadata?.workspaceStatus

                    if (currentState && currentState !== initialState) {
                        clearInterval(pollIntervalId)
                        resolve({
                            workspace,
                            previousState: initialState,
                            currentState,
                        })
                    }

                    if (Date.now() - startTime > timeout) {
                        clearInterval(pollIntervalId)
                        reject(new Error(`Polling timeout for workspace ${workspace}`))
                    }
                } catch (error) {
                    clearInterval(pollIntervalId)
                    reject(error)
                }
            }, this.pollInterval)
        })
    }

    private async establishConnection(workspace: WorkspaceRoot) {
        const metadata = await this.listWorkspaceMetadata(workspace)
        if (!metadata?.environmentId) {
            throw new Error('No environment ID found for ready workspace')
        }

        const webSocketClient = new WebSocketClient(metadata.environmentId)
        this.updateWorkspaceEntry(workspace, {
            remoteWorkspaceState: 'CONNECTED',
            webSocketClient,
        })

        this.processMessagesInQueue(workspace)
    }

    private async handleNewWorkspace(workspace: WorkspaceRoot, queueEvents?: any[]) {
        this.logging.log(`Processing new workspace ${workspace}`)

        // First check if the workspace already exists in the workspace map
        const existingWorkspace = this.workspaceMap.get(workspace)
        if (existingWorkspace) {
            this.logging.log(`Workspace ${workspace} already exists in memory`)
            return
        }

        // Check if workspace exists remotely
        const metadata = await this.listWorkspaceMetadata(workspace)

        if (metadata) {
            // Workspace exists remotely, add to map with current state
            this.updateWorkspaceEntry(workspace, {
                workspaceId: metadata.workspaceId,
                remoteWorkspaceState: metadata.workspaceStatus,
                messageQueue: queueEvents ?? undefined,
            })
        } else {
            // Create new workspace if it doesn't exist
            await this.createNewWorkspace(workspace)
        }

        // Handle state changes
        try {
            const stateChange = await this.pollWorkspaceUntilStateChange(workspace)

            switch (stateChange.currentState) {
                case 'READY':
                    await this.establishConnection(workspace)
                    break
                case 'CONNECTED':
                    // TODO, implement polling logic for workspacesToPoll
                    this.workspacesToPoll.push(workspace)
                    break
                case 'CREATED':
                    await this.createNewWorkspace(workspace)
                    break
                default:
                    this.logging.warn(`Unexpected workspace state: ${stateChange.currentState}`)
            }
        } catch (error) {
            this.logging.error(`Error handling workspace ${workspace}: ${error}`)
        }
    }

    /**
     * The function sends a removed workspace folder notification to remote LSP, removes workspace entry
     * from map and close the websocket connection
     * @param workspaceFolder
     */
    processWorkspaceFolderDeletion(workspaceFolder: WorkspaceFolder) {
        const workspaceDetails = this.workspaceMap.get(workspaceFolder.uri)
        const websocketClient = workspaceDetails?.webSocketClient
        if (!websocketClient) return
        websocketClient.send(
            JSON.stringify({
                action: 'didChangeWorkspaceFolders',
                message: {
                    event: {
                        added: [],
                        removed: [
                            {
                                uri: workspaceFolder.uri,
                                name: workspaceFolder.name,
                            },
                        ],
                    },
                    workspaceChangeMetadata: {
                        workspaceRoot: workspaceFolder.uri,
                        s3Path: '',
                        programmingLanguage: '',
                    },
                },
            })
        )
        this.removeWorkspaceEntry(workspaceFolder.uri)
        websocketClient.disconnect()
    }

    private processMessagesInQueue(workspaceRoot: WorkspaceRoot) {
        const workspaceDetails = this.workspaceMap.get(workspaceRoot)
        while (workspaceDetails?.messageQueue && workspaceDetails.messageQueue.length > 0) {
            const message = workspaceDetails.messageQueue.shift()
            workspaceDetails.webSocketClient?.send(message)
        }
    }

    async uploadToS3(fileMetadata: FileMetadata): Promise<string | undefined> {
        // For testing, return random s3Url without actual upload...
        var testing = true
        if (testing) {
            return '<sample-url>'
        }

        let s3Url: string | undefined
        try {
            const request: CreateUploadUrlRequest = {
                contentMd5: fileMetadata.md5Hash,
                artifactType: 'SourceCode',
            }
            const response = await this.cwsprClient.createUploadUrl(request)
            s3Url = response.uploadUrl
            await uploadArtifactToS3(Buffer.from(fileMetadata.content), fileMetadata.md5Hash, response)
        } catch (e: any) {
            this.logging.warn(`Error uploading file to S3: ${e.message}`)
        }
        return s3Url
    }

    async processNewWorkspaceFolders(
        folders: WorkspaceFolder[],
        options: {
            initialize?: boolean
            didChangeWorkspaceFoldersAddition?: boolean
        }
    ) {
        let foldersMetadata: FileMetadata[] = []
        if (options.didChangeWorkspaceFoldersAddition) {
            foldersMetadata = await this.artifactManager.addWorkspaceFolders(folders)
        } else if (options.initialize) {
            foldersMetadata = await this.artifactManager.createLanguageArtifacts()
        }
        this.logging.log(`addedFoldersMetadata: Length: ${JSON.stringify(foldersMetadata.length)}`)

        const inMemoryQueueEvents: Map<string, any[]> = new Map<string, any[]>()
        for (const fileMetadata of foldersMetadata) {
            const s3Url = await this.uploadToS3(fileMetadata)
            if (!s3Url || !fileMetadata.workspaceFolder) {
                //TODO: add a log
                continue
            }
            let eventQueue = inMemoryQueueEvents.get(fileMetadata.workspaceFolder.uri)
            if (!eventQueue) {
                eventQueue = []
                inMemoryQueueEvents.set(fileMetadata.workspaceFolder.uri, eventQueue)
            }
            eventQueue.push(
                JSON.stringify({
                    action: 'didChangeWorkspaceFolders',
                    message: {
                        event: {
                            added: [
                                {
                                    uri: fileMetadata.workspaceFolder.uri,
                                    name: fileMetadata.workspaceFolder.name,
                                },
                            ],
                            removed: [],
                        },
                        workspaceChangeMetadata: {
                            workspaceRoot: fileMetadata.workspaceFolder.uri,
                            s3Path: s3Url,
                            programmingLanguage: fileMetadata.language,
                        },
                    },
                })
            )
        }
        for (const folder of folders) {
            const queueEvents = inMemoryQueueEvents.get(folder.uri) ?? undefined
            this.handleNewWorkspace(folder.uri, queueEvents).catch(e => {
                this.logging.warn(`Error processing new workspace: ${e}`)
            })
        }
    }

    /**
     * The function fetches remote workspace metadata. There'll always be single entry for workspace
     * metadata in the response, so intentionally picking the first index element.
     * @param workspaceRoot
     * @private
     */
    private async listWorkspaceMetadata(workspaceRoot: WorkspaceRoot) {
        let metadataResponse: WorkspaceMetadata | undefined | null
        try {
            const response = await this.cwsprClient.listWorkspaceMetadata({
                workspaceRoot: workspaceRoot,
            })
            this.logging.log(`ListWorkspaceMetadata response: ${JSON.stringify(response)}`)
            metadataResponse = response && response.workspaces.length ? response.workspaces[0] : null
        } catch (e: any) {
            this.logging.warn(`Error while fetching workspace (${workspaceRoot}) metadata: ${e.message}`)
        }
        return metadataResponse
    }

    private async createWorkspace(workspaceRoot: WorkspaceRoot) {
        let response: CreateWorkspaceResponse | undefined | null
        try {
            response = await this.cwsprClient.createWorkspace({
                workspaceRoot: workspaceRoot,
            })
        } catch (e: any) {
            this.logging.warn(`Error while creating workspace (${workspaceRoot}): ${e.message}`)
        }
        return response
    }
}
