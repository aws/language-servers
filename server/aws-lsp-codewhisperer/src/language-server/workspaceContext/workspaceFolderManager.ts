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

export class WorkspaceFolderManager {
    private cwsprClient: CodeWhispererServiceToken
    private logging: Logging
    private artifactManager: ArtifactManager
    private workspaceMap: Map<WorkspaceRoot, WorkspaceState>
    private readonly pollInterval: number = 5 * 60 * 1000

    constructor(cwsprClient: CodeWhispererServiceToken, logging: Logging, artifactManager: ArtifactManager) {
        this.cwsprClient = cwsprClient
        this.logging = logging
        this.artifactManager = artifactManager
        this.workspaceMap = new Map<WorkspaceRoot, WorkspaceState>()
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

    /**
     * The function polls workspace state every 5 minutes & stop polling once all workspaces
     * are created on remote and the code has connected to the LSPs running on remote through
     * websocket.
     */
    pollWorkspaceState(workspaces: WorkspaceRoot[]) {
        const pollIntervalId = setInterval(() => {
            let counterOfConnectedWorkspaces = 0
            let totalWorkspaces = workspaces.length
            // No workspace should be in either ready state here; either connected or other state.
            workspaces.forEach(workspace => {
                const state = this.workspaceMap.get(workspace)?.remoteWorkspaceState
                if (state === 'CONNECTED' || state === 'READY') {
                    counterOfConnectedWorkspaces++
                    return
                }
                // TODO: Call ListWorkspaceMetadataApi to know the state of workspace. If READY, create WS Client & update map. Hardcoding list result now
                let stateFromListApi = 'READY',
                    uriFromListApi = 'uri'
                if (stateFromListApi === 'READY') {
                    const webSocketClient = new WebSocketClient(uriFromListApi)
                    this.updateWorkspaceEntry(workspace, {
                        remoteWorkspaceState: 'CONNECTED',
                        webSocketClient: webSocketClient,
                    })
                    this.processMessagesInQueue(workspace)
                    counterOfConnectedWorkspaces++
                }
            })
            if (counterOfConnectedWorkspaces === totalWorkspaces) {
                clearInterval(pollIntervalId)
            }
        }, this.pollInterval)
    }

    async processNewWorkspaceFolder(workspaceFolder: WorkspaceFolder, queueEvents?: any[]) {
        /*
                 TODO: Make a call to ListWorkspaceMetadata API to get the state for the workspace. For now, keeping it static.
                 ListWorkspaceMetadata should also return the URI to connect to address & port. For now, keeping it static.
                 */
        /*
        const metadata = await this.getWorkspaceMetadata(workspaceFolder.uri)
        this.logging.log(`Logging the response: ${metadata}`)

        let workspaceId: string
        // For now, assuming null (error cases) needs to call CreateWorkspace.
        // TODO: Add other conditions to call CreateWorkspace | Check what happens when first time calling it without CW API
        if (!metadata) {
            const createWorkspaceResponse = await this.createWorkspace(workspaceFolder.uri)
            if (!createWorkspaceResponse) {
                return
            }
            workspaceId = createWorkspaceResponse.workspace.workspaceId
            this.updateWorkspaceEntry(workspaceFolder.uri, {
                remoteWorkspaceState: createWorkspaceResponse.workspace.workspaceStatus as RemoteWorkspaceState,
                workspaceId: createWorkspaceResponse.workspace.workspaceId
            })
        } else if (metadata.workspaceStatus === 'READY') {
            const webSocketClient = new WebSocketClient(metadata.environmentId as string)
            this.updateWorkspaceEntry(workspaceFolder.uri, {
                remoteWorkspaceState: 'CONNECTED',
                webSocketClient: webSocketClient,
                workspaceId: metadata.workspaceId
            })
            this.processMessagesInQueue(workspaceFolder.uri)
        }
         */

        let state = 'READY'
        let uri = 'ws://localhost:8080'
        if (state === 'READY') {
            const webSocketClient = new WebSocketClient(uri)
            this.updateWorkspaceEntry(workspaceFolder.uri, {
                remoteWorkspaceState: 'CONNECTED',
                webSocketClient: webSocketClient,
                messageQueue: queueEvents ?? undefined,
            })
            this.processMessagesInQueue(workspaceFolder.uri)
        } else {
            // TODO: make a call to CreateWorkspace API. It's a fire & forget call
            this.updateWorkspaceEntry(workspaceFolder.uri, {
                remoteWorkspaceState: state as RemoteWorkspaceState,
                messageQueue: queueEvents ?? undefined,
            })
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
        folders.forEach(folder => {
            const queueEvents = inMemoryQueueEvents.get(folder.uri) ?? undefined
            this.processNewWorkspaceFolder(folder, queueEvents)
        })
        const folderUris = folders.map(({ uri }) => uri)
        this.logging.log(`Folder URIs for polling: ${folderUris}`)
        this.pollWorkspaceState(folderUris)
    }

    /**
     * The function fetches remote workspace metadata. There'll always be single entry for workspace
     * metadata in the response, so intentionally picking the first index element.
     * @param workspaceRoot
     * @private
     */
    private async getWorkspaceMetadata(workspaceRoot: WorkspaceRoot) {
        let metadataResponse: WorkspaceMetadata | undefined | null
        try {
            const response = await this.cwsprClient.listWorkspaceMetadata({
                workspaceRoot: workspaceRoot,
            })
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
