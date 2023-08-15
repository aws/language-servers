import { AwsInitializationOptions, AwsLanguageService } from '@lsp-placeholder/aws-lsp-core'
import {
    CancellationToken,
    CompletionParams,
    Connection,
    InitializeParams,
    InitializeResult,
    TextDocumentSyncKind,
    TextDocuments,
} from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { InlineCompletionParams, inlineCompletionRequestType } from '../inline/futureProtocol'
import { InlineCompletionList } from '../inline/futureTypes'
import { CodeWhispererService } from './codeWhispererService'

export type CodeWhispererServerProps = {
    connection: Connection
    codeWhispererService: AwsLanguageService
    onInitialize: (params: AwsInitializationOptions) => void
}

/**
 * This is a demonstration language server that gets code recommendations from
 * CodeWisperer.
 *
 * It will be used to explore deeper integration concerns, like providing bearer token access.
 */
export class CodeWhispererServer {
    public static readonly serverId = 'aws-lsp-codewhisperer'

    protected documents = new TextDocuments(TextDocument)

    // HACK: Ideally we keep things to the standard AwsLanguageService interface
    // For now we're experimenting with service calls.
    protected service: CodeWhispererService

    protected connection: Connection
    private initializationOptions?: AwsInitializationOptions

    constructor(private readonly props: CodeWhispererServerProps) {
        this.connection = props.connection

        this.service = this.props.codeWhispererService as CodeWhispererService

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
                    completionProvider: {
                        resolveProvider: true,
                        completionItem: {
                            labelDetailsSupport: true,
                        },
                    },
                },
            }
            return result
        })
        this.registerHandlers()
        this.documents.listen(this.connection)
        this.connection.listen()

        this.connection.console.info('AWS CodeWhisperer language server started!')
    }

    getTextDocument(uri: string): TextDocument {
        const textDocument = this.documents.get(uri)

        if (!textDocument) {
            throw new Error(`Document with uri ${uri} not found.`)
        }

        return textDocument
    }

    registerHandlers() {
        // TODO : Design Note: inline completions are not a part of the LSP spec, so
        // we define our own (with message name aws/textDocument/inlineCompletion).
        // This implementation follows the proposal
        // in https://github.com/microsoft/language-server-protocol/pull/1673 (protocol)
        // and https://github.com/microsoft/vscode-languageserver-node/pull/1190 (vscode-languageserver-node libraries)
        // If/when it is added to the spec, we can transition this code over the spec,
        // release servers with new major versions, and update the Toolkit clients appropriately.
        this.connection.onRequest(inlineCompletionRequestType, async (params: InlineCompletionParams, token) => {
            const results: InlineCompletionList = {
                items: [],
            }

            try {
                const textDocument = this.getTextDocument(params.textDocument.uri)
                if (this.service.isSupported(textDocument)) {
                    return await this.service.doInlineCompletion({
                        textDocument,
                        position: params.position,
                        context: params.context,
                        token,
                    })
                }
            } catch (err) {
                this.connection.console.error(`Recommendation failure: ${err}`)
            }

            return results
        })

        this.connection.onCompletion(async (params: CompletionParams, token: CancellationToken) => {
            const textDocument = this.getTextDocument(params.textDocument.uri)

            if (this.service.isSupported(textDocument)) {
                return await this.service.doComplete2({
                    textDocument,
                    position: params.position,
                    token,
                })
            }

            return
        })

        this.connection.onCompletionResolve(item => item)
    }
}
