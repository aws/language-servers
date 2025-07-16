/**
 * This class tracks active user events based on time windows.
 * If multiple messages are sent within the same time window, it will count as a single active user event.
 * The time window is not reset by subsequent messages within the window.
 * A new message outside the window will reset the window and count as a new active user event.
 *
 * The window state is persisted to disk to survive across IDE restarts and user logout/login cycles.
 */

import * as os from 'os'
import path = require('path')
import { Features } from '@aws/language-server-runtimes/server-interface/server'

// Default window size in minutes (24 hours)
export const DEFAULT_ACTIVE_USER_WINDOW_MINUTES = 24 * 60

// The state file contains a map of client IDs to their window start timestamps
interface WindowState {
    clients: Record<string, number>
}

export class ActiveUserTracker {
    private static instance: ActiveUserTracker | undefined
    private windowStartTimestamp: number = -1
    private windowSizeMs: number
    private clientId: string
    private stateFilePath: string
    private features: Features

    private constructor(features: Features) {
        this.windowSizeMs = DEFAULT_ACTIVE_USER_WINDOW_MINUTES * 60 * 1000
        this.features = features
        this.clientId = this.getClientId()
        this.stateFilePath = this.getStateFilePath()
        // Initialize with default state
        void this.loadPersistedState()
    }

    /**
     * Gets the singleton instance of ActiveUserTracker
     * @param features Features object containing workspace, logging, lsp, and other services
     * @returns The ActiveUserTracker instance
     */
    public static getInstance(features: Features): ActiveUserTracker {
        if (!ActiveUserTracker.instance) {
            ActiveUserTracker.instance = new ActiveUserTracker(features)
        }

        const currentClientId =
            features.lsp.getClientInitializeParams()?.initializationOptions?.aws?.clientInfo?.clientId
        if (currentClientId && ActiveUserTracker.instance.clientId !== currentClientId) {
            // Client ID changed, update it and load its state
            features.logging.debug(
                `Client ID changed from ${ActiveUserTracker.instance.clientId} to ${currentClientId}`
            )
            ActiveUserTracker.instance.clientId = currentClientId

            // Don't reset the timestamp here - just load the state for the new client ID
            // If there's no state for this client ID, loadPersistedState will leave windowStartTimestamp as -1
            // which will trigger a new active user event on the next isNewActiveUser() call
            void ActiveUserTracker.instance.loadPersistedState()
        }

        return ActiveUserTracker.instance
    }

    /**
     * Determines if it should count as a new active user event
     * @returns true if this is a new active user event, false if it's within an existing window
     */
    public isNewActiveUser(): boolean {
        const currentTime = Date.now()

        // If this is the first message or the window has expired
        if (this.windowStartTimestamp === -1 || currentTime - this.windowStartTimestamp > this.windowSizeMs) {
            // This is a new active user event - start a new window
            this.windowStartTimestamp = currentTime
            this.features.logging.debug(
                `New active user event for client ${this.clientId}, setting timestamp: ${this.windowStartTimestamp}`
            )
            void this.persistState()
            return true
        }

        // Message is within the current window, do NOT update the timestamp
        // The window continues from its original start time
        return false
    }

    /**
     * Resets the tracker
     */
    public dispose(): void {
        // Just reset the in-memory state and clear the singleton instance
        this.windowStartTimestamp = -1
        ActiveUserTracker.instance = undefined
    }

    /**
     * Gets the client ID from the LSP initialization parameters or generates a machine ID if not available
     * @returns The client ID
     */
    private getClientId(): string {
        const clientId = this.features.lsp.getClientInitializeParams()?.initializationOptions?.aws?.clientInfo?.clientId
        if (clientId) {
            return clientId
        }

        // Generate a machine-specific ID if no client ID is available
        const hostname = os.hostname()
        const username = os.userInfo().username
        return `${hostname}-${username}`
    }

    /**
     * Gets the path to the state file
     * @returns The path to the state file
     */
    private getStateFilePath(): string {
        const amazonQDir = path.join(os.homedir(), '.aws', 'amazonq')

        // Directory will be created when needed in persistState()
        return path.join(amazonQDir, 'active-user-state.json')
    }

    /**
     * Loads the persisted state from disk
     */
    private async loadPersistedState(): Promise<void> {
        try {
            const exists = await this.features.workspace.fs.exists(this.stateFilePath)
            if (exists) {
                const data = await this.features.workspace.fs.readFile(this.stateFilePath, { encoding: 'utf8' })
                const state = JSON.parse(data) as WindowState

                // If the client exists in the state, restore its timestamp
                if (state.clients && state.clients[this.clientId] !== undefined) {
                    this.windowStartTimestamp = state.clients[this.clientId]
                    this.features.logging.debug(
                        `Loaded active user state for client ${this.clientId}, timestamp: ${this.windowStartTimestamp}`
                    )
                }
            }
        } catch (error) {
            // If there's any error reading the state, delete the corrupted file and start fresh
            this.windowStartTimestamp = -1
            this.features.logging.warn(`Error loading active user state: ${error}`)
            try {
                const exists = await this.features.workspace.fs.exists(this.stateFilePath)
                if (exists) {
                    await this.features.workspace.fs.rm(this.stateFilePath)
                }
            } catch (deleteError) {
                // Ignore errors when deleting corrupted file
            }
        }
    }

    /**
     * Persists the current state to disk
     */
    private async persistState(): Promise<void> {
        try {
            // Try to read existing state file to update it
            let state: WindowState = { clients: {} }

            // Create directory if it doesn't exist
            const dirPath = path.dirname(this.stateFilePath)
            await this.features.workspace.fs.mkdir(dirPath, { recursive: true })

            const exists = await this.features.workspace.fs.exists(this.stateFilePath)
            if (exists) {
                try {
                    const data = await this.features.workspace.fs.readFile(this.stateFilePath, { encoding: 'utf8' })
                    state = JSON.parse(data) as WindowState
                } catch (error) {
                    // If there's any error reading the state, start fresh
                    state = { clients: {} }
                    this.features.logging.warn(`Error parsing active user state file: ${error}`)
                }
            }

            // Update or add the current client timestamp
            state.clients[this.clientId] = this.windowStartTimestamp

            await this.features.workspace.fs.writeFile(this.stateFilePath, JSON.stringify(state), { mode: 0o600 })
        } catch (error) {
            this.features.logging.warn(`Error persisting active user state: ${error}`)
        }
    }
}
