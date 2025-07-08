import { InitializeParams, Server, TextDocumentSyncKind } from '@aws/language-server-runtimes/server-interface'
import { AmazonQServiceManager } from '../../shared/amazonQServiceManager/AmazonQServiceManager'
import { TelemetryService } from '../../shared/telemetry/telemetryService'
import { LocalProjectContextController } from '../../shared/localProjectContextController'
import { languageByExtension } from '../../shared/languageDetection'
import { AmazonQWorkspaceConfig } from '../../shared/amazonQServiceManager/configurationUtils'
import { URI } from 'vscode-uri'

export const LocalProjectContextServer =
    (): Server =>
    ({ credentialsProvider, telemetry, logging, lsp, workspace }) => {
        let localProjectContextController: LocalProjectContextController
        let amazonQServiceManager: AmazonQServiceManager
        let telemetryService: TelemetryService

        let localProjectContextEnabled: boolean = false
        let VSCWindowsOverride: boolean = false

        lsp.addInitializer((params: InitializeParams) => {
            const workspaceFolders = workspace.getAllWorkspaceFolders() || params.workspaceFolders
            localProjectContextController = new LocalProjectContextController(
                params.clientInfo?.name ?? 'unknown',
                workspaceFolders,
                logging
            )
            // Context: Adding, deleting, renaming files within the VSC IDE on windows does not properly trigger reindexing. All other IDE/OS combinations work
            // For all IDE/OS combination except VSC on Windows, using URI.parse() works
            // For VSC on Windows, using URI.parse() chops off the windows drive letter, so need to use URI.file() to preserve it
            // Temporary solution until further investigation is done on how the pathing works:
            VSCWindowsOverride = params.clientInfo?.name === 'vscode' && process.platform === 'win32'

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
                amazonQServiceManager = AmazonQServiceManager.getInstance()
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
                const filePaths = VSCWindowsOverride
                    ? event.files.map(file => URI.file(file.uri).fsPath)
                    : event.files.map(file => URI.parse(file.uri).fsPath)
                await localProjectContextController.updateIndexAndContextCommand(filePaths, true)
            } catch (error) {
                logging.error(`Error handling create event: ${error}`)
            }
        })

        lsp.workspace.onDidDeleteFiles(async event => {
            try {
                const filePaths = VSCWindowsOverride
                    ? event.files.map(file => URI.file(file.uri).fsPath)
                    : event.files.map(file => URI.parse(file.uri).fsPath)
                await localProjectContextController.updateIndexAndContextCommand(filePaths, false)
            } catch (error) {
                logging.error(`Error handling delete event: ${error}`)
            }
        })

        lsp.workspace.onDidRenameFiles(async event => {
            try {
                const oldPaths = VSCWindowsOverride
                    ? event.files.map(file => URI.file(file.oldUri).fsPath)
                    : event.files.map(file => URI.parse(file.newUri).fsPath)
                const newPaths = VSCWindowsOverride
                    ? event.files.map(file => URI.file(file.oldUri).fsPath)
                    : event.files.map(file => URI.parse(file.newUri).fsPath)

                await localProjectContextController.updateIndexAndContextCommand(oldPaths, false)
                await localProjectContextController.updateIndexAndContextCommand(newPaths, true)
            } catch (error) {
                logging.error(`Error handling rename event: ${error}`)
            }
        })

        lsp.onDidSaveTextDocument(async event => {
            try {
                const filePaths = VSCWindowsOverride
                    ? [URI.file(event.textDocument.uri).fsPath]
                    : [URI.parse(event.textDocument.uri).fsPath]
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
