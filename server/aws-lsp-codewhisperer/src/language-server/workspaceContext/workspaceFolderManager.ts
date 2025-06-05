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
import { URI } from 'vscode-uri'
import path = require('path')

interface WorkspaceState {
    remoteWorkspaceState: WorkspaceStatus
    messageQueue: any[]
    webSocketClient?: WebSocketClient
    workspaceId?: string
}

type WorkspaceRoot = string

export class WorkspaceFolderManager {
    private serviceManager: AmazonQTokenServiceManager
    private logging: Logging
    private artifactManager: ArtifactManager
    private dependencyDiscoverer: DependencyDiscoverer
    private static instance: WorkspaceFolderManager | undefined
    private readonly workspaceIdentifier: string
    private workspaceState: WorkspaceState
    private remoteWorkspaceIdPromise: Promise<string>
    private remoteWorkspaceIdResolver!: (id: string) => void
    private workspaceFolders: WorkspaceFolder[]
    private credentialsProvider: CredentialsProvider
    private readonly INITIAL_CHECK_INTERVAL = 40 * 1000 // 40 seconds
    private readonly INITIAL_CONNECTION_TIMEOUT = 2 * 60 * 1000 // 2 minutes
    private readonly CONTINUOUS_MONITOR_INTERVAL = 5 * 60 * 1000 // 5 minutes
    private readonly MESSAGE_PUBLISH_INTERVAL: number = 100 // 100 milliseconds
    private continuousMonitorInterval: NodeJS.Timeout | undefined
    private optOutMonitorInterval: NodeJS.Timeout | undefined
    private messageQueueConsumerInterval: NodeJS.Timeout | undefined
    private isOptedOut: boolean = false

    static createInstance(
        serviceManager: AmazonQTokenServiceManager,
        logging: Logging,
        artifactManager: ArtifactManager,
        dependencyDiscoverer: DependencyDiscoverer,
        workspaceFolders: WorkspaceFolder[],
        credentialsProvider: CredentialsProvider,
        workspaceIdentifier: string
    ): WorkspaceFolderManager {
        if (!this.instance) {
            this.instance = new WorkspaceFolderManager(
                serviceManager,
                logging,
                artifactManager,
                dependencyDiscoverer,
                workspaceFolders,
                credentialsProvider,
                workspaceIdentifier
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
        credentialsProvider: CredentialsProvider,
        workspaceIdentifier: string
    ) {
        this.serviceManager = serviceManager
        this.logging = logging
        this.artifactManager = artifactManager
        this.dependencyDiscoverer = dependencyDiscoverer
        this.workspaceFolders = workspaceFolders
        this.credentialsProvider = credentialsProvider
        this.workspaceIdentifier = workspaceIdentifier

        this.dependencyDiscoverer.dependencyHandlerRegistry.forEach(handler => {
            handler.onDependencyChange(async (workspaceFolder, zips, addWSFolderPathInS3) => {
                try {
                    this.logging.log(`Dependency change detected in ${workspaceFolder.uri}`)

                    // Process the dependencies
                    await this.handleDependencyChanges(zips, addWSFolderPathInS3)

                    // Clean up only after successful processing
                    await handler.cleanupZipFiles(zips)
                } catch (error) {
                    this.logging.warn(`Error handling dependency change: ${error}`)
                }
            })
        })

        this.remoteWorkspaceIdPromise = new Promise<string>(resolve => {
            this.remoteWorkspaceIdResolver = resolve
        })
        this.workspaceState = {
            remoteWorkspaceState: 'CREATION_PENDING',
            messageQueue: [],
        }

        this.messageQueueConsumerInterval = setInterval(() => {
            if (this.workspaceState.webSocketClient && this.workspaceState.webSocketClient.isConnected()) {
                const message = this.workspaceState.messageQueue[0]
                if (message) {
                    try {
                        this.workspaceState.webSocketClient.send(message)
                        this.workspaceState.messageQueue.shift()
                    } catch (error) {
                        this.logging.error(`Error sending message: ${error}`)
                    }
                }
            }
        }, this.MESSAGE_PUBLISH_INTERVAL)
    }

    /**
     * The function is used to track the latest state of workspace folders.
     * This state is updated irrespective of login/logout/optIn/optOut
     * @param workspaceFolders
     */
    updateWorkspaceFolders(workspaceFolders: WorkspaceFolder[]) {
        this.workspaceFolders = workspaceFolders
    }

    getWorkspaceFolder(fileUri: string, workspaceFolders?: WorkspaceFolder[]): WorkspaceFolder | undefined {
        return findWorkspaceRootFolder(fileUri, workspaceFolders ?? this.workspaceFolders)
    }

    getOptOutStatus(): boolean {
        return this.isOptedOut
    }

    getWorkspaceState(): WorkspaceState {
        return this.workspaceState
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

        // Wait for remote workspace id
        await this.waitForRemoteWorkspaceId()

        // Sync workspace source codes
        await this.syncSourceCodesToS3(folders).catch(e => {
            this.logging.warn(`Error during syncing workspace source codes: ${e}`)
        })

        // Kick off dependency discovery but don't wait
        this.dependencyDiscoverer.searchDependencies(folders).catch(e => {
            this.logging.warn(`Error during dependency discovery: ${e}`)
        })
    }

    private async syncSourceCodesToS3(folders: WorkspaceFolder[]) {
        let sourceCodeMetadata: FileMetadata[] = []
        sourceCodeMetadata = await this.artifactManager.addWorkspaceFolders(folders)

        await this.uploadS3AndQueueEvents(sourceCodeMetadata)
        this.artifactManager.cleanup(true, folders)
    }

    async uploadToS3(fileMetadata: FileMetadata, addWSFolderPathInS3: boolean = true): Promise<string | undefined> {
        let relativePath = fileMetadata.relativePath.replace(fileMetadata.workspaceFolder.name, '')
        relativePath = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath
        if (addWSFolderPathInS3) {
            relativePath = path.join(URI.parse(fileMetadata.workspaceFolder.uri).path.slice(1), relativePath)
        }
        const workspaceId = this.workspaceState.workspaceId
        if (!workspaceId) {
            this.logging.warn(`Workspace ID is not found, skipping S3 upload`)
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
        this.stopContinuousMonitoring()
        this.resetRemoteWorkspaceId()
        this.workspaceState.webSocketClient?.destroyClient()
        this.artifactManager.cleanup()
        this.dependencyDiscoverer.dispose()
    }

    /**
     * The function sends a removed workspace folders notification to remote LSP, removes workspace entry
     * from map and close the websocket connection
     * @param workspaceFolder
     */
    async processWorkspaceFoldersDeletion(workspaceFolders: WorkspaceFolder[]) {
        const workspaceId = await this.waitForRemoteWorkspaceId()
        for (const folder of workspaceFolders) {
            const languagesMap = this.artifactManager.getLanguagesForWorkspaceFolder(folder)
            const programmingLanguages = languagesMap ? Array.from(languagesMap.keys()) : []

            for (const language of programmingLanguages) {
                const message = JSON.stringify({
                    method: 'workspace/didChangeWorkspaceFolders',
                    params: {
                        workspaceFoldersChangeEvent: {
                            added: [],
                            removed: [
                                {
                                    uri: folder.uri,
                                    name: folder.name,
                                },
                            ],
                        },
                        workspaceChangeMetadata: {
                            workspaceId: workspaceId,
                            programmingLanguage: language,
                        },
                    },
                })
                this.workspaceState.messageQueue.push(message)
            }
            this.dependencyDiscoverer.disposeWorkspaceFolder(folder)
        }
        await this.artifactManager.removeWorkspaceFolders(workspaceFolders)
    }

    private async handleDependencyChanges(zips: FileMetadata[], addWSFolderPathInS3: boolean): Promise<void> {
        this.logging.log(`Processing ${zips.length} dependency changes`)
        for (const zip of zips) {
            try {
                const s3Url = await this.uploadToS3(zip, addWSFolderPathInS3)
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
        const message = JSON.stringify({
            method: 'didChangeDependencyPaths',
            params: {
                event: { paths: [] },
                workspaceChangeMetadata: {
                    workspaceId: this.workspaceState.workspaceId,
                    s3Path: cleanUrl(s3Url),
                    programmingLanguage: fileMetadata.language,
                },
            },
        })

        this.workspaceState.messageQueue.push(message)
    }

    private async establishConnection(existingMetadata: WorkspaceMetadata) {
        if (!existingMetadata.environmentId) {
            throw new Error('No environment ID found for ready workspace')
        }
        if (!existingMetadata.environmentAddress) {
            throw new Error('No environment address found for ready workspace')
        }

        const websocketUrl = existingMetadata.environmentAddress
        this.logging.log(`Establishing connection to ${websocketUrl}`)

        if (this.workspaceState.webSocketClient) {
            const websocketConnectionState = this.workspaceState.webSocketClient.getWebsocketReadyState()
            if (websocketConnectionState === 'OPEN') {
                this.logging.log(`Active websocket connection already exists.}`)
                return
            }
            // If the client exists but isn't connected, it might be in the process of connecting
            if (websocketConnectionState === 'CONNECTING') {
                this.logging.log(`Connection attempt already in progress.`)
                return
            }
        }

        const webSocketClient = new WebSocketClient(websocketUrl, this.logging, this.credentialsProvider)
        this.workspaceState.remoteWorkspaceState = 'CONNECTED'
        this.workspaceState.webSocketClient = webSocketClient
    }

    async initializeWorkspaceStatusMonitor() {
        this.logging.log(`Initializing workspace status check for workspace [${this.workspaceIdentifier}]`)
        // Perform a one-time checkRemoteWorkspaceStatusAndReact first
        // Pass skipUploads as true since it would be handled by processNewWorkspaceFolders
        await this.checkRemoteWorkspaceStatusAndReact(true)

        // Set up continuous monitoring which periodically invokes checkRemoteWorkspaceStatusAndReact
        if (!this.isOptedOut) {
            this.logging.log(`Starting continuous monitor for workspace [${this.workspaceIdentifier}]`)
            const intervalId = setInterval(async () => {
                try {
                    await this.checkRemoteWorkspaceStatusAndReact()
                } catch (error) {
                    this.logging.error(`Error monitoring workspace status: ${error}`)
                }
            }, this.CONTINUOUS_MONITOR_INTERVAL)
            this.continuousMonitorInterval = intervalId
        }
    }

    private async waitForInitialConnection(): Promise<boolean> {
        this.logging.log(`Waiting for initial connection to remote workspace`)
        return new Promise(resolve => {
            const startTime = Date.now()

            const intervalId = setInterval(async () => {
                try {
                    if (Date.now() - startTime >= this.INITIAL_CONNECTION_TIMEOUT) {
                        this.logging.warn(`Initial connection timeout.`)
                        clearInterval(intervalId)
                        return resolve(false)
                    }

                    const { metadata, optOut } = await this.listWorkspaceMetadata(this.workspaceIdentifier)

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

                    this.workspaceState.remoteWorkspaceState = metadata.workspaceStatus

                    switch (metadata.workspaceStatus) {
                        case 'READY':
                            const client = this.workspaceState.webSocketClient
                            if (!client || !client.isConnected()) {
                                await this.establishConnection(metadata)
                            }
                            clearInterval(intervalId)
                            return resolve(true)
                        case 'PENDING':
                            // Continue polling
                            break
                        case 'CREATED':
                            clearInterval(intervalId)
                            return resolve(false)
                        default:
                            this.logging.warn(`Unknown workspace status: ${metadata.workspaceStatus}`)
                            clearInterval(intervalId)
                            return resolve(false)
                    }
                } catch (error: any) {
                    this.logging.error(
                        `Error during initializing connection for workspace [${this.workspaceIdentifier}]: ${error}`
                    )
                    clearInterval(intervalId)
                    return resolve(false)
                }
            }, this.INITIAL_CHECK_INTERVAL)
        })
    }

    private async checkRemoteWorkspaceStatusAndReact(skipUploads: boolean = false) {
        this.logging.log(`Checking remote workspace status for workspace [${this.workspaceIdentifier}]`)
        const { metadata, optOut } = await this.listWorkspaceMetadata(this.workspaceIdentifier)

        if (optOut) {
            this.logging.log('User opted out, clearing all resources and starting opt-out monitor')
            this.isOptedOut = true
            await this.clearAllWorkspaceResources()
            await this.startOptOutMonitor()
            return
        }

        if (!metadata) {
            // Workspace no longer exists, Recreate it.
            this.resetRemoteWorkspaceId() // workspaceId would change if remote record is gone
            await this.handleWorkspaceCreatedState(skipUploads)
            return
        }

        this.workspaceState.remoteWorkspaceState = metadata.workspaceStatus
        if (this.workspaceState.workspaceId === undefined) {
            this.workspaceState.workspaceId = metadata.workspaceId
            this.remoteWorkspaceIdResolver(this.workspaceState.workspaceId)
        }

        switch (metadata.workspaceStatus) {
            case 'READY':
                // Check if connection exists
                const client = this.workspaceState.webSocketClient
                if (!client || !client.isConnected()) {
                    this.logging.log(
                        `Workspace is ready but no connection exists or connection lost. Re-establishing connection...`
                    )
                    await this.establishConnection(metadata)
                }
                break
            case 'PENDING':
                // Schedule an initial connection when pending
                await this.waitForInitialConnection()
                break
            case 'CREATED':
                // Workspace has no environment, Recreate it.
                await this.handleWorkspaceCreatedState(skipUploads)
                break
            default:
                this.logging.warn(`Unknown workspace status: ${metadata.workspaceStatus}`)
        }
    }

    async waitForRemoteWorkspaceId(): Promise<string> {
        // If workspaceId is already set, return it immediately
        if (this.workspaceState.workspaceId) {
            return this.workspaceState.workspaceId
        }
        // Otherwise, wait for the promise to resolve
        let waitedWorkspaceId = undefined
        while (!waitedWorkspaceId) {
            waitedWorkspaceId = await this.remoteWorkspaceIdPromise
        }
        return waitedWorkspaceId
    }

    private resetRemoteWorkspaceId() {
        this.workspaceState.workspaceId = undefined

        // Store the old resolver
        const oldResolver = this.remoteWorkspaceIdResolver

        // Create new promise first
        this.remoteWorkspaceIdPromise = new Promise<string>(resolve => {
            this.remoteWorkspaceIdResolver = resolve
        })

        // Reset the old promise
        if (oldResolver) {
            oldResolver('')
        }
    }

    private async startOptOutMonitor() {
        if (this.optOutMonitorInterval === undefined) {
            const intervalId = setInterval(async () => {
                try {
                    const { optOut } = await this.listWorkspaceMetadata()

                    if (!optOut) {
                        this.isOptedOut = false
                        this.logging.log('User opted back in, stopping opt-out monitor and re-initializing workspace')
                        clearInterval(intervalId)
                        this.optOutMonitorInterval = undefined
                        await this.initializeWorkspaceStatusMonitor()
                    }
                } catch (error) {
                    this.logging.error(`Error in opt-out monitor: ${error}`)
                }
            }, this.CONTINUOUS_MONITOR_INTERVAL)
            this.optOutMonitorInterval = intervalId
        }
    }

    private async handleWorkspaceCreatedState(skipUploads: boolean = false): Promise<void> {
        this.logging.log(`No READY / PENDING remote workspace found, creating a new one`)
        // If remote state is CREATED, call create API to create a new workspace
        if (this.workspaceState.webSocketClient) {
            this.workspaceState.webSocketClient.destroyClient()
            this.workspaceState.webSocketClient = undefined
        }
        const initialResult = await this.createNewWorkspace()

        // If creation succeeds, establish connection
        if (initialResult.response) {
            this.logging.log(`Workspace [${this.workspaceIdentifier}] created successfully, establishing connection`)
            await this.waitForInitialConnection()
            if (!skipUploads) {
                await this.syncSourceCodesToS3(this.workspaceFolders)
                this.dependencyDiscoverer.reSyncDependenciesToS3(this.workspaceFolders).catch(e => {
                    this.logging.warn(`Error during re-syncing dependencies: ${e}`)
                })
            }
            return
        }

        // If creation fails with a non-retryable error, don't do anything
        // Continuous monitor will evaluate the status again in 5 minutes
        if (!initialResult.error?.retryable) {
            return
        }

        this.logging.warn(`Retryable error for workspace creation: ${initialResult.error}. Attempting single retry...`)
        const retryResult = await this.createNewWorkspace()

        // If re-creation fails, wait for the next polling cycle
        if (retryResult.error) {
            this.logging.warn(
                `Workspace creation retry failed: ${retryResult.error}. Will wait for the next polling cycle`
            )
            return
        }

        this.logging.log(`Retry succeeded for workspace creation, establishing connection`)
        await this.waitForInitialConnection()
        if (!skipUploads) {
            await this.syncSourceCodesToS3(this.workspaceFolders)
            this.dependencyDiscoverer.reSyncDependenciesToS3(this.workspaceFolders).catch(e => {
                this.logging.warn(`Error during re-syncing dependencies: ${e}`)
            })
        }
    }

    private stopContinuousMonitoring() {
        this.logging.log(`Stopping monitoring for workspace [${this.workspaceIdentifier}]`)
        if (this.continuousMonitorInterval) {
            clearInterval(this.continuousMonitorInterval)
            this.continuousMonitorInterval = undefined
        }
    }

    private async createNewWorkspace() {
        const createWorkspaceResult = await this.createWorkspace(this.workspaceIdentifier)
        const workspaceDetails = createWorkspaceResult.response
        if (!workspaceDetails) {
            this.logging.warn(`Failed to create remote workspace for [${this.workspaceIdentifier}]`)
            return createWorkspaceResult
        }

        this.workspaceState.remoteWorkspaceState = workspaceDetails.workspace.workspaceStatus
        if (this.workspaceState.workspaceId === undefined) {
            this.workspaceState.workspaceId = workspaceDetails.workspace.workspaceId
            this.remoteWorkspaceIdResolver(this.workspaceState.workspaceId)
        }

        return createWorkspaceResult
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
        for (const fileMetadata of filesMetadata) {
            try {
                const s3Url = await this.uploadToS3(fileMetadata)

                if (!s3Url) {
                    this.logging.warn(
                        `Failed to get S3 URL for file in workspaceFolder: ${fileMetadata.workspaceFolder.name}`
                    )
                    continue
                }

                this.logging.log(
                    `Successfully uploaded to S3: workspaceFolder=${fileMetadata.workspaceFolder.name} language=${fileMetadata.language}`
                )

                const event = JSON.stringify({
                    method: 'workspace/didChangeWorkspaceFolders',
                    params: {
                        workspaceFoldersChangeEvent: {
                            added: [
                                {
                                    uri: fileMetadata.workspaceFolder.uri,
                                    name: fileMetadata.workspaceFolder.name,
                                },
                            ],
                            removed: [],
                        },
                        workspaceChangeMetadata: {
                            workspaceId: this.workspaceState.workspaceId,
                            s3Path: cleanUrl(s3Url),
                            programmingLanguage: fileMetadata.language,
                        },
                    },
                })
                this.workspaceState.messageQueue.push(event)
                this.logging.log(`Added didChangeWorkspaceFolders event to queue`)
            } catch (error) {
                this.logging.error(
                    `Error processing file metadata:${error instanceof Error ? error.message : 'Unknown error'}, workspace=${fileMetadata.workspaceFolder.name}`
                )
            }
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
