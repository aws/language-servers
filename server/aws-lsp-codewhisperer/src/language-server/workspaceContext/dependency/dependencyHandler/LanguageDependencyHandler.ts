import { Logging, Workspace, WorkspaceFolder } from '@aws/language-server-runtimes/server-interface'
import { CodewhispererLanguage } from '../../../languageDetection'
import * as fs from 'fs'

export interface Dependency {
    name: string
    version: string
    path: string
}

export interface BaseDependencyInfo {
    pkgDir: string
}

// Abstract base class for all language dependency handlers
export abstract class LanguageDependencyHandler<T extends BaseDependencyInfo> {
    public language: CodewhispererLanguage
    protected workspace: Workspace
    protected logging: Logging
    protected workspaceFolders: WorkspaceFolder[]
    protected dependencyMap = new Map<string, Dependency>()
    protected dependencyWatchers: Map<string, fs.FSWatcher> = new Map<string, fs.FSWatcher>()

    constructor(
        language: CodewhispererLanguage,
        workspace: Workspace,
        logging: Logging,
        workspaceFolders: WorkspaceFolder[]
    ) {
        this.language = language
        this.workspace = workspace
        this.logging = logging
        this.workspaceFolders = workspaceFolders
    }

    /*
     * This function is to discover heuristics of dependency locations of programming languages.
     */
    abstract discover(currentDir: string): boolean

    /*
     * This function is to create dependency map of programming languages. The key is the dependency name
     */
    abstract createDependencyMap(): void

    /*
     * This function is to setup watchers for dependency files.
     */
    abstract setupWatchers(): void

    /*
     * This function is to generate dependency map of programming languages. The key is the dependency name
     */
    protected abstract generateDependencyMap(dependencyInfo: T, dependencyMap: Map<string, Dependency>): void

    protected compareAndUpdateDependencies(updatedDependencyMap: Map<string, Dependency>): void {
        const changes = {
            added: [] as Dependency[],
            updated: [] as Dependency[],
        }

        // Check for added and updated dependencies
        updatedDependencyMap.forEach((newDep, name) => {
            const existingDependency = this.dependencyMap.get(name)
            if (!existingDependency) {
                changes.added.push(newDep)
            } else if (existingDependency.version !== newDep.version) {
                changes.updated.push(newDep)
            }
        })

        // log all added and updated changes
        if (changes.added.length > 0) {
            this.logging.log(`Added dependencies: ${changes.added.map(dep => `${dep.name}@${dep.version}`).join(', ')}`)
        }
        if (changes.updated.length > 0) {
            this.logging.log(
                `Updated dependencies: ${changes.updated.map(dep => `${dep.name}@${dep.version}`).join(', ')}`
            )
        }

        // Update the dependency map
        updatedDependencyMap.forEach((newDep, name) => {
            this.dependencyMap.set(name, newDep)
        })
    }

    protected log(message: string): void {
        this.logging.log(message)
    }

    dispose(): void {
        this.dependencyWatchers.forEach(watcher => watcher.close())
        this.dependencyWatchers.clear()
    }
}
