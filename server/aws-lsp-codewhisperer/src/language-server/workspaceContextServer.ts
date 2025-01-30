import {
    CredentialsProvider,
    InitializeParams,
    Server,
    Workspace,
    WorkspaceFolder,
} from '@aws/language-server-runtimes/server-interface'
import { CodeWhispererServiceToken } from './codeWhispererService'
import { WebSocketClient } from './serverContext/client'
import { findWorkspaceRoot, getProgrammingLanguageFromPath } from './serverContext/util'

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
        const { logging, lsp } = features
        let workspaceFolders: WorkspaceFolder[] = []

        /*
         TODO: This is only for testing purpose. It'll be replaced by the actual URL and
         client will only be created post customer OptIn and workspace creation on remote success
         */
        const wsClient = new WebSocketClient('ws://localhost:8080')
        wsClient.send('Hello server!')

        lsp.addInitializer((params: InitializeParams) => {
            workspaceFolders = params.workspaceFolders || []
            return {
                capabilities: {
                    workspace: {
                        fileOperations: {
                            didCreate: {
                                filters: [{ pattern: { glob: '**/*.{ts,tsx,java,py}' } }],
                            },
                            didRename: {
                                filters: [{ pattern: { glob: '**/*.{ts,tsx,java,py}' } }],
                            },
                            didDelete: {
                                filters: [{ pattern: { glob: '**/*.{ts,tsx,java,py}' } }],
                            },
                        },
                    },
                },
            }
        })

        lsp.workspace.onDidChangeWorkspaceFolders(params => {
            logging.log(`Workspace folders changed ${JSON.stringify(event)}`)
            params.event.added.forEach(folder => {
                workspaceFolders.push(folder)
            })
            params.event.removed.forEach(folder => {
                const index = workspaceFolders.findIndex(f => f.uri === folder.uri)
                if (index !== -1) {
                    workspaceFolders.splice(index, 1)
                }
            })
        })

        lsp.onDidSaveTextDocument(async event => {
            logging.log(`Document saved ${JSON.stringify(event)}`)
            const programmingLanguage = getProgrammingLanguageFromPath(event.textDocument.uri)
            if (programmingLanguage == 'Unknown') {
                return
            }
            const workspaceRoot = findWorkspaceRoot(event.textDocument.uri, workspaceFolders)
            // TODO: Implement zip & upload later

            wsClient.send(
                JSON.stringify({
                    action: 'didSave',
                    message: {
                        textDocument: event.textDocument.uri,
                        workspaceChangeMetadata: {
                            workspaceRoot: workspaceRoot,
                            s3Path: '', //TODO
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
