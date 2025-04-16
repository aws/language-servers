import { Logging, WorkspaceFolder } from '@aws/language-server-runtimes/server-interface'
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

const fs = require('fs').promises
const path = require('path')
const LIBRARY_DIR = (() => {
    if (require.main) {
        return path.join(dirname(require.main.filename), 'indexing')
    }
    return path.join(__dirname, 'indexing')
})()

export class LocalProjectContextController {
    private static instance: LocalProjectContextController | undefined

    private workspaceFolders: WorkspaceFolder[]
    private _vecLib?: VectorLibAPI
    private readonly fileExtensions: string[]
    private readonly clientName: string
    private readonly log: Logging

    constructor(clientName: string, workspaceFolders: WorkspaceFolder[], logging: Logging) {
        this.fileExtensions = Object.keys(languageByExtension)
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

    public async init(vectorLib?: any): Promise<void> {
        try {
            const vecLib = vectorLib ?? (await import(path.join(LIBRARY_DIR, 'dist', 'extension.js')))
            if (vecLib) {
                const root = this.findCommonWorkspaceRoot(this.workspaceFolders)
                this._vecLib = await vecLib.start(LIBRARY_DIR, this.clientName, root)
                await this.buildIndex()
                LocalProjectContextController.instance = this
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
                const sourceFiles = await this.processWorkspaceFolders(this.workspaceFolders)
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

    private async processWorkspaceFolders(workspaceFolders?: WorkspaceFolder[] | null): Promise<string[]> {
        const workspaceSourceFiles: string[] = []
        if (workspaceFolders) {
            for (const folder of workspaceFolders) {
                const folderPath = URI.parse(folder.uri).fsPath
                this.log.info(`Processing workspace: ${folder.name}`)

                try {
                    const sourceFiles = await this.getCodeSourceFiles(folderPath)
                    workspaceSourceFiles.push(...sourceFiles)
                } catch (error) {
                    this.log.error(`Error processing ${folder.name}: ${error}`)
                }
            }
        }
        this.log.info(`Found ${workspaceSourceFiles.length} source files`)
        return workspaceSourceFiles
    }

    private async getCodeSourceFiles(dir: string): Promise<string[]> {
        try {
            const files = await fs.readdir(dir, { withFileTypes: true })
            const sourceFiles: string[] = []

            for (const file of files) {
                const filePath = path.join(dir, file.name)
                if (file.isDirectory()) {
                    sourceFiles.push(...(await this.getCodeSourceFiles(filePath)))
                } else if (this.fileExtensions.includes(path.extname(file.name).toLowerCase())) {
                    sourceFiles.push(filePath)
                }
            }
            return sourceFiles
        } catch (error) {
            this.log.error(`Error reading directory ${dir}: ${error}`)
            return []
        }
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
