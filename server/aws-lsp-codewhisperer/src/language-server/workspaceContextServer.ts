import {
    CredentialsProvider,
    InitializeParams,
    Server,
    Workspace,
    WorkspaceFolder,
} from '@aws/language-server-runtimes/server-interface'
import { CodeWhispererServiceToken } from './codeWhispererService'
import { isDirectory, isEmptyDirectory, isLoggedInUsingBearerToken } from './workspaceContext/util'
import {
    ArtifactManager,
    FileMetadata,
    SUPPORTED_WORKSPACE_CONTEXT_LANGUAGES,
} from './workspaceContext/artifactManager'
import { DEFAULT_AWS_Q_ENDPOINT_URL, DEFAULT_AWS_Q_REGION } from '../constants'
import { WorkspaceFolderManager } from './workspaceContext/workspaceFolderManager'
import { URI } from 'vscode-uri'
import { getCodeWhispererLanguageIdFromPath } from './languageDetection'
import { CreateUploadUrlRequest } from '../client/token/codewhispererbearertokenclient'
import { md5 } from 'js-md5'
import { DependencyDiscoverer } from './workspaceContext/dependency/dependencyDiscoverer'

export const WorkspaceContextServer =
    (
        service: (
            credentialsProvider: CredentialsProvider,
            workspace: Workspace,
            awsQRegion: string,
            awsQEndpointUrl: string
        ) => CodeWhispererServiceToken
    ): Server =>
    features => {
        const { logging, lsp, workspace, runtime, credentialsProvider, chat } = features
        let workspaceFolders: WorkspaceFolder[] = []
        let artifactManager: ArtifactManager
        let dependencyDiscoverer: DependencyDiscoverer
        let workspaceFolderManager: WorkspaceFolderManager
        let isWorkflowInitialized: boolean = false

        const awsQRegion = runtime.getConfiguration('AWS_Q_REGION') ?? DEFAULT_AWS_Q_REGION
        const awsQEndpointUrl = runtime.getConfiguration('AWS_Q_ENDPOINT_URL') ?? DEFAULT_AWS_Q_ENDPOINT_URL
        const cwsprClient = service(credentialsProvider, workspace, awsQRegion, awsQEndpointUrl)
        lsp.addInitializer((params: InitializeParams) => {
            workspaceFolders = params.workspaceFolders || []
            if (params.workspaceFolders) {
                workspaceFolders = params.workspaceFolders
            } else {
                logging.error(`WORKSPACE FOLDERS IS NOT SET`)
            }
            artifactManager = new ArtifactManager(workspace, logging, workspaceFolders)
            dependencyDiscoverer = new DependencyDiscoverer(workspace, logging, workspaceFolders)
            workspaceFolderManager = new WorkspaceFolderManager(cwsprClient, logging, artifactManager)

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
            }
        })

        lsp.onInitialized(async params => {
            logging.log(`LSP initialized`)

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
                    await workspaceFolderManager.processWorkspaceFoldersDeletion(removedFolders)
                }

                if (addedFolders.length > 0 && isLoggedInUsingBearerToken(credentialsProvider)) {
                    await workspaceFolderManager.processNewWorkspaceFolders(addedFolders, {
                        didChangeWorkspaceFoldersAddition: true,
                    })
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
                const isLoggedIn = isLoggedInUsingBearerToken(credentialsProvider)
                if (isLoggedIn && !isWorkflowInitialized) {
                    artifactManager.updateWorkspaceFolders(workspaceFolders)
                    await dependencyDiscoverer.searchDependencies()
                    await workspaceFolderManager.processNewWorkspaceFolders(workspaceFolders, {
                        initialize: true,
                    })
                    isWorkflowInitialized = true
                    logging.log(`Workflow initialized`)
                } else if (!isLoggedIn) {
                    isWorkflowInitialized = false
                }
            }, 5000)
        })

        lsp.onDidSaveTextDocument(async event => {
            logging.log(`Document saved ${JSON.stringify(event)}`)
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

            const fileMetadata = await artifactManager.getFileMetadata(workspaceRoot, event.textDocument.uri)
            const s3Url = await workspaceFolderManager.uploadToS3(fileMetadata)
            if (!s3Url) {
                return
            }

            const message = JSON.stringify({
                action: 'textDocument/didSave',
                message: {
                    textDocument: event.textDocument.uri,
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
                    filesMetadata = [await artifactManager.getFileMetadata(workspaceRoot, file.uri)]
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
                                    uri: file.uri,
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
            logging.log(`Documents deleted ${JSON.stringify(event)}`)
            if (!isLoggedInUsingBearerToken(credentialsProvider)) {
                return
            }
            for (const file of event.files) {
                let programmingLanguage = getCodeWhispererLanguageIdFromPath(file.uri)
                const result = workspaceFolderManager.getWorkspaceDetailsWithId(file.uri, workspaceFolders)
                if (!result) {
                    continue
                }
                const { workspaceDetails, workspaceRoot } = result
                const message = JSON.stringify({
                    method: 'workspace/didDeleteFiles',
                    params: {
                        files: [
                            {
                                // TODO, why do we send files one by one?
                                uri: file.uri,
                            },
                        ],
                        workspaceChangeMetadata: {
                            workspaceId: workspaceDetails.workspaceId,
                            s3Path: '',
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
            }
        })

        lsp.workspace.onDidRenameFiles(async event => {
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
                    filesMetadata = [await artifactManager.getFileMetadata(workspaceRoot, file.newUri)]
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
                                    old_uri: file.oldUri,
                                    new_uri: file.newUri,
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

        logging.log('Workspace context server has been initialized')

        return () => {}
    }
