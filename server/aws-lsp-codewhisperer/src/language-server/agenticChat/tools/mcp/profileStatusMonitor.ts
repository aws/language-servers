/*!
 * Copyright Amazon.com, Inc. or its affiliates.
 * All Rights Reserved. SPDX-License-Identifier: Apache-2.0
 */

import { Logging } from '@aws/language-server-runtimes/server-interface'
import { retryUtils } from '@aws/lsp-core'
import { CodeWhispererServiceToken } from '../../../../shared/codeWhispererService'
import { AmazonQTokenServiceManager } from '../../../../shared/amazonQServiceManager/AmazonQTokenServiceManager'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { EventEmitter } from 'events'
import { McpRegistryService } from './mcpRegistryService'
import { McpRegistryData } from './mcpTypes'

export const AUTH_SUCCESS_EVENT = 'authSuccess'

export class ProfileStatusMonitor {
    private intervalId?: NodeJS.Timeout
    private readonly CHECK_INTERVAL = 24 * 60 * 60 * 1000 // 24 hours
    private codeWhispererClient?: CodeWhispererServiceToken
    private static lastMcpState: boolean = true
    private static readonly MCP_CACHE_DIR = path.join(os.homedir(), '.aws', 'amazonq', 'mcpAdmin')
    private static readonly MCP_CACHE_FILE = path.join(ProfileStatusMonitor.MCP_CACHE_DIR, 'mcp-state.json')
    private static eventEmitter = new EventEmitter()
    private static logging?: Logging
    private onRegistryUpdate?: (registryUrl: string | null) => Promise<void>

    constructor(
        private logging: Logging,
        private onMcpDisabled: () => void,
        private onMcpEnabled?: () => void,
        onRegistryUpdate?: (registryUrl: string | null) => Promise<void>
    ) {
        ProfileStatusMonitor.logging = logging
        ProfileStatusMonitor.loadMcpStateFromDisk()
        this.onRegistryUpdate = onRegistryUpdate

        // Listen for auth success events
        ProfileStatusMonitor.eventEmitter.on(AUTH_SUCCESS_EVENT, () => {
            void this.isMcpEnabled()
        })
    }

    async checkInitialState(): Promise<boolean> {
        try {
            const isMcpEnabled = await this.isMcpEnabled()
            return isMcpEnabled !== false // Return true if enabled or API failed
        } catch (error) {
            this.logging.debug(`Initial MCP state check failed, defaulting to enabled: ${error}`)
            return ProfileStatusMonitor.getMcpState()
        }
    }

    start(): void {
        if (this.intervalId) {
            return
        }

        this.intervalId = setInterval(() => {
            void this.isMcpEnabled()
        }, this.CHECK_INTERVAL)

        this.logging.info('ProfileStatusMonitor started - checking MCP configuration every 24 hours')
    }

    stop(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId)
            this.intervalId = undefined
            this.logging.info('ProfileStatusMonitor stopped')
        }
    }

    private async isMcpEnabled(): Promise<boolean | undefined> {
        try {
            const serviceManager = AmazonQTokenServiceManager.getInstance()
            const profileArn = this.getProfileArn(serviceManager)
            if (!profileArn) {
                this.logging.debug('No profile ARN available for MCP configuration check')
                ProfileStatusMonitor.setMcpState(true)
                return true
            }

            this.codeWhispererClient = serviceManager.getCodewhispererService()

            const response = await retryUtils.retryWithBackoff(() =>
                this.codeWhispererClient!.getProfile({ profileArn })
            )
            const mcpConfig = response?.profile?.optInFeatures?.mcpConfiguration
            let isMcpEnabled = mcpConfig ? mcpConfig.toggle === 'ON' : true

            // Fetch registry URL if MCP is enabled and user is enterprise
            if (isMcpEnabled && this.isEnterpriseUser(serviceManager)) {
                const registryFetchSuccess = await this.fetchRegistryIfNeeded(response)
                if (!registryFetchSuccess) {
                    isMcpEnabled = false
                }
            }

            if (ProfileStatusMonitor.lastMcpState !== isMcpEnabled) {
                ProfileStatusMonitor.setMcpState(isMcpEnabled)
                if (!isMcpEnabled) {
                    this.logging.info('MCP configuration disabled - removing tools')
                    this.onMcpDisabled()
                } else if (isMcpEnabled && this.onMcpEnabled) {
                    this.logging.info('MCP configuration enabled - initializing tools')
                    this.onMcpEnabled()
                }
            }

            return isMcpEnabled
        } catch (error) {
            this.logging.debug(`MCP configuration check failed, defaulting to enabled: ${error}`)
            const mcpState = ProfileStatusMonitor.getMcpState()
            if (!mcpState) {
                this.onMcpDisabled()
            } else if (this.onMcpEnabled) {
                this.onMcpEnabled()
            }
            return mcpState
        }
    }

    private getProfileArn(serviceManager: AmazonQTokenServiceManager): string | undefined {
        try {
            return serviceManager.getActiveProfileArn()
        } catch (error) {
            this.logging.debug(`Failed to get profile ARN: ${error}`)
        }
        return undefined
    }

    static getMcpState(): boolean {
        return ProfileStatusMonitor.lastMcpState
    }

    private static loadMcpStateFromDisk(): void {
        try {
            if (fs.existsSync(ProfileStatusMonitor.MCP_CACHE_FILE)) {
                const data = fs.readFileSync(ProfileStatusMonitor.MCP_CACHE_FILE, 'utf8')
                const parsed = JSON.parse(data)
                ProfileStatusMonitor.lastMcpState = parsed.enabled ?? true
            }
        } catch (error) {
            ProfileStatusMonitor.logging?.debug(`Failed to load MCP state from disk: ${error}`)
        }
        ProfileStatusMonitor.setMcpState(ProfileStatusMonitor.lastMcpState)
    }

    private static saveMcpStateToDisk(): void {
        try {
            fs.mkdirSync(ProfileStatusMonitor.MCP_CACHE_DIR, { recursive: true })
            fs.writeFileSync(
                ProfileStatusMonitor.MCP_CACHE_FILE,
                JSON.stringify({ enabled: ProfileStatusMonitor.lastMcpState })
            )
        } catch (error) {
            ProfileStatusMonitor.logging?.debug(`Failed to save MCP state to disk: ${error}`)
        }
    }

    private static setMcpState(enabled: boolean): void {
        ProfileStatusMonitor.lastMcpState = enabled
        ProfileStatusMonitor.saveMcpStateToDisk()
    }

    static resetMcpState(): void {
        ProfileStatusMonitor.setMcpState(true)
    }

    static emitAuthSuccess(): void {
        ProfileStatusMonitor.eventEmitter.emit(AUTH_SUCCESS_EVENT)
    }

    private isEnterpriseUser(serviceManager: AmazonQTokenServiceManager): boolean {
        const connectionType = serviceManager.getConnectionType()
        return connectionType === 'identityCenter'
    }

    private async fetchRegistryIfNeeded(response: any): Promise<boolean> {
        if (!this.onRegistryUpdate) {
            return true
        }

        // TODO: Replace with actual registry URL from getProfile API response
        // const registryUrl = response?.profile?.optInFeatures?.mcpConfiguration?.registryUrl
        const registryUrl = this.getDummyRegistryUrl()

        if (!registryUrl) {
            this.logging.debug('MCP Registry: No registry URL configured')
            await this.onRegistryUpdate(null)
            return true
        }

        try {
            this.logging.info(`MCP Registry: Notifying MCP Manager of registry URL: ${registryUrl}`)
            await this.onRegistryUpdate(registryUrl)
            return true
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error)
            this.logging.error(`MCP Registry: Failed to update registry: ${errorMsg}`)
            return false
        }
    }

    private getDummyRegistryUrl(): string | null {
        // Temporary dummy URL for testing until getProfile API integration is complete
        return process.env.MCP_REGISTRY_URL || 'https://d2orqesgordx5o.cloudfront.net/test-mcp-registry.json'
    }

    async getRegistryUrl(): Promise<string | null> {
        try {
            const serviceManager = AmazonQTokenServiceManager.getInstance()
            if (!this.isEnterpriseUser(serviceManager)) {
                return null
            }

            const profileArn = this.getProfileArn(serviceManager)
            if (!profileArn) {
                return null
            }

            this.codeWhispererClient = serviceManager.getCodewhispererService()
            const response = await retryUtils.retryWithBackoff(() =>
                this.codeWhispererClient!.getProfile({ profileArn })
            )

            // TODO: Replace with actual registry URL from getProfile API response
            // return response?.profile?.optInFeatures?.mcpConfiguration?.registryUrl || null
            return this.getDummyRegistryUrl()
        } catch (error) {
            this.logging.debug(`Failed to get registry URL: ${error}`)
            return null
        }
    }
}
