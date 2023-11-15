import {
    CredentialsProvider,
    Logging,
    Lsp,
    Telemetry,
    Workspace,
} from '@aws-placeholder/aws-language-server-runtimes/out/features'
import { Server } from '@aws-placeholder/aws-language-server-runtimes/out/runtimes'
import { StubbedInstance, stubInterface } from 'ts-sinon'
import { CancellationToken, CompletionParams, InlineCompletionParams } from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'

// TODO move this to runtimes package once the test helpers stabilize
/**
 * A test helper package to test Server implementations. Accepts a single callback
 * registration for each LSP event. You can use this helper to trigger LSP events
 * as many times as you want, calling the first registered callback with the event
 * params.
 *
 * You could instrument the stubs for all Features, but this is discouraged over
 * testing the effects and responses.
 */
export class TestFeatures {
    credentialsProvider: StubbedInstance<CredentialsProvider>
    // TODO: This needs to improve, somehow sinon doesn't stub nested objects
    lsp: StubbedInstance<Lsp> & { workspace: StubbedInstance<Lsp['workspace']> } & {
        extensions: StubbedInstance<Lsp['extensions']>
    }
    workspace: StubbedInstance<Workspace>
    logging: StubbedInstance<Logging>
    telemetry: StubbedInstance<Telemetry>
    documents: {
        [uri: string]: TextDocument
    }

    constructor() {
        this.credentialsProvider = stubInterface<CredentialsProvider>()
        this.lsp = stubInterface<
            Lsp & { workspace: StubbedInstance<Lsp['workspace']> } & { extensions: StubbedInstance<Lsp['extensions']> }
        >()
        this.lsp.workspace = stubInterface<typeof this.lsp.workspace>()
        this.lsp.extensions = stubInterface<typeof this.lsp.extensions>()
        this.workspace = stubInterface<Workspace>()
        this.logging = stubInterface<Logging>()
        this.telemetry = stubInterface<Telemetry>()
        this.documents = {}

        this.workspace.getTextDocument.callsFake(async uri => this.documents[uri])
    }

    async start(server: Server) {
        server(this)
        return Promise.resolve(this).then(f => {
            this.lsp.onInitialized.args[0][0]({})
            return f
        })
    }

    async doInlineCompletion(params: InlineCompletionParams, token: CancellationToken) {
        return this.lsp.onInlineCompletion.args[0][0](params, token)
    }

    async doCompletion(params: CompletionParams, token: CancellationToken) {
        return this.lsp.onCompletion.args[0][0](params, token)
    }

    async doInlineCompletionWithReferences(
        ...args: Parameters<Parameters<Lsp['extensions']['onInlineCompletionWithReferences']>[0]>
    ) {
        return this.lsp.extensions.onInlineCompletionWithReferences.args[0][0](...args)
    }

    async doLogInlineCompelitionSessionResults(
        ...args: Parameters<Parameters<Lsp['extensions']['onLogInlineCompelitionSessionResults']>[0]>
    ) {
        return this.lsp.extensions.onLogInlineCompelitionSessionResults.args[0][0](...args)
    }

    openDocument(document: TextDocument) {
        this.documents[document.uri] = document
        return this
    }

    doChangeConfiguration() {
        return Promise.resolve(this).then(f => {
            this.lsp.didChangeConfiguration.args[0][0]({ settings: undefined })
            return f
        })
    }
}
