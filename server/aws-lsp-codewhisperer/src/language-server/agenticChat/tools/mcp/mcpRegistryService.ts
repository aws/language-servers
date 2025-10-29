/*! * Copyright Amazon.com, Inc. or its affiliates.
 * All Rights Reserved. SPDX-License-Identifier: Apache-2.0
 */

import { Logging } from '@aws/language-server-runtimes/server-interface'
import { HttpsProxyAgent } from 'hpagent'
import { httpsUtils } from '@aws/lsp-core'
import { McpRegistryData } from './mcpTypes'
import { MCP_REGISTRY_CONSTANTS } from './mcpRegistryConstants'
import { McpRegistryValidator } from './mcpRegistryValidator'

export class McpRegistryService {
    private inMemoryRegistry: McpRegistryData | null = null
    private validator: McpRegistryValidator

    constructor(private logging: Logging) {
        this.validator = new McpRegistryValidator()
    }

    async fetchRegistry(url: string): Promise<McpRegistryData | null> {
        if (!this.validateRegistryUrl(url)) {
            this.logging.error(`MCP Registry: Invalid registry URL format: ${url}`)
            return null
        }

        try {
            const proxyUrl = process.env.HTTPS_PROXY ?? process.env.https_proxy
            const agent = proxyUrl ? new HttpsProxyAgent({ proxy: proxyUrl }) : undefined
            const json = await httpsUtils.requestContent(url, agent)
            const parsed = JSON.parse(json)

            const validationResult = this.validator.validateRegistryJson(parsed)
            if (!validationResult.isValid) {
                this.logging.error(
                    `MCP Registry: Invalid registry format in ${url}: ${validationResult.errors.join(', ')}`
                )
                return null
            }

            const registryData: McpRegistryData = {
                servers: parsed.servers,
                lastFetched: new Date(),
                url,
            }

            this.inMemoryRegistry = registryData
            this.logging.info(
                `MCP Registry: Successfully fetched registry from ${url} with ${registryData.servers.length} servers`
            )
            return registryData
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error)
            if (errorMsg.includes('ENOTFOUND') || errorMsg.includes('ECONNREFUSED')) {
                this.logging.error(`MCP Registry: Network error - unable to reach ${url}: ${errorMsg}`)
            } else if (
                errorMsg.includes('401') ||
                errorMsg.includes('403') ||
                errorMsg.includes('Unauthorized') ||
                errorMsg.includes('Forbidden')
            ) {
                this.logging.error(
                    `MCP Registry: Authentication required - registry URL must be accessible without credentials: ${url}`
                )
            } else if (errorMsg.includes('JSON')) {
                this.logging.error(`MCP Registry: Invalid JSON format in registry at ${url}: ${errorMsg}`)
            } else {
                this.logging.error(`MCP Registry: Failed to fetch registry from ${url}: ${errorMsg}`)
            }
            return null
        }
    }

    getInMemoryRegistry(): McpRegistryData | null {
        return this.inMemoryRegistry
    }

    validateRegistryUrl(url: string): boolean {
        if (!url) {
            this.logging.error('MCP Registry: URL is empty or undefined')
            return false
        }
        if (url.length > MCP_REGISTRY_CONSTANTS.MAX_REGISTRY_URL_LENGTH) {
            this.logging.error(
                `MCP Registry: URL exceeds maximum length of ${MCP_REGISTRY_CONSTANTS.MAX_REGISTRY_URL_LENGTH} characters`
            )
            return false
        }
        if (!url.startsWith('https://')) {
            this.logging.error('MCP Registry: URL must use HTTPS protocol')
            return false
        }
        return true
    }

    isRegistryActive(): boolean {
        return this.inMemoryRegistry !== null
    }
}
