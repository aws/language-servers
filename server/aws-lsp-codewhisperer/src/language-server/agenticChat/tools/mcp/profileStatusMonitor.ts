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

    constructor(
        private logging: Logging,
        private onMcpDisabled: () => void,
        private onMcpEnabled?: () => void
    ) {
        ProfileStatusMonitor.logging = logging
        ProfileStatusMonitor.loadMcpStateFromDisk()

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
            const isMcpEnabled = mcpConfig ? mcpConfig.toggle === 'ON' : true

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

    /**
     * Returns the current MCP enabled/disabled state.
     * Used by McpManager.init() to skip server discovery when MCP is disabled.
     * This optimization prevents initialization errors and improves performance.
     * @returns true if MCP is enabled, false if disabled
     */
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
}
