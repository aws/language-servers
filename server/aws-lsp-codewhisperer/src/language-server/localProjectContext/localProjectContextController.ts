import {
    Logging,
    QueryInlineProjectContextParams,
    QueryInlineProjectContextResult,
    QueryVectorIndexParams,
    QueryVectorIndexResult,
    WorkspaceFolder,
} from '@aws/language-server-runtimes/server-interface'
import { Features } from '../types'
import { Q_CONFIGURATION_SECTION } from '../configuration/qConfigurationServer'
import { TelemetryService } from '../telemetryService'
import type { UpdateMode, VectorLibAPI } from 'local-indexing'
import { languageByExtension } from '../languageDetection'

const fs = require('fs').promises
const path = require('path')
const LIBRARY_DIR = '/Users/breedloj/Downloads/context/qserver'

export class LocalProjectContextController {
    private readonly features: Features
    private readonly telemetryService: TelemetryService
    private readonly fileExtensions: string[]
    private readonly workspaceFolders: WorkspaceFolder[]
    private readonly clientName: string
    private _vecLib?: VectorLibAPI

    constructor(
        features: Features,
        telemetryService: TelemetryService,
        clientName: string,
        workspaceFolders: WorkspaceFolder[],
        log: Logging
    ) {
        this.features = features
        this.telemetryService = telemetryService
        this.fileExtensions = Object.keys(languageByExtension)
        this.workspaceFolders = workspaceFolders
        this.clientName = clientName
    }

    public async init(): Promise<void> {
        try {
            const vectorLib = await import(path.join(LIBRARY_DIR, 'dist', 'extension.js'))
            this._vecLib = await vectorLib.start(LIBRARY_DIR, this.clientName, 'some_path')
        } catch (error) {
            this.log('Vector library failed to initialize:' + error)
        }
        await this.updateConfiguration()
    }

    public async dispose(): Promise<void> {
        if (this._vecLib) {
            await this._vecLib?.clear?.()
            this._vecLib = undefined
        }
    }

    public async updateConfiguration(): Promise<void> {
        try {
            const qConfig = await this.features.lsp.workspace.getConfiguration(Q_CONFIGURATION_SECTION)
            if (qConfig) {
                const optOutTelemetryPreference = qConfig['optOutTelemetry'] === true ? 'OPTOUT' : 'OPTIN'
                this.telemetryService.updateOptOutPreference(optOutTelemetryPreference)
            }

            if (this._vecLib) {
                const sourceFiles = await this.processWorkspaceFolders(this.workspaceFolders)
                const rootDir = this.findCommonWorkspaceRoot(this.workspaceFolders)
                await this._vecLib?.buildIndex(sourceFiles, rootDir, 'all')
            }
        } catch (error) {
            this.log(`Error in GetConfiguration: ${error}`)
        }
    }

    public async updateIndex(filePaths: string[], operation: UpdateMode): Promise<void> {
        if (!this._vecLib) {
            return
        }

        try {
            await this._vecLib?.updateIndexV2(filePaths, operation)
        } catch (error) {
            this.log(`Error updating index: ${error}`)
        }
    }

    public async queryInlineProjectContext(
        params: QueryInlineProjectContextParams
    ): Promise<QueryInlineProjectContextResult> {
        if (!this._vecLib) {
            return { inlineProjectContext: [] }
        }

        try {
            const resp = await this._vecLib?.queryInlineProjectContext(params.query, params.filePath, params.target)
            return { inlineProjectContext: resp ?? [] }
        } catch (error) {
            this.log(`Error in queryInlineProjectContext: ${error}`)
            return { inlineProjectContext: [] }
        }
    }

    public async queryVectorIndex(params: QueryVectorIndexParams): Promise<QueryVectorIndexResult> {
        if (!this._vecLib) {
            return { chunks: [] }
        }

        try {
            const resp = await this._vecLib?.queryVectorIndex(params.query)
            return { chunks: resp ?? [] }
        } catch (error) {
            this.log(`Error in queryVectorIndex: ${error}`)
            return { chunks: [] }
        }
    }

    private async processWorkspaceFolders(workspaceFolders?: WorkspaceFolder[] | null): Promise<string[]> {
        const workspaceSourceFiles: string[] = []
        if (workspaceFolders) {
            for (const folder of workspaceFolders) {
                const folderPath = new URL(folder.uri).pathname
                this.log(`Processing workspace: ${folder.name}`)

                try {
                    const sourceFiles = await this.getCodeSourceFiles(folderPath)
                    workspaceSourceFiles.push(...sourceFiles)
                } catch (error) {
                    this.log(`Error processing ${folder.name}: ${error}`)
                }
            }
        }
        this.log(`Found ${workspaceSourceFiles.length} source files`)
        return workspaceSourceFiles
    }

    private async getCodeSourceFiles(dir: string): Promise<string[]> {
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

    private log(...messages: string[]) {
        this.features.logging.log(messages.join(' '))
    }
}
