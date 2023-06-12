import { AwsLanguageService, textDocumentUtils } from '@lsp-placeholder/aws-lsp-core'
import {
    Connection,
    InitializeParams,
    InitializeResult,
    TextDocumentSyncKind,
    TextDocuments,
} from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'

export type CloudFormationServerProps = {
    connection: Connection
    cloudformationService: AwsLanguageService
}

/**
 * This is a demonstration language server that handles both JSON and YAML files according to the
 * CloudFormation JSON Schema.
 *
 * This illustrates how we can wrap LSP Connection calls around a provided language service.
 * In this case, the service is a composition of a JSON processor and a YAML processor.
 */
export class CloudFormationServer {
    public static readonly serverId = 'aws-lsp-cloudformation'

    protected documents = new TextDocuments(TextDocument)

    protected cloudformationService: AwsLanguageService

    protected connection: Connection

    constructor(private readonly props: CloudFormationServerProps) {
        this.connection = props.connection

        this.cloudformationService = this.props.cloudformationService

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

        this.connection.console.info('AWS CloudFormation (json/yaml) language server started!')
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

        this.connection.console.info(`Validating document, languageId: ${textDocument.languageId}, uri: ${uri}...`)

        if (this.cloudformationService.isSupported(textDocument)) {
            const diagnostics = await this.cloudformationService.doValidation(textDocument)
            this.connection.sendDiagnostics({ uri, version: textDocument.version, diagnostics })
        }

        return
    }

    registerHandlers() {
        this.documents.onDidOpen(({ document }) => {
            this.connection.console.info(`Document opened, uri: ${document.uri}...`)

            this.validateDocument(document.uri)
        })

        this.documents.onDidChangeContent(({ document }) => {
            this.validateDocument(document.uri)
        })

        this.connection.onCompletion(async ({ textDocument: requestedDocument, position }) => {
            const textDocument = this.getTextDocument(requestedDocument.uri)

            if (this.cloudformationService.isSupported(textDocument)) {
                return await this.cloudformationService.doComplete(textDocument, position)
            }

            return
        })

        this.connection.onCompletionResolve(item => item)

        this.connection.onHover(async ({ textDocument: requestedDocument, position }) => {
            const textDocument = this.getTextDocument(requestedDocument.uri)

            this.connection.console.info(`Hover, languageId: ${textDocument.languageId}, uri: ${textDocument.uri}...`)

            if (this.cloudformationService.isSupported(textDocument)) {
                return await this.cloudformationService.doHover(textDocument, position)
            }

            return
        })

        this.connection.onDocumentFormatting(async ({ textDocument: requestedDocument, options }) => {
            const textDocument = this.getTextDocument(requestedDocument.uri)

            if (this.cloudformationService.isSupported(textDocument)) {
                return this.cloudformationService.format(
                    textDocument,
                    textDocumentUtils.getFullRange(textDocument),
                    options
                )
            }

            return
        })
    }
}
