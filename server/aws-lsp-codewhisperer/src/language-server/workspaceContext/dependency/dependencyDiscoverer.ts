import * as path from 'path'
import * as fs from 'fs'
import { Logging, Workspace, WorkspaceFolder } from '@aws/language-server-runtimes/server-interface'
import { URI } from 'vscode-uri'
import { DependencyHandlerFactory } from './dependencyHandler/LanguageDependencyHandlerFactory'
import {
    BaseDependencyInfo,
    DependencyHandlerSharedState,
    LanguageDependencyHandler,
} from './dependencyHandler/LanguageDependencyHandler'
import { ArtifactManager } from '../artifactManager'
import { supportedWorkspaceContextLanguages } from '../../../shared/languageDetection'
import { DependencyEventBundler } from './dependencyEventBundler'

export class DependencyDiscoverer {
    private logging: Logging
    private workspaceFolders: WorkspaceFolder[]
    public dependencyHandlerRegistry: LanguageDependencyHandler<BaseDependencyInfo>[] = []
    private initializedWorkspaceFolder = new Map<WorkspaceFolder, boolean>()
    private sharedState: DependencyHandlerSharedState = { isDisposed: false, dependencyUploadedSizeSum: 0 }
    private dependencyEventsIngestedFolderUris = new Set<string>()

    constructor(
        workspace: Workspace,
        logging: Logging,
        workspaceFolders: WorkspaceFolder[],
        artifactManager: ArtifactManager
    ) {
        this.workspaceFolders = workspaceFolders
        this.logging = logging

        let jstsHandlerCreated = false
        supportedWorkspaceContextLanguages.forEach(language => {
            const handler = DependencyHandlerFactory.createHandler(
                language,
                workspace,
                logging,
                workspaceFolders,
                artifactManager,
                this.sharedState
            )
            if (handler) {
                // Share handler for javascript and typescript
                if (language === 'javascript' || language === 'typescript') {
                    if (!jstsHandlerCreated) {
                        this.dependencyHandlerRegistry.push(handler)
                        jstsHandlerCreated = true
                    }
                } else {
                    this.dependencyHandlerRegistry.push(handler)
                }
            }
        })
    }

    private shouldExcludeDirectory(dir: string): boolean {
        const EXCLUDE_PATTERNS = [
            /^\./,
            /^node_modules$/,
            /^dist$/,
            /^build$/,
            /^test$/,
            /^bin$/,
            /^out$/,
            /^logs$/,
            /^env$/,
        ]

        return EXCLUDE_PATTERNS.some(pattern => pattern.test(dir))
    }

    async searchDependencies(folders: WorkspaceFolder[]): Promise<void> {
        this.logging.log('Starting dependency search across workspace folders')

        // ingest recorded dependency events to corresponding dependency maps first
        this.ingestRecordedDependencyEvents(folders)

        for (const workspaceFolder of folders) {
            if (
                this.initializedWorkspaceFolder.has(workspaceFolder) &&
                this.initializedWorkspaceFolder.get(workspaceFolder)
            ) {
                this.logging.log(`Skipping already initialized workspace folder: ${workspaceFolder.uri}`)
                continue
            }
            this.initializedWorkspaceFolder.set(workspaceFolder, true)
            const workspaceFolderPath = URI.parse(workspaceFolder.uri).path
            const queue: { dir: string; depth: number }[] = [{ dir: workspaceFolderPath, depth: 0 }]

            while (queue.length > 0) {
                const { dir: currentDir, depth } = queue.shift()!
                let foundDependencyInCurrentDir = false
                for (const dependencyHandler of this.dependencyHandlerRegistry) {
                    if (dependencyHandler.discover(currentDir, workspaceFolder)) {
                        foundDependencyInCurrentDir = true
                        this.logging.log(`Found ${dependencyHandler.language} dependency in ${currentDir}`)
                        break
                    }
                }
                // Skip the rest search in the current dir.
                if (foundDependencyInCurrentDir) {
                    continue
                }

                try {
                    // Check if currentDir is a symlink first
                    const dirStats = await fs.promises.lstat(currentDir)
                    if (dirStats.isSymbolicLink()) {
                        continue
                    }

                    // Add sub directories to queue for later processing
                    const items = fs.readdirSync(currentDir)
                    for (const item of items) {
                        const itemPath = path.join(currentDir, item)
                        const stats = await fs.promises.lstat(itemPath) // Use lstat instead of stat to detect symlinks

                        // Skip if it's a symlink
                        if (stats.isSymbolicLink()) {
                            continue
                        }

                        // Skip if it's not a directory or matches exclude patterns
                        if (!stats.isDirectory() || this.shouldExcludeDirectory(item)) {
                            continue
                        }

                        queue.push({ dir: itemPath, depth: depth + 1 })
                    }
                } catch (error: any) {
                    this.logging.warn(`Error searching dependency under directory ${currentDir}: ${error.message}`)
                }
            }
        }

        for (const dependencyHandler of this.dependencyHandlerRegistry) {
            dependencyHandler.initiateDependencyMap(folders)
            dependencyHandler.setupWatchers(folders)
            await dependencyHandler.zipDependencyMap(folders)
        }
        this.logging.log(`Dependency search completed successfully`)
    }

    async reSyncDependenciesToS3(folders: WorkspaceFolder[]) {
        this.sharedState.dependencyUploadedSizeSum = 0
        for (const dependencyHandler of this.dependencyHandlerRegistry) {
            dependencyHandler.markAllDependenciesAsUnZipped()
            await dependencyHandler.zipDependencyMap(folders)
        }
    }

    public isDependencyEventsIngested(workspaceFolderUri: string): boolean {
        return this.dependencyEventsIngestedFolderUris.has(workspaceFolderUri)
    }

    private ingestRecordedDependencyEvents(workspaceFolders: WorkspaceFolder[]): void {
        let ingestedDependencyCount = 0
        for (const workspaceFolder of workspaceFolders) {
            for (const dependencyHandler of this.dependencyHandlerRegistry) {
                try {
                    const recordedPaths = DependencyEventBundler.getRecordedDependencyPaths(
                        dependencyHandler.language,
                        workspaceFolder.uri
                    )
                    if (!recordedPaths) {
                        continue
                    }
                    dependencyHandler.updateDependencyMapBasedOnLSP(recordedPaths, workspaceFolder)
                    ingestedDependencyCount += recordedPaths.length
                } catch (error) {
                    this.logging.debug(`Error ingesting dependency events for ${workspaceFolder.uri}: ${error}`)
                }
            }
            this.dependencyEventsIngestedFolderUris.add(workspaceFolder.uri)
        }
        if (ingestedDependencyCount > 0) {
            this.logging.log(`Ingested ${ingestedDependencyCount} dependencies from didChangeDependencyPaths events`)
        }
    }

    async handleDependencyUpdateFromLSP(language: string, paths: string[], folder?: WorkspaceFolder) {
        if (folder === undefined) {
            return
        }
        for (const dependencyHandler of this.dependencyHandlerRegistry) {
            if (dependencyHandler.language != language) {
                continue
            }
            const changedDependencyList = dependencyHandler.updateDependencyMapBasedOnLSP(paths, folder)
            await dependencyHandler.zipAndUploadDependenciesByChunk(changedDependencyList, folder)
        }
    }

    public disposeAndReset(): void {
        this.dispose()
        this.sharedState.isDisposed = false
        this.sharedState.dependencyUploadedSizeSum = 0
    }

    public dispose(): void {
        this.initializedWorkspaceFolder.clear()
        this.dependencyEventsIngestedFolderUris.clear()
        this.dependencyHandlerRegistry.forEach(dependencyHandler => {
            dependencyHandler.dispose()
        })
        this.sharedState.isDisposed = true
    }

    public disposeWorkspaceFolder(workspaceFolder: WorkspaceFolder) {
        this.initializedWorkspaceFolder.delete(workspaceFolder)
        this.dependencyHandlerRegistry.forEach(dependencyHandler => {
            dependencyHandler.disposeWorkspaceFolder(workspaceFolder)
        })
    }
}
