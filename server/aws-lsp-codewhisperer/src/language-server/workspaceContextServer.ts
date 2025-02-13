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

        /*
                     TODO: This is only for testing purpose. It'll be replaced by the actual URL and
                     client will only be created post customer OptIn and workspace creation on remote success
                     */
        const wsClient = new WebSocketClient('ws://localhost:8080')
        wsClient.send('Hello server!')

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
            workspaceFolderManager = new WorkspaceFolderManager(cwsprClient)

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
                                filters: [{ pattern: { glob: '**/*' } }],
                            },
                        },
                    },
                },
            }
        })

        lsp.onInitialized(params => {
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

            workspaceFolders.forEach(folder => {
                workspaceFolderManager.processNewWorkspaceFolder(folder)
            })

            workspaceFolderManager.pollWorkspaceState([...workspaceFolderManager.getWorkspaces().keys()])

            if (!workspaceFolders || workspaceFolders.length === 0) {
                return
            }
            artifactManager
                .createLanguageArtifacts()
                .then(() => {
                    logging.log(`Artifacts created`)
                })
                .catch(error => {
                    logging.log(`Error creating artifacts: ${error}`)
                })
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

            wsClient.send(
                JSON.stringify({
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
            )
        })
        lsp.workspace.onDidCreateFiles(async event => {
            logging.log(`Document created ${JSON.stringify(event)}`)

            const programmingLanguage = getProgrammingLanguageFromPath(event.files[0].uri)
            if (programmingLanguage == 'Unknown') {
                return
            }

            const workspaceRoot = findWorkspaceRoot(event.files[0].uri, workspaceFolders)
            wsClient.send(
                JSON.stringify({
                    action: 'didCreateFiles',
                    message: {
                        files: event.files,
                        workspaceChangeMetadata: {
                            workspaceRoot: workspaceRoot,
                            s3Path: '', //TODO
                            programmingLanguage: programmingLanguage,
                        },
                    },
                })
            )
        })

        lsp.workspace.onDidDeleteFiles(async event => {
            logging.log(`Document deleted ${JSON.stringify(event)}`)

            const programmingLanguage = getProgrammingLanguageFromPath(event.files[0].uri)
            if (programmingLanguage == 'Unknown') {
                return
            }
            const workspaceRoot = findWorkspaceRoot(event.files[0].uri, workspaceFolders)
            wsClient.send(
                JSON.stringify({
                    action: 'didDeleteFiles',
                    message: {
                        files: event.files,
                        workspaceChangeMetadata: {
                            workspaceRoot: workspaceRoot,
                            s3Path: '', //TODO
                            programmingLanguage: programmingLanguage,
                        },
                    },
                })
            )
        })

        lsp.workspace.onDidRenameFiles(async event => {
            logging.log(`Document renamed ${JSON.stringify(event)}`)

            const programmingLanguage = getProgrammingLanguageFromPath(event.files[0].newUri)
            if (programmingLanguage == 'Unknown') {
                return
            }
            const workspaceRoot = findWorkspaceRoot(event.files[0].newUri, workspaceFolders)
            wsClient.send(
                JSON.stringify({
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
            )
        })

        logging.log('Workspace context server has been initialized')

        return () => {}
    }
