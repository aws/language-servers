import { Logging, Workspace, WorkspaceFolder } from '@aws/language-server-runtimes/server-interface'
import { CodewhispererLanguage } from '../../../languageDetection'
import * as fs from 'fs'
import { ArtifactManager, FileMetadata } from '../../artifactManager'
import path = require('path')
import { WorkspaceFolderManager } from '../../workspaceFolderManager'

export interface Dependency {
    name: string
    version: string
    path: string
    size: number
    zipped: boolean
}

export interface BaseDependencyInfo {
    pkgDir: string
    workspaceFolder: WorkspaceFolder
}

// Abstract base class for all language dependency handlers
export abstract class LanguageDependencyHandler<T extends BaseDependencyInfo> {
    public language: CodewhispererLanguage
    protected workspace: Workspace
    protected logging: Logging
    protected workspaceFolders: WorkspaceFolder[]
    // key: workspaceFolder, value: {key: dependency name, value: Dependency}
    protected dependencyMap = new Map<WorkspaceFolder, Map<string, Dependency>>()
    protected dependencyWatchers: Map<string, fs.FSWatcher> = new Map<string, fs.FSWatcher>()
    protected artifactManager: ArtifactManager
    protected workspaceFolderManager: WorkspaceFolderManager
    protected dependenciesFolderName: string

    constructor(
        language: CodewhispererLanguage,
        workspace: Workspace,
        logging: Logging,
        workspaceFolders: WorkspaceFolder[],
        artifactManager: ArtifactManager,
        workspaceFolderManager: WorkspaceFolderManager,
        dependenciesFolderName: string
    ) {
        this.language = language
        this.workspace = workspace
        this.logging = logging
        this.workspaceFolders = workspaceFolders
        this.artifactManager = artifactManager
        this.workspaceFolderManager = workspaceFolderManager
        this.dependenciesFolderName = dependenciesFolderName
        // For each language, the dependency handler initializes dependency map per workspaceSpace folder
        // regardless of knowing whether the workspaceFolder has the language
        // to resolve the race condition when didChangeDependencyPaths LSP and dependency discover may override the dependency map.
        this.workspaceFolders.forEach(workSpaceFolder =>
            this.dependencyMap.set(workSpaceFolder, new Map<string, Dependency>())
        )
    }

    /*
     * This function is to discover heuristics of dependency locations of programming languages.
     */
    abstract discover(currentDir: string, workspaceFolder: WorkspaceFolder): boolean

    /*
     * This function is to create dependency map of programming languages. The key is the dependency name
     */
    abstract initiateDependencyMap(): void

    /*
     * This function is to setup watchers for dependency files.
     */
    abstract setupWatchers(): void

    /**
     * Transform dependency path from LSP to dependency. Java and Python will have different logic to implement
     * @param dependencyName
     * @param dependencyPath
     * @param dependencyMap
     */
    protected abstract transformPathToDependency(
        dependencyName: string,
        dependencyPath: string,
        dependencyMap: Map<string, Dependency>
    ): void

    /**
     * Update dependency map based on didChangeDependencyPaths LSP. Javascript and Typescript will not use LSP so no need to implement this method
     * @param paths
     * @param workspaceRoot
     */
    async updateDependencyMapBasedOnLSP(paths: string[], workspaceFolder?: WorkspaceFolder): Promise<void> {
        const dependencyMap = new Map<string, Dependency>()
        paths.forEach((dependencyPath: string) => {
            // basename of the path should be the dependency name
            const dependencyName = path.basename(dependencyPath)
            this.transformPathToDependency(dependencyName, dependencyPath, dependencyMap)
        })

        if (workspaceFolder) {
            let zips: FileMetadata[] = await this.compareAndUpdateDependencyMap(workspaceFolder, dependencyMap, true)
            await this.uploadZipsAndNotifyWeboscket(zips, workspaceFolder)
        }
    }

    async zipDependencyMap(): Promise<void> {
        // Process each workspace folder sequentially
        for (const [workspaceFolder, correspondingDependencyMap] of this.dependencyMap) {
            const chunkZipFileMetadata = await this.generateFileMetadata(
                [...correspondingDependencyMap.values()],
                workspaceFolder
            )
            await this.uploadZipsAndNotifyWeboscket(chunkZipFileMetadata, workspaceFolder)
        }
    }

    private generateWebSocketRequest(workspaceFolder: WorkspaceFolder, s3Url: string) {
        let workspaceDetails = this.workspaceFolderManager.getWorkspaceDetailsByWorkspaceFolder(workspaceFolder)
        if (!workspaceDetails) {
            return
        }
        const message = JSON.stringify({
            method: 'didChangeDependencyPaths',
            params: {
                event: { paths: [] },
                workspaceChangeMetadata: {
                    workspaceId: workspaceDetails.workspaceId,
                    s3Path: s3Url,
                    programmingLanguage: this.language,
                },
            },
        })
        if (!workspaceDetails.webSocketClient) {
            this.logging.log(`Websocket client is not connected yet: ${workspaceFolder.uri}`)
            this.logging.log(`Queue Websocket request ${message} for workspace: ${workspaceFolder.uri}`)
            workspaceDetails.messageQueue?.push(message)
        } else {
            this.logging.log(`Send Websocket request ${message} for workspace: ${workspaceFolder.uri}`)
            workspaceDetails.webSocketClient.send(message)
        }
    }

    private async generateFileMetadata(
        dependencyList: Dependency[],
        workspaceFolder: WorkspaceFolder
    ): Promise<FileMetadata[]> {
        const zipFileMetadata: FileMetadata[] = []
        const MAX_CHUNK_SIZE_BYTES = 100 * 1024 * 1024 // 100MB per chunk
        // Process each workspace folder sequentially
        let chunkIndex = 0
        let currentChunkSize = 0
        let currentChunk: Dependency[] = []
        for (const dependency of dependencyList) {
            // If adding this dependency would exceed the chunk size limit,
            // process the current chunk first
            if (currentChunkSize + dependency.size > MAX_CHUNK_SIZE_BYTES && currentChunk.length > 0) {
                // Process current chunk
                this.logging.log(
                    `Under ${workspaceFolder.name}, #${chunkIndex} chunk containing ${this.language} dependencies with size: ${currentChunkSize} has reached chunk limit. Start to process...`
                )
                await this.processChunk(currentChunk, workspaceFolder, zipFileMetadata, chunkIndex)

                // Reset chunk
                currentChunk = []
                currentChunkSize = 0
                chunkIndex++

                // Add a small delay between chunks
                await new Promise(resolve => setTimeout(resolve, 100))
            }
            // Add dependency to current chunk. If the dependency has been zipped, skip it.
            if (!this.isDependencyZipped(dependency.name, workspaceFolder)) {
                currentChunk.push(dependency)
                currentChunkSize += dependency.size
                // Mark this dependency that has been zipped
                dependency.zipped = true
                this.dependencyMap.get(workspaceFolder)?.set(dependency.name, dependency)
            }

        }
        // Process any remaining dependencies in the last chunk
        if (currentChunk.length > 0) {
            await this.processChunk(currentChunk, workspaceFolder, zipFileMetadata, chunkIndex)
        }
        return zipFileMetadata
    }

    private async processChunk(
        chunk: Array<Dependency>,
        workspaceFolder: WorkspaceFolder,
        zipFileMetadata: FileMetadata[],
        chunkIndex: number
    ): Promise<void> {
        let fileMetadataList: FileMetadata[] = []
        for (const dependency of chunk) {
            try {
                if (fs.existsSync(dependency.path)) {
                    const fileMetadata = await this.artifactManager.getFileMetadata(
                        workspaceFolder,
                        dependency.path,
                        this.language,
                        path.basename(dependency.path)
                    )
                    fileMetadataList.push(...fileMetadata)
                } else {
                    this.logging.log(`Dependency jar not found: ${dependency.path}`)
                }
            } catch (error) {
                this.logging.log(`Error processing dependency ${dependency.name}: ${error}`)
            }
        }
        if (fileMetadataList.length > 0) {
            try {
                const singleZip = await this.artifactManager.createZipForDependencies(
                    workspaceFolder,
                    this.language,
                    fileMetadataList,
                    this.dependenciesFolderName,
                    chunkIndex
                )
                zipFileMetadata.push(singleZip)
                const totalChunkSize = chunk.reduce((sum, dep) => sum + dep.size, 0)
                // Log chunk statistics
                this.logging.log(
                    `Created zip: ${singleZip.filePath} for #${chunkIndex} chunk containing ${chunk.length} ${this.language} dependencies with total size: ${(
                        totalChunkSize /
                        (1024 * 1024)
                    ).toFixed(2)}MB under ${workspaceFolder.name}`
                )
            } catch (error) {
                this.logging.log(`Error creating zip for workspace ${workspaceFolder.uri}: ${error}`)
            }
        }
    }

    /*
     * This function is to generate dependency map of programming languages. The key is the dependency name
     */
    protected abstract generateDependencyMap(dependencyInfo: T, dependencyMap: Map<string, Dependency>): void

    protected async compareAndUpdateDependencyMap(
        workspaceFolder: WorkspaceFolder,
        updatedDependencyMap: Map<string, Dependency>,
        zipChanges: boolean = false
    ): Promise<FileMetadata[]> {
        const changes = {
            added: [] as Dependency[],
            updated: [] as Dependency[],
        }
        const currentDependencyMap = this.dependencyMap.get(workspaceFolder)
        // Check for added and updated dependencies
        updatedDependencyMap.forEach((newDep, name) => {
            const existingDependency = currentDependencyMap?.get(name)
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
            this.dependencyMap.get(workspaceFolder)?.set(name, newDep)
        })

        let zips: FileMetadata[] = []
        if (zipChanges) {
            zips = await this.generateFileMetadata(
                [...changes.added, ...changes.updated],
                workspaceFolder
            )
        }

        return zips
    }

    protected log(message: string): void {
        this.logging.log(message)
    }

    dispose(): void {
        this.dependencyWatchers.forEach(watcher => watcher.close())
        this.dependencyWatchers.clear()
    }

    // For synchronous version if needed:
    protected getDirectorySize(directoryPath: string): number {
        let totalSize = 0
        try {
            const files = fs.readdirSync(directoryPath)

            for (const file of files) {
                const filePath = path.join(directoryPath, file)
                const stats = fs.statSync(filePath)

                if (stats.isDirectory()) {
                    totalSize += this.getDirectorySize(filePath)
                } else {
                    totalSize += stats.size
                }
            }

            return totalSize
        } catch (error) {
            throw new Error(`Error calculating directory size: ${error}`)
        }
    }

    private async cleanupZipFiles(zipFileMetadata: FileMetadata[]): Promise<void> {
        for (const zip of zipFileMetadata) {
            try {
                if (fs.existsSync(zip.filePath)) {
                    fs.unlinkSync(zip.filePath)
                    this.logging.log(`Cleanup zip file: ${zip.filePath}`)
                }
            } catch (error) {
                // Log error but don't throw to ensure other files are processed
                this.logging.log(`Error deleting zip file ${zip.filePath}: ${error}`)
            }
        }
    }

    protected async uploadZipsAndNotifyWeboscket(zips: FileMetadata[], workspaceFolder: WorkspaceFolder): Promise<void> {
        const workspaceStateCheck = setInterval(async () => {
            const workspaceId = this.workspaceFolderManager.getWorkspaceId(workspaceFolder)
            if (workspaceId) {
                clearInterval(workspaceStateCheck)

                // Upload zip and notify websocket
                try {
                    for (const zip of zips) {
                        let s3Url = await this.workspaceFolderManager.uploadToS3(zip)
                        if (!s3Url) {
                            return
                        }
                        this.logging.log(`Uploaded dependency zip: ${zip.filePath}`)
                        const cleanUrl = new URL(s3Url).origin + new URL(s3Url).pathname
                        this.generateWebSocketRequest(zip.workspaceFolder, cleanUrl)
                    }
                } finally {
                    // Clean up zip files after processing
                    await this.cleanupZipFiles(zips)
                }
            } else {
                this.logging.log(`Workspace Id is not ready for ${workspaceFolder.uri}. Waiting to upload dependencies...`)
            }
        }, 5000)
    }

    protected isDependencyZipped(dependencyName: string, workspaceFolder: WorkspaceFolder): boolean | undefined {
        return this.dependencyMap.get(workspaceFolder)?.get(dependencyName)?.zipped
    }
}
