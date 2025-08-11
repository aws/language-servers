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
import { isAwsError } from '../../shared/utils'
import { IdleWorkspaceManager } from './IdleWorkspaceManager'

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
    // Promise that gates operations until workspace ID is ready or cancelled
    private remoteWorkspaceIdPromise: Promise<boolean>
    // Resolves the remoteWorkspaceIdPromise to signal whether operations should proceed
    private remoteWorkspaceIdResolver!: (id: boolean) => void
    // Tracks whether the existing remoteWorkspaceIdPromise has been resolved
    private remoteWorkspaceIdPromiseResolved: boolean = false
    private workspaceFolders: WorkspaceFolder[]
    private credentialsProvider: CredentialsProvider
    private readonly INITIAL_CHECK_INTERVAL = 40 * 1000 // 40 seconds
    private readonly INITIAL_CONNECTION_TIMEOUT = 2 * 60 * 1000 // 2 minutes
    private readonly CONTINUOUS_MONITOR_INTERVAL = 30 * 60 * 1000 // 30 minutes
    private readonly MESSAGE_PUBLISH_INTERVAL: number = 100 // 100 milliseconds
    private continuousMonitorInterval: NodeJS.Timeout | undefined
    private optOutMonitorInterval: NodeJS.Timeout | undefined
    private messageQueueConsumerInterval: NodeJS.Timeout | undefined
    private isOptedOut: boolean = false
    private isCheckingRemoteWorkspaceStatus: boolean = false
    private isArtifactUploadedToRemoteWorkspace: boolean = false

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
            handler.onDependencyZipGenerated(async (workspaceFolder, zip, addWSFolderPathInS3) => {
                try {
                    this.logging.log(`Uploading a dependency zip for: ${workspaceFolder.uri}`)
                    await this.uploadDependencyZipAndQueueEvent(zip, addWSFolderPathInS3)
                } catch (error) {
                    this.logging.warn(`Error handling dependency change: ${error}`)
                }
            })
        })

        this.remoteWorkspaceIdPromise = new Promise<boolean>(resolve => {
            this.remoteWorkspaceIdResolver = resolve
        })
        this.workspaceState = {
            remoteWorkspaceState: 'CREATION_PENDING',
            messageQueue: [],
        }
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

    resetAdminOptOutStatus(): void {
        this.isOptedOut = false
    }

    getWorkspaceState(): WorkspaceState {
        return this.workspaceState
    }

    async processNewWorkspaceFolders(folders: WorkspaceFolder[]) {
        // Wait for remote workspace id
        const shouldProceed = await this.remoteWorkspaceIdPromise
        if (!shouldProceed) {
            return
        }

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
            return
        }
        return s3Url
    }

    clearAllWorkspaceResources() {
        this.stopContinuousMonitoring()
        this.stopOptOutMonitoring()
        this.remoteWorkspaceIdResolver(false)
        this.remoteWorkspaceIdPromiseResolved = true
        this.stopMessageQueueConsumer()
        this.workspaceState.webSocketClient?.destroyClient()
        this.dependencyDiscoverer.dispose()
        this.artifactManager.dispose()
    }

    /**
     * The function sends a removed workspace folders notification to remote LSP, removes workspace entry
     * from map and close the websocket connection
     * @param workspaceFolder
     */
    async processWorkspaceFoldersDeletion(workspaceFolders: WorkspaceFolder[]) {
        const shouldProceed = await this.remoteWorkspaceIdPromise
        if (!shouldProceed) {
            return
        }
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
                            workspaceId: this.workspaceState.workspaceId,
                            programmingLanguage: language,
                        },
                    },
                })
                this.workspaceState.messageQueue.push(message)
            }
            this.dependencyDiscoverer.disposeWorkspaceFolder(folder)
        }
        this.artifactManager.removeWorkspaceFolders(workspaceFolders)
    }

    private async uploadDependencyZipAndQueueEvent(zip: FileMetadata, addWSFolderPathInS3: boolean): Promise<void> {
        try {
            const s3Url = await this.uploadToS3(zip, addWSFolderPathInS3)
            if (!s3Url) {
                return
            }
            const message = JSON.stringify({
                method: 'didChangeDependencyPaths',
                params: {
                    event: { paths: [] },
                    workspaceChangeMetadata: {
                        workspaceId: this.workspaceState.workspaceId,
                        s3Path: cleanUrl(s3Url),
                        programmingLanguage: zip.language,
                    },
                },
            })
            this.workspaceState.messageQueue.push(message)
            this.logging.log(`Added didChangeDependencyPaths event to queue`)
        } catch (error) {
            this.logging.warn(`Error uploading and notifying dependency zip ${zip.filePath}: ${error}`)
        }
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

    initializeWorkspaceStatusMonitor() {
        this.logging.log(`Initializing workspace status check for workspace [${this.workspaceIdentifier}]`)

        // Reset workspace ID to force operations to wait for new remote workspace information
        this.resetRemoteWorkspaceId()

        this.isArtifactUploadedToRemoteWorkspace = false

        // Set up message queue consumer
        if (this.messageQueueConsumerInterval === undefined) {
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

        // Set up continuous monitoring which periodically invokes checkRemoteWorkspaceStatusAndReact
        if (!this.isOptedOut && this.continuousMonitorInterval === undefined) {
            this.logging.log(`Starting continuous monitor for workspace [${this.workspaceIdentifier}]`)
            this.continuousMonitorInterval = setInterval(async () => {
                try {
                    await this.checkRemoteWorkspaceStatusAndReact()
                } catch (error) {
                    this.logging.error(`Error monitoring workspace status: ${error}`)
                }
            }, this.CONTINUOUS_MONITOR_INTERVAL)
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
                        this.clearAllWorkspaceResources()
                        this.startOptOutMonitor()
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

    public async checkRemoteWorkspaceStatusAndReact() {
        if (this.isCheckingRemoteWorkspaceStatus) {
            // Skip checking remote workspace if a previous check is still in progress
            return
        }
        this.isCheckingRemoteWorkspaceStatus = true
        try {
            if (IdleWorkspaceManager.isSessionIdle()) {
                this.resetWebSocketClient()
                this.logging.log('Session is idle, skipping remote workspace status check')
                return
            }

            if (this.workspaceFolders.length === 0) {
                this.logging.log(`No workspace folders added, skipping workspace status check`)
                return
            }

            this.logging.log(`Checking remote workspace status for workspace [${this.workspaceIdentifier}]`)
            const { metadata, optOut, error } = await this.listWorkspaceMetadata(this.workspaceIdentifier)

            if (optOut) {
                this.logging.log('User opted out, clearing all resources and starting opt-out monitor')
                this.isOptedOut = true
                this.clearAllWorkspaceResources()
                this.startOptOutMonitor()
                return
            }

            if (error) {
                // Do not do anything if we received an exception but not caused by optOut
                return
            }

            if (!metadata) {
                // Workspace no longer exists, Recreate it.
                this.resetRemoteWorkspaceId() // workspaceId would change if remote record is gone
                await this.handleWorkspaceCreatedState()
                return
            }

            this.workspaceState.remoteWorkspaceState = metadata.workspaceStatus
            if (this.workspaceState.workspaceId === undefined) {
                this.setRemoteWorkspaceId(metadata.workspaceId)
            }

            switch (metadata.workspaceStatus) {
                case 'READY':
                    // Check if connection exists
                    const client = this.workspaceState.webSocketClient
                    if (!client || !client.isConnected()) {
                        this.logging.log(
                            `Workspace is ready but no connection exists or connection lost. Re-establishing connection...`
                        )
                        let uploadArtifactsPromise: Promise<void> | undefined
                        if (!this.isArtifactUploadedToRemoteWorkspace) {
                            uploadArtifactsPromise = this.uploadAllArtifactsToRemoteWorkspace()
                        }
                        await this.establishConnection(metadata)
                        if (uploadArtifactsPromise) {
                            await uploadArtifactsPromise
                        }
                    }
                    break
                case 'PENDING':
                    // Schedule an initial connection when pending
                    let uploadArtifactsPromise: Promise<void> | undefined
                    if (!this.isArtifactUploadedToRemoteWorkspace) {
                        uploadArtifactsPromise = this.uploadAllArtifactsToRemoteWorkspace()
                    }
                    await this.waitForInitialConnection()
                    if (uploadArtifactsPromise) {
                        await uploadArtifactsPromise
                    }
                    break
                case 'CREATED':
                    // Workspace has no environment, Recreate it.
                    await this.handleWorkspaceCreatedState()
                    break
                default:
                    this.logging.warn(`Unknown workspace status: ${metadata.workspaceStatus}`)
            }
        } catch (error) {
            this.logging.error(`Error checking remote workspace status: ${error}`)
        } finally {
            this.isCheckingRemoteWorkspaceStatus = false
        }
    }

    private setRemoteWorkspaceId(workspaceId: string) {
        this.workspaceState.workspaceId = workspaceId
        this.remoteWorkspaceIdResolver(true)
        this.remoteWorkspaceIdPromiseResolved = true
    }

    private resetRemoteWorkspaceId() {
        this.workspaceState.workspaceId = undefined

        if (this.remoteWorkspaceIdPromiseResolved) {
            this.remoteWorkspaceIdPromise = new Promise<boolean>(resolve => {
                this.remoteWorkspaceIdResolver = resolve
            })
            this.remoteWorkspaceIdPromiseResolved = false
        }
    }

    private startOptOutMonitor() {
        if (this.optOutMonitorInterval === undefined) {
            const intervalId = setInterval(async () => {
                try {
                    const { optOut } = await this.listWorkspaceMetadata()

                    if (!optOut) {
                        this.isOptedOut = false
                        this.logging.log(
                            "User's administrator opted in, stopping opt-out monitor and initializing remote workspace"
                        )
                        clearInterval(intervalId)
                        this.optOutMonitorInterval = undefined
                        this.initializeWorkspaceStatusMonitor()
                        this.processNewWorkspaceFolders(this.workspaceFolders).catch(error => {
                            this.logging.error(`Error while processing workspace folders: ${error}`)
                        })
                    }
                } catch (error) {
                    this.logging.error(`Error in opt-out monitor: ${error}`)
                }
            }, this.CONTINUOUS_MONITOR_INTERVAL)
            this.optOutMonitorInterval = intervalId
        }
    }

    private async handleWorkspaceCreatedState(): Promise<void> {
        this.logging.log(`No READY / PENDING remote workspace found, creating a new one`)
        // If remote state is CREATED, call create API to create a new workspace
        this.resetWebSocketClient()
        const initialResult = await this.createNewWorkspace()

        // If creation succeeds, establish connection
        if (initialResult.response) {
            this.logging.log(`Workspace [${this.workspaceIdentifier}] created successfully, establishing connection`)
            const uploadArtifactsPromise = this.uploadAllArtifactsToRemoteWorkspace()
            await this.waitForInitialConnection()
            await uploadArtifactsPromise
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
        const uploadArtifactsPromise = this.uploadAllArtifactsToRemoteWorkspace()
        await this.waitForInitialConnection()
        await uploadArtifactsPromise
    }

    private async uploadAllArtifactsToRemoteWorkspace() {
        // initialize source codes
        this.artifactManager.resetFromDisposal()
        await this.syncSourceCodesToS3(this.workspaceFolders)

        // initialize dependencies
        this.dependencyDiscoverer.disposeAndReset()
        this.dependencyDiscoverer.searchDependencies(this.workspaceFolders).catch(e => {
            this.logging.warn(`Error during dependency discovery: ${e}`)
        })

        this.isArtifactUploadedToRemoteWorkspace = true
    }

    public isContinuousMonitoringStopped(): boolean {
        return this.continuousMonitorInterval === undefined
    }

    private stopContinuousMonitoring() {
        if (this.continuousMonitorInterval) {
            this.logging.log(`Stopping monitoring for workspace [${this.workspaceIdentifier}]`)
            clearInterval(this.continuousMonitorInterval)
            this.continuousMonitorInterval = undefined
        }
    }

    private stopOptOutMonitoring() {
        if (this.optOutMonitorInterval) {
            clearInterval(this.optOutMonitorInterval)
            this.optOutMonitorInterval = undefined
        }
    }

    private stopMessageQueueConsumer() {
        if (this.messageQueueConsumerInterval) {
            this.logging.log(`Stopping message queue consumer`)
            clearInterval(this.messageQueueConsumerInterval)
            this.messageQueueConsumerInterval = undefined
        }
    }

    private resetWebSocketClient() {
        if (this.workspaceState.webSocketClient) {
            this.workspaceState.webSocketClient.destroyClient()
            this.workspaceState.webSocketClient = undefined
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
            this.setRemoteWorkspaceId(workspaceDetails.workspace.workspaceId)
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
                        `Failed to upload to S3 for file in workspaceFolder: ${fileMetadata.workspaceFolder.name}`
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

    public async deleteRemoteWorkspace() {
        const workspaceId = this.workspaceState.workspaceId
        this.resetRemoteWorkspaceId()
        try {
            if (!workspaceId) {
                this.logging.warn(`No remote workspaceId found, skipping workspace deletion`)
                return
            }
            if (isLoggedInUsingBearerToken(this.credentialsProvider)) {
                await this.serviceManager.getCodewhispererService().deleteWorkspace({
                    workspaceId: workspaceId,
                })
                this.logging.log(`Remote workspace (${workspaceId}) deleted successfully`)
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
        error: any
    }> {
        let metadata: WorkspaceMetadata | undefined | null
        let optOut = false
        let error: any
        try {
            const params = workspaceRoot ? { workspaceRoot } : {}
            const response = await this.serviceManager.getCodewhispererService().listWorkspaceMetadata(params)
            metadata = response && response.workspaces.length ? response.workspaces[0] : null
        } catch (e: any) {
            error = e
            this.logging.warn(`Error while fetching workspace (${workspaceRoot}) metadata: ${e?.message}`)
            if (
                e?.__type?.includes('AccessDeniedException') &&
                e?.reason === 'UNAUTHORIZED_WORKSPACE_CONTEXT_FEATURE_ACCESS'
            ) {
                this.logging.log(`User's administrator opted out server-side workspace context`)
                optOut = true
            }
        }
        return { metadata, optOut, error }
    }

    private async createWorkspace(workspaceRoot: WorkspaceRoot): Promise<{
        response: CreateWorkspaceResponse | undefined | null
        isServiceQuotaExceeded: boolean
        error: any
    }> {
        let response: CreateWorkspaceResponse | undefined | null
        let isServiceQuotaExceeded = false
        let error: any
        try {
            response = await this.serviceManager.getCodewhispererService().createWorkspace({
                workspaceRoot: workspaceRoot,
            })
        } catch (e: any) {
            this.logging.warn(
                `Error while creating workspace (${workspaceRoot}): ${e.message}. Error is ${e.retryable ? '' : 'not'} retryable}`
            )
            if (isAwsError(e) && e.code === 'ServiceQuotaExceededException') {
                isServiceQuotaExceeded = true
            }
            error = {
                message: e.message,
                retryable: e.retryable ?? false,
                originalError: e,
            }
        }
        return { response, isServiceQuotaExceeded, error }
    }
}
