import { Logging, WorkspaceFolder, Chat, Workspace } from '@aws/language-server-runtimes/server-interface'
import { dirname } from 'path'
import { languageByExtension } from './languageDetection'
import { homedir } from 'os'
import type {
    AdditionalContextPrompt,
    Chunk,
    ContextCommandItem,
    InlineProjectContext,
    QueryInlineProjectContextRequestV2,
    QueryRequest,
    UpdateMode,
    VectorLibAPI,
} from 'local-indexing'
import { URI } from 'vscode-uri'
import { waitUntil } from '@aws/lsp-core/out/util/timeoutUtils'

import * as fs from 'fs'
import * as path from 'path'

import * as ignore from 'ignore'
import { fdir } from 'fdir'

const LIBRARY_DIR = (() => {
    if (require.main?.filename) {
        return path.join(dirname(require.main.filename), 'indexing')
    }
    return path.join(__dirname, 'indexing')
})()

export interface SizeConstraints {
    maxFileSize: number
    remainingIndexSize: number
}

export interface LocalProjectContextInitializationOptions {
    vectorLib?: any
    ignoreFilePatterns?: string[]
    respectUserGitIgnores?: boolean
    fileExtensions?: string[]
    includeSymlinks?: boolean
    maxFileSizeMB?: number
    maxIndexSizeMB?: number
    indexCacheDirPath?: string
    enableGpuAcceleration?: boolean
    indexWorkerThreads?: number
}

export class LocalProjectContextController {
    private static instance: LocalProjectContextController | undefined

    private workspaceFolders: WorkspaceFolder[]
    private _vecLib?: VectorLibAPI
    private _contextCommandSymbolsUpdated = false
    private readonly clientName: string
    private readonly log: Logging

    private ignoreFilePatterns?: string[]
    private includeSymlinks?: boolean
    private maxFileSizeMB?: number
    private maxIndexSizeMB?: number
    private respectUserGitIgnores?: boolean
    private indexCacheDirPath: string = path.join(homedir(), '.aws', 'amazonq', 'cache')

    private readonly fileExtensions: string[] = Object.keys(languageByExtension)
    private readonly DEFAULT_MAX_INDEX_SIZE_MB = 2048
    private readonly DEFAULT_MAX_FILE_SIZE_MB = 10
    private readonly MB_TO_BYTES = 1024 * 1024

    constructor(clientName: string, workspaceFolders: WorkspaceFolder[], logging: Logging) {
        this.workspaceFolders = workspaceFolders
        this.clientName = clientName
        this.log = logging
    }

    get isEnabled(): boolean {
        return this._vecLib !== undefined && this._vecLib !== null
    }

    public static async getInstance(): Promise<LocalProjectContextController> {
        try {
            await waitUntil(async () => this.instance, {
                interval: 100,
                timeout: 600,
                truthy: true,
            })

            if (!this.instance) {
                throw new Error('LocalProjectContextController initialization timeout after 60 seconds')
            }

            return this.instance
        } catch (error) {
            // throw new Error(`Failed to get LocalProjectContextController instance: ${error}`)
            return {
                isEnabled: false,
                shouldUpdateContextCommandSymbolsOnce: () => [],
                getContextCommandItems: () => [],
            } as unknown as LocalProjectContextController
        }
    }

    public async init({
        vectorLib,
        ignoreFilePatterns = [],
        respectUserGitIgnores = true,
        includeSymlinks = false,
        maxFileSizeMB = this.DEFAULT_MAX_FILE_SIZE_MB,
        maxIndexSizeMB = this.DEFAULT_MAX_INDEX_SIZE_MB,
        indexCacheDirPath = path.join(homedir(), '.aws', 'amazonq', 'cache'),
        enableGpuAcceleration = false,
        indexWorkerThreads = 0,
    }: LocalProjectContextInitializationOptions = {}): Promise<void> {
        try {
            if (this._vecLib) {
                return
            }
            this.includeSymlinks = includeSymlinks
            this.maxFileSizeMB = maxFileSizeMB
            this.maxIndexSizeMB = maxIndexSizeMB
            this.respectUserGitIgnores = respectUserGitIgnores
            this.ignoreFilePatterns = ignoreFilePatterns
            if (indexCacheDirPath?.length > 0 && path.parse(indexCacheDirPath)) {
                this.indexCacheDirPath = indexCacheDirPath
            }

            if (enableGpuAcceleration) {
                process.env.Q_ENABLE_GPU = 'true'
            } else {
                delete process.env.Q_ENABLE_GPU
            }
            if (indexWorkerThreads && indexWorkerThreads > 0 && indexWorkerThreads < 100) {
                process.env.Q_WORKER_THREADS = indexWorkerThreads.toString()
            } else {
                delete process.env.Q_WORKER_THREADS
            }
            this.log.info(
                `Vector library initializing with GPU acceleration: ${enableGpuAcceleration}, ` +
                    `index worker thread count: ${indexWorkerThreads}`
            )

            const libraryPath = path.join(LIBRARY_DIR, 'dist', 'extension.js')
            const vecLib = vectorLib ?? (await eval(`import("${libraryPath}")`))
            if (vecLib) {
                this._vecLib = await vecLib.start(LIBRARY_DIR, this.clientName, this.indexCacheDirPath)
                void this.buildIndex()
                LocalProjectContextController.instance = this
            } else {
                this.log.warn(`Vector library could not be imported from: ${libraryPath}`)
            }
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

    // public for test
    async buildIndex(): Promise<void> {
        try {
            if (this._vecLib) {
                const sourceFiles = await this.processWorkspaceFolders(
                    this.workspaceFolders,
                    this.ignoreFilePatterns,
                    this.respectUserGitIgnores,
                    this.includeSymlinks,
                    this.fileExtensions,
                    this.maxFileSizeMB,
                    this.maxIndexSizeMB
                )
                await this._vecLib?.buildIndex(sourceFiles, this.indexCacheDirPath, 'all')
                this.log.info('Context index built successfully')
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

    public async getContextCommandItems(): Promise<ContextCommandItem[]> {
        if (!this._vecLib) {
            return []
        }

        try {
            const foldersPath = this.workspaceFolders.map(folder => URI.parse(folder.uri).fsPath)
            const resp = await this._vecLib?.getContextCommandItems(foldersPath)
            this.log.log(`received ${resp.length} context command items`)
            return resp ?? []
        } catch (error) {
            this.log.error(`Error in getContextCommandItems: ${error}`)
            return []
        }
    }

    public async shouldUpdateContextCommandSymbolsOnce(): Promise<boolean> {
        if (this._contextCommandSymbolsUpdated) {
            return false
        }
        this._contextCommandSymbolsUpdated = true
        try {
            const indexSeqNum = await this._vecLib?.getIndexSequenceNumber()
            await this.updateIndex([], 'context_command_symbol_update')
            await waitUntil(
                async () => {
                    const newIndexSeqNum = await this._vecLib?.getIndexSequenceNumber()
                    if (newIndexSeqNum && indexSeqNum && newIndexSeqNum > indexSeqNum) {
                        return true
                    }
                    return false
                },
                { interval: 1000, timeout: 60_000, truthy: true }
            )
            return true
        } catch (error) {
            this.log.error(`Error in shouldUpdateContextCommandSymbolsOnce: ${error}`)
            return false
        }
    }

    public async getContextCommandPrompt(
        contextCommandItems: ContextCommandItem[]
    ): Promise<AdditionalContextPrompt[]> {
        if (!this._vecLib) {
            return []
        }

        try {
            const resp = await this._vecLib?.getContextCommandPrompt(contextCommandItems)
            return resp ?? []
        } catch (error) {
            this.log.error(`Error in getContextCommandPrompt: ${error}`)
            return []
        }
    }

    private fileMeetsFileSizeConstraints(filePath: string, sizeConstraints: SizeConstraints): boolean {
        let fileSize

        try {
            fileSize = fs.statSync(filePath).size
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

    private async processWorkspaceFolders(
        workspaceFolders?: WorkspaceFolder[] | null,
        ignoreFilePatterns?: string[],
        respectUserGitIgnores?: boolean,
        includeSymLinks?: boolean,
        fileExtensions?: string[],
        maxFileSizeMB?: number,
        maxIndexSizeMB?: number
    ): Promise<string[]> {
        if (!workspaceFolders?.length) {
            this.log.info(`Skipping indexing: no workspace folders available`)
            return []
        }

        this.log.info(`Indexing ${workspaceFolders.length} workspace folders...`)

        const filter = ignore().add(ignoreFilePatterns ?? [])

        maxFileSizeMB = Math.min(maxFileSizeMB ?? Infinity, this.DEFAULT_MAX_FILE_SIZE_MB)
        maxIndexSizeMB = Math.min(maxIndexSizeMB ?? Infinity, this.DEFAULT_MAX_INDEX_SIZE_MB)

        const sizeConstraints: SizeConstraints = {
            maxFileSize: maxFileSizeMB * this.MB_TO_BYTES,
            remainingIndexSize: maxIndexSizeMB * this.MB_TO_BYTES,
        }

        const controller = new AbortController()

        const workspaceSourceFiles = await Promise.all(
            workspaceFolders.map(async (folder: WorkspaceFolder) => {
                const absolutePath = path.resolve(URI.parse(folder.uri).fsPath)
                const localGitIgnoreFiles: string[] = []

                const crawler = new fdir()
                    .withSymlinks({ resolvePaths: !includeSymLinks })
                    .withAbortSignal(controller.signal)
                    .exclude((dirName: string, dirPath: string) => {
                        const relativePath = path.relative(absolutePath, dirPath)
                        return relativePath.startsWith('..') || filter.ignores(relativePath)
                    })
                    .glob(...(fileExtensions?.map(ext => `**/*${ext}`) ?? []), '**/.gitignore')
                    .filter((filePath: string, isDirectory: boolean) => {
                        const relativePath = path.relative(absolutePath, filePath)

                        if (isDirectory || relativePath.startsWith('..') || filter.ignores(relativePath)) {
                            return false
                        }

                        if (!respectUserGitIgnores && sizeConstraints.remainingIndexSize <= 0) {
                            controller.abort()
                            return false
                        }

                        if (path.basename(filePath) === '.gitignore') {
                            localGitIgnoreFiles.push(filePath)
                            return false
                        }

                        return respectUserGitIgnores || this.fileMeetsFileSizeConstraints(filePath, sizeConstraints)
                    })

                return crawler
                    .crawl(absolutePath)
                    .withPromise()
                    .then(async (sourceFiles: string[]) => {
                        if (!respectUserGitIgnores) {
                            return sourceFiles
                        }

                        const userGitIgnoreFilterByFile = new Map(
                            await Promise.all(
                                localGitIgnoreFiles.map(async filePath => {
                                    const filter = ignore()
                                    try {
                                        filter.add((await fs.promises.readFile(filePath)).toString())
                                    } catch (error) {
                                        this.log.error(`Error reading .gitignore file ${filePath}: ${error}`)
                                    }
                                    return [filePath, filter] as const
                                })
                            )
                        )

                        return sourceFiles.reduce((filteredSourceFiles, filePath) => {
                            if (sizeConstraints.remainingIndexSize <= 0) {
                                return filteredSourceFiles
                            }

                            const isIgnored = [...userGitIgnoreFilterByFile].some(
                                ([gitIgnorePath, filter]: [string, any]) => {
                                    const gitIgnoreDir = path.dirname(path.resolve(gitIgnorePath))
                                    const relativePath = path.relative(gitIgnoreDir, filePath)

                                    return !relativePath.startsWith('..') && filter.ignores(relativePath)
                                }
                            )

                            if (!isIgnored && this.fileMeetsFileSizeConstraints(filePath, sizeConstraints)) {
                                filteredSourceFiles.push(filePath)
                            }

                            return filteredSourceFiles
                        }, [] as string[])
                    })
            })
        ).then((nestedFilePaths: string[][]) => nestedFilePaths.flat())

        this.log.info(`Indexing complete: found ${workspaceSourceFiles.length} files.`)
        return workspaceSourceFiles
    }

    private areWorkspaceFoldersEqual(a: WorkspaceFolder, b: WorkspaceFolder): boolean {
        return a.uri === b.uri && a.name === b.name
    }
}
