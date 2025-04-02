import * as path from 'path'
import * as fs from 'fs'
import { Logging, Workspace, WorkspaceFolder } from '@aws/language-server-runtimes/server-interface'
import { URI } from 'vscode-uri'
import { DependencyHandlerFactory } from './dependencyHandler/LanguageDependencyHandlerFactory'
import { BaseDependencyInfo, LanguageDependencyHandler } from './dependencyHandler/LanguageDependencyHandler'
import { supportedWorkspaceContextLanguages } from '../../languageDetection'
import { ArtifactManager } from '../artifactManager'
import { WorkspaceFolderManager } from '../workspaceFolderManager'

export class DependencyDiscoverer {
    private logging: Logging
    private workspaceFolders: WorkspaceFolder[]
    private dependencyHandlerRegistry: LanguageDependencyHandler<BaseDependencyInfo>[] = []
    private initialized: boolean = false

    constructor(
        workspace: Workspace,
        logging: Logging,
        workspaceFolders: WorkspaceFolder[],
        artifactManager: ArtifactManager,
        workspaceFolderManager: WorkspaceFolderManager
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
                workspaceFolderManager
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

    async searchDependencies(): Promise<void> {
        if (this.initialized) {
            return
        }
        this.logging.log('Starting dependency search across workspace folders')
        this.initialized = true
        for (const workspaceFolder of this.workspaceFolders) {
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
                        this.logging.log(`Skipping symlink directory: ${currentDir}`)
                        continue
                    }

                    // Add sub directories to queue for later processing
                    const items = fs.readdirSync(currentDir)
                    for (const item of items) {
                        const itemPath = path.join(currentDir, item)
                        const stats = await fs.promises.lstat(itemPath) // Use lstat instead of stat to detect symlinks

                        // Skip if it's a symlink
                        if (stats.isSymbolicLink()) {
                            this.logging.log(`Skipping symlink: ${itemPath}`)
                            continue
                        }

                        // Skip if it's not a directory or matches exclude patterns
                        if (!stats.isDirectory() || this.shouldExcludeDirectory(item)) {
                            continue
                        }

                        queue.push({ dir: itemPath, depth: depth + 1 })
                    }
                } catch (error: any) {
                    this.logging.warn(`Error reading directory ${currentDir}: ${error.message}`)
                }
            }
        }

        for (const dependencyHandler of this.dependencyHandlerRegistry) {
            this.logging.log(`Initializing dependency map for ${dependencyHandler.language}`)
            dependencyHandler.initiateDependencyMap()
            dependencyHandler.setupWatchers()
            this.logging.info(`Zipping dependency map for ${dependencyHandler.language}`)
            await dependencyHandler.zipDependencyMap()
        }
        this.logging.log('Dependency search completed successfully')
    }

    cleanup(): void {
        this.dependencyHandlerRegistry.forEach(dependencyHandler => {
            dependencyHandler.dispose()
        })
    }

    async handleDependencyUpdateFromLSP(language: string, paths: string[], workspaceRoot?: WorkspaceFolder) {
        for (const dependencyHandler of this.dependencyHandlerRegistry) {
            if (dependencyHandler.language != language) {
                continue
            }
            await dependencyHandler.updateDependencyMapBasedOnLSP(paths, workspaceRoot)
        }
    }

    dispose(): void {
        this.dependencyHandlerRegistry.forEach(dependencyHandler => {
            dependencyHandler.dispose()
        })
    }
}
