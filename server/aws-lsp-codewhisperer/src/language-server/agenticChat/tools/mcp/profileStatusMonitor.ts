/*!
 * Copyright Amazon.com, Inc. or its affiliates.
 * All Rights Reserved. SPDX-License-Identifier: Apache-2.0
 */

import {
    CredentialsProvider,
    Logging,
    SDKInitializator,
    Workspace,
} from '@aws/language-server-runtimes/server-interface'
import { CodeWhispererServiceToken } from '../../../../shared/codeWhispererService'
import { DEFAULT_AWS_Q_ENDPOINT_URL, DEFAULT_AWS_Q_REGION } from '../../../../shared/constants'
import { AmazonQTokenServiceManager } from '../../../../shared/amazonQServiceManager/AmazonQTokenServiceManager'

export class ProfileStatusMonitor {
    private intervalId?: NodeJS.Timeout
    private readonly CHECK_INTERVAL = 24 * 60 * 60 * 1000 // 24 hours
    private codeWhispererClient?: CodeWhispererServiceToken
    private cachedProfileArn?: string
    private static lastMcpState?: boolean

    constructor(
        private credentialsProvider: CredentialsProvider,
        private workspace: Workspace,
        private logging: Logging,
        private sdkInitializator: SDKInitializator,
        private onMcpDisabled: () => void,
        private onMcpEnabled?: () => void
    ) {}

    async checkInitialState(): Promise<boolean> {
        try {
            const isMcpEnabled = await this.checkMcpConfiguration()
            return isMcpEnabled !== false // Return true if enabled or API failed
        } catch (error) {
            this.logging.debug(`Initial MCP state check failed, defaulting to enabled: ${error}`)
            ProfileStatusMonitor.lastMcpState = true
            return true
        }
    }

    start(): void {
        if (this.intervalId) {
            return
        }

        this.intervalId = setInterval(() => {
            void this.checkMcpConfiguration()
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

    private async checkMcpConfiguration(): Promise<boolean | undefined> {
        try {
            const profileArn = this.getProfileArn()
            if (!profileArn) {
                this.logging.debug('No profile ARN available for MCP configuration check')
                ProfileStatusMonitor.lastMcpState = true // Default to enabled if no profile
                return true
            }

            if (!this.codeWhispererClient) {
                this.codeWhispererClient = new CodeWhispererServiceToken(
                    this.credentialsProvider,
                    this.workspace,
                    this.logging,
                    process.env.CODEWHISPERER_REGION || DEFAULT_AWS_Q_REGION,
                    process.env.CODEWHISPERER_ENDPOINT || DEFAULT_AWS_Q_ENDPOINT_URL,
                    this.sdkInitializator
                )
                this.codeWhispererClient.profileArn = profileArn
            }

            const response = await this.retryWithBackoff(() => this.codeWhispererClient!.getProfile({ profileArn }))
            const isMcpEnabled = response?.profile?.optInFeatures?.mcpConfiguration?.toggle === 'ON'

            if (ProfileStatusMonitor.lastMcpState !== isMcpEnabled) {
                ProfileStatusMonitor.lastMcpState = isMcpEnabled
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
            ProfileStatusMonitor.lastMcpState = true
            return true
        }
    }

    private getProfileArn(): string | undefined {
        // Use cached value if available
        if (this.cachedProfileArn) {
            return this.cachedProfileArn
        }

        try {
            // Get profile ARN from service manager like in agenticChatController
            const serviceManager = AmazonQTokenServiceManager.getInstance()
            this.cachedProfileArn = serviceManager.getActiveProfileArn()
            return this.cachedProfileArn
        } catch (error) {
            this.logging.debug(`Failed to get profile ARN: ${error}`)
        }
        return undefined
    }

    private async retryWithBackoff<T>(fn: () => Promise<T>): Promise<T> {
        const maxRetries = 2 // Reduced from 3

        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                return await fn()
            } catch (error: any) {
                const errorCode = error.code || error.name
                const statusCode = error.statusCode

                // Fast fail on non-retryable errors
                if (statusCode >= 400 && statusCode < 500 && errorCode !== 'ThrottlingException') {
                    throw error
                }

                const isRetryable =
                    errorCode === 'ThrottlingException' ||
                    errorCode === 'InternalServerException' ||
                    statusCode === 500 ||
                    statusCode === 503

                if (!isRetryable || attempt === maxRetries - 1) {
                    throw error
                }

                // Shorter delay: 500ms, 1s
                const delay = 500 * (attempt + 1)
                await new Promise(resolve => setTimeout(resolve, delay))
            }
        }
        throw new Error('Retry failed')
    }
    static getMcpState(): boolean | undefined {
        return ProfileStatusMonitor.lastMcpState
    }
}
