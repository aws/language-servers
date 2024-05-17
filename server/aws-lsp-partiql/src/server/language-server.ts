import { type DidChangeTextDocumentParams, type Server } from '@aws/language-server-runtimes/server-interface'
import { TextDocumentSyncKind, type DidOpenTextDocumentParams } from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { createPartiQLLanguageService } from './language-service'

export const PartiQLServerFactory =
    (service: any): Server =>
    ({ lsp, workspace, telemetry, logging }) => {
        const onInitializeHandler = () => {
            return {
                capabilities: {
                    hoverProvider: false,
                    textDocumentSync: {
                        openClose: true,
                        change: TextDocumentSyncKind.Incremental,
                    },
                },
            }
        }

        const onInitializedHandler = async () => {}

        const onDidChangeTextDocumentHandler = async (params: DidChangeTextDocumentParams): Promise<any> => {
            const textDocument = await workspace.getTextDocument(params.textDocument.uri)
            if (!textDocument) {
                logging.log(`textDocument [${params.textDocument.uri}] not found`)
                return
            }

            const diagnostics = await service.doValidation(textDocument)

            await lsp.publishDiagnostics({
                uri: params.textDocument.uri,
                diagnostics: diagnostics,
                version: textDocument.version,
            })
        }

        const onDidOpenTextDocumentHandler = async (params: DidOpenTextDocumentParams): Promise<any> => {
            let textDocument = await workspace.getTextDocument(params.textDocument.uri)
            if (!textDocument) {
                textDocument = TextDocument.create(
                    params.textDocument.uri,
                    params.textDocument.languageId,
                    params.textDocument.version,
                    params.textDocument.text
                )
            }

            const diagnostics = await service.doValidation(textDocument)

            await lsp.publishDiagnostics({
                uri: params.textDocument.uri,
                diagnostics: diagnostics,
                version: textDocument.version,
            })
        }

        lsp.onInitialized(onInitializedHandler)
        lsp.onDidChangeTextDocument(onDidChangeTextDocumentHandler)
        lsp.onDidOpenTextDocument(onDidOpenTextDocumentHandler)
        lsp.addInitializer(onInitializeHandler)

        logging.log('The PartiQL LSP Language Server has been initialised')

        // disposable
        return () => {
            // Do nothing
        }
    }

export const PartiQLLanguageServer = PartiQLServerFactory(createPartiQLLanguageService())
