import { WebSocketClient } from './client'
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
import { DependencyDiscoverer } from './dependency/dependencyDiscoverer'
import { AmazonQTokenServiceManager } from '../../shared/amazonQServiceManager/AmazonQTokenServiceManager'

interface WorkspaceState {
    remoteWorkspaceState: WorkspaceStatus
    webSocketClient?: WebSocketClient
    workspaceId?: string
    requiresS3Upload?: boolean
    messageQueue?: any[]
}

type WorkspaceRoot = string

export class WorkspaceFolderManager {
    private serviceManager: AmazonQTokenServiceManager
    private logging: Logging
    private artifactManager: ArtifactManager
    private dependencyDiscoverer: DependencyDiscoverer
    private workspaceMap: Map<WorkspaceRoot, WorkspaceState>
    private static instance: WorkspaceFolderManager | undefined
    private workspaceFolders: WorkspaceFolder[]
    private credentialsProvider: CredentialsProvider
    private readonly INITIAL_CHECK_INTERVAL = 40 * 1000 // 40 seconds
    private readonly INITIAL_TIMEOUT = 2 * 60 * 1000 // 2 minutes
    private readonly CONTINUOUS_MONITOR_INTERVAL = 5 * 60 * 1000 // 5 minutes
    private monitorIntervals: Map<string, NodeJS.Timeout> = new Map()
    private isOptedOut: boolean = false

    static createInstance(
        serviceManager: AmazonQTokenServiceManager,
        logging: Logging,
        artifactManager: ArtifactManager,
        dependencyDiscoverer: DependencyDiscoverer,
        workspaceFolders: WorkspaceFolder[],
        credentialsProvider: CredentialsProvider
    ): WorkspaceFolderManager {
        if (!this.instance) {
            this.instance = new WorkspaceFolderManager(
                serviceManager,
                logging,
                artifactManager,
                dependencyDiscoverer,
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
        serviceManager: AmazonQTokenServiceManager,
        logging: Logging,
        artifactManager: ArtifactManager,
        dependencyDiscoverer: DependencyDiscoverer,
        workspaceFolders: WorkspaceFolder[],
        credentialsProvider: CredentialsProvider
    ) {
        this.serviceManager = serviceManager
        this.logging = logging
        this.artifactManager = artifactManager
        this.dependencyDiscoverer = dependencyDiscoverer
        this.workspaceMap = new Map<WorkspaceRoot, WorkspaceState>()
        this.workspaceFolders = workspaceFolders
        this.credentialsProvider = credentialsProvider

        this.dependencyDiscoverer.dependencyHandlerRegistry.forEach(handler => {
            handler.onDependencyChange(async (workspaceFolder, zips) => {
                try {
                    this.logging.log(`Dependency change detected in ${workspaceFolder.uri}`)

                    // Process the dependencies
                    await this.handleDependencyChanges(zips)

                    // Clean up only after successful processing
                    await handler.cleanupZipFiles(zips)
                } catch (error) {
                    this.logging.warn(`Error handling dependency change: ${error}`)
                }
            })
        })
    }

    /**
     * The function is used to track the latest state of workspace folders.
     * This state is updated irrespective of login/logout/optIn/optOut
     * @param workspaceFolders
     */
    updateWorkspaceFolders(workspaceFolders: WorkspaceFolder[]) {
        this.workspaceFolders = workspaceFolders
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
        if (!workspaceDetails) {
            this.logging.log(`Workspace details not found for workspace folder ${workspaceRoot.uri}`)
            return null
        }

        if (!workspaceDetails.workspaceId) {
            this.logging.log(
                `Workspace initialization in progress - workspaceId not yet assigned for: ${workspaceRoot.uri}`
            )
            return { workspaceDetails, workspaceRoot }
        }

        return { workspaceDetails, workspaceRoot }
    }

    getWorkspaceFolder(fileUri: string): WorkspaceFolder | undefined {
        return findWorkspaceRootFolder(fileUri, this.workspaceFolders)
    }

    getWorkspaceId(workspaceFolder?: WorkspaceFolder): string | undefined {
        if (!workspaceFolder) {
            return undefined
        }
        const workspaceDetails = this.getWorkspaces().get(workspaceFolder.uri)
        if (!workspaceDetails || !workspaceDetails.workspaceId) {
            this.logging.log(
                `Unable to retrieve workspaceId - workspace initialization incomplete for: ${workspaceFolder.uri}`
            )
            return undefined
        }
        return workspaceDetails.workspaceId
    }

    getOptOutStatus(): boolean {
        return this.isOptedOut
    }

    async processNewWorkspaceFolders(folders: WorkspaceFolder[]) {
        // Check if user is opted in before trying to process any files
        const { optOut } = await this.listWorkspaceMetadata()
        if (optOut) {
            this.logging.log('User is opted out, clearing resources and starting opt-out monitor')
            this.isOptedOut = true
            await this.clearAllWorkspaceResources()
            await this.startOptOutMonitor()
            return
        }

        // CreateWorkspace and Setup state machine workflow
        for (const folder of folders) {
            await this.handleNewWorkspace(folder.uri).catch(e => {
                this.logging.warn(`Error processing new workspace ${folder.uri} with error: ${e}`)
            })
        }
        // Snapshot the workspace
        this.snapshotWorkspace(folders).catch(e => {
            this.logging.warn(`Error during snapshot workspace: ${e}`)
        })
    }

    private async snapshotWorkspace(folders: WorkspaceFolder[]) {
        let sourceCodeMetadata: FileMetadata[] = []
        sourceCodeMetadata = await this.artifactManager.addWorkspaceFolders(folders)
        //  Kick off dependency discovery but don't wait
        this.dependencyDiscoverer.searchDependencies(folders).catch(e => {
            this.logging.warn(`Error during dependency discovery: ${e}`)
        })

        const fileMetadataMap: Map<string, FileMetadata[]> = new Map<string, FileMetadata[]>()
        sourceCodeMetadata.forEach((fileMetadata: FileMetadata) => {
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
    }

    async uploadToS3(fileMetadata: FileMetadata): Promise<string | undefined> {
        let relativePath = fileMetadata.relativePath.replace(fileMetadata.workspaceFolder.name, '')
        relativePath = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath
        const workspaceId = this.getWorkspaces().get(fileMetadata.workspaceFolder.uri)?.workspaceId ?? ''
        if (!workspaceId) {
            this.logging.warn(
                `Workspace ID is not found for folder ${fileMetadata.workspaceFolder.uri}, skipping S3 upload`
            )
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
            const response = await this.serviceManager.getCodewhispererService().createUploadUrl(request)
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

        for (const { webSocketClient } of this.workspaceMap.values()) {
            webSocketClient?.destroyClient()
        }

        this.workspaceMap.clear()
        this.artifactManager.cleanup()
        this.dependencyDiscoverer.dispose()
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
                    // Wait for message being sent before disconnecting
                    await websocketClient
                        .send(
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
                        .catch(e => {
                            this.logging.error(`Error sending didChangeWorkspaceFolders message: ${e}`)
                        })
                }
                websocketClient.disconnect()
            }
            this.removeWorkspaceEntry(folder.uri)
            this.dependencyDiscoverer.disposeWorkspaceFolder(folder)
            this.stopMonitoring(folder.uri)
        }
        await this.artifactManager.removeWorkspaceFolders(workspaceFolders)
    }

    processRemoteWorkspaceRefresh(workspaceFolders: WorkspaceFolder[]) {
        for (const folder of workspaceFolders) {
            const workspaceDetails = this.workspaceMap.get(folder.uri)
            const websocketClient = workspaceDetails?.webSocketClient
            if (websocketClient) {
                websocketClient.destroyClient()
            }
            this.removeWorkspaceEntry(folder.uri)

            this.dependencyDiscoverer.disposeWorkspaceFolder(folder)
        }
    }

    private updateWorkspaceEntry(workspaceRoot: WorkspaceRoot, workspaceState: WorkspaceState) {
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

    private removeWorkspaceEntry(workspaceRoot: WorkspaceRoot) {
        this.workspaceMap.delete(workspaceRoot)
    }

    private async handleDependencyChanges(zips: FileMetadata[]): Promise<void> {
        this.logging.log(`Processing ${zips.length} dependency changes`)
        for (const zip of zips) {
            try {
                const s3Url = await this.uploadToS3(zip)
                if (!s3Url) {
                    continue
                }
                this.notifyDependencyChange(zip, s3Url)
            } catch (error) {
                this.logging.warn(`Error processing dependency change ${zip.filePath}: ${error}`)
            }
        }
    }

    private notifyDependencyChange(fileMetadata: FileMetadata, s3Url: string) {
        const workspaceDetails = this.getWorkspaces().get(fileMetadata.workspaceFolder.uri)

        if (!workspaceDetails) {
            return
        }

        const message = JSON.stringify({
            method: 'didChangeDependencyPaths',
            params: {
                event: { paths: [] },
                workspaceChangeMetadata: {
                    workspaceId: workspaceDetails.workspaceId,
                    s3Path: cleanUrl(s3Url),
                    programmingLanguage: fileMetadata.language,
                },
            },
        })

        if (!workspaceDetails.webSocketClient) {
            this.logging.log(
                `WebSocket client is not connected yet: ${fileMetadata.workspaceFolder.uri} adding didChangeDependencyPaths message to queue`
            )
            workspaceDetails.messageQueue?.push(message)
        } else {
            workspaceDetails.webSocketClient.send(message).catch(e => {
                this.logging.error(`Error sending didChangeDependencyPaths message: ${e}`)
            })
        }
    }

    private async createNewWorkspace(workspace: WorkspaceRoot) {
        const createWorkspaceResult = await this.createWorkspace(workspace)
        const workspaceDetails = createWorkspaceResult.response
        if (!workspaceDetails) {
            this.logging.warn(`Failed to create remote workspace for ${workspace}`)
            return createWorkspaceResult
        }

        this.updateWorkspaceEntry(workspace, {
            remoteWorkspaceState: workspaceDetails.workspace.workspaceStatus,
            workspaceId: workspaceDetails.workspace.workspaceId,
        })

        return createWorkspaceResult
    }

    private async establishConnection(workspace: WorkspaceRoot, existingMetadata: WorkspaceMetadata) {
        const existingState = this.workspaceMap.get(workspace)

        if (!existingMetadata.environmentId) {
            throw new Error('No environment ID found for ready workspace')
        }
        if (!existingMetadata.environmentAddress) {
            throw new Error('No environment address found for ready workspace')
        }

        const websocketUrl = existingMetadata.environmentAddress
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

        await this.processMessagesInQueue(workspace)
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
            this.logging.log(`Not creating a new workspace ${workspace}, user is opted out`)
            this.isOptedOut = true
            await this.clearAllWorkspaceResources()
            await this.startOptOutMonitor()
            return
        }

        if (metadata) {
            // Workspace exists remotely, add to map with current state
            this.updateWorkspaceEntry(workspace, {
                workspaceId: metadata.workspaceId,
                remoteWorkspaceState: metadata.workspaceStatus,
                messageQueue: queueEvents ?? [],
            })
            //  We don't attempt a connection here even if remote workspace is ready and leave the connection attempt to the workspace status monitor
        } else {
            // Create new workspace
            const createWorkspaceResult = await this.createNewWorkspace(workspace)
            if (createWorkspaceResult.error && createWorkspaceResult.error.retryable) {
                this.logging.log(`Workspace creation failed with retryable error, starting monitor`)
                // todo, consider whether we should add the failed env to the map or not and what to do in the create failure case
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
                        this.logging.log(`Workspace ${workspace} no longer exists, stopping monitors for workspace`)
                        clearInterval(intervalId)
                        return resolve(false)
                    }

                    const { metadata, optOut } = await this.listWorkspaceMetadata(workspace)

                    if (optOut) {
                        this.logging.log(`User opted out during initial connection`)
                        this.isOptedOut = true
                        await this.clearAllWorkspaceResources()
                        await this.startOptOutMonitor()
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
                                await this.establishConnection(workspace, metadata)
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
                    // Previously we stop monitoring the workspace if it no longer exists
                    // But now we want to try give it a chance to re-create the workspace
                    // this.stopMonitoring(workspace)
                    return
                }

                const { metadata, optOut } = await this.listWorkspaceMetadata(workspace)

                if (optOut) {
                    this.logging.log('User opted out, clearing all resources and starting opt-out monitor')
                    this.isOptedOut = true
                    await this.clearAllWorkspaceResources()
                    await this.startOptOutMonitor()
                    return
                }

                if (!metadata) {
                    // Workspace no longer exists, Recreate it.
                    await this.handleWorkspaceCreatedState(workspace)
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
                                `Workspace ${workspace} is ready but no connection exists or connection lost. Re-establishing connection...`
                            )
                            await this.establishConnection(workspace, metadata)
                        }
                        break
                    case 'PENDING':
                        // Do nothing while pending
                        break
                    case 'CREATED':
                        // Workspace has no environment, Recreate it.
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

    private async startOptOutMonitor() {
        const intervalId = setInterval(async () => {
            try {
                const { optOut } = await this.listWorkspaceMetadata()

                if (!optOut) {
                    this.isOptedOut = false
                    this.logging.log('User opted back in, stopping opt-out monitor and re-initializing workspace')
                    clearInterval(intervalId)
                    // Process all workspace folders
                    await this.processNewWorkspaceFolders(this.workspaceFolders)
                }
            } catch (error) {
                this.logging.error(`Error in opt-out monitor: ${error}`)
            }
        }, this.CONTINUOUS_MONITOR_INTERVAL)
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
        // snapshot the workspace for the new environment
        // TODO: this workspace root in the below snapshot function needs to be changes
        //       after we consolidate workspaceFolder into one Workspace.
        const folder = this.getWorkspaceFolder(workspace)
        if (folder) {
            this.processRemoteWorkspaceRefresh([folder])
        }
        const initialResult = await this.createNewWorkspace(workspace)
        if (folder) {
            this.snapshotWorkspace([folder]).catch(e => {
                this.logging.warn(`Error during snapshot workspace: ${e}`)
            })
        }

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

        this.logging.warn(
            `Retryable error for workspace ${workspace} creation: ${initialResult.error}. Attempting single retry...`
        )
        const retryResult = await this.createNewWorkspace(workspace)

        if (retryResult.error) {
            this.logging.warn(
                `Retry failed for workspace ${workspace}: ${retryResult.error}. Will wait for next polling cycle`
            )
            return
        }

        this.logging.log(`Retry succeeded for workspace ${workspace}, scheduling quick check for connection`)
        this.scheduleQuickCheck(workspace)
    }

    /**
     * Schedules a one-time check after workspace creation to establish connection as soon as possible.
     * This avoids waiting for the regular 5-minute polling interval when we know the workspace
     * should be ready soon. Default check delay is 40 seconds after successful workspace creation.
     *
     * @param workspace - The workspace to check
     * @param delayMs - Optional delay in milliseconds before the check (defaults to 40 seconds)
     */
    private scheduleQuickCheck(workspace: WorkspaceRoot, delayMs: number = this.INITIAL_CHECK_INTERVAL) {
        this.logging.log(`Scheduling quick check for workspace ${workspace} in ${delayMs}ms`)
        setTimeout(async () => {
            try {
                const workspaceState = this.workspaceMap.get(workspace)
                if (!workspaceState) {
                    this.logging.log(`Workspace state not found for: ${workspace} during quick check`)
                    return
                }

                const { metadata, optOut } = await this.listWorkspaceMetadata(workspace)

                if (optOut) {
                    this.logging.log(`User is opted out during quick check`)
                    this.isOptedOut = true
                    await this.clearAllWorkspaceResources()
                    await this.startOptOutMonitor()
                    return
                }

                if (!metadata) {
                    this.logging.log(`No metadata available for workspace: ${workspace} during quick check`)
                    return
                }

                if (metadata.workspaceStatus === 'READY') {
                    this.logging.log(`Quick check found workspace ${workspace} is ready, attempting connection`)
                    await this.establishConnection(workspace, metadata)
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
        if (!success && this.isOptedOut) {
            // If initial connection fails due to opt out, do not start the continuous monitor
            // The opt-out monitor will already be started
            return
        }
        this.startContinuousMonitor(workspace)
    }

    // could this cause messages to be lost??????
    private async processMessagesInQueue(workspaceRoot: WorkspaceRoot) {
        const workspaceDetails = this.workspaceMap.get(workspaceRoot)
        while (workspaceDetails?.messageQueue && workspaceDetails.messageQueue.length > 0) {
            const message = workspaceDetails.messageQueue.shift()
            await workspaceDetails.webSocketClient?.send(message).catch(error => {
                this.logging.error(`Error sending message: ${error}`)
            })
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
            try {
                const s3Url = await this.uploadToS3(fileMetadata)

                if (!s3Url) {
                    this.logging.warn(
                        `Failed to get S3 URL for file in workspace: ${fileMetadata.workspaceFolder.name}`
                    )
                    continue
                }

                this.logging.log(
                    `Successfully uploaded to S3: workspace=${fileMetadata.workspaceFolder.name} language=${fileMetadata.language}`
                )

                const workspaceId = this.getWorkspaces().get(fileMetadata.workspaceFolder.uri)?.workspaceId

                if (!workspaceId) {
                    this.logging.warn(`No workspace ID found for URI: ${fileMetadata.workspaceFolder.uri}`)
                }

                const event = JSON.stringify({
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
                            workspaceId: workspaceId ?? '',
                            s3Path: cleanUrl(s3Url),
                            programmingLanguage: fileMetadata.language,
                        },
                    },
                })

                // We add this event to the front of the queue here to prevent any race condition that might put events before the didChangeWorkspaceFolders event
                inMemoryQueueEvents.unshift(event)
                this.logging.log(`Added didChangeWorkspaceFolders event to queue`)
            } catch (error) {
                this.logging.error(
                    `Error processing file metadata:${error instanceof Error ? error.message : 'Unknown error'}, workspace=${fileMetadata.workspaceFolder.name}`
                )
            }
        }

        try {
            const workspaceDetails = this.getWorkspaces().get(filesMetadata[0].workspaceFolder.uri)

            if (!workspaceDetails) {
                this.logging.error(`No workspace details found for URI: ${filesMetadata[0].workspaceFolder.uri}`)
                return
            }

            if (workspaceDetails.webSocketClient) {
                inMemoryQueueEvents.forEach((event, index) => {
                    try {
                        workspaceDetails.webSocketClient?.send(event).catch(error => {
                            this.logging.error(
                                `Error sending event: ${error instanceof Error ? error.message : 'Unknown error'}, eventIndex=${index}`
                            )
                        })
                        this.logging.log(`Successfully sent event ${index + 1}/${inMemoryQueueEvents.length}`)
                    } catch (error) {
                        this.logging.error(
                            `Failed to send event via WebSocket:${error instanceof Error ? error.message : 'Unknown error'}, eventIndex=${index}`
                        )
                    }
                })
            } else {
                if (workspaceDetails.messageQueue) {
                    workspaceDetails.messageQueue.push(...inMemoryQueueEvents)
                    this.logging.log(`Added ${inMemoryQueueEvents.length} events to message queue`)
                } else {
                    this.logging.warn('No message queue available to store events')
                }
            }
        } catch (error) {
            this.logging.error(`Error in final processing: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }

        this.logging.log(`Completed processing ${inMemoryQueueEvents.length} queued WebSocket events`)
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

    // TODO, this function is unused at the moment
    private async deleteWorkspace(workspaceId: string) {
        try {
            if (isLoggedInUsingBearerToken(this.credentialsProvider)) {
                await this.serviceManager.getCodewhispererService().deleteWorkspace({
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
    private async listWorkspaceMetadata(workspaceRoot?: WorkspaceRoot): Promise<{
        metadata: WorkspaceMetadata | undefined | null
        optOut: boolean
    }> {
        let metadata: WorkspaceMetadata | undefined | null
        let optOut = false
        try {
            const params = workspaceRoot ? { workspaceRoot } : {}
            const response = await this.serviceManager.getCodewhispererService().listWorkspaceMetadata(params)
            metadata = response && response.workspaces.length ? response.workspaces[0] : null
        } catch (e: any) {
            this.logging.warn(`Error while fetching workspace (${workspaceRoot}) metadata: ${e?.message}`)
            if (
                e?.__type?.includes('AccessDeniedException') &&
                e?.reason === 'UNAUTHORIZED_WORKSPACE_CONTEXT_FEATURE_ACCESS'
            ) {
                this.logging.log(`Server side opt-out detected for workspace context`)
                optOut = true
            }
        }
        return { metadata, optOut }
    }

    private async createWorkspace(workspaceRoot: WorkspaceRoot) {
        let response: CreateWorkspaceResponse | undefined | null
        try {
            response = await this.serviceManager.getCodewhispererService().createWorkspace({
                workspaceRoot: workspaceRoot,
            })
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
