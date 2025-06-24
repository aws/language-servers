import { InitializeParams, Server, TextDocumentSyncKind } from '@aws/language-server-runtimes/server-interface'
import { AmazonQTokenServiceManager } from '../../shared/amazonQServiceManager/AmazonQTokenServiceManager'
import { TelemetryService } from '../../shared/telemetry/telemetryService'
import { LocalProjectContextController } from '../../shared/localProjectContextController'
import { languageByExtension } from '../../shared/languageDetection'
import { AmazonQWorkspaceConfig } from '../../shared/amazonQServiceManager/configurationUtils'
import { URI } from 'vscode-uri'

export const LocalProjectContextServer =
    (): Server =>
    ({ credentialsProvider, telemetry, logging, lsp, workspace }) => {
        let localProjectContextController: LocalProjectContextController
        let amazonQServiceManager: AmazonQTokenServiceManager
        let telemetryService: TelemetryService

        let localProjectContextEnabled: boolean = false

        lsp.addInitializer((params: InitializeParams) => {
            const workspaceFolders = workspace.getAllWorkspaceFolders() || params.workspaceFolders
            localProjectContextController = new LocalProjectContextController(
                params.clientInfo?.name ?? 'unknown',
                workspaceFolders,
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
                amazonQServiceManager = AmazonQTokenServiceManager.getInstance()
                telemetryService = new TelemetryService(amazonQServiceManager, credentialsProvider, telemetry, logging)

                await amazonQServiceManager.addDidChangeConfigurationListener(updateConfigurationHandler)
                logging.info('Local context server has been initialized')
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
                const filePaths = event.files.map(file => URI.parse(file.uri).fsPath)
                await localProjectContextController.updateIndexAndContextCommand(filePaths, true)
            } catch (error) {
                logging.error(`Error handling create event: ${error}`)
            }
        })

        lsp.workspace.onDidDeleteFiles(async event => {
            try {
                const filePaths = event.files.map(file => URI.parse(file.uri).fsPath)
                await localProjectContextController.updateIndexAndContextCommand(filePaths, false)
            } catch (error) {
                logging.error(`Error handling delete event: ${error}`)
            }
        })

        lsp.workspace.onDidRenameFiles(async event => {
            try {
                const oldPaths = event.files.map(file => URI.parse(file.oldUri).fsPath)
                const newPaths = event.files.map(file => URI.parse(file.newUri).fsPath)

                await localProjectContextController.updateIndexAndContextCommand(oldPaths, false)
                await localProjectContextController.updateIndexAndContextCommand(newPaths, true)
            } catch (error) {
                logging.error(`Error handling rename event: ${error}`)
            }
        })

        lsp.onDidSaveTextDocument(async event => {
            try {
                const filePaths = [URI.parse(event.textDocument.uri).fsPath]
                await localProjectContextController.updateIndex(filePaths, 'update')
            } catch (error) {
                logging.error(`Error handling save event: ${error}`)
            }
        })

        const updateConfigurationHandler = async (updatedConfig: AmazonQWorkspaceConfig) => {
            logging.log('Updating configuration of local context server')
            try {
                localProjectContextEnabled = updatedConfig.projectContext?.enableLocalIndexing === true
                if (process.env.DISABLE_INDEXING_LIBRARY === 'true') {
                    logging.log('Skipping local project context initialization')
                    localProjectContextEnabled = false
                } else {
                    logging.log(
                        `Setting project context indexing enabled to ${updatedConfig.projectContext?.enableLocalIndexing}`
                    )
                    await localProjectContextController.init({
                        enableGpuAcceleration: updatedConfig?.projectContext?.enableGpuAcceleration,
                        indexWorkerThreads: updatedConfig?.projectContext?.indexWorkerThreads,
                        ignoreFilePatterns: updatedConfig.projectContext?.localIndexing?.ignoreFilePatterns,
                        maxFileSizeMB: updatedConfig.projectContext?.localIndexing?.maxFileSizeMB,
                        maxIndexSizeMB: updatedConfig.projectContext?.localIndexing?.maxIndexSizeMB,
                        enableIndexing: localProjectContextEnabled,
                        indexCacheDirPath: updatedConfig.projectContext?.localIndexing?.indexCacheDirPath,
                    })
                }
            } catch (error) {
                logging.error(`Error handling configuration change: ${error}`)
            }
        }

        return async () => {
            await localProjectContextController?.dispose()
        }
    }
