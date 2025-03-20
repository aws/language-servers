import * as path from 'path'
import * as fs from 'fs'
import { Logging, Workspace, WorkspaceFolder } from '@aws/language-server-runtimes/server-interface'
import { URI } from 'vscode-uri'
import * as xml2js from 'xml2js'
import { DependencyHandlerFactory } from './dependencyHandler/LanguageDependencyHandlerFactory'
import {
    BaseDependencyInfo,
    Dependency,
    LanguageDependencyHandler,
} from './dependencyHandler/LanguageDependencyHandler'
import { supportedWorkspaceContextLanguages } from '../../languageDetection'
import { ArtifactManager, FileMetadata } from '../artifactManager'
import { WorkspaceFolderManager } from '../workspaceFolderManager'

const excludePatterns = [/^\./, /^node_modules$/, /^dist$/, /^build$/, /^test$/, /^bin$/, /^out$/, /^logs$/, /^env$/]

export class DependencyDiscoverer {
    private workspace: Workspace
    private logging: Logging
    private workspaceFolders: WorkspaceFolder[]
    private artifactManager: ArtifactManager
    private workspaceFolderManager: WorkspaceFolderManager
    private dependencyHandlerRegistry: LanguageDependencyHandler<BaseDependencyInfo>[] = []
    private initialized: boolean = false

    constructor(
        workspace: Workspace,
        logging: Logging,
        workspaceFolders: WorkspaceFolder[],
        artifactManager: ArtifactManager,
        workspaceFolderManager: WorkspaceFolderManager
    ) {
        this.workspace = workspace
        this.workspaceFolders = workspaceFolders
        this.logging = logging
        this.artifactManager = artifactManager
        this.workspaceFolderManager = workspaceFolderManager

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
        //TODO delete
        this.logging.log(`${this.dependencyHandlerRegistry.length} handlers`)
    }

    private shouldExcludeDirectory(dir: string): boolean {
        return excludePatterns.some(pattern => pattern.test(dir))
    }

    async createDependencyArtifacts(): Promise<void> {}

    // find dependencies
    // create dependency map
    // zip dependency
    // translate to LSP
    // setup watcher
    // Map comparison
    // zip depdnency
    // translate to LSP

    private async zipDependency(dependency: Dependency): Promise<void> {
        const { exec } = require('child_process')
        const zipPath = path.join(path.dirname(dependency.path), `${dependency.name}-${dependency.version}.zip`)

        return new Promise((resolve, reject) => {
            exec(
                `cd "${path.dirname(dependency.path)}" && zip -r "${zipPath}" "${path.basename(dependency.path)}"`,
                (error: any) => {
                    if (error) {
                        this.logging.log(`Error zipping ${dependency.name}: ${error}`)
                        reject(error)
                    } else {
                        this.logging.log(`Successfully zipped ${dependency.name} to ${zipPath}`)
                        resolve()
                    }
                }
            )
        })
    }

    async searchDependencies(): Promise<void> {
        if (this.initialized) {
            return
        }
        this.initialized = true
        this.logging.log(`number of workspace folders: ${this.workspaceFolders.length}`)
        this.logging.log(`The workspace path: ${this.workspace}`)
        for (const workspaceFolder of this.workspaceFolders) {
            const workspaceFolderPath = URI.parse(workspaceFolder.uri).path
            this.logging.log(`Start to search dependencies under: ${workspaceFolderPath}`)
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
                    // Add sub directories to queue for later processing
                    const items = fs.readdirSync(currentDir)
                    for (const item of items) {
                        const itemPath = path.join(currentDir, item)
                        // Skip node_modules and hidden directories
                        if (!fs.statSync(itemPath).isDirectory() || this.shouldExcludeDirectory(item)) {
                            continue
                        }
                        queue.push({ dir: itemPath, depth: depth + 1 })
                    }
                } catch (error: any) {
                    this.logging.warn(`Error reading directory ${currentDir}: ${error.message}`)
                }
            }
        }

        this.dependencyHandlerRegistry.forEach(async dependencyHandler => {
            dependencyHandler.initiateDependencyMap()
            dependencyHandler.setupWatchers()
            await dependencyHandler.zipDependencyMap()
        })
    }

    private log(...messages: string[]) {
        this.logging.log(messages.join(' '))
    }
}
