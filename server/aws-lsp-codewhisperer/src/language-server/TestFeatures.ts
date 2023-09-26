import { Auth, Logging, Lsp, Telemetry, Workspace } from '@aws-placeholder/aws-language-server-runtimes/out/features'
import { Server } from '@aws-placeholder/aws-language-server-runtimes/out/runtimes'
import { StubbedInstance, stubInterface } from "ts-sinon"
import { TextDocument } from 'vscode-languageserver-textdocument'

// TODO move this to runtimes package once the test helpers stabilize
export class TestFeatures {
    auth: StubbedInstance<Auth>
    lsp: StubbedInstance<Lsp>
    workspace: StubbedInstance<Workspace>
    logging: StubbedInstance<Logging>
    telemetry: StubbedInstance<Telemetry>
    documents: {
        [uri: string]: TextDocument;
    }

    constructor() {
        this.auth = stubInterface<Auth>()
        this.lsp = stubInterface<Lsp>()
        this.workspace = stubInterface<Workspace>()
        this.logging = stubInterface<Logging>()
        this.telemetry = stubInterface<Telemetry>()
        this.documents = {}

        this.workspace.getTextDocument.callsFake(async (uri) => this.documents[uri])
    }

    start(server: Server) {
        server(this)
        return this
    }

    async doInlineCompletion(...args: Parameters<Parameters<Lsp['onInlineCompletion']>[0]>) {
        return this.lsp.onInlineCompletion.args[0][0](...args)
    }

    async doCompletion(...args: Parameters<Parameters<Lsp['onCompletion']>[0]>) {
        return this.lsp.onCompletion.args[0][0](...args)
    }

    openDocument(document: TextDocument) {
        this.documents[document.uri] = document
        return this
    }
}
