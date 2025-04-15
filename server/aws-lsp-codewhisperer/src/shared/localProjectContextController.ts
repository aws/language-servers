import { WorkspaceIndexConfiguration, Logging, WorkspaceFolder } from '@aws/language-server-runtimes/server-interface'
import { dirname } from 'path'
import { languageByExtension } from './languageDetection'
import type {
    Chunk,
    InlineProjectContext,
    QueryInlineProjectContextRequestV2,
    QueryRequest,
    UpdateMode,
    VectorLibAPI,
} from 'local-indexing'
import { URI } from 'vscode-uri'

const ignore = require('ignore')
const { fdir } = require('fdir')

const fs = require('fs').promises
const path = require('path')
const LIBRARY_DIR = path.join(dirname(require.main!.filename), 'indexing')

export interface SizeConstraints {
    maxFileSize: number
    remainingIndexSize: number
}

export interface LocalProjectContextInitializationOptions {
    vectorLib?: any
    ignoreFilePatterns?: string[]
    fileExtensions?: string[]
    includeSymlinks?: boolean
    maxFileSizeMb?: number
    maxIndexSizeMb?: number
}

export class LocalProjectContextController {
    private static instance: LocalProjectContextController | undefined

    private workspaceFolders: WorkspaceFolder[]
    private _vecLib?: VectorLibAPI
    private readonly clientName: string
    private readonly log: Logging

    private readonly workspaceIndexConfiguration?: WorkspaceIndexConfiguration
    private includeSymlinks?: boolean
    private maxFileSizeMb?: number
    private maxIndexSizeMb?: number

    constructor(
        clientName: string,
        workspaceFolders: WorkspaceFolder[],
        logging: Logging,
        workspaceIndexConfiguration?: WorkspaceIndexConfiguration
    ) {
        this.workspaceFolders = workspaceFolders
        this.clientName = clientName
        this.log = logging
        this.workspaceIndexConfiguration = workspaceIndexConfiguration
    }

    public static getInstance() {
        if (!this.instance) {
            throw new Error('LocalProjectContextController not initialized')
        }
        return this.instance
    }

    public async init({
        vectorLib,
        includeSymlinks = false,
        maxFileSizeMb = 10,
        maxIndexSizeMb = 100,
    }: LocalProjectContextInitializationOptions = {}): Promise<void> {
        try {
            this.includeSymlinks = includeSymlinks
            this.maxFileSizeMb = maxFileSizeMb
            this.maxIndexSizeMb = maxIndexSizeMb

            const vecLib = vectorLib ?? (await import(path.join(LIBRARY_DIR, 'dist', 'extension.js')))
            const root = this.findCommonWorkspaceRoot(this.workspaceFolders)
            this._vecLib = await vecLib.start(LIBRARY_DIR, this.clientName, root)
            await this.buildIndex()
            LocalProjectContextController.instance = this
        } catch (error) {
            this.log.error('Vector library failed to initialize:' + error)
        }
    }

    public async dispose(): Promise<void> {
        if (this._vecLib) {
            await this._vecLib?.clear?.()
            this._vecLib = undefined
        }
    }

    public async updateIndex(filePaths: string[], operation: UpdateMode): Promise<void> {
        if (!this._vecLib) {
            return
        }

        try {
            await this._vecLib?.updateIndexV2(filePaths, operation)
        } catch (error) {
            this.log.error(`Error updating index: ${error}`)
        }
    }

    private async buildIndex(): Promise<void> {
        try {
            if (this._vecLib) {
                const sourceFiles = await this.processWorkspaceFolders(
                    this.workspaceFolders,
                    this.workspaceIndexConfiguration?.ignoreFilePatterns,
                    this.includeSymlinks,
                    this.workspaceIndexConfiguration?.fileExtensions,
                    this.maxFileSizeMb,
                    this.maxIndexSizeMb
                )
                const rootDir = this.findCommonWorkspaceRoot(this.workspaceFolders)
                await this._vecLib?.buildIndex(sourceFiles, rootDir, 'all')
            }
        } catch (error) {
            this.log.error(`Error building index: ${error}`)
        }
    }

    public async updateWorkspaceFolders(added: WorkspaceFolder[], removed: WorkspaceFolder[]): Promise<void> {
        try {
            const afterRemovals = this.workspaceFolders.filter(
                existing => !removed.some(removal => this.areWorkspaceFoldersEqual(existing, removal))
            )

            const merged = [...afterRemovals]
            for (const addition of added) {
                if (!merged.some(existing => this.areWorkspaceFoldersEqual(existing, addition))) {
                    merged.push(addition)
                }
            }
            if (this._vecLib) {
                await this.buildIndex()
            }
        } catch (error) {
            this.log.error(`Error in updateWorkspaceFolders: ${error}`)
        }
    }

    public async queryInlineProjectContext(
        request: QueryInlineProjectContextRequestV2
    ): Promise<InlineProjectContext[]> {
        if (!this._vecLib) {
            return []
        }

        try {
            const resp = await this._vecLib?.queryInlineProjectContext(request.query, request.filePath, request.target)
            return resp ?? []
        } catch (error) {
            this.log.error(`Error in queryInlineProjectContext: ${error}`)
            return []
        }
    }

    public async queryVectorIndex(request: QueryRequest): Promise<Chunk[]> {
        if (!this._vecLib) {
            return []
        }

        try {
            const resp = await this._vecLib?.queryVectorIndex(request.query)
            return resp ?? []
        } catch (error) {
            this.log.error(`Error in queryVectorIndex: ${error}`)
            return []
        }
    }

    private async fileMeetsFileSizeConstraints(filePath: string, sizeConstraints: SizeConstraints): Promise<boolean> {
        let fileSize: number

        try {
            const stats = await fs.promises.stat(filePath)
            fileSize = stats.size
        } catch (error) {
            this.log.error(`Error reading file size for ${filePath}: ${error}`)
            return false
        }

        if (fileSize > sizeConstraints.maxFileSize || fileSize > sizeConstraints.remainingIndexSize) {
            return false
        }
        sizeConstraints.remainingIndexSize -= fileSize
        return true
    }

    public async processWorkspaceFolders(
        workspaceFolders?: WorkspaceFolder[] | null,
        ignoreFilePatterns?: string[],
        includeSymLinks?: boolean,
        fileExtensions: string[] = Object.keys(languageByExtension),
        maxFileSizeMb?: number,
        maxIndexSizeMb?: number
    ): Promise<string[]> {
        if (!workspaceFolders?.length) {
            return []
        }

        const filter = ignore().add(ignoreFilePatterns ?? [])

        const sizeConstraints: SizeConstraints = {
            maxFileSize: maxFileSizeMb !== undefined ? maxFileSizeMb * 1024 * 1024 : Infinity,
            remainingIndexSize: maxIndexSizeMb !== undefined ? maxIndexSizeMb * 1024 * 1024 : Infinity,
        }
        const controller = new AbortController()
        const { signal } = controller

        const workspaceSourceFiles = await Promise.all(
            workspaceFolders.map(async (folder: WorkspaceFolder) => {
                const absolutePath = path.resolve(URI.parse(folder.uri).fsPath)

                const crawler = new fdir()
                    .withSymlinks({ resolvePaths: !includeSymLinks })
                    .exclude((dirName: string, dirPath: string) => {
                        return filter.ignores(path.relative(absolutePath, dirPath))
                    })
                    .glob(fileExtensions?.map(ext => `**/*${ext}`) ?? [])
                    .withAbortSignal(signal)
                    .filter(async (filePath: string, isDirectory: boolean) => {
                        if (sizeConstraints.remainingIndexSize <= 0) {
                            controller.abort()
                            return false
                        }

                        if (isDirectory || filter.ignores(path.relative(absolutePath, filePath))) {
                            return false
                        }

                        return (
                            (maxFileSizeMb === undefined && maxIndexSizeMb === undefined) ||
                            this.fileMeetsFileSizeConstraints(filePath, sizeConstraints)
                        )
                    })

                return await crawler.crawl(absolutePath).withPromise()
            })
        ).then(files => files.flat())

        return workspaceSourceFiles
    }

    private findCommonWorkspaceRoot(workspaceFolders: WorkspaceFolder[]): string {
        if (!workspaceFolders.length) {
            throw new Error('No workspace folders provided')
        }
        if (workspaceFolders.length === 1) {
            return new URL(workspaceFolders[0].uri).pathname
        }

        const paths = workspaceFolders.map(folder => new URL(folder.uri).pathname)
        const splitPaths = paths.map(p => p.split(path.sep).filter(Boolean))
        const minLength = Math.min(...splitPaths.map(p => p.length))

        let lastMatchingIndex = -1
        for (let i = 0; i < minLength; i++) {
            const segment = splitPaths[0][i]
            if (splitPaths.every(p => p[i] === segment)) {
                lastMatchingIndex = i
            } else {
                break
            }
        }

        if (lastMatchingIndex === -1) {
            return new URL(workspaceFolders[0].uri).pathname
        }
        return path.sep + splitPaths[0].slice(0, lastMatchingIndex + 1).join(path.sep)
    }

    private areWorkspaceFoldersEqual(a: WorkspaceFolder, b: WorkspaceFolder): boolean {
        return a.uri === b.uri && a.name === b.name
    }
}
