import * as path from 'path'
import * as fs from 'fs'
import { Logging, Workspace, WorkspaceFolder } from '@aws/language-server-runtimes/server-interface'
import { URI } from 'vscode-uri'
import { DependencyHandlerFactory } from './dependencyHandler/LanguageDependencyHandlerFactory'
import { BaseDependencyInfo, LanguageDependencyHandler } from './dependencyHandler/LanguageDependencyHandler'
import { ArtifactManager } from '../artifactManager'
import { supportedWorkspaceContextLanguages } from '../../../shared/languageDetection'

export class DependencyDiscoverer {
    private logging: Logging
    private workspaceFolders: WorkspaceFolder[]
    public dependencyHandlerRegistry: LanguageDependencyHandler<BaseDependencyInfo>[] = []
    private initializedWorkspaceFolder = new Map<WorkspaceFolder, boolean>()
    // Create a SharedArrayBuffer with 4 bytes (for a 32-bit unsigned integer) for thread-safe counter
    protected dependencyUploadedSizeSum = new Uint32Array(new SharedArrayBuffer(4))

    constructor(
        workspace: Workspace,
        logging: Logging,
        workspaceFolders: WorkspaceFolder[],
        artifactManager: ArtifactManager
    ) {
        this.workspaceFolders = workspaceFolders
        this.logging = logging
        this.dependencyUploadedSizeSum[0] = 0

        let jstsHandlerCreated = false
        supportedWorkspaceContextLanguages.forEach(language => {
            const handler = DependencyHandlerFactory.createHandler(
                language,
                workspace,
                logging,
                workspaceFolders,
                artifactManager,
                this.dependencyUploadedSizeSum
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
        Atomics.store(this.dependencyUploadedSizeSum, 0, 0)
        for (const dependencyHandler of this.dependencyHandlerRegistry) {
            await dependencyHandler.zipDependencyMap(folders)
        }
    }

    async handleDependencyUpdateFromLSP(language: string, paths: string[], workspaceRoot?: WorkspaceFolder) {
        for (const dependencyHandler of this.dependencyHandlerRegistry) {
            if (dependencyHandler.language != language) {
                continue
            }
            await dependencyHandler.updateDependencyMapBasedOnLSP(paths, workspaceRoot)
        }
    }

    public dispose(): void {
        this.initializedWorkspaceFolder.clear()
        this.dependencyHandlerRegistry.forEach(dependencyHandler => {
            dependencyHandler.dispose()
        })
        Atomics.store(this.dependencyUploadedSizeSum, 0, 0)
    }

    public disposeWorkspaceFolder(workspaceFolder: WorkspaceFolder) {
        this.initializedWorkspaceFolder.delete(workspaceFolder)
        this.dependencyHandlerRegistry.forEach(dependencyHandler => {
            dependencyHandler.disposeWorkspaceFolder(workspaceFolder)
        })
    }
}
