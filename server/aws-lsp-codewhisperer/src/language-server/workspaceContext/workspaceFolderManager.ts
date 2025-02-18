import { WebSocketClient } from './client'
import { CodeWhispererServiceToken } from '../codeWhispererService'
import { WorkspaceFolder } from '@aws/language-server-runtimes/protocol'
import {
    CreateWorkspaceResponse,
    ListWorkspaceMetadataResponse,
    WorkspaceMetadata,
} from '../../client/token/codewhispererbearertokenclient'
import { Logging } from '@aws/language-server-runtimes/server-interface'

export type RemoteWorkspaceState = 'CREATED' | 'PENDING' | 'READY' | 'CONNECTED' | 'DELETING'

interface WorkspaceState {
    remoteWorkspaceState: RemoteWorkspaceState
    webSocketClient?: WebSocketClient
    s3Url?: string
    messageQueue?: any[]
}

type WorkspaceRoot = string

export class WorkspaceFolderManager {
    private cwsprClient: CodeWhispererServiceToken
    private logging: Logging
    private workspaceMap: Map<WorkspaceRoot, WorkspaceState>
    private readonly pollInterval: number = 5 * 60 * 1000

    constructor(cwsprClient: CodeWhispererServiceToken, logging: Logging) {
        this.cwsprClient = cwsprClient
        this.logging = logging
        this.workspaceMap = new Map<WorkspaceRoot, WorkspaceState>()
    }

    updateWorkspaceEntry(workspaceRoot: WorkspaceRoot, workspaceState: WorkspaceState) {
        if (!workspaceState.messageQueue) {
            workspaceState.messageQueue = []
        }
        this.workspaceMap.set(workspaceRoot, workspaceState)
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
            // const workspaces = [...this.workspaceMap.keys()]
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

    processNewWorkspaceFolder(workspaceFolder: WorkspaceFolder) {
        /*
                 TODO: Make a call to ListWorkspaceMetadata API to get the state for the workspace. For now, keeping it static.
                 ListWorkspaceMetadata should also return the URI to connect to address & port. For now, keeping it static.
                 */
        let state = 'READY'
        let uri = 'ws://localhost:8080'
        if (state === 'READY') {
            const webSocketClient = new WebSocketClient(uri)
            this.updateWorkspaceEntry(workspaceFolder.uri, {
                remoteWorkspaceState: 'CONNECTED',
                webSocketClient: webSocketClient,
            })
            this.processMessagesInQueue(workspaceFolder.uri)
        } else {
            // TODO: make a call to CreateWorkspace API. It's a fire & forget call
            this.updateWorkspaceEntry(workspaceFolder.uri, {
                remoteWorkspaceState: state as RemoteWorkspaceState,
            })
        }
    }

    /*
    TODO: emit event or put them in queue depending upon the state of websocket client for the folder
    */
    processWorkspaceFolderAddition(workspaceFolder: WorkspaceFolder) {
        this.processNewWorkspaceFolder(workspaceFolder)
        this.pollWorkspaceState([workspaceFolder.uri])
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
