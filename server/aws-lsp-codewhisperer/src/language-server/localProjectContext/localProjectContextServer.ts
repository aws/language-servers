import { InitializeParams, Server, TextDocumentSyncKind } from '@aws/language-server-runtimes/server-interface'
import { AmazonQTokenServiceManager } from '../../shared/amazonQServiceManager/AmazonQTokenServiceManager'
import { TelemetryService } from '../../shared/telemetry/telemetryService'
import { LocalProjectContextController } from '../../shared/localProjectContextController'
import { languageByExtension } from '../../shared/languageDetection'
import { AmazonQWorkspaceConfig } from '../../shared/amazonQServiceManager/configurationUtils'

export const LocalProjectContextServer = (): Server => features => {
    const { credentialsProvider, telemetry, logging, lsp } = features

    let localProjectContextController: LocalProjectContextController
    let amazonQServiceManager: AmazonQTokenServiceManager
    let telemetryService: TelemetryService

    lsp.addInitializer((params: InitializeParams) => {
        amazonQServiceManager = AmazonQTokenServiceManager.getInstance(features)
        telemetryService = new TelemetryService(amazonQServiceManager, credentialsProvider, telemetry, logging)

        localProjectContextController = new LocalProjectContextController(
            params.clientInfo?.name ?? 'unknown',
            params.workspaceFolders ?? [],
            logging,
            params?.aws?.contextConfiguration?.workspaceIndexConfiguration
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
            await amazonQServiceManager.handleDidChangeConfiguration()
            await amazonQServiceManager.addDidChangeConfigurationListener(updateConfigurationHandler)
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

    const updateConfigurationHandler = async (updatedConfig: AmazonQWorkspaceConfig) => {
        logging.log('Updating configuration of local context server')
        try {
            logging.log(`Setting project context enabled to ${updatedConfig.projectContext?.enableLocalIndexing}`)
            updatedConfig.projectContext?.enableLocalIndexing
                ? await localProjectContextController.init({
                      includeSymlinks: updatedConfig.projectContext?.localIndexing?.includeSymlinks,
                      maxFileSizeMb: updatedConfig.projectContext?.localIndexing?.maxFileSizeMb,
                      maxIndexSizeMb: updatedConfig.projectContext?.localIndexing?.maxIndexSizeMb,
                  })
                : await localProjectContextController.dispose()
        } catch (error) {
            logging.error(`Error handling configuration change: ${error}`)
        }
    }

    return () => {}
}
