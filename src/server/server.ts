import {
    CompletionItem,
    CompletionList,
    createConnection,
    DidChangeConfigurationNotification,
    Hover,
    HoverParams,
    InitializeParams,
    InitializeResult,
    ProposedFeatures,
    TextDocumentPositionParams,
    TextDocuments,
    TextDocumentSyncKind,
} from 'vscode-languageserver/node'

import { TextDocument } from 'vscode-languageserver-textdocument'
import { BuildspecServiceStrategy } from '../service/filetypes/buildspec/strategy'
import { LanguageServiceRegistry } from '../service/registry/registry'
import { LanguageServerCacheDir } from '../utils/configurationDirectory'

// Create a connection for the server, using Node's IPC as a transport.
// Also include all preview / proposed LSP features.
const connection = createConnection(ProposedFeatures.all)

// Create a simple text document manager.
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument)

const fileRegistry = new LanguageServiceRegistry()
fileRegistry.addStrategy(new BuildspecServiceStrategy())

// Setup the local directory that will hold extension
// related resources.
LanguageServerCacheDir.setup()

let hasConfigurationCapability = false
let hasWorkspaceFolderCapability = false
let hasDiagnosticRelatedInformationCapability = false

connection.onInitialize((params: InitializeParams) => {
    const capabilities = params.capabilities

    // Does the client support the `workspace/configuration` request?
    // If not, we fall back using global settings.
    hasConfigurationCapability = !!(capabilities.workspace && !!capabilities.workspace.configuration)
    hasWorkspaceFolderCapability = !!(capabilities.workspace && !!capabilities.workspace.workspaceFolders)
    hasDiagnosticRelatedInformationCapability = !!(
        capabilities.textDocument &&
        capabilities.textDocument.publishDiagnostics &&
        capabilities.textDocument.publishDiagnostics.relatedInformation
    )

    const result: InitializeResult = {
        capabilities: {
            textDocumentSync: TextDocumentSyncKind.Full,
            // Tell the client that this server supports code completion.
            completionProvider: {
                resolveProvider: false,
            },
            hoverProvider: true,
        },
    }
    if (hasWorkspaceFolderCapability) {
        result.capabilities.workspace = {
            workspaceFolders: {
                supported: true,
            },
        }
    }
    return result
})

connection.onInitialized(() => {
    if (hasConfigurationCapability) {
        // Register for all configuration changes.
        connection.client.register(DidChangeConfigurationNotification.type, undefined)
    }
    if (hasWorkspaceFolderCapability) {
        connection.workspace.onDidChangeWorkspaceFolders(_event => {
            connection.console.log('Workspace folder change event received.')
        })
    }
})

connection.onDidChangeConfiguration(change => {
    // Revalidate all open text documents
    documents.all().forEach(td => validateTextDocument(td.uri))
})

// Only keep settings for open documents
// eslint-disable-next-line @typescript-eslint/no-empty-function
documents.onDidClose(e => {})

// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent(change => {
    const textDoc = documents.get(change.document.uri)
    if (textDoc === undefined) {
        return
    }
    const service = fileRegistry.getLanguageService(textDoc)
    if (service === undefined) {
        return
    }
    validateTextDocument(textDoc.uri)
})

async function validateTextDocument(textDocumentUri: TextDocument['uri']): Promise<void> {
    const textDoc = documents.get(textDocumentUri)
    if (textDoc === undefined) {
        return
    }
    const service = await fileRegistry.getLanguageService(textDoc)
    if (service === undefined) {
        return
    }
    const diagnostics = await service.diagnostic(textDoc)
    connection.sendDiagnostics({ uri: textDocumentUri, diagnostics })
}

connection.onDidChangeWatchedFiles(_change => {
    connection.console.log('We received an file change event')
})

connection.onCompletion(
    async (textDocumentPosition: TextDocumentPositionParams): Promise<CompletionItem[] | CompletionList> => {
        const textDoc = documents.get(textDocumentPosition.textDocument.uri)
        if (textDoc === undefined) {
            return []
        }
        const service = await fileRegistry.getLanguageService(textDoc)
        if (service === undefined) {
            return []
        }
        return service.completion(textDoc, textDocumentPosition)
    }
)

connection.onHover(async (params: HoverParams): Promise<Hover | null | undefined> => {
    const textDoc = documents.get(params.textDocument.uri)
    if (textDoc === undefined) {
        return undefined
    }
    const service = await fileRegistry.getLanguageService(textDoc)
    if (service === undefined) {
        return undefined
    }
    return service.hover(textDoc, params)
})

connection.onShutdown(async () => {
    return undefined
})

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection)

// Listen on the connection
connection.listen()

connection.console.info('AWS Documents LS started!')
