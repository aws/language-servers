import { Logging, WorkspaceFolder } from '@aws/language-server-runtimes/server-interface'
import { DependencyDiscoverer } from './dependencyDiscoverer'

export interface DependencyEvent {
    language: string
    paths: string[]
    workspaceFolder: WorkspaceFolder | undefined
}

export class DependencyEventBundler {
    private readonly logging: Logging
    private readonly dependencyDiscoverer: DependencyDiscoverer
    private readonly BUNDLER_PROCESS_INTERVAL: number = 500 // 500 milliseconds
    public eventQueue: DependencyEvent[] = []
    private eventBundlerInterval: NodeJS.Timeout | undefined
    private isBundlerWorking: boolean = false

    constructor(logging: Logging, dependencyDiscoverer: DependencyDiscoverer) {
        this.logging = logging
        this.dependencyDiscoverer = dependencyDiscoverer
    }

    /**
     * Start the bundler process
     * Bundler process will process all the events in the queue every 500ms
     * and concatenate all the paths within the same language and workspaceFolder
     */
    public startDependencyEventBundler() {
        this.eventBundlerInterval = setInterval(async () => {
            if (this.isBundlerWorking) {
                return
            }
            this.isBundlerWorking = true
            try {
                const allEvents = this.eventQueue.splice(0)

                // Form bundles based on unique combination of language and workspaceFolder
                const dependencyEventBundles = allEvents.reduce((accumulator, event) => {
                    const key = this.getBundleKey(event)
                    if (!accumulator.has(key)) {
                        accumulator.set(key, [])
                    }
                    accumulator.get(key)?.push(event)
                    return accumulator
                }, new Map<string, DependencyEvent[]>())

                // Process bundles one by one, concatenating all the paths within the bundle
                for (const [bundleKey, bundledEvents] of dependencyEventBundles) {
                    await this.dependencyDiscoverer.handleDependencyUpdateFromLSP(
                        bundledEvents[0].language,
                        bundledEvents.flatMap(event => event.paths),
                        bundledEvents[0].workspaceFolder
                    )
                }
            } catch (err) {
                this.logging.error(`Error bundling didChangeDependencyPaths event: ${err}`)
            } finally {
                this.isBundlerWorking = false
            }
        }, this.BUNDLER_PROCESS_INTERVAL)
    }

    private getBundleKey(event: DependencyEvent) {
        if (event.workspaceFolder === undefined) {
            return `${event.language}-undefined`
        }
        return `${event.language}-${event.workspaceFolder.uri}`
    }

    public dispose(): void {
        if (this.eventBundlerInterval) {
            clearInterval(this.eventBundlerInterval)
        }
    }
}
