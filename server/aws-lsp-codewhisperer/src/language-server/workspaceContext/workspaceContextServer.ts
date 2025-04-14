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
import { cleanUrl, getRelativePath, isDirectory, isEmptyDirectory, isLoggedInUsingBearerToken } from './util'
import { ArtifactManager, FileMetadata, SUPPORTED_WORKSPACE_CONTEXT_LANGUAGES } from './artifactManager'
import { WorkspaceFolderManager } from './workspaceFolderManager'
import { URI } from 'vscode-uri'
import { DependencyDiscoverer } from './dependency/dependencyDiscoverer'
import { getCodeWhispererLanguageIdFromPath } from '../../shared/languageDetection'
import { CodeWhispererServiceToken } from '../../shared/codeWhispererService'
import { DEFAULT_AWS_Q_ENDPOINT_URL, DEFAULT_AWS_Q_REGION } from '../../shared/constants'

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
            } else {
                logging.warn(`No workspace folders set during initialization`)
            }

            artifactManager = new ArtifactManager(workspace, logging, workspaceFolders)
            dependencyDiscoverer = new DependencyDiscoverer(workspace, logging, workspaceFolders, artifactManager)
            workspaceFolderManager = WorkspaceFolderManager.createInstance(
                cwsprClient,
                logging,
                artifactManager,
                dependencyDiscoverer,
                workspaceFolders,
                credentialsProvider
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

                if (!isOptedIn) {
                    isWorkflowInitialized = false
                    await workspaceFolderManager.clearAllWorkspaceResources()
                }
            } catch (error) {
                logging.error(`Error in getConfiguration: ${error}`)
            }
        }

        let abTestingEvaluated = false
        let abTestingEnabled = false

        const isUserEligibleForWorkspaceContext = async () => {
            // Early return if A/B testing was previously checked and user was not part of test
            if (abTestingEvaluated && !abTestingEnabled) {
                return false
            }

            // Check basic conditions first to avoid unnecessary API calls
            if (
                !isOptedIn ||
                !isLoggedInUsingBearerToken(credentialsProvider) ||
                workspaceFolderManager.getOptOutStatus()
            ) {
                return false
            }

            // Perform A/B testing check if not already done
            if (!abTestingEvaluated) {
                try {
                    const featureEvaluations = await cwsprClient.listFeatureEvaluations({
                        userContext: {
                            ideCategory: 'VSCODE',
                            operatingSystem: 'MAC',
                            product: 'CodeWhisperer',
                        },
                    })
                    // todo, use the result
                    abTestingEnabled = true //featureEvaluations.some(feature => feature.enabled)
                    abTestingEvaluated = true
                } catch (error: any) {
                    console.error('Error checking A/B status:', error.code)
                    return false
                }
            }

            return abTestingEnabled
        }

        lsp.onInitialized(async params => {
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

                if (!isOptedIn) {
                    return
                }

                if (addedFolders.length > 0 && isLoggedInUsingBearerToken(credentialsProvider)) {
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
                    isWorkflowInitialized = true
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
            if (!(await isUserEligibleForWorkspaceContext())) {
                return
            }

            const programmingLanguage = getCodeWhispererLanguageIdFromPath(event.textDocument.uri)
            if (!programmingLanguage || !SUPPORTED_WORKSPACE_CONTEXT_LANGUAGES.includes(programmingLanguage)) {
                return
            }
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
                logging.log(
                    `WebSocket client is not connected yet: ${workspaceRoot.uri}, adding didSave message to queue`
                )
                workspaceDetails.messageQueue?.push(message)
            } else {
                workspaceDetails.webSocketClient.send(message)
            }
        })

        lsp.workspace.onDidCreateFiles(async event => {
            if (!(await isUserEligibleForWorkspaceContext())) {
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
            if (!(await isUserEligibleForWorkspaceContext())) {
                return
            }

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
            if (!(await isUserEligibleForWorkspaceContext())) {
                return
            }

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
            if (!(await isUserEligibleForWorkspaceContext())) {
                return
            }
            if (!isOptedIn) {
                return
            }
            const workspaceFolder = workspaceFolderManager.getWorkspaceFolder(params.moduleName)
            await dependencyDiscoverer.handleDependencyUpdateFromLSP(
                JSON.parse(JSON.stringify(params))['programmingLanguage'], //todo, this needs to be changed to runtimeLanguage
                params.paths,
                workspaceFolder
            )
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
