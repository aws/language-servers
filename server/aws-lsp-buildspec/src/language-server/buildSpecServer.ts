import {
    AwsLanguageService,
    MutuallyExclusiveLanguageService,
    UriResolver,
    completionItemUtils,
    textDocumentUtils,
} from '@aws/lsp-core'
import { JsonLanguageService } from '@aws/lsp-json'
import { YamlLanguageService } from '@aws/lsp-yaml'
import {
    Connection,
    InitializeParams,
    InitializeResult,
    TextDocumentSyncKind,
    TextDocuments,
} from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'

export type BuildspecServerProps = {
    connection: Connection
    defaultSchemaUri: string
    uriResolver: UriResolver
}

/**
 * This is a demonstration language server that handles both JSON and YAML files according to the
 * CodeBuild BuildSpec JSON Schema.
 *
 * This illustrates how we can wrap LSP Connection calls around a composition of different language services.
 * In this case, the composition consists of a JSON processor and a YAML processor.
 */
export class BuildspecServer {
    public static readonly serverId = 'aws-lsp-buildspec'

    protected documents = new TextDocuments(TextDocument)

    protected buildSpecService: AwsLanguageService

    protected connection: Connection

    constructor(private readonly props: BuildspecServerProps) {
        this.connection = props.connection

        this.buildSpecService = new MutuallyExclusiveLanguageService([
            new JsonLanguageService(props),
            new YamlLanguageService({
                displayName: BuildspecServer.serverId,
                ...props,
            }),
        ])

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

        this.connection.console.info('AWS Buildspec (json/yaml) language server started!')
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

        const diagnostics = await this.buildSpecService.doValidation(textDocument)
        this.connection.sendDiagnostics({ uri, version: textDocument.version, diagnostics })
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

            const results = await this.buildSpecService.doComplete(textDocument, position)

            if (results!) {
                completionItemUtils.prependItemDetail(results.items, BuildspecServer.serverId)
            }

            return results
        })

        this.connection.onCompletionResolve(item => item)

        this.connection.onHover(async ({ textDocument: requestedDocument, position }) => {
            const textDocument = this.getTextDocument(requestedDocument.uri)

            this.connection.console.info(`Hover, languageId: ${textDocument.languageId}, uri: ${textDocument.uri}...`)

            return await this.buildSpecService.doHover(textDocument, position)
        })

        this.connection.onDocumentFormatting(async ({ textDocument: requestedDocument, options }) => {
            const textDocument = this.getTextDocument(requestedDocument.uri)

            return this.buildSpecService.format(textDocument, textDocumentUtils.getFullRange(textDocument), options)
        })
    }
}
