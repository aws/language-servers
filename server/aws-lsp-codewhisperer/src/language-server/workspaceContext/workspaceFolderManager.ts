import { WebSocketClient } from './client'
import { CodeWhispererServiceToken } from '../codeWhispererService'
import { WorkspaceFolder } from '@aws/language-server-runtimes/protocol'
import {
    CreateUploadUrlRequest,
    CreateWorkspaceResponse,
    WorkspaceMetadata,
    WorkspaceStatus,
} from '../../client/token/codewhispererbearertokenclient'
import { CredentialsProvider, Logging } from '@aws/language-server-runtimes/server-interface'
import { ArtifactManager, FileMetadata } from './artifactManager'
import {
    cleanUrl,
    findWorkspaceRootFolder,
    getSha256Async,
    isLoggedInUsingBearerToken,
    uploadArtifactToS3,
} from './util'

interface WorkspaceState {
    remoteWorkspaceState: WorkspaceStatus
    webSocketClient?: WebSocketClient
    workspaceId?: string
    requiresS3Upload?: boolean
    messageQueue?: any[]
}

type WorkspaceRoot = string

export class WorkspaceFolderManager {
    private cwsprClient: CodeWhispererServiceToken
    private logging: Logging
    private artifactManager: ArtifactManager
    private workspaceMap: Map<WorkspaceRoot, WorkspaceState>
    private static instance: WorkspaceFolderManager | undefined
    private workspaceFolders: WorkspaceFolder[]
    private credentialsProvider: CredentialsProvider
    private readonly INITIAL_CHECK_INTERVAL = 5 * 1000 // 5 seconds
    private readonly INITIAL_TIMEOUT = 5 * 60 * 1000 // 5 minutes
    private readonly CONTINUOUS_MONITOR_INTERVAL = 5 * 60 * 1000 // 5 minutes
    private monitorIntervals: Map<string, NodeJS.Timeout> = new Map()

    static createInstance(
        cwsprClient: CodeWhispererServiceToken,
        logging: Logging,
        artifactManager: ArtifactManager,
        workspaceFolders: WorkspaceFolder[],
        credentialsProvider: CredentialsProvider
    ): WorkspaceFolderManager {
        if (!this.instance) {
            this.instance = new WorkspaceFolderManager(
                cwsprClient,
                logging,
                artifactManager,
                workspaceFolders,
                credentialsProvider
            )
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
        workspaceFolders: WorkspaceFolder[],
        credentialsProvider: CredentialsProvider
    ) {
        this.cwsprClient = cwsprClient
        this.logging = logging
        this.artifactManager = artifactManager
        this.workspaceMap = new Map<WorkspaceRoot, WorkspaceState>()
        this.workspaceFolders = workspaceFolders
        this.credentialsProvider = credentialsProvider
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

    getWorkspaceDetailsByWorkspaceFolder(workspaceFolder?: WorkspaceFolder): WorkspaceState | null {
        if (!workspaceFolder) {
            return null
        }
        const workspaceDetails = this.getWorkspaces().get(workspaceFolder.uri)
        if (!workspaceDetails || !workspaceDetails.workspaceId) {
            return null
        }
        return workspaceDetails
    }

    getWorkspaceFolder(fileUri: string): WorkspaceFolder | undefined {
        const workspaceRoot = findWorkspaceRootFolder(fileUri, this.workspaceFolders)
        return workspaceRoot
    }

    getWorkspaceId(workspaceFolder?: WorkspaceFolder): string | undefined {
        if (!workspaceFolder) {
            return undefined
        }
        const workspaceDetails = this.getWorkspaces().get(workspaceFolder.uri)
        if (!workspaceDetails || !workspaceDetails.workspaceId) {
            this.logging.log(`Workspace folder ${workspaceFolder.uri} is under processing`)
            return undefined
        }
        return workspaceDetails.workspaceId
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

        for (const folder of folders) {
            this.handleNewWorkspace(folder.uri).catch(e => {
                this.logging.warn(`Error processing new workspace: ${e}`)
            })
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
            // Override upload id to be workspace id
            await uploadArtifactToS3(
                Buffer.isBuffer(fileMetadata.content) ? fileMetadata.content : Buffer.from(fileMetadata.content),
                { ...response, uploadId: workspaceId }
            )
        } catch (e: any) {
            this.logging.warn(`Error uploading file to S3: ${e.message}`)
        }
        return s3Url
    }

    async clearAllWorkspaceResources() {
        for (const workspace of this.monitorIntervals.keys()) {
            this.stopMonitoring(workspace)
        }

        for (const { webSocketClient, workspaceId } of this.workspaceMap.values()) {
            if (webSocketClient) {
                webSocketClient.destroyClient()
            }

            if (workspaceId) {
                await this.deleteWorkspace(workspaceId)
            }
        }

        this.workspaceMap.clear()
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

            const languagesMap = this.artifactManager.getLanguagesForWorkspaceFolder(folder)
            const programmingLanguages = languagesMap ? Array.from(languagesMap.keys()) : []

            if (websocketClient) {
                for (const language of programmingLanguages) {
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
                                    programmingLanguage: language,
                                },
                            },
                        })
                    )
                }
                websocketClient.disconnect()
            }
            this.removeWorkspaceEntry(folder.uri)
        }
        await this.artifactManager.removeWorkspaceFolders(workspaceFolders)
    }

    private async createNewWorkspace(workspace: WorkspaceRoot) {
        const createWorkspaceResult = await this.createWorkspace(workspace)
        const workspaceDetails = createWorkspaceResult.response
        if (!workspaceDetails) {
            this.logging.warn(`Failed to create workspace for ${workspace}`)
            return createWorkspaceResult
        }

        this.updateWorkspaceEntry(workspace, {
            remoteWorkspaceState: workspaceDetails.workspace.workspaceStatus,
            workspaceId: workspaceDetails.workspace.workspaceId,
        })

        return createWorkspaceResult
    }

    private async establishConnection(workspace: WorkspaceRoot) {
        const existingState = this.workspaceMap.get(workspace)
        this.logging.log(`Establishing connection to ${workspace}`)
        const { metadata, optOut } = await this.listWorkspaceMetadata(workspace)
        if (optOut) {
            throw new Error(`Workspace ${workspace} is opted out`)
        }
        if (!metadata?.environmentId) {
            throw new Error('No environment ID found for ready workspace')
        }
        // TODO, Change this to the PROD URL when MDE is ready
        const websocketUrl = `wss://${metadata.environmentId}--8081.wc.gamma-us-west-2.codewhisperer.ai.aws.dev/ws`
        this.logging.log(`Establishing connection to ${websocketUrl}`)

        if (existingState?.webSocketClient) {
            const websocketConnectionState = existingState.webSocketClient.getWebsocketReadyState()
            if (websocketConnectionState === 'OPEN') {
                this.logging.log(`Active connection already exists for ${workspace}`)
                return
            }
            // If the client exists but isn't connected, it might be in the process of connecting
            if (websocketConnectionState === 'CONNECTING') {
                this.logging.log(`Connection attempt already in progress for ${workspace}`)
                return
            }
        }

        const webSocketClient = new WebSocketClient(websocketUrl, this.logging, this.credentialsProvider)
        this.updateWorkspaceEntry(workspace, {
            remoteWorkspaceState: 'CONNECTED',
            webSocketClient,
            messageQueue: existingState?.messageQueue || [],
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
        const { metadata, optOut } = await this.listWorkspaceMetadata(workspace)
        if (optOut) {
            this.logging.log(`Not creating a new workspace ${workspace}, it is opted out`)
            return
        }

        if (metadata) {
            // Workspace exists remotely, add to map with current state
            this.updateWorkspaceEntry(workspace, {
                workspaceId: metadata.workspaceId,
                remoteWorkspaceState: metadata.workspaceStatus,
                messageQueue: queueEvents ?? [],
            })
        } else {
            // Create new workspace
            const createWorkspaceResult = await this.createNewWorkspace(workspace)
            if (createWorkspaceResult.error && createWorkspaceResult.error.retryable) {
                this.logging.log(`Workspace creation failed with retryable error, starting monitor`)
                this.updateWorkspaceEntry(workspace, {
                    remoteWorkspaceState: 'CREATION_PENDING',
                    messageQueue: queueEvents ?? [],
                })
            }
        }

        this.startWorkspaceStatusMonitor(workspace).catch(error => {
            this.logging.error(`Error starting workspace monitor for ${workspace}: ${error}`)
        })
    }

    private async waitForInitialConnection(workspace: WorkspaceRoot): Promise<boolean> {
        this.logging.log(`Waiting for initial connection to ${workspace}`)
        return new Promise(resolve => {
            const startTime = Date.now()

            const intervalId = setInterval(async () => {
                try {
                    const workspaceState = this.workspaceMap.get(workspace)
                    if (!workspaceState) {
                        this.logging.log(`No workspace state for ${workspace}, stopping monitoring`)
                        clearInterval(intervalId)
                        return resolve(false)
                    }

                    const { metadata, optOut } = await this.listWorkspaceMetadata(workspace)

                    if (optOut) {
                        this.logging.log(`Workspace ${workspace} is opted out during initial connection`)
                        await this.clearWorkspaceResources(workspace, workspaceState)
                        clearInterval(intervalId)
                        return resolve(false)
                    }

                    if (!metadata) {
                        // Continue polling by exiting only this iteration
                        return
                    }

                    this.updateWorkspaceEntry(workspace, {
                        ...workspaceState,
                        remoteWorkspaceState: metadata.workspaceStatus,
                    })

                    switch (metadata.workspaceStatus) {
                        case 'READY':
                            const client = workspaceState.webSocketClient
                            if (!client || !client.isConnected()) {
                                await this.establishConnection(workspace)
                            }
                            clearInterval(intervalId)
                            return resolve(true)
                        case 'PENDING':
                            // Continue polling
                            break
                        case 'CREATED':
                            const createWorkspaceResult = await this.createNewWorkspace(workspace)
                            // If createWorkspace call returns a retyrable error, next interval will retry
                            // If the call returns non-retryable error, we will re-throw the error and it will stop the interval
                            if (createWorkspaceResult.error && !createWorkspaceResult.error.retryable) {
                                throw createWorkspaceResult.error.originalError
                            }
                            break
                        default:
                            this.logging.warn(`Unknown workspace status: ${metadata.workspaceStatus}`)
                            clearInterval(intervalId)
                            return resolve(false)
                    }

                    if (Date.now() - startTime >= this.INITIAL_TIMEOUT) {
                        this.logging.warn(`Initial connection timeout for workspace ${workspace}`)
                        clearInterval(intervalId)
                        return resolve(false)
                    }
                } catch (error: any) {
                    this.logging.error(`Error during initial connection for workspace ${workspace}: ${error}`)
                    clearInterval(intervalId)
                    return resolve(false)
                }
            }, this.INITIAL_CHECK_INTERVAL)
        })
    }

    private startContinuousMonitor(workspace: WorkspaceRoot) {
        this.logging.log(`Starting continuous monitor for workspace ${workspace}`)
        const intervalId = setInterval(async () => {
            try {
                const workspaceState = this.workspaceMap.get(workspace)
                if (!workspaceState) {
                    this.stopMonitoring(workspace)
                    return
                }

                const { metadata, optOut } = await this.listWorkspaceMetadata(workspace)

                if (optOut) {
                    this.logging.log(`Workspace ${workspace} is opted out`)
                    await this.clearWorkspaceResources(workspace, workspaceState)
                    this.stopMonitoring(workspace)
                    return
                }

                if (!metadata) {
                    return
                }

                this.updateWorkspaceEntry(workspace, {
                    ...workspaceState,
                    remoteWorkspaceState: metadata.workspaceStatus,
                })

                switch (metadata.workspaceStatus) {
                    case 'READY':
                        // Check if connection exists
                        const client = workspaceState.webSocketClient
                        if (!client || !client.isConnected()) {
                            this.logging.log(
                                `Workspace ${workspace} is ready but no connection exists or connection lost`
                            )
                            await this.establishConnection(workspace)
                        }
                        break
                    case 'PENDING':
                        // Do nothing while pending
                        break
                    case 'CREATED':
                        await this.handleWorkspaceCreatedState(workspace)
                        break
                    default:
                        this.logging.warn(`Unknown workspace status: ${metadata.workspaceStatus}`)
                }
            } catch (error) {
                this.logging.error(`Error monitoring workspace ${workspace}: ${error}`)
            }
        }, this.CONTINUOUS_MONITOR_INTERVAL)

        this.monitorIntervals.set(workspace, intervalId)
    }

    /**
     * Handles the workspace creation flow when a remote workspace is in CREATED state.
     * Attempts to create the workspace and schedules a quick connection check on success.
     * If the initial creation fails with a retryable error, attempts one retry before
     * falling back to the regular polling cycle.
     *
     * The flow is:
     * 1. Attempt initial workspace creation
     * 2. On success: Schedule a quick check to establish connection
     * 3. On retryable error: Attempt one immediate retry
     * 4. On retry success: Schedule a quick check
     * 5. On retry failure: Wait for next regular polling cycle
     *
     * @param workspace - The workspace to re-create
     */
    private async handleWorkspaceCreatedState(workspace: WorkspaceRoot): Promise<void> {
        // If remote state is CREATED, call create API to create a new workspace
        const initialResult = await this.createNewWorkspace(workspace)

        // If creation succeeds, schedule a single connection attempt to happen in 30 seconds
        if (initialResult.response) {
            this.logging.log(`Workspace ${workspace} created successfully, scheduling quick check for connection`)
            this.scheduleQuickCheck(workspace)
            return
        }

        // If creation fails with a non-retryable error, don't do anything
        // Continuous monitor will evaluate the status again in 5 minutes
        if (!initialResult.error?.retryable) {
            return
        }

        this.logging.log(`Retryable error for workspace ${workspace}, attempting one retry: ${initialResult.error}`)
        const retryResult = await this.createNewWorkspace(workspace)

        if (retryResult.error) {
            this.logging.log(
                `Retry failed for workspace ${workspace}: ${retryResult.error}, will wait for next polling cycle`
            )
            return
        }

        this.logging.log(`Retry succeeded for workspace ${workspace}, scheduling quick check`)
        this.scheduleQuickCheck(workspace)
    }

    /**
     * Schedules a one-time check after workspace creation to establish connection as soon as possible.
     * This avoids waiting for the regular 5-minute polling interval when we know the workspace
     * should be ready soon. Default check delay is 30 seconds after successful workspace creation.
     *
     * @param workspace - The workspace to check
     * @param delayMs - Optional delay in milliseconds before the check (defaults to 30000ms)
     */
    private scheduleQuickCheck(workspace: WorkspaceRoot, delayMs: number = 30000) {
        this.logging.log(`Scheduling quick check for workspace ${workspace} in ${delayMs}ms`)
        setTimeout(async () => {
            try {
                const workspaceState = this.workspaceMap.get(workspace)
                if (!workspaceState) {
                    this.logging.log(`No workspace state found during quick check`)
                    return
                }

                const { metadata, optOut } = await this.listWorkspaceMetadata(workspace)

                if (optOut) {
                    this.logging.log(`Workspace ${workspace} is opted out during quick check`)
                    return
                }

                if (!metadata) {
                    this.logging.log(`No metadata available during quick check`)
                    return
                }

                if (metadata.workspaceStatus === 'READY') {
                    this.logging.log(`Quick check found workspace ${workspace} is ready, attempting connection`)
                    await this.establishConnection(workspace)
                } else {
                    this.logging.log(`Quick check found workspace ${workspace} state is ${metadata.workspaceStatus}`)
                }
            } catch (error) {
                this.logging.error(`Error during quick check for workspace ${workspace}: ${error}`)
            }
        }, delayMs)
    }

    private stopMonitoring(workspace: WorkspaceRoot) {
        this.logging.log(`Stopping monitoring for workspace ${workspace}`)
        const intervalId = this.monitorIntervals.get(workspace)
        if (intervalId) {
            clearInterval(intervalId)
            this.monitorIntervals.delete(workspace)
        }
    }

    private async startWorkspaceStatusMonitor(workspace: WorkspaceRoot) {
        const success = await this.waitForInitialConnection(workspace)
        this.logging.log(
            `Initial connection ${success ? 'successful' : 'failed'} for ${workspace}, starting continuous monitor`
        )
        this.startContinuousMonitor(workspace)
    }

    private async clearWorkspaceResources(workspace: WorkspaceRoot, workspaceState: WorkspaceState) {
        this.stopMonitoring(workspace)
        if (workspaceState.webSocketClient) {
            workspaceState.webSocketClient.disconnect()
        }
        if (workspaceState.workspaceId) {
            await this.deleteWorkspace(workspaceState.workspaceId)
        }
        this.removeWorkspaceEntry(workspace)
    }

    private processMessagesInQueue(workspaceRoot: WorkspaceRoot) {
        const workspaceDetails = this.workspaceMap.get(workspaceRoot)
        while (workspaceDetails?.messageQueue && workspaceDetails.messageQueue.length > 0) {
            const message = workspaceDetails.messageQueue.shift()
            workspaceDetails.webSocketClient?.send(message)
        }
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
                            s3Path: cleanUrl(s3Url),
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
            // Clean up source code zip files after S3 upload
            // Preserve dependencies because they might still be processing
            // LanguageDependencyHandler is responsible for deleting dependency zips
            this.artifactManager.cleanup(true)
        }
    }

    private async deleteWorkspace(workspaceId: string) {
        try {
            if (isLoggedInUsingBearerToken(this.credentialsProvider)) {
                await this.cwsprClient.deleteWorkspace({
                    workspaceId: workspaceId,
                })
                this.logging.log(`Workspace (${workspaceId}) deleted successfully`)
            } else {
                this.logging.log(`Skipping workspace (${workspaceId}) deletion because user is not logged in`)
            }
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
            this.logging.log(`ListWorkspaceMetadata response for ${workspaceRoot}: ${JSON.stringify(response)}`)
            metadata = response && response.workspaces.length ? response.workspaces[0] : null
        } catch (e: any) {
            this.logging.warn(`Error while fetching workspace (${workspaceRoot}) metadata: ${e?.message}, ${e?.__type}`)
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
            return { response, error: null }
        } catch (e: any) {
            this.logging.warn(
                `Error while creating workspace (${workspaceRoot}): ${e.message}. Error is ${e.retryable ? '' : 'not'} retryable}`
            )
            const error = {
                message: e.message,
                retryable: e.retryable ?? false,
                originalError: e,
            }
            return { response: null, error }
        }
    }
}
