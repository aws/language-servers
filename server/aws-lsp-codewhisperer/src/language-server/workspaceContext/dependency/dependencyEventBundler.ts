import { Logging } from '@aws/language-server-runtimes/server-interface'
import { DependencyDiscoverer } from './dependencyDiscoverer'
import { WorkspaceFolderManager } from '../workspaceFolderManager'

export interface DependencyEvent {
    language: string
    paths: string[]
    workspaceFolderUri: string
}

export class DependencyEventBundler {
    // Map storing historically received dependency events from extension
    // Key is <language>-<workspaceFolderUri> and value is a set of paths
    private static readonly recordedDependencies = new Map<string, Set<string>>()

    private readonly logging: Logging
    private readonly dependencyDiscoverer: DependencyDiscoverer
    private readonly workspaceFolderManager: WorkspaceFolderManager
    private readonly BUNDLER_PROCESS_INTERVAL: number = 500 // 500 milliseconds
    private eventSendingQueue: DependencyEvent[] = []
    private eventBundlerInterval: NodeJS.Timeout | undefined
    private isBundlerWorking: boolean = false

    constructor(
        logging: Logging,
        dependencyDiscoverer: DependencyDiscoverer,
        workspaceFolderManager: WorkspaceFolderManager
    ) {
        this.logging = logging
        this.dependencyDiscoverer = dependencyDiscoverer
        this.workspaceFolderManager = workspaceFolderManager
    }

    /**
     * Starts the dependency event bundler that processes the eventQueue every 500ms.
     * Skips execution if previous work hasn't finished to prevent concurrent processing.
     * Groups events by language and workspaceFolder, then processes them as batches.
     */
    public startDependencyEventBundler() {
        this.eventBundlerInterval = setInterval(async () => {
            if (this.isBundlerWorking) {
                return
            }
            this.isBundlerWorking = true
            try {
                const allEvents = this.eventSendingQueue.splice(0)

                // Form bundles based on unique combination of language and workspaceFolder
                const dependencyEventBundles = allEvents.reduce((accumulator, event) => {
                    const key = DependencyEventBundler.getBundleKey(event.language, event.workspaceFolderUri)
                    if (!accumulator.has(key)) {
                        accumulator.set(key, [])
                    }
                    accumulator.get(key)?.push(event)
                    return accumulator
                }, new Map<string, DependencyEvent[]>())

                // Process bundles one by one, concatenating all the paths within the bundle
                for (const [bundleKey, bundledEvents] of dependencyEventBundles) {
                    const { language, workspaceFolderUri } = bundledEvents[0]
                    const workspaceFolder = this.workspaceFolderManager.getWorkspaceFolder(workspaceFolderUri)
                    await this.dependencyDiscoverer.handleDependencyUpdateFromLSP(
                        language,
                        bundledEvents.flatMap(event => event.paths),
                        workspaceFolder
                    )
                }
            } catch (err) {
                this.logging.error(`Error bundling didChangeDependencyPaths event: ${err}`)
            } finally {
                this.isBundlerWorking = false
            }
        }, this.BUNDLER_PROCESS_INTERVAL)
    }

    public sendDependencyEvent(event: DependencyEvent) {
        this.eventSendingQueue.push(event)
    }

    public dispose(): void {
        if (this.eventBundlerInterval) {
            clearInterval(this.eventBundlerInterval)
        }
        this.eventSendingQueue = []
    }

    private static getBundleKey(language: string, workspaceFolderUri: string) {
        return `${language}-${workspaceFolderUri}`
    }

    public static recordDependencyEvent(event: DependencyEvent): void {
        const key = this.getBundleKey(event.language, event.workspaceFolderUri)
        if (!this.recordedDependencies.has(key)) {
            this.recordedDependencies.set(key, new Set())
        }
        const receivedPaths = this.recordedDependencies.get(key)
        if (receivedPaths) {
            event.paths.forEach(path => {
                receivedPaths.add(path)
            })
        }
    }

    public static getRecordedDependencyPaths(language: string, workspaceFolderUri: string): string[] | undefined {
        const key = this.getBundleKey(language, workspaceFolderUri)
        const receivedPaths = this.recordedDependencies.get(key)
        if (receivedPaths) {
            return Array.from(receivedPaths)
        }
    }
}
