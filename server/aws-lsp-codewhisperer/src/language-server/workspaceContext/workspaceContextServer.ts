import {
    CancellationToken,
    GetConfigurationFromServerParams,
    InitializeParams,
    Server,
    WorkspaceFolder,
} from '@aws/language-server-runtimes/server-interface'
import { cleanUrl, getRelativePath, isDirectory, isEmptyDirectory, isLoggedInUsingBearerToken } from './util'
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

    let workspaceFolders: WorkspaceFolder[] = []
    let artifactManager: ArtifactManager
    let dependencyDiscoverer: DependencyDiscoverer
    let workspaceFolderManager: WorkspaceFolderManager
    let isWorkflowInitialized: boolean = false
    let isOptedIn: boolean = false
    let abTestingEvaluated = false
    let abTestingEnabled = false
    let amazonQServiceManager: AmazonQTokenServiceManager

    lsp.addInitializer((params: InitializeParams) => {
        workspaceFolders = params.workspaceFolders || []
        if (params.workspaceFolders) {
            workspaceFolders = params.workspaceFolders
        } else {
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
                const workspaceMap = workspaceFolderManager.getWorkspaces()

                // Filter workspaces to only include those with websocket connected.
                // To reduce the error of GenerateCompletions getting repoMap from server-side workspace context,
                // with websocket connected, at least workspace/didChangeWorkspaceFolders websocket request has been sent.
                // When the workspace is reopened and server-side was prepared, compared to filter with READY state of workspace,
                // this filter would add delay to wait for websocket connection being established
                const workspaceArray = Array.from(workspaceMap)
                    .filter(([_, workspaceState]) => workspaceState.webSocketClient?.isConnected())
                    .map(([workspaceRoot, workspaceState]) => ({
                        workspaceRoot,
                        workspaceId: workspaceState.workspaceId ?? '',
                    }))

                return {
                    workspaces: workspaceArray,
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
            logging.log(`A/B testing enabled: ${abTestingEnabled}`)
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
            !workspaceFolderManager.getOptOutStatus()
        )
    }

    lsp.onInitialized(async params => {
        amazonQServiceManager = AmazonQTokenServiceManager.getInstance({
            credentialsProvider,
            lsp,
            logging,
            runtime,
            sdkInitializator,
            workspace,
        })

        artifactManager = new ArtifactManager(workspace, logging, workspaceFolders)
        dependencyDiscoverer = new DependencyDiscoverer(workspace, logging, workspaceFolders, artifactManager)
        workspaceFolderManager = WorkspaceFolderManager.createInstance(
            amazonQServiceManager,
            logging,
            artifactManager,
            dependencyDiscoverer,
            workspaceFolders,
            credentialsProvider
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
    })

    lsp.didChangeConfiguration(updateConfiguration)

    lsp.onDidSaveTextDocument(async event => {
        if (!isUserEligibleForWorkspaceContext()) {
            return
        }

        const programmingLanguage = getCodeWhispererLanguageIdFromPath(event.textDocument.uri)
        if (!programmingLanguage || !SUPPORTED_WORKSPACE_CONTEXT_LANGUAGES.includes(programmingLanguage)) {
            return
        }

        logging.log(`Received didSave event for ${event.textDocument.uri}`)

        const result = workspaceFolderManager.getWorkspaceDetailsWithId(event.textDocument.uri, workspaceFolders)
        if (!result) {
            logging.log(`No workspace found for ${event.textDocument.uri} discarding the save event`)
            return
        }
        const { workspaceDetails, workspaceRoot } = result

        const fileMetadata = await artifactManager.processNewFile(workspaceRoot, event.textDocument.uri)
        const s3Url = await workspaceFolderManager.uploadToS3(fileMetadata)
        if (!s3Url) {
            return
        }

        const message = JSON.stringify({
            method: 'textDocument/didSave',
            params: {
                textDocument: { uri: getRelativePath(fileMetadata.workspaceFolder, event.textDocument.uri) },
                workspaceChangeMetadata: {
                    workspaceId: workspaceDetails.workspaceId,
                    s3Path: cleanUrl(s3Url),
                    programmingLanguage: programmingLanguage,
                },
            },
        })
        if (!workspaceDetails.webSocketClient) {
            logging.log(`WebSocket client is not connected yet: ${workspaceRoot.uri}, adding didSave message to queue`)
            workspaceDetails.messageQueue?.push(message)
        } else {
            workspaceDetails.webSocketClient.send(message)
        }
    })

    lsp.workspace.onDidCreateFiles(async event => {
        if (!isUserEligibleForWorkspaceContext()) {
            return
        }
        logging.log(`Received didCreateFiles event of length ${event.files.length}`)

        for (const file of event.files) {
            const isDir = isDirectory(file.uri)
            const result = workspaceFolderManager.getWorkspaceDetailsWithId(file.uri, workspaceFolders)
            if (!result) {
                continue
            }
            const { workspaceDetails, workspaceRoot } = result

            let filesMetadata: FileMetadata[] = []
            if (isDir && isEmptyDirectory(file.uri)) {
                continue
            } else if (isDir) {
                filesMetadata = await artifactManager.addNewDirectories([URI.parse(file.uri)])
            } else {
                filesMetadata = [await artifactManager.processNewFile(workspaceRoot, file.uri)]
            }

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
                                uri: getRelativePath(fileMetadata.workspaceFolder, file.uri),
                            },
                        ],
                        workspaceChangeMetadata: {
                            workspaceId: workspaceDetails.workspaceId,
                            s3Path: cleanUrl(s3Url),
                            programmingLanguage: fileMetadata.language,
                        },
                    },
                })
                if (!workspaceDetails.webSocketClient) {
                    logging.log(
                        `WebSocket client is not connected yet: ${workspaceRoot.uri}, adding didCreateFiles message to queue`
                    )
                    workspaceDetails.messageQueue?.push(message)
                } else {
                    workspaceDetails.webSocketClient.send(message)
                }
            }
        }
    })

    lsp.workspace.onDidDeleteFiles(async event => {
        if (!isUserEligibleForWorkspaceContext()) {
            return
        }

        logging.log(`Received didDeleteFiles event of length ${event.files.length}`)

        for (const file of event.files) {
            const result = workspaceFolderManager.getWorkspaceDetailsWithId(file.uri, workspaceFolders)
            if (!result) {
                logging.log(`Workspace details not found for deleted file: ${file.uri}`)
                continue
            }
            const { workspaceDetails, workspaceRoot } = result

            const programmingLanguages = artifactManager.handleDeletedPathAndGetLanguages(file.uri, workspaceRoot)
            if (programmingLanguages.length === 0) {
                logging.log(`No programming languages determined for: ${file.uri}`)
                continue
            }

            // Send notification for each programming language
            for (const language of programmingLanguages) {
                const message = JSON.stringify({
                    method: 'workspace/didDeleteFiles',
                    params: {
                        files: [
                            {
                                uri: getRelativePath(workspaceRoot, file.uri),
                            },
                        ],
                        workspaceChangeMetadata: {
                            workspaceId: workspaceDetails.workspaceId,
                            programmingLanguage: language,
                        },
                    },
                })
                if (!workspaceDetails.webSocketClient) {
                    logging.log(
                        `WebSocket client is not connected yet: ${workspaceRoot.uri}, adding didDeleteFiles message to queue`
                    )
                    workspaceDetails.messageQueue?.push(message)
                } else {
                    workspaceDetails.webSocketClient.send(message)
                }
            }
        }
    })

    lsp.workspace.onDidRenameFiles(async event => {
        if (!isUserEligibleForWorkspaceContext()) {
            return
        }

        logging.log(`Received didRenameFiles event of length ${event.files.length}`)

        for (const file of event.files) {
            const result = workspaceFolderManager.getWorkspaceDetailsWithId(file.newUri, workspaceFolders)
            if (!result) {
                continue
            }
            const { workspaceDetails, workspaceRoot } = result

            const filesMetadata = await artifactManager.handleRename(workspaceRoot, file.oldUri, file.newUri)
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
                                old_uri: getRelativePath(fileMetadata.workspaceFolder, file.oldUri),
                                new_uri: getRelativePath(fileMetadata.workspaceFolder, file.newUri),
                            },
                        ],
                        workspaceChangeMetadata: {
                            workspaceId: workspaceDetails.workspaceId,
                            s3Path: cleanUrl(s3Url),
                            programmingLanguage: fileMetadata.language,
                        },
                    },
                })
                if (!workspaceDetails.webSocketClient) {
                    logging.log(
                        `WebSocket client is not connected yet: ${workspaceRoot.uri}, adding didRenameFiles message to queue`
                    )
                    workspaceDetails.messageQueue?.push(message)
                } else {
                    workspaceDetails.webSocketClient.send(message)
                }
            }
        }
    })

    lsp.extensions.onDidChangeDependencyPaths(async params => {
        if (!isUserEligibleForWorkspaceContext()) {
            return
        }
        logging.log(`Received onDidChangeDependencyPaths event for ${params.moduleName}`)

        const workspaceFolder = workspaceFolderManager.getWorkspaceFolder(params.moduleName)
        await dependencyDiscoverer.handleDependencyUpdateFromLSP(params.runtimeLanguage, params.paths, workspaceFolder)
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
