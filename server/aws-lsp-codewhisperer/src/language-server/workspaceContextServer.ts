import {
    CredentialsProvider,
    InitializeParams,
    Server,
    Workspace,
    WorkspaceFolder,
} from '@aws/language-server-runtimes/server-interface'
import { CodeWhispererServiceToken } from './codeWhispererService'
import {
    findWorkspaceRoot,
    findWorkspaceRootFolder,
    isDirectory,
    isEmptyDirectory,
    isLoggedIn,
    uploadArtifactToS3,
} from './workspaceContext/util'
import {
    ArtifactManager,
    FileMetadata,
    SUPPORTED_WORKSPACE_CONTEXT_LANGUAGES,
} from './workspaceContext/artifactManager'
import { DEFAULT_AWS_Q_ENDPOINT_URL, DEFAULT_AWS_Q_REGION } from '../constants'
import { CreateUploadUrlRequest } from '../client/token/codewhispererbearertokenclient'
import { RemoteWorkspaceState, WorkspaceFolderManager } from './workspaceContext/workspaceFolderManager'
import { URI } from 'vscode-uri'
import { getCodeWhispererLanguageIdFromPath } from './languageDetection'

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
        let workspaceFolderManager: WorkspaceFolderManager

        const awsQRegion = runtime.getConfiguration('AWS_Q_REGION') ?? DEFAULT_AWS_Q_REGION
        const awsQEndpointUrl = runtime.getConfiguration('AWS_Q_ENDPOINT_URL') ?? DEFAULT_AWS_Q_ENDPOINT_URL
        const cwsprClient = service(credentialsProvider, workspace, awsQRegion, awsQEndpointUrl)

        lsp.addInitializer((params: InitializeParams) => {
            workspaceFolders = params.workspaceFolders || []
            if (params.workspaceFolders) {
                workspaceFolders = params.workspaceFolders
                artifactManager = new ArtifactManager(workspace, logging, workspaceFolders)
            } else {
                logging.error(`WORKSPACE FOLDERS IS NOT SET`)
            }
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
                    removedFolders.forEach(folder => {
                        const index = workspaceFolders.findIndex(f => f.uri === folder.uri)
                        if (index !== -1) {
                            workspaceFolders.splice(index, 1)
                            workspaceFolderManager.processWorkspaceFolderDeletion(folder)
                        }
                    })
                }

                if (addedFolders.length > 0 && isLoggedIn(credentialsProvider)) {
                    await workspaceFolderManager.processNewWorkspaceFolders(addedFolders, {
                        didChangeWorkspaceFoldersAddition: true,
                    })
                }

                if (removedFolders.length > 0 && isLoggedIn(credentialsProvider)) {
                    await artifactManager.removeWorkspaceFolders(removedFolders)
                }
            })

            if (artifactManager) {
                await workspaceFolderManager.processNewWorkspaceFolders(workspaceFolders, {
                    initialize: true,
                })
            }
        })

        lsp.onDidSaveTextDocument(async event => {
            logging.log(`Document saved ${JSON.stringify(event)}`)
            if (!isLoggedIn(credentialsProvider)) {
                return
            }
            const programmingLanguage = getCodeWhispererLanguageIdFromPath(event.textDocument.uri)
            if (!programmingLanguage || !SUPPORTED_WORKSPACE_CONTEXT_LANGUAGES.includes(programmingLanguage)) {
                return
            }
            const workspaceRoot = findWorkspaceRoot(event.textDocument.uri, workspaceFolders)
            const workspaceRootFolder = findWorkspaceRootFolder(event.textDocument.uri, workspaceFolders)
            let s3Url: string | undefined

            if (!workspaceRoot) {
                return
            }

            if (workspaceRootFolder && artifactManager) {
                const fileMetadata = await artifactManager.getFileMetadata(workspaceRootFolder, event.textDocument.uri)
                s3Url = await workspaceFolderManager.uploadToS3(fileMetadata)
            }

            if (!s3Url) {
                return
            }

            const workspaceDetails = workspaceFolderManager.getWorkspaces().get(workspaceRoot)
            if (!workspaceDetails) {
                logging.log(`Workspace folder ${workspaceRoot} is under processing`)
                return
            }
            const message = JSON.stringify({
                action: 'didSave',
                message: {
                    textDocument: event.textDocument.uri,
                    workspaceChangeMetadata: {
                        workspaceRoot: workspaceRoot,
                        s3Path: s3Url,
                        programmingLanguage: programmingLanguage,
                    },
                },
            })
            if (!workspaceDetails.webSocketClient) {
                logging.log(`Websocket client is not connected yet: ${workspaceRoot}`)
                workspaceDetails.messageQueue?.push(message)
                return
            }
            workspaceDetails.webSocketClient.send(message)
        })

        lsp.workspace.onDidCreateFiles(async event => {
            logging.log(`Documents created ${JSON.stringify(event)}`)
            if (!artifactManager || !isLoggedIn(credentialsProvider)) {
                return
            }
            for (const file of event.files) {
                const isDir = isDirectory(file.uri)
                const workspaceRoot = findWorkspaceRoot(file.uri, workspaceFolders)
                const workspaceRootFolder = findWorkspaceRootFolder(file.uri, workspaceFolders)
                if (!workspaceRoot || !workspaceRootFolder) {
                    continue
                }
                const workspaceDetails = workspaceFolderManager.getWorkspaces().get(workspaceRoot)
                if (!workspaceDetails) {
                    logging.log(`Workspace folder ${workspaceRoot} is under processing`)
                    continue
                }

                let filesMetadata: FileMetadata[] = []
                if (isDir && isEmptyDirectory(file.uri)) {
                    continue
                } else if (isDir) {
                    filesMetadata = await artifactManager.addNewDirectories([URI.parse(file.uri)])
                } else {
                    filesMetadata = [await artifactManager.getFileMetadata(workspaceRootFolder, file.uri)]
                }

                logging.log(`Files metadata created: ${JSON.stringify(filesMetadata)}`)

                for (const fileMetadata of filesMetadata) {
                    const s3Url = await workspaceFolderManager.uploadToS3(fileMetadata)
                    if (!s3Url) {
                        continue
                    }
                    const message = JSON.stringify({
                        action: 'didCreateFiles',
                        message: {
                            files: [
                                {
                                    uri: file.uri,
                                },
                            ],
                            workspaceChangeMetadata: {
                                workspaceRoot: workspaceRoot,
                                s3Path: s3Url,
                                programmingLanguage: fileMetadata.language,
                            },
                        },
                    })
                    if (!workspaceDetails.webSocketClient) {
                        logging.log(`Websocket client is not connected yet: ${workspaceRoot}`)
                        workspaceDetails.messageQueue?.push(message)
                        continue
                    }
                    workspaceDetails.webSocketClient.send(message)
                }
            }
        })

        lsp.workspace.onDidDeleteFiles(async event => {
            logging.log(`Documents deleted ${JSON.stringify(event)}`)
            if (!isLoggedIn(credentialsProvider)) {
                return
            }
            for (const file of event.files) {
                let programmingLanguage = getCodeWhispererLanguageIdFromPath(file.uri)
                const workspaceRoot = findWorkspaceRoot(file.uri, workspaceFolders)
                if (!workspaceRoot) {
                    continue
                }
                const workspaceDetails = workspaceFolderManager.getWorkspaces().get(workspaceRoot)
                if (!workspaceDetails) {
                    logging.log(`Workspace folder ${workspaceRoot} is under processing`)
                    continue
                }
                const message = JSON.stringify({
                    action: 'didDeleteFiles',
                    message: {
                        files: [
                            {
                                uri: file.uri,
                            },
                        ],
                        workspaceChangeMetadata: {
                            workspaceRoot: workspaceRoot,
                            s3Path: '',
                            programmingLanguage: programmingLanguage,
                        },
                    },
                })
                if (!workspaceDetails.webSocketClient) {
                    logging.log(`Websocket client is not connected yet: ${workspaceRoot}`)
                    workspaceDetails.messageQueue?.push(message)
                    continue
                }
                workspaceDetails.webSocketClient.send(message)
            }
        })

        lsp.workspace.onDidRenameFiles(async event => {
            logging.log(`Documents renamed ${JSON.stringify(event)}`)
            if (!artifactManager || !isLoggedIn(credentialsProvider)) {
                return
            }
            for (const file of event.files) {
                const isDir = isDirectory(file.newUri)
                const workspaceRoot = findWorkspaceRoot(file.newUri, workspaceFolders)
                const workspaceRootFolder = findWorkspaceRootFolder(file.newUri, workspaceFolders)
                if (!workspaceRoot || !workspaceRootFolder) {
                    continue
                }
                const workspaceDetails = workspaceFolderManager.getWorkspaces().get(workspaceRoot)
                if (!workspaceDetails) {
                    logging.log(`Workspace folder ${workspaceRoot} is under processing`)
                    continue
                }

                let filesMetadata: FileMetadata[] = []
                if (isDir && isEmptyDirectory(file.newUri)) {
                    continue
                } else if (isDir) {
                    filesMetadata = await artifactManager.addNewDirectories([URI.parse(file.newUri)])
                } else {
                    filesMetadata = [await artifactManager.getFileMetadata(workspaceRootFolder, file.newUri)]
                }

                logging.log(`Files metadata renamed: ${JSON.stringify(filesMetadata)}`)

                for (const fileMetadata of filesMetadata) {
                    const s3Url = await workspaceFolderManager.uploadToS3(fileMetadata)
                    if (!s3Url) {
                        continue
                    }
                    const message = JSON.stringify({
                        action: 'didRenameFiles',
                        message: {
                            files: [
                                {
                                    oldUri: file.oldUri,
                                    newUri: file.newUri,
                                },
                            ],
                            workspaceChangeMetadata: {
                                workspaceRoot: workspaceRoot,
                                s3Path: s3Url,
                                programmingLanguage: fileMetadata.language,
                            },
                        },
                    })
                    if (!workspaceDetails.webSocketClient) {
                        logging.log(`Websocket client is not connected yet: ${workspaceRoot}`)
                        workspaceDetails.messageQueue?.push(message)
                        continue
                    }
                    workspaceDetails.webSocketClient.send(message)
                }
            }
        })

        logging.log('Workspace context server has been initialized')

        return () => {}
    }
