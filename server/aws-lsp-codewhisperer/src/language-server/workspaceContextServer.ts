import {
    CredentialsProvider,
    InitializeParams,
    Server,
    Workspace,
} from '@aws/language-server-runtimes/server-interface'
import { CodeWhispererServiceToken } from './codeWhispererService'

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

        lsp.addInitializer((params: InitializeParams) => {
            return {
                capabilities: {
                    workspace: {
                        fileOperations: {
                            didCreate: {
                                filters: [{ pattern: { glob: '**/*.{ts,tsx}' } }],
                            },
                            didRename: {
                                filters: [{ pattern: { glob: '**/*.{ts,tsx}' } }],
                            },
                            didDelete: {
                                filters: [{ pattern: { glob: '**/*.{ts,tsx}' } }],
                            },
                        },
                    },
                },
            }
        })

        lsp.onDidSaveTextDocument(async event => {
            logging.log(`Document saved ${JSON.stringify(event)}`)
        })
        lsp.workspace.onDidCreateFiles(async event => {
            logging.log(`Document created ${JSON.stringify(event)}`)
        })
        lsp.workspace.onDidChangeWorkspaceFolders(async event => {
            logging.log(`Workspace folders changed ${JSON.stringify(event)}`)
        })
        lsp.workspace.onDidDeleteFiles(async event => {
            logging.log(`Document deleted ${JSON.stringify(event)}`)
        })
        lsp.workspace.onDidRenameFiles(async event => {
            logging.log(`Document renamed ${JSON.stringify(event)}`)
        })

        logging.log('Workspace context server has been initialized')

        return () => {}
    }
