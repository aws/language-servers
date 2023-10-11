import {
    CredentialsProvider,
    Logging,
    Lsp,
    Telemetry,
    Workspace,
} from '@aws-placeholder/aws-language-server-runtimes/out/features'
import { InlineCompletionParams } from '@aws-placeholder/aws-language-server-runtimes/out/features/lsp/inline-completions/futureProtocol'
import { Server } from '@aws-placeholder/aws-language-server-runtimes/out/runtimes'
import { StubbedInstance, stubInterface } from 'ts-sinon'
import { CancellationToken, CompletionParams } from 'vscode-languageserver-protocol'
import { TextDocument } from 'vscode-languageserver-textdocument'

// TODO move this to runtimes package once the test helpers stabilize
export class TestFeatures {
    credentialsProvider: StubbedInstance<CredentialsProvider>
    lsp: StubbedInstance<Lsp>
    workspace: StubbedInstance<Workspace>
    logging: StubbedInstance<Logging>
    telemetry: StubbedInstance<Telemetry>
    documents: {
        [uri: string]: TextDocument
    }

    constructor() {
        this.credentialsProvider = stubInterface<CredentialsProvider>()
        this.lsp = stubInterface<Lsp>()
        this.workspace = stubInterface<Workspace>()
        this.logging = stubInterface<Logging>()
        this.telemetry = stubInterface<Telemetry>()
        this.documents = {}

        this.workspace.getTextDocument.callsFake(async uri => this.documents[uri])
    }

    start(server: Server) {
        server(this)
        return this
    }

    async doInlineCompletion(params: InlineCompletionParams, token: CancellationToken) {
        return this.lsp.onInlineCompletion.args[0][0](params, token)
    }

    async doCompletion(params: CompletionParams, token: CancellationToken) {
        return this.lsp.onCompletion.args[0][0](params, token)
    }

    openDocument(document: TextDocument) {
        this.documents[document.uri] = document
        return this
    }
}
