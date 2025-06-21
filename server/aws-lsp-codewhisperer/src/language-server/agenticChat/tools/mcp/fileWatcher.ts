// eslint-disable-next-line import/no-nodejs-modules
import * as fs from 'fs'
// eslint-disable-next-line import/no-nodejs-modules
import * as path from 'path'
import { Logging } from '@aws/language-server-runtimes/server-interface'
import { URI } from 'vscode-uri'

export class FileWatcher {
    private watchers = new Map<string, fs.FSWatcher>()
    private callbacks = new Map<string, () => void>()

    /**
     * Creates a new FileWatcher instance
     * @param logger Logging instance
     */
    constructor(private logger: Logging) {}

    watchFile(filePath: string, callback: () => void): void {
        try {
            // Handle URI format paths
            let normalizedPath: string
            try {
                const uri = URI.parse(filePath)
                normalizedPath = uri.scheme === 'file' ? uri.fsPath : filePath
            } catch {
                normalizedPath = path.normalize(filePath)
            }

            // Close existing watcher if any
            this.unwatchFile(normalizedPath)

            // Create a debounced version of the callback to avoid multiple triggers
            let debounceTimer: NodeJS.Timeout | null = null
            const debouncedCallback = () => {
                if (debounceTimer) {
                    clearTimeout(debounceTimer)
                }
                debounceTimer = setTimeout(() => {
                    this.logger.info(`File changed: ${normalizedPath}`)
                    callback()
                    debounceTimer = null
                }, 300) // 300ms debounce time
            }

            const watcher = fs.watch(normalizedPath, () => {
                debouncedCallback()
            })

            this.watchers.set(normalizedPath, watcher)
            this.callbacks.set(normalizedPath, callback)
            this.logger.info(`Watching file: ${normalizedPath}`)
        } catch (err) {
            this.logger.warn(`Failed to watch file ${filePath}: ${(err as Error).message}`)
        }
    }

    unwatchFile(filePath: string): void {
        // Handle URI format paths
        let normalizedPath: string
        try {
            const uri = URI.parse(filePath)
            normalizedPath = uri.scheme === 'file' ? uri.fsPath : filePath
        } catch {
            normalizedPath = path.normalize(filePath)
        }

        const watcher = this.watchers.get(normalizedPath)
        if (watcher) {
            watcher.close()
            this.watchers.delete(normalizedPath)
            this.callbacks.delete(normalizedPath)
            this.logger.info(`Stopped watching file: ${normalizedPath}`)
        }
    }

    close(): void {
        for (const [filePath, watcher] of this.watchers) {
            watcher.close()
            this.logger.info(`Closed watcher for: ${filePath}`)
        }
        this.watchers.clear()
        this.callbacks.clear()
    }
}
