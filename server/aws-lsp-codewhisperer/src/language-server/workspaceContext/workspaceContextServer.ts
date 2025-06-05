import {
    CancellationToken,
    GetConfigurationFromServerParams,
    InitializeParams,
    Server,
    WorkspaceFolder,
} from '@aws/language-server-runtimes/server-interface'
import * as crypto from 'crypto'
import { cleanUrl, isDirectory, isEmptyDirectory, isLoggedInUsingBearerToken } from './util'
import { ArtifactManager, FileMetadata, SUPPORTED_WORKSPACE_CONTEXT_LANGUAGES } from './artifactManager'
import { WorkspaceFolderManager } from './workspaceFolderManager'
import { URI } from 'vscode-uri'
import { DependencyDiscoverer } from './dependency/dependencyDiscoverer'
import { getCodeWhispererLanguageIdFromPath } from '../../shared/languageDetection'
import { makeUserContextObject } from '../../shared/telemetryUtils'
import { safeGet } from '../../shared/utils'
import { AmazonQTokenServiceManager } from '../../shared/amazonQServiceManager/AmazonQTokenServiceManager'

const Q_CONTEXT_CONFIGURATION_SECTION = 'aws.q.workspaceContext'

export const WorkspaceContextServer = (): Server => features => {
    const { credentialsProvider, workspace, logging, lsp, runtime, sdkInitializator } = features

    let workspaceIdentifier: string = ''
    let workspaceFolders: WorkspaceFolder[] = []
    let artifactManager: ArtifactManager
    let dependencyDiscoverer: DependencyDiscoverer
    let workspaceFolderManager: WorkspaceFolderManager
    let isWorkflowInitialized: boolean = false
    let isOptedIn: boolean = false
    let abTestingEvaluated = false
    let abTestingEnabled = false
    let amazonQServiceManager: AmazonQTokenServiceManager
    let allowedExtension: string[] = ['AmazonQ-For-VSCode', 'Amazon Q For JetBrains']
    let isSupportedExtension = false

    lsp.addInitializer((params: InitializeParams) => {
        let clientExtension = params.initializationOptions?.aws?.clientInfo?.extension.name || ''
        if (!allowedExtension.includes(clientExtension)) {
            logging.warn(`Server context is currently not supported in ${clientExtension}`)
            return {
                capabilities: {},
            }
        } else {
            isSupportedExtension = true
        }

        workspaceIdentifier = params.initializationOptions?.aws?.contextConfiguration?.workspaceIdentifier || ''
        if (!workspaceIdentifier) {
            logging.warn(`No workspaceIdentifier set. Treating this workspace as a temporary session.`)
            workspaceIdentifier = crypto.randomUUID()
        }

        const folders = workspace.getAllWorkspaceFolders()
        workspaceFolders = folders || params.workspaceFolders || []

        if (!folders) {
            logging.warn(`No workspace folders set during initialization`)
        }

        return {
            capabilities: {
                workspace: {
                    workspaceFolders: {
                        supported: true,
                        changeNotifications: true,
                    },
                    fileOperations: {
                        didCreate: {
                            filters: [
                                { pattern: { glob: '**/*.{ts,js,py,java}', matches: 'file' } },
                                { pattern: { glob: '**/*', matches: 'folder' } },
                            ],
                        },
                        didRename: {
                            filters: [
                                { pattern: { glob: '**/*.{ts,js,py,java}', matches: 'file' } },
                                { pattern: { glob: '**/*', matches: 'folder' } },
                            ],
                        },
                        didDelete: {
                            filters: [
                                { pattern: { glob: '**/*.{ts,js,py,java}', matches: 'file' } },
                                { pattern: { glob: '**/*', matches: 'folder' } },
                            ],
                        },
                    },
                },
            },
            awsServerCapabilities: {
                configurationProvider: { sections: [Q_CONTEXT_CONFIGURATION_SECTION] },
            },
        }
    })

    lsp.extensions.onGetConfigurationFromServer(
        async (params: GetConfigurationFromServerParams, token: CancellationToken) => {
            if (params.section === Q_CONTEXT_CONFIGURATION_SECTION) {
                // Only append workspaceId to GenerateCompletions when WebSocket client is connected
                if (
                    !workspaceFolderManager.getWorkspaceState().webSocketClient?.isConnected() ||
                    !workspaceFolderManager.getWorkspaceState().workspaceId
                ) {
                    return {
                        workspaces: [],
                    }
                }

                return {
                    workspaces: workspaceFolders.map(workspaceFolder => ({
                        workspaceRoot: workspaceFolder.uri,
                        workspaceId: workspaceFolderManager.getWorkspaceState().workspaceId,
                    })),
                }
            }
            return {
                workspace: [],
            }
        }
    )

    const updateConfiguration = async () => {
        try {
            let workspaceContextConfig = (await lsp.workspace.getConfiguration('amazonQ.workspaceContext')) || false
            const configJetBrains = await lsp.workspace.getConfiguration('aws.codeWhisperer')
            if (configJetBrains) {
                workspaceContextConfig = workspaceContextConfig || configJetBrains['workspaceContext']
            }

            // TODO, removing client side opt in temporarily
            isOptedIn = true
            // isOptedIn = workspaceContextConfig === true

            if (!isOptedIn) {
                isWorkflowInitialized = false
                await workspaceFolderManager.clearAllWorkspaceResources()
            }
        } catch (error) {
            logging.error(`Error in getConfiguration: ${error}`)
        }
    }

    const evaluateABTesting = async () => {
        if (abTestingEvaluated) {
            return
        }

        try {
            const clientParams = safeGet(lsp.getClientInitializeParams())
            const userContext = makeUserContextObject(clientParams, runtime.platform, 'CodeWhisperer') ?? {
                ideCategory: 'VSCODE',
                operatingSystem: 'MAC',
                product: 'CodeWhisperer',
            }

            const result = await amazonQServiceManager.getCodewhispererService().listFeatureEvaluations({ userContext })
            logging.log(`${JSON.stringify(result)}`)
            abTestingEnabled =
                result.featureEvaluations?.some(
                    feature => feature.feature === 'ServiceSideWorkspaceContext' && feature.variation === 'TREATMENT'
                ) ?? false
            logging.info(`A/B testing enabled: ${abTestingEnabled}`)
            abTestingEvaluated = true
        } catch (error: any) {
            logging.error(`Error while checking A/B status: ${error.code}`)
            abTestingEnabled = false
            abTestingEvaluated = true
        }
    }

    const isUserEligibleForWorkspaceContext = () => {
        return (
            isOptedIn &&
            isLoggedInUsingBearerToken(credentialsProvider) &&
            abTestingEnabled &&
            !workspaceFolderManager.getOptOutStatus() &&
            workspaceIdentifier
        )
    }

    lsp.onInitialized(async params => {
        try {
            if (!isSupportedExtension) {
                return {}
            }
            amazonQServiceManager = AmazonQTokenServiceManager.getInstance()

            artifactManager = new ArtifactManager(workspace, logging, workspaceFolders)
            dependencyDiscoverer = new DependencyDiscoverer(workspace, logging, workspaceFolders, artifactManager)
            workspaceFolderManager = WorkspaceFolderManager.createInstance(
                amazonQServiceManager,
                logging,
                artifactManager,
                dependencyDiscoverer,
                workspaceFolders,
                credentialsProvider,
                workspaceIdentifier
            )
            await updateConfiguration()

            lsp.workspace.onDidChangeWorkspaceFolders(async params => {
                const addedFolders = params.event.added

                if (addedFolders.length > 0) {
                    workspaceFolders.push(...addedFolders)
                }

                const removedFolders = params.event.removed
                if (removedFolders.length > 0) {
                    for (const folder of removedFolders) {
                        const index = workspaceFolders.findIndex(f => f.uri === folder.uri)
                        if (index !== -1) {
                            workspaceFolders.splice(index, 1)
                        }
                    }
                }

                workspaceFolderManager.updateWorkspaceFolders(workspaceFolders)

                if (!isUserEligibleForWorkspaceContext()) {
                    return
                }

                if (addedFolders.length > 0) {
                    await workspaceFolderManager.processNewWorkspaceFolders(addedFolders)
                }
                if (removedFolders.length > 0) {
                    await workspaceFolderManager.processWorkspaceFoldersDeletion(removedFolders)
                }
            })
            /**
             * The below code checks the login state of the workspace and initializes the workspace
             * folders. *isWorkflowInitialized* variable is used to keep track if the workflow has been initialized
             * or not to prevent it from initializing again. However, there can be a case when user logs out, does some
             * activity with removing or adding workspace folders, and logs back in. To handle this case- the new state
             * of workspace folders is updated using *artifactManager.updateWorkspaceFolders(workspaceFolders)* before
             * initializing again.
             */
            setInterval(async () => {
                if (!isOptedIn) {
                    return
                }
                const isLoggedIn = isLoggedInUsingBearerToken(credentialsProvider)
                if (isLoggedIn && !isWorkflowInitialized) {
                    try {
                        // getCodewhispererService only returns the cwspr client if the service manager was initialized i.e. profile was selected otherwise it throws an error
                        // we will not evaluate a/b status until profile is selected and service manager is fully initialized
                        amazonQServiceManager.getCodewhispererService()
                    } catch (e) {
                        return
                    }

                    await evaluateABTesting()
                    isWorkflowInitialized = true

                    if (!isUserEligibleForWorkspaceContext()) {
                        return
                    }

                    workspaceFolderManager.initializeWorkspaceStatusMonitor().catch(error => {
                        logging.error(`Error while initializing workspace status monitoring: ${error}`)
                    })
                    logging.log(`Workspace context workflow initialized`)
                    artifactManager.updateWorkspaceFolders(workspaceFolders)
                    workspaceFolderManager.processNewWorkspaceFolders(workspaceFolders).catch(error => {
                        logging.error(`Error while processing new workspace folders: ${error}`)
                    })
                } else if (!isLoggedIn) {
                    if (isWorkflowInitialized) {
                        // If user is not logged in but the workflow is marked as initialized, it means user was logged in and is now logged out
                        // In this case, clear the resources and stop the monitoring
                        await workspaceFolderManager.clearAllWorkspaceResources()
                    }
                    isWorkflowInitialized = false
                }
            }, 5000)
        } catch (error) {
            logging.error(`Failed to initialize workspace context server: ${error}`)
        }
    })

    lsp.didChangeConfiguration(updateConfiguration)

    lsp.onDidSaveTextDocument(async event => {
        try {
            if (!isUserEligibleForWorkspaceContext()) {
                return
            }

            const programmingLanguage = getCodeWhispererLanguageIdFromPath(event.textDocument.uri)
            if (!programmingLanguage || !SUPPORTED_WORKSPACE_CONTEXT_LANGUAGES.includes(programmingLanguage)) {
                return
            }

            logging.log(`Received didSave event for ${event.textDocument.uri}`)

            const workspaceFolder = workspaceFolderManager.getWorkspaceFolder(event.textDocument.uri, workspaceFolders)
            if (!workspaceFolder) {
                logging.log(`No workspaceFolder found for ${event.textDocument.uri} discarding the save event`)
                return
            }
            const workspaceId = await workspaceFolderManager.waitForRemoteWorkspaceId()

            const fileMetadata = await artifactManager.processNewFile(workspaceFolder, event.textDocument.uri)
            const s3Url = await workspaceFolderManager.uploadToS3(fileMetadata)
            if (!s3Url) {
                return
            }

            const message = JSON.stringify({
                method: 'textDocument/didSave',
                params: {
                    textDocument: {
                        uri: event.textDocument.uri,
                    },
                    workspaceChangeMetadata: {
                        workspaceId: workspaceId,
                        s3Path: cleanUrl(s3Url),
                        programmingLanguage: programmingLanguage,
                    },
                },
            })
            const workspaceState = workspaceFolderManager.getWorkspaceState()
            workspaceState.messageQueue.push(message)
        } catch (error) {
            logging.error(`Error handling save event: ${error}`)
        }
    })

    lsp.workspace.onDidCreateFiles(async event => {
        try {
            if (!isUserEligibleForWorkspaceContext()) {
                return
            }
            logging.log(`Received didCreateFiles event of length ${event.files.length}`)

            const workspaceState = workspaceFolderManager.getWorkspaceState()
            for (const file of event.files) {
                const isDir = isDirectory(file.uri)
                const workspaceFolder = workspaceFolderManager.getWorkspaceFolder(file.uri, workspaceFolders)
                if (!workspaceFolder) {
                    continue
                }

                const programmingLanguage = getCodeWhispererLanguageIdFromPath(file.uri)
                if (!programmingLanguage || !SUPPORTED_WORKSPACE_CONTEXT_LANGUAGES.includes(programmingLanguage)) {
                    continue
                }

                let filesMetadata: FileMetadata[] = []
                if (isDir && isEmptyDirectory(file.uri)) {
                    continue
                } else if (isDir) {
                    filesMetadata = await artifactManager.addNewDirectories([URI.parse(file.uri)])
                } else {
                    filesMetadata = [await artifactManager.processNewFile(workspaceFolder, file.uri)]
                }

                const workspaceId = await workspaceFolderManager.waitForRemoteWorkspaceId()
                for (const fileMetadata of filesMetadata) {
                    const s3Url = await workspaceFolderManager.uploadToS3(fileMetadata)
                    if (!s3Url) {
                        continue
                    }

                    const message = JSON.stringify({
                        method: 'workspace/didCreateFiles',
                        params: {
                            files: [
                                {
                                    uri: file.uri,
                                },
                            ],
                            workspaceChangeMetadata: {
                                workspaceId: workspaceId,
                                s3Path: cleanUrl(s3Url),
                                programmingLanguage: fileMetadata.language,
                            },
                        },
                    })
                    workspaceState.messageQueue.push(message)
                }
            }
        } catch (error) {
            logging.error(`Error handling create event: ${error}`)
        }
    })

    lsp.workspace.onDidDeleteFiles(async event => {
        try {
            if (!isUserEligibleForWorkspaceContext()) {
                return
            }

            logging.log(`Received didDeleteFiles event of length ${event.files.length}`)

            const workspaceState = workspaceFolderManager.getWorkspaceState()
            for (const file of event.files) {
                const workspaceFolder = workspaceFolderManager.getWorkspaceFolder(file.uri, workspaceFolders)
                if (!workspaceFolder) {
                    logging.log(`Workspace details not found for deleted file: ${file.uri}`)
                    continue
                }

                const programmingLanguages = artifactManager.handleDeletedPathAndGetLanguages(file.uri, workspaceFolder)
                if (programmingLanguages.length === 0) {
                    logging.log(`No programming languages determined for: ${file.uri}`)
                    continue
                }

                const workspaceId = await workspaceFolderManager.waitForRemoteWorkspaceId()
                // Send notification for each programming language
                for (const language of programmingLanguages) {
                    const message = JSON.stringify({
                        method: 'workspace/didDeleteFiles',
                        params: {
                            files: [
                                {
                                    uri: file.uri,
                                },
                            ],
                            workspaceChangeMetadata: {
                                workspaceId: workspaceId,
                                programmingLanguage: language,
                            },
                        },
                    })
                    workspaceState.messageQueue.push(message)
                }
            }
        } catch (error) {
            logging.error(`Error handling delete event: ${error}`)
        }
    })

    lsp.workspace.onDidRenameFiles(async event => {
        try {
            if (!isUserEligibleForWorkspaceContext()) {
                return
            }

            logging.log(`Received didRenameFiles event of length ${event.files.length}`)

            const workspaceState = workspaceFolderManager.getWorkspaceState()
            for (const file of event.files) {
                const workspaceFolder = workspaceFolderManager.getWorkspaceFolder(file.newUri, workspaceFolders)
                if (!workspaceFolder) {
                    continue
                }

                const filesMetadata = await artifactManager.handleRename(workspaceFolder, file.oldUri, file.newUri)

                const workspaceId = await workspaceFolderManager.waitForRemoteWorkspaceId()
                for (const fileMetadata of filesMetadata) {
                    const s3Url = await workspaceFolderManager.uploadToS3(fileMetadata)
                    if (!s3Url) {
                        continue
                    }
                    const message = JSON.stringify({
                        method: 'workspace/didRenameFiles',
                        params: {
                            files: [
                                {
                                    old_uri: file.oldUri,
                                    new_uri: file.newUri,
                                },
                            ],
                            workspaceChangeMetadata: {
                                workspaceId: workspaceId,
                                s3Path: cleanUrl(s3Url),
                                programmingLanguage: fileMetadata.language,
                            },
                        },
                    })
                    workspaceState.messageQueue.push(message)
                }
            }
        } catch (error) {
            logging.error(`Error handling rename event: ${error}`)
        }
    })

    lsp.extensions.onDidChangeDependencyPaths(async params => {
        try {
            if (!isUserEligibleForWorkspaceContext()) {
                return
            }
            logging.log(`Received onDidChangeDependencyPaths event for ${params.moduleName}`)

            const workspaceFolder = workspaceFolderManager.getWorkspaceFolder(params.moduleName)
            await dependencyDiscoverer.handleDependencyUpdateFromLSP(
                params.runtimeLanguage,
                params.paths,
                workspaceFolder
            )
        } catch (error) {
            logging.error(`Error handling didChangeDependencyPaths event: ${error}`)
        }
    })

    logging.log('Workspace context server has been initialized')

    return () => {
        workspaceFolderManager.clearAllWorkspaceResources().catch(error => {
            logging.warn(
                `Error while clearing workspace resources: ${error instanceof Error ? error.message : 'Unknown error'}`
            )
        })
    }
}
