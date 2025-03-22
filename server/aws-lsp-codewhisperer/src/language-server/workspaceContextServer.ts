import {
    CancellationToken,
    CredentialsProvider,
    GetConfigurationFromServerParams,
    InitializeParams,
    SDKInitializator,
    Server,
    Workspace,
    WorkspaceFolder,
} from '@aws/language-server-runtimes/server-interface'
import { CodeWhispererServiceToken } from './codeWhispererService'
import { getRelativePath, isDirectory, isEmptyDirectory, isLoggedInUsingBearerToken } from './workspaceContext/util'
import {
    ArtifactManager,
    FileMetadata,
    SUPPORTED_WORKSPACE_CONTEXT_LANGUAGES,
} from './workspaceContext/artifactManager'
import { DEFAULT_AWS_Q_ENDPOINT_URL, DEFAULT_AWS_Q_REGION } from '../constants'
import { WorkspaceFolderManager } from './workspaceContext/workspaceFolderManager'
import { URI } from 'vscode-uri'
import { getCodeWhispererLanguageIdFromPath } from './languageDetection'
import { DependencyDiscoverer } from './workspaceContext/dependency/dependencyDiscoverer'

const Q_CONTEXT_CONFIGURATION_SECTION = 'aws.q.workspaceContext'

export const WorkspaceContextServer =
    (
        service: (
            credentialsProvider: CredentialsProvider,
            workspace: Workspace,
            awsQRegion: string,
            awsQEndpointUrl: string,
            sdkInitializator: SDKInitializator
        ) => CodeWhispererServiceToken
    ): Server =>
    features => {
        const { logging, lsp, workspace, runtime, credentialsProvider, sdkInitializator } = features
        let workspaceFolders: WorkspaceFolder[] = []
        let artifactManager: ArtifactManager
        let dependencyDiscoverer: DependencyDiscoverer
        let workspaceFolderManager: WorkspaceFolderManager
        let isWorkflowInitialized: boolean = false
        let isOptedIn: boolean = false

        const awsQRegion = runtime.getConfiguration('AWS_Q_REGION') ?? DEFAULT_AWS_Q_REGION
        const awsQEndpointUrl = runtime.getConfiguration('AWS_Q_ENDPOINT_URL') ?? DEFAULT_AWS_Q_ENDPOINT_URL
        const cwsprClient = service(credentialsProvider, workspace, awsQRegion, awsQEndpointUrl, sdkInitializator)
        lsp.addInitializer((params: InitializeParams) => {
            workspaceFolders = params.workspaceFolders || []
            if (params.workspaceFolders) {
                workspaceFolders = params.workspaceFolders
                logging.log(`Workspace folders set: ${workspaceFolders.map(folder => folder.uri).join(', ')}`)
            } else {
                logging.error(`WORKSPACE FOLDERS IS NOT SET`)
            }
            artifactManager = new ArtifactManager(workspace, logging, workspaceFolders)
            workspaceFolderManager = WorkspaceFolderManager.createInstance(
                cwsprClient,
                logging,
                artifactManager,
                workspaceFolders,
                credentialsProvider
            )
            dependencyDiscoverer = new DependencyDiscoverer(
                workspace,
                logging,
                workspaceFolders,
                artifactManager,
                workspaceFolderManager
            )

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

                    const workspaceArray = Array.from(workspaceMap, ([workspaceRoot, workspaceState]) => ({
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
                isOptedIn = workspaceContextConfig === true
                logging.info(`Workspace context optin: ${isOptedIn}`)

                if (!isOptedIn) {
                    isWorkflowInitialized = false
                    await workspaceFolderManager.clearAllWorkspaceResources()
                    artifactManager.cleanup()
                    dependencyDiscoverer.cleanup()
                }
            } catch (error) {
                logging.error(`Error in GetConfiguration: ${error}`)
            }
        }

        lsp.onInitialized(async params => {
            logging.log(`LSP initialized`)

            await updateConfiguration()
            lsp.workspace.onDidChangeWorkspaceFolders(async params => {
                logging.log(`Workspace folders changed ${JSON.stringify(params)}`)
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

                if (!isOptedIn) {
                    return
                }

                if (addedFolders.length > 0 && isLoggedInUsingBearerToken(credentialsProvider)) {
                    await workspaceFolderManager.processNewWorkspaceFolders(addedFolders, {
                        didChangeWorkspaceFoldersAddition: true,
                    })
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
                    isWorkflowInitialized = true
                    logging.log(`Workflow initialized`)
                    artifactManager.updateWorkspaceFolders(workspaceFolders)
                    await dependencyDiscoverer.searchDependencies()
                    await workspaceFolderManager.processNewWorkspaceFolders(workspaceFolders, {
                        initialize: true,
                    })
                } else if (!isLoggedIn) {
                    isWorkflowInitialized = false
                }
            }, 5000)
        })

        lsp.didChangeConfiguration(updateConfiguration)

        lsp.onDidSaveTextDocument(async event => {
            if (!isOptedIn) {
                return
            }
            logging.log(`Document saved: ${event.textDocument.uri}`)
            if (!isLoggedInUsingBearerToken(credentialsProvider)) {
                return
            }
            const programmingLanguage = getCodeWhispererLanguageIdFromPath(event.textDocument.uri)
            if (!programmingLanguage || !SUPPORTED_WORKSPACE_CONTEXT_LANGUAGES.includes(programmingLanguage)) {
                return
            }
            const result = workspaceFolderManager.getWorkspaceDetailsWithId(event.textDocument.uri, workspaceFolders)
            if (!result) {
                return
            }
            const { workspaceDetails, workspaceRoot } = result
            logging.log(`Retrieved workspace details - ID: ${workspaceDetails.workspaceId}, Root: ${workspaceRoot.uri}`)

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
                        s3Path: s3Url,
                        programmingLanguage: programmingLanguage,
                    },
                },
            })
            if (!workspaceDetails.webSocketClient) {
                logging.log(`Websocket client is not connected yet: ${workspaceRoot.uri}`)
                workspaceDetails.messageQueue?.push(message)
            } else {
                workspaceDetails.webSocketClient.send(message)
            }
        })

        lsp.workspace.onDidCreateFiles(async event => {
            if (!isOptedIn) {
                return
            }
            logging.log(`Documents created ${JSON.stringify(event)}`)
            if (!isLoggedInUsingBearerToken(credentialsProvider)) {
                return
            }
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

                logging.log(`Files metadata created: ${JSON.stringify(filesMetadata)}`)

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
                                s3Path: s3Url,
                                programmingLanguage: fileMetadata.language,
                            },
                        },
                    })
                    if (!workspaceDetails.webSocketClient) {
                        logging.log(`Websocket client is not connected yet: ${workspaceRoot.uri}`)
                        workspaceDetails.messageQueue?.push(message)
                    } else {
                        workspaceDetails.webSocketClient.send(message)
                    }
                }
            }
        })

        lsp.workspace.onDidDeleteFiles(async event => {
            if (!isOptedIn || !isLoggedInUsingBearerToken(credentialsProvider)) {
                return
            }
            logging.log(`Documents deleted ${JSON.stringify(event)}`)

            for (const file of event.files) {
                const result = workspaceFolderManager.getWorkspaceDetailsWithId(file.uri, workspaceFolders)
                if (!result) {
                    logging.log(`Workspace details not found for deleted file: ${file.uri}`)
                    continue
                }
                const { workspaceDetails, workspaceRoot } = result

                const programmingLanguages = artifactManager.determineLanguagesForDeletedPath(file.uri, workspaceRoot)
                if (programmingLanguages.length === 0) {
                    logging.log(`No programming languages determined for: ${file.uri}`)
                    continue
                }

                logging.log(`Programming languages for deleted item: ${file.uri} is ${programmingLanguages}`)

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
                        logging.log(`Websocket client is not connected yet: ${workspaceRoot.uri}`)
                        workspaceDetails.messageQueue?.push(message)
                    } else {
                        workspaceDetails.webSocketClient.send(message)
                    }
                }
            }
        })

        lsp.workspace.onDidRenameFiles(async event => {
            if (!isOptedIn) {
                return
            }
            logging.log(`Documents renamed ${JSON.stringify(event)}`)
            if (!isLoggedInUsingBearerToken(credentialsProvider)) {
                return
            }
            for (const file of event.files) {
                const isDir = isDirectory(file.newUri)
                const result = workspaceFolderManager.getWorkspaceDetailsWithId(file.newUri, workspaceFolders)
                if (!result) {
                    continue
                }
                const { workspaceDetails, workspaceRoot } = result

                let filesMetadata: FileMetadata[] = []
                if (isDir && isEmptyDirectory(file.newUri)) {
                    continue
                } else if (isDir) {
                    filesMetadata = await artifactManager.addNewDirectories([URI.parse(file.newUri)])
                } else {
                    filesMetadata = [await artifactManager.processNewFile(workspaceRoot, file.newUri)]
                }

                logging.log(`Files metadata renamed: ${JSON.stringify(filesMetadata)}`)

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
                                s3Path: s3Url,
                                programmingLanguage: fileMetadata.language,
                            },
                        },
                    })
                    if (!workspaceDetails.webSocketClient) {
                        logging.log(`Websocket client is not connected yet: ${workspaceRoot.uri}`)
                        workspaceDetails.messageQueue?.push(message)
                    } else {
                        workspaceDetails.webSocketClient.send(message)
                    }
                }
            }
        })

        lsp.extensions.onDidChangeDependencyPaths(async params => {
            logging.log(`Dependency path changed ${JSON.stringify(params)}`)
            if (!isOptedIn) {
                return
            }
            const workspaceFolder = workspaceFolderManager.getWorkspaceFolder(params.moduleName)
            dependencyDiscoverer.handleDependencyUpdateFromLSP(
                JSON.parse(JSON.stringify(params))['programmingLanguage'],
                params.paths,
                workspaceFolder
            )
        })

        logging.log('Workspace context server has been initialized')

        return () => {
            artifactManager.cleanup()
            dependencyDiscoverer.cleanup()
        }
    }
