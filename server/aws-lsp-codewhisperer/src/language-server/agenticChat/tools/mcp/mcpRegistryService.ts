/*! * Copyright Amazon.com, Inc. or its affiliates.
 * All Rights Reserved. SPDX-License-Identifier: Apache-2.0
 */

import { Logging } from '@aws/language-server-runtimes/server-interface'
import { HttpsProxyAgent } from 'hpagent'
import { httpsUtils } from '@aws/lsp-core'
import { McpRegistryData } from './mcpTypes'
import { MCP_REGISTRY_CONSTANTS } from './mcpRegistryConstants'

export class McpRegistryService {
    private inMemoryRegistry: McpRegistryData | null = null

    constructor(private logging: Logging) {}

    async fetchRegistry(url: string): Promise<McpRegistryData | null> {
        if (!this.validateRegistryUrl(url)) {
            this.logging.warn(`Invalid registry URL: ${url}`)
            return null
        }

        try {
            const proxyUrl = process.env.HTTPS_PROXY ?? process.env.https_proxy
            const agent = proxyUrl ? new HttpsProxyAgent({ proxy: proxyUrl }) : undefined
            const json = await httpsUtils.requestContent(url, agent)
            const parsed = JSON.parse(json)

            if (!parsed.servers || !Array.isArray(parsed.servers)) {
                this.logging.warn('Registry JSON missing servers array')
                return null
            }

            const registryData: McpRegistryData = {
                servers: parsed.servers,
                lastFetched: new Date(),
                url,
            }

            this.inMemoryRegistry = registryData
            this.logging.info(`Fetched MCP registry from ${url} with ${registryData.servers.length} servers`)
            return registryData
        } catch (error) {
            this.logging.warn(`Failed to fetch MCP registry from ${url}: ${error}`)
            return null
        }
    }

    getInMemoryRegistry(): McpRegistryData | null {
        return this.inMemoryRegistry
    }

    validateRegistryUrl(url: string): boolean {
        if (!url || url.length > MCP_REGISTRY_CONSTANTS.MAX_REGISTRY_URL_LENGTH) {
            return false
        }
        return url.startsWith('https://')
    }

    isRegistryActive(): boolean {
        return this.inMemoryRegistry !== null
    }
}
