/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from 'fs'
import * as path from 'path'
import * as crypto from 'crypto'
import { URI } from 'vscode-uri'
import { Logging } from '@aws/language-server-runtimes/server-interface'

/**
 * Generates a hash for a request to help with debugging
 *
 * @param filename The filename of the request
 * @param content The content of the file
 * @param character The character position
 * @param line The line position
 * @returns A hash string for the request
 */
export function getRequestHash(filename: string, content: string, character: number, line: number): string {
    const hash = crypto.createHash('md5')
    hash.update(`${filename}:${line}:${character}:${content.length}`)
    return hash.digest('hex').substring(0, 8)
}

/**
 * ConfigProvider class for reading configuration settings from workspace
 */
export class ConfigProvider {
    private static instance: ConfigProvider | undefined
    private workspaceUri: string
    private logging: Logging
    private configCache: Map<string, any> = new Map()
    private lastReadTime: Map<string, number> = new Map()
    private readonly cacheTimeMs = 5000 // 5 seconds cache

    /**
     * Private constructor to enforce singleton pattern
     *
     * @param workspaceUri The URI of the workspace folder
     */
    private constructor(workspaceUri: string, logging: Logging) {
        this.workspaceUri = workspaceUri
        this.logging = logging
    }

    /**
     * Gets the singleton instance of ConfigProvider
     *
     * @param workspaceUri The URI of the workspace folder
     * @returns The ConfigProvider instance
     */
    public static getInstance(workspaceUri?: string, logging?: Logging): ConfigProvider {
        if (!ConfigProvider.instance && workspaceUri && logging) {
            ConfigProvider.instance = new ConfigProvider(workspaceUri, logging)
        }
        return ConfigProvider.instance!
    }

    /**
     * Gets a configuration value by key
     *
     * @param key The configuration key to retrieve
     * @param defaultValue The default value to return if the key is not found
     * @returns The configuration value or the default value
     */
    public getConfig(key: string, defaultValue?: any): any {
        const now = Date.now()
        const lastRead = this.lastReadTime.get(key) || 0

        // Check if we need to refresh the cache
        if (now - lastRead > this.cacheTimeMs || !this.configCache.has(key)) {
            try {
                const fsPath = URI.parse(this.workspaceUri).fsPath
                const settingsPath = path.join(fsPath, '.vscode', 'settings.json')

                if (fs.existsSync(settingsPath)) {
                    // Read the file content
                    const fileContent = fs.readFileSync(settingsPath, 'utf8')

                    try {
                        const settings = JSON.parse(fileContent)
                        this.configCache.set(key, settings[key])
                        this.lastReadTime.set(key, now)
                    } catch (jsonError) {
                        // Log the JSON error without attempting to fix it
                        this.logging.info(`Error parsing JSON in settings.json for key ${key}: ${jsonError}`)
                        this.logging.info(`settings.json content - ${fileContent}`)

                        // Use cached value or default
                        if (!this.configCache.has(key)) {
                            this.configCache.set(key, defaultValue)
                        }
                    }
                } else {
                    // Log when the settings file is not found
                    console.warn(`Settings file not found at: ${settingsPath}`)
                    if (!this.configCache.has(key)) {
                        this.configCache.set(key, defaultValue)
                    }
                }
            } catch (error) {
                this.logging.info(`Error reading config for key ${key}: ${error}`)
                // If there's an error, use the cached value or default
                if (!this.configCache.has(key)) {
                    this.configCache.set(key, defaultValue)
                }
            }
        }

        return this.configCache.get(key) ?? defaultValue
    }
}
