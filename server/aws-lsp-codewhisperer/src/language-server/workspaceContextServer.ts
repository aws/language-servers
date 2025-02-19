import {
    CredentialsProvider,
    InitializeParams,
    Server,
    Workspace,
    WorkspaceFolder,
} from '@aws/language-server-runtimes/server-interface'
import { CodeWhispererServiceToken } from './codeWhispererService'
import { WebSocketClient } from './workspaceContext/client'
import {
    findWorkspaceRoot,
    findWorkspaceRootFolder,
    getProgrammingLanguageFromPath,
    isDirectory,
    uploadArtifactToS3,
} from './workspaceContext/util'
import { ArtifactManager } from './workspaceContext/artifactManager'
import { DEFAULT_AWS_Q_ENDPOINT_URL, DEFAULT_AWS_Q_REGION } from '../constants'
import { CreateUploadUrlRequest } from '../client/token/codewhispererbearertokenclient'
import { md5 } from 'js-md5'
import { RemoteWorkspaceState, WorkspaceFolderManager } from './workspaceContext/workspaceFolderManager'

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
        const { logging, lsp, workspace, runtime, credentialsProvider } = features
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
            workspaceFolderManager = new WorkspaceFolderManager(cwsprClient, logging)

            return {
                capabilities: {
                    workspace: {
                        workspaceFolders: {
                            supported: true,
                            changeNotifications: true,
                        },
                        fileOperations: {
                            didCreate: {
                                filters: [{ pattern: { glob: '**/*' } }],
                            },
                            didRename: {
                                filters: [{ pattern: { glob: '**/*' } }],
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
                params.event.added.forEach(folder => {
                    workspaceFolders.push(folder)
                    workspaceFolderManager.processWorkspaceFolderAddition(folder)
                })
                params.event.removed.forEach(folder => {
                    const index = workspaceFolders.findIndex(f => f.uri === folder.uri)
                    if (index !== -1) {
                        workspaceFolders.splice(index, 1)
                        workspaceFolderManager.processWorkspaceFolderDeletion(folder)
                    }
                })
            })

            for (const folder of workspaceFolders) {
                await workspaceFolderManager.processNewWorkspaceFolder(folder)
            }

            workspaceFolderManager.pollWorkspaceState([...workspaceFolderManager.getWorkspaces().keys()])

            if (!workspaceFolders || workspaceFolders.length === 0) {
                return
            }
            artifactManager
                .createLanguageArtifacts()
                .then(fileMetadata => {
                    logging.log('Artifacts created')
                    fileMetadata.forEach(file => {
                        logging.log(`File path: ${file.filePath}`)
                        logging.log(`Language: ${file.language}`)
                        logging.log(`Content length: ${file.contentLength}`)
                    })
                })
                .catch(error => {
                    logging.log(`Error creating artifacts: ${error}`)
                })
            /*
            TODO: 1. upload per workspace artifact
            TODO: 2. emit an event for addition of workspace/s
            For each workspace, emit per langauge zip events separately.
            Add a message to queue or emit, depending on the state of web socket client
            */
        })

        lsp.onDidSaveTextDocument(async event => {
            logging.log(`Document saved ${JSON.stringify(event)}`)
            const programmingLanguage = getProgrammingLanguageFromPath(event.textDocument.uri)
            if (programmingLanguage == 'Unknown') {
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
                        contentMd5: md5.base64(Buffer.from(fileMetadata.content)),
                        artifactType: 'SourceCode',
                    }
                    const response = await cwsprClient.createUploadUrl(request)
                    s3Url = response.uploadUrl
                    await uploadArtifactToS3(Buffer.from(fileMetadata.content), response)
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
            logging.log(`Document created ${JSON.stringify(event)}`)

            const isDir = isDirectory(event.files[0].uri)
            let programmingLanguage = getProgrammingLanguageFromPath(event.files[0].uri)
            if (!isDir && programmingLanguage == 'Unknown') {
                return
            }
            programmingLanguage = isDir ? '' : programmingLanguage

            const workspaceRoot = findWorkspaceRoot(event.files[0].uri, workspaceFolders)
            if (!workspaceRoot) {
                // No action needs to be taken if it's just a random file change which is not part of any workspace.
                return
            }
            const workspaceDetails = workspaceFolderManager.getWorkspaces().get(workspaceRoot)
            if (!workspaceDetails) {
                logging.log(`Workspace folder ${workspaceRoot} is under processing`)
                return
            }
            /* TODO: In case of directory, check the below conditions:
                - empty directory - do not emit event
                - directory with files - zip, upload, emit */
            const message = JSON.stringify({
                action: 'didCreateFiles',
                message: {
                    files: event.files,
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
                return
            }
            workspaceDetails.webSocketClient.send(message)
        })

        lsp.workspace.onDidDeleteFiles(async event => {
            logging.log(`Documents deleted ${JSON.stringify(event)}`)
            for (const file of event.files) {
                let programmingLanguage = getProgrammingLanguageFromPath(file.uri)
                if (programmingLanguage == 'Unknown') {
                    programmingLanguage = 'Undefined'
                }
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
            logging.log(`Document renamed ${JSON.stringify(event)}`)

            const isDir = isDirectory(event.files[0].newUri)
            let programmingLanguage = getProgrammingLanguageFromPath(event.files[0].newUri)
            if (!isDir && programmingLanguage == 'Unknown') {
                return
            }
            programmingLanguage = isDir ? '' : programmingLanguage
            const workspaceRoot = findWorkspaceRoot(event.files[0].newUri, workspaceFolders)
            if (!workspaceRoot) {
                // No action needs to be taken if it's just a random file change which is not part of any workspace.
                return
            }
            const workspaceDetails = workspaceFolderManager.getWorkspaces().get(workspaceRoot)
            if (!workspaceDetails) {
                logging.log(`Workspace folder ${workspaceRoot} is under processing`)
                return
            }
            /* TODO: In case of directory, check the below conditions:
                - empty directory - do not emit event
                - directory with files - zip, upload, emit */
            const message = JSON.stringify({
                action: 'didRenameFiles',
                message: {
                    files: event.files,
                    workspaceChangeMetadata: {
                        workspaceRoot: workspaceRoot,
                        s3Path: '', //TODO
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

        logging.log('Workspace context server has been initialized')

        return () => {}
    }
