import { WebSocketClient } from './client'
import { CodeWhispererServiceToken } from '../codeWhispererService'
import { WorkspaceFolder } from '@aws/language-server-runtimes/protocol'
import {
    CreateUploadUrlRequest,
    CreateWorkspaceResponse,
    WorkspaceMetadata,
} from '../../client/token/codewhispererbearertokenclient'
import { Logging } from '@aws/language-server-runtimes/server-interface'
import { ArtifactManager, FileMetadata } from './artifactManager'
import { findWorkspaceRootFolder, getSha256Async, uploadArtifactToS3 } from './util'

export type RemoteWorkspaceState = 'CREATED' | 'PENDING' | 'READY' | 'CONNECTED' | 'DELETING'

interface WorkspaceState {
    remoteWorkspaceState: RemoteWorkspaceState
    webSocketClient?: WebSocketClient
    workspaceId?: string
    requiresS3Upload?: boolean
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
    private static instance: WorkspaceFolderManager | undefined
    private workspaceFolders: WorkspaceFolder[]

    static createInstance(
        cwsprClient: CodeWhispererServiceToken,
        logging: Logging,
        artifactManager: ArtifactManager,
        workspaceFolders: WorkspaceFolder[]
    ): WorkspaceFolderManager {
        if (!this.instance) {
            this.instance = new WorkspaceFolderManager(cwsprClient, logging, artifactManager, workspaceFolders)
        }
        return this.instance
    }

    static getInstance(): WorkspaceFolderManager | undefined {
        return this.instance
    }

    private constructor(
        cwsprClient: CodeWhispererServiceToken,
        logging: Logging,
        artifactManager: ArtifactManager,
        workspaceFolders: WorkspaceFolder[]
    ) {
        this.cwsprClient = cwsprClient
        this.logging = logging
        this.artifactManager = artifactManager
        this.workspaceMap = new Map<WorkspaceRoot, WorkspaceState>()
        this.workspacesToPoll = []
        this.workspaceFolders = workspaceFolders
    }

    /**
     * The function is used to track the latest state of workspace folders.
     * This state is updated irrespective of login/logout/optIn/optOut
     * @param workspaceFolders
     */
    updateWorkspaceFolders(workspaceFolders: WorkspaceFolder[]) {
        this.workspaceFolders = workspaceFolders
    }

    updateWorkspaceEntry(workspaceRoot: WorkspaceRoot, workspaceState: WorkspaceState) {
        if (!workspaceState.messageQueue) {
            workspaceState.messageQueue = []
        }

        if (!this.workspaceMap.has(workspaceRoot)) {
            workspaceState.requiresS3Upload = true
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

    getWorkspaceDetailsWithId(
        fileUri: string,
        workspaceFolders?: WorkspaceFolder[]
    ): { workspaceDetails: WorkspaceState; workspaceRoot: WorkspaceFolder } | null {
        const workspaceRoot = findWorkspaceRootFolder(fileUri, workspaceFolders ?? this.workspaceFolders)
        if (!workspaceRoot) {
            return null
        }

        const workspaceDetails = this.getWorkspaces().get(workspaceRoot.uri)
        if (!workspaceDetails || !workspaceDetails.workspaceId) {
            this.logging.log(`Workspace folder ${workspaceRoot.uri} is under processing`)
            return null
        }

        return { workspaceDetails, workspaceRoot }
    }

    getWorkspaceFolder(fileUri: string): WorkspaceFolder | undefined {
        const workspaceRoot = findWorkspaceRootFolder(fileUri, this.workspaceFolders)
        return workspaceRoot
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

    private async pollWorkspaceUntilReadyOrStateChange(
        workspace: WorkspaceRoot,
        timeout: number = 300000 // 5 minutes default timeout
    ): Promise<WorkspaceStateChange> {
        return new Promise((resolve, reject) => {
            const startTime = Date.now()
            const initialState = this.workspaceMap.get(workspace)?.remoteWorkspaceState

            if (!initialState) {
                return reject(`Can't find initial state of the workspace`)
            }
            if (initialState === 'READY' || initialState === 'CONNECTED') {
                return resolve({
                    workspace,
                    previousState: initialState,
                    currentState: initialState,
                })
            }

            const pollIntervalId = setInterval(async () => {
                try {
                    const { metadata, optOut } = await this.listWorkspaceMetadata(workspace)
                    if (optOut) {
                        clearInterval(pollIntervalId)
                        return reject(new Error(`Workspace ${workspace} is opted out`))
                    }
                    const currentState = metadata?.workspaceStatus

                    if (currentState && currentState !== initialState) {
                        clearInterval(pollIntervalId)
                        return resolve({
                            workspace,
                            previousState: initialState,
                            currentState,
                        })
                    }

                    if (Date.now() - startTime > timeout) {
                        clearInterval(pollIntervalId)
                        return reject(new Error(`Polling timeout for workspace ${workspace}`))
                    }
                } catch (error) {
                    clearInterval(pollIntervalId)
                    return reject(error)
                }
            }, this.pollInterval)
        })
    }

    private async establishConnection(workspace: WorkspaceRoot) {
        const { metadata, optOut } = await this.listWorkspaceMetadata(workspace)
        if (optOut) {
            throw new Error(`Workspace ${workspace} is opted out`)
        }
        if (!metadata?.environmentId) {
            throw new Error('No environment ID found for ready workspace')
        }
        // TODO, Change this to the PROD URL when MDE is ready
        const websocketUrl = `ws://${metadata.environmentId}--8081.localhost:8080/ws`
        this.logging.log(`Establishing connection to ${websocketUrl}`)

        const webSocketClient = new WebSocketClient(websocketUrl, this.logging)
        this.updateWorkspaceEntry(workspace, {
            remoteWorkspaceState: 'CONNECTED',
            webSocketClient,
        })

        this.processMessagesInQueue(workspace)
    }

    async clearWorkspaceResources(workspace: WorkspaceRoot, workspaceState: WorkspaceState) {
        if (workspaceState.webSocketClient) {
            workspaceState.webSocketClient.disconnect()
        }
        if (workspaceState.workspaceId) {
            await this.deleteWorkspace(workspaceState.workspaceId)
        }
        this.removeWorkspaceEntry(workspace)
    }

    private optOutCheckScheduler() {
        setInterval(
            async () => {
                const workspaceMap = this.getWorkspaces()
                for (const [workspace, workspaceState] of workspaceMap) {
                    const { metadata, optOut } = await this.listWorkspaceMetadata(workspace)
                    if (optOut) {
                        this.logging.log(`Workspace ${workspace} is opted out`)
                        await this.clearWorkspaceResources(workspace, workspaceState)
                    }
                }
            },
            5 * 60 * 1000
        )
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
        const { metadata, optOut } = await this.listWorkspaceMetadata(workspace)
        if (optOut) {
            this.logging.log(`Not creating a new workspace ${workspace}, it is opted out`)
            return
        }

        if (metadata && metadata.workspaceStatus !== 'CREATED') {
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
            const stateChange = await this.pollWorkspaceUntilReadyOrStateChange(workspace)

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
     * The function sends a removed workspace folders notification to remote LSP, removes workspace entry
     * from map and close the websocket connection
     * @param workspaceFolder
     */
    async processWorkspaceFoldersDeletion(workspaceFolders: WorkspaceFolder[]) {
        for (const folder of workspaceFolders) {
            const workspaceDetails = this.workspaceMap.get(folder.uri)
            const websocketClient = workspaceDetails?.webSocketClient
            if (websocketClient) {
                websocketClient.send(
                    JSON.stringify({
                        method: 'workspace/didChangeWorkspaceFolders',
                        params: {
                            workspaceFoldersChangeEvent: {
                                added: [],
                                removed: [
                                    {
                                        uri: '/',
                                        name: folder.name,
                                    },
                                ],
                            },
                            workspaceChangeMetadata: {
                                workspaceId: this.getWorkspaces().get(folder.uri)?.workspaceId ?? '',
                                // s3Path: '',
                                programmingLanguage: '',
                            },
                        },
                    })
                )
                websocketClient.disconnect()
            }
            this.removeWorkspaceEntry(folder.uri)
        }
        await this.artifactManager.removeWorkspaceFolders(workspaceFolders)
    }

    private processMessagesInQueue(workspaceRoot: WorkspaceRoot) {
        const workspaceDetails = this.workspaceMap.get(workspaceRoot)
        while (workspaceDetails?.messageQueue && workspaceDetails.messageQueue.length > 0) {
            const message = workspaceDetails.messageQueue.shift()
            workspaceDetails.webSocketClient?.send(message)
        }
    }

    async uploadToS3(fileMetadata: FileMetadata): Promise<string | undefined> {
        let relativePath = fileMetadata.relativePath.replace(fileMetadata.workspaceFolder.name, '')
        relativePath = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath
        const workspaceId = this.getWorkspaces().get(fileMetadata.workspaceFolder.uri)?.workspaceId ?? ''
        if (!workspaceId) {
            this.logging.warn(`Workspace ID is not found for ${fileMetadata.workspaceFolder.uri}`)
            return
        }

        let s3Url: string | undefined
        try {
            const sha256 = await getSha256Async(fileMetadata.content)
            const request: CreateUploadUrlRequest = {
                artifactType: 'SourceCode',
                contentChecksumType: 'SHA_256',
                contentChecksum: sha256,
                uploadIntent: 'WORKSPACE_CONTEXT',
                uploadContext: {
                    workspaceContextUploadContext: {
                        workspaceId: workspaceId,
                        relativePath: relativePath,
                        programmingLanguage: {
                            languageName: fileMetadata.language,
                        },
                    },
                },
            }
            const response = await this.cwsprClient.createUploadUrl(request)
            s3Url = response.uploadUrl
            await uploadArtifactToS3(Buffer.from(fileMetadata.content), response)
        } catch (e: any) {
            this.logging.warn(`Error uploading file to S3: ${e.message}`)
        }
        return s3Url
    }

    /**
     * All the filesMetadata elements passed to the function belongs to the same workspace folder.
     * @param filesMetadata
     * @private
     */
    private async uploadS3AndQueueEvents(filesMetadata: FileMetadata[]) {
        if (filesMetadata.length == 0) {
            return
        }
        const inMemoryQueueEvents: any[] = []
        for (const fileMetadata of filesMetadata) {
            const s3Url = await this.uploadToS3(fileMetadata)
            if (!s3Url) {
                continue
            }
            inMemoryQueueEvents.push(
                JSON.stringify({
                    method: 'workspace/didChangeWorkspaceFolders',
                    params: {
                        workspaceFoldersChangeEvent: {
                            added: [
                                {
                                    uri: '/',
                                    name: fileMetadata.workspaceFolder.name,
                                },
                            ],
                            removed: [],
                        },
                        workspaceChangeMetadata: {
                            workspaceId: this.getWorkspaces().get(fileMetadata.workspaceFolder.uri)?.workspaceId ?? '',
                            s3Path: s3Url,
                            programmingLanguage: fileMetadata.language,
                        },
                    },
                })
            )
        }

        const workspaceDetails = this.getWorkspaces().get(filesMetadata[0].workspaceFolder.uri)
        if (workspaceDetails?.webSocketClient) {
            inMemoryQueueEvents.forEach(event => {
                workspaceDetails.webSocketClient?.send(event)
            })
        } else {
            workspaceDetails?.messageQueue?.push(...inMemoryQueueEvents)
        }
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
        this.logging.log(`Length of file metadata for new workspace folders: ${JSON.stringify(foldersMetadata.length)}`)

        const fileMetadataMap: Map<string, FileMetadata[]> = new Map<string, FileMetadata[]>()
        foldersMetadata.forEach((fileMetadata: FileMetadata) => {
            let metadata = fileMetadataMap.get(fileMetadata.workspaceFolder.uri)
            if (!metadata) {
                metadata = []
                fileMetadataMap.set(fileMetadata.workspaceFolder.uri, metadata)
            }
            metadata.push(fileMetadata)
        })

        folders.forEach(folder => {
            const workspaceDetails = this.getWorkspaces().get(folder.uri)
            if (workspaceDetails) {
                workspaceDetails.requiresS3Upload = true
            }
        })
        await this.uploadWithTimeout(fileMetadataMap)

        this.optOutCheckScheduler()

        for (const folder of folders) {
            this.handleNewWorkspace(folder.uri).catch(e => {
                this.logging.warn(`Error processing new workspace: ${e}`)
            })
        }
    }

    private async uploadWithTimeout(fileMetadataMap: Map<string, FileMetadata[]>) {
        const keys = [...fileMetadataMap.keys()]
        const totalWorkspaces = keys.length
        let workspacesWithS3UploadComplete = 0

        for (const key of keys) {
            const workspaceDetails = this.getWorkspaces().get(key)
            if (!workspaceDetails) {
                continue
            }

            if (workspaceDetails.workspaceId && workspaceDetails.requiresS3Upload) {
                this.logging.log(`Starting S3 upload for ${key}, workspace id: ${workspaceDetails.workspaceId}`)
                await this.uploadS3AndQueueEvents(fileMetadataMap.get(key) ?? [])
                workspaceDetails.requiresS3Upload = false
            }
            // This if condition needs to be separate because workspacesWithS3UploadComplete variable is set to 0 every time this function is called
            // If this function is run once and uploads some of the workspace folders, we need to ensure we don't forget about already uploaded folders the next time the function is run
            if (workspaceDetails.workspaceId) {
                workspacesWithS3UploadComplete++
            }
        }

        if (totalWorkspaces !== workspacesWithS3UploadComplete) {
            // Schedule next check if not all workspaces are complete
            // Notice that we don't await the uploadWithTimeout now, it is fire and forget at the moment
            setTimeout(() => this.uploadWithTimeout(fileMetadataMap), 3000)
        } else {
            this.logging.log(`All workspaces with S3 upload complete`)
        }
    }

    async deleteWorkspace(workspaceId: string) {
        try {
            await this.cwsprClient.deleteWorkspace({
                workspaceId: workspaceId,
            })
            this.logging.log(`Workspace (${workspaceId}) deleted successfully`)
        } catch (e: any) {
            this.logging.warn(`Error while deleting workspace (${workspaceId}): ${e.message}`)
        }
    }

    /**
     * The function fetches remote workspace metadata. There'll always be single entry for workspace
     * metadata in the response, so intentionally picking the first index element.
     * @param workspaceRoot
     * @private
     */
    private async listWorkspaceMetadata(workspaceRoot: WorkspaceRoot): Promise<{
        metadata: WorkspaceMetadata | undefined | null
        optOut: boolean
    }> {
        let metadata: WorkspaceMetadata | undefined | null
        let optOut = false
        try {
            const response = await this.cwsprClient.listWorkspaceMetadata({
                workspaceRoot: workspaceRoot,
            })
            this.logging.log(`ListWorkspaceMetadata response: ${JSON.stringify(response)}`)
            metadata = response && response.workspaces.length ? response.workspaces[0] : null
        } catch (e: any) {
            this.logging.warn(`Error while fetching workspace (${workspaceRoot}) metadata: ${e?.message}`)
            if (e?.__type?.includes('AccessDeniedException')) {
                this.logging.warn(`Access denied while fetching workspace (${workspaceRoot}) metadata.`)
                optOut = true
            }
        }
        return { metadata, optOut }
    }

    private async createWorkspace(workspaceRoot: WorkspaceRoot) {
        let response: CreateWorkspaceResponse | undefined | null
        try {
            response = await this.cwsprClient.createWorkspace({
                workspaceRoot: workspaceRoot,
            })
            this.logging.log(`CreateWorkspace response for ${workspaceRoot}: ${JSON.stringify(response)}`)
        } catch (e: any) {
            this.logging.warn(`Error while creating workspace (${workspaceRoot}): ${e.message}`)
        }
        return response
    }
}
