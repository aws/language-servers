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
    private serverLookupMap: Map<string, any> | null = null
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
            const response = await httpsUtils.requestContent(url, agent)

            // Validate content type to prevent HTML/JavaScript injection
            if (
                response.contentType &&
                !response.contentType.includes('application/json') &&
                !response.contentType.includes('text/plain')
            ) {
                this.logging.error(
                    `MCP Registry: Invalid content type '${response.contentType}' from ${url}. Expected JSON.`
                )
                return null
            }

            const parsed = JSON.parse(response.content)

            const validationResult = this.validator.validateRegistryJson(parsed)
            if (!validationResult.isValid) {
                this.logging.error(
                    `MCP Registry: Invalid registry format in ${url}: ${validationResult.errors.join(', ')}`
                )
                return null
            }

            // Extract servers from wrapper structure if present
            const servers = parsed.servers.map((item: any) => item.server || item)

            // Sort servers alphabetically by name (error-proof)
            servers.sort((a: any, b: any) => {
                try {
                    const nameA = String(a?.name ?? '').toLowerCase()
                    const nameB = String(b?.name ?? '').toLowerCase()
                    return nameA.localeCompare(nameB, undefined, { sensitivity: 'base', numeric: true })
                } catch {
                    return 0
                }
            })

            const registryData: McpRegistryData = {
                servers,
                lastFetched: new Date(),
                url,
            }

            this.inMemoryRegistry = registryData
            this.serverLookupMap = this.buildServerLookupMap(servers)
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
        // Match server-side pattern: ^https://[A-Za-z0-9\-._~:/?#\[\]@!$&'()*+,;=%]+$
        const httpsUrlPattern = /^https:\/\/[A-Za-z0-9\-._~:\/?#\[\]@!$&'()*+,;=%]+$/
        if (!httpsUrlPattern.test(url)) {
            this.logging.error('MCP Registry: URL must be a valid HTTPS URL')
            return false
        }
        return true
    }

    isRegistryActive(): boolean {
        return this.inMemoryRegistry !== null
    }

    getServerByName(name: string): any | undefined {
        return this.serverLookupMap?.get(name)
    }

    private buildServerLookupMap(servers: any[]): Map<string, any> {
        const map = new Map<string, any>()
        for (const server of servers) {
            if (server.name) {
                map.set(server.name, server)
            }
        }
        return map
    }
}
