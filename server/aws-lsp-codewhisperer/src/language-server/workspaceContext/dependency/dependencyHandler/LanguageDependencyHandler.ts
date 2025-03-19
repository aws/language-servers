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

    async zipDependencyMap(): Promise<void> {
        const zipFileMetadata: FileMetadata[] = []
        const MAX_CHUNK_SIZE_BYTES = 100 * 1024 * 1024 // 100MB per chunk

        let chunkIndex = 0
        // Process each workspace folder sequentially
        for (const [workspaceFolder, correspondingDependencyMap] of this.dependencyMap) {
            const chunkZipFileMetadata = await this.generateFileMetadata(
                [...correspondingDependencyMap.values()],
                workspaceFolder
            )
            zipFileMetadata.push(...chunkZipFileMetadata)
        }

        for (const zip of zipFileMetadata) {
            let s3Url = await this.workspaceFolderManager.uploadToS3(zip)
            if (!s3Url) {
                return
            }
            this.generateWebSocketRequest(zip.workspaceFolder, s3Url)
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
            workspaceDetails.messageQueue?.push(message)
        } else {
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
                this.logging.log(`${chunkIndex} chunk's currentChunkSize: ${currentChunkSize}`)
                await this.processChunk(currentChunk, workspaceFolder, zipFileMetadata, chunkIndex)

                // Reset chunk
                currentChunk = []
                currentChunkSize = 0
                chunkIndex++

                // Add a small delay between chunks
                await new Promise(resolve => setTimeout(resolve, 100))
            }
            // Add dependency to current chunk
            currentChunk.push(dependency)
            currentChunkSize += dependency.size
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
        this.logging.log(
            `Processing ${chunkIndex} chunk of ${chunk.length} ${this.language} dependencies for ${workspaceFolder.name}`
        )
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
            this.logging.log(
                `Start to zip ${chunkIndex} chunk of ${chunk.length} ${this.language} dependencies for ${workspaceFolder.name}`
            )
            try {
                const singleZip = await this.artifactManager.createZipForDependencies(
                    workspaceFolder,
                    this.language,
                    fileMetadataList,
                    this.dependenciesFolderName,
                    chunkIndex
                )
                zipFileMetadata.push(singleZip)
                this.logging.log(`Created zip: ${singleZip.filePath}`)
            } catch (error) {
                this.logging.log(`Error creating zip for workspace ${workspaceFolder.uri}: ${error}`)
            }
        }
        // Log chunk statistics
        const totalChunkSize = chunk.reduce((sum, dep) => sum + dep.size, 0)
        this.logging.log(
            `Processed chunk of ${chunk.length} ${this.language} dependencies with total size: ${(
                totalChunkSize /
                (1024 * 1024)
            ).toFixed(2)}MB for ${workspaceFolder.name}`
        )
    }

    /*
     * This function is to generate dependency map of programming languages. The key is the dependency name
     */
    protected abstract generateDependencyMap(dependencyInfo: T, dependencyMap: Map<string, Dependency>): void

    protected async compareAndUpdateDependencies(
        dependencyInfo: T,
        updatedDependencyMap: Map<string, Dependency>
    ): Promise<void> {
        const changes = {
            added: [] as Dependency[],
            updated: [] as Dependency[],
        }
        const currentDependencyMap = this.dependencyMap.get(dependencyInfo.workspaceFolder)
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
            this.dependencyMap.get(dependencyInfo.workspaceFolder)?.set(name, newDep)
        })

        let zips: FileMetadata[] = await this.generateFileMetadata(
            [...changes.added, ...changes.updated],
            dependencyInfo.workspaceFolder
        )
        for (const zip of zips) {
            let s3Url = await this.workspaceFolderManager.uploadToS3(zip)
            if (!s3Url) {
                return
            }
            this.generateWebSocketRequest(zip.workspaceFolder, s3Url)
        }
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
}
