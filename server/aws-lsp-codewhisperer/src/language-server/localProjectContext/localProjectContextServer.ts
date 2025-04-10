import { InitializeParams, Server, TextDocumentSyncKind } from '@aws/language-server-runtimes/server-interface'
import { AmazonQTokenServiceManager } from '../../shared/amazonQServiceManager/AmazonQTokenServiceManager'
import { TelemetryService } from '../../shared/telemetry/telemetryService'
import { LocalProjectContextController } from './localProjectContextController'
import { languageByExtension } from '../../shared/languageDetection'

export const LocalProjectContextServer = (): Server => features => {
    const { credentialsProvider, telemetry, logging, lsp } = features

    let localProjectContextController: LocalProjectContextController
    let amazonQServiceManager: AmazonQTokenServiceManager
    let telemetryService: TelemetryService

    lsp.addInitializer((params: InitializeParams) => {
        if (!params.workspaceFolders) {
            throw new Error('Workspace folders are required')
        }

        amazonQServiceManager = AmazonQTokenServiceManager.getInstance(features)
        telemetryService = new TelemetryService(amazonQServiceManager, credentialsProvider, telemetry, logging)

        localProjectContextController = new LocalProjectContextController(
            params.clientInfo?.name ?? 'unknown',
            params.workspaceFolders ?? [],
            logging
        )

        const supportedFilePatterns = Object.keys(languageByExtension).map(ext => `**/*${ext}`)

        return {
            capabilities: {
                textDocumentSync: {
                    openClose: true,
                    change: TextDocumentSyncKind.Incremental,
                },
                workspace: {
                    workspaceFolders: {
                        supported: true,
                        changeNotifications: true,
                    },
                    fileOperations: {
                        didCreate: {
                            filters: [
                                { pattern: { glob: '{' + supportedFilePatterns.join(',') + '}', matches: 'file' } },
                            ],
                        },
                        didRename: {
                            filters: [
                                { pattern: { glob: '{' + supportedFilePatterns.join(',') + '}', matches: 'file' } },
                            ],
                        },
                        didDelete: {
                            filters: [
                                { pattern: { glob: '{' + supportedFilePatterns.join(',') + '}', matches: 'file' } },
                            ],
                        },
                    },
                },
            },
        }
    })

    lsp.onInitialized(async () => {
        try {
            await localProjectContextController.init()
            logging.log('Local context server has been initialized')
        } catch (error) {
            logging.error(`Failed to initialize local context server: ${error}`)
        }
    })

    lsp.workspace.onDidChangeWorkspaceFolders(async event => {
        try {
            await localProjectContextController.updateWorkspaceFolders(event.event.added, event.event.removed)
        } catch (error) {
            logging.error(`Error handling workspace folder change: ${error}`)
        }
    })

    lsp.onDidSaveTextDocument(async event => {
        try {
            const filePaths = [event.textDocument.uri.replace('file:', '')]
            await localProjectContextController.updateIndex(filePaths, 'update')
        } catch (error) {
            logging.error(`Error handling save event: ${error}`)
        }
    })

    lsp.workspace.onDidCreateFiles(async event => {
        try {
            const filePaths = event.files.map(file => file.uri.replace('file:', ''))
            await localProjectContextController.updateIndex(filePaths, 'add')
        } catch (error) {
            logging.error(`Error handling create event: ${error}`)
        }
    })

    lsp.workspace.onDidDeleteFiles(async event => {
        try {
            const filePaths = event.files.map(file => file.uri.replace('file:', ''))
            await localProjectContextController.updateIndex(filePaths, 'remove')
        } catch (error) {
            logging.error(`Error handling delete event: ${error}`)
        }
    })

    lsp.workspace.onDidRenameFiles(async event => {
        try {
            const oldPaths = event.files.map(file => file.oldUri.replace('file:', ''))
            const newPaths = event.files.map(file => file.oldUri.replace('file:', ''))

            await localProjectContextController.updateIndex(oldPaths, 'remove')
            await localProjectContextController.updateIndex(newPaths, 'add')
        } catch (error) {
            logging.error(`Error handling rename event: ${error}`)
        }
    })

    lsp.onDidSaveTextDocument(async event => {
        try {
            const filePaths = [event.textDocument.uri.replace('file:', '')]
            await localProjectContextController.updateIndex(filePaths, 'update')
        } catch (error) {
            logging.error(`Error handling save event: ${error}`)
        }
    })

    return () => {}
}
