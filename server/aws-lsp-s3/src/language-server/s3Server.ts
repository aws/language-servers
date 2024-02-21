import { AwsInitializationOptions, AwsLanguageService } from '@aws/lsp-core'
import {
    Connection,
    InitializeParams,
    InitializeResult,
    TextDocumentSyncKind,
    TextDocuments,
} from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'

export type S3ServerProps = {
    connection: Connection
    s3Service: AwsLanguageService
    onInitialize: (params: AwsInitializationOptions) => void
}

/**
 * This is a demonstration language server that populates a completion list
 * with an AWS Account's S3 Bucket names.
 *
 * This illustrates how we can use an AWS Service Client in an LSP.
 * It will be used to explore deeper integration concerns, like credentials.
 */
export class S3Server {
    public static readonly serverId = 'aws-lsp-s3'

    protected documents = new TextDocuments(TextDocument)

    protected s3Service: AwsLanguageService

    protected connection: Connection
    private initializationOptions?: AwsInitializationOptions

    constructor(private readonly props: S3ServerProps) {
        this.connection = props.connection

        this.s3Service = this.props.s3Service

        this.connection.onInitialize((params: InitializeParams) => {
            // this.options = params;
            this.initializationOptions = params.initializationOptions as AwsInitializationOptions
            this.props.onInitialize(this.initializationOptions)

            const result: InitializeResult = {
                // serverInfo: initialisationOptions?.serverInfo,
                capabilities: {
                    textDocumentSync: {
                        openClose: true,
                        change: TextDocumentSyncKind.Incremental,
                    },
                    completionProvider: { resolveProvider: true },
                },
            }
            return result
        })
        this.registerHandlers()
        this.documents.listen(this.connection)
        this.connection.listen()

        this.connection.console.info('AWS S3 (buckets) language server started!')
    }

    getTextDocument(uri: string): TextDocument {
        const textDocument = this.documents.get(uri)

        if (!textDocument) {
            throw new Error(`Document with uri ${uri} not found.`)
        }

        return textDocument
    }

    registerHandlers() {
        this.connection.onCompletion(async ({ textDocument: requestedDocument, position }) => {
            const textDocument = this.getTextDocument(requestedDocument.uri)

            try {
                if (this.s3Service.isSupported(textDocument)) {
                    return await this.s3Service.doComplete(textDocument, position)
                }
            } catch (err) {
                this.connection.console.error(`Error loading S3 Buckets: ${err}`)

                // TODO : handle error (eg: telemetry, etc)

                return null
            }

            return
        })

        this.connection.onCompletionResolve(item => item)
    }
}
