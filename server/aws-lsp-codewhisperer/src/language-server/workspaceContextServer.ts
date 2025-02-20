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
    uploadArtifactToS3,
} from './workspaceContext/util'
import { ArtifactManager, FileMetadata } from './workspaceContext/artifactManager'
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
                    await workspaceFolderManager.processNewWorkspaceFolders(addedFolders, {
                        didChangeWorkspaceFoldersAddition: true,
                    })
                }

                const removedFolders = params.event.removed
                if (removedFolders.length > 0) {
                    await artifactManager.removeWorkspaceFolders(removedFolders)
                    removedFolders.forEach(folder => {
                        const index = workspaceFolders.findIndex(f => f.uri === folder.uri)
                        if (index !== -1) {
                            workspaceFolders.splice(index, 1)
                            workspaceFolderManager.processWorkspaceFolderDeletion(folder)
                        }
                    })
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
            const programmingLanguage = getCodeWhispererLanguageIdFromPath(event.textDocument.uri)
            if (!programmingLanguage) {
                return
            }
            const workspaceRoot = findWorkspaceRoot(event.textDocument.uri, workspaceFolders)
            const workspaceRootFolder = findWorkspaceRootFolder(event.textDocument.uri, workspaceFolders)
            let s3Url = ''

            if (!workspaceRoot) {
                // No action needs to be taken if it's just a random file change which is not part of any workspace.
                return
            }

            if (workspaceRootFolder && artifactManager && credentialsProvider.getConnectionMetadata()?.sso?.startUrl) {
                try {
                    const fileMetadata = await artifactManager.getFileMetadata(
                        workspaceRootFolder,
                        event.textDocument.uri
                    )
                    const request: CreateUploadUrlRequest = {
                        contentMd5: fileMetadata.md5Hash,
                        artifactType: 'SourceCode',
                    }
                    const response = await cwsprClient.createUploadUrl(request)
                    s3Url = response.uploadUrl
                    await uploadArtifactToS3(Buffer.from(fileMetadata.content), fileMetadata.md5Hash, response)
                } catch (error) {
                    logging.log('Error while uploading artifact to s3 during file save event')
                }
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
            if (!artifactManager || !credentialsProvider.getConnectionMetadata()?.sso?.startUrl) {
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
            /*
                        // TODO, this is just sample code showing logic when the change event is a directory:
                        artifactManager
                            .addNewDirectories([URI.parse(event.files[0].uri)])
                            .then(fileMetadata => {
                                logging.log('Added new directories')
                                fileMetadata.forEach(file => {
                                    logging.log(`File path: ${file.filePath}`)
                                    logging.log(`Language: ${file.language}`)
                                    logging.log(`Content length: ${file.contentLength}`)
                                    logging.log(`Content: ${file.content}`)
                                })
                            })
                            .catch(error => {
                                logging.log(`Error adding new directories: ${error}`)
                            })
                        */
        })

        lsp.workspace.onDidDeleteFiles(async event => {
            logging.log(`Documents deleted ${JSON.stringify(event)}`)
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
            if (!artifactManager || !credentialsProvider.getConnectionMetadata()?.sso?.startUrl) {
                return
            }
            for (const file of event.files) {
                const isDir = isDirectory(file.newUri)
                const workspaceRoot = findWorkspaceRoot(file.newUri, workspaceFolders)
                const workspaceRootFolder = findWorkspaceRootFolder(file.newUri, workspaceFolders)
                if (!workspaceRoot || !workspaceRootFolder) {
                    return
                }
                const workspaceDetails = workspaceFolderManager.getWorkspaces().get(workspaceRoot)
                if (!workspaceDetails) {
                    logging.log(`Workspace folder ${workspaceRoot} is under processing`)
                    return
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
                        return
                    }
                    workspaceDetails.webSocketClient.send(message)
                }
            }
        })

        logging.log('Workspace context server has been initialized')

        return () => {}
    }
