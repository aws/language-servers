/*! * Copyright Amazon.com, Inc. or its affiliates.
 * All Rights Reserved. SPDX-License-Identifier: Apache-2.0
 */

import { Logging } from '@aws/language-server-runtimes/server-interface'
import https = require('https')

export interface McpRegistryData {
    servers: McpRegistryServer[]
    lastFetched: Date
    url: string
}

export interface McpRegistryServer {
    name: string
    title?: string
    description: string
    version: string
    remotes?: Array<{
        type: 'streamable-http' | 'sse'
        url: string
        headers?: Array<{
            name: string
            value: string
        }>
    }>
    packages?: Array<{
        registryType: 'npm' | 'pypi'
        registryBaseUrl?: string
        identifier: string
        version: string
        transport: {
            type: 'stdio'
        }
        packageArguments?: Array<{
            type: 'positional'
            value: string
        }>
        environmentVariables?: Array<{
            name: string
            default: string
        }>
    }>
}

export class McpRegistryService {
    private inMemoryRegistry: McpRegistryData | null = null

    constructor(private logging: Logging) {}

    async fetchRegistry(url: string): Promise<McpRegistryData | null> {
        if (!this.validateRegistryUrl(url)) {
            this.logging.warn(`Invalid registry URL: ${url}`)
            return null
        }

        try {
            const json = await this.httpsGet(url)
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
        if (!url || url.length > 1024) {
            return false
        }
        return url.startsWith('https://')
    }

    isRegistryActive(): boolean {
        return this.inMemoryRegistry !== null
    }

    private httpsGet(url: string): Promise<string> {
        return new Promise((resolve, reject) => {
            https
                .get(url, res => {
                    if (res.statusCode !== 200) {
                        reject(new Error(`HTTP ${res.statusCode}`))
                        return
                    }

                    let data = ''
                    res.on('data', chunk => {
                        data += chunk
                    })
                    res.on('end', () => resolve(data))
                })
                .on('error', reject)
        })
    }
}
