/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from 'fs'
import * as path from 'path'
import { ExtensionContext, Disposable } from 'vscode'
import { LanguageClient, State } from 'vscode-languageclient/node'

/**
 * Watches the server module file for changes and restarts the language server when changes are detected.
 * @param serverModule Path to the server module file
 * @param client The language client instance to restart
 * @param context Extension context
 * @returns Disposable for the file watcher
 */
export function watchServerModule(serverModule: string, client: LanguageClient, context: ExtensionContext): Disposable {
    // Ensure the server module path exists
    if (!fs.existsSync(serverModule)) {
        console.warn(`Server module path does not exist: ${serverModule}`)
        return new Disposable(() => {})
    }

    console.log(`Setting up watcher for server module: ${serverModule}`)

    // Get the directory and filename of the server module
    const serverDir = path.dirname(serverModule)

    // Use Node.js fs.watch API directly
    let fsWatcher: fs.FSWatcher | undefined
    let debounceTimer: NodeJS.Timeout | undefined
    let isRestarting = false

    try {
        // Watch the directory containing the server module
        fsWatcher = fs.watch(serverDir, (eventType, filename) => {
            // Only react to changes to our specific file
            if (filename && path.join(serverDir, filename) === serverModule) {
                console.log(`Server module ${eventType} detected: ${filename}`)

                // Debounce the restart to avoid multiple restarts for a single change
                if (debounceTimer) {
                    clearTimeout(debounceTimer)
                }

                debounceTimer = setTimeout(async () => {
                    if (isRestarting) {
                        return
                    }

                    isRestarting = true

                    try {
                        console.log('Restarting language server...')

                        // Log the client state before restart
                        console.log('Client state before restart:', client.state)
                        console.log(
                            'Client initializeResult before restart:',
                            client.initializeResult ? 'exists' : 'undefined'
                        )

                        // Use the built-in restart method which should preserve handlers
                        await client.restart()

                        // Log the client state after restart
                        console.log('Client state after restart:', client.state)
                        console.log(
                            'Client initializeResult after restart:',
                            client.initializeResult ? 'exists' : 'undefined'
                        )

                        console.log('Language server restarted successfully')

                        // Note: Bearer token restoration is handled in credentialsActivation.ts
                        // through the onDidChangeState event handler
                    } catch (error) {
                        console.error('Failed to restart language server:', error)
                    } finally {
                        isRestarting = false
                    }
                }, 500) // 500ms debounce
            }
        })

        console.log(`Native file watcher set up for directory: ${serverDir}`)
    } catch (error) {
        console.error(`Failed to set up file watcher: ${error}`)
    }

    // Create a disposable to clean up the watcher
    return new Disposable(() => {
        if (fsWatcher) {
            fsWatcher.close()
        }

        if (debounceTimer) {
            clearTimeout(debounceTimer)
        }
    })
}
