import { WorkspaceIndexConfiguration, Logging, WorkspaceFolder } from '@aws/language-server-runtimes/server-interface'
import { dirname } from 'path'
import { languageByExtension } from './languageDetection'
import { homedir } from 'os'
import type {
    Chunk,
    InlineProjectContext,
    QueryInlineProjectContextRequestV2,
    QueryRequest,
    UpdateMode,
    VectorLibAPI,
} from 'local-indexing'
import { URI } from 'vscode-uri'

import * as fs from 'fs'
import * as path from 'path'

import * as ignore from 'ignore'
import { fdir } from 'fdir'

const LIBRARY_DIR = (() => {
    if (require.main) {
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
}

export class LocalProjectContextController {
    private static instance: LocalProjectContextController | undefined

    private workspaceFolders: WorkspaceFolder[]
    private _vecLib?: VectorLibAPI
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

    public static getInstance() {
        if (!this.instance) {
            throw new Error('LocalProjectContextController not initialized')
        }
        return this.instance
    }

    public async init({
        vectorLib,
        ignoreFilePatterns = [],
        respectUserGitIgnores = true,
        includeSymlinks = false,
        maxFileSizeMB = this.DEFAULT_MAX_FILE_SIZE_MB,
        maxIndexSizeMB = this.DEFAULT_MAX_INDEX_SIZE_MB,
        indexCacheDirPath = path.join(homedir(), '.aws', 'amazonq', 'cache'),
    }: LocalProjectContextInitializationOptions = {}): Promise<void> {
        try {
            this.includeSymlinks = includeSymlinks
            this.maxFileSizeMB = maxFileSizeMB
            this.maxIndexSizeMB = maxIndexSizeMB
            this.respectUserGitIgnores = respectUserGitIgnores
            this.ignoreFilePatterns = ignoreFilePatterns
            if (indexCacheDirPath?.length > 0 && path.parse(indexCacheDirPath)) {
                this.indexCacheDirPath = indexCacheDirPath
            }
            const libraryPath = path.join(LIBRARY_DIR, 'dist', 'extension.js')
            const vecLib = vectorLib ?? (await import(libraryPath))
            if (vecLib) {
                this._vecLib = await vecLib.start(LIBRARY_DIR, this.clientName, this.indexCacheDirPath)
                await this.buildIndex()
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

    private async buildIndex(): Promise<void> {
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
                        return filter.ignores(path.relative(absolutePath, dirPath))
                    })
                    .glob(...(fileExtensions?.map(ext => `**/*${ext}`) ?? []), '**/.gitignore')
                    .filter((filePath: string, isDirectory: boolean) => {
                        if (isDirectory || filter.ignores(path.relative(absolutePath, filePath))) {
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
