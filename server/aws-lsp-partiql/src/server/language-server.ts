import {
    TextDocument,
    TextDocumentSyncKind,
    SemanticTokensParams,
    SemanticTokens,
    CancellationToken,
    type DidChangeTextDocumentParams,
    type DidOpenTextDocumentParams,
    type Server,
} from '@aws/language-server-runtimes/server-interface'
import { createPartiQLLanguageService } from './language-service'
import { semanticTokensLegend } from './syntax-highlighting/util'

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
                    semanticTokensProvider: {
                        legend: semanticTokensLegend,
                        full: true,
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

        const onSemanticTokensHandler = async (
            params: SemanticTokensParams,
            _token: CancellationToken
        ): Promise<SemanticTokens | null> => {
            const textDocument = await workspace.getTextDocument(params.textDocument.uri)
            if (!textDocument) {
                logging.log(`textDocument [${params.textDocument.uri}] not found`)
                return null
            }

            const tokens = await service.doSemanticTokens(textDocument)
            return tokens
        }

        lsp.onInitialized(onInitializedHandler)
        lsp.onDidChangeTextDocument(onDidChangeTextDocumentHandler)
        lsp.onDidOpenTextDocument(onDidOpenTextDocumentHandler)
        lsp.addInitializer(onInitializeHandler)
        lsp.onSemanticTokens(onSemanticTokensHandler)

        logging.log('The PartiQL LSP Language Server has been initialised')

        // disposable
        return () => {
            // Do nothing
        }
    }

export const PartiQLLanguageServer = PartiQLServerFactory(createPartiQLLanguageService())
