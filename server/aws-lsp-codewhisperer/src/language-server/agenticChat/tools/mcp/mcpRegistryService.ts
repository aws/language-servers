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
        try {
            // Validate URL first
            this.validateRegistryUrl(url)

            const proxyUrl = process.env.HTTPS_PROXY ?? process.env.https_proxy
            const agent = proxyUrl ? new HttpsProxyAgent({ proxy: proxyUrl }) : undefined
            const response = await httpsUtils.requestContent(url, agent)

            // Validate content type to prevent HTML/JavaScript injection
            if (
                response.contentType &&
                !response.contentType.includes('application/json') &&
                !response.contentType.includes('text/plain')
            ) {
                const errorMsg = `Invalid content type '${response.contentType}' from registry URL. Expected JSON.`
                this.logging.error(`MCP Registry: ${errorMsg} (URL: ${url})`)
                throw new Error(
                    `MCP Registry: Invalid content type '${response.contentType}' from registry URL. Expected JSON.`
                )
            }

            const parsed = JSON.parse(response.content)

            const validationResult = this.validator.validateRegistryJson(parsed)
            if (!validationResult.isValid) {
                const errorMsg = `Invalid registry format: ${validationResult.errors.join(', ')}`
                this.logging.error(`MCP Registry: ${errorMsg} (URL: ${url})`)
                throw new Error(`MCP Registry: ${errorMsg}`)
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
            let specificError: string

            if (errorMsg.includes('ENOTFOUND') || errorMsg.includes('ECONNREFUSED')) {
                specificError = `Network error - unable to reach registry URL: ${errorMsg}`
            } else if (
                errorMsg.includes('401') ||
                errorMsg.includes('403') ||
                errorMsg.includes('Unauthorized') ||
                errorMsg.includes('Forbidden')
            ) {
                specificError = `Authentication required - registry URL must be accessible without credentials`
            } else if (errorMsg.includes('JSON')) {
                specificError = `Invalid JSON format in registry: ${errorMsg}`
            } else if (errorMsg.startsWith('MCP Registry:')) {
                // Re-throw registry-specific errors as-is
                throw error
            } else {
                specificError = `Failed to fetch registry: ${errorMsg}`
            }

            this.logging.error(`MCP Registry: ${specificError} (URL: ${url})`)
            throw new Error(`MCP Registry: ${specificError}`)
        }
    }

    getInMemoryRegistry(): McpRegistryData | null {
        return this.inMemoryRegistry
    }

    validateRegistryUrl(url: string): boolean {
        if (!url) {
            const errorMsg = 'URL is empty or undefined'
            this.logging.error(`MCP Registry: ${errorMsg} (URL: ${url})`)
            throw new Error(`MCP Registry: ${errorMsg}`)
        }
        if (url.length > MCP_REGISTRY_CONSTANTS.MAX_REGISTRY_URL_LENGTH) {
            const errorMsg = `URL exceeds maximum length of ${MCP_REGISTRY_CONSTANTS.MAX_REGISTRY_URL_LENGTH} characters`
            this.logging.error(`MCP Registry: ${errorMsg} (URL: ${url})`)
            throw new Error(`MCP Registry: ${errorMsg}`)
        }
        // Match server-side pattern: ^https://[A-Za-z0-9\-._~:/?#\[\]@!$&'()*+,;=%]+$
        const httpsUrlPattern = /^https:\/\/[A-Za-z0-9\-._~:\/?#\[\]@!$&'()*+,;=%]+$/
        if (!httpsUrlPattern.test(url)) {
            const errorMsg = 'URL must be a valid HTTPS URL'
            this.logging.error(`MCP Registry: ${errorMsg} (URL: ${url})`)
            throw new Error(`MCP Registry: ${errorMsg}`)
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
