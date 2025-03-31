import {
    QueryInlineProjectContextParams,
    QueryInlineProjectContextResult,
    QueryVectorIndexParams,
    QueryVectorIndexResult,
    WorkspaceFolder,
} from '@aws/language-server-runtimes/server-interface'
import { Features } from '../types'
import { Q_CONFIGURATION_SECTION } from '../configuration/qConfigurationServer'
import { TelemetryService } from '../telemetryService'

import { start, UpdateMode, VectorLibAPI } from 'local-indexing'

import { languageByExtension } from '../languageDetection'

const fs = require('fs').promises
const path = require('path')

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
        workspaceFolders: WorkspaceFolder[]
    ) {
        this.features = features
        this.telemetryService = telemetryService
        this.fileExtensions = Object.keys(languageByExtension) // TODO: make this configurable?
        this.workspaceFolders = workspaceFolders
        this.clientName = clientName
    }

    public async init(): Promise<void> {
        const localIndexingPath = require.resolve('local-indexing')
        const modelsPath = path.join(path.dirname(localIndexingPath), 'models')
        console.log('local indexing models: ' + modelsPath)
        this._vecLib = await start(modelsPath, this.clientName, 'some_path')
        await this.updateConfiguration()
    }

    public async dispose(): Promise<void> {
        await this._vecLib?.clear?.()
        this._vecLib = undefined
    }

    public updateConfiguration = async (): Promise<void> => {
        try {
            const qConfig = await this.features.lsp.workspace.getConfiguration(Q_CONFIGURATION_SECTION)
            if (qConfig) {
                const optOutTelemetryPreference = qConfig['optOutTelemetry'] === true ? 'OPTOUT' : 'OPTIN'
                this.telemetryService.updateOptOutPreference(optOutTelemetryPreference)
            }
            const sourceFiles = await this.processWorkspaceFolders(this.workspaceFolders)
            const rootDir = this.findCommonWorkspaceRoot(this.workspaceFolders)
            await this.vecLib.buildIndex(sourceFiles, rootDir, 'all')
        } catch (error) {
            this.log(`Error in GetConfiguration: ${error}`)
        }
    }

    public async updateIndex(filePaths: string[], operation: UpdateMode): Promise<void> {
        try {
            await this.vecLib.updateIndexV2(filePaths, operation)
        } catch (error) {
            this.log(`Error updating index: ${error}`)
            throw error
        }
    }

    public async queryInlineProjectContext(
        params: QueryInlineProjectContextParams
    ): Promise<QueryInlineProjectContextResult> {
        return this.vecLib.queryInlineProjectContext(params.query, params.filePath, params.target).then(resp => ({
            inlineProjectContext: resp,
        }))
    }

    public async queryVectorIndex(params: QueryVectorIndexParams): Promise<QueryVectorIndexResult> {
        return this.vecLib.queryVectorIndex(params.query).then(resp => ({
            chunks: resp ?? [],
        }))
    }

    private async processWorkspaceFolders(workspaceFolders?: WorkspaceFolder[] | null): Promise<string[]> {
        const workspaceSourceFiles: string[] = []
        if (workspaceFolders) {
            for (const folder of workspaceFolders) {
                const folderPath = new URL(folder.uri).pathname
                this.log(`Processing workspace: ${folder.name}`)

                try {
                    const sourceFiles = await this.getCodeSourceFiles(folderPath)
                    workspaceSourceFiles.push.apply(workspaceSourceFiles, sourceFiles)
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

    private get vecLib(): VectorLibAPI {
        if (!this._vecLib) {
            throw new Error('Context library not initialized.')
        }
        return this._vecLib
    }

    private log(...messages: string[]) {
        this.features.logging.log(messages.join(' '))
    }
}
