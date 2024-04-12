import { Server } from '@aws/language-server-runtimes'
import { CredentialsProvider, Logging, Lsp, Telemetry, Workspace } from '@aws/language-server-runtimes/out/features'
import { StubbedInstance, stubInterface } from 'ts-sinon'
import {
    CancellationToken,
    CompletionParams,
    DidChangeConfigurationParams,
    DidChangeTextDocumentParams,
    DidOpenTextDocumentParams,
    ExecuteCommandParams,
    InitializedParams,
    InlineCompletionParams,
} from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'

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
    lsp: StubbedInstance<Lsp> & {
        workspace: StubbedInstance<Lsp['workspace']>
    } & {
        extensions: StubbedInstance<Lsp['extensions']>
    }
    workspace: StubbedInstance<Workspace>
    logging: StubbedInstance<Logging>
    telemetry: StubbedInstance<Telemetry>
    documents: {
        [uri: string]: TextDocument
    }

    events: ({ type: string; req: any; res: any } | { type: string; notification: any })[]

    private disposables: (() => void)[] = []

    constructor() {
        this.events = []
        this.credentialsProvider = stubInterface<CredentialsProvider>()
        this.lsp = stubInterface<
            Lsp & { workspace: StubbedInstance<Lsp['workspace']> } & {
                extensions: StubbedInstance<Lsp['extensions']>
            }
        >()
        this.lsp.workspace = stubInterface<typeof this.lsp.workspace>()
        this.lsp.extensions = stubInterface<typeof this.lsp.extensions>()
        this.workspace = stubInterface<Workspace>()
        this.logging = stubInterface<Logging>()
        this.telemetry = stubInterface<Telemetry>()
        this.documents = {}

        this.workspace.getTextDocument.callsFake(async uri => this.documents[uri])
    }

    onGetConfiguration(result: any) {
        this.lsp.workspace.getConfiguration.callsFake(s => {
            this.events.push({
                type: 'workspace/configuration',
                req: s,
                res: result,
            })

            return Promise.resolve(result)
        })
    }

    async start(server: Server) {
        this.disposables.push(server(this))
        return Promise.resolve(this).then(f => {
            this.events.push({
                type: 'initialized',
                notification: {} as InitializedParams,
            })
            this.lsp.onInitialized.args[0]?.[0]({})
            return f
        })
    }

    async doInlineCompletion(params: InlineCompletionParams, token: CancellationToken) {
        return this.lsp.onInlineCompletion.args[0]?.[0](params, token)
    }

    async doCompletion(params: CompletionParams, token: CancellationToken) {
        return this.lsp.onCompletion.args[0]?.[0](params, token)
    }

    async doInlineCompletionWithReferences(
        ...args: Parameters<Parameters<Lsp['extensions']['onInlineCompletionWithReferences']>[0]>
    ) {
        const result = await this.lsp.extensions.onInlineCompletionWithReferences.args[0]?.[0](...args)

        this.events.push({
            type: 'aws/textDocument/inlineCompletionWithReferences',
            req: args[0],
            res: result,
        })

        return result
    }

    async doLogInlineCompletionSessionResults(
        ...args: Parameters<Parameters<Lsp['extensions']['onLogInlineCompletionSessionResults']>[0]>
    ) {
        return this.lsp.extensions.onLogInlineCompletionSessionResults.args[0]?.[0](...args)
    }

    openDocument(document: TextDocument) {
        this.events.push({
            type: 'textDocument/didOpen',
            notification: {
                textDocument: {
                    languageId: document.languageId,
                    text: document.getText(),
                    uri: document.uri,
                    version: document.version,
                },
            } as DidOpenTextDocumentParams,
        })
        this.documents[document.uri] = document
        return this
    }

    async doChangeConfiguration() {
        // Force the call to handle after the current task completes
        await undefined
        this.events.push({
            type: 'workspace/didChangeConfiguration',
            notification: {
                settings: undefined,
            } as DidChangeConfigurationParams,
        })
        this.lsp.didChangeConfiguration.args[0]?.[0]({ settings: undefined })
        return this
    }

    async doChangeTextDocument(params: DidChangeTextDocumentParams) {
        // Force the call to handle after the current task completes
        await undefined
        this.lsp.onDidChangeTextDocument.args[0]?.[0](params)
        return this
    }

    async doExecuteCommand(params: ExecuteCommandParams, token: CancellationToken) {
        return this.lsp.onExecuteCommand.args[0]?.[0](params, token)
    }

    async simulateTyping(uri: string, text: string) {
        let remainder = text

        while (remainder.length > 0) {
            const document = this.documents[uri]!
            const contentChange = remainder.substring(0, 1)
            remainder = remainder.substring(1)
            const newDocument = TextDocument.create(
                document.uri,
                document.languageId,
                document.version + 1,
                document.getText() + contentChange
            )
            this.documents[uri] = newDocument

            const endPosition = document.positionAt(document.getText().length)
            const range = {
                start: endPosition,
                end: endPosition,
            }

            // Force the call to handle after the current task completes
            await undefined
            this.lsp.onDidChangeTextDocument.args[0]?.[0]({
                textDocument: {
                    uri,
                    version: document.version,
                },
                contentChanges: [
                    {
                        range,
                        text: contentChange,
                    },
                ],
            })
        }

        return this
    }

    dispose() {
        this.disposables.forEach(d => d())
    }
}
