import { AwsLanguageService, UriResolver, textDocumentUtils } from '@aws/lsp-core/out/base'
import { JsonLanguageService } from '@aws/lsp-json'
import {
    Connection,
    InitializeParams,
    InitializeResult,
    TextDocumentSyncKind,
    TextDocuments,
} from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'

export type JsonSchemaServerProps = {
    connection: Connection
    defaultSchemaUri?: string
    uriResolver?: UriResolver
}

/**
 * Listens to an LSP connection and wraps JsonLanguageService to handle the calls
 */
export class JsonSchemaServer {
    /**
     * Options, provided by language server to `onInitialize` callback.
     */
    // protected options?: InitializeParams;
    /**
     * Text documents manager (see https://github.com/microsoft/vscode-languageserver-node/blob/main/server/src/common/textDocuments.ts#L68)
     */
    protected documents = new TextDocuments(TextDocument)

    protected jsonService: AwsLanguageService

    protected connection: Connection

    constructor(private readonly props: JsonSchemaServerProps) {
        this.connection = props.connection

        this.jsonService = new JsonLanguageService(props)

        this.connection.onInitialize((params: InitializeParams) => {
            // this.options = params;
            const result: InitializeResult = {
                // serverInfo: initialisationOptions?.serverInfo,
                capabilities: {
                    textDocumentSync: {
                        openClose: true,
                        change: TextDocumentSyncKind.Incremental,
                    },
                    completionProvider: { resolveProvider: true },
                    hoverProvider: true,
                    documentFormattingProvider: true,
                    // ...(initialisationOptions?.capabilities || {}),
                },
            }
            return result
        })
        this.registerHandlers()
        this.documents.listen(this.connection)
        this.connection.listen()

        this.connection.console.info(`Started JSON Schema language server, uri: ${props.defaultSchemaUri}`)
    }

    getTextDocument(uri: string): TextDocument {
        const textDocument = this.documents.get(uri)

        if (!textDocument) {
            throw new Error(`Document with uri ${uri} not found.`)
        }

        return textDocument
    }

    async validateDocument(uri: string): Promise<void> {
        const textDocument = this.getTextDocument(uri)

        if (this.jsonService.isSupported(textDocument) === false) {
            return
        }

        const diagnostics = await this.jsonService.doValidation(textDocument)
        this.connection.sendDiagnostics({ uri, version: textDocument.version, diagnostics })
    }

    registerHandlers() {
        this.documents.onDidOpen(({ document }) => {
            if (this.jsonService.isSupported(document) === false) {
                return
            }

            this.validateDocument(document.uri)
        })

        this.documents.onDidChangeContent(({ document }) => {
            if (this.jsonService.isSupported(document) === false) {
                return
            }
            this.validateDocument(document.uri)
        })

        this.connection.onCompletion(async ({ textDocument: requestedDocument, position }) => {
            const textDocument = this.getTextDocument(requestedDocument.uri)

            if (this.jsonService.isSupported(textDocument) === false) {
                return
            }

            return await this.jsonService.doComplete(textDocument, position)
        })

        this.connection.onCompletionResolve(item => item)

        this.connection.onHover(async ({ textDocument: requestedDocument, position }) => {
            const textDocument = this.getTextDocument(requestedDocument.uri)

            if (this.jsonService.isSupported(textDocument) === false) {
                return
            }

            return await this.jsonService.doHover(textDocument, position)
        })

        this.connection.onDocumentFormatting(async ({ textDocument: requestedDocument, options }) => {
            const textDocument = this.getTextDocument(requestedDocument.uri)

            if (this.jsonService.isSupported(textDocument) === false) {
                return
            }

            return this.jsonService.format(textDocument, textDocumentUtils.getFullRange(textDocument), options)
        })
    }
}
