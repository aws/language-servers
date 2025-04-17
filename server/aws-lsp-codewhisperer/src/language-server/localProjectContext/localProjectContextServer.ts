import {
    AwsResponseError,
    InitializeParams,
    Server,
    TextDocumentSyncKind,
} from '@aws/language-server-runtimes/server-interface'
import { AmazonQTokenServiceManager } from '../../shared/amazonQServiceManager/AmazonQTokenServiceManager'
import { TelemetryService } from '../../shared/telemetry/telemetryService'
import { LocalProjectContextController } from '../../shared/localProjectContextController'
import { languageByExtension } from '../../shared/languageDetection'
import { AmazonQWorkspaceConfig } from '../../shared/amazonQServiceManager/configurationUtils'

type LocalProjectContextServerDependencies = {
    localProjectContextController: LocalProjectContextController
    amazonQServiceManager: AmazonQTokenServiceManager
    telemetryService: TelemetryService
}

export const LocalProjectContextServer = (): Server => features => {
    const { credentialsProvider, telemetry, logging, lsp, chat } = features
    let deps: LocalProjectContextServerDependencies | undefined = undefined

    lsp.addInitializer(async (params: InitializeParams) => {
        if (!params.workspaceFolders) {
            logging.info('No workspace is configured, skip launching local project context server')
            return {
                capabilities: {},
            }
        }

        const amazonQServiceManager = AmazonQTokenServiceManager.getInstance(features)
        const telemetryService = new TelemetryService(amazonQServiceManager, credentialsProvider, telemetry, logging)
        const localProjectContextController = new LocalProjectContextController(
            params.clientInfo?.name ?? 'unknown',
            params.workspaceFolders ?? [],
            logging
        )
        deps = {
            amazonQServiceManager,
            telemetryService,
            localProjectContextController,
        }
        const supportedFilePatterns = Object.keys(languageByExtension).map(ext => `**/*${ext}`)
        logging.info('Initialized local project context server')

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
        if (deps === undefined) {
            return
        }
        try {
            await deps.amazonQServiceManager.handleDidChangeConfiguration()
            await deps.amazonQServiceManager.addDidChangeConfigurationListener(updateConfigurationHandler)
            chat.sendContextCommands({
                contextCommandGroups: [
                    // announce that @workspace context is ready
                    // https://github.com/aws/aws-toolkit-vscode/blob/413ce4b5c0d35dbc9c854c9bbcc2dbbc3977193e/packages/core/src/codewhispererChat/controllers/chat/controller.ts#L473
                    {
                        groupName: 'Mention code',
                        commands: [
                            {
                                command: '@workspace',
                                description: 'Reference all code in workspace.',
                            },
                        ],
                    },
                ],
            })
            logging.log('Local context server has been initialized')
        } catch (error) {
            logging.error(`Failed to initialize local context server: ${error}`)
        }
    })

    lsp.workspace.onDidChangeWorkspaceFolders(async event => {
        if (deps === undefined) {
            return
        }
        try {
            await deps.localProjectContextController.updateWorkspaceFolders(event.event.added, event.event.removed)
        } catch (error) {
            logging.error(`Error handling workspace folder change: ${error}`)
        }
    })

    lsp.workspace.onDidCreateFiles(async event => {
        if (deps === undefined) {
            return
        }
        try {
            const filePaths = event.files.map(file => file.uri.replace('file:', ''))
            await deps.localProjectContextController.updateIndex(filePaths, 'add')
        } catch (error) {
            logging.error(`Error handling create event: ${error}`)
        }
    })

    lsp.workspace.onDidDeleteFiles(async event => {
        if (deps === undefined) {
            return
        }
        try {
            const filePaths = event.files.map(file => file.uri.replace('file:', ''))
            await deps.localProjectContextController.updateIndex(filePaths, 'remove')
        } catch (error) {
            logging.error(`Error handling delete event: ${error}`)
        }
    })

    lsp.workspace.onDidRenameFiles(async event => {
        if (deps === undefined) {
            return
        }
        try {
            const oldPaths = event.files.map(file => file.oldUri.replace('file:', ''))
            const newPaths = event.files.map(file => file.oldUri.replace('file:', ''))

            await deps.localProjectContextController.updateIndex(oldPaths, 'remove')
            await deps.localProjectContextController.updateIndex(newPaths, 'add')
        } catch (error) {
            logging.error(`Error handling rename event: ${error}`)
        }
    })

    lsp.onDidSaveTextDocument(async event => {
        if (deps === undefined) {
            return
        }
        try {
            const filePaths = [event.textDocument.uri.replace('file:', '')]
            await deps.localProjectContextController.updateIndex(filePaths, 'update')
        } catch (error) {
            logging.error(`Error handling save event: ${error}`)
        }
    })

    const updateConfigurationHandler = async (updatedConfig: AmazonQWorkspaceConfig) => {
        if (deps === undefined) {
            return
        }
        logging.log('Updating configuration of local context server')
        try {
            logging.log(`Setting project context enabled to ${updatedConfig.projectContext?.enableLocalIndexing}`)
            updatedConfig.projectContext?.enableLocalIndexing
                ? await deps.localProjectContextController.init()
                : await deps.localProjectContextController.dispose()
        } catch (error) {
            logging.error(`Error handling configuration change: ${error}`)
        }
    }

    return () => {}
}
