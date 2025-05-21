import { Logging } from '@aws/language-server-runtimes/server-interface'
import * as fs from 'fs'

export class DependencyWatcher {
    private eventQueue = new Set<string>()
    private processingTimeout: NodeJS.Timeout | null = null
    private isProcessing = false
    private watcher: fs.FSWatcher

    constructor(
        private readonly path: string,
        private readonly callbackFunction: (events: string[]) => void,
        private readonly logging: Logging,
        private readonly interval: number = 1000
    ) {
        this.watcher = this.setupWatcher()
    }

    private setupWatcher(): fs.FSWatcher {
        try {
            const watcher = fs.watch(this.path, { recursive: false }, async (eventType, fileName) => {
                if (!fileName) return
                if (eventType === 'rename' || eventType === 'change') {
                    this.eventQueue.add(fileName)
                    if (this.processingTimeout) {
                        clearTimeout(this.processingTimeout)
                    }
                    this.processingTimeout = setTimeout(() => {
                        this.processEvents().catch(error => {
                            this.logging.warn(`Error processing events: ${error}`)
                        })
                    }, this.interval)
                }
            })
            watcher.on('error', error => {
                this.logging.warn(`watcher error for ${this.path}: ${error}`)
            })
            return watcher
        } catch (error) {
            this.logging.warn(`Error setting up watcher for ${this.path}: ${error}`)
            throw error
        }
    }

    private async processEvents(): Promise<void> {
        if (this.isProcessing) return
        this.isProcessing = true
        const events = Array.from(this.eventQueue)
        this.eventQueue.clear()
        try {
            this.callbackFunction(events)
        } catch (error) {
            this.logging.warn(`Error processing bundled events: ${error}`)
        } finally {
            this.isProcessing = false
        }
    }

    getWatcher(): fs.FSWatcher {
        return this.watcher
    }

    dispose(): void {
        if (this.processingTimeout) {
            clearTimeout(this.processingTimeout)
        }
        this.watcher.close()
    }
}
